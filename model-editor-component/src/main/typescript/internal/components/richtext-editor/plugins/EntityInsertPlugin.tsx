/*
 * SPDX-License-Identifier: EUPL-1.2 OR LicenseRef-commercial
 *
 * Copyright (c) 2012-2026 mgm technology partners GmbH
 *
 * Dual License
 * ------------
 * This source file is part of the mgm A12 Platform and available under
 * a choice of two different licenses:
 *
 * 1. Open-Source License - EUPL v1.2
 *    You may redistribute and/or modify this file under the terms of the
 *    European Union Public License, version 1.2 - see https://eupl.eu/.
 *
 * 2. Commercial License
 *    Alternatively, you may obtain a commercial license from
 *    mgm technology partners GmbH, that permits use of this software
 *    under different terms (including support and maintenance services).
 *
 *    Please contact a12-license@mgm-tp.com for more information.
 *
 * You must select and comply with exactly one of the above license options.
 *
 * Warranty Disclaimer (applies to either option)
 * ----------------------------------------------
 * THIS SOFTWARE IS PROVIDED "AS IS" AND WITHOUT WARRANTY OF ANY KIND,
 * WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NON-INFRINGEMENT, EXCEPT WHERE SUCH DISCLAIMERS ARE HELD TO BE
 * LEGALLY INVALID. SEE THE RESPECTIVE LICENSE TEXT FOR DETAILS.
 */
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { LexicalNode } from "lexical";
import {
	$getRoot,
	$getSelection,
	$isElementNode,
	$isRangeSelection,
	COMMAND_PRIORITY_LOW,
	PASTE_COMMAND,
} from "lexical";
import { useCallback, useEffect, useRef } from "react";

import type {
	PartialAnyPrintModelElement,
	PartialReference,
	PrintModelElement,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { clonePrintModelEntity } from "@com.mgmtp.a12.print/print-model-api/utils";

import type { PrintEntityNode } from "../nodes/print-entity-node.js";
import { $createPrintEntityNode, $isPrintEntityNode, isEntityType } from "../nodes/print-entity-node.js";
import { $extractHtmlAndEntities, extractHtmlAndEntities } from "../utils/html-export.js";
import { createEntityElement, getEntityDisplayText } from "../utils/entity-utils.js";

export interface EntityInsertPluginProps {
	insertEntityType?: string;
	existingEntities?: ReadonlyArray<PartialReference>;
	entityDefinitions?: ReadonlyArray<PartialAnyPrintModelElement>;
	onEntityCreated: (
		entities: PrintModelElement[],
		html: string,
		updatedEntities: ReadonlyArray<PartialReference>
	) => void;
}

function $collectAllEntityNodes(): PrintEntityNode[] {
	const entityNodes: PrintEntityNode[] = [];
	const root = $getRoot();

	function traverse(node: LexicalNode): void {
		if ($isPrintEntityNode(node)) {
			entityNodes.push(node);
		}
		if ($isElementNode(node)) {
			for (const child of node.getChildren()) {
				traverse(child);
			}
		}
	}

	for (const child of root.getChildren()) {
		traverse(child);
	}

	return entityNodes;
}

function groupEntityNodesByEntityId(nodes: PrintEntityNode[]): Map<string, PrintEntityNode[]> {
	const groups = new Map<string, PrintEntityNode[]>();

	for (const node of nodes) {
		const entityId = node.getEntityId();
		const existing = groups.get(entityId) || [];
		existing.push(node);
		groups.set(entityId, existing);
	}

	return groups;
}

export const EntityInsertPlugin: React.FC<EntityInsertPluginProps> = ({
	insertEntityType,
	existingEntities,
	entityDefinitions,
	onEntityCreated,
}) => {
	const [editor] = useLexicalComposerContext();
	const pendingEntityRef = useRef<PrintModelElement | null>(null);

	// Handle toolbar entity insert
	useEffect(() => {
		if (!insertEntityType || !isEntityType(insertEntityType)) return;

		const newEntityElement = createEntityElement(insertEntityType);
		const displayText = getEntityDisplayText(newEntityElement);
		pendingEntityRef.current = newEntityElement;

		editor.update(
			() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) return;

				const node = $createPrintEntityNode({
					entityId: newEntityElement.id,
					entityType: insertEntityType,
					displayText,
				});
				selection.insertNodes([node]);
			},
			{
				onUpdate: () => {
					if (pendingEntityRef.current) {
						const entity = pendingEntityRef.current;
						const { html, entities } = extractHtmlAndEntities(editor, existingEntities);
						onEntityCreated([entity], html, entities);
						pendingEntityRef.current = null;
					}
				},
			}
		);
	}, [editor, insertEntityType, existingEntities, onEntityCreated]);

	const updateCopiedEntries = useCallback(() => {
		editor.update(() => {
			const entityNodes = $collectAllEntityNodes();
			const groupedByEntityId = groupEntityNodesByEntityId(entityNodes);
			const newEntities: PrintModelElement[] = [];

			// Find duplicates: entityIds that appear more than once
			for (const [entityId, nodes] of groupedByEntityId.entries()) {
				// First occurrence keeps the original ID, subsequent ones get new IDs
				for (let i = 1; i < nodes.length; i++) {
					const node = nodes[i];
					const entityType = node.getEntityType();

					const originalEntity = entityDefinitions?.find(e => e.id === entityId);
					const newEntity: PrintModelElement = originalEntity
						? clonePrintModelEntity(originalEntity)
						: createEntityElement(entityType);

					node.setEntityId(newEntity.id);
					node.setTextContent(getEntityDisplayText(newEntity));

					newEntities.push(newEntity);
				}
			}

			// If new entities created, notify the parent
			if (newEntities.length > 0) {
				const { html, entities } = $extractHtmlAndEntities(editor, existingEntities);
				onEntityCreated(newEntities, html, entities);
			}
		});
	}, [editor, entityDefinitions, existingEntities, onEntityCreated]);

	// Handle paste - detect and handle duplicate entities
	useEffect(() => {
		const removeListener = editor.registerCommand(
			PASTE_COMMAND,
			() => {
				// Let the paste happen first, then process duplicated copies
				setTimeout(() => {
					updateCopiedEntries();
				}, 0);

				return false;
			},
			COMMAND_PRIORITY_LOW
		);

		return () => {
			removeListener();
		};
	}, [editor, updateCopiedEntries]);

	return null;
};

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
import * as React from "react";
import { useSelector } from "react-redux";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { LexicalEditor, LexicalNode } from "lexical";
import { $getRoot, $isElementNode } from "lexical";

import { ValidationSelectors } from "../../../redux/validation/selectors.js";
import { useErrorTitleElement } from "../../../hooks/use-error-title-element.js";
import { BadgeGroup } from "../../badge/BadgeGroup.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";

import { $isPrintEntityNode } from "../nodes/print-entity-node.js";

const BADGE_OFFSET = { top: -8, right: 0 };

interface EntityBadgeProps {
	entityId: string;
	position: { top: number; left: number };
}

const EntityBadge: React.FC<EntityBadgeProps> = ({ entityId, position }) => {
	const validationCounter = useSelector((state: PrintEngineState) =>
		ValidationSelectors.elementValidationCounterById(state, entityId)
	);
	const errorTitle = useErrorTitleElement("error", validationCounter);
	const warningTitle = useErrorTitleElement("warning", validationCounter);

	const showBadge = validationCounter.error + validationCounter.warning > 0;

	if (!showBadge) {
		return null;
	}

	return (
		<div
			style={{ position: "absolute", top: position.top, left: position.left, zIndex: 10, pointerEvents: "auto" }}
		>
			<BadgeGroup
				validationCounter={validationCounter}
				errorTitle={errorTitle}
				warningTitle={warningTitle}
				standalone
			/>
		</div>
	);
};

interface EntityWithPosition {
	entityId: string;
	nodeKey: string;
	position: { top: number; left: number };
}

function calculatePositions(editor: LexicalEditor): EntityWithPosition[] {
	const rootElement = editor.getRootElement();
	if (!rootElement) return [];

	const editorRect = rootElement.getBoundingClientRect();
	const result: EntityWithPosition[] = [];

	editor.getEditorState().read(() => {
		const traverse = (node: LexicalNode) => {
			if ($isPrintEntityNode(node)) {
				const domElement = editor.getElementByKey(node.getKey());
				if (domElement) {
					const entityRect = domElement.getBoundingClientRect();
					result.push({
						entityId: node.getEntityId(),
						nodeKey: node.getKey(),
						position: {
							top: entityRect.top - editorRect.top + BADGE_OFFSET.top,
							left: entityRect.right - editorRect.left + BADGE_OFFSET.right,
						},
					});
				}
			}
			if ($isElementNode(node)) {
				node.getChildren().forEach(traverse);
			}
		};
		$getRoot().getChildren().forEach(traverse);
	});

	return result;
}

export const EntityValidationBadgePlugin: React.FC = () => {
	const [editor] = useLexicalComposerContext();
	const [entities, setEntities] = React.useState<EntityWithPosition[]>([]);

	React.useEffect(() => {
		const rootElement = editor.getRootElement();
		if (!rootElement) return;

		const updatePositions = () => {
			setEntities(calculatePositions(editor));
		};

		// ResizeObserver fires when editor gets its final size (handles initial layout)
		const resizeObserver = new ResizeObserver(updatePositions);
		resizeObserver.observe(rootElement);

		// Listen for Lexical state changes
		const unregisterUpdate = editor.registerUpdateListener(updatePositions);

		return () => {
			resizeObserver.disconnect();
			unregisterUpdate();
		};
	}, [editor]);

	if (entities.length === 0) {
		return null;
	}

	return (
		<div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
			{entities.map(({ entityId, nodeKey, position }) => (
				<EntityBadge key={nodeKey} entityId={entityId} position={position} />
			))}
		</div>
	);
};

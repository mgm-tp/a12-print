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
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { LexicalNode } from "lexical";
import { $getRoot, $setSelection, ElementNode } from "lexical";

import type { PartialAnyPrintModelElement } from "@com.mgmtp.a12.print/print-model-api/model";

import type { PrintEntityNode } from "../nodes/print-entity-node.js";
import { $isFieldNode, $isCalculationNode } from "../nodes/print-entity-node.js";
import { getEntityDisplayText } from "../utils/entity-utils.js";

function collectPrintEntityNodes(node: LexicalNode, result: PrintEntityNode[]): void {
	if ($isFieldNode(node) || $isCalculationNode(node)) {
		result.push(node);
	} else if (node instanceof ElementNode) {
		const children = node.getChildren();
		for (const child of children) {
			collectPrintEntityNodes(child, result);
		}
	}
}

export interface EntityLabelUpdatePluginProps {
	editElement: PartialAnyPrintModelElement | undefined;
}

export const EntityLabelUpdatePlugin: React.FC<EntityLabelUpdatePluginProps> = ({ editElement }) => {
	const [editor] = useLexicalComposerContext();

	React.useEffect(() => {
		if (!editElement) {
			return;
		}

		const displayedText = getEntityDisplayText(editElement);
		editor.update(
			() => {
				const root = $getRoot();
				const allPrintEntityNodes: PrintEntityNode[] = [];
				collectPrintEntityNodes(root, allPrintEntityNodes);

				const targetNode = allPrintEntityNodes.find(node => {
					const entityId = node.getEntityId();
					return entityId === editElement.id;
				});

				if (targetNode) {
					const oldText = targetNode.getTextContent();
					if (oldText !== displayedText) {
						$setSelection(null);
						targetNode.setTextContent(displayedText);
					}
				}
			},
			{ discrete: true }
		);
	}, [editor, editElement]);

	return null;
};

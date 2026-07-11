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
import { NodeEventPlugin } from "@lexical/react/LexicalNodeEventPlugin";
import type { LexicalEditor } from "lexical";
import { $getNodeByKey, $setSelection } from "lexical";

import { $isFieldNode, $isCalculationNode, PrintEntityNode, $isPrintEntityNode } from "../nodes/print-entity-node.js";

interface EntityClickHandlerProps {
	onEntityClick: (entityId: string, nodeKey: string) => void;
}

export const EntityClickHandlerPlugin: React.FC<EntityClickHandlerProps> = ({ onEntityClick }) => {
	const handleFieldDoubleClick = (event: Event, editor: LexicalEditor, nodeKey: string) => {
		editor.getEditorState().read(() => {
			const node = $getNodeByKey(nodeKey);
			if ($isFieldNode(node) || $isCalculationNode(node)) {
				onEntityClick(node.getEntityId(), node.getKey());
			}
		});
	};

	const handleFieldClick = (event: Event, editor: LexicalEditor, nodeKey: string) => {
		editor.update(() => {
			const node = $getNodeByKey(nodeKey);
			if ($isPrintEntityNode(node)) {
				const selection = node.select(0);
				$setSelection(selection);
			}
		});
	};

	return (
		<>
			<NodeEventPlugin nodeType={PrintEntityNode} eventType="dblclick" eventListener={handleFieldDoubleClick} />
			<NodeEventPlugin nodeType={PrintEntityNode} eventType="click" eventListener={handleFieldClick} />
		</>
	);
};

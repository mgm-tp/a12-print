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
import type {
	DOMConversionMap,
	DOMConversionOutput,
	EditorConfig,
	LexicalEditor,
	SerializedParagraphNode,
} from "lexical";
import { $applyNodeReplacement, ParagraphNode } from "lexical";

export class PrintParagraphNode extends ParagraphNode {
	static getType(): string {
		return "print-paragraph";
	}

	static clone(node: PrintParagraphNode) {
		return new PrintParagraphNode(node.__key);
	}

	createDOM(config: EditorConfig): HTMLElement {
		const element = super.createDOM(config);
		element.style.marginTop = "0";
		element.style.marginBottom = "0";
		return element;
	}

	exportDOM(_editor: LexicalEditor): { element: HTMLParagraphElement } {
		const element = document.createElement("p");

		const isEmpty =
			this.getChildrenSize() === 0 || this.getChildren().every(child => child.getTextContent() === "");

		if (isEmpty) {
			const br = document.createElement("br");
			element.appendChild(br);
		}

		return { element };
	}

	static importDOM(): DOMConversionMap | null {
		return {
			p: () => ({
				conversion: (): DOMConversionOutput => ({ node: $createPrintParagraphNode() }),
				priority: 0,
			}),
		};
	}

	static importJSON(serializedNode: SerializedParagraphNode): ParagraphNode {
		return ParagraphNode.importJSON(serializedNode);
	}
}

export function $createPrintParagraphNode(): PrintParagraphNode {
	return $applyNodeReplacement(new PrintParagraphNode());
}

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
	DOMExportOutput,
	LexicalEditor,
	LexicalNode,
	NodeKey,
	Spread,
} from "lexical";
import { $applyNodeReplacement } from "lexical";

import { InlineStyleTextNode, type SerializedInlineStyleTextNode } from "@com.mgmtp.a12.widgets/widgets-core";

import { STYLE_PROPERTIES } from "../constants.js";

export type SerializedPrintTextNode = Spread<
	{
		textColor?: string;
		bgColor?: string;
		type: "print-text";
		version: 1;
	},
	SerializedInlineStyleTextNode
>;

function rgbToHex(rgb: string): string {
	if (rgb.startsWith("#")) {
		return rgb.toLowerCase();
	}
	const rgbPattern = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)$/i;
	const match = rgbPattern.exec(rgb);
	if (match) {
		return (
			"#" +
			match
				.slice(1, 4)
				.map(n => Number.parseInt(n, 10).toString(16).padStart(2, "0"))
				.join("")
				.toLowerCase()
		);
	}
	return rgb.toLowerCase();
}

function findAllBrNodes(node: Node): Node[] {
	const brNodes: Node[] = [];

	function traverse(n: Node): void {
		if (n.nodeName === "BR") {
			brNodes.push(n);
		} else {
			for (const child of Array.from(n.childNodes)) {
				traverse(child);
			}
		}
	}

	for (const child of Array.from(node.childNodes)) {
		traverse(child);
	}

	return brNodes;
}

function convertPrintTextElement(domNode: HTMLElement): DOMConversionOutput | null {
	const textContent = domNode.textContent;

	if (textContent === null) {
		return null;
	}

	const brNodes = findAllBrNodes(domNode);
	const hasBr = brNodes.length > 0;

	if (hasBr) {
		return null;
	}

	const node = $createPrintTextNode(textContent, []);
	node.applyStyleAndFormatFromDom(domNode);

	return {
		node,
	};
}

export class PrintTextNode extends InlineStyleTextNode {
	static getType(): string {
		return "print-text";
	}

	static clone(node: PrintTextNode): PrintTextNode {
		const cloned = new PrintTextNode(node.__text, node.__selectedClassName, node.__key);
		cloned.__unmergeable = node.__unmergeable;
		return cloned;
	}

	constructor(text: string, selectedStyleName?: string[], key?: NodeKey) {
		super(text, selectedStyleName, false, key);
	}

	isSimpleText(): boolean {
		return !this.__style && super.isSimpleText();
	}

	applyStyleAndFormatFromDom(domNode: HTMLElement): void {
		const styleAttr = domNode.getAttribute("style");

		const { textColor, bgColor }: { textColor: string | undefined; bgColor: string | undefined } =
			getColorProperties(styleAttr);

		if (textColor && bgColor) {
			this.setStyle(`${STYLE_PROPERTIES.COLOR}: ${textColor}; ${STYLE_PROPERTIES.BACKGROUND_COLOR}: ${bgColor}`);
		} else if (textColor) {
			this.setStyle(`${STYLE_PROPERTIES.COLOR}: ${textColor}`);
		} else if (bgColor) {
			this.setStyle(`${STYLE_PROPERTIES.BACKGROUND_COLOR}: ${bgColor}`);
		}

		const hasStrong = domNode.querySelector("strong") || domNode.querySelector("b");
		const hasEm = domNode.querySelector("em") || domNode.querySelector("i");
		const hasU = domNode.querySelector("u");

		if (hasStrong) {
			this.toggleFormat("bold");
		}
		if (hasEm) {
			this.toggleFormat("italic");
		}
		if (hasU) {
			this.toggleFormat("underline");
		}
	}

	static importDOM(): DOMConversionMap | null {
		return {
			span: (domNode: HTMLElement) => {
				const hasEntity = "entityId" in domNode.dataset;
				if (hasEntity) {
					return null;
				}

				return {
					conversion: convertPrintTextElement,
					priority: 0,
				};
			},
		};
	}

	exportDOM(_editor: LexicalEditor): DOMExportOutput {
		const span = document.createElement("span");

		span.setAttribute("style", this.__style || "");

		let content: HTMLElement | Text = document.createTextNode(this.__text);

		if (this.hasFormat("bold")) {
			const strong = document.createElement("strong");
			strong.appendChild(content);
			content = strong;
		}

		if (this.hasFormat("italic")) {
			const em = document.createElement("em");
			em.appendChild(content);
			content = em;
		}

		if (this.hasFormat("underline")) {
			const u = document.createElement("u");
			u.appendChild(content);
			content = u;
		}

		span.appendChild(content);

		return {
			element: span,
		};
	}

	static importJSON(serializedNode: SerializedPrintTextNode): PrintTextNode {
		const node = $createPrintTextNode(serializedNode.text, serializedNode.selectedClassName || []);
		node.setFormat(serializedNode.format);
		node.setDetail(serializedNode.detail);
		node.setMode(serializedNode.mode);
		node.setStyle(serializedNode.style);
		node.setSelectedStyleName(serializedNode.selectedClassName || []);

		if (serializedNode.unmergeable) {
			node.setUnmergeable();
		}

		return node;
	}

	exportJSON(): SerializedPrintTextNode {
		return {
			...super.exportJSON(),
			type: "print-text",
			version: 1,
		};
	}
}

export function getColorProperties(styleAttr: string | null) {
	let textColor: string | undefined;
	let bgColor: string | undefined;

	if (styleAttr?.trim()) {
		const colorPattern = /(?:^|;\s*)color\s*:\s*(#[0-9a-f]{6}|rgb[^\s;]+)/i;
		const colorMatch = colorPattern.exec(styleAttr);
		if (colorMatch) {
			textColor = rgbToHex(colorMatch[1]);
		}

		const bgPattern = /background(?:-color)?\s*:\s*(#[0-9a-f]{6}|rgb[^\s;]+)/i;
		const bgMatch = bgPattern.exec(styleAttr);
		if (bgMatch) {
			bgColor = rgbToHex(bgMatch[1]);
		}
	}
	return { textColor, bgColor };
}

export function $createPrintTextNode(text: string, classes?: string[]): PrintTextNode {
	return $applyNodeReplacement(new PrintTextNode(text, classes));
}

export function $isPrintTextNode(node: LexicalNode | null | undefined): node is PrintTextNode {
	return node instanceof PrintTextNode;
}

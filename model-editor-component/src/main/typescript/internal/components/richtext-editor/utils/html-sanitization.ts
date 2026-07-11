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
import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";

import { DOM_ATTRIBUTES } from "../constants.js";

/**
 * Wraps direct text nodes inside <p> elements with <span style="">.
 * Example: <p>Hello</p> → <p><span style="">Hello</span></p>
 */
function wrapBareTextNodesInSpans(doc: Document): void {
	const paragraphs = doc.querySelectorAll("p");
	for (const p of paragraphs) {
		const childNodes = Array.from(p.childNodes);
		for (const child of childNodes) {
			if (child.nodeType === Node.TEXT_NODE && child.textContent) {
				const span = doc.createElement("span");
				span.setAttribute("style", "");
				span.textContent = child.textContent;
				child.replaceWith(span);
			}
		}
	}
}

/**
 * Wraps content of entity spans (with entity-type attribute) in an inner <span style="">.
 * Example: <span entity-type="Field">Text</span> → <span entity-type="Field"><span style="">Text</span></span>
 */
function wrapEntitySpanContents(doc: Document): void {
	const entitySpans = doc.querySelectorAll(`span[${DOM_ATTRIBUTES.ENTITY_TYPE}]`);
	for (const entitySpan of entitySpans) {
		const hasInnerSpan = entitySpan.querySelector("span") !== null;
		if (!hasInnerSpan && entitySpan.textContent) {
			const innerSpan = doc.createElement("span");
			innerSpan.setAttribute("style", "");
			while (entitySpan.firstChild) {
				innerSpan.appendChild(entitySpan.firstChild);
			}
			entitySpan.appendChild(innerSpan);
		}
	}
}

/**
 * Splits <span> elements at <br> tags, preserving formatting.
 * Example: <span style="">Hello<br>World</span> → <span style="">Hello</span><br><span style="">World</span>
 */
function splitSpansAtBreakTags(doc: Document): void {
	interface ContentPart {
		type: "text" | "br";
		text?: string;
		formatting?: string[];
	}

	const collectParts = (node: Node, formatting: string[], parts: ContentPart[]): void => {
		if (node.nodeType === Node.TEXT_NODE) {
			const text = node.textContent || "";
			if (text) {
				parts.push({ type: "text", text, formatting: [...formatting] });
			}
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			const el = node as Element;
			if (el.tagName === "BR") {
				parts.push({ type: "br" });
			} else if (["STRONG", "EM", "U", "B", "I"].includes(el.tagName)) {
				const newFormatting = [...formatting, el.tagName.toLowerCase()];
				for (const child of Array.from(el.childNodes)) {
					collectParts(child, newFormatting, parts);
				}
			} else {
				for (const child of Array.from(el.childNodes)) {
					collectParts(child, formatting, parts);
				}
			}
		}
	};

	const processSpan = (span: Element): void => {
		if (span.hasAttribute(DOM_ATTRIBUTES.ENTITY_TYPE) || span.hasAttribute(DOM_ATTRIBUTES.ENTITY_ID)) {
			return;
		}

		const brTags = Array.from(span.querySelectorAll("br"));
		if (brTags.length === 0) return;

		const parent = span.parentNode;
		if (!parent) return;

		const styleAttr = span.getAttribute("style") || "";
		const parts: ContentPart[] = [];
		collectParts(span, [], parts);

		const brIndices = parts.map((p, i) => (p.type === "br" ? i : -1)).filter(i => i >= 0);
		if (brIndices.length === 0) return;

		const newNodes: Node[] = [];
		let currentTextParts: ContentPart[] = [];

		const flushCurrentText = (): void => {
			if (currentTextParts.length === 0) return;

			const newSpan = doc.createElement("span");
			newSpan.setAttribute("style", styleAttr);

			for (const part of currentTextParts) {
				if (part.type === "text" && part.text) {
					let content: Node = doc.createTextNode(part.text);
					if (part.formatting) {
						for (const tag of [...part.formatting].reverse()) {
							const wrapper = doc.createElement(tag);
							wrapper.appendChild(content);
							content = wrapper;
						}
					}
					newSpan.appendChild(content);
				}
			}

			if (newSpan.textContent) {
				newNodes.push(newSpan);
			}
			currentTextParts = [];
		};

		for (const part of parts) {
			if (part.type === "br") {
				flushCurrentText();
				newNodes.push(doc.createElement("br"));
			} else {
				currentTextParts.push(part);
			}
		}
		flushCurrentText();

		for (const node of newNodes) {
			span.before(node);
		}
		span.remove();
	};

	const spans = Array.from(doc.querySelectorAll("span"));
	for (const span of spans) {
		processSpan(span);
	}
}

/**
 * Removes font-size declarations from all style attributes.
 * Example: style="font-size: 12pt; color: red" → style="color: red"
 */
function removeFontSizeFromStyles(doc: Document): void {
	const elementsWithStyle = doc.querySelectorAll("[style]");
	for (const el of elementsWithStyle) {
		const style = el.getAttribute("style") || "";
		const newStyle = style
			.split(";")
			.map(s => s.trim())
			.filter(s => !s.toLowerCase().startsWith("font-size"))
			.join("; ")
			.replace(/;\s*$/, "")
			.replace(/^;\s*/, "");
		el.setAttribute("style", newStyle);
	}
}

/**
 * Adds empty style="" attribute to spans that don't have one (excluding entity spans).
 * Example: <span>Text</span> → <span style="">Text</span>
 */
function addEmptyStyleToSpans(doc: Document): void {
	const spansWithoutStyle = doc.querySelectorAll(`span:not([style]):not([${DOM_ATTRIBUTES.ENTITY_TYPE}])`);
	for (const span of spansWithoutStyle) {
		span.setAttribute("style", "");
	}
}

/**
 * Removes empty formatting tags (strong, em, u, b, i, span) that have no text content.
 * Runs iteratively until no more empty elements are found.
 */
function removeEmptyFormattingTags(doc: Document): void {
	let removed = true;
	while (removed) {
		removed = false;
		const elements = doc.querySelectorAll("strong, em, u, b, i, span");
		for (const el of elements) {
			if ((!el.textContent || el.textContent === "\n") && !el.querySelector("br")) {
				el.remove();
				removed = true;
			}
		}
	}
}

/**
 * Removes anchor (<a>) tags but preserves their content.
 * Example: <a href="..."><span>Text</span></a> → <span>Text</span>
 */
function removeAnchorTags(doc: Document): void {
	const anchors = doc.querySelectorAll("a");
	for (const anchor of anchors) {
		const parent = anchor.parentNode;
		if (!parent) continue;
		while (anchor.firstChild) {
			parent.insertBefore(anchor.firstChild, anchor);
		}
		anchor.remove();
	}
}

/**
 * Removes <code> tags but preserves their content (DOM-based).
 * Example: <span><code>Text</code></span> → <span>Text</span>
 */
function removeCodeTagsFromDom(doc: Document): void {
	const codeTags = doc.querySelectorAll("code");
	for (const code of codeTags) {
		const parent = code.parentNode;
		if (!parent) continue;
		while (code.firstChild) {
			parent.insertBefore(code.firstChild, code);
		}
		code.remove();
	}
}

const FORMATTING_TAGS = new Set(["STRONG", "EM", "U", "B", "I"]);

function isEntitySpan(el: Element): boolean {
	return el.hasAttribute(DOM_ATTRIBUTES.ENTITY_TYPE) || el.hasAttribute(DOM_ATTRIBUTES.ENTITY_ID);
}

function getFormattingStructure(el: Element): string {
	const tags: string[] = [];
	let node: Element | null = el;
	while (node?.children.length === 1) {
		const child: Element = node.children[0];
		if (FORMATTING_TAGS.has(child.tagName)) {
			tags.push(child.tagName);
			node = child;
		} else {
			break;
		}
	}
	return tags.join(",");
}

function getInnermostElement(el: Element): Element {
	let node: Element = el;
	while (node.children.length === 1 && FORMATTING_TAGS.has(node.children[0].tagName)) {
		node = node.children[0];
	}
	return node;
}

function canMergeSpans(currentEl: Element, nextEl: Element): boolean {
	if (currentEl.tagName !== "SPAN" || nextEl.tagName !== "SPAN") return false;
	if (isEntitySpan(currentEl) || isEntitySpan(nextEl)) return false;

	const currentStyle = currentEl.getAttribute("style") || "";
	const nextStyle = nextEl.getAttribute("style") || "";
	if (currentStyle !== nextStyle) return false;

	return getFormattingStructure(currentEl) === getFormattingStructure(nextEl);
}

function tryMergeAdjacentPair(children: Node[]): boolean {
	for (let i = 0; i < children.length - 1; i++) {
		const current = children[i];
		const next = children[i + 1];

		if (current.nodeType !== Node.ELEMENT_NODE || next.nodeType !== Node.ELEMENT_NODE) continue;

		const currentEl = current as Element;
		const nextEl = next as Element;

		if (!canMergeSpans(currentEl, nextEl)) continue;

		const currentInner = getInnermostElement(currentEl);
		const nextInner = getInnermostElement(nextEl);
		currentInner.textContent = (currentInner.textContent || "") + (nextInner.textContent || "");
		nextEl.remove();
		return true;
	}
	return false;
}

/**
 * Merges adjacent spans that have identical formatting (same style and formatting tags).
 * Example: <span style=""><strong>A</strong></span><span style=""><strong>B</strong></span>
 *        → <span style=""><strong>AB</strong></span>
 */
export function mergeAdjacentSpansWithSameFormatting(doc: Document): void {
	const paragraphs = doc.querySelectorAll("p");
	for (const p of paragraphs) {
		let changed = true;
		while (changed) {
			changed = tryMergeAdjacentPair(Array.from(p.childNodes));
		}
	}
}

/**
 * Removes whitespace between closing and opening paragraph tags.
 * Example: "</p> <p>" → "</p><p>"
 */
function removeSpacesBetweenParagraphs(html: string): string {
	return html.replaceAll("p> <p", "p><p");
}

/**
 * Removes all newline characters from the HTML string.
 */
function removeNewlines(html: string): string {
	return html.replaceAll("\n", "");
}

/**
 * Removes trailing newlines (not spaces) before closing </span> tags.
 * Example: "text \n</span>" → "text </span>"
 */
function removeTrailingNewlinesInSpans(html: string): string {
	return html.replaceAll("\n</span>", "</span>");
}

/**
 * Normalizes entity-type attribute values to exact ElementType casing.
 * Example: entity-type="field" → entity-type="Field"
 */
function normalizeEntityTypes(html: string): string {
	const entityTypeMap: Record<string, ElementType> = {
		field: ElementType.Field,
		calculation: ElementType.Calculation,
		computation: ElementType.Calculation,
		pagenumber: ElementType.PageNumber,
		pagenumbertotal: ElementType.PageNumberTotal,
	};
	const attrPattern = new RegExp(`${DOM_ATTRIBUTES.ENTITY_TYPE}="([^"]+)"`, "g");
	return html.replaceAll(attrPattern, (_, type: string) => {
		const normalized = entityTypeMap[type.toLowerCase()] || type;
		return `${DOM_ATTRIBUTES.ENTITY_TYPE}="${normalized}"`;
	});
}

/**
 * Transforms expected HTML to match the editor's output format.
 * Each transformation is handled by a dedicated helper function.
 */
export function sanitizeExpectedResult(html: string): string {
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, "text/html");

	// DOM transformations
	wrapBareTextNodesInSpans(doc);
	wrapEntitySpanContents(doc);
	splitSpansAtBreakTags(doc);
	removeFontSizeFromStyles(doc);
	addEmptyStyleToSpans(doc);
	removeEmptyFormattingTags(doc);
	removeAnchorTags(doc);
	removeCodeTagsFromDom(doc);
	mergeAdjacentSpansWithSameFormatting(doc);

	// String transformations
	let result = doc.body.innerHTML;
	result = removeSpacesBetweenParagraphs(result);
	result = removeNewlines(result);
	result = removeTrailingNewlinesInSpans(result);
	result = normalizeEntityTypes(result);

	return result;
}

/**
 * Final normalization applied to both expected and actual output for comparison.
 * Removes any remaining trailing newlines that the editor might add.
 */
export function normalizeForComparison(html: string): string {
	return html.replaceAll("\n</span>", "</span>").replaceAll("\n</p>", "</p>");
}

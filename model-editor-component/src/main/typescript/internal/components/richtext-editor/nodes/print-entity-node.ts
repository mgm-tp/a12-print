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
	EditorConfig,
	LexicalEditor,
	LexicalNode,
	NodeKey,
	Spread,
} from "lexical";
import { $applyNodeReplacement } from "lexical";

import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";

import { EDITOR_THEME_CLASSES } from "../themes/editor-theme.js";
import { DOM_ATTRIBUTES } from "../constants.js";

import { PrintTextNode, type SerializedPrintTextNode } from "./print-text-node.js";

export type EntityType =
	ElementType.Field | ElementType.Calculation | ElementType.PageNumber | ElementType.PageNumberTotal;

export function isEntityType(type: string): type is EntityType {
	return [ElementType.Field, ElementType.Calculation, ElementType.PageNumber, ElementType.PageNumberTotal].includes(
		type as ElementType
	);
}

export type SerializedPrintEntityNode = Spread<
	{
		entityId: string;
		entityType: EntityType;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		type: any;
		version: 1;
	},
	SerializedPrintTextNode
>;

function convertEntityElement(domNode: HTMLElement, entityType: EntityType): DOMConversionOutput | null {
	const textContent = domNode.textContent;
	const entityId = domNode.getAttribute(DOM_ATTRIBUTES.ENTITY_ID);

	if (textContent !== null && entityId !== null) {
		const innerSpan = (domNode.querySelector(":scope > span") as HTMLElement) || domNode;

		const node = $createPrintEntityNode({
			entityId,
			entityType,
			displayText: textContent,
		});

		node.applyStyleAndFormatFromDom(innerSpan);

		return {
			node,
		};
	}

	return null;
}

export class PrintEntityNode extends PrintTextNode {
	__entityId: string;
	__entityType: EntityType;

	static getType(): string {
		return "print-entity";
	}

	static clone(node: PrintEntityNode): PrintEntityNode {
		const cloned = new PrintEntityNode(
			node.__entityType,
			node.__entityId,
			node.__text,
			node.__selectedClassName,
			node.__key
		);
		cloned.__unmergeable = node.__unmergeable;
		return cloned;
	}

	constructor(
		entityType: EntityType,
		entityId: string,
		displayText: string,
		selectedClassName?: string[],
		key?: NodeKey
	) {
		super(displayText, selectedClassName, key);
		this.__entityType = entityType;
		this.__entityId = entityId;
	}

	createDOM(config: EditorConfig): HTMLElement {
		const element = super.createDOM(config);

		// Re-add the entity class (super.createDOM removes all entity classes)
		element.classList.add(EDITOR_THEME_CLASSES[this.__entityType]);

		element.setAttribute(DOM_ATTRIBUTES.ENTITY_ID, this.__entityId);
		element.setAttribute(DOM_ATTRIBUTES.ENTITY_TYPE, this.__entityType);

		return element;
	}

	updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
		if (prevNode.__entityId !== this.__entityId) {
			dom.setAttribute(DOM_ATTRIBUTES.ENTITY_ID, this.__entityId);
		}

		const isUpdated = super.updateDOM(prevNode, dom, config);

		// Re-add the entity class after super.updateDOM (which resets className)
		dom.classList.add(EDITOR_THEME_CLASSES[this.__entityType]);

		return isUpdated;
	}

	exportDOM(editor: LexicalEditor): DOMExportOutput {
		const { element: innerElement } = super.exportDOM(editor);
		if (!innerElement) {
			return { element: document.createElement("span") };
		}

		const outerSpan = document.createElement("span");
		outerSpan.setAttribute(DOM_ATTRIBUTES.ENTITY_ID, this.__entityId);
		outerSpan.setAttribute(DOM_ATTRIBUTES.ENTITY_TYPE, this.__entityType);
		outerSpan.appendChild(innerElement);

		return { element: outerSpan };
	}

	static importDOM(): DOMConversionMap | null {
		return {
			span: (domNode: HTMLElement) => {
				const entityTypeAttr = domNode.getAttribute(DOM_ATTRIBUTES.ENTITY_TYPE)?.toLowerCase();

				if (entityTypeAttr === ElementType.Field.toLowerCase()) {
					return {
						conversion: (dom: HTMLElement) => convertEntityElement(dom, ElementType.Field),
						priority: 1,
					};
				}
				// also allow "computation" to support legacy types
				if (entityTypeAttr === ElementType.Calculation.toLowerCase() || entityTypeAttr === "computation") {
					return {
						conversion: (dom: HTMLElement) => convertEntityElement(dom, ElementType.Calculation),
						priority: 1,
					};
				}
				if (entityTypeAttr === ElementType.PageNumber.toLowerCase()) {
					return {
						conversion: (dom: HTMLElement) => convertEntityElement(dom, ElementType.PageNumber),
						priority: 1,
					};
				}
				if (entityTypeAttr === ElementType.PageNumberTotal.toLowerCase()) {
					return {
						conversion: (dom: HTMLElement) => convertEntityElement(dom, ElementType.PageNumberTotal),
						priority: 1,
					};
				}

				return null;
			},
		};
	}

	static importJSON(serializedNode: SerializedPrintEntityNode): PrintEntityNode {
		const node = $createPrintEntityNode({
			entityId: serializedNode.entityId,
			entityType: serializedNode.entityType,
			displayText: serializedNode.text,
		});
		node.setFormat(serializedNode.format);
		node.setDetail(serializedNode.detail);
		node.setMode(serializedNode.mode);

		if (serializedNode.style) {
			node.setStyle(serializedNode.style);
		}

		return node;
	}

	exportJSON(): SerializedPrintEntityNode {
		return {
			...super.exportJSON(),
			type: "print-entity",
			entityId: this.__entityId,
			entityType: this.__entityType,
			version: 1,
		};
	}

	getEntityId(): string {
		return this.__entityId;
	}

	setEntityId(entityId: string): this {
		const writable = this.getWritable();
		writable.__entityId = entityId;
		return writable;
	}

	getEntityType(): EntityType {
		return this.__entityType;
	}
}

interface PrintEntityNodeParams {
	entityId: string;
	entityType: EntityType;
	displayText: string;
}

export function $createPrintEntityNode({ entityId, entityType, displayText }: PrintEntityNodeParams): PrintEntityNode {
	// Don't pass entity class via selectedStyleName - it will be added directly in createDOM
	// This prevents the entity class from being inherited by other nodes via clone/splitText
	const entityNode = new PrintEntityNode(entityType, entityId, displayText, [], undefined);
	entityNode.setMode("token");

	return $applyNodeReplacement(entityNode);
}

export function $isFieldNode(node: LexicalNode | null | undefined): node is PrintEntityNode {
	return node instanceof PrintEntityNode && node.__entityType === ElementType.Field;
}

export function $isCalculationNode(node: LexicalNode | null | undefined): node is PrintEntityNode {
	return node instanceof PrintEntityNode && node.__entityType === ElementType.Calculation;
}

export function $isPrintEntityNode(node: LexicalNode | null | undefined): node is PrintEntityNode {
	return node instanceof PrintEntityNode;
}

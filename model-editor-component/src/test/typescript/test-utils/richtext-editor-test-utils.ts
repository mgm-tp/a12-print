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
import type { Reducer } from "redux";

import type { PartialText } from "@com.mgmtp.a12.print/print-model-api/model";
import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";
import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import {
	EditorStateReducer,
	NavigationReducer,
	type PrintEditorState,
} from "../../../main/typescript/internal/redux/index.js";

import { createTransactionLogState, defaultPrintEditorState } from "./index.js";

export const PrintEditorStateMock: Reducer = (state: PrintEditorState = defaultPrintEditorState, action) =>
	EditorStateReducer(state, action);

export const NavigationReducerMock: Reducer = (state, action) => {
	if (state === undefined) {
		const initial = NavigationReducer(undefined, action);
		return {
			...initial,
			sidebarState: {
				...initial.sidebarState,
				activeCanvasTab: SidebarItem.SECTION,
				activeTab: SidebarItem.SECTION,
			},
		};
	}
	return NavigationReducer(state, action);
};

export const defaultReducers = {
	Navigation: NavigationReducerMock,
	TransactionLogState: createTransactionLogState(),
	PrintEditorState: PrintEditorStateMock,
};

export const createMockTextElement = (html: string): PartialText => ({
	id: "test-text-element-id",
	type: ElementType.Text,
	text: {
		id: "test-text-id",
		text: html,
		entities: [],
	},
});

/**
 * Generates a descriptive test name based on the HTML content.
 */
export function generateTestName(html: string, index: number): string {
	const features: string[] = [];

	if (/entity-type=/i.test(html)) features.push("entities");
	if (/color:\s*#[0-9a-fA-F]+/.test(html)) features.push("styles");
	if (/<strong>|<b>|<em>|<i>|<u>/i.test(html)) features.push("formatting");
	if (/<br\s*\/?>/i.test(html)) features.push("br");
	if (/&nbsp;/.test(html)) features.push("nbsp");

	const description = features.length > 0 ? features.join(", ") : "plain";
	return `#${index + 1}: ${description}`;
}

export const getToolbarButton = (container: HTMLElement, identifier: string): HTMLElement | null => {
	// Try finding by hidden text (e.g., "Bold", "Italic")
	const hiddenTexts = container.querySelectorAll('[data-role="hidden-text"]');
	for (const hiddenText of hiddenTexts) {
		if (hiddenText.textContent?.toLowerCase().includes(identifier.toLowerCase())) {
			const button = hiddenText.closest('[role="button"]') as HTMLElement;
			if (button) return button;
		}
	}
	// Try finding by icon text (e.g., "format_bold")
	const icons = container.querySelectorAll('i span[aria-hidden="true"]');
	for (const icon of icons) {
		if (icon.textContent?.toLowerCase().includes(identifier.toLowerCase())) {
			const button = icon.closest('[role="button"]') as HTMLElement;
			if (button) return button;
		}
	}
	return null;
};

export const selectTextInEditor = async (
	editorElement: HTMLElement,
	startOffset: number,
	endOffset: number
): Promise<void> => {
	const walker = document.createTreeWalker(editorElement, NodeFilter.SHOW_TEXT);
	const textNodes: Text[] = [];
	let node;
	while ((node = walker.nextNode())) {
		if (node.textContent && node.textContent.length > 0) {
			textNodes.push(node as Text);
		}
	}

	if (textNodes.length === 0) {
		throw new Error("No text nodes found in editor");
	}

	// Find start and end nodes based on absolute offsets
	let currentOffset = 0;
	let startNode: Text | null = null;
	let startNodeOffset = 0;
	let endNode: Text | null = null;
	let endNodeOffset = 0;

	for (const textNode of textNodes) {
		const nodeLength = textNode.textContent?.length || 0;

		if (!startNode && currentOffset + nodeLength >= startOffset) {
			startNode = textNode;
			startNodeOffset = startOffset - currentOffset;
		}

		if (currentOffset + nodeLength >= endOffset) {
			endNode = textNode;
			endNodeOffset = endOffset - currentOffset;
			break;
		}

		currentOffset += nodeLength;
	}

	if (!startNode || !endNode) {
		throw new Error(`Could not find text nodes for range ${startOffset}-${endOffset}`);
	}

	const range = document.createRange();
	range.setStart(startNode, startNodeOffset);
	range.setEnd(endNode, endNodeOffset);

	const selection = window.getSelection();
	selection?.removeAllRanges();
	selection?.addRange(range);

	document.dispatchEvent(new Event("selectionchange"));
	editorElement.focus();
};

export const setCursorInEditor = async (editorElement: HTMLElement, offset: number): Promise<void> => {
	await selectTextInEditor(editorElement, offset, offset);
};

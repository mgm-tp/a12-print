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
import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

const ELEMENT_TEST_IDS: Record<string, string> = {
	Text: "element-text",
	Image: "element-image",
	Area: "element-area",
	Line: "element-line",
	BoundingBox: "element-bounding-box",
	Switch: "element-switch",
	Listing: "element-listing",
	Table: "element-table",
	ResizeHandle: "resize-handle",
};

export const elementLocator = (page: Page, componentName: string): Locator => {
	const testId = ELEMENT_TEST_IDS[componentName];
	if (!testId) {
		throw new Error(`No data-testid mapping for element component: ${componentName}`);
	}
	return page.getByTestId(testId);
};

export const selectTab = async ({ page, tab }: { page: Page; tab: string }) => {
	await page.getByRole("tab", { name: tab }).click();
};

// Will timeout if no Tab is selected
export const openEditorStage = async ({ page, tab, cardName }: { page: Page; tab: string; cardName: string }) => {
	switch (tab) {
		case "Segment":
			await page.getByTestId("segment-card").filter({ hasText: cardName }).click();
			break;
		case "Section":
			await page.getByTestId("section-card").filter({ hasText: cardName }).click();
			break;
		case "Watermark":
			await page.getByTestId("watermark-card").filter({ hasText: cardName }).click();
			break;
		default:
			throw new Error("No valid tab specified - test fails!");
	}
};

// If editor is opened: add an element to the editor stage
export const dragElementToEditor = async ({
	page,
	elementName,
	componentName = elementName,
	isWrapperStage = false,
	targetPosition,
	normalizePosition,
}: {
	page: Page;
	elementName: string;
	componentName?: string;
	isWrapperStage?: boolean;
	targetPosition?: {
		x: number;
		y: number;
	};
	normalizePosition?: { x?: number; y?: number };
}) => {
	const elementLibraryButton = page.getByLabel("Open/Close Element Library");
	await elementLibraryButton.click();

	const elementLibrary = page.getByRole("dialog");
	await elementLibrary
		.getByTestId("element-library-item")
		.filter({ has: page.getByText(elementName, { exact: true }) })
		.dragTo(page.getByTestId(isWrapperStage ? "editor-drop-target" : "editor-container"), { targetPosition });
	await elementLibrary.getByLabel("Close").click();
	// force to close the popup tooltip
	await elementLocator(page, componentName).first().click();
	if (!isWrapperStage) {
		await setElementPosition({
			page,
			x: normalizePosition?.x ?? 10.5,
			y: normalizePosition?.y ?? 5.2,
		});
	} else if (isWrapperStage && normalizePosition) {
		await setElementPosition({
			page,
			...normalizePosition,
		});
	}
	await scrollEditorStage(page, 0);
};

export async function dragAndDrop(page: Page, locator: Locator, deltaX: number, deltaY: number) {
	const boundingBox = await locator.boundingBox();
	if (!boundingBox) {
		throw new Error("Element not found for drag and drop");
	}

	const startX = boundingBox.x + boundingBox.width / 2;
	const startY = boundingBox.y + boundingBox.height / 2;
	const endX = startX + deltaX;
	const endY = startY + deltaY;

	await page.mouse.move(startX, startY);
	await page.mouse.down();
	await page.mouse.move(endX, endY);
	await page.mouse.up();
}

/**
 * Waits until the Redux interaction log saga debounce has settled and React has re-rendered.
 * Use this before any assertion that follows a UI interaction (form fill, drag, select).
 */
export const waitForInteractionSagasSettled = async (page: Page): Promise<void> => {
	await page.waitForFunction(
		() => {
			const w = globalThis as unknown as Record<string, number>;
			const lastStart = w.__lastInteractionStart__ ?? 0;
			const lastEntry = w.__lastInteractionAddEntry__ ?? 0;
			const lastPersistStart = w.__lastPersistLogsStart__ ?? 0;
			const lastPersistEnd = w.__lastPersistLogsEnd__ ?? 0;
			// Inner saga: ADD_LOG_ENTRY must follow START
			const innerSettled = lastEntry >= lastStart;
			// Outer saga: setLogPersistentEntries must follow PERSIST_LOGS (debounce flushed)
			const outerSettled = lastPersistEnd >= lastPersistStart;
			return innerSettled && outerSettled;
		},
		{ timeout: 5000, polling: 50 }
	);
	// Wait one animation frame for React to commit the store update to the DOM
	await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
};

export const commitChanges = async ({ page, hasErrors = false }: { page: Page; hasErrors?: boolean }) => {
	await page.getByRole("tab", { name: "Commit changes" }).click();
	const commitButton = page.getByRole("button", { name: "Commit selected changes and truncate history" });
	const commitRows = page.getByRole("row", { name: /Open Commit/ });

	if (hasErrors) {
		await expect(commitRows).not.toHaveCount(0);
		await expect(commitButton).toBeDisabled();
	} else {
		await expect(commitRows).not.toHaveCount(0);
		await commitButton.click();
		await waitForInteractionSagasSettled(page);
		await expect(commitRows).toHaveCount(0);
	}
};

// Will timeout if Element Form Container is not open
export const closeDetail = async ({ page }: { page: Page }) => {
	await page.getByRole("heading").getByLabel("Close").click({ force: true });
	// force popup to close before screenshot
	await page.getByTestId("editor-container").click({ position: { x: 100, y: 200 } });
	await waitForInteractionSagasSettled(page);
};

/**
 * Select multiple elements on the stage using Ctrl+Click
 * @param page - Playwright Page object
 * @param elements - Array of element component names or locators
 * @param useLocators - If true, treats elements as locators; if false, treats them as component names (default: false)
 */
export const selectMultipleElements = async ({
	page,
	elements,
	useLocators = false,
}: {
	page: Page;
	elements: (string | Locator)[];
	useLocators?: boolean;
}) => {
	if (elements.length === 0) {
		throw new Error("No elements provided for selection");
	}

	for (let i = 0; i < elements.length; i++) {
		const element = elements[i];
		const locator = useLocators ? (element as Locator) : elementLocator(page, element as string).first();

		if (i === 0) {
			// First element: regular click to select
			await locator.click();
		} else {
			// Subsequent elements: Ctrl+Click to add to selection
			await locator.click({ modifiers: ["Control"] });
		}
	}
};

/**
 * Select multiple elements using a selection rectangle (drag to select)
 * @param page - Playwright Page object
 * @param startPosition - Starting position of the selection rectangle
 * @param endPosition - Ending position of the selection rectangle
 * @example
 * await selectMultipleElementsByRectangle({
 *   page,
 *   startPosition: { x: 10, y: 10 },
 *   endPosition: { x: 200, y: 200 }
 * });
 */
export const selectMultipleElementsByRectangle = async ({
	page,
	startPosition,
	endPosition,
}: {
	page: Page;
	startPosition: { x: number; y: number };
	endPosition: { x: number; y: number };
}) => {
	const editorContainer = page.getByTestId("editor-container");

	// Get the editor container's bounding box to calculate absolute positions
	const containerBox = await editorContainer.boundingBox();
	if (!containerBox) {
		throw new Error("Editor container not found");
	}

	// Calculate absolute screen positions
	const startX = containerBox.x + startPosition.x;
	const startY = containerBox.y + startPosition.y;
	const endX = containerBox.x + endPosition.x;
	const endY = containerBox.y + endPosition.y;

	// Perform the drag to create selection rectangle
	await page.mouse.move(startX, startY);
	await page.mouse.down();
	await page.mouse.move(endX, endY);
	await page.mouse.up();
};

/**
 * Paste elements at a specific position using the context menu
 * @param page - Playwright Page object
 * @param clickX - X coordinate for right-click
 * @param clickY - Y coordinate for right-click
 * @example
 * await pasteAtPosition({ page, clickX: 100, clickY: 200 });
 */
export const pasteAtPosition = async ({ page, clickX, clickY }: { page: Page; clickX: number; clickY: number }) => {
	await page.mouse.click(clickX, clickY, { button: "right" });

	const pasteItem = page.getByRole("button", { name: "Paste Ctrl + V" });

	await pasteItem.waitFor({ state: "visible", timeout: 2000 });
	await pasteItem.click();
};

/**
 * Set zoom factor in the editor
 * @param page - Playwright Page object
 * @param zoomValue - Zoom factor value (e.g., "0.2" for 20%, "0.5" for 50%, "1" for 100%)
 * @example
 * await setZoomFactor({ page, zoomValue: "0.5" }); // Set to 50%
 */
export const setZoomFactor = async ({ page, zoomValue }: { page: Page; zoomValue: string }) => {
	await page.getByTestId("zoom-factor").selectOption(zoomValue);
};

/**
 * Normalises the selected element's position via the QuickEditBar inputs.
 * Use after drag-and-drop to guarantee a deterministic position for screenshots.
 */
export const setElementPosition = async ({ page, x, y }: { page: Page; x?: number; y?: number }) => {
	if (x) {
		const xInput = page.getByPlaceholder("Left");
		await xInput.fill(String(x));
		await xInput.blur();
	}
	if (y) {
		const yInput = page.getByPlaceholder("Top");
		await yInput.fill(String(y));
		await yInput.blur();
	}

	await waitForInteractionSagasSettled(page);
};

export async function scrollEditorStage(page: Page, position = 0) {
	const editorContainer = page.getByTestId("editor-container");
	await editorContainer.evaluate((element, pos) => (element.scrollTop = pos), position);
}

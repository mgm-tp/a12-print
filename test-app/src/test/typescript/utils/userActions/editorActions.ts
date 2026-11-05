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

import { expect } from "../devAppExpect";

const ELEMENT_TEST_IDS: Record<string, string> = {
	Text: "element-text",
	Image: "element-image",
	Area: "element-area",
	Line: "element-line",
	BoundingBox: "element-bounding-box",
	Switch: "element-switch",
	Listing: "element-listing",
	Table: "element-table",
	TableLayout: "element-table-layout",
	Expression: "element-expression",
	Chart: "element-diagram",
	ResizeHandle: "resize-handle",
};

export const elementLocator = (page: Page, componentName: string): Locator => {
	const testId = ELEMENT_TEST_IDS[componentName];
	if (!testId) {
		throw new Error(`No data-testid mapping for element component: ${componentName}`);
	}
	return page.getByTestId(testId);
};

export const editorMain = (page: Page): Locator => page.getByRole("main").first();

/** The bar above the editor with the model icon, the model id and the undo, error and print buttons. */
export const globalToolbar = (page: Page): Locator => page.getByTestId("global-toolbar");

/** The icon that tells a Print Model from a Print Fragment Model, in the top left corner. */
export const modelIcon = (page: Page): Locator => globalToolbar(page).locator("img");

/** The panel on the right-hand side of the Editor Stage that holds the form of the selected entity. */
export const detailForm = (page: Page): Locator => page.getByTestId("detail-form-container");

/** The values of the migration annotations, which change with every model version bump. */
export const migrationAnnotationValues = (page: Page): Locator => page.getByRole("cell", { name: /^\d+\.\d+\.\d+/ });

export const textStyleCard = (page: Page, name: string): Locator =>
	page
		.getByTestId("text-style-card")
		.filter({ has: page.getByTestId("text-style-card-name").getByText(name, { exact: true }) });

export const selectByLabel = (page: Page, label: string): Locator =>
	page.locator(`[data-role="select"]:has([data-role="select-label"]:text-is("${label}"))`);

export const openSelectDropdown = async ({ page, select }: { page: Page; select: Locator }) => {
	await select.locator('[data-role="select-input"]').click();
	await expect(page.getByRole("listbox")).toBeVisible();
};

export const collapsiblePanelToggle = (page: Page, title: string): Locator =>
	page.getByRole("button", { name: title, exact: true });

export const textFieldByLabel = (page: Page, label: string): Locator =>
	page
		.locator('[data-role="text-field"]')
		.filter({ has: page.locator('[data-role="text-field-label"]', { hasText: label }) });

export const collapsiblePanel = (page: Page, title: string): Locator =>
	page.locator('[data-role="collapsible-panel"]').filter({ has: collapsiblePanelToggle(page, title) });

export const collapsePanel = async ({ page, title }: { page: Page; title: string }) => {
	const toggle = collapsiblePanelToggle(page, title);
	if ((await toggle.getAttribute("aria-expanded")) !== "false") {
		await toggle.click();
	}
	await expect(toggle).toHaveAttribute("aria-expanded", "false");
};

export const closeSidebar = async (page: Page) => {
	const panel = sidebarPanel(page);
	if (await panel.isVisible()) {
		await page.locator("#sidebar-panel").getByLabel("Close").click({ force: true });
		await expect(panel).toBeHidden();
	}
};

/** The Editor Stage column: the toolbar above the page and the page itself. */
export const editorStage = (page: Page): Locator => page.getByTestId("editor-stage");

export const editorToolbar = (page: Page): Locator => editorStage(page).locator("> div").first();

export const editorModeToggle = (page: Page): Locator =>
	page.locator('[data-role="toggle"]').filter({ has: page.locator('[data-role="toggle-item"][title="Default"]') });

export const wrapperStage = (page: Page): Locator => page.getByTestId("editor-drop-target");

export const sidebarPanel = (page: Page): Locator => editorMain(page).getByRole("tabpanel");

export const textElementByContent = (page: Page, text: string): Locator =>
	page.getByTestId("element-text").filter({ hasText: text }).first();

export const cardByTitle = (page: Page, testId: string, title: string): Locator =>
	page.getByTestId(testId).filter({ has: page.locator(`input[value="${title}"]`) });

export const selectTab = async ({ page, tab }: { page: Page; tab: string }) => {
	const trigger = page.getByRole("tab", { name: tab });
	const isSelected = async () => (await trigger.getAttribute("aria-selected")) === "true";
	if (!(await sidebarPanel(page).isVisible()) || !(await isSelected())) {
		await trigger.click();
	}
	await expect(sidebarPanel(page)).toBeVisible();
};

// Will timeout if no Tab is selected
export const openEditorStage = async ({ page, tab, cardName }: { page: Page; tab: string; cardName: string }) => {
	switch (tab) {
		case "Segment":
			await page.getByTestId("segment-card").filter({ hasText: cardName }).click();
			await expect(page.getByTestId("editor-container")).toBeVisible();
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

/**
 * Opens the Element Library, which occupies the detail form panel on the right-hand side of the
 * Editor Stage. Does nothing if it is already open, since the toolbar button toggles.
 */
export const openElementLibrary = async (page: Page) => {
	const elementLibrary = page.getByTestId("element-library-form");
	if (await elementLibrary.isVisible()) {
		return elementLibrary;
	}
	await page.getByLabel("Element Library").click();
	await expect(elementLibrary).toBeVisible();
	return elementLibrary;
};

/**
 * Closes the Element Library through the form header. Dropping an element opens that element's
 * detail form in the same panel, so by then there is nothing left to close.
 */
export const closeElementLibrary = async (page: Page) => {
	const elementLibrary = page.getByTestId("element-library-form");
	if (await elementLibrary.isVisible()) {
		await elementLibrary.getByLabel("Close").click();
		await expect(elementLibrary).toBeHidden();
	}
};

export const openCardEditor = async ({ page, card }: { page: Page; card: Locator }) => {
	await card.getByRole("button", { name: "Open Editor" }).click();
	await expect(page.getByTestId("editor-container")).toBeVisible();
};

export const openCardSettings = async ({ page, card, headline }: { page: Page; card: Locator; headline: string }) => {
	await card.getByRole("button", { name: "Open Setting" }).click();
	await expect(page.getByRole("heading", { name: headline })).toBeVisible();
};

export const openElementDetail = async ({
	page,
	element,
	headline,
}: {
	page: Page;
	element: Locator;
	headline: string;
}) => {
	await element.dblclick();
	await expect(page.getByRole("heading", { name: headline })).toBeVisible();
};

export const openElementDetailForm = async ({
	page,
	element,
	headline,
}: {
	page: Page;
	element: Locator;
	headline: string;
}) => {
	await element.click();
	await page.getByTitle("Open Detail Edit").click();
	await expect(page.getByRole("heading", { name: headline })).toBeVisible();
};

export const openWrapperStage = async ({ page, element }: { page: Page; element: Locator }) => {
	await element.hover();
	await page.getByRole("button", { name: "Edit", exact: true }).click();
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
	await openElementLibrary(page);

	const elementLibrary = page.getByTestId("element-library-form");
	await elementLibrary
		.getByTestId("element-library-item")
		.filter({ has: page.getByText(elementName, { exact: true }) })
		.dragTo(page.getByTestId(isWrapperStage ? "editor-drop-target" : "editor-container"), { targetPosition });
	await closeElementLibrary(page);
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
	const modeToggle = page.getByRole("button", { name: "Light Editor" });
	if (await modeToggle.isVisible()) {
		// commit tab not available in light editor
		return;
	}
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

/**
 * Confirms the "Unlink fragment" dialog that follows every fragment/element unlink action.
 * If unlinking would pull in a Typesetting/Document Model dependency, an "Unlinking adds dependencies"
 * dialog is shown first - this confirms that one too before the unlink dialog appears.
 * Both dialogs share the same "Apply" confirm button, so they are told apart by their title text.
 */
export const confirmUnlinkDialog = async (page: Page): Promise<void> => {
	const applyButton = page.getByRole("button", { name: "Apply", exact: true });
	await expect(applyButton).toBeVisible();

	if (await page.getByText("Unlinking adds dependencies").isVisible()) {
		await applyButton.click();
		await expect(page.getByRole("heading", { name: "Unlink fragment" })).toBeVisible();
	}

	await applyButton.click();
};

export const closeDetailForm = async ({ page }: { page: Page }) => {
	const closeButton = page.getByTestId("detail-form-container").getByRole("heading").getByLabel("Close");
	await closeButton.click({ force: true });
	await expect(closeButton).toBeHidden();
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
 * Copies an element and pastes it back onto the stage, below what is there. Meant to be hung onto an element
 * test once it built its element: whatever the element carries has to survive being copied.
 */
const copyPasteElement = async ({
	page,
	element,
	offset = { x: 60, y: 400 },
}: {
	page: Page;
	element: Locator;
	offset?: { x: number; y: number };
}) => {
	await element.click();
	await page.keyboard.press("Control+c");

	const editorStage = page.getByTestId("editor-stage");
	const stageBox = await editorStage.boundingBox();
	if (!stageBox) {
		throw new Error("Editor stage not found");
	}

	await pasteAtPosition({ page, clickX: stageBox.x + offset.x, clickY: stageBox.y + offset.y });
	await waitForInteractionSagasSettled(page);
};

/**
 * Copies the element a test has built and checks the copy is as sound as the original: whatever an element
 * carries has to survive being copied. Meant as the last step of an element test.
 */
export const testCopyElement = async ({
	page,
	testId,
	cardName = "First Segment",
}: {
	page: Page;
	testId: string;
	cardName?: string;
}) => {
	// a test leaves the editor in the commit tab
	await selectTab({ page, tab: "Segment" });
	await openEditorStage({ page, tab: "Segment", cardName });

	await copyPasteElement({ page, element: page.getByTestId(testId).first() });

	await expect(page.getByTestId(testId)).toHaveCount(2);
	await expect(page).toHaveEditorStageErrors(0);

	await commitChanges({ page });
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
export const setElementPosition = async ({
	page,
	x,
	y,
	width,
}: {
	page: Page;
	x?: number;
	y?: number;
	width?: number;
}) => {
	const geometry: [string, number | undefined][] = [
		["Left", x],
		["Top", y],
		["Width", width],
	];
	for (const [placeholder, value] of geometry) {
		if (value === undefined) {
			continue;
		}
		const input = page.getByPlaceholder(placeholder);
		await input.fill(String(value));
		await input.blur();
	}

	await waitForInteractionSagasSettled(page);
};

// Selector for the Lexical rich text editor's editable area
export const RICHTEXT_EDITOR_SELECTOR = "#print-richtext-editor";

// Will timeout if the text element is not available
export const writeToTextElement = async ({ page, text }: { page: Page; text: string }) => {
	const textBoxInput = page.locator(RICHTEXT_EDITOR_SELECTOR);
	await textBoxInput.clear();
	await textBoxInput.click();

	// Split text by newlines and type each segment, pressing Enter between them
	const segments = text.split("\n");
	for (let i = 0; i < segments.length; i++) {
		if (segments[i]) {
			await textBoxInput.pressSequentially(segments[i], { delay: 0 });
		}
		if (i < segments.length - 1) {
			await page.keyboard.press("Enter");
		}
	}
	await textBoxInput.blur();
};

export async function scrollEditorStage(page: Page, position = 0) {
	const editorContainer = page.getByTestId("editor-container");
	await editorContainer.evaluate((element, pos) => (element.scrollTop = pos), position);
}

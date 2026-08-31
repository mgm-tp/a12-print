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
import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";

import { closeDetail } from "./editorActions";

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

export const deleteTextByBackspace = async ({
	page,
	stringToDelete,
	textElement,
}: {
	page: Page;
	stringToDelete: string;
	textElement: Locator;
}) => {
	await textElement.dblclick();
	await page.locator(RICHTEXT_EDITOR_SELECTOR).click();
	for (let i = 0; i < stringToDelete.length; i++) {
		await page.keyboard.down("Backspace");
		await page.keyboard.up("Backspace");
	}
};

export const selectInputSource = async ({
	page,
	label,
	source,
}: {
	page: Page;
	label: string;
	source: PossibleInputSource;
}) => {
	const container = page.locator(`[data-role="textline-label"]:has-text("${label}")`).locator("..");
	const sourceButton = container.locator(`button#${source}`).first();
	// Expand the toggle (showOnlySelectedOption keeps non-selected buttons visually hidden until hover)
	await container.hover();
	await sourceButton.waitFor({ state: "visible" });
	await sourceButton.click();
	// Verify the source actually became selected before continuing
	await expect(sourceButton).toHaveAttribute("aria-pressed", "true");
};

export async function setBorderWidth(page: Page, value: string) {
	await selectInputSource({ page, label: "Border Width", source: PossibleInputSource.INPUT });
	await page.getByTestId("border-width-input").fill(value);
}

export async function setBorderStyle(page: Page, value: string) {
	await selectInputSource({ page, label: "Border Style", source: PossibleInputSource.INPUT });
	await page.getByRole("combobox", { name: "Border Style" }).click();
	await page.getByRole("option", { name: value }).click();
}
export async function setPageBreakBehavior(page: Page, value: string | null) {
	await selectInputSource({ page, label: "Page Break Behavior", source: PossibleInputSource.INPUT });
	if (value !== null) {
		await page.getByRole("combobox", { name: "Page Break Behavior" }).click();
		await page.getByRole("option", { name: value }).click();
	}
}

export async function setBorderColor(page: Page, value: string) {
	await selectInputSource({ page, label: "Border Color", source: PossibleInputSource.INPUT });
	await page
		.locator(`[data-role="textline-label"]:has-text("Border Color")`)
		.locator("..")
		.locator('input[type="color"]')
		.fill(value, { force: true });
}

export async function setRichTextColor(page: Page, value: string) {
	// Trigger the color input's onChange via evaluate to avoid stealing focus from the
	// Lexical editor (fill() focuses the input, which clears the active selection).
	await page.evaluate(colorValue => {
		const input = document.querySelector(
			'[data-role="rich-text-editor-toolbar"] input[type="color"]'
		) as HTMLInputElement;
		const nativeSetter = Object.getOwnPropertyDescriptor(globalThis.HTMLInputElement.prototype, "value")?.set;
		nativeSetter?.call(input, colorValue);
		input.dispatchEvent(new Event("change", { bubbles: true }));
	}, value);
}

// Will timeout if text element is not available, creates screenshot of textBox after alignment change
export const selectThenAssertTextAlignment = async ({
	page,
	alignment,
	textBox,
}: {
	page: Page;
	textBox: Locator;
	alignment: "Left" | "Center" | "Right" | "Justify";
}) => {
	await textBox.dblclick();
	await page.getByRole("combobox", { name: "Alignment" }).click();
	await page.getByRole("option", { name: alignment }).click();
	await closeDetail({ page });
	await textBox.click();
	await expect.soft(textBox).toHaveScreenshot();
};

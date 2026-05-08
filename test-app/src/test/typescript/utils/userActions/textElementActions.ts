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
import { Page, Locator, expect } from "@playwright/test";

import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/lib/input-source/input-source";

import { closeDetail } from "./editorActions";

// Will timeout if the text element is not available
export const writeToTextElement = async ({ page, text }: { page: Page; text: string }) => {
	const textBoxInput = page.locator("_react=DraftEditorContents");
	await textBoxInput.clear();
	await textBoxInput.click();
	await textBoxInput.fill(text);
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
	await page.locator("_react=DraftEditorContents").click();
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
	await page
		.locator(`_react=SourceSelect`)
		.filter({ has: page.locator(`label:has-text("${label}")`) })
		.locator(`button#${source}`)
		.click();
};

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
	await page.locator("_react=CustomSelect[id = 'alignment']").getByRole("combobox").click();
	await page.getByRole("option", { name: alignment }).click();
	await closeDetail({ page });
	await expect(textBox).toHaveScreenshot();
};

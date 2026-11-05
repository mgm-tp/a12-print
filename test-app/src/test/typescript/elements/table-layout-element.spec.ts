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
import type { Page } from "@playwright/test";
import { test } from "@playwright/test";

import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";

import { devAppTest, expect, selectInputSource, setBorderStyle } from "../utils/index.js";
import {
	closeDetail,
	commitChanges,
	dragElementToEditor,
	writeToTextElement,
	openEditorStage,
	waitForInteractionSagasSettled,
	testCopyElement,
} from "../utils/userActions/editorActions";

devAppTest.use({ useCase: "003-automated-tests" });

const TABLE_LAYOUT_BORDER_STYLE = "Solid";
const OWN_BORDER_STYLE = "Dotted";

/** Puts a text element into a cell and writes into it - an empty text keeps the form in error. */
const fillCellWithText = async (page: Page, index: number, text: string) => {
	const cell = page.getByTestId("element-table-layout").getByRole("cell").nth(index);

	// the plus button only shows up on hover, picking the content type is enough to place the element
	await cell.hover();
	await cell.getByRole("button").click();
	await page.getByRole("dialog").getByRole("combobox").selectOption({ label: "Text" });
	await waitForInteractionSagasSettled(page);

	await openCell(page, index);
	await writeToTextElement({ page, text });
	await waitForInteractionSagasSettled(page);
	await closeDetail({ page });
};

const openCell = async (page: Page, index: number) => {
	const cell = page.getByTestId("element-table-layout").getByRole("cell").nth(index);

	await cell.hover();
	await cell.getByRole("button", { name: "Edit" }).click();
	await waitForInteractionSagasSettled(page);
};

test.describe("Table Layout Element", () => {
	devAppTest.beforeEach(async ({ page }) => {
		await openEditorStage({ page, tab: "Segment", cardName: "First Segment" });
		await dragElementToEditor({ page, elementName: "Table Layout", componentName: "TableLayout" });

		await page.getByTestId("element-table-layout").dblclick();
		await page.locator("#sidebar-panel").getByLabel("Close").click({ force: true });
	});

	devAppTest("Cell inherits from the table layout", async ({ page }) => {
		const detailForm = page.getByTestId("detail-form-container");

		await test.step("Give the table layout two cells and a border style", async () => {
			await detailForm.getByRole("spinbutton").first().fill("1");
			await detailForm.getByRole("spinbutton").nth(1).fill("2");
			await waitForInteractionSagasSettled(page);

			await setBorderStyle(page, TABLE_LAYOUT_BORDER_STYLE);
			await waitForInteractionSagasSettled(page);

			await closeDetail({ page });
		});

		await test.step("Put a text element into each cell", async () => {
			await fillCellWithText(page, 0, "Inherited");
			await fillCellWithText(page, 1, "Own");
		});

		await test.step("The first cell inherits the border style of the table layout", async () => {
			await openCell(page, 0);

			await selectInputSource({ page, label: "Border Style", source: PossibleInputSource.INHERITED });
			await waitForInteractionSagasSettled(page);

			// an inherited value is shown in a read only text field, not in the select
			await expect(detailForm.getByRole("textbox", { name: "Border Style" })).toHaveValue(
				TABLE_LAYOUT_BORDER_STYLE
			);
			await expect(detailForm.getByText("Please specify a value")).toHaveCount(0);

			await closeDetail({ page });
		});

		await test.step("The second cell keeps a border style of its own", async () => {
			await openCell(page, 1);

			await setBorderStyle(page, OWN_BORDER_STYLE);
			await waitForInteractionSagasSettled(page);

			await closeDetail({ page });
		});

		await test.step("Both cells render, the inherited one differs from the explicit one", async () => {
			const tableLayout = page.getByTestId("element-table-layout");

			await tableLayout.click();
			await expect.soft(tableLayout).toHaveScreenshot();
		});

		await test.step("Commit changes", async () => {
			await commitChanges({ page });
		});

		await test.step("Copy Element", async () => {
			await testCopyElement({ page, testId: "element-table-layout" });
		});
	});
});

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

import { devAppTest, expect } from "../utils/index.js";
import {
	closeDetail,
	commitChanges,
	testCopyElement,
	dragElementToEditor,
	openEditorStage,
	waitForInteractionSagasSettled,
} from "../utils/userActions/editorActions";
import { selectFieldFromTree } from "../utils/userActions/treeActions";

devAppTest.use({ useCase: "003-automated-tests" });

const TABLE_ALIGNMENT = "Right";
const COLUMN_EXPRESSION = '"Expression"';

/** The table form holds the same properties twice, once for the header and once for the body. */
const BODY_PROPERTIES = 1;

/** The table form does not mark its labels the way {@link selectInputSource} expects, so the row is taken from the label. */
const alignmentRow = (page: Page, index: number) =>
	page.getByText("Alignment", { exact: true }).nth(index).locator("..");

const selectInputSourceAt = async (page: Page, label: string, index: number, source: PossibleInputSource) => {
	const row = page.getByText(label, { exact: true }).nth(index).locator("..");
	await row.hover();

	const sourceButton = row.locator(`button#${source}`).first();
	await sourceButton.waitFor({ state: "visible" });
	await sourceButton.click();
};

test.describe("Table Element", () => {
	devAppTest.beforeEach(async ({ page }) => {
		await openEditorStage({ page, tab: "Segment", cardName: "First Segment" });
		await dragElementToEditor({ page, elementName: "Table", componentName: "Table" });

		await page.getByTestId("element-table").dblclick();
		await page.locator("#sidebar-panel").getByLabel("Close").click({ force: true });
	});

	devAppTest("Column with an expression", async ({ page }) => {
		const detailForm = page.getByTestId("detail-form-container");

		await test.step("Bind the table to a document model and a group", async () => {
			await detailForm
				.getByRole("combobox")
				.filter({ has: page.getByRole("option", { name: "ExampleDM" }) })
				.selectOption({ label: "ExampleDM" });

			await selectFieldFromTree({ tree: detailForm.locator('[data-role="tree"]'), fieldPath: "/example" });
			await waitForInteractionSagasSettled(page);
		});

		await test.step("Give the body of the table an alignment", async () => {
			await selectInputSourceAt(page, "Alignment", BODY_PROPERTIES, PossibleInputSource.INPUT);

			await alignmentRow(page, BODY_PROPERTIES).getByRole("combobox").click();
			await page.getByRole("option", { name: TABLE_ALIGNMENT }).click();
			await waitForInteractionSagasSettled(page);
		});

		await test.step("Add a column holding an expression", async () => {
			await detailForm.getByRole("button", { name: "Add" }).first().click();

			// a column only holds a reference, the element type decides what carries the text properties
			await detailForm
				.getByRole("combobox")
				.filter({ has: page.getByRole("option", { name: "Expression" }) })
				.selectOption({ label: "Expression" });

			const contentInput = detailForm.getByText("Content", { exact: true }).locator("..").getByRole("textbox");

			await contentInput.fill(COLUMN_EXPRESSION);
			await contentInput.blur();
			await waitForInteractionSagasSettled(page);

			await expect(detailForm.getByText("Please specifiy a text.")).toHaveCount(0);
			await expect(page).toHaveEditorStageErrors(0);
		});

		await test.step("The table renders without errors", async () => {
			await closeDetail({ page });

			const table = page.getByTestId("element-table");
			await table.click();
			await expect.soft(table).toHaveScreenshot();
		});

		await test.step("Commit changes", async () => {
			await commitChanges({ page });
		});

		await test.step("Copy Element", async () => {
			await testCopyElement({ page, testId: "element-table" });
		});
	});
});

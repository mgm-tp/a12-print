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
	waitForInteractionSagasSettled,
	commitChanges,
	testCopyElement,
	dragElementToEditor,
	openEditorStage,
} from "../utils/userActions/editorActions";
import { selectFieldFromTree } from "../utils/userActions/treeActions";

devAppTest.use({ useCase: "003-automated-tests" });

const LISTING_ALIGNMENT = "Right";
const LISTING_TEXT_STYLE = "Headline";
const LISTING_BORDER_STYLE = "Dashed";

/** The input source buttons and the text field of a property sit in the same container. */
const propertyField = (page: Page, label: string) =>
	page.locator(`[data-role="textline-label"]:has-text("${label}")`).locator("..");

const columnLabelField = (page: Page) => propertyField(page, "Column label");

test.describe("Listing Element", () => {
	devAppTest.beforeEach(async ({ page }) => {
		await openEditorStage({ page, tab: "Segment", cardName: "First Segment" });
		await dragElementToEditor({ page, elementName: "Listing" });

		const listing = page.getByTestId("element-listing");

		await listing.dblclick();
		await page.locator("#sidebar-panel").getByLabel("Close").click({ force: true });
		await expect(page).toHaveEditorStageErrors(3);
	});

	devAppTest("Column with custom text properties", async ({ page }) => {
		// everything of this test happens in the detail form, the page holds further trees and buttons
		const detailForm = page.getByTestId("detail-form-container");
		await test.step("Bind the listing to a document model and a group", async () => {
			// the select has no accessible name, the only one offering this model is the document model select
			await detailForm
				.getByRole("combobox")
				.filter({ has: page.getByRole("option", { name: "ExampleDM" }) })
				.selectOption({ label: "ExampleDM" });
			await expect(page).toHaveEditorStageErrors(2);

			// the read only "Group" field only shows the base path, it is picked in the data context tree
			await selectFieldFromTree({ tree: detailForm.locator('[data-role="tree"]'), fieldPath: "/example" });
			await expect(page).toHaveEditorStageErrors(1);
		});

		await test.step("Give the listing a text style and an alignment", async () => {
			await detailForm.getByRole("button", { name: "Text Properties" }).click();

			await selectInputSource({ page, label: "Text Styles", source: PossibleInputSource.INPUT });
			await detailForm.getByRole("combobox", { name: "Text Styles" }).click();
			await page.getByRole("option", { name: LISTING_TEXT_STYLE }).click();

			await selectInputSource({ page, label: "Alignment", source: PossibleInputSource.INPUT });
			await detailForm.getByRole("combobox", { name: "Alignment" }).click();
			await page.getByRole("option", { name: LISTING_ALIGNMENT }).click();
			await waitForInteractionSagasSettled(page);

			await expect(propertyField(page, "Text Styles")).toContainText(LISTING_TEXT_STYLE);
			await expect(detailForm.getByRole("combobox", { name: "Alignment" })).toMatchAriaSnapshot(
				`- combobox "Alignment": ${LISTING_ALIGNMENT}`
			);
		});

		await test.step("Give the listing a border style", async () => {
			await detailForm.getByRole("button", { name: "Border Properties" }).click();

			await setBorderStyle(page, LISTING_BORDER_STYLE);
			await waitForInteractionSagasSettled(page);
		});

		await test.step("Add a column", async () => {
			await detailForm.getByRole("button", { name: "Add" }).first().click();

			await selectInputSource({ page, label: "Column label", source: PossibleInputSource.INPUT });
			await columnLabelField(page).getByRole("textbox").fill("My Column");
		});

		await test.step("Turn on custom text properties for the column", async () => {
			await detailForm.getByRole("checkbox", { name: "Column has custom text properties" }).check();
			await expect(detailForm.getByText("Please specify a value")).toHaveCount(0);
			await expect(page).toHaveEditorStageErrors(0);
		});

		await test.step("The column inherits the text style of the listing", async () => {
			// the properties only show up once the section is open
			await detailForm.getByRole("button", { name: "Text Properties" }).click();

			// an inherited source without a reference cannot be resolved and asks for a value
			await selectInputSource({ page, label: "Text Styles", source: PossibleInputSource.INHERITED });
			await waitForInteractionSagasSettled(page);

			// an inherited value is shown in a read only text field, not in the select
			await expect(propertyField(page, "Text Styles")).toContainText(LISTING_TEXT_STYLE);
			await expect(detailForm.getByText("Please specify a value")).toHaveCount(0);
			await expect(page).toHaveEditorStageErrors(0);
		});

		await test.step("The column inherits the alignment of the listing", async () => {
			await selectInputSource({ page, label: "Alignment", source: PossibleInputSource.INHERITED });
			await waitForInteractionSagasSettled(page);

			await expect(detailForm.getByRole("textbox", { name: "Alignment" })).toHaveValue(LISTING_ALIGNMENT);
			await expect(page).toHaveEditorStageErrors(0);
		});

		await test.step("The column inherits the border style of the listing", async () => {
			await detailForm.getByRole("checkbox", { name: "Column has custom border properties" }).check();
			await detailForm.getByRole("button", { name: "Border Properties" }).click();

			await selectInputSource({ page, label: "Border Style", source: PossibleInputSource.INHERITED });
			await waitForInteractionSagasSettled(page);

			await expect(detailForm.getByRole("textbox", { name: "Border Style" })).toHaveValue(LISTING_BORDER_STYLE);
			await expect(detailForm.getByText("Please specify a value")).toHaveCount(0);
			await expect(page).toHaveEditorStageErrors(0);
		});

		await test.step("The listing carries no error badge", async () => {
			// the column form sits on top of the listing form and grows past the close button
			await detailForm.getByRole("button", { name: "Back" }).click();
			await closeDetail({ page });
			await page.getByTestId("element-listing").click();
			await expect.soft(page.getByTestId("element-listing")).toHaveScreenshot();
		});

		await test.step("Commit changes", async () => {
			await commitChanges({ page });
		});

		await test.step("Copy Element", async () => {
			await testCopyElement({ page, testId: "element-listing" });
		});
	});
});

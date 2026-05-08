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
import { expect, test } from "@playwright/test";
import {
	closeDetail,
	deleteTextByBackspace,
	devAppTest,
	dragElementToEditor,
	openEditorStage,
	selectInputSource,
	selectThenAssertTextAlignment,
	writeToTextElement,
	selectFieldFromTree,
} from "src/test/typescript/utils";

import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/lib/input-source/index.js";

devAppTest.use({ useCase: "003-automated-tests" });

test.describe("Text-Element", () => {
	devAppTest("Edit and format content", async ({ page }) => {
		await openEditorStage({ page, tab: "Segment", cardName: "First Segment" });
		await dragElementToEditor({ page, elementName: "Text" });

		const textBox = page.locator("_react=Text");

		await textBox.dblclick();
		const textBoxInput = page.locator("_react=DraftEditorContents");
		await textBoxInput.clear();
		await textBoxInput.click();
		await page.keyboard.down("Enter");
		await page.keyboard.up("Enter");
		await page.getByRole("heading").getByLabel("Close").click();
		await expect(textBox).toContainText("\n");

		await page.locator("_react=Text").dblclick();
		await writeToTextElement({ page, text: "Hello World" });
		await page.getByRole("heading").getByLabel("Close").click();
		await expect(textBox).toContainText("Hello World");

		await textBox.dblclick();
		await deleteTextByBackspace({ page, stringToDelete: "Hello World", textElement: textBox });
		await expect(textBox).toContainText("");

		const undoBtn = page.getByLabel("Undo");
		await undoBtn.click();
		await page.getByRole("heading").getByLabel("Close").click();
		await expect(textBox).toContainText("Hello World");

		await textBox.dblclick();
		const redoBtn = page.getByLabel("Redo");
		await redoBtn.click();
		await page.getByRole("heading").getByLabel("Close").click();
		await expect(textBox).toContainText("");
	});
});

test.describe("Text-Element", () => {
	devAppTest.beforeEach(async ({ page }) => {
		await openEditorStage({ page, tab: "Segment", cardName: "First Segment" });
		await dragElementToEditor({ page, elementName: "Text" });
		await page.locator("_react=Text").dblclick();
		await writeToTextElement({ page, text: "Hello World" });

		await page.locator("#sidebar-panel").getByLabel("Close").click({ force: true });
	});

	devAppTest("Set Text Properties", async ({ page }) => {
		await test.step("Adjust text style: choose Heading", async () => {
			await selectInputSource({ page, label: "Text Styles", source: PossibleInputSource.INPUT });
			await page.locator("_react=CustomSelect[id = 'textStyleId']").getByRole("combobox").click();
			await page.getByRole("option", { name: "Headline" }).click();

			await closeDetail({ page });

			await expect(page.locator("_react=Text")).toHaveScreenshot();
		});

		await test.step("Set Alignments", async () => {
			const textBox = page.locator("_react=Text");
			await textBox.dblclick();

			await selectInputSource({ page, label: "Alignment", source: PossibleInputSource.INPUT });

			await page.locator("_react=CustomSelect[id = 'alignment']").getByRole("combobox").click();
			await page.getByRole("option", { name: "Left" }).click();

			await closeDetail({ page });
			await expect(textBox).toHaveScreenshot();

			await selectThenAssertTextAlignment({ page, alignment: "Center", textBox });
			await selectThenAssertTextAlignment({ page, alignment: "Right", textBox });
			await selectThenAssertTextAlignment({ page, alignment: "Justify", textBox });
		});
	});
});

test.describe("Text-Element", () => {
	devAppTest.beforeEach(async ({ page }) => {
		await openEditorStage({ page, tab: "Segment", cardName: "First Segment" });
		await dragElementToEditor({ page, elementName: "Text" });
		page.locator("_react=Text").dblclick();
		await writeToTextElement({ page, text: "Hello World" });
		await selectInputSource({ page, label: "Text Styles", source: PossibleInputSource.DEFAULT });

		await page.locator("#sidebar-panel").getByLabel("Close").click({ force: true });
	});

	devAppTest("Set Border Properties", async ({ page }) => {
		await test.step("Set Border Width and Color", async () => {
			await page.locator("_react=PositiveNumberInput[label = 'Border Width']").getByRole("spinbutton").fill("1");
			await page.getByLabel("Border Color").click();
			await page.locator("input[type=color][id=borderColor]").fill("#a12a12", { force: true });

			await closeDetail({ page });
			await expect(page.locator("_react=Text")).toHaveScreenshot();
		});

		await test.step("Set Border Style to Solid", async () => {
			await page.locator("_react=Text").dblclick();
			await page.locator("_react=PositiveNumberInput[label = 'Border Width']").getByRole("spinbutton").fill("1");
			await page
				.locator("_react=CustomSelect[label = 'Border Style']")
				.getByRole("combobox")
				.selectOption("Solid");
			await page.getByLabel("Border Color").click();
			await page.locator("input[type=color][id=borderColor]").fill("#000000", { force: true });

			await closeDetail({ page });
			await expect(page.locator("_react=Text")).toHaveScreenshot();
		});

		await test.step("Set Border Style to Dotted and change Width", async () => {
			await page.locator("_react=Text").dblclick();
			await page
				.locator("_react=PositiveNumberInput[label = 'Border Width']")
				.getByRole("spinbutton")
				.fill("0.5");
			await page
				.locator("_react=CustomSelect[label = 'Border Style']")
				.getByRole("combobox")
				.selectOption("Dotted");
			await page.getByLabel("Border Color").click();
			await page.locator("input[type=color][id=borderColor]").fill("#1289a1", { force: true });

			await closeDetail({ page });
			await expect(page.locator("_react=Text")).toHaveScreenshot();
		});
	});
});

test.describe("Text-Element", () => {
	devAppTest.beforeEach(async ({ page }) => {
		await openEditorStage({ page, tab: "Segment", cardName: "First Segment" });
		await dragElementToEditor({ page, elementName: "Text" });
		await page.locator("#sidebar-panel").getByLabel("Close").click({ force: true });
	});

	devAppTest("Calculation in Text Element", async ({ page }) => {
		await test.step("Add a calculation", async () => {
			await page.locator("_react=Text").dblclick();
			await page.getByRole("button", { name: "Calculation" }).click();

			await page
				.locator("_react=CustomTextLineStateful[label = 'Name']")
				.getByRole("textbox")
				.first()
				.fill("Calculation");

			await page
				.locator("_react=CustomSelect[label = 'Document Model']")
				.getByRole("combobox")
				.selectOption("ExampleDM");
		});

		await test.step("Close the calculation form and text element", async () => {
			await page.getByRole("button", { name: "Back", exact: true }).click();
			await page.getByRole("heading").getByLabel("Close").click();
			expect(page.locator("_react=Text")).toBeDefined();
		});
	});

	devAppTest("Field Reference in Text Element", async ({ page }) => {
		await test.step("Add a Field Reference", async () => {
			await page.locator("_react=Text").dblclick();
			await page.getByRole("button", { name: "Field" }).click();

			await page
				.locator("_react=CustomSelect[label = 'Document Model']")
				.getByRole("combobox")
				.selectOption("ExampleDM");

			await selectFieldFromTree({ tree: page.locator("_react=Tree"), fieldPath: "/example/numberField" });
		});

		await test.step("Close the field form and text element", async () => {
			await page.getByRole("button", { name: "Back", exact: true }).click();
			await page.getByRole("heading").getByLabel("Close").click();
			expect(page.locator("_react=Text")).toBeDefined();
		});
	});
});

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

import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";

import {
	closeDetail,
	commitChanges,
	deleteTextByBackspace,
	devAppTest,
	dragElementToEditor,
	openEditorStage,
	selectInputSource,
	selectThenAssertTextAlignment,
	waitForInteractionSagasSettled,
	writeToTextElement,
	selectFieldFromTree,
	RICHTEXT_EDITOR_SELECTOR,
	setBorderColor,
	setBorderWidth,
	setBorderStyle,
	setRichTextColor,
	scrollEditorStage,
} from "../utils/index.js";

devAppTest.use({ useCase: "003-automated-tests" });

test.describe("Text-Element", () => {
	devAppTest("Edit and format content", async ({ page }) => {
		await openEditorStage({ page, tab: "Segment", cardName: "First Segment" });
		await dragElementToEditor({ page, elementName: "Text" });

		const textBox = page.getByTestId("element-text");

		await textBox.dblclick();
		const textBoxInput = page.locator(RICHTEXT_EDITOR_SELECTOR);
		await textBoxInput.clear();
		await textBoxInput.click();
		await page.keyboard.down("Enter");
		await page.keyboard.up("Enter");
		await page.getByRole("heading").getByLabel("Close").click();
		await expect(textBox).toContainText("\n");

		await page.getByTestId("element-text").dblclick();
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

		await test.step("Commit changes", async () => {
			await commitChanges({ page, hasErrors: true });
		});
	});
});

test.describe("Text-Element", () => {
	devAppTest.beforeEach(async ({ page }) => {
		await openEditorStage({ page, tab: "Segment", cardName: "First Segment" });
		await dragElementToEditor({ page, elementName: "Text" });
		await page.getByTestId("element-text").dblclick();
		await writeToTextElement({ page, text: "Hello World" });

		await page.locator("#sidebar-panel").getByLabel("Close").click({ force: true });
	});

	devAppTest("Set Text Properties", async ({ page }) => {
		await test.step("Adjust text style: choose Heading", async () => {
			await selectInputSource({ page, label: "Text Styles", source: PossibleInputSource.INPUT });
			await page.getByRole("combobox", { name: "Text Styles" }).click();
			await page.getByRole("option", { name: "Headline" }).click();

			await closeDetail({ page });
			await page.getByTestId("element-text").click();
			await expect.soft(page.getByTestId("element-text")).toHaveScreenshot();
		});

		await test.step("Set Alignments", async () => {
			const textBox = page.getByTestId("element-text");
			await textBox.dblclick();

			await selectInputSource({ page, label: "Alignment", source: PossibleInputSource.INPUT });

			await page.getByRole("combobox", { name: "Alignment" }).click();
			await page.getByRole("option", { name: "Left" }).click();

			await closeDetail({ page });
			await textBox.click();
			await expect.soft(textBox).toHaveScreenshot();

			await selectThenAssertTextAlignment({ page, alignment: "Center", textBox });
			await selectThenAssertTextAlignment({ page, alignment: "Right", textBox });
			await selectThenAssertTextAlignment({ page, alignment: "Justify", textBox });
		});

		await test.step("Commit changes", async () => {
			await commitChanges({ page });
		});
	});
});

test.describe("Text-Element", () => {
	devAppTest.beforeEach(async ({ page }) => {
		await openEditorStage({ page, tab: "Segment", cardName: "First Segment" });
		await dragElementToEditor({ page, elementName: "Text" });
		await page.getByTestId("element-text").dblclick();
		await writeToTextElement({ page, text: "Hello World" });
		await selectInputSource({ page, label: "Text Styles", source: PossibleInputSource.DEFAULT });

		await page.locator("#sidebar-panel").getByLabel("Close").click({ force: true });
	});

	devAppTest("Set Border Properties", async ({ page }) => {
		await test.step("Set Border Width and Color", async () => {
			await setBorderStyle(page, "Solid");
			await setBorderWidth(page, "1");
			await setBorderColor(page, "#a12a12");

			await closeDetail({ page });
			await page.getByTestId("element-text").click();
			await expect.soft(page.getByTestId("element-text")).toHaveScreenshot();
		});

		await test.step("Set Border Style to Solid", async () => {
			await page.getByTestId("element-text").dblclick();
			await setBorderStyle(page, "Solid");
			await setBorderWidth(page, "1");
			await setBorderColor(page, "#000000");

			await closeDetail({ page });
			await page.getByTestId("element-text").click();
			await expect.soft(page.getByTestId("element-text")).toHaveScreenshot();
		});

		await test.step("Set Border Style to Dotted and change Width", async () => {
			await page.getByTestId("element-text").dblclick();
			await setBorderStyle(page, "Dotted");
			await setBorderWidth(page, "0.5");
			await setBorderColor(page, "#1289a1");
			await closeDetail({ page });
			await page.getByTestId("element-text").click();
			await expect.soft(page.getByTestId("element-text")).toHaveScreenshot();
		});

		await test.step("Commit changes", async () => {
			await commitChanges({ page });
		});
	});
});

test.describe("Text-Element", () => {
	devAppTest.beforeEach(async ({ page }) => {
		await openEditorStage({ page, tab: "Segment", cardName: "First Segment" });
		await dragElementToEditor({ page, elementName: "Text" });
		await page.locator("#sidebar-panel").getByLabel("Close").click({ force: true });
	});

	devAppTest("Calculation with Code Suggestion in Text Element", async ({ page }) => {
		await test.step("Open calculation form and verify required field errors", async () => {
			await page.getByTestId("element-text").dblclick();
			await writeToTextElement({ page, text: "Hello " });
			await page.locator(RICHTEXT_EDITOR_SELECTOR).click();
			await page.keyboard.press("End");

			await page.getByRole("button", { name: "Calculation" }).click();

			await expect(page.getByText("Please specify a name.")).toBeVisible();
			await expect(page.getByText("Please select a model.")).toBeVisible();
		});

		await test.step("Fill name and document model, verify errors clear", async () => {
			await page.getByTestId("name-input").fill("Calculation");
			await page.keyboard.press("Tab");
			await expect(page.getByText("Please specify a name.")).not.toBeVisible();

			await page.getByTestId("document-model-select").selectOption("ExampleDM");
			await expect(page.getByText("Please select a model.")).not.toBeVisible();
		});

		await test.step("Add empty operation row and verify operation error badge", async () => {
			await page.locator("button").filter({ hasText: /^Add$/ }).click();
			await expect(
				page.locator('[data-role="table-body"] [data-role="badge-content"][data-type="error-badge"]')
			).toBeVisible();
		});

		await test.step("Open operation editor and trigger code suggestion", async () => {
			await scrollEditorStage(page, 0);
			await page.getByRole("button", { name: "Edit", exact: true }).click();

			const operationEditor = page.locator(".monaco-editor").nth(1);
			await operationEditor.click();
			await page.keyboard.type("[");

			const suggestListbox = page.getByRole("listbox", { name: "Suggest" });
			await expect(suggestListbox).toBeVisible();
			await suggestListbox.hover();
			await page.addStyleTag({
				content: ".monaco-editor .cursors-layer .cursor { opacity: 1 !important; animation: none !important; }",
			});
			await expect.soft(page).toHaveScreenshot({ animations: "disabled" });
		});

		await test.step("Select suggestion, blur and verify no operation errors", async () => {
			await page.getByRole("option", { name: "ExampleDM/example/numberField" }).click();

			const operationTextarea = page.locator(".monaco-editor textarea").nth(1);
			await expect(operationTextarea).toHaveValue("[ExampleDM/example/numberField]");

			await page.getByTestId("name-input").click();
			await expect(
				page.locator('[data-role="table-body"] [data-role="badge-content"][data-type="error-badge"]')
			).not.toBeVisible();
		});

		await test.step("Close form and verify text content with calculation", async () => {
			await page.getByRole("button", { name: "Back", exact: true }).click();
			await closeDetail({ page });

			await expect(page.getByTestId("element-text")).toContainText("Hello Calculation");
			await expect.soft(page.getByTestId("element-text")).toHaveScreenshot();
		});

		await test.step("Commit changes", async () => {
			await commitChanges({ page });
		});
	});

	devAppTest("Field Reference in Text Element", async ({ page }) => {
		await test.step("Open field form and verify required field errors", async () => {
			await page.getByTestId("element-text").dblclick();
			await writeToTextElement({ page, text: "Hello " });
			await page.locator(RICHTEXT_EDITOR_SELECTOR).click();
			await page.keyboard.press("End");
			await page.getByRole("button", { name: "Field" }).click();

			await expect(page.getByText("Please select a model.")).toBeVisible();
			await expect(page.getByText("Please select a field.")).toBeVisible();
		});

		await test.step("Select document model, verify model error clears but path error remains", async () => {
			await page.getByTestId("document-model-select").selectOption("ExampleDM");

			await expect(page.getByText("Please select a model.")).not.toBeVisible();
			await expect(page.getByText("Please select a field.")).toBeVisible();
		});

		await test.step("Select field from tree, verify no errors", async () => {
			await selectFieldFromTree({ tree: page.locator('[data-role="tree"]'), fieldPath: "/example/numberField" });

			await expect(page.getByText("Please select a field.")).not.toBeVisible();
			await expect(
				page.getByTestId("element-text").locator('[data-role="badge-content"][data-type="error-badge"]')
			).not.toBeVisible();
		});

		await test.step("Close form and verify text content with field", async () => {
			await page.getByRole("button", { name: "Back", exact: true }).click();
			await page.locator(RICHTEXT_EDITOR_SELECTOR).click();
			await closeDetail({ page });

			await expect(page.getByTestId("element-text")).toContainText("Field");
			await expect.soft(page.getByTestId("element-text")).toHaveScreenshot();
		});

		await test.step("Commit changes", async () => {
			await commitChanges({ page });
		});
	});

	devAppTest("Format text in Text Element", async ({ page }) => {
		await test.step("Open editor and write text", async () => {
			await page.getByTestId("element-text").dblclick();
			const editor = page.locator(RICHTEXT_EDITOR_SELECTOR);
			await editor.click();
			await editor.pressSequentially("Hello World");
		});

		await test.step("Select 'World' and apply underline", async () => {
			for (let i = 0; i < 5; i++) {
				await page.keyboard.press("Shift+ArrowLeft");
			}
			await page.getByRole("button", { name: "Underline" }).click();
		});

		await test.step("Select 'Hello' and apply bold", async () => {
			await page.keyboard.press("Control+Home");
			for (let i = 0; i < 5; i++) {
				await page.keyboard.press("Shift+ArrowRight");
			}
			await page.getByRole("button", { name: "Bold" }).click();
		});

		await test.step("Select all text and apply text color, then verify", async () => {
			await page.keyboard.press("Control+A");
			await setRichTextColor(page, "#e63946");
			await page.locator(RICHTEXT_EDITOR_SELECTOR).blur();

			await waitForInteractionSagasSettled(page);
			await expect.soft(page.locator('[data-role="rich-text-editor-wrapper"]')).toHaveScreenshot();
			await closeDetail({ page });
			await page.getByTestId("element-text").click();
			await expect.soft(page.getByTestId("element-text")).toHaveScreenshot();
		});

		await test.step("Commit changes", async () => {
			await commitChanges({ page });
		});
	});
});

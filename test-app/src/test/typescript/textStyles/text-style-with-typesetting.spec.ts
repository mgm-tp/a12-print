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
	devAppTest,
	dragElementToEditor,
	openEditorStage,
	selectInputSource,
	selectTab,
	waitForInteractionSagasSettled,
	writeToTextElement,
} from "../utils/index.js";

const TEST_TEXT = `university self-hosting éléphant Überraschung Mädchen hôtel t-shirt 123 kW 1.234 m³
100 $ 20 °C 1000 ₩ 50 % 75 € 5 Ω forêt §12 Abs. 3 12(34)(a) Hr. Schmidt Dr. Meier`;

devAppTest.use({ useCase: "003-automated-tests" });

test.describe("Text Style with Typesetting", () => {
	devAppTest("Create a text element with typesetting", async ({ page }) => {
		await test.step("Reference Typesetting Model", async () => {
			await selectTab({ page, tab: "Schema" });
			await page.locator('[data-role="collapsible-panel"]').getByText("Typesetting Model References").click();

			await page
				.getByTestId("typesetting-references-toolbar")
				.getByRole("combobox")
				.selectOption("custom_prevent_break_line_rule");

			await page.getByTestId("typesetting-references-toolbar").getByRole("button", { name: "Add" }).click();
		});

		await test.step("Create new Text Style", async () => {
			await selectTab({ page, tab: "Text Styles" });
			await page.getByRole("button", { name: "Add New Text Style" }).click();
			await page.getByTestId("text-style-card").last().click();
		});

		await test.step("Select typesetting model", async () => {
			await page.getByTestId("typesetting-model-select").click();
			await page.getByRole("option", { name: "custom_prevent_break_line_rule" }).click();
		});

		await test.step("Create text element", async () => {
			await selectTab({ page, tab: "Segment" });
			await openEditorStage({ page, tab: "Segment", cardName: "First Segment" });
			await dragElementToEditor({ page, elementName: "Text" });
			await page.getByTestId("element-text").dblclick();
			await writeToTextElement({
				page,
				text: TEST_TEXT,
			});
			await page.locator("#sidebar-panel").getByLabel("Close").click({ force: true });
			await waitForInteractionSagasSettled(page);
		});

		await test.step("Select Text Style for text element", async () => {
			await selectInputSource({ page, label: "Text Styles", source: PossibleInputSource.INPUT });
			await page.getByRole("combobox", { name: "Text Styles" }).click();
			await page.getByRole("option", { name: "New Text Style" }).click();

			await closeDetail({ page });
			const textElement = page.getByTestId("element-text");
			await textElement.click();
			await expect.soft(textElement).toHaveScreenshot();
		});
	});
});

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
import { test } from "@playwright/test";
import {
	closeDetail,
	dragAndDrop,
	dragElementToEditor,
	openEditorStage,
	devAppTest,
	expect,
	selectInputSource,
	writeToTextElement,
} from "src/test/typescript/utils";

import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/lib/input-source/input-source.js";

devAppTest.use({ useCase: "003-automated-tests" });

test.describe("Bounding Box Element", () => {
	devAppTest.beforeEach(async ({ page }) => {
		await openEditorStage({ page, tab: "Segment", cardName: "First Segment" });
		await dragElementToEditor({ page, elementName: "Bounding Box", componentName: "BoundingBox" });

		await page.locator("#sidebar-panel").getByLabel("Close").click({ force: true });
	});

	devAppTest("General interactions", async ({ page }) => {
		const boundingBox = page.locator("_react=BoundingBox");

		await test.step("Add border properties", async () => {
			await boundingBox.dblclick();
			await page.locator("_react=PositiveNumberInput[label = 'Border Width']").getByRole("spinbutton").fill("2");
			await page
				.locator("_react=CustomSelect[label = 'Border Style']")
				.getByRole("combobox")
				.selectOption("Dashed");
			await page.getByLabel("Border Color").click();
			await page.locator("input[type=color]").fill("#a12a12", { force: true });

			await closeDetail({ page });
			await expect(boundingBox).toHaveScreenshot();
		});

		await test.step("Open Wrapper Stage and Add Text Element", async () => {
			await boundingBox.hover();
			await page.getByRole("button", { name: "Edit", exact: true }).click();

			await dragElementToEditor({ page, elementName: "Text", isWrapperStage: true });
			await expect(page).toHaveEditorStageErrors(2);

			const textBox = page.locator("_react=Text");
			await textBox.dblclick();
			await selectInputSource({ page, label: "Text Styles", source: PossibleInputSource.DEFAULT });
			await writeToTextElement({ page, text: "Hello World" });

			await page.getByRole("link", { name: "First Segment" }).click();
			await expect(page).toHaveEditorStageErrors(1);
			await expect(boundingBox).toHaveScreenshot();
		});

		await test.step("Resize Bounding Box", async () => {
			await boundingBox.click();
			const resizeHandle = page.locator("_react=ResizeHandle").nth(1); // get the resize handle on the right
			await dragAndDrop(page, resizeHandle, 140, 0);
			await expect(boundingBox).toHaveScreenshot();
		});
	});
});

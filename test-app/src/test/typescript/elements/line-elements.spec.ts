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
import { devAppTest } from "src/test/typescript/utils";
import { closeDetail, dragElementToEditor, openEditorStage } from "src/test/typescript/utils/userActions/editorActions";

devAppTest.use({ useCase: "003-automated-tests" });

test.describe("Line Element", () => {
	devAppTest.beforeEach(async ({ page }) => {
		await openEditorStage({ page, tab: "Segment", cardName: "First Segment" });
		await dragElementToEditor({ page, elementName: "Line" });

		const line = page.locator("_react=Line");

		await line.dblclick();
		await page.locator("#sidebar-panel").getByLabel("Close").click({ force: true });
	});

	devAppTest("Set border properties", async ({ page }) => {
		await test.step("Set border width to 1", async () => {
			const line = page.locator("_react=Line");
			await page.locator("_react=PositiveNumberInput[label = 'Border Width']").getByRole("spinbutton").fill("1");
			await closeDetail({ page });
			await expect(line).toHaveScreenshot();
		});

		await test.step("Set border width to 16", async () => {
			const line = page.locator("_react=Line");
			await line.dblclick();
			await page.locator("_react=PositiveNumberInput[label = 'Border Width']").getByRole("spinbutton").fill("16");
			await closeDetail({ page });
			await expect(line).toHaveScreenshot();
		});

		await test.step("Set border style to dotted", async () => {
			const line = page.locator("_react=Line");
			await line.dblclick();
			await page.locator("_react=PositiveNumberInput[label = 'Border Width']").getByRole("spinbutton").fill("1");
			await page
				.locator("_react=CustomSelect[label = 'Border Style']")
				.getByRole("combobox")
				.selectOption("Dotted");
			await closeDetail({ page });
			await expect(line).toHaveScreenshot();
		});

		await test.step("Set border style to dashed", async () => {
			const line = page.locator("_react=Line");
			await line.dblclick();
			await page.locator("_react=PositiveNumberInput[label = 'Border Width']").getByRole("spinbutton").fill("1");
			await page
				.locator("_react=CustomSelect[label = 'Border Style']")
				.getByRole("combobox")
				.selectOption("Dashed");
			await closeDetail({ page });
			await expect(line).toHaveScreenshot();
		});

		await test.step("Set border color to any color", async () => {
			const line = page.locator("_react=Line");
			await line.dblclick();
			await page.locator("_react=PositiveNumberInput[label = 'Border Width']").getByRole("spinbutton").fill("1");
			await page.getByLabel("Border Color").click();
			await page.locator("input[type=color]").fill("#a12a12", { force: true });

			await closeDetail({ page });
			await expect(line).toHaveScreenshot();
		});
	});
});

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

import { TestTag } from "../utils/tag.js";
import { expect, devAppTest } from "../utils/index.js";

devAppTest.use({ useCase: "001-new-print-model" });

test.describe("Example for stores", () => {
	devAppTest(
		"Screenshot",
		{
			tag: [TestTag.Screenshot],
		},
		async ({ page }) => {
			await test.step("Page loads", async () => {
				await expect(page).toHaveTitle(/Print Test App/);
			});

			await test.step("Snapshots of General", async () => {
				const generalTabButton = page.getByRole("tab", { name: "General" });
				await generalTabButton.click();

				const textArea = page.locator("textarea");
				await expect(textArea).toHaveText("Description");
			});
		}
	);
});

test.describe("Example tests for snapshots of the entire app", () => {
	devAppTest("Tab Screenshots", async ({ page }) => {
		await test.step("General tab matches screenshot", async () => {
			await page.getByRole("tab", { name: "General" }).click();
			await expect.soft(page.getByRole("main").first()).toHaveScreenshot();
		});

		await test.step("Textstyle tab matches screenshots", async () => {
			await page.getByRole("tab", { name: "Text Styles" }).click();
			await expect.soft(page.getByRole("main").first()).toHaveScreenshot();
		});
	});
});

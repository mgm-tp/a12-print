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

import { closeElementLibrary, devAppTest, expect, openEditorStage, openElementLibrary } from "../utils/index.js";

devAppTest.use({ useCase: "003-automated-tests" });

/** The elements offered by the toolbox, see TOOLBOX_ELEMENTS in the editor component. */
const TOOLBOX_ELEMENT_COUNT = 13;

test.describe("Element Library", () => {
	devAppTest.beforeEach(async ({ page }) => {
		await openEditorStage({ page, tab: "Segment", cardName: "First Segment" });
	});

	devAppTest("Opens and closes from the toolbar", async ({ page }) => {
		const elementLibrary = page.getByTestId("element-library-form");

		await test.step("The library is closed until the toolbar button is clicked", async () => {
			await expect(elementLibrary).toBeHidden();
		});

		await test.step("The toolbar button opens it in the detail form panel", async () => {
			await openElementLibrary(page);

			await expect(elementLibrary.getByRole("heading", { name: "Element Library" })).toBeVisible();
			await expect(
				elementLibrary.getByTestId("element-library-items").getByTestId("element-library-item")
			).toHaveCount(TOOLBOX_ELEMENT_COUNT);
		});

		await test.step("The same toolbar button closes it again", async () => {
			await page.getByLabel("Open/Close Element Library").click();

			await expect(elementLibrary).toBeHidden();
		});

		await test.step("The form header close button also closes it", async () => {
			await openElementLibrary(page);
			await closeElementLibrary(page);

			await expect(elementLibrary).toBeHidden();
		});
	});

	devAppTest("Offers no Element Fragment Library without referenced fragments", async ({ page }) => {
		const elementLibrary = await openElementLibrary(page);

		await expect(elementLibrary.getByTestId("element-library-items")).toBeVisible();
		await expect(elementLibrary.getByTestId("element-fragment-library-items")).toBeHidden();
	});

	devAppTest("Collapses and expands the Elements panel", async ({ page }) => {
		const elementLibrary = await openElementLibrary(page);
		const panelTitle = elementLibrary.getByText("Elements", { exact: true });

		await panelTitle.click();
		await expect(elementLibrary.getByTestId("element-library-items")).toBeHidden();

		await panelTitle.click();
		await expect(
			elementLibrary.getByTestId("element-library-items").getByTestId("element-library-item")
		).toHaveCount(TOOLBOX_ELEMENT_COUNT);
	});
});

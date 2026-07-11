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
	expect,
	devAppTest,
	openEditorStage,
	commitChanges,
	closeDetail,
	setPageBreakBehavior,
} from "../utils/index.js";

devAppTest.use({ useCase: "003-automated-tests" });

test.describe("Commit View", () => {
	devAppTest.beforeEach(async ({ page }) => {
		await openEditorStage({ page, tab: "Segment", cardName: "Copy&Paste" });
	});

	devAppTest("Jump Link and Selecting Commits", async ({ page }) => {
		const table = page.getByTestId("element-table");
		const commitView = page.locator("#sidebar");
		const detailFormContainer = page.getByTestId("detail-form-container");
		const goToIssueButton = commitView.getByTitle("Go to Issue");
		const main = page.getByRole("main").first();
		const dateCells = page.getByRole("cell", { name: /\d+\/\d+\/\d+/ });

		await test.step("Navigate into nested area", async () => {
			const area = page.getByTestId("element-area").first();
			await area.hover();
			await page.getByRole("button", { name: "Edit", exact: true }).click();

			const nestedArea = page.getByText("InformationColumnColumn");
			await nestedArea.hover();
			await page.getByRole("button", { name: "Edit", exact: true }).click();
		});
		await test.step("Add Error to Table Default Stage", async () => {
			await table.dblclick();

			const detailView = page.getByTestId("detail-form-container");
			const addButton = detailView.getByRole("button", { name: "Add" });
			await addButton.click();
		});
		await test.step("Add Error to Table Layout Stage", async () => {
			await page.getByRole("button", { name: "Layout" }).click();
			await table.dblclick({ force: true });
			await setPageBreakBehavior(page, null);
		});
		await test.step("Close both Wrapper stages", async () => {
			await closeDetail({ page });
			await page.getByRole("link", { name: "Copy&Paste" }).click({ force: true });
			await page.getByRole("link", { name: "Copy&Paste" }).click({ force: true });
			await expect(page).toHaveEditorStageErrors(1);
		});
		await test.step("Go to commit view, expect both errors", async () => {
			await commitChanges({ page, hasErrors: true });
			await expect.soft(main).toHaveScreenshot({ mask: [dateCells] });

			const errorItem = commitView
				.locator('[data-role="tree-node-name"]', { hasText: "Please specify a value" })
				.first();
			await expect(errorItem).toBeVisible();
			const errorItem2 = commitView
				.locator('[data-role="tree-node-name"]', { hasText: "This field is required." })
				.first();
			await expect(errorItem2).toBeVisible();
			await expect(goToIssueButton).toHaveCount(3);

			await page.getByRole("cell", { name: "Commit Commit" }).first().click();
			await expect(errorItem).not.toBeVisible();
			await expect(errorItem2).toBeVisible();
			await expect(goToIssueButton).toHaveCount(2);

			await page.getByRole("cell", { name: "Commit Commit" }).click();
			await expect(errorItem).not.toBeVisible();
			await expect(errorItem2).not.toBeVisible();
			await expect(goToIssueButton).toHaveCount(1);

			await expect.soft(main).toHaveScreenshot({ mask: [dateCells] });
		});
		await test.step("Jump to Error in default view", async () => {
			await page.getByRole("cell", { name: "Pending Pending" }).first().click();
			await page.getByRole("cell", { name: "Pending Pending" }).click();

			await expect(goToIssueButton).toHaveCount(3);
			await goToIssueButton.nth(1).click();

			await expect(detailFormContainer).toBeVisible();
			await expect.soft(main).toHaveScreenshot();
		});

		await test.step("Close both Wrapper stages again", async () => {
			await closeDetail({ page });
			await page.getByRole("link", { name: "Copy&Paste" }).click({ force: true });
			await page.getByRole("link", { name: "Copy&Paste" }).click({ force: true });
			await page.getByRole("button", { name: "Default" }).click();
			await expect(page).toHaveEditorStageErrors(1);
		});

		await test.step("Jump to Error in layout view", async () => {
			await commitChanges({ page, hasErrors: true });

			await expect(goToIssueButton).toHaveCount(3);
			await goToIssueButton.nth(0).click();

			await expect(detailFormContainer).toBeVisible();
			await expect.soft(main).toHaveScreenshot();
		});
	});
});

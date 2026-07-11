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
	commitChanges,
	dragAndDrop,
	dragElementToEditor,
	openEditorStage,
	devAppTest,
	expect,
	setBorderColor,
	setBorderStyle,
	setBorderWidth,
} from "../utils/index.js";

devAppTest.use({ useCase: "003-automated-tests" });

test.describe("Area Element", () => {
	devAppTest.beforeEach(async ({ page }) => {
		await openEditorStage({ page, tab: "Segment", cardName: "First Segment" });
		await dragElementToEditor({ page, elementName: "Area", componentName: "Area" });

		await page.locator("#sidebar-panel").getByLabel("Close").click({ force: true });
	});

	devAppTest("General interactions", async ({ page }) => {
		const area = page.getByTestId("element-area");

		await test.step("Add border properties", async () => {
			await area.dblclick();
			await setBorderStyle(page, "Dashed");
			await setBorderWidth(page, "2");
			await setBorderColor(page, "#a12a12");

			await closeDetail({ page });
			await area.click();
			await expect.soft(area).toHaveScreenshot();
		});

		await test.step("Open Wrapper Stage and increase the area stage height", async () => {
			await area.hover();
			await page.getByRole("button", { name: "Edit", exact: true }).click();

			const resizeHandle = page.getByTestId("resize-handle").nth(0);
			await dragAndDrop(page, resizeHandle, 0, 100);
		});

		await test.step("Add Table Element", async () => {
			await dragElementToEditor({
				page,
				elementName: "Table",
				componentName: "ResizeHandle",
				isWrapperStage: true,
				targetPosition: {
					x: 10,
					y: 220,
				},
			});
			await expect(page).toHaveEditorStageErrors(2);
		});

		await test.step("Decrease the area stage height by dragging the bottom handler of the area stage", async () => {
			const resizeHandle = page.getByTestId("resize-handle").nth(0);

			const parent = resizeHandle.locator("..");
			let boundingBox = await parent.boundingBox();

			expect(boundingBox?.height).toBe(300);

			await dragAndDrop(page, resizeHandle, 0, -100);
			boundingBox = await parent.boundingBox();

			// the new size should be the same because the area stage height cannot be smaller than the bottom of the table element
			expect(boundingBox?.height).toBe(300);

			// resizing to the bottom of the table element should work
			await dragAndDrop(page, resizeHandle, 0, -67);
			boundingBox = await parent.boundingBox();
			expect(boundingBox?.height).toBe(232);

			await expect.soft(parent).toHaveScreenshot();
		});

		await test.step("Commit changes", async () => {
			await page.getByRole("link", { name: "First Segment" }).click();
			await commitChanges({ page, hasErrors: true });
		});
	});
});

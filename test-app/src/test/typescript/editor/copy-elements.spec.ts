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
	devAppTest,
	openEditorStage,
	selectMultipleElements,
	pasteAtPosition,
	setZoomFactor,
	expect,
	elementLocator,
	setElementPosition,
} from "../utils/index.js";

devAppTest.use({ useCase: "003-automated-tests" });

test.describe("Select Multiple Elements", () => {
	devAppTest.beforeEach(async ({ page }) => {
		await openEditorStage({ page, tab: "Segment", cardName: "Copy&Paste" });
	});

	devAppTest("Copy and paste multiple elements", async ({ page }) => {
		await test.step("Select and copy multiple elements", async () => {
			await selectMultipleElements({
				page,
				elements: ["Area", "Switch", "Listing"],
			});
			await page.keyboard.press("Control+c");
		});

		await test.step("Paste on the next page using context menu", async () => {
			const targetXCm = 1;
			const targetYCm = 38;
			const targetXPx = targetXCm * 37.8;
			const targetYPx = targetYCm * 37.8;

			const editorContainer = page.getByTestId("editor-container");
			const editorStage = page.getByTestId("editor-stage");

			const containerBox = await editorContainer.boundingBox();
			const editorBox = await editorStage.boundingBox();

			if (!containerBox || !editorBox) {
				throw new Error("Editor container or stage not found");
			}

			await editorContainer.evaluate((element, scrollY) => {
				element.scrollTop = scrollY - element.clientHeight / 2;
			}, targetYPx);

			const scrollTop = await editorContainer.evaluate(element => element.scrollTop);
			const clickX = editorBox.x + targetXPx;
			const clickY = containerBox.y + targetYPx - scrollTop;

			await pasteAtPosition({ page, clickX, clickY });

			await setZoomFactor({ page, zoomValue: "0.5" });

			await editorContainer.evaluate(element => {
				element.scrollTop = 600;
			});
			const newArea = elementLocator(page, "Area").nth(2); // 0=original area, 1=nested area, 2=copied area
			await newArea.click();
			await setElementPosition({ page, x: 1.2, y: 5.5 });
			await expect.soft(editorStage).toHaveScreenshot();
		});
	});

	devAppTest("Copy elements and paste into a new segment", async ({ page }) => {
		await test.step("Select and copy multiple elements", async () => {
			await selectMultipleElements({
				page,
				elements: ["Area", "Switch", "Listing"],
			});
			await page.keyboard.press("Control+c");
		});

		await test.step("Create a new segment", async () => {
			const segmentToolbar = page.getByTestId("segment-toolbar");
			const segmentNameInput = segmentToolbar.locator("input[type='text']");
			await segmentNameInput.click();
			await segmentNameInput.fill("New Segment");

			const addButton = segmentToolbar.getByRole("button", { name: "Add" });
			await addButton.click();
		});

		await test.step("Open the new segment", async () => {
			await openEditorStage({ page, tab: "Segment", cardName: "New Segment" });
		});

		await test.step("Paste elements in the new segment", async () => {
			const editorContainer = page.getByTestId("editor-container");
			const editorStage = page.getByTestId("editor-stage");

			const containerBox = await editorContainer.boundingBox();
			const editorBox = await editorStage.boundingBox();

			if (!containerBox || !editorBox) {
				throw new Error("Editor container or stage not found");
			}

			const clickX = editorBox.x + 100;
			const clickY = containerBox.y + 100;

			await pasteAtPosition({ page, clickX, clickY });

			await setZoomFactor({ page, zoomValue: "0.5" });

			await expect.soft(editorStage).toHaveScreenshot();
		});
	});
});

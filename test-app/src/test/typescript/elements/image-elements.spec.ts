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
import path from "path";
import { fileURLToPath } from "url";

import type { Page } from "@playwright/test";
import test, { expect } from "@playwright/test";

import {
	closeDetail,
	commitChanges,
	dragElementToEditor,
	openEditorStage,
	devAppTest,
	selectFieldFromTree,
	uploadImage,
	waitForInteractionSagasSettled,
} from "../utils/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

devAppTest.use({ useCase: "003-automated-tests" });

test.describe("Image-Element", () => {
	devAppTest.beforeEach(async ({ page }) => {
		await addMgmLogo({ page });
	});

	devAppTest("Adjust Properties for image source attachment", async ({ page }) => {
		await test.step("Change alternative Text", async () => {
			const image = page.getByTestId("element-image");
			await image.dblclick();
			await page.getByTestId("image-alt-text").fill("Hello World!");
			await page.keyboard.press("Enter");
			await waitForInteractionSagasSettled(page);

			await closeDetail({ page });
			await expect(image).toHaveAttribute("alt", "Hello World!");
		});

		await test.step("Change Width and Height", async () => {
			const image = page.getByTestId("element-image");
			await expect.soft(image).toHaveScreenshot("baseImage.png");

			await image.dblclick();
			await page.getByTestId("image-height-input").fill("18");
			await page.keyboard.press("Enter");
			await page.getByTestId("image-width-input").fill("50");
			await page.keyboard.press("Enter");
			await closeDetail({ page });
			await image.click();
			await expect.soft(image).toHaveScreenshot();

			await image.dblclick();
			await page.getByTestId("image-height-input").clear();
			await page.keyboard.press("Enter");
			await page.getByTestId("image-width-input").clear();
			await page.keyboard.press("Enter");
			await closeDetail({ page });
			await image.click();
			await expect.soft(image).toHaveScreenshot("baseImage.png");
		});

		await test.step("Should retain width", async () => {
			const image = page.getByTestId("element-image");

			await image.dblclick();

			const widthPromise = async () => page.getByTestId("image-width-input").inputValue();

			const originalWidth = await widthPromise();

			await page.getByTestId("image-height-input").fill("18");
			await page.keyboard.press("Enter");

			const secondWidth = await widthPromise();
			expect(secondWidth).toBe(originalWidth!);
		});

		await test.step("Commit changes", async () => {
			await closeDetail({ page });
			await commitChanges({ page });
		});
	});
});

test.describe("Image-Element", () => {
	devAppTest.beforeEach(async ({ page }) => {
		await openEditorStage({ page, tab: "Segment", cardName: "First Segment" });
		await dragElementToEditor({ page, elementName: "Image" });

		const image = page.getByTestId("element-image");

		await image.dblclick();
		await page.locator("#sidebar-panel").getByLabel("Close").click({ force: true });

		await page.getByTestId("image-src-type-dynamic").click();

		await page.getByTestId("document-model-select").selectOption({ index: 1 });

		await selectFieldFromTree({
			tree: page.locator('[data-role="tree"]'),
			fieldPath: "/example/imageField/content",
		});

		await closeDetail({ page });
	});

	devAppTest("Adjust properties for image source field", async ({ page }) => {
		await test.step("Change Alternative Text", async () => {
			const image = page.getByTestId("element-image");
			await image.dblclick();
			await page.getByTestId("image-alt-text").fill("Hello World!");
			await page.keyboard.press("Enter");
			await waitForInteractionSagasSettled(page);

			await closeDetail({ page });
		});

		await test.step("Change Height and Width", async () => {
			const image = page.getByTestId("element-image");
			await image.dblclick();
			await page.getByTestId("image-height-input").fill("18");
			await page.keyboard.press("Enter");
			await page.getByTestId("image-width-input").fill("50");
			await page.keyboard.press("Enter");
			await closeDetail({ page });
			await image.click();
			await expect.soft(image).toHaveScreenshot();
		});

		await test.step("Commit changes", async () => {
			await commitChanges({ page });
		});
	});
});

const addMgmLogo = async ({ page }: { page: Page }) => {
	await openEditorStage({ page, tab: "Segment", cardName: "First Segment" });
	await waitForInteractionSagasSettled(page);
	await dragElementToEditor({ page, elementName: "Image" });

	const image = page.getByTestId("element-image");

	await image.dblclick();
	await page.locator("#sidebar-panel").getByLabel("Close").click({ force: true });
	await uploadImage({ page, imageFilePath: path.join(__dirname, "resources/test.png") });
	await expect(image).toHaveAttribute("src");
	await closeDetail({ page });
};

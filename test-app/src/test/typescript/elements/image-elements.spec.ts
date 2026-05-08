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

import test, { expect, Page } from "@playwright/test";
import {
	closeDetail,
	dragElementToEditor,
	openEditorStage,
	devAppTest,
	selectFieldFromTree,
	uploadImage,
} from "src/test/typescript/utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

devAppTest.use({ useCase: "003-automated-tests" });

test.describe("Image-Element", () => {
	devAppTest.beforeEach(async ({ page }) => {
		await addMgmLogo({ page });
	});

	devAppTest("Adjust Properties for image source attachment", async ({ page }) => {
		await test.step("Change alternative Text", async () => {
			const image = page.locator("_react=Image");
			await image.dblclick();
			await page
				.locator("_react=CustomTextLineStateful[label = 'Alternative Text']")
				.getByRole("textbox")
				.first()
				.fill("Hello World!");

			await closeDetail({ page });
			await expect(image).toHaveAttribute("alt", "Hello World!");
		});

		await test.step("Change Width and Height", async () => {
			const image = page.locator("_react=Image");
			await expect(image).toHaveScreenshot("baseImage.png");

			await image.dblclick();
			await page
				.locator("_react=PositiveNumberInput[label = 'Height']")
				.getByRole("spinbutton")
				.nth(1)
				.fill("18");
			await page.keyboard.press("Enter");
			await page.locator("_react=PositiveNumberInput[label = 'Width']").getByRole("spinbutton").nth(1).fill("50");
			await page.keyboard.press("Enter");
			await closeDetail({ page });
			await expect(image).toHaveScreenshot();

			await image.dblclick();
			await page.locator("_react=PositiveNumberInput[label = 'Height']").getByRole("spinbutton").nth(1).clear();
			await page.keyboard.press("Enter");
			await page.locator("_react=PositiveNumberInput[label = 'Width']").getByRole("spinbutton").nth(1).clear();
			await page.keyboard.press("Enter");
			await closeDetail({ page });
			await expect(image).toHaveScreenshot("baseImage.png");
		});

		await test.step("Should retain width", async () => {
			const image = page.locator("_react=Image");

			await image.dblclick();

			const widthPromise = async () =>
				page.locator("_react=TextLineStateless[label = 'Width']").getByRole("spinbutton").nth(1).inputValue();

			const originalWidth = await widthPromise();

			await page
				.locator("_react=PositiveNumberInput[label = 'Height']")
				.getByRole("spinbutton")
				.nth(1)
				.fill("18");
			await page.keyboard.press("Enter");

			const secondWidth = await widthPromise();
			expect(secondWidth).toBe(originalWidth!);
		});
	});
});

test.describe("Image-Element", () => {
	devAppTest.beforeEach(async ({ page }) => {
		await openEditorStage({ page, tab: "Segment", cardName: "First Segment" });
		await dragElementToEditor({ page, elementName: "Image" });

		const image = page.locator("_react=Image");

		await image.dblclick();
		await page.locator("#sidebar-panel").getByLabel("Close").click({ force: true });

		await page
			.locator("_react=ImageSourceType")
			.getByRole("radiogroup")
			.getByRole("radio", { name: "Field" })
			.click();

		await page
			.locator("_react=CustomSelect[label = 'Document Model']")
			.getByRole("combobox")
			.selectOption({ index: 1 });

		await selectFieldFromTree({ tree: page.locator("_react=Tree"), fieldPath: "/example/imageField/content" });

		await closeDetail({ page });
	});

	devAppTest("Adjust properties for image source field", async ({ page }) => {
		await test.step("Change Alternative Text", async () => {
			const image = page.locator("_react=Image");
			await image.dblclick();
			await page
				.locator("_react=CustomTextLineStateful[label = 'Alternative Text']")
				.getByRole("textbox")
				.first()
				.fill("Hello World!");

			await closeDetail({ page });
		});

		await test.step("Change Height and Width", async () => {
			const image = page.locator("_react=Image");
			await image.dblclick();
			await page
				.locator("_react=PositiveNumberInput[label = 'Height']")
				.getByRole("spinbutton")
				.nth(1)
				.fill("18");
			await page.keyboard.press("Enter");
			await page.locator("_react=PositiveNumberInput[label = 'Width']").getByRole("spinbutton").nth(1).fill("50");
			await page.keyboard.press("Enter");
			await closeDetail({ page });
			await expect(image).toHaveScreenshot();
		});
	});
});

test.describe("Image-Element", () => {
	devAppTest.beforeEach(async ({ page }) => {
		await addMgmLogo({ page });
	});

	devAppTest("Interactions in the image form", async ({ page }) => {
		await test.step("Download the image", async () => {
			const image = page.locator("_react=Image");
			await image.dblclick();

			await page.locator("_react=PopUpMenu").click();
			const downloadPromise = page.waitForEvent("download");
			await page.getByRole("button", { name: "Download" }).click();
			const download = await downloadPromise;
			expect(download.suggestedFilename()).toBe("test.png");
		});

		await test.step("Delete the image", async () => {
			const image = page.locator("_react=Image");
			await image.dblclick();

			await page.locator("_react=PopUpMenu").click();
			await page.getByRole("button", { name: "Delete", exact: true }).click();
			await expect(page.getByRole("main").first()).toHaveScreenshot();
			await closeDetail({ page });
		});

		await test.step("Replace the image", async () => {
			const image = page.locator("_react=Image");
			await image.dblclick();
			await uploadImage({ page, imageFilePath: path.join(__dirname, "resources/test.png") });
			await page.locator("_react=PopUpMenu").click();
			const fileChooserPromise = page.waitForEvent("filechooser");
			await page.getByRole("button", { name: "Replace" }).click();
			const fileChooser = await fileChooserPromise;

			await fileChooser.setFiles(path.join(__dirname, "resources/tree.jpg"));
			await expect(page.getByRole("main").first()).toHaveScreenshot();
		});
	});
});

const addMgmLogo = async ({ page }: { page: Page }) => {
	await openEditorStage({ page, tab: "Segment", cardName: "First Segment" });
	await dragElementToEditor({ page, elementName: "Image" });

	const image = page.locator("_react=Image");

	await image.dblclick();
	await page.locator("#sidebar-panel").getByLabel("Close").click({ force: true });
	await uploadImage({ page, imageFilePath: path.join(__dirname, "resources/test.png") });
	await closeDetail({ page });
};

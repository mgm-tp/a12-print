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
	devAppTest,
	dragElementToEditor,
	openEditorStage,
	selectMultipleElements,
	setBorderStyle,
	setBorderWidth,
	waitForInteractionSagasSettled,
	writeToTextElement,
	expect,
} from "../utils/index.js";

devAppTest.use({ useCase: "003-automated-tests" });

test.describe("Group Elements into Area", () => {
	devAppTest.beforeEach(async ({ page }) => {
		await openEditorStage({ page, tab: "Segment", cardName: "First Segment" });
	});

	devAppTest("Group a Text and a Line element into an Area", async ({ page }) => {
		await test.step("Drop a Text element and add content", async () => {
			await dragElementToEditor({
				page,
				elementName: "Text",
				normalizePosition: { x: 5, y: 3 },
			});
			const textBox = page.getByTestId("element-text");
			await textBox.dblclick();
			await writeToTextElement({ page, text: "Hello World" });
			await closeDetail({ page });
		});

		await test.step("Drop a Line element and set border properties", async () => {
			await dragElementToEditor({
				page,
				elementName: "Line",
				normalizePosition: { x: 6, y: 6 },
			});
			const line = page.getByTestId("element-line");
			await line.dblclick();
			await setBorderStyle(page, "Solid");
			await setBorderWidth(page, "2");
			await closeDetail({ page });
		});

		await test.step("Select both elements and group into Area", async () => {
			await selectMultipleElements({
				page,
				elements: ["Text", "Line"],
			});

			await page.keyboard.press("Control+g");
			await waitForInteractionSagasSettled(page);
		});

		await test.step("Verify grouped Area on stage has no errors", async () => {
			await expect(page).toHaveEditorStageErrors(0);
		});

		await test.step("Increase Area height by 1 cm via quick edit bar", async () => {
			const area = page.getByTestId("element-area");
			await area.click();

			const heightInput = page.getByPlaceholder("Height");
			const currentHeight = await heightInput.inputValue();
			const newHeight = parseFloat(currentHeight) + 1;
			await heightInput.fill(String(newHeight));
			await heightInput.blur();
			await waitForInteractionSagasSettled(page);

			await expect.soft(area).toHaveScreenshot();
		});
	});
});

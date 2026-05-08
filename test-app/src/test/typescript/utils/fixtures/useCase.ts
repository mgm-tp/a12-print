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
import { test as base } from "@playwright/test";

import { expect } from "..";

import { TestTag } from "../tag";

type UseCaseOptions = {
	useCase: string;
};

export const useCaseTest = base.extend<UseCaseOptions & { forEachTest: void }>({
	useCase: ["", { option: true }],
	forEachTest: [
		async ({ page, useCase }, use, testInfo) => {
			await page.goto("");
			const printModel = page.getByText(useCase);
			await printModel.click();
			await page.getByLabel("Print Editorprint").locator("button").filter({ hasText: "close" }).click();
			await use();
			if (testInfo.tags.includes(TestTag.Screenshot)) {
				await expect(page.getByRole("main").first()).toHaveScreenshot();
			}
			if (testInfo.tags.includes(TestTag.Store)) {
				await expect(page).toMatchStore();
			}
		},
		{ auto: true },
	],
});

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
import type { Locator, Page } from "@playwright/test";
import { test } from "@playwright/test";

import {
	expect,
	devAppTest,
	selectTab,
	commitChanges,
	waitForInteractionSagasSettled,
	confirmUnlinkDialog,
} from "../utils/index.js";

devAppTest.use({ useCase: "003-automated-tests" });

const FRAGMENT_MODEL = "printFragment";
const FRAGMENT_SECTION = "SectionLandscape1";
const FRAGMENT_TEXT_STYLE_WITH_TYPESETTING = "FragmentTextStyleWithTypesetting";
const TYPESETTING_MODEL = "Typesetting_for_fragment";

const selectContainingOption = (page: Page, optionLabel: string) =>
	page
		.getByRole("combobox")
		.filter({ has: page.getByRole("option", { name: optionLabel, exact: true }) })
		.first();

const referencedSectionCard = (page: Page) =>
	page.getByTestId("section-card").filter({ has: page.getByPlaceholder("Referenced section fragment") });

const unlinkedSectionCard = (page: Page) =>
	page
		.getByTestId("section-card")
		.filter({ hasText: "Landscape" })
		.filter({ has: page.getByPlaceholder("Section title") });

const textStyleCard = (page: Page, name: string) => page.getByTestId("text-style-card").filter({ hasText: name });

const clickUnlink = async (page: Page, card: Locator) => {
	await card.getByRole("button", { name: "Open Menu" }).click();
	await page.getByRole("button", { name: "Unlink" }).click();
};

const addFragmentModelReference = async (page: Page) => {
	await selectTab({ page, tab: "Schema" });
	await page.getByText("Fragment Model References", { exact: true }).click();
	await selectContainingOption(page, FRAGMENT_MODEL).selectOption({ label: FRAGMENT_MODEL });
	await page.getByRole("button", { name: "Add", exact: true }).click();
	await page.getByRole("button", { name: "Apply", exact: true }).click();
	await waitForInteractionSagasSettled(page);
};

test.describe("Fragment unlink (hard copy)", () => {
	test.describe.configure({ mode: "serial" });

	devAppTest("unlinks a referenced section into the print model", async ({ page }) => {
		await addFragmentModelReference(page);

		await test.step("Reference a section", async () => {
			await selectTab({ page, tab: "Section" });
			await selectContainingOption(page, FRAGMENT_SECTION).selectOption({ label: FRAGMENT_SECTION });
			await waitForInteractionSagasSettled(page);
			await expect(page.getByPlaceholder("Referenced section fragment")).toHaveValue(FRAGMENT_SECTION);
		});

		await test.step("Unlink the section", async () => {
			await clickUnlink(page, referencedSectionCard(page));
			await confirmUnlinkDialog(page);
			await waitForInteractionSagasSettled(page);
			await expect(page.getByPlaceholder("Referenced section fragment")).toHaveCount(0);
			await expect(unlinkedSectionCard(page).getByPlaceholder("Section title")).toHaveValue(FRAGMENT_SECTION);
		});

		await test.step("The unlink cannot be undone", async () => {
			await expect(page.getByLabel("Undo")).toBeDisabled();
		});

		await test.step("Commit the unlink", async () => {
			await commitChanges({ page });
		});
	});

	devAppTest("unlinking a text style with a typesetting dependency adds it to the header", async ({ page }) => {
		await addFragmentModelReference(page);

		await test.step("Reference the text style", async () => {
			await selectTab({ page, tab: "Text Styles" });
			await selectContainingOption(page, FRAGMENT_TEXT_STYLE_WITH_TYPESETTING).selectOption({
				label: FRAGMENT_TEXT_STYLE_WITH_TYPESETTING,
			});
			await waitForInteractionSagasSettled(page);
			await expect(
				page.getByTestId("text-style-card").filter({ hasText: FRAGMENT_TEXT_STYLE_WITH_TYPESETTING })
			).toBeVisible();
		});

		await test.step("Unlink it and confirm the added dependency", async () => {
			await clickUnlink(page, textStyleCard(page, FRAGMENT_TEXT_STYLE_WITH_TYPESETTING));
			await expect(page.getByText("Unlinking adds dependencies")).toBeVisible();
			await expect(page.getByText(TYPESETTING_MODEL)).toBeVisible();
			await confirmUnlinkDialog(page);
			await waitForInteractionSagasSettled(page);
		});

		await test.step("The typesetting reference now appears in the Schema tab", async () => {
			await selectTab({ page, tab: "Schema" });
			await page.getByText("Typesetting Model References", { exact: true }).click();
			await expect(
				page
					.locator('[data-role="collapsible-panel"]')
					.filter({ hasText: "Typesetting Model References" })
					.getByRole("textbox")
			).toHaveValue(TYPESETTING_MODEL);
			await selectTab({ page, tab: "Text Styles" });
		});

		await test.step("The unlink cannot be undone", async () => {
			await expect(page.getByLabel("Undo")).toBeDisabled();
		});
	});

	devAppTest("declining the dependency dialog changes nothing", async ({ page }) => {
		await addFragmentModelReference(page);

		await selectTab({ page, tab: "Text Styles" });
		await selectContainingOption(page, FRAGMENT_TEXT_STYLE_WITH_TYPESETTING).selectOption({
			label: FRAGMENT_TEXT_STYLE_WITH_TYPESETTING,
		});
		await waitForInteractionSagasSettled(page);

		await clickUnlink(page, textStyleCard(page, FRAGMENT_TEXT_STYLE_WITH_TYPESETTING));
		await expect(page.getByText("Unlinking adds dependencies")).toBeVisible();
		await page.getByRole("button", { name: "Cancel", exact: true }).click();

		await expect(
			page.getByTestId("text-style-card").filter({ hasText: FRAGMENT_TEXT_STYLE_WITH_TYPESETTING })
		).toBeVisible();
		await selectTab({ page, tab: "Schema" });
		await expect(page.getByText(TYPESETTING_MODEL)).toHaveCount(0);
	});

	devAppTest("the original fragment is not modified", async ({ page }) => {
		await addFragmentModelReference(page);

		await test.step("Unlink a section", async () => {
			await selectTab({ page, tab: "Section" });
			await selectContainingOption(page, FRAGMENT_SECTION).selectOption({ label: FRAGMENT_SECTION });
			await waitForInteractionSagasSettled(page);
			await clickUnlink(page, referencedSectionCard(page));
			await confirmUnlinkDialog(page);
			await waitForInteractionSagasSettled(page);
		});

		await test.step("The fragment's definitions are still all offerable as new references", async () => {
			await expect(
				page
					.getByRole("combobox")
					.filter({ has: page.getByRole("option", { name: FRAGMENT_SECTION, exact: true }) })
			).toHaveCount(1);
		});
	});
});

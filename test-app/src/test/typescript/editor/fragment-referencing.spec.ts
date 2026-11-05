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

import { expect, devAppTest, selectTab, commitChanges, waitForInteractionSagasSettled } from "../utils/index.js";

devAppTest.use({ useCase: "003-automated-tests" });

// The fragment print model (007-fragment-model) and its definitions available in use-case 003.
const FRAGMENT_MODEL = "printFragment";
const FRAGMENT_WATERMARK = "WatermarkPortrait1";
const FRAGMENT_SECTION = "SectionLandscape1";
const FRAGMENT_SEGMENT = "SegmentPortrait1";
const FRAGMENT_TEXT_STYLE = "FragmentTextStyle1";

/**
 * The reference selects (watermark/section/text style + the schema fragment select) are native
 * `<select>` elements (A12 `Select` renders native unless `useCustomView` is set). We locate the
 * right one unambiguously by the option it contains, then pick it via `selectOption`.
 */
const selectContainingOption = (page: Page, optionLabel: string) =>
	page
		.getByRole("combobox")
		.filter({ has: page.getByRole("option", { name: optionLabel, exact: true }) })
		.first();

/**
 * Undo the last interaction, then redo it,
 * asserting a element's presence via the given locator each time.
 */
const assertUndoRedo = async (page: Page, shouldExistLocator: Locator) => {
	const undoButton = page.getByLabel("Undo");
	const redoButton = page.getByLabel("Redo");

	await expect(shouldExistLocator).toHaveCount(1);
	// The interaction must actually be undoable in the current view before we undo.
	await expect(undoButton).toBeEnabled();
	await undoButton.click();
	await waitForInteractionSagasSettled(page);
	// If the undo really fired, redo becomes available (diagnostic + sync).
	await expect(redoButton).toBeEnabled();
	await expect(shouldExistLocator).toHaveCount(0);
	await redoButton.click();
	await waitForInteractionSagasSettled(page);
	await expect(shouldExistLocator).toHaveCount(1);
};

test.describe("Fragment referencing", () => {
	devAppTest(
		"references a watermark, section, segment and text style from a fragment model and commits",
		async ({ page }) => {
			await test.step("Add a fragment model reference in the Schema tab", async () => {
				await selectTab({ page, tab: "Schema" });
				// Expand the "Fragment Model References" collapsible (collapsed by default).
				await page.getByText("Fragment Model References", { exact: true }).click();
				await selectContainingOption(page, FRAGMENT_MODEL).selectOption({ label: FRAGMENT_MODEL });
				await page.getByRole("button", { name: "Add", exact: true }).click();
				// Referencing a fragment model is not undoable -> confirm the warning dialog.
				await page.getByRole("button", { name: "Apply", exact: true }).click();
				await waitForInteractionSagasSettled(page);
			});

			await test.step("Reference a text style", async () => {
				await selectTab({ page, tab: "Text Styles" });
				await selectContainingOption(page, FRAGMENT_TEXT_STYLE).selectOption({ label: FRAGMENT_TEXT_STYLE });
				await waitForInteractionSagasSettled(page);
				const textStyleCard = page.getByTestId("text-style-card").filter({ hasText: FRAGMENT_TEXT_STYLE });
				await expect(textStyleCard).toBeVisible();
				await assertUndoRedo(page, textStyleCard);
			});

			await test.step("Reference a watermark", async () => {
				await selectTab({ page, tab: "Watermark" });
				await selectContainingOption(page, FRAGMENT_WATERMARK).selectOption({ label: FRAGMENT_WATERMARK });
				await waitForInteractionSagasSettled(page);
				// The referenced watermark title is shown in a readonly input (not text content).
				await expect(page.getByPlaceholder("Referenced watermark fragment")).toHaveValue(FRAGMENT_WATERMARK);
				await assertUndoRedo(page, page.getByPlaceholder("Referenced watermark fragment"));
				// Open the referenced watermark and assert its fragment content renders on the (readonly) stage.
				await page
					.getByTestId("watermark-card")
					.filter({ has: page.getByPlaceholder("Referenced watermark fragment") })
					.getByRole("button", { name: "Open Editor" })
					.click();
				await expect(page.getByText("THIS IS A PORTRAIT").first()).toBeVisible();
			});

			await test.step("Reference a section", async () => {
				await selectTab({ page, tab: "Section" });
				await selectContainingOption(page, FRAGMENT_SECTION).selectOption({ label: FRAGMENT_SECTION });
				await waitForInteractionSagasSettled(page);
				// The referenced section title is shown in a readonly input (not text content).
				await expect(page.getByPlaceholder("Referenced section fragment")).toHaveValue(FRAGMENT_SECTION);
				await assertUndoRedo(page, page.getByPlaceholder("Referenced section fragment"));
				// Open the referenced section and assert its fragment content renders on the (readonly) stage.
				await page
					.getByTestId("section-card")
					.filter({ has: page.getByPlaceholder("Referenced section fragment") })
					.getByRole("button", { name: "Open Editor" })
					.click();
				await expect(page.getByText("THIS IS A LANDSCAPE SECTION").first()).toBeVisible();
			});

			await test.step("Reference a segment", async () => {
				await selectTab({ page, tab: "Segment" });
				// The segment reference control is a (grouped) Autocomplete: open it, pick the fragment
				// segment, then confirm with the toolbar's Add button.
				const toolbar = page.getByTestId("segment-toolbar");
				await toolbar.getByRole("combobox").click();
				await page.getByRole("option", { name: FRAGMENT_SEGMENT, exact: true }).click();
				await toolbar.getByRole("button", { name: "Add" }).click();
				await waitForInteractionSagasSettled(page);
				const segmentCard = page.getByTestId("segment-card").filter({ hasText: FRAGMENT_SEGMENT });
				await expect(segmentCard).toBeVisible();
				await assertUndoRedo(page, segmentCard);
				// Open the referenced segment and assert its fragment content renders on the (readonly) stage.
				await segmentCard.click();
				await expect(page.getByText("THIS IS A PORTRAIT SEGMENT").first()).toBeVisible();
			});

			await test.step("Commit all referencing changes", async () => {
				await commitChanges({ page });
			});
		}
	);
});

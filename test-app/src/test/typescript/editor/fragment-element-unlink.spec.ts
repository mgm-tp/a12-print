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
	closeDetail,
	waitForInteractionSagasSettled,
	confirmUnlinkDialog,
	detailForm,
	openElementLibrary,
	closeElementLibrary,
} from "../utils/index.js";

devAppTest.use({ useCase: "010-use-fragment" });

const FIRST_SEGMENT = "First Segment";
const IMAGE_DYNAMIC_FIELD_PATH = "/example/imageField/content";
const TEXT_WITH_TYPESETTING = "With Typesetting";
const TEXT_WITHOUT_TYPESETTING = "No Typesetting";
const TYPESETTING_MODEL = "Typesetting_for_fragment";
const FRAGMENT_ELEMENT_COUNT = 14;

const referencedFragmentBadge = (page: Page) => page.getByTitle("Referenced element fragment");

/** The name field is always the first textbox in the open element form - disabled while readonly. */
const nameField = (page: Page) => page.getByTestId("detail-form-container").getByRole("textbox").first();

const openSegmentStage = async (page: Page) => {
	// The Segment tab is already selected by default; clicking an already-selected tab toggles it
	// closed instead of being a no-op, so only click it when another tab is currently active.
	const segmentTab = page.getByRole("tab", { name: "Segment" });
	if ((await segmentTab.getAttribute("aria-selected")) !== "true") {
		await segmentTab.click();
	}
	await page.getByTestId("segment-card").filter({ hasText: FIRST_SEGMENT }).click();
};

/**
 * Right-clicking directly opens the context menu without selecting the element first - the menu's
 * "hovered" detection only fires reliably once the element is already selected via a prior click.
 * On a cold stage load the click-to-select can itself briefly miss (hover tracking not wired up
 * yet), so retry the select+right-click pair until the fragment-only "Unlink" item appears.
 */
const rightClickAndUnlink = async (page: Page, element: Locator) => {
	const unlinkButton = page.getByRole("button", { name: "Unlink" });
	await expect(async () => {
		await page.keyboard.press("Escape");
		// Move away first so the following hover is a genuine mouseenter transition, not a no-op at
		// an already-hovered position - the context menu's "hovered" tracking needs that transition
		// to know which reference is under the cursor when it opens.
		await page.mouse.move(0, 0);
		await element.hover();
		await element.click();
		await element.click({ button: "right" });
		await expect(unlinkButton).toBeVisible({ timeout: 1000 });
	}).toPass({ timeout: 10000 });
	await unlinkButton.click();
};

test.describe("Fragment element unlink (hard copy)", () => {
	test.describe.configure({ mode: "serial" });

	devAppTest("unlinks a leaf element with no extra dependencies", async ({ page }) => {
		await openSegmentStage(page);
		const image = page.getByTestId("element-image").filter({ hasText: IMAGE_DYNAMIC_FIELD_PATH });

		await test.step("Unlink it and confirm the warning", async () => {
			await rightClickAndUnlink(page, image);
			await confirmUnlinkDialog(page);
			await waitForInteractionSagasSettled(page);
			await expect(referencedFragmentBadge(page)).toHaveCount(FRAGMENT_ELEMENT_COUNT - 1);
		});

		await test.step("The element stays in place and becomes editable", async () => {
			await image.dblclick();
			await expect(nameField(page)).toBeEditable();
			await expect(nameField(page)).toHaveValue("Image_Dynamic");
			await closeDetail({ page });
		});

		await test.step("The unlink cannot be undone", async () => {
			await expect(page.getByLabel("Undo")).toBeDisabled();
		});
	});

	devAppTest("unlinking an element with a typesetting dependency adds it to the header", async ({ page }) => {
		await openSegmentStage(page);
		const text = page.getByTestId("element-text").filter({ hasText: TEXT_WITH_TYPESETTING });

		await test.step("Unlink it and confirm the added dependency", async () => {
			await rightClickAndUnlink(page, text);
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
		});

		await test.step("The unlink cannot be undone", async () => {
			await expect(page.getByLabel("Undo")).toBeDisabled();
		});
	});

	devAppTest("unlinks a wrapper element together with its nested content", async ({ page }) => {
		await openSegmentStage(page);
		const area = page.getByTestId("element-area");

		await test.step("Unlink the Area and confirm the warning", async () => {
			await rightClickAndUnlink(page, area);
			await confirmUnlinkDialog(page);
			await waitForInteractionSagasSettled(page);
			await expect(referencedFragmentBadge(page)).toHaveCount(FRAGMENT_ELEMENT_COUNT - 1);
		});

		await test.step("Its nested content is local and editable - none of it carries the fragment badge", async () => {
			await area.hover();
			await page.getByRole("button", { name: "Edit", exact: true }).click();
			await expect(referencedFragmentBadge(page)).toHaveCount(0);

			const childText = page.getByTestId("element-text");
			await childText.dblclick();
			await expect(nameField(page)).toBeEditable();
			await closeDetail({ page });
		});
	});

	devAppTest("the original fragment is not modified", async ({ page }) => {
		await openSegmentStage(page);
		const image = page.getByTestId("element-image").filter({ hasText: IMAGE_DYNAMIC_FIELD_PATH });

		await test.step("Unlink an element", async () => {
			await rightClickAndUnlink(page, image);
			await confirmUnlinkDialog(page);
			await waitForInteractionSagasSettled(page);
		});

		await test.step("All of the fragment's own elements are still offerable from the Element Fragment Library", async () => {
			const elementLibrary = await openElementLibrary(page);
			await expect(
				elementLibrary.getByTestId("element-fragment-library-items").getByTestId("element-library-item")
			).toHaveCount(FRAGMENT_ELEMENT_COUNT);
			await closeElementLibrary(page);
		});
	});
});

test.describe("Referenced fragment element (read-only)", () => {
	devAppTest("viewing a Field inside a referenced Text does not change the print model", async ({ page }) => {
		await openSegmentStage(page);
		const text = page.getByTestId("element-text").filter({ hasText: TEXT_WITHOUT_TYPESETTING }).first();

		await test.step("Open the read-only Text form and the Field inside it", async () => {
			await text.dblclick();
			await expect(nameField(page)).toBeDisabled();
			await detailForm(page).locator('[entity-type="Field"]').dblclick();
			await expect(page.getByRole("button", { name: "Back", exact: true })).toBeVisible();
		});

		await test.step("Leave the Field form and close the detail view", async () => {
			await page.getByRole("button", { name: "Back", exact: true }).click();
			await closeDetail({ page });
		});

		await test.step("The Commit view lists no text change and no fragment validation error", async () => {
			await page.getByRole("tab", { name: "Commit changes" }).click();
			// automatic height fixes may be listed here as well, so look for the text change specifically
			await expect(page.getByRole("row", { name: "Edited text of Text element" })).toHaveCount(0);
			await expect(
				page.getByText("An element can only be marked as a Fragment inside a Fragment Model.")
			).toHaveCount(0);
		});
	});
});

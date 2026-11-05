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
import type { Page } from "@playwright/test";
import { test } from "@playwright/test";

import {
	expect,
	devAppTest,
	selectTab,
	dragElementToEditor,
	commitChanges,
	waitForInteractionSagasSettled,
	writeToTextElement,
} from "../utils/index.js";

devAppTest.use({ useCase: "009-empty-fragment-test" });

/**
 * Helper: clicks the "Add" button next to a fragment tree category node.
 */
const addFragmentItem = async (page: Page, title: string) => {
	await page.getByTitle(title).click();
	await waitForInteractionSagasSettled(page);
};

/**
 * Helper: locates a fragment tree node by its generated name pattern (e.g. "Watermark_").
 * Uses data-tree-level="1" to target only child nodes (not the category parent).
 */
const fragmentNodeLocator = (page: Page, namePrefix: string) =>
	page.locator('[data-tree-level="1"]').filter({ hasText: new RegExp(`${namePrefix}_[0-9a-f]`) });

test.describe("Fragment model editor", () => {
	devAppTest("adds a watermark and a text element, then commits", async ({ page }) => {
		await test.step("Add a watermark fragment", async () => {
			await addFragmentItem(page, "Add Watermark Fragment");
			await expect(fragmentNodeLocator(page, "Watermark")).toBeVisible();
		});

		await test.step("Open the watermark editor stage", async () => {
			await fragmentNodeLocator(page, "Watermark").click();
			await waitForInteractionSagasSettled(page);
			await expect(page.getByTestId("editor-container")).toBeVisible();
		});

		await test.step("Add a text element and write content", async () => {
			await dragElementToEditor({ page, elementName: "Text" });
			await expect(page.getByTestId("element-text")).toBeVisible();
			await page.getByTestId("element-text").dblclick();
			await writeToTextElement({ page, text: "Test watermark text" });
			await page.getByRole("heading").getByLabel("Close").click();
			await waitForInteractionSagasSettled(page);
		});

		await test.step("Commit changes", async () => {
			await commitChanges({ page });
		});
	});

	devAppTest("adds a section and a text element, then commits", async ({ page }) => {
		await test.step("Add a section fragment", async () => {
			await addFragmentItem(page, "Add Section Fragment");
			await expect(fragmentNodeLocator(page, "Section")).toBeVisible();
		});

		await test.step("Open the section editor stage", async () => {
			await fragmentNodeLocator(page, "Section").click();
			await waitForInteractionSagasSettled(page);
			await expect(page.getByTestId("editor-container")).toBeVisible();
		});

		await test.step("Add a text element and write content", async () => {
			await page.getByTestId("zoom-factor").selectOption("0.5");
			// Drop into the section header area (white area at top, 20mm high)
			await dragElementToEditor({
				page,
				elementName: "Text",
				isWrapperStage: true,
				targetPosition: { x: 200, y: 20 },
			});
			await expect(page.getByTestId("element-text")).toBeVisible();
			await page.getByTestId("element-text").dblclick();
			await writeToTextElement({ page, text: "Test section text" });
			await page.getByRole("heading").getByLabel("Close").click();
			await waitForInteractionSagasSettled(page);
		});

		await test.step("Commit changes", async () => {
			await commitChanges({ page });
		});
	});

	devAppTest("adds a segment and a text element, then commits", async ({ page }) => {
		await test.step("Add a segment fragment", async () => {
			await addFragmentItem(page, "Add Segment Fragment");
			await expect(fragmentNodeLocator(page, "Segment")).toBeVisible();
		});

		await test.step("Open the segment editor stage", async () => {
			await fragmentNodeLocator(page, "Segment").click();
			await waitForInteractionSagasSettled(page);
			await expect(page.getByTestId("editor-container")).toBeVisible();
		});

		await test.step("Add a text element and write content", async () => {
			await dragElementToEditor({ page, elementName: "Text" });
			await expect(page.getByTestId("element-text")).toBeVisible();
			await page.getByTestId("element-text").dblclick();
			await writeToTextElement({ page, text: "Test segment text" });
			await page.getByRole("heading").getByLabel("Close").click();
			await waitForInteractionSagasSettled(page);
		});

		await test.step("Commit changes", async () => {
			await commitChanges({ page });
		});
	});

	devAppTest("adds a text style, then commits", async ({ page }) => {
		await test.step("Navigate to Text Styles tab", async () => {
			await selectTab({ page, tab: "Text Styles" });
		});

		await test.step("Add a new text style", async () => {
			const initialCount = await page.getByTestId("text-style-card").count();
			await page.getByRole("button", { name: "Add New Text Style" }).click();
			await waitForInteractionSagasSettled(page);
			await expect(page.getByTestId("text-style-card")).toHaveCount(initialCount + 1);
		});

		await test.step("Commit changes", async () => {
			await commitChanges({ page });
		});
	});

	devAppTest("adds a fragment text element directly, then commits", async ({ page }) => {
		await test.step("Add a text element via fragment tree", async () => {
			// The element type dropdown defaults to "Text"
			await addFragmentItem(page, "Add Element Fragment");
			await waitForInteractionSagasSettled(page);
		});

		await test.step("Verify the element appears in the tree and write content", async () => {
			const elementNode = fragmentNodeLocator(page, "Text");
			await expect(elementNode).toBeVisible();
			await elementNode.click();
			await waitForInteractionSagasSettled(page);
			await expect(page.getByTestId("editor-container")).toBeVisible();
			// Double-click the text element on the stage to edit it
			await page.getByTestId("element-text").dblclick();
			await writeToTextElement({ page, text: "Test fragment element" });
			await page.getByRole("heading").getByLabel("Close").click();
			await waitForInteractionSagasSettled(page);
		});

		await test.step("Commit changes", async () => {
			await commitChanges({ page });
		});
	});
});

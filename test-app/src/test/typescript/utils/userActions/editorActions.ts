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
import { Locator, Page } from "@playwright/test";

export const selectTab = async ({ page, tab }: { page: Page; tab: string }) => {
	await page.locator(`_react=Tab[title = "${tab}"]`).click();
};

// Will timeout if no Tab is selected
export const openEditorStage = async ({ page, tab, cardName }: { page: Page; tab: string; cardName: string }) => {
	switch (tab) {
		case "Segment":
			await page.locator(`_react=SegmentCard[segment.title = "${cardName}"]`).click();
			break;
		case "Section":
			await page.locator(`_react=SectionCard[section.title = "${cardName}"]`).click();
			break;
		case "Watermark":
			await page.locator(`_react=WatermarkCard[watermark.title = "${cardName}"]`).click();
			break;
		default:
			throw new Error("No valid tab specified - test fails!");
	}
};

// If editor is opened: add an element to the editor stage
export const dragElementToEditor = async ({
	page,
	elementName,
	componentName = elementName,
	isWrapperStage = false,
	targetPosition,
}: {
	page: Page;
	elementName: string;
	componentName?: string;
	isWrapperStage?: boolean;
	targetPosition?: {
		x: number;
		y: number;
	};
}) => {
	const elementLibraryButton = page.getByLabel("Open/Close Element Library");
	await elementLibraryButton.click();

	const elementLibrary = page.getByRole("dialog");
	await elementLibrary
		.locator(`_react=ListItem[name = "${elementName}"]`)
		.dragTo(page.locator(!isWrapperStage ? "_react=EditorContainer" : "_react=ContextMenuWrapper"), {
			targetPosition,
		});
	await elementLibrary.getByLabel("Close").click();
	// force to close the popup tooltip
	await page.locator(`_react=${componentName}`).click();
};

export async function dragAndDrop(page: Page, locator: Locator, deltaX: number, deltaY: number) {
	const boundingBox = await locator.boundingBox();
	if (!boundingBox) {
		throw new Error("Element not found for drag and drop");
	}

	const startX = boundingBox.x + boundingBox.width / 2;
	const startY = boundingBox.y + boundingBox.height / 2;
	const endX = startX + deltaX;
	const endY = startY + deltaY;

	await page.mouse.move(startX, startY);
	await page.mouse.down();
	await page.mouse.move(endX, endY);
	await page.mouse.up();
}

// Will timeout if Element Form Container is not open
export const closeDetail = async ({ page }: { page: Page }) => {
	await page.getByRole("heading").getByLabel("Close").click();
	// force popup to close before screenshot
	await page.locator("_react=EditorContainer").click({ position: { x: 100, y: 200 } });
};

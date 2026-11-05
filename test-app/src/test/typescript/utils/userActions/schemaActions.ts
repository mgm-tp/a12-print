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
import { expect } from "@playwright/test";

export const schemaPanel = (page: Page, title: string): Locator =>
	page.getByRole("button", { name: title, exact: true });

export const expandSchemaPanel = async ({ page, title }: { page: Page; title: string }) => {
	const panel = schemaPanel(page, title);
	if ((await panel.getAttribute("aria-expanded")) !== "true") {
		await panel.click();
	}
	await expect(panel).toHaveAttribute("aria-expanded", "true");
};

export const schemaPanelContent = (page: Page, title: string): Locator =>
	page
		.locator('[data-role="collapsible-panel"]')
		.filter({ has: schemaPanel(page, title) })
		.locator('[data-role="collapsible-panel-content"]');

/**
 * Referencing a Fragment Model cannot be undone, so the editor asks for confirmation first. The
 * added reference then shows in a readonly text field, not as text content.
 */
export const addModelReference = async ({
	page,
	panelTitle,
	modelId,
}: {
	page: Page;
	panelTitle: string;
	modelId: string;
}) => {
	await expandSchemaPanel({ page, title: panelTitle });

	const panelContent = schemaPanelContent(page, panelTitle);
	await panelContent.getByRole("combobox").first().selectOption({ label: modelId });
	await panelContent.getByRole("button", { name: "Add", exact: true }).click();

	const confirm = page.getByRole("button", { name: "Apply", exact: true });
	if (await confirm.isVisible()) {
		await confirm.click();
	}
	await expect(panelContent.locator(`input[value="${modelId}"]`)).toBeVisible();
};

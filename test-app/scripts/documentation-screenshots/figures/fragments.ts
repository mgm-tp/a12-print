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
/*
 * The figures of chapter 06, and the Text Styles tab figure of chapter 02 that belongs with them.
 * Both groups only look at their model, so neither of them changes anything.
 *
 * The Fragment Model is modeled in one use case and referenced by the Print Model of the other, so
 * that the figure of a defined Fragment and the figures of a used Fragment show the same names.
 */
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { blurFocus, EDITOR_STAGE_VIEWPORT, withViewport, withViewportHeight } from "../capture.ts";
import {
	collapsePanel,
	collapsiblePanel,
	collapsiblePanelToggle,
	dismissNotifications,
	editorStage,
	modelIcon,
	openEditorStage,
	openElementLibrary,
	selectTab,
	sidebarPanel,
	waitForInteractionSagasSettled,
} from "../editor-actions.ts";

import type { FigureGroup } from "./figure.ts";
import { FRAGMENT_MODEL_USE_CASE, FRAGMENT_USAGE_USE_CASE } from "./figure.ts";

/* The Segment panel puts its toolbar at the bottom, so its figure gets an editor of its own height. */
const SEGMENT_PANEL_VIEWPORT_HEIGHT = 620;

const SEGMENT_FRAGMENT_PLACEHOLDER = "Select segment fragment";

const FRAGMENT_MODEL = "ExampleFragmentPM";

/* Empty, so that the figure of the Fragment Library is not about what the Editor Stage beside it shows. */
const EMPTY_SEGMENT = "Empty Segment";

const INTERNAL_TEXT_STYLES = "Internal Text Styles";

/** Collapses one of the four groups the Fragment tree puts its Fragments in. */
const collapseFragmentGroup = async ({ page, group }: { page: Page; group: string }) => {
	const toggle = sidebarPanel(page)
		.getByRole("listitem")
		.filter({ hasText: group })
		.first()
		.getByRole("button")
		.first();
	await toggle.click();
	await expect(toggle).toHaveAttribute("aria-expanded", "false");
};

/**
 * Opens the selection of Segment Fragments in the Segment tab's toolbar.
 */
const openFragmentSelection = async (page: Page) => {
	await page.getByTestId("segment-toolbar").getByPlaceholder(SEGMENT_FRAGMENT_PLACEHOLDER).click();
	const options = page.getByRole("listbox");
	await expect(options.getByRole("option").first()).toBeVisible();
	return options;
};

export const fragmentModel: FigureGroup = {
	name: "fragment-model",
	useCase: FRAGMENT_MODEL_USE_CASE,
	figures: [
		{
			name: "06_fragment_tree",
			chapter: "chapter06",
			take: async (page, { captureRegionContent }) => {
				await selectTab({ page, tab: "Fragment" });
				/*
				 * The figure is an overview of the tree, so it shows every group a Fragment Model has
				 * - and the Elements group, which is longer than the other three together, collapsed.
				 */
				await collapseFragmentGroup({ page, group: "Elements" });
				await blurFocus(page);
				/* Cropped to the tree and the model it belongs to - the Editor Stage stays empty until a Fragment is opened. */
				await captureRegionContent(modelIcon(page), sidebarPanel(page));
			},
		},
	],
};

export const fragmentUsage: FigureGroup = {
	name: "fragment-usage",
	useCase: FRAGMENT_USAGE_USE_CASE,
	prepare: async page => {
		await dismissNotifications(page);
	},
	figures: [
		{
			name: "06_reference_segment",
			chapter: "chapter06",
			take: async (page, { captureRegion }) => {
				await selectTab({ page, tab: "Segment" });
				/*
				 * The Segments and the toolbar that adds one sit at the two ends of the panel, so the
				 * figure is taken in an editor no taller than what is between them.
				 */
				await withViewportHeight(page, SEGMENT_PANEL_VIEWPORT_HEIGHT, async () => {
					const options = await openFragmentSelection(page);
					await captureRegion(modelIcon(page), sidebarPanel(page), options);
				});
			},
		},
		{
			name: "06_reference_section",
			chapter: "chapter06",
			take: async (page, { captureRegionContent }) => {
				await selectTab({ page, tab: "Section" });
				await blurFocus(page);
				await captureRegionContent(modelIcon(page), sidebarPanel(page));
			},
		},
		{
			name: "02_fragment_textstyles",
			chapter: "chapter02",
			take: async (page, { captureRegion }) => {
				await selectTab({ page, tab: "Text Styles" });
				await expect(collapsiblePanelToggle(page, FRAGMENT_MODEL)).toBeVisible();
				await blurFocus(page);
				/* The Text Styles of the model and of the Fragment Model it references, without the editor beside them. */
				await captureRegion(
					modelIcon(page),
					collapsiblePanel(page, INTERNAL_TEXT_STYLES),
					collapsiblePanel(page, FRAGMENT_MODEL)
				);
			},
		},
		{
			name: "06_fragment_library",
			chapter: "chapter06",
			take: async (page, { captureRegionContent }) => {
				await selectTab({ page, tab: "Segment" });
				await openEditorStage({ page, tab: "Segment", cardName: EMPTY_SEGMENT });
				/* The library is anchored to its button, so it is opened in the viewport it is shown in. */
				await withViewport(page, EDITOR_STAGE_VIEWPORT, async () => {
					const library = await openElementLibrary(page);
					/* Collapsed, so that the figure is of the Element Fragment Library rather than of the Elements above it. */
					await collapsePanel({ page, title: "Elements" });
					/* Opening a Segment is an interaction, and the state of the save button follows it. */
					await waitForInteractionSagasSettled(page);
					await blurFocus(page);
					/*
					 * The figure is of the library and of the Editor Stage beside it - not of the
					 * Segments, and not of the empty page below where the library ends.
					 */
					await captureRegionContent(editorStage(page), library);
				});
			},
		},
	],
};

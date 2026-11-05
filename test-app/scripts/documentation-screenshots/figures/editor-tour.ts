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
 * None of these figures changes the model, so they share one session - and they build on each
 * other's editor state, the zoom and the selection carry over.
 */
import { blurFocus, EDITOR_STAGE_VIEWPORT, withHighlight, withViewport, withViewportHeight } from "../capture.ts";
import {
	cardByTitle,
	closeDetailForm,
	closeElementLibrary,
	dismissNotifications,
	editorMain,
	editorModeToggle,
	editorStage,
	editorToolbar,
	expandSchemaPanel,
	globalToolbar,
	modelIcon,
	openCardEditor,
	openCardSettings,
	openEditorStage,
	openElementDetail,
	openElementLibrary,
	openSelectDropdown,
	selectByLabel,
	selectTab,
	setZoomFactor,
	sidebarPanel,
	textElementByContent,
	textStyleCard,
} from "../editor-actions.ts";

import type { FigureGroup } from "./figure.ts";
import { TEXT_DETAIL, USE_CASE } from "./figure.ts";

const PORTRAIT_SEGMENT = "Portrait Segment";

/* The page below the Segment's last element is empty, so the figure of the library gets a shorter editor. */
const ADD_ELEMENT_VIEWPORT = { ...EDITOR_STAGE_VIEWPORT, height: 950 };

/* The General tab is longer than the editor, and the figure has to show the PDF Metadata as well. */
const GENERAL_TAB_VIEWPORT_HEIGHT = 1300;

const HEADLINE_TEXT_STYLE = "Open Sans - Headline 1";

/* Its font is one the use case configures, which is what makes it a figure of the custom fonts. */
const CUSTOM_FONT_TEXT_STYLE = "Poppins";

/* Its font is deliberately not configured, so the editor warns about it. */
const UNCONFIGURED_FONT_TEXT_STYLE = "Liberation";

const SCHEMA_PANELS = [
	"Document Model References",
	"Print Model References",
	"Fragment Model References",
	"Typesetting Model References",
];

export const editorTour: FigureGroup = {
	name: "editor-tour",
	useCase: USE_CASE,
	figures: [
		{
			name: "01_print_editor_editing_view",
			chapter: "chapter01",
			take: async (page, { capture }) => {
				await dismissNotifications(page);
				await selectTab({ page, tab: "Segment" });
				await openEditorStage({ page, tab: "Segment", cardName: PORTRAIT_SEGMENT });
				const element = textElementByContent(page, PORTRAIT_SEGMENT);
				await openElementDetail({ page, element, headline: TEXT_DETAIL });
				await withViewport(page, EDITOR_STAGE_VIEWPORT, () => capture(editorMain(page)));
			},
		},
		{
			name: "02_add_element_toolbar",
			chapter: "chapter02",
			take: async (page, { captureRegion }) => {
				await closeDetailForm({ page });
				await textElementByContent(page, PORTRAIT_SEGMENT).click();
				await withViewport(page, ADD_ELEMENT_VIEWPORT, async () => {
					const library = await openElementLibrary(page);
					await blurFocus(page);
					/* The figure is of the toolbar, the Editor Stage and the library beside it - not of the Segments. */
					await captureRegion(editorStage(page), library);
					await closeElementLibrary(page);
				});
			},
		},
		{
			name: "02_editor_modes",
			chapter: "chapter02",
			take: async (page, { capture }) => {
				/* Taken in the default editor, which the page only fits into at 80%. */
				await setZoomFactor({ page, zoomValue: "0.8" });
				await blurFocus(page);
				await withHighlight(page, editorModeToggle(page), () => capture(editorMain(page)));
			},
		},
		{
			name: "02_editor_topbar",
			chapter: "chapter02",
			take: async (page, { captureRegion }) => {
				await setZoomFactor({ page, zoomValue: "1" });
				const element = textElementByContent(page, PORTRAIT_SEGMENT);
				await element.click();
				await blurFocus(page);
				await captureRegion(editorModeToggle(page), editorToolbar(page), element);
			},
		},
		{
			name: "02_schema_tab",
			chapter: "chapter02",
			take: async (page, { captureRegionContent }) => {
				await selectTab({ page, tab: "Schema" });
				for (const title of SCHEMA_PANELS) {
					await expandSchemaPanel({ page, title });
				}
				await blurFocus(page);
				/* Cropped to the reference panels and the model they belong to - the Editor Stage is not part of the tab. */
				await captureRegionContent(modelIcon(page), sidebarPanel(page));
			},
		},
		{
			name: "02_section_tab",
			chapter: "chapter02",
			take: async (page, { capture }) => {
				await selectTab({ page, tab: "Section" });
				await openCardEditor({ page, card: cardByTitle(page, "section-card", "First Portrait") });
				await blurFocus(page);
				await capture(editorMain(page));
			},
		},
		{
			name: "02_segment_tab",
			chapter: "chapter02",
			take: async (page, { capture }) => {
				await selectTab({ page, tab: "Segment" });
				await openEditorStage({ page, tab: "Segment", cardName: PORTRAIT_SEGMENT });
				await blurFocus(page);
				await capture(editorMain(page));
			},
		},
		{
			name: "02_watermark_tab",
			chapter: "chapter02",
			take: async (page, { capture }) => {
				await selectTab({ page, tab: "Watermark" });
				const card = cardByTitle(page, "watermark-card", "Portrait Watermark");
				await openCardEditor({ page, card });
				await openCardSettings({ page, card, headline: "Overlay Settings" });
				await blurFocus(page);
				await capture(editorMain(page));
			},
		},
		{
			name: "02_general_tab",
			chapter: "chapter02",
			take: async (page, { captureRegionContent }) => {
				await selectTab({ page, tab: "General" });
				await blurFocus(page);
				/* Longer than the editor, so it is shown in a taller one - and cropped to where the tab ends. */
				await withViewportHeight(page, GENERAL_TAB_VIEWPORT_HEIGHT, () =>
					captureRegionContent(globalToolbar(page), sidebarPanel(page))
				);
			},
		},
		{
			name: "02_text_styles_tab",
			chapter: "chapter02",
			take: async (page, { capture }) => {
				await selectTab({ page, tab: "Text Styles" });
				/* The default Text Style cannot be edited, so a figure of its settings shows them all disabled. */
				await textStyleCard(page, HEADLINE_TEXT_STYLE).click();
				await blurFocus(page);
				await capture(editorMain(page));
			},
		},
		{
			name: "02_utilize_custom_fonts",
			chapter: "chapter02",
			take: async (page, { capture }) => {
				await textStyleCard(page, CUSTOM_FONT_TEXT_STYLE).click();
				await openSelectDropdown({ page, select: selectByLabel(page, "Font") });
				await capture(editorMain(page));
			},
		},
		{
			name: "02_text_style_employ_unconfigured_font",
			chapter: "chapter02",
			take: async (page, { capture }) => {
				await textStyleCard(page, UNCONFIGURED_FONT_TEXT_STYLE).click();
				await blurFocus(page);
				await capture(editorMain(page));
			},
		},
	],
};

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
 * The element detail forms of chapter 03. Every one of them is the same figure: open the form of an
 * element that the use case's Print Model already has, and crop to the form. So the elements are
 * modeled in the fixture rather than built here - what the figures show is the form, not the way to
 * an element.
 *
 * None of these figures changes the model.
 */
import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { blurFocus, withViewportHeight } from "../capture.ts";
import {
	closeDetailForm,
	closeSidebar,
	detailForm,
	editorModeToggle,
	editorToolbar,
	elementLocator,
	openEditorStage,
	openElementDetailForm,
	openWrapperStage,
	selectTab,
	setZoomFactor,
	textElementByContent,
	textFieldByLabel,
	wrapperStage,
} from "../editor-actions.ts";

import type { Figure, FigureGroup } from "./figure.ts";
import { ELEMENTS_USE_CASE, elementDetailHeadline } from "./figure.ts";

const SEGMENT = "Element Showcase";

/* The whole page has to be reachable without scrolling, so that every element can be opened. */
const STAGE_ZOOM = "0.5";

/* The detail form panel is as tall as the editor, and the longest of these forms is longer than that. */
const DETAIL_FORM_VIEWPORT_HEIGHT = 1700;

/* The last property of the General Properties, which is where the Expression figure ends. */
const HIDE_IF_EMPTY = "Hide this element if all nested entities are empty";

/* The Text element whose content mixes static text with a Field and a Calculation entity. */
const TEXT_WITH_ENTITIES = "Text element with";

type ElementDetail = {
	/** Without the `03_` prefix and the `_detail_view` suffix, which every one of them carries. */
	readonly figure: string;
	/** The element type, as the form headline names it. */
	readonly elementType: string;
	readonly element: (page: Page) => Locator;
	/**
	 * The last thing the figure shows, for the forms whose properties the text covers in figures of
	 * their own - the Text and Border Properties every element shares, for instance. Without it the
	 * figure ends where the form does.
	 */
	readonly until?: (page: Page) => Locator;
};

/** The three chart types share a component, so they are told apart by the type it displays. */
const chart = (page: Page, elementType: string): Locator =>
	elementLocator(page, "Chart").filter({ hasText: elementType });

const ELEMENT_DETAILS: readonly ElementDetail[] = [
	{ figure: "text", elementType: "Text", element: page => textElementByContent(page, TEXT_WITH_ENTITIES) },
	{
		figure: "expression",
		elementType: "Expression",
		element: page => elementLocator(page, "Expression"),
		until: page => detailForm(page).getByText(HIDE_IF_EMPTY, { exact: true }),
	},
	{ figure: "line", elementType: "Line", element: page => elementLocator(page, "Line") },
	{ figure: "image_static", elementType: "Image", element: page => elementLocator(page, "Image").first() },
	{ figure: "image_dynamic", elementType: "Image", element: page => elementLocator(page, "Image").nth(1) },
	{
		figure: "bounding_box",
		elementType: "Bounding Box",
		element: page => elementLocator(page, "BoundingBox").first(),
	},
	{ figure: "area", elementType: "Area", element: page => elementLocator(page, "Area").first() },
	{
		figure: "table_layout",
		elementType: "Table Layout",
		element: page => elementLocator(page, "TableLayout"),
		/* The Add of the Column Options: the second of the two the form has, after the Row Options'. */
		until: page => detailForm(page).getByRole("button", { name: "Add", exact: true }).nth(1),
	},
	{ figure: "listing", elementType: "Listing", element: page => elementLocator(page, "Listing").first() },
	{
		figure: "table",
		elementType: "Table",
		element: page => elementLocator(page, "Table").first(),
		until: page => textFieldByLabel(page, "Filter expression"),
	},
	{ figure: "bar_chart", elementType: "Bar Chart", element: page => chart(page, "Bar Chart") },
	{ figure: "line_chart", elementType: "Line Chart", element: page => chart(page, "Line Chart") },
	{ figure: "pie_chart", elementType: "Pie Diagram", element: page => chart(page, "Pie Diagram") },
];

const detailFigure = ({ figure, elementType, element, until }: ElementDetail): Figure => ({
	name: `03_${figure}_detail_view`,
	chapter: "chapter03",
	take: async (page, { captureContent, captureUntil }) => {
		await openElementDetailForm({ page, element: element(page), headline: elementDetailHeadline(elementType) });
		await blurFocus(page);
		await withViewportHeight(page, DETAIL_FORM_VIEWPORT_HEIGHT, () =>
			until ? captureUntil(detailForm(page), until(page)) : captureContent(detailForm(page))
		);
		/* The next figure opens its form in the same panel, and the element it opens it for may be behind this one. */
		await closeDetailForm({ page });
	},
});

export const elementDetails: FigureGroup = {
	name: "element-details",
	useCase: ELEMENTS_USE_CASE,
	prepare: async page => {
		await selectTab({ page, tab: "Segment" });
		await openEditorStage({ page, tab: "Segment", cardName: SEGMENT });
		await closeSidebar(page);
		await setZoomFactor({ page, zoomValue: STAGE_ZOOM });
	},
	figures: [
		...ELEMENT_DETAILS.map(detailFigure),
		{
			name: "03_area_EditorStage",
			chapter: "chapter03",
			take: async (page, { captureRegion }) => {
				const area = elementLocator(page, "Area").first();
				await openWrapperStage({ page, element: area });
				/* The stage of the Area is what the figure shows, so it is shown at the size it is modeled in. */
				await setZoomFactor({ page, zoomValue: "1" });
				const breadcrumb = page
					.getByRole("navigation")
					.filter({ has: page.getByRole("link", { name: SEGMENT }) });
				await expect(breadcrumb).toBeVisible();
				await blurFocus(page);
				await captureRegion(editorModeToggle(page), editorToolbar(page), breadcrumb, wrapperStage(page));
			},
		},
	],
};

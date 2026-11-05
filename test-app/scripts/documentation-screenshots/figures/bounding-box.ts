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

/* Builds the element it shows, so it needs a model no other figure has already added to. */
import { expect } from "@playwright/test";

import { blurFocus } from "../capture.ts";
import {
	closeDetailForm,
	dragElementToEditor,
	editorModeToggle,
	editorToolbar,
	elementLocator,
	openEditorStage,
	openElementDetail,
	openWrapperStage,
	selectTab,
	setElementPosition,
	wrapperStage,
	writeToTextElement,
} from "../editor-actions.ts";

import type { FigureGroup } from "./figure.ts";
import { TEXT_DETAIL, USE_CASE } from "./figure.ts";

const LANDSCAPE_SEGMENT = "Landscape Segment";

export const boundingBox: FigureGroup = {
	name: "bounding-box",
	useCase: USE_CASE,
	figures: [
		{
			name: "03_boundingBox_EditorStage",
			chapter: "chapter03",
			take: async (page, { captureRegion }) => {
				await selectTab({ page, tab: "Segment" });
				await openEditorStage({ page, tab: "Segment", cardName: LANDSCAPE_SEGMENT });

				/* Wide enough to hold the text element that is placed into it further down. */
				await dragElementToEditor({
					page,
					elementName: "Bounding Box",
					componentName: "BoundingBox",
					normalizePosition: { x: 4, y: 2 },
				});
				await setElementPosition({ page, width: 8 });

				await openWrapperStage({ page, element: elementLocator(page, "BoundingBox") });
				const breadcrumb = page
					.getByRole("navigation")
					.filter({ has: page.getByRole("link", { name: LANDSCAPE_SEGMENT }) });
				await expect(breadcrumb).toBeVisible();

				await dragElementToEditor({ page, elementName: "Text", isWrapperStage: true });
				const text = elementLocator(page, "Text").first();
				await openElementDetail({ page, element: text, headline: TEXT_DETAIL });
				await writeToTextElement({ page, text: "Bounding Box Content" });
				await closeDetailForm({ page });

				await text.click();
				/* Wide enough for the text to stay on one line - text that overflows carries a badge. */
				await setElementPosition({ page, x: 0.4, y: 0.7, width: 5.3 });
				await blurFocus(page);
				/* The wrapper stage is only as large as the Bounding Box, so the figure is cropped to it. */
				await captureRegion(editorModeToggle(page), editorToolbar(page), breadcrumb, wrapperStage(page));
			},
		},
	],
};

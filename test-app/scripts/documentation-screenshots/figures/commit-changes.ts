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
 * The Commit Changes tab lists the changes made since the last commit, so this group has to make
 * some - which is why it is a group of its own: it must not reach the figures that show the model
 * as it is checked in.
 *
 * The change list carries the timestamps of the run, so this is the one figure that cannot come out
 * the same twice.
 */
import { expect } from "@playwright/test";

import { blurFocus } from "../capture.ts";
import {
	closeDetailForm,
	dismissNotifications,
	dragElementToEditor,
	editorMain,
	openEditorStage,
	openElementDetail,
	selectTab,
	setElementPosition,
	textElementByContent,
	waitForInteractionSagasSettled,
	writeToTextElement,
} from "../editor-actions.ts";

import type { FigureGroup } from "./figure.ts";
import { TEXT_DETAIL, USE_CASE } from "./figure.ts";

const LANDSCAPE_SEGMENT = "Landscape Segment";

const PORTRAIT_SEGMENT = "Portrait Segment";

export const commitChanges: FigureGroup = {
	name: "commit-changes",
	useCase: USE_CASE,
	prepare: async page => {
		await dismissNotifications(page);
	},
	figures: [
		{
			name: "02_commit_changes_tab",
			chapter: "chapter02",
			take: async (page, { capture }) => {
				await selectTab({ page, tab: "Segment" });
				await openEditorStage({ page, tab: "Segment", cardName: LANDSCAPE_SEGMENT });

				/* A Text Element without a text: the validation error the figure shows in the error tree. */
				await dragElementToEditor({ page, elementName: "Text", normalizePosition: { x: 2, y: 2 } });

				/* A second change, so that the list of changes is one a selection can be made in. */
				const text = textElementByContent(page, PORTRAIT_SEGMENT);
				await openEditorStage({ page, tab: "Segment", cardName: PORTRAIT_SEGMENT });
				await openElementDetail({ page, element: text, headline: TEXT_DETAIL });
				await writeToTextElement({ page, text: "Portrait Segment" });
				await closeDetailForm({ page });
				await text.click();
				await setElementPosition({ page, x: 1.2, y: 2.4 });
				await waitForInteractionSagasSettled(page);

				await selectTab({ page, tab: "Commit changes" });
				const changes = page.getByRole("row", { name: /Open Commit/ });
				await expect(changes.first()).toBeVisible();
				/* Clicking a change toggles its Status between Commit and Pending, as the text explains. */
				await changes.first().click();
				await blurFocus(page);
				await capture(editorMain(page));
			},
		},
	],
};

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
 * Referencing a model cannot be undone and puts the DIN template's elements on every segment stage,
 * so this has to be the only thing done to the model it is taken from. In particular it must not
 * share a session with `02_schema_tab`, which shows the unreferenced state.
 */
import { expect } from "@playwright/test";

import { addModelReference, dismissNotifications, selectTab } from "../editor-actions.ts";

import type { FigureGroup } from "./figure.ts";
import { USE_CASE } from "./figure.ts";

export const modelReferences: FigureGroup = {
	name: "model-references",
	useCase: USE_CASE,
	prepare: async page => {
		await dismissNotifications(page);
	},
	figures: [
		{
			name: "03_select_template_segment",
			chapter: "chapter03",
			take: async (page, { captureRegion }) => {
				await selectTab({ page, tab: "Schema" });
				await addModelReference({ page, panelTitle: "Print Model References", modelId: "TemplatePM" });

				await selectTab({ page, tab: "Segment" });
				const segmentToolbar = page.getByTestId("segment-toolbar");
				const options = page.getByRole("listbox");
				await segmentToolbar.getByPlaceholder("Select segment fragment").click();
				await expect(options.getByRole("option")).toHaveText(["TemplatePM - Template1"]);
				await captureRegion(segmentToolbar, options);
			},
		},
	],
};

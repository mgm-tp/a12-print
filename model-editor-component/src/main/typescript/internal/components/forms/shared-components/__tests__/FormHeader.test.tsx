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
import type { Reducer } from "redux";

import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import {
	createNavigationStateWithForm,
	mockSegment,
	renderWithProviders,
} from "../../../../../../../test/typescript/test-utils/index.js";
import { NavigationReducer } from "../../../../redux/index.js";
import type { NavigationState } from "../../../../redux/index.js";

import { FormHeader } from "../FormHeader.js";

const WARNING = "Only BoundingBox is addable.";

function renderHeader(warning?: string) {
	const initialNavigationState = createNavigationStateWithForm(SidebarItem.SEGMENT, mockSegment.id, []);
	const navigationReducer: Reducer = (state: NavigationState = initialNavigationState, action) =>
		NavigationReducer(state, action);

	return renderWithProviders(<FormHeader headline="Element Library" warning={warning} />, {
		Navigation: navigationReducer,
	});
}

describe("FormHeader", () => {
	it("renders the headline", () => {
		const { getByRole } = renderHeader();

		expect(getByRole("heading", { name: "Element Library" })).toBeInTheDocument();
	});

	it("renders no warning icon without a warning", () => {
		const { container } = renderHeader();

		expect(container.querySelector(`[title="${WARNING}"]`)).toBeNull();
	});

	it("renders the warning as the title of a warning icon", () => {
		const { container } = renderHeader(WARNING);

		const warningIcon = container.querySelector(`[title="${WARNING}"]`);

		expect(warningIcon).toBeInTheDocument();
		expect(warningIcon?.className).toContain("plasma-icon");
		expect(warningIcon?.textContent).toContain("warning");
	});
});

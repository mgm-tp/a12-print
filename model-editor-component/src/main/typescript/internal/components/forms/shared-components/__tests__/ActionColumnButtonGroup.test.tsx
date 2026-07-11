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
import { jest } from "@jest/globals";

import { renderWithProviders } from "../../../../../../../test/typescript/test-utils/index.js";

import { ActionColumnButtonGroup } from "../ActionColumnButtonGroup.js";

describe("ActionColumnButtonGroup", () => {
	it("renders edit and delete buttons", () => {
		const { getAllByRole } = renderWithProviders(<ActionColumnButtonGroup />);

		const buttons = getAllByRole("button");
		expect(buttons).toHaveLength(2);
	});

	it("calls onEdit when edit button clicked", () => {
		const onEdit = jest.fn();
		const { getAllByRole } = renderWithProviders(<ActionColumnButtonGroup onEdit={onEdit} />);

		getAllByRole("button")[0].click();
		expect(onEdit).toHaveBeenCalledTimes(1);
	});

	it("calls onDelete when delete button clicked", () => {
		const onDelete = jest.fn();
		const { getAllByRole } = renderWithProviders(<ActionColumnButtonGroup onDelete={onDelete} />);

		getAllByRole("button")[1].click();
		expect(onDelete).toHaveBeenCalledTimes(1);
	});

	it("renders without crashing when no handlers provided", () => {
		const { getAllByRole } = renderWithProviders(<ActionColumnButtonGroup />);
		// Should not throw when clicked without handlers
		getAllByRole("button")[0].click();
		getAllByRole("button")[1].click();
	});
});

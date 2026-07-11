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

import { AddButtonGroup } from "../AddButtonGroup.js";

describe("AddButtonGroup", () => {
	it("renders a button with add label", () => {
		const onClick = jest.fn();
		const { queryByRole } = renderWithProviders(<AddButtonGroup onClick={onClick} />);

		const button = queryByRole("button");
		expect(button).toBeInTheDocument();
	});

	it("calls onClick when button is clicked", () => {
		const onClick = jest.fn();
		const { getByRole } = renderWithProviders(<AddButtonGroup onClick={onClick} />);

		getByRole("button").click();
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it("applies custom className", () => {
		const onClick = jest.fn();
		const { container } = renderWithProviders(<AddButtonGroup onClick={onClick} className="custom-class" />);

		expect(container.querySelector(".custom-class")).toBeInTheDocument();
	});
});

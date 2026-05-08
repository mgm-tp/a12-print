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

import { BorderStyle } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { renderWithProviders } from "../../../../../../../test/typescript/test-utils/index.js";

import { BorderPropertiesForm } from "../BorderPropertiesForm.js";

describe("BorderPropertiesForm", () => {
	const mockSetBorderProperties = jest.fn();
	const mockBorderProperties = {
		id: "012it03ig024hg",
		borderWidth: 10,
		borderColor: "color",
		borderStyle: BorderStyle.Solid,
	};

	it("renders without headline", () => {
		const { queryByText } = renderWithProviders(
			<BorderPropertiesForm
				hideLabel
				borderProperties={mockBorderProperties}
				setBorderProperties={mockSetBorderProperties}
			/>
		);

		expect(queryByText("Border Properties")).not.toBeInTheDocument();
	});

	it("renders with headline", () => {
		const { queryByText } = renderWithProviders(
			<BorderPropertiesForm
				borderProperties={mockBorderProperties}
				setBorderProperties={mockSetBorderProperties}
			/>
		);

		expect(queryByText("Border Properties")).toBeInTheDocument();
	});
});

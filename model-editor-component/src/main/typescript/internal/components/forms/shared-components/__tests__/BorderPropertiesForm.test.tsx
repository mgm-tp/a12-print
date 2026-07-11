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

import type { PartialBorderProperties, PartialTable } from "@com.mgmtp.a12.print/print-model-api/model";
import { BorderStyle, ElementType } from "@com.mgmtp.a12.print/print-model-api/model";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";

import { renderWithProviders } from "../../../../../../../test/typescript/test-utils/index.js";
import { BORDER_PROPERTIES_PATH } from "../../../../constant/element-property-path.js";

import { BorderPropertiesForm } from "../BorderPropertiesForm.js";

describe("BorderPropertiesForm", () => {
	const mockSetBorderProperties = jest.fn();

	const mockBorderProperties: PartialBorderProperties = {
		id: "012it03ig024hg",
		borderWidth: {
			id: "nz0ZXHR730XA_ajw5afbT",
			path: "/content/elementDefinitions/table/borderProperties/borderWidth/value/",
			source: PossibleInputSource.INPUT,
			value: 10,
		},
		borderColor: {
			id: "nz0ZXHR730XA_ajw5afbE",
			path: "/content/elementDefinitions/table/borderProperties/borderColor/value/",
			source: PossibleInputSource.INPUT,
			value: "color",
		},
		borderStyle: {
			id: "nz0ZXHR730XA_ajw5afbZ",
			path: "/content/elementDefinitions/table/borderProperties/borderStyle/value/",
			source: PossibleInputSource.INPUT,
			value: BorderStyle.Solid,
		},
	};

	const mockElement: PartialTable = {
		id: "tableId",
		type: ElementType.Table,
		borderProperties: mockBorderProperties,
	};

	it("renders without headline", () => {
		const { queryByText } = renderWithProviders(
			<BorderPropertiesForm
				hideLabel
				borderProperties={mockBorderProperties}
				setBorderProperties={mockSetBorderProperties}
				element={mockElement}
				propertiesPath={BORDER_PROPERTIES_PATH}
			/>
		);

		expect(queryByText("Border Properties")).not.toBeInTheDocument();
	});

	it("renders with headline", () => {
		const { queryByText } = renderWithProviders(
			<BorderPropertiesForm
				borderProperties={mockBorderProperties}
				setBorderProperties={mockSetBorderProperties}
				element={mockElement}
				propertiesPath={BORDER_PROPERTIES_PATH}
			/>
		);

		expect(queryByText("Border Properties")).toBeInTheDocument();
	});
});

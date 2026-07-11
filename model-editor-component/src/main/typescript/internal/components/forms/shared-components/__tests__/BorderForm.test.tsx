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
import { fireEvent, waitFor } from "@testing-library/react";

import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";
import type { PartialTable } from "@com.mgmtp.a12.print/print-model-api/model";
import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";

import { renderWithProviders } from "../../../../../../../test/typescript/test-utils/index.js";
import { BORDER_PROPERTIES_PATH } from "../../../../constant/element-property-path.js";

import { BorderForm } from "../BorderForm.js";

describe("BorderForm", () => {
	const mockSetBorderProperties = jest.fn();

	const mockElement: PartialTable = {
		id: "tableId",
		type: ElementType.Table,
		borderProperties: {
			id: "k0FFvYRpIj2vM_3z-UAYe",
			borderWidth: {
				id: "nz0ZXHR730XA_ajw5afbT",
				path: "/content/elementDefinitions/table/borderProperties/borderWidth/value/",
				source: PossibleInputSource.INPUT,
			},
			borderColor: {
				id: "nz0ZXHR730XA_ajw5afbE",
				path: "/content/elementDefinitions/table/borderProperties/borderColor/value/",
				source: PossibleInputSource.INPUT,
			},
			borderStyle: {
				id: "nz0ZXHR730XA_ajw5afbZ",
				path: "/content/elementDefinitions/table/borderProperties/borderStyle/value/",
				source: PossibleInputSource.INPUT,
			},
		},
	};

	const setupTest = () =>
		renderWithProviders(
			<BorderForm
				setBorderProperties={mockSetBorderProperties}
				element={mockElement}
				borderProperties={mockElement.borderProperties}
				propertiesPath={BORDER_PROPERTIES_PATH}
			/>
		);

	it("renders correctly", () => {
		const { container, queryByText } = setupTest();

		expect(container).toMatchSnapshot();
		expect(queryByText("Border Width")).toBeInTheDocument();
		expect(queryByText("Border Style")).toBeInTheDocument();
		expect(queryByText("Border Color")).toBeInTheDocument();
	});

	it("should call setBorderProperties with appropriate payload", async () => {
		const { getAllByRole } = setupTest();

		const [borderStyleSelect] = getAllByRole("combobox");
		const [borderWidthInput] = getAllByRole("spinbutton");

		fireEvent.click(borderStyleSelect);

		await waitFor(() => {
			const borderStyleOptions = getAllByRole("option");
			const selectOption = borderStyleOptions.find(option => option.textContent === "Solid");
			if (selectOption) {
				fireEvent.click(selectOption);
			}
		});

		fireEvent.change(borderWidthInput, { target: { value: "20" } });

		expect(mockSetBorderProperties).toHaveBeenNthCalledWith(1, {
			...mockElement.borderProperties,
			borderStyle: { ...mockElement.borderProperties!.borderStyle, value: "Solid" },
		});

		expect(mockSetBorderProperties).toHaveBeenNthCalledWith(2, {
			...mockElement.borderProperties,
			borderWidth: { ...mockElement.borderProperties!.borderWidth, value: 20 },
		});
	});
});

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

import type { PartialTable } from "@com.mgmtp.a12.print/print-model-api/model";
import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";

import { renderWithProviders } from "../../../../../../../test/typescript/test-utils/index.js";

import { TextPropertiesForm } from "../TextPropertiesForm.js";

describe("TextPropertiesForm", () => {
	const mockSetTextProperties = jest.fn();

	const mockElement: PartialTable = {
		id: "tableId",
		type: ElementType.Table,
		textProperties: {
			id: "k0FFvYRpIj2vM_3z-UAYd",
			color: {
				id: "nz0ZXHR730XA_ajw5afbT",
				path: "/content/elementDefinitions/table/headerTextProperties/color/value/",
				source: PossibleInputSource.INPUT,
			},
			backgroundColor: {
				id: "Y9uyNsluzTZwOt9Ub0iF4",
				path: "/content/elementDefinitions/table/headerTextProperties/backgroundColor/value/",
				source: PossibleInputSource.INPUT,
			},
			alignment: {
				id: "m_BlwcJI7C41oXzIaK9tI",
				path: "/content/elementDefinitions/table/headerTextProperties/alignment/value/",
				source: PossibleInputSource.INPUT,
			},
			bold: {
				id: "oJTiaBnpuIPk6WjYeaSlw",
				path: "/content/elementDefinitions/table/headerTextProperties/bold/value/",
				source: PossibleInputSource.INPUT,
			},
			italic: {
				id: "O0Q6bW6RgVy0AJYg5bPxb",
				path: "/content/elementDefinitions/table/headerTextProperties/italic/value/",
				source: PossibleInputSource.INPUT,
			},
			underlined: {
				id: "pzKKjFPHYQTA4moxL8Uif",
				path: "/content/elementDefinitions/table/headerTextProperties/underlined/value/",
				source: PossibleInputSource.INPUT,
			},
		},
	};

	it("should renders without label", () => {
		const { queryByText } = renderWithProviders(
			<TextPropertiesForm
				hideLabel
				element={mockElement}
				textProperties={mockElement.textProperties}
				setTextProperties={mockSetTextProperties}
			/>
		);

		expect(queryByText("Text Properties")).not.toBeInTheDocument();
	});

	it("should renders with label", () => {
		const { queryByText } = renderWithProviders(
			<TextPropertiesForm
				element={mockElement}
				textProperties={mockElement.textProperties}
				setTextProperties={mockSetTextProperties}
			/>
		);

		expect(queryByText("Text Properties")).toBeInTheDocument();
	});
});

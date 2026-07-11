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

import type { PartialCalculation } from "@com.mgmtp.a12.print/print-model-api/model";
import { DisplayType, ElementType, FieldTypeDefinition } from "@com.mgmtp.a12.print/print-model-api/model";

import { renderWithProviders } from "../../../../../../../test/typescript/test-utils/index.js";

import { FieldTypeConfiguration } from "../FieldTypeConfiguration.js";

const baseElement: PartialCalculation = {
	id: "calc-1",
	type: ElementType.Calculation,
};

const elementWithStringFieldType: PartialCalculation = {
	...baseElement,
	calculation: {
		id: "calc-props-1",
		name: "test",
		model: "TestDocument",
		fieldType: {
			id: "ft-1",
			fieldType: FieldTypeDefinition.String,
		},
	},
};

const elementWithBooleanFieldType: PartialCalculation = {
	...baseElement,
	calculation: {
		id: "calc-props-2",
		name: "test",
		model: "TestDocument",
		fieldType: {
			id: "ft-2",
			fieldType: FieldTypeDefinition.Boolean,
		},
	},
};

const elementWithTypeDefinitionFieldType: PartialCalculation = {
	...baseElement,
	calculation: {
		id: "calc-props-3",
		name: "test",
		model: "TestDocument",
		fieldType: {
			id: "ft-3",
			fieldType: FieldTypeDefinition.TypeDefinition,
		},
	},
};

const elementWithDateFormat: PartialCalculation = {
	...baseElement,
	calculation: {
		id: "calc-props-4",
		name: "test",
		model: "TestDocument",
		fieldType: {
			id: "ft-4",
			fieldType: FieldTypeDefinition.String,
		},
		displayOptions: {
			id: "do-4",
			displayType: DisplayType.Date,
			dateFormat: "dd.MM.yyyy",
		},
	},
};

const elementWithDateRangeFormat: PartialCalculation = {
	...baseElement,
	calculation: {
		id: "calc-props-5",
		name: "test",
		model: "TestDocument",
		fieldType: {
			id: "ft-5",
			fieldType: FieldTypeDefinition.String,
		},
		displayOptions: {
			id: "do-5",
			displayType: DisplayType.DateRange,
		},
	},
};

const elementWithCheckbox: PartialCalculation = {
	...baseElement,
	calculation: {
		id: "calc-props-6",
		name: "test",
		model: "TestDocument",
		fieldType: {
			id: "ft-6",
			fieldType: FieldTypeDefinition.Boolean,
		},
		displayOptions: {
			id: "do-6",
			displayType: DisplayType.Checkbox,
			checkboxChecked: "Yes",
			checkboxUnchecked: "No",
		},
	},
};

describe("FieldTypeConfiguration", () => {
	const mockGetDisplayOptionsError = jest.fn(() => undefined);

	afterEach(() => {
		mockGetDisplayOptionsError.mockClear();
	});

	it("renders the field type select", () => {
		const { queryByText } = renderWithProviders(
			<FieldTypeConfiguration
				element={baseElement}
				documentModel={undefined}
				getDisplayOptionsError={mockGetDisplayOptionsError}
			/>
		);

		expect(queryByText("Field Type")).toBeInTheDocument();
	});

	it("renders the suffix input", () => {
		const { queryByText } = renderWithProviders(
			<FieldTypeConfiguration
				element={baseElement}
				documentModel={undefined}
				getDisplayOptionsError={mockGetDisplayOptionsError}
			/>
		);

		expect(queryByText("Suffix")).toBeInTheDocument();
	});

	it("renders formatting type select for String field type", () => {
		const { queryByText } = renderWithProviders(
			<FieldTypeConfiguration
				element={elementWithStringFieldType}
				documentModel={undefined}
				getDisplayOptionsError={mockGetDisplayOptionsError}
			/>
		);

		expect(queryByText("Formatting Type")).toBeInTheDocument();
	});

	it("renders formatting type select for Boolean field type", () => {
		const { queryByText } = renderWithProviders(
			<FieldTypeConfiguration
				element={elementWithBooleanFieldType}
				documentModel={undefined}
				getDisplayOptionsError={mockGetDisplayOptionsError}
			/>
		);

		expect(queryByText("Formatting Type")).toBeInTheDocument();
	});

	it("does not render formatting type select for Number field type", () => {
		const numberElement: PartialCalculation = {
			...baseElement,
			calculation: {
				id: "calc-num",
				name: "test",
				model: "TestDocument",
				fieldType: { id: "ft-num", fieldType: FieldTypeDefinition.Number },
			},
		};

		const { queryByText } = renderWithProviders(
			<FieldTypeConfiguration
				element={numberElement}
				documentModel={undefined}
				getDisplayOptionsError={mockGetDisplayOptionsError}
			/>
		);

		expect(queryByText("Formatting Type")).not.toBeInTheDocument();
	});

	it("renders TypeDefinition select when TypeDefinition field type is selected", () => {
		const { queryByText } = renderWithProviders(
			<FieldTypeConfiguration
				element={elementWithTypeDefinitionFieldType}
				documentModel={undefined}
				getDisplayOptionsError={mockGetDisplayOptionsError}
			/>
		);

		expect(queryByText("TypeDefinition from the DocumentModel")).toBeInTheDocument();
	});

	it("renders date format input when String + Date formatting is selected", () => {
		const { queryByText } = renderWithProviders(
			<FieldTypeConfiguration
				element={elementWithDateFormat}
				documentModel={undefined}
				getDisplayOptionsError={mockGetDisplayOptionsError}
			/>
		);

		expect(queryByText("Date Format")).toBeInTheDocument();
	});

	it("renders date range format inputs when String + DateRange formatting is selected", () => {
		const { queryByText } = renderWithProviders(
			<FieldTypeConfiguration
				element={elementWithDateRangeFormat}
				documentModel={undefined}
				getDisplayOptionsError={mockGetDisplayOptionsError}
			/>
		);

		expect(queryByText("Date Format (Start)")).toBeInTheDocument();
		expect(queryByText("Date Separator")).toBeInTheDocument();
		expect(queryByText("Date Format (End)")).toBeInTheDocument();
	});

	it("renders checkbox inputs when Boolean + Checkbox formatting is selected", () => {
		const { queryByText } = renderWithProviders(
			<FieldTypeConfiguration
				element={elementWithCheckbox}
				documentModel={undefined}
				getDisplayOptionsError={mockGetDisplayOptionsError}
			/>
		);

		expect(queryByText("Checkbox Icon (checked)")).toBeInTheDocument();
		expect(queryByText("Checkbox Icon (unchecked)")).toBeInTheDocument();
	});

	it("does not render date format input when no formatting type is selected", () => {
		const { queryByText } = renderWithProviders(
			<FieldTypeConfiguration
				element={elementWithStringFieldType}
				documentModel={undefined}
				getDisplayOptionsError={mockGetDisplayOptionsError}
			/>
		);

		expect(queryByText("Date Format")).not.toBeInTheDocument();
	});

	it("dispatches an action when field type is changed", async () => {
		const { getAllByRole } = renderWithProviders(
			<FieldTypeConfiguration
				element={baseElement}
				documentModel={undefined}
				getDisplayOptionsError={mockGetDisplayOptionsError}
			/>
		);

		const [fieldTypeSelect] = getAllByRole("combobox");
		fireEvent.click(fieldTypeSelect);

		await waitFor(() => {
			const options = getAllByRole("option");
			const stringOption = options.find(opt => opt.textContent === "String");
			if (stringOption) {
				fireEvent.click(stringOption);
			}
		});
	});

	it("renders formatting type select for TypeDefinition field type", () => {
		const { queryByText } = renderWithProviders(
			<FieldTypeConfiguration
				element={elementWithTypeDefinitionFieldType}
				documentModel={undefined}
				getDisplayOptionsError={mockGetDisplayOptionsError}
			/>
		);

		expect(queryByText("Formatting Type")).toBeInTheDocument();
	});
});

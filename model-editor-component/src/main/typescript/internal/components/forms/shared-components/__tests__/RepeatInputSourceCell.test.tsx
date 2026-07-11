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
import { fireEvent } from "@testing-library/react";

import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";
import type { MeasureInputSource, PartialTableLayout } from "@com.mgmtp.a12.print/print-model-api/model";
import { ElementType, MeasureUnit } from "@com.mgmtp.a12.print/print-model-api/model";

import { renderWithProviders } from "../../../../../../../test/typescript/test-utils/index.js";

import type { CustomBodyContentProps, RepeatColumnType } from "../types.js";
import { RepeatInputSourceCell } from "../RepeatInputSourceCell.js";

type TestRowType = {
	id: string;
	minHeight?: MeasureInputSource;
	width?: MeasureInputSource;
};

const mockElement: PartialTableLayout = { id: "elementId", type: ElementType.TableLayout };

const mockMmInputSource: MeasureInputSource = {
	id: "inputSourceId",
	source: PossibleInputSource.INPUT,
	value: 20,
	unit: MeasureUnit.Millimeter,
	path: "/content/test/minHeight",
};

const mockPercentInputSource: MeasureInputSource = {
	id: "percentInputSourceId",
	source: PossibleInputSource.INPUT,
	value: 50,
	unit: MeasureUnit.Percent,
	path: "/content/test/width",
};

function makeMmNumberProps(
	overrides: Partial<CustomBodyContentProps<TestRowType>> = {}
): CustomBodyContentProps<TestRowType> {
	const setClonedRow = jest.fn();
	const dispatchNewRowData = jest.fn();

	const column: RepeatColumnType<TestRowType> = {
		label: "Min Height",
		dataKey: "minHeight",
		inputType: "number",
		sourceProperties: {
			element: mockElement,
			property: "rowProperties.minHeight",
			measureUnit: MeasureUnit.Millimeter,
		},
	};

	const clonedRow: TestRowType = {
		id: "row1",
		minHeight: mockMmInputSource,
	};

	return {
		column,
		clonedRow,
		row: clonedRow,
		rowIndex: 0,
		setClonedRow: setClonedRow as CustomBodyContentProps<TestRowType>["setClonedRow"],
		dispatchNewRowData: dispatchNewRowData as CustomBodyContentProps<TestRowType>["dispatchNewRowData"],
		closeRepeatBodyRow: jest.fn(),
		...overrides,
	};
}

function makePercentNumberProps(
	overrides: Partial<CustomBodyContentProps<TestRowType>> = {}
): CustomBodyContentProps<TestRowType> {
	const setClonedRow = jest.fn();
	const dispatchNewRowData = jest.fn();

	const column: RepeatColumnType<TestRowType> = {
		label: "Width",
		dataKey: "width",
		inputType: "number",
		sourceProperties: {
			element: mockElement,
			property: "columnProperties.width",
			measureUnit: MeasureUnit.Percent,
		},
	};

	const clonedRow: TestRowType = {
		id: "row1",
		width: mockPercentInputSource,
	};

	return {
		column,
		clonedRow,
		row: clonedRow,
		rowIndex: 0,
		setClonedRow: setClonedRow as CustomBodyContentProps<TestRowType>["setClonedRow"],
		dispatchNewRowData: dispatchNewRowData as CustomBodyContentProps<TestRowType>["dispatchNewRowData"],
		closeRepeatBodyRow: jest.fn(),
		...overrides,
	};
}

describe("RepeatInputSourceCell", () => {
	it("renders a number (mm) input with value", () => {
		const props = makeMmNumberProps();
		const { container } = renderWithProviders(<RepeatInputSourceCell {...props} />);
		const input = container.querySelector("input");
		expect(input).toBeInTheDocument();
		expect(input?.value).toBe("20");
	});

	it("renders a number (percent) input with value", () => {
		const props = makePercentNumberProps();
		const { container } = renderWithProviders(<RepeatInputSourceCell {...props} />);
		const input = container.querySelector("input");
		expect(input).toBeInTheDocument();
		expect(input?.value).toBe("50");
	});

	it("calls setClonedRow when number (mm) input value changes", () => {
		const props = makeMmNumberProps();
		const { container } = renderWithProviders(<RepeatInputSourceCell {...props} />);
		const input = container.querySelector("input")!;

		fireEvent.change(input, { target: { value: "30" } });

		expect(props.setClonedRow).toHaveBeenCalledTimes(1);
	});

	it("calls dispatchNewRowData when number (mm) input blurs", () => {
		const props = makeMmNumberProps();
		const { container } = renderWithProviders(<RepeatInputSourceCell {...props} />);
		const input = container.querySelector("input")!;

		fireEvent.blur(input);

		expect(props.dispatchNewRowData).toHaveBeenCalledTimes(1);
	});

	it("calls setClonedRow when number (percent) input value changes", () => {
		const props = makePercentNumberProps();
		const { container } = renderWithProviders(<RepeatInputSourceCell {...props} />);
		const input = container.querySelector("input")!;

		fireEvent.change(input, { target: { value: "75" } });

		expect(props.setClonedRow).toHaveBeenCalledTimes(1);
	});

	it("calls dispatchNewRowData when number (percent) input blurs", () => {
		const props = makePercentNumberProps();
		const { container } = renderWithProviders(<RepeatInputSourceCell {...props} />);
		const input = container.querySelector("input")!;

		fireEvent.blur(input);

		expect(props.dispatchNewRowData).toHaveBeenCalledTimes(1);
	});

	it("throws when sourceProperties is missing", () => {
		const props = makeMmNumberProps();
		props.column.sourceProperties = undefined;

		expect(() => renderWithProviders(<RepeatInputSourceCell {...props} />)).toThrow("Missing source properties");
	});

	it("throws when inputType is not supported", () => {
		const props = makeMmNumberProps();
		props.column.inputType = "select";

		expect(() => renderWithProviders(<RepeatInputSourceCell {...props} />)).toThrow(
			/is not supported as input source/
		);
	});

	it("throws when cell value is not an input source", () => {
		const props = makeMmNumberProps();
		props.clonedRow = { id: "row1", minHeight: "not-an-input-source" as unknown as MeasureInputSource };

		expect(() => renderWithProviders(<RepeatInputSourceCell {...props} />)).toThrow(/Value is not input source/);
	});

	it("renders correctly when cell value is undefined (null inputSource)", () => {
		const props = makeMmNumberProps();
		props.clonedRow = { id: "row1", minHeight: undefined };

		const { container } = renderWithProviders(<RepeatInputSourceCell {...props} />);
		expect(container).toBeTruthy();
	});
});

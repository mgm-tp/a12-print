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
import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";

import { renderWithProviders } from "../../../../../../../test/typescript/test-utils/index.js";

import type { ChartCommonPropertiesProps } from "../ChartCommonProperties.js";
import { ChartCommonProperties } from "../ChartCommonProperties.js";

describe("ChartCommonProperties", () => {
	const mockOnPropertyChange = jest.fn();

	const barChart = {
		id: "bar-chart-id",
		title: {
			id: "diagram-title-id",
			value: "diagram-title",
			path: "/content/elementDefinitions/barChart/title/value",
			source: PossibleInputSource.INPUT,
		},
		labelX: {
			id: "diagram-labelX-id",
			value: "diagram-labelX",
			path: "/content/elementDefinitions/barChart/labelX/value",
			source: PossibleInputSource.INPUT,
		},
		labelY: {
			id: "diagram-labelY-id",
			value: "diagram-labelY",
			path: "/content/elementDefinitions/barChart/labelY/value",
			source: PossibleInputSource.INPUT,
		},
	};

	const setupTest = (generalDiagramPropertiesProps?: Partial<ChartCommonPropertiesProps>) => {
		return renderWithProviders(
			<ChartCommonProperties
				element={{
					id: "diagram-id",
					type: ElementType.BarChart,
					barChart,
				}}
				properties={{
					title: barChart.title,
					labelX: barChart.labelX,
					labelY: barChart.labelY,
				}}
				getBaseErrorMessage={jest.fn()}
				onPropertyChange={mockOnPropertyChange}
				{...generalDiagramPropertiesProps}
			/>,
			{}
		);
	};

	it("should renders correctly", () => {
		const { container, queryByText } = setupTest();

		expect(container).toMatchSnapshot();
		expect(queryByText("Title")).toBeInTheDocument();
		expect(queryByText("Height")).toBeInTheDocument();
		expect(queryByText("Width")).toBeInTheDocument();
	});

	it("should call onPropertyChange with appropriate payload", () => {
		const { getByDisplayValue, getAllByRole } = setupTest();

		const titleInput = getByDisplayValue("diagram-title");

		fireEvent.change(titleInput, { target: { value: "new-title" } });
		fireEvent.blur(titleInput);

		expect(mockOnPropertyChange).toHaveBeenCalledWith({
			title: { ...barChart.title, value: "new-title" },
		});

		const [heightInput, widthInput] = getAllByRole("spinbutton");

		fireEvent.change(heightInput, { target: { value: "10" } });
		fireEvent.blur(heightInput);
		fireEvent.change(widthInput, { target: { value: "20" } });
		fireEvent.blur(widthInput);

		const changedHeightPayload = mockOnPropertyChange.mock.calls[1][0];
		const changedWidthPayload = mockOnPropertyChange.mock.calls[2][0];

		expect(changedHeightPayload).toMatchObject({ dimensions: { height: { value: 100 } } });
		expect(changedWidthPayload).toMatchObject({ dimensions: { width: { value: 200 } } });
	});

	describe("with Repeatable", () => {
		const setupRepeatableTest = () => setupTest({ isRepeatable: true });

		it("should renders correctly", () => {
			const { container, queryByText } = setupRepeatableTest();

			expect(container).toMatchSnapshot();
			expect(queryByText("Title")).toBeInTheDocument();
			expect(queryByText("Height")).toBeInTheDocument();
			expect(queryByText("Width")).toBeInTheDocument();
			expect(queryByText("Label Category Axis")).toBeInTheDocument();
			expect(queryByText("Label Value Axis")).toBeInTheDocument();
			expect(queryByText("Orientation")).toBeInTheDocument();
		});

		it("should call onPropertyChange with appropriate payload", async () => {
			const { getAllByRole, getByRole } = setupRepeatableTest();

			const [, labelXInput, labelYInput] = getAllByRole("textbox");

			fireEvent.change(labelXInput, { target: { value: "new-label-X" } });
			fireEvent.blur(labelXInput);

			expect(mockOnPropertyChange).toHaveBeenCalledWith({
				labelX: { ...barChart.labelX, value: "new-label-X" },
			});

			fireEvent.change(labelYInput, { target: { value: "new-label-Y" } });
			fireEvent.blur(labelYInput);

			expect(mockOnPropertyChange).toHaveBeenCalledWith({
				labelY: { ...barChart.labelY, value: "new-label-Y" },
			});

			fireEvent.change(getByRole("combobox"), { target: { value: "Horizontal" } });

			expect(mockOnPropertyChange).toHaveBeenCalledWith({ orientation: "Horizontal" });
		});
	});
});

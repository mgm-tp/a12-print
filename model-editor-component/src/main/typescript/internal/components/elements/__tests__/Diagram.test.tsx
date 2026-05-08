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
import { ElementType, PartialPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/lib/input-source/input-source.js";

import { renderWithProviders, expectToThrow } from "../../../../../../test/typescript/test-utils/index.js";

import { Diagram } from "../Diagram.js";

describe("Diagram", () => {
	it("should throw Error when its type is not diagram", () => {
		expectToThrow(
			() =>
				renderWithProviders(
					<Diagram
						styles={{}}
						element={{ id: "non-diagram-id", type: ElementType.Text }}
						reference={{ refId: "non-diagram-id" } as PartialPlaceableReference}
					/>
				),
			new Error(`Expected element of type BarChart/LineChart/PieChart but got ${ElementType.Text}`)
		);
	});

	it("should display bar chart label for barchart when title is empty", () => {
		const { queryByText } = renderWithProviders(
			<Diagram
				styles={{}}
				element={{ id: "diagram-id", type: ElementType.BarChart }}
				reference={{ refId: "diagram-id" } as PartialPlaceableReference}
			/>
		);

		expect(queryByText("Bar Chart")).toBeInTheDocument();
	});

	it("should display line chart label for line chart when title is empty", () => {
		const { queryByText } = renderWithProviders(
			<Diagram
				styles={{}}
				element={{ id: "diagram-id", type: ElementType.LineChart }}
				reference={{ refId: "diagram-id" } as PartialPlaceableReference}
			/>
		);

		expect(queryByText("Line Chart")).toBeInTheDocument();
	});

	it("should display pie chart label for pie chart when title is empty", () => {
		const { queryByText } = renderWithProviders(
			<Diagram
				styles={{}}
				element={{ id: "diagram-id", type: ElementType.PieChart }}
				reference={{ refId: "diagram-id" } as PartialPlaceableReference}
			/>
		);

		expect(queryByText("Pie Diagram")).toBeInTheDocument();
	});

	it("should display title for line chart", () => {
		const { queryByText } = renderWithProviders(
			<Diagram
				styles={{}}
				element={{
					id: "diagram-id",
					type: ElementType.LineChart,
					lineChart: {
						id: "ojmgqoegj",
						title: {
							id: "line-chart-title-id",
							value: "line-chart-title",
							path: "/content/elementDefinitions/lineChart/title/value",
							source: PossibleInputSource.INPUT,
						},
					},
				}}
				reference={{ refId: "diagram-id" } as PartialPlaceableReference}
			/>
		);

		expect(queryByText("line-chart-title")).toBeInTheDocument();
	});

	it("should display title for bar chart", () => {
		const { queryByText } = renderWithProviders(
			<Diagram
				styles={{}}
				element={{
					id: "diagram-id",
					type: ElementType.BarChart,
					barChart: {
						id: "ojmgqoegjqwgq",
						title: {
							id: "diagram-title-id",
							value: "bar-chart-title",
							path: "/content/elementDefinitions/barChart/title/value",
							source: PossibleInputSource.INPUT,
						},
					},
				}}
				reference={{ refId: "diagram-id" } as PartialPlaceableReference}
			/>
		);

		expect(queryByText("bar-chart-title")).toBeInTheDocument();
	});

	it("should display title for pie chart", () => {
		const { queryByText } = renderWithProviders(
			<Diagram
				styles={{}}
				element={{
					id: "diagram-id",
					type: ElementType.PieChart,
					pieChart: {
						id: "ojmgqoegj1235s",
						title: {
							id: "pie-chart-title-id",
							value: "pie-chart-title",
							path: "/content/elementDefinitions/pieChart/title/value",
							source: PossibleInputSource.INPUT,
						},
					},
				}}
				reference={{ refId: "diagram-id" } as PartialPlaceableReference}
			/>
		);

		expect(queryByText("pie-chart-title")).toBeInTheDocument();
	});
});

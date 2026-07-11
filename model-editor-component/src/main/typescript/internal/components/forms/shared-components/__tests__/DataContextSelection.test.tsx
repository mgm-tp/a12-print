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

import type { ElementMapEntry } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { renderWithProviders } from "../../../../../../../test/typescript/test-utils/index.js";

import { AllowedElementType, DataContextSelection, MAX_REPEAT_LEVEL } from "../DataContextSelection.js";

const nonRepeatableGroupEntry: ElementMapEntry = {
	elementPath: "/RootGroup",
	isGroup: true,
	isSubOfRepeatable: false,
	element: {
		type: "Group",
		id: "rootGroupId",
		name: "RootGroup",
		repeatability: 1,
		elements: [],
	},
};

const repeatableGroupEntry: ElementMapEntry = {
	elementPath: "/RepeatableGroup",
	isGroup: true,
	isSubOfRepeatable: false,
	repeatability: 2,
	element: {
		type: "Group",
		id: "repeatableGroupId",
		name: "RepeatableGroup",
		repeatability: 2,
		elements: [],
	},
};

const fieldEntry: ElementMapEntry = {
	elementPath: "/RootGroup/MyField",
	isGroup: false,
	isSubOfRepeatable: false,
	element: {
		type: "Field",
		id: "myFieldId",
		name: "MyField",
		fieldType: { type: "StringType" },
	},
};

const groupWithFieldEntries: ElementMapEntry[] = [
	{
		elementPath: "/RootGroup",
		isGroup: true,
		isSubOfRepeatable: false,
		element: {
			type: "Group",
			id: "rootGroupId",
			name: "RootGroup",
			repeatability: 1,
			elements: [
				{
					type: "Field",
					id: "myFieldId",
					name: "MyField",
					fieldType: { type: "StringType" },
				},
			],
		},
	},
	fieldEntry,
];

describe("DataContextSelection", () => {
	it("renders nothing when element map entries are empty", () => {
		const { container } = renderWithProviders(
			<DataContextSelection
				type={AllowedElementType.anyGroup}
				selectedPath={undefined}
				setSelectedPath={jest.fn()}
				maxRepeatLevel={MAX_REPEAT_LEVEL}
				elementMapEntries={[]}
			/>
		);

		expect(container.firstChild).toBeNull();
	});

	it("renders a tree with a disabled node when field type is required but only groups are present", () => {
		const { container } = renderWithProviders(
			<DataContextSelection
				type={AllowedElementType.field}
				selectedPath={undefined}
				setSelectedPath={jest.fn()}
				maxRepeatLevel={MAX_REPEAT_LEVEL}
				elementMapEntries={[nonRepeatableGroupEntry]}
			/>
		);

		expect(container.firstChild).not.toBeNull();
	});

	it("renders a tree when non-repeatable group entries produce children", () => {
		const { queryByText } = renderWithProviders(
			<DataContextSelection
				type={AllowedElementType.anyGroup}
				selectedPath={undefined}
				setSelectedPath={jest.fn()}
				maxRepeatLevel={MAX_REPEAT_LEVEL}
				elementMapEntries={[nonRepeatableGroupEntry]}
			/>
		);

		expect(queryByText("RootGroup")).toBeInTheDocument();
	});

	it("renders a tree when repeatable group entries are present", () => {
		const { queryByText } = renderWithProviders(
			<DataContextSelection
				type={AllowedElementType.repeatableGroup}
				selectedPath={undefined}
				setSelectedPath={jest.fn()}
				maxRepeatLevel={MAX_REPEAT_LEVEL}
				elementMapEntries={[repeatableGroupEntry]}
			/>
		);

		expect(queryByText("RepeatableGroup")).toBeInTheDocument();
	});

	it("renders field nodes when type is field", () => {
		const { queryByText } = renderWithProviders(
			<DataContextSelection
				type={AllowedElementType.field}
				selectedPath={undefined}
				setSelectedPath={jest.fn()}
				maxRepeatLevel={MAX_REPEAT_LEVEL}
				elementMapEntries={groupWithFieldEntries}
			/>
		);

		expect(queryByText("MyField")).toBeInTheDocument();
	});

	it("calls setSelectedPath when a selectable node is clicked", () => {
		const setSelectedPath = jest.fn();
		const { getByText } = renderWithProviders(
			<DataContextSelection
				type={AllowedElementType.anyGroup}
				selectedPath={undefined}
				setSelectedPath={setSelectedPath}
				maxRepeatLevel={MAX_REPEAT_LEVEL}
				elementMapEntries={[nonRepeatableGroupEntry]}
			/>
		);

		fireEvent.click(getByText("RootGroup"));

		expect(setSelectedPath).toHaveBeenCalledWith("/RootGroup");
	});

	it("calls setSelectedPath when a field node is clicked", () => {
		const setSelectedPath = jest.fn();
		const { getByText } = renderWithProviders(
			<DataContextSelection
				type={AllowedElementType.field}
				selectedPath={undefined}
				setSelectedPath={setSelectedPath}
				maxRepeatLevel={MAX_REPEAT_LEVEL}
				elementMapEntries={groupWithFieldEntries}
			/>
		);

		fireEvent.click(getByText("MyField"));

		expect(setSelectedPath).toHaveBeenCalledWith("/RootGroup/MyField");
	});

	it("does not call setSelectedPath when a disabled node is clicked", () => {
		const setSelectedPath = jest.fn();
		const { getByText } = renderWithProviders(
			<DataContextSelection
				type={AllowedElementType.repeatableGroup}
				selectedPath={undefined}
				setSelectedPath={setSelectedPath}
				maxRepeatLevel={MAX_REPEAT_LEVEL}
				elementMapEntries={[nonRepeatableGroupEntry]}
			/>
		);

		fireEvent.click(getByText("RootGroup"));

		expect(setSelectedPath).not.toHaveBeenCalled();
	});

	it("renders a warning message when all entries are disabled via treeOptions", () => {
		const disabledEntry: ElementMapEntry = {
			...nonRepeatableGroupEntry,
			treeOptions: { disabled: true },
		};

		const { queryByText } = renderWithProviders(
			<DataContextSelection
				type={AllowedElementType.anyGroup}
				selectedPath={undefined}
				setSelectedPath={jest.fn()}
				maxRepeatLevel={MAX_REPEAT_LEVEL}
				elementMapEntries={[disabledEntry]}
			/>
		);

		expect(queryByText(/no valid nodes/i)).toBeInTheDocument();
	});

	it("renders the selected node as pre-selected when selectedPath matches", () => {
		const { queryByText } = renderWithProviders(
			<DataContextSelection
				type={AllowedElementType.anyGroup}
				selectedPath="/RootGroup"
				setSelectedPath={jest.fn()}
				maxRepeatLevel={MAX_REPEAT_LEVEL}
				elementMapEntries={[nonRepeatableGroupEntry]}
			/>
		);

		expect(queryByText("RootGroup")).toBeInTheDocument();
	});

	it("limits tree depth according to maxRepeatLevel", () => {
		const { queryByText } = renderWithProviders(
			<DataContextSelection
				type={AllowedElementType.repeatableGroup}
				selectedPath={undefined}
				setSelectedPath={jest.fn()}
				maxRepeatLevel={0}
				elementMapEntries={[repeatableGroupEntry]}
			/>
		);

		expect(queryByText("RepeatableGroup")).toBeInTheDocument();
	});
});

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
import { fireEvent, screen } from "@testing-library/react";

import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";

import { renderWithProviders } from "../../../../../../../test/typescript/test-utils/index.js";

import type { PreconditionRepeatRowType } from "../PreconditionRepeat.js";
import { PreconditionsRepeat } from "../PreconditionRepeat.js";

describe("PreconditionsRepeat", () => {
	const mockSetTableData = jest.fn();

	const setupTest = (tableData: PreconditionRepeatRowType[] = []) =>
		renderWithProviders(<PreconditionsRepeat tableData={tableData} setTableData={mockSetTableData} />);

	beforeEach(() => {
		mockSetTableData.mockClear();
	});

	it("renders with empty table data", () => {
		const { container } = setupTest();
		expect(container).toBeTruthy();
	});

	it("renders the Add button", () => {
		const { queryByText } = setupTest();
		expect(queryByText("Add")).toBeInTheDocument();
	});

	it("renders the condition column header", () => {
		const { queryByText } = setupTest();
		expect(queryByText("Condition")).toBeInTheDocument();
	});

	it("renders with one row of data", () => {
		const tableData: PreconditionRepeatRowType[] = [{ id: "row1", precondition: "myCondition" }];
		const { queryByText } = setupTest(tableData);
		expect(queryByText("myCondition")).toBeInTheDocument();
	});

	it("renders with multiple rows of data", () => {
		const tableData: PreconditionRepeatRowType[] = [
			{ id: "row1", precondition: "condition1" },
			{ id: "row2", precondition: "condition2" },
		];
		const { queryByText } = setupTest(tableData);
		expect(queryByText("condition1")).toBeInTheDocument();
		expect(queryByText("condition2")).toBeInTheDocument();
	});

	it("calls setTableData with a new row when Add is clicked", () => {
		const { getByText } = setupTest([]);

		fireEvent.click(getByText("Add"));

		expect(mockSetTableData).toHaveBeenCalledTimes(1);
		const newData = mockSetTableData.mock.calls[0][0] as PreconditionRepeatRowType[];
		expect(newData).toHaveLength(1);
		expect(newData[0].id).toBeDefined();
	});

	it("calls setTableData with appended row when Add is clicked with existing data", () => {
		const existingRow: PreconditionRepeatRowType = { id: "existing", precondition: "old" };
		const { getByText } = setupTest([existingRow]);

		fireEvent.click(getByText("Add"));

		expect(mockSetTableData).toHaveBeenCalledTimes(1);
		const newData = mockSetTableData.mock.calls[0][0] as PreconditionRepeatRowType[];
		expect(newData).toHaveLength(2);
		expect(newData[0]).toBe(existingRow);
	});

	it("renders edit and delete buttons for each row", () => {
		const tableData: PreconditionRepeatRowType[] = [{ id: "row1", precondition: "cond" }];
		const { getAllByRole } = setupTest(tableData);

		const buttons = getAllByRole("button");
		expect(buttons.length).toBeGreaterThanOrEqual(2);
	});

	it("calls setTableData when delete button is clicked", () => {
		const tableData: PreconditionRepeatRowType[] = [{ id: "row1", precondition: "cond" }];
		const { getAllByRole } = setupTest(tableData);

		const deleteButton = getAllByRole("button").find(btn => btn.getAttribute("title") === "Delete");
		expect(deleteButton).toBeDefined();
		if (deleteButton) {
			fireEvent.click(deleteButton);
		}

		expect(mockSetTableData).toHaveBeenCalledTimes(1);
		const newData = mockSetTableData.mock.calls[0][0] as PreconditionRepeatRowType[];
		expect(newData).toHaveLength(0);
	});

	it("expands row when edit button is clicked", () => {
		const tableData: PreconditionRepeatRowType[] = [{ id: "row1", precondition: "cond" }];
		const { getAllByRole } = setupTest(tableData);

		const editButton = getAllByRole("button").find(btn => btn.getAttribute("title") === "Edit");
		expect(editButton).toBeDefined();
		if (editButton) {
			fireEvent.click(editButton);
		}

		expect(screen.queryByText("Close")).toBeInTheDocument();
	});

	it("renders with preconditionErrorMap provided", () => {
		const tableData: PreconditionRepeatRowType[] = [{ id: "row1", precondition: "cond" }];
		const errorMap = [
			{
				[ErrorSeverity.ERROR]: [],
				[ErrorSeverity.WARNING]: [],
				[ErrorSeverity.INFO]: [],
			},
		];
		const { container } = renderWithProviders(
			<PreconditionsRepeat
				tableData={tableData}
				setTableData={mockSetTableData}
				preconditionErrorMap={errorMap}
			/>
		);
		expect(container).toBeTruthy();
	});
});

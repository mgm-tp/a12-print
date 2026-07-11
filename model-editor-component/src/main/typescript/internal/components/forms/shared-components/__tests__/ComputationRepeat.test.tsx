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

import type { ComputationRepeatRowType } from "../ComputationRepeat.js";
import { ComputationRepeat } from "../ComputationRepeat.js";

describe("ComputationRepeat", () => {
	const mockSetTableData = jest.fn();

	const setupTest = (tableData: ComputationRepeatRowType[] = [], initiallyExpanded = false) =>
		renderWithProviders(
			<ComputationRepeat
				documentModel={undefined}
				tableData={tableData}
				setTableData={mockSetTableData}
				initiallyExpanded={initiallyExpanded}
			/>
		);

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

	it("renders the precondition column header", () => {
		const { queryByText } = setupTest();
		expect(queryByText("Precondition")).toBeInTheDocument();
	});

	it("renders the operation column header", () => {
		const { queryByText } = setupTest();
		expect(queryByText("Operation")).toBeInTheDocument();
	});

	it("renders with one row of data", () => {
		const tableData: ComputationRepeatRowType[] = [
			{ id: "row1", precondition: "myPrecondition", operation: "myOp" },
		];
		const { queryByText } = setupTest(tableData);
		expect(queryByText("myPrecondition")).toBeInTheDocument();
		expect(queryByText("myOp")).toBeInTheDocument();
	});

	it("renders with multiple rows of data", () => {
		const tableData: ComputationRepeatRowType[] = [
			{ id: "row1", precondition: "precond1", operation: "op1" },
			{ id: "row2", precondition: "precond2", operation: "op2" },
		];
		const { queryByText } = setupTest(tableData);
		expect(queryByText("precond1")).toBeInTheDocument();
		expect(queryByText("precond2")).toBeInTheDocument();
	});

	it("calls setTableData with a new row when Add is clicked", () => {
		const { getByText } = setupTest([]);

		fireEvent.click(getByText("Add"));

		expect(mockSetTableData).toHaveBeenCalledTimes(1);
		const newData = mockSetTableData.mock.calls[0][0] as ComputationRepeatRowType[];
		expect(newData).toHaveLength(1);
		expect(newData[0].id).toBeDefined();
	});

	it("calls setTableData with appended row when Add is clicked with existing data", () => {
		const existingRow: ComputationRepeatRowType = { id: "existing", precondition: "old", operation: "op" };
		const { getByText } = setupTest([existingRow]);

		fireEvent.click(getByText("Add"));

		expect(mockSetTableData).toHaveBeenCalledTimes(1);
		const newData = mockSetTableData.mock.calls[0][0] as ComputationRepeatRowType[];
		expect(newData).toHaveLength(2);
		expect(newData[0]).toBe(existingRow);
	});

	it("calls setTableData when delete button is clicked", () => {
		const tableData: ComputationRepeatRowType[] = [{ id: "row1", precondition: "cond", operation: "op" }];
		const { getAllByRole } = setupTest(tableData);

		const deleteButton = getAllByRole("button").find(btn => btn.getAttribute("title") === "Delete");
		expect(deleteButton).toBeDefined();
		if (deleteButton) {
			fireEvent.click(deleteButton);
		}

		expect(mockSetTableData).toHaveBeenCalledTimes(1);
		const newData = mockSetTableData.mock.calls[0][0] as ComputationRepeatRowType[];
		expect(newData).toHaveLength(0);
	});

	it("expands row when edit button is clicked", () => {
		const tableData: ComputationRepeatRowType[] = [{ id: "row1", precondition: "cond", operation: "op" }];
		const { getAllByRole } = setupTest(tableData);

		const editButton = getAllByRole("button").find(btn => btn.getAttribute("title") === "Edit");
		expect(editButton).toBeDefined();
		if (editButton) {
			fireEvent.click(editButton);
		}

		expect(screen.queryByText("Close")).toBeInTheDocument();
	});

	it("expands first row automatically when initiallyExpanded is true and data exists", () => {
		const tableData: ComputationRepeatRowType[] = [{ id: "row1", precondition: "cond", operation: "op" }];
		setupTest(tableData, true);

		expect(screen.queryByText("Close")).toBeInTheDocument();
	});

	it("does not expand when initiallyExpanded is true but data is empty", () => {
		setupTest([], true);

		expect(screen.queryByText("Close")).not.toBeInTheDocument();
	});

	it("renders with computationErrorMap provided", () => {
		const tableData: ComputationRepeatRowType[] = [{ id: "row1", precondition: "cond", operation: "op" }];
		const errorMap = [
			{
				[ErrorSeverity.ERROR]: [],
				[ErrorSeverity.WARNING]: [],
				[ErrorSeverity.INFO]: [],
			},
		];
		const { container } = renderWithProviders(
			<ComputationRepeat
				documentModel={undefined}
				tableData={tableData}
				setTableData={mockSetTableData}
				computationErrorMap={errorMap}
			/>
		);
		expect(container).toBeTruthy();
	});

	it("renders with a documentModel reference", () => {
		const tableData: ComputationRepeatRowType[] = [{ id: "row1", precondition: "cond", operation: "op" }];
		const { container } = renderWithProviders(
			<ComputationRepeat documentModel="TestDocument" tableData={tableData} setTableData={mockSetTableData} />
		);
		expect(container).toBeTruthy();
	});
});

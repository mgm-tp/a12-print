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
import type { Reducer } from "redux";

import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import type {
	PartialTableLayout,
	PartialText,
	TableLayoutCellReference,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";
import type { TransactionLogStore } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { SidebarItem, TransactionLog } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";

import type { PrintEditorState } from "../../../redux/index.js";
import { EditorStateReducer, TransactionLogStateReducer, initialStateLogStore } from "../../../redux/index.js";
import {
	renderWithProviders,
	defaultPrintEditorState,
	initialStateLogStoreMock,
} from "../../../../../../test/typescript/test-utils/index.js";

import type { FilledCellProps } from "../table-layout/index.js";
import { FilledCell, FilledCellActionsWrapper } from "../table-layout/index.js";

describe("TableLayout", () => {
	describe("FilledCellActionsWrapper", () => {
		it("should render correctly", () => {
			const mockOnEditClick = jest.fn();
			const mockOnDeleteClick = jest.fn();

			const { queryByRole, getByRole } = renderWithProviders(
				<FilledCellActionsWrapper onDeleteClick={mockOnDeleteClick} onEditClick={mockOnEditClick} />
			);

			expect(queryByRole("button", { name: /edit/i })).toBeInTheDocument();
			expect(queryByRole("button", { name: /delete/i })).toBeInTheDocument();

			fireEvent.click(getByRole("button", { name: /edit/i }));

			expect(mockOnEditClick).toHaveBeenCalled();

			fireEvent.click(getByRole("button", { name: /delete/i }));

			expect(mockOnDeleteClick).toHaveBeenCalled();
		});
	});

	describe("FilledCell", () => {
		const cellRefMock: DeepPartial<TableLayoutCellReference> = {
			id: "mgo4e2mh4oh4",
			row: 0,
			column: 0,
			refId: "textElId123",
		};

		const textElementMock: PartialText = {
			id: "textElId123",
			type: ElementType.Text,
			text: { id: "onjmgoq23g3q", text: "foo" },
			textProperties: {
				id: "textPropertiesId",
				textStyleId: {
					id: "h4ohqgepo",
					source: PossibleInputSource.DEFAULT,
					path: "/content/elementDefinitions/textProperties/textStyleId/value/",
				},
			},
		};

		const tableLayoutMock: PartialTableLayout = {
			id: "foo-id",
			type: ElementType.TableLayout,
			tableLayout: {
				id: "mgo4e2mh4ohqgepoeqkgoqe4",
				rowCount: 1,
				columnCount: 1,
				cells: [cellRefMock],
			},
		};

		const baseCellPropsMock: FilledCellProps = {
			row: 0,
			col: 0,
			columnProps: undefined,
			borderProperties: undefined,
			element: tableLayoutMock,
			cellRef: cellRefMock,
		};

		const EditorStateReducerMock: Reducer = (
			state: PrintEditorState = {
				...defaultPrintEditorState,
				printModelRefs: {
					segmentId: "",
					sectionId: "",
					watermarkId: "",
					currentRefType: SidebarItem.SEGMENT,
				},
			},
			action
		) => EditorStateReducer(state, action);

		const initialState: TransactionLogStore = {
			...initialStateLogStoreMock,
			segments: { id: "mgoemhbrwolnhreln", map: {}, references: {} },
			printModelElements: {
				textElId123: TransactionLog.createStoreEntryPrintModelElement(
					initialStateLogStore.printModelElements,
					textElementMock,
					"qwpfkpogkj310g"
				).storeEntry,
				"foo-id": TransactionLog.createStoreEntryPrintModelElement(
					initialStateLogStore.printModelElements,
					tableLayoutMock,
					"okjg04hj4209h4j"
				).storeEntry,
			},
		};

		const TransactionLogStateMock: Reducer = (state: TransactionLogStore = initialState, action) =>
			TransactionLogStateReducer(state, action);

		const setupTest = () =>
			renderWithProviders(
				<table>
					<tbody>
						<tr>
							<FilledCell {...baseCellPropsMock} />
						</tr>
					</tbody>
				</table>,
				{
					PrintEditorState: EditorStateReducerMock,
					TransactionLogState: TransactionLogStateMock,
				}
			);

		it("should renders correctly", () => {
			const { container } = setupTest();

			expect(container).toMatchSnapshot();
		});

		it("should render Edit and Remove button when hover on FilledCell", () => {
			const { getByText, queryByRole } = setupTest();

			expect(queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
			expect(queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();

			fireEvent.mouseEnter(getByText("foo"));

			expect(queryByRole("button", { name: /edit/i })).toBeInTheDocument();
			expect(queryByRole("button", { name: /delete/i })).toBeInTheDocument();

			fireEvent.mouseLeave(getByText("foo"));

			expect(queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
			expect(queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
		});
	});
});

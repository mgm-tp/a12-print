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
import { Reducer } from "redux";

import {
	TransactionLog,
	TransactionLogStore,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/transaction-log.js";
import { ElementType } from "@com.mgmtp.a12.print/print-model-api/lib/model/elements/print-model-element.js";
import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";

import {
	EditorStateReducer,
	initialStateLogStore,
	PrintEditorState,
	SidebarReducer,
	SidebarState,
	TransactionLogStateReducer,
} from "../../../redux/index.js";
import { EDITOR_CONTEXT_DEFAULT_VALUE, EditorContext, IEditorContext } from "../../editor-stage/editor-context.js";
import { createMmMeasureFromPx } from "../../../utils/measure-utils.js";
import { DefaultQuickEditBar } from "../../quick-edit-bar/DefaultQuickEditBar.js";
import { ToolbarItem } from "../../../types/toolbar-item.js";
import {
	defaultPrintEditorState,
	initialStateLogStoreMock,
	renderWithProviders,
} from "../../../../../../test/typescript/test-utils/index.js";

import { Toolbar } from "../index.js";

describe("Toolbar", () => {
	const EditorStateReducerMock: Reducer = (state: PrintEditorState = defaultPrintEditorState, action) =>
		EditorStateReducer(state, action);

	const SidebarReducerMock: Reducer = (
		state: SidebarState = {
			selectedItem: SidebarItem.SEGMENT,
			isFullscreen: false,
			isOpen: true,
		},
		action
	) => SidebarReducer(state, action);

	const elementMock = {
		id: "element-id",
		type: ElementType.Text,
	};
	const elementRefMock = {
		id: "nmgo3jgh4920h4",
		refId: elementMock.id,
		position: { id: "jkr03j1t03", x: createMmMeasureFromPx(0), y: createMmMeasureFromPx(0) },
		dimensions: { id: "gmkj3ogj429zh", minWidth: createMmMeasureFromPx(1), minHeight: createMmMeasureFromPx(1) },
	};
	const EditorContextMock: IEditorContext = {
		...EDITOR_CONTEXT_DEFAULT_VALUE,
		elementReferences: [elementRefMock],
	};
	const deleteSelectedElsMock = jest.fn();

	const transactionStateMock = {
		...initialStateLogStoreMock,
		printModelElements: {
			[elementMock.id]: TransactionLog.createStoreEntryPrintModelElement(
				initialStateLogStore.printModelElements,
				elementMock,
				"qopjkt9g32o0j"
			).storeEntry,
		},
	};

	const TransactionLogStateMock: Reducer = (state: TransactionLogStore = transactionStateMock, action) =>
		TransactionLogStateReducer(state, action);

	const setupTest = () => {
		return renderWithProviders(
			<EditorContext.Provider value={EditorContextMock}>
				<Toolbar
					leftItems={[ToolbarItem.ElementLibrary, ToolbarItem.ZoomFactor, ToolbarItem.HideFrames]}
					rightItems={[
						<DefaultQuickEditBar
							key="quick-edit-bar"
							selected={[elementMock.id]}
							deleteSelectedEls={deleteSelectedElsMock}
						/>,
					]}
				/>
			</EditorContext.Provider>,
			{
				Sidebar: SidebarReducerMock,
				PrintEditorState: EditorStateReducerMock,
				TransactionLogState: TransactionLogStateMock,
			}
		);
	};

	it("renders correctly", () => {
		const { container } = setupTest();
		expect(container).toMatchSnapshot();
	});
});

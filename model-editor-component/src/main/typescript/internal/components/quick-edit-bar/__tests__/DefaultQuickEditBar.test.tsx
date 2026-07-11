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
import type { Reducer } from "redux";

import type { TransactionLogStore } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { TransactionLog, SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { Segment, PartialText } from "@com.mgmtp.a12.print/print-model-api/model";
import { SegmentType, ElementType } from "@com.mgmtp.a12.print/print-model-api/model";

import type { PrintEditorState } from "../../../redux/index.js";
import { EditorStateReducer, initialStateLogStore, TransactionLogStateReducer } from "../../../redux/index.js";
import type { IEditorContext } from "../../editor-stage/editor-context.js";
import { EDITOR_CONTEXT_DEFAULT_VALUE, EditorContext } from "../../editor-stage/editor-context.js";
import { createMmMeasure, createMmMeasureFromPx } from "../../../utils/measure-utils.js";
import {
	renderWithProviders,
	initialStateLogStoreMock,
	defaultPrintEditorState,
} from "../../../../../../test/typescript/test-utils/index.js";

import { DefaultQuickEditBar } from "../DefaultQuickEditBar.js";

describe("DefaultQuickEditBar", () => {
	const deleteSelectedElsMock = jest.fn();
	const setCopyElementsMock = jest.fn();
	const textElementMock: PartialText = {
		id: "textElId123",
		type: ElementType.Text,
		text: { id: "mngho492hj4h4", text: "foo" },
	};
	const textRefMock = {
		id: "mgo4mgh4oh42",
		refId: textElementMock.id,
		position: { id: "mgh05j53j5", x: createMmMeasure(0), y: createMmMeasure(0) },
		dimensions: {
			id: "mhpormh5r3h0j530j",
			minWidth: createMmMeasure(1),
			minHeight: createMmMeasure(1),
		},
	};

	const imageElementMock = {
		id: "imageElId123",
		type: ElementType.Image,
		image: {
			id: "ingi1gn4i2g1",
			dimensions: { id: "mf4o2mg43o2g", height: createMmMeasureFromPx(60), width: createMmMeasureFromPx(50) },
		},
	};
	const imageRefMock = {
		id: "hm4ohm530jk64j0",
		refId: imageElementMock.id,
		position: { id: "mgo04mh54jh534", x: createMmMeasureFromPx(100), y: createMmMeasureFromPx(200) },
		dimensions: { id: "mg4omh539oh54j", minWidth: createMmMeasureFromPx(50), minHeight: createMmMeasureFromPx(60) },
	};

	const EditorContextMock: IEditorContext = {
		...EDITOR_CONTEXT_DEFAULT_VALUE,
		elementReferences: [textRefMock, imageRefMock],
		setCopyElements: setCopyElementsMock,
	};
	const segmentMock: Segment = {
		id: "someSegmentId123",
		title: "my first segment",
		type: SegmentType.Default,
		elementReferences: [],
	};

	const initialStateMock: TransactionLogStore = {
		...initialStateLogStoreMock,
		segments: {
			id: "mgho42wmnh5439oj35",
			map: {
				...initialStateLogStoreMock.segments.map,
				someSegmentId123: TransactionLog.createStoreEntrySegment(
					initialStateLogStore.segments,
					segmentMock,
					"12312531"
				).storeEntry,
			},
			references: {},
		},
		printModelElements: {
			[textElementMock.id]: TransactionLog.createStoreEntryPrintModelElement(
				initialStateLogStore.printModelElements,
				textElementMock,
				"qopjkt9g32o0j"
			).storeEntry,
			[imageElementMock.id]: TransactionLog.createStoreEntryPrintModelElement(
				initialStateLogStore.printModelElements,
				imageElementMock,
				"qewroasdfcasf"
			).storeEntry,
		},
	};

	const TransactionLogStateMock: Reducer = (state: TransactionLogStore = initialStateMock, action) =>
		TransactionLogStateReducer(state, action);

	const EditorStateReducerMock: Reducer = (
		state: PrintEditorState = {
			...defaultPrintEditorState,
			printModelRefs: {
				currentRefType: SidebarItem.SEGMENT,
				segmentId: "",
				sectionId: "",
				watermarkId: "",
			},
		},
		action
	) => EditorStateReducer(state, action);

	const setupTest = (selectedElId = textElementMock.id) => {
		return renderWithProviders(
			<EditorContext.Provider value={{ ...EditorContextMock }}>
				<DefaultQuickEditBar selected={[selectedElId]} deleteSelectedEls={deleteSelectedElsMock} />,
			</EditorContext.Provider>,
			{
				PrintEditorState: EditorStateReducerMock,
				TransactionLogState: TransactionLogStateMock,
			}
		);
	};

	it("should renders correctly", () => {
		const { container, queryByPlaceholderText, queryByLabelText } = setupTest();

		expect(container).toMatchSnapshot();
		expect(queryByPlaceholderText("Top")).toBeInTheDocument();
		expect(queryByPlaceholderText("Left")).toBeInTheDocument();
		expect(queryByPlaceholderText("Width")).toBeInTheDocument();
		expect(queryByPlaceholderText("Height")).toBeInTheDocument();
		expect(queryByLabelText(/delete selected elements/i)).toBeInTheDocument();
		expect(queryByLabelText(/copy selected elements/i)).toBeInTheDocument();
		expect(queryByLabelText(/open detail edit/i)).toBeInTheDocument();
	});
});

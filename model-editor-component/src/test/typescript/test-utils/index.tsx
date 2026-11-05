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
import type { Reducer } from "redux";

import type {
	PrintModelContentGeneral,
	PrintModelHeader,
	Segment,
	PartialTextStyle,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	PageOrientation,
	SegmentReferenceDirection,
	SegmentReferencePurpose,
	SegmentType,
	Semantic,
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	PRINT_MODEL_HEADER_LOG_ID,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	type StoreEntryMapWithId,
	TransactionLog,
	type TransactionLogStore,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { PRINT_MODEL_VERSION } from "@com.mgmtp.a12.print/print-model-api/constant";

import type { PrintEditorState } from "../../../main/typescript/internal/redux/index.js";
import { initialStateLogStore, TransactionLogStateReducer } from "../../../main/typescript/internal/redux/index.js";
import {
	DEFAULT_TEXT_STYLE_ID,
	DEFAULT_TEXT_STYLE_NAME,
} from "../../../main/typescript/internal/constant/textstyle.js";

export { renderWithProviders } from "./render-with-provider.js";
export * from "./utils.js";
export * from "./fragment-placement-utils.js";
export { setupTestWithSchema } from "./schema.js";

export const mockSegment: Segment = {
	id: "someSegmentId123",
	title: "my first segment",
	type: SegmentType.Default,
	defaultSegment: { id: "bpoqkwr21", pageOrientation: PageOrientation.Portrait },
	elementReferences: [],
};

export const mockRepeatableSegment: Segment = {
	id: "someSegmentId456",
	title: "my second segment",
	type: SegmentType.Repeatable,
	defaultSegment: { id: "bsda5a3", pageOrientation: PageOrientation.Portrait },
	dataContexts: [
		{
			id: "xcvwrrv",
			isRepetition: true,
			model: "TestDocument",
			path: "/RepeatableGroup",
		},
	],
	elementReferences: [],
};

export const mockPrintModelHeader: PrintModelHeader = {
	modelType: "print",
	modelVersion: PRINT_MODEL_VERSION,
	description: "description",
	id: PRINT_MODEL_HEADER_LOG_ID,
	modelReferences: [
		{ id: "modelReferenceId", reference: "TestDocument", modelType: "document", purpose: "data binding" },
	],
};

export const mockPrintModelContentGeneral: PrintModelContentGeneral = {
	id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	metadata: {
		id: "oangje9o13",
		titleComputation: [{ id: "titleComputation1", operation: '"Print Model Content General"' }],
		descriptionComputation: [{ id: "descriptionComputation1", operation: '"description"' }],
		authorComputation: [{ id: "authorComputation1", operation: '"test"' }],
		languageComputation: [{ id: "languageComputation1", operation: '"DE"' }],
	},
	segmentDefaults: {
		id: "onjqg319qgt3",
		fontSize: 12,
	},
	structure: [mockSegment.id, mockRepeatableSegment.id],
};

export const defaultPrintEditorState: PrintEditorState = {
	editorOptions: {
		zoomFactor: 1,
		showHelperLines: true,
		isSnapToHL: true,
	},
	editorStates: {
		helperLines: {
			vertical: [],
			horizontal: [],
		},
		showBorders: true,
	},
	sidebar: {
		selectedTextStyleId: DEFAULT_TEXT_STYLE_ID,
	},
	isDinEditable: false,
	defaultTextStyle: {
		id: DEFAULT_TEXT_STYLE_ID,
		name: DEFAULT_TEXT_STYLE_NAME,
		font: "Open Sans",
		fontSize: 12,
		lineHeight: 18,
		semantic: Semantic.P,
	},
	fonts: {
		default: {
			name: "default",
			fontFamily: "default",
			isReconfigured: false,
			isDefault: true,
			url: "default url",
		},
		"Open Sans": {
			name: "Open Sans",
			fontFamily: "Open Sans",
			isReconfigured: true,
			isDefault: false,
			url: "open sans url",
		},
		"Noto Sans Mono": {
			name: "Noto Sans Mono",
			fontFamily: "Noto Sans Mono",
			isReconfigured: true,
			isDefault: false,
			url: "noto sans url",
		},
	},
};

export const initialStateLogStoreMock: TransactionLogStore = {
	[PRINT_MODEL_HEADER_LOG_ID]: TransactionLog.createStoreEntryPrintModelHeader(
		initialStateLogStore[PRINT_MODEL_HEADER_LOG_ID],
		mockPrintModelHeader,
		"ojt91qwe41"
	).storeEntry,
	[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: TransactionLog.createStoreEntryPrintModelContentGeneral(
		initialStateLogStore[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
		mockPrintModelContentGeneral,
		"ojt913thj319"
	).storeEntry,
	segments: {
		id: "oiqjgeqigj391",
		map: {
			someSegmentId123: TransactionLog.createStoreEntrySegment(
				initialStateLogStore.segments,
				mockSegment,
				"j91thg391th39"
			).storeEntry,
			someSegmentId456: TransactionLog.createStoreEntrySegment(
				initialStateLogStore.segments,
				mockRepeatableSegment,
				"z3thg512th52"
			).storeEntry,
		},
		references: {},
	},
	printModelElements: {},
};

export const createTransactionLogState = (
	stateLogStoreMock: TransactionLogStore = initialStateLogStoreMock
): Reducer => {
	return (
		state: TransactionLogStore = {
			...stateLogStoreMock,
		},
		action
	) => TransactionLogStateReducer(state, action);
};

export const DIN_TEMPLATE_SEGMENT_ID = "din-template-segment-1";

export const mockDinTemplateSegment: Segment = {
	...mockSegment,
	id: DIN_TEMPLATE_SEGMENT_ID,
	dinTemplate: { id: "din-props-1", referenceId: "din-ref-1", refId: "din-target-1" },
};

/**
 * A log store that additionally holds {@link mockDinTemplateSegment}, so `isDinTemplateSegmentEditor`
 * turns true once the editor navigates to {@link DIN_TEMPLATE_SEGMENT_ID}.
 */
export const logStoreWithDinTemplateSegment: TransactionLogStore = {
	...initialStateLogStoreMock,
	segments: {
		...initialStateLogStoreMock.segments!,
		map: {
			...initialStateLogStoreMock.segments!.map,
			[DIN_TEMPLATE_SEGMENT_ID]: TransactionLog.createStoreEntrySegment(
				initialStateLogStore.segments,
				mockDinTemplateSegment,
				"din-interaction-1"
			).storeEntry,
		},
	},
};

const INCOMING_DIN_REFERENCE_ID = "incoming-din-ref-1";

/**
 * A log store carrying an incoming DINTemplate segment reference, which is what
 * `isIncomingDinTemplatePrintModel` keys on.
 */
export const logStoreWithIncomingDinTemplateReference: TransactionLogStore = {
	...initialStateLogStoreMock,
	segments: {
		...initialStateLogStoreMock.segments!,
		references: {
			[INCOMING_DIN_REFERENCE_ID]: TransactionLog.createStoreEntrySegmentReference(
				initialStateLogStore.segments.references,
				{
					id: INCOMING_DIN_REFERENCE_ID,
					referenceModel: "some-other-print-model",
					purpose: SegmentReferencePurpose.DINTemplate,
					direction: SegmentReferenceDirection.IncomingReference,
					refIds: [],
				},
				"din-interaction-2"
			).storeEntry,
		},
	},
};

export const testTextStyle: PartialTextStyle = {
	id: "testId",
	name: "Test Text Style",
	font: "Open Sans",
	fontSize: 12,
	lineHeight: 18,
	semantic: Semantic.P,
};

export const textStylesMock: StoreEntryMapWithId<PartialTextStyle> = {
	id: "mgoq3emg942hzj",
	map: {
		[testTextStyle.id]: TransactionLog.createStoreEntryTextStyle(
			initialStateLogStore.textStyles,
			testTextStyle,
			"interaction1"
		).storeEntry,
	},
};

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
import { Action, Reducer } from "redux";

import { TransactionLogStore } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";

import { PrintEngineActions } from "../../store/actions.js";
import { DEFAULT_TEXT_STYLE_ID, DEFAULT_TEXT_STYLE } from "../../constant/textstyle.js";

import { EditorStateActions } from "./actions.js";
import { EditorMode, PrintEditorState, PrintModelRefs } from "./state.js";

const defaultEditorState: PrintEditorState = {
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
		editorMode: EditorMode.Default,
		showBorders: true,
		isMarginVisible: true,
	},
	sidebar: { selectedTextStyleId: DEFAULT_TEXT_STYLE_ID },
	defaultTextStyle: DEFAULT_TEXT_STYLE,
	fonts: {},
	isDinEditable: true,
};

export const EditorStateReducer: Reducer<PrintEditorState> = (
	state: PrintEditorState = defaultEditorState,
	action: Action
): PrintEditorState => {
	if (PrintEngineActions.resetState.match(action)) {
		return defaultEditorState;
	}
	if (EditorStateActions.updateEditorOptions.match(action)) {
		return {
			...state,
			editorOptions: {
				...state.editorOptions,
				...action.payload,
			},
		};
	}
	if (EditorStateActions.update.match(action)) {
		return {
			...state,
			editorStates: {
				...state.editorStates,
				...action.payload,
			},
		};
	}
	if (EditorStateActions.updateEditorMode.match(action)) {
		return {
			...state,
			editorStates: {
				...state.editorStates,
				...action.payload,
			},
		};
	}
	if (EditorStateActions.updatePrintModelRefs.match(action)) {
		return {
			...state,
			printModelRefs: { ...action.payload },
		};
	}
	if (EditorStateActions.deletePrintModelRefs.match(action)) {
		return {
			...state,
			printModelRefs: undefined,
		};
	}
	if (EditorStateActions.updateSelectedTextStyleId.match(action)) {
		return {
			...state,
			sidebar: {
				...state.sidebar,
				selectedTextStyleId: action.payload,
			},
		};
	}
	if (EditorStateActions.setDefaultTextStyle.match(action)) {
		return {
			...state,
			defaultTextStyle: {
				...state.defaultTextStyle,
				...action.payload,
			},
		};
	}
	if (EditorStateActions.setFonts.match(action)) {
		return {
			...state,
			fonts: action.payload,
		};
	}
	if (PrintEngineActions.removeInvalidSelections.match(action)) {
		return {
			...state,
			printModelRefs: filterExistingPrintModelRefs(state.printModelRefs, action.payload),
			sidebar: {
				selectedTextStyleId: filterExistingTextStyleId(state.sidebar.selectedTextStyleId, action.payload),
			},
		};
	}

	return state;
};

function filterExistingTextStyleId(selectedTextStyleId: string, transactionLogStore: TransactionLogStore) {
	if (!transactionLogStore.textStyles?.map?.[selectedTextStyleId]) {
		return DEFAULT_TEXT_STYLE_ID;
	}
	return selectedTextStyleId;
}

function filterExistingPrintModelRefs(
	printModelRefs: PrintModelRefs | undefined,
	transactionLogStore: TransactionLogStore
) {
	if (!printModelRefs) {
		return undefined;
	}

	const { segmentId, sectionId, watermarkId } = printModelRefs;

	const updatedPrintRefs = { ...printModelRefs };

	if (!transactionLogStore.segments?.map?.[segmentId]) {
		updatedPrintRefs.segmentId = "";
	}
	if (!transactionLogStore.sections?.map?.[sectionId]) {
		updatedPrintRefs.sectionId = "";
	}
	if (!transactionLogStore.watermarks?.map?.[watermarkId]) {
		updatedPrintRefs.watermarkId = "";
	}

	return updatedPrintRefs;
}

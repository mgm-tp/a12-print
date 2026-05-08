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
import { createAction, createSlice, PayloadAction, Slice } from "@reduxjs/toolkit";

import {
	InteractionLogPersistentEntry,
	LogPersistentEntry,
	PartialTransactionLogPersistentEntry,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log";
import { Model } from "@com.mgmtp.a12.base/base-model-api/lib/main/model";

import type { ResolvedCaseConfigResource, CaseConfig } from "../components/case-config/CaseConfig";

import type { RootState } from "./types";

export interface Editor {
	printModel?: Model;
	caseConfig?: CaseConfig;
	caseResource?: ResolvedCaseConfigResource;
	logPersistentEntries?: LogPersistentEntry[];
	hasExternalStore?: boolean;
	isBasicEditor?: boolean;
}

const initialState: Editor = {};

export const editorSlice: Slice<
	Editor,
	{
		setPrintModel: (state: Editor, action: PayloadAction<Model>) => void;
		setCaseConfig: (state: Editor, action: PayloadAction<CaseConfig>) => void;
		setCaseResource: (state: Editor, action: PayloadAction<ResolvedCaseConfigResource>) => Editor;
		clearEditorState: (state: Editor) => void;
		setLogPersistentEntries: (state: Editor, action: PayloadAction<LogPersistentEntry[]>) => void;
		setHasExternalStore: (state: Editor, action: PayloadAction<boolean>) => void;
		toggleIsBasicEditor: (state: Editor) => void;
	},
	"editorSlice"
> = createSlice({
	name: "editorSlice",
	initialState,
	reducers: {
		setPrintModel: (state, action: PayloadAction<Model>) => {
			state.printModel = action.payload;
		},
		setCaseConfig: (state, action: PayloadAction<CaseConfig>) => {
			state.caseConfig = action.payload;
		},
		setCaseResource: (state, action: PayloadAction<ResolvedCaseConfigResource>) => {
			return {
				...state,
				caseResource: action.payload,
			};
		},
		clearEditorState: state => {
			state.caseConfig = undefined;
			state.logPersistentEntries = undefined;
			state.hasExternalStore = undefined;
		},
		setLogPersistentEntries: (state, action: PayloadAction<LogPersistentEntry[]>) => {
			state.logPersistentEntries = action.payload;
		},
		setHasExternalStore: (state, action: PayloadAction<boolean>) => {
			state.hasExternalStore = action.payload;
		},
		toggleIsBasicEditor: state => {
			state.isBasicEditor = state.caseResource?.documentModels?.length === 1 && !state.isBasicEditor;
		},
	},
});

export const EditorSelector = {
	selectPrintModel: (state: RootState) => state.editor.printModel,
	selectCaseConfig: (state: RootState) => state.editor.caseConfig,
	selectCaseResource: (state: RootState) => state.editor.caseResource,
	selectIsBasicEditorPossible: (state: RootState) => state.editor.caseResource?.documentModels?.length === 1,
	selectIsBasicEditor: (state: RootState) =>
		state.editor.isBasicEditor && state.editor.caseResource?.documentModels?.length === 1,
	selectLogPersistentEntries: (state: RootState) => state.editor.logPersistentEntries,
	selectHasExternalStore: (state: RootState) => state.editor.hasExternalStore,
};

export interface PersistLogsPayload {
	printModelId: string;
	transactionLogs?: PartialTransactionLogPersistentEntry[];
	interactionLog?: InteractionLogPersistentEntry;
}

export interface CommitPrintModelPayload {
	printModel: Model;
	overwriteLog: boolean;
	persistentEntries?: LogPersistentEntry[];
}

export interface SetPrintModelReferencesPayload {
	printModels: Model[];
	resolve: () => void;
}

export const EditorActions = {
	...editorSlice.actions,
	persistLogs: createAction<PersistLogsPayload>("PERSIST_LOGS"),
	batchPersistLogs: createAction<PersistLogsPayload[]>("BATCH_PERSIST_LOGS"),
	commitPrintModel: createAction<CommitPrintModelPayload>("COMMIT_PRINT_MODEL"),
	discardChanges: createAction("DISCARD_CHANGES"),
	setPrintModelReferences: createAction<SetPrintModelReferencesPayload>("SET_PRINT_MODEL_REFERENCES"),
};

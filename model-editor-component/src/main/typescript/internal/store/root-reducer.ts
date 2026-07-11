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
import { combineReducers } from "redux";

import type { PrintEngineState } from "../../a12internal/api/PrintEngineState.js";

import { CommitViewReducer } from "../redux/commit-view/index.js";
import { EditorStateReducer } from "../redux/editor-state/index.js";
import { TransactionLogStateReducer } from "../redux/transaction-log-state/index.js";
import { InteractionLogReducer } from "../redux/interaction-log/index.js";
import { RequestApiReducer } from "../redux/request-api/index.js";
import { ValidationReducer } from "../redux/validation/index.js";
import { ConfirmationDialogReducer } from "../redux/confirmation-dialog/index.js";
import { GeneralViewReducer } from "../redux/index.js";
import { DocumentModelDataReducer } from "../redux/document-model-data/reducer.js";
import { NavigationReducer } from "../redux/navigation/index.js";

export namespace PrintEditorComponentReducer {
	export const reducers = {
		PrintEditorState: EditorStateReducer,
		DocumentModelData: DocumentModelDataReducer,
		TransactionLogState: TransactionLogStateReducer,
		RequestApi: RequestApiReducer,
		InteractionLogState: InteractionLogReducer,
		ValidationState: ValidationReducer,
		CommitViewState: CommitViewReducer,
		ConfirmationDialogState: ConfirmationDialogReducer,
		GeneralViewState: GeneralViewReducer,
		Navigation: NavigationReducer,
	};

	export const rootReducer: Reducer<PrintEngineState> = combineReducers({
		...PrintEditorComponentReducer.reducers,
	});
}

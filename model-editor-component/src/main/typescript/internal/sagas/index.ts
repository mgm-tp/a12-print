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
import { all, fork } from "typed-redux-saga";

import {
	commitChangesSaga,
	discardChangesSaga,
	navigateIntoViewSaga,
	validateChangesSaga,
	initialCommitViewSaga,
	setCommitInteractionRowsSaga,
} from "./commit-view/index.js";
import {
	loadPrintModelSaga,
	loadReferencedPrintModelSaga,
	loadReferencedPrintModelsSaga,
	loadTypesettingModelSaga,
	loadTypesettingModelsSaga,
	loadTypesettingModelHeaders,
	setPrintModelSaga,
	initializePrintModelSaga,
	loadDocumentModelIdsSaga,
	loadPrintModelIdsSaga,
} from "./request-api/index.js";
import { openDetailViewSaga, openVisibilityConfigSaga, updateVisibilityConfigSaga } from "./detail-view/index.js";
import {
	processAllLogActionsSaga,
	setDeserializePrintModelResultSaga,
	setSerializePrintModelResultSaga,
	watchSetLogStoreSaga,
} from "./transaction-log/index.js";
import { setCurrentViewSaga } from "./sidebar/index.js";
import {
	redoInteractionSaga,
	startInteractionSaga,
	undoInteractionSaga,
	updateElementHeightDomNodeSaga,
	updateElementHeightTextStyleSaga,
} from "./interaction-log/index.js";
import { addReferenceEntrySaga } from "./din-template/index.js";
import { validateTextStylesSaga } from "./text-style/index.js";
import { openEditorView } from "./editor/index.js";
import { addModelReferenceSaga } from "./schema/index.js";
import {
	batchLoadDocumentModelDataSaga,
	loadDocumentModelDataSaga,
} from "./document-model-data/load-document-model-data-saga.js";
import { loadDinTemplatePrintModelSaga } from "./request-api/load-din-template-print-model-saga.js";

export namespace PrintEditorComponentSagas {
	export const sagas = {
		openDetailViewSaga,
		loadDocumentModelDataSaga,
		batchLoadDocumentModelDataSaga,
		loadDocumentModelIdsSaga,
		loadPrintModelSaga,
		setPrintModelSaga,
		loadReferencedPrintModelSaga,
		loadReferencedPrintModelsSaga,
		loadTypesettingModelHeaders,
		loadTypesettingModelSaga,
		loadTypesettingModelsSaga,
		commitChangesSaga,
		discardChangesSaga,
		validateChangesSaga,
		navigateIntoViewSaga,
		initialCommitViewSaga,
		setCommitInteractionRowsSaga,
		processAllLogActionsSaga,
		watchSetLogStoreSaga,
		setSerializePrintModelResultSaga,
		setDeserializePrintModelResultSaga,
		setCurrentViewSaga,
		startInteractionSaga,
		undoInteractionSaga,
		redoInteractionSaga,
		updateElementHeightTextStyleSaga,
		updateElementHeightDomNodeSaga,
		addReferenceEntrySaga,
		loadDinTemplatePrintModelSaga,
		loadPrintModelIdsSaga,
		openVisibilityConfigSaga,
		updateVisibilityConfigSaga,
		validateTextStylesSaga,
		openEditorView,
		addModelReferenceSaga,
		initializePrintModelSaga,
	};

	export function* rootSaga() {
		yield* all(Object.values(sagas).map(saga => fork(saga)));
	}
}

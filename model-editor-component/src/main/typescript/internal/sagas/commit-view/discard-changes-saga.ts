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
import { SagaIterator } from "redux-saga";
import { call, getContext, put, select, takeLeading } from "typed-redux-saga";
import { AnyAction } from "typescript-fsa";

import { Log } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";

import { RequestApi } from "../../api/index.js";
import {
	CommitViewActions,
	ConfirmationDialogType,
	InteractionLogActions,
	TransactionLogStateActions,
} from "../../redux/index.js";
import { interactionGraph } from "../../constant/interaction-graph.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { PrintEngineActions } from "../../store/actions.js";

import { openConfirmationDialogSaga } from "../confirmation-dialog/index.js";

import { createCommitInteractionRows } from "./utils.js";

const log = LoggerFactory.getLogger("DiscardChangesSaga");

export function* discardChangesSaga(): SagaIterator {
	yield* takeLeading((action: AnyAction) => CommitViewActions.discardChanges.match(action), handleDiscardChangesSaga);
}

function* handleDiscardChangesSaga() {
	const requestApi = yield* getContext<RequestApi>("requestApi");

	if (!requestApi.discardAllLogs) {
		log.error(`If the discard button is visible the discard function should be implemented`);
		return;
	}

	const isConfirmed = yield* call(openConfirmationDialogSaga, ConfirmationDialogType.DISCARD_CHANGES);
	if (!isConfirmed) {
		return;
	}

	yield* call(requestApi.discardAllLogs);

	const header = yield* select(PrintEngineSelectors.printHeader);
	if (!header.id) {
		log.error(`No header id set`);
		return;
	}
	const loadPrintModelResponse = yield* call(requestApi.loadPrintModel, header.id);

	if (!loadPrintModelResponse?.printModel || !loadPrintModelResponse.logPersistentEntries) {
		log.error(`Failed to load PrintModel with id ${header.id}`);
		return;
	}

	const { transactionLogStore: newTransactionLogStore, interactionLogStore } = Log.createStores(
		[],
		loadPrintModelResponse.printModel,
		interactionGraph
	);

	yield* put(PrintEngineActions.removeInvalidSelections(newTransactionLogStore));
	yield* put(InteractionLogActions.setLogStore(interactionLogStore));
	yield* put(TransactionLogStateActions.setLogStore(newTransactionLogStore));

	yield* put(
		CommitViewActions.setLoadingPrintModelResponse({
			printModel: loadPrintModelResponse?.printModel,
			logPersistentEntries: [],
		})
	);

	const remainingCommitInteractionRows = yield* call(createCommitInteractionRows);
	yield* put(CommitViewActions.setCommitInteractionRows(remainingCommitInteractionRows));
}

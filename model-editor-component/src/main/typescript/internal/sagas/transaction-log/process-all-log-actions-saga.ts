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
import { call, getContext, put, select, takeEvery } from "typed-redux-saga";
import { AnyAction } from "typescript-fsa";

import {
	AffectedItem,
	PartialTransactionLogPersistentEntry,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";

import {
	AnyTransactionLogAction,
	isTransactionLogStateAction,
	isValidAnyTransactionLogAction,
} from "../../redux/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { RequestApi } from "../../api/index.js";
import { InteractionLogActions } from "../../redux/interaction-log/index.js";
import { interactionGraph } from "../../constant/interaction-graph.js";

import {
	SegmentTransactionLogHandler,
	SectionTransactionLogHandler,
	WatermarkTransactionLogHandler,
	TextstyleTransactionLogHandler,
	ElementReferenceTransactionLogHandler,
	GeneralTransactionLogHandler,
	RedoUndoTransactionLogHandler,
	ModelElementTransactionLogHandler,
	ReferenceContainerTransactionLogHandler,
} from "./log-action-handlers/index.js";

const logger = LoggerFactory.getLogger("ProcessAllLogActionSaga");

export function* processAllLogActionsSaga(): SagaIterator {
	yield* takeEvery(
		(action: AnyAction) => isTransactionLogStateAction(action) && action.payload.interactionId !== undefined,
		handleProcessAllLogActionsSaga
	);
}

function* handleProcessAllLogActionsSaga(action: AnyTransactionLogAction): SagaIterator {
	if (!isValidAnyTransactionLogAction(action)) {
		logger.error(`Invalid transaction log action received. Action type: ${action.type}, Payload:`, action.payload);
		return;
	}

	const { interactionId, region, regionId, affectedItems = [] } = action.payload;

	const requestApi: RequestApi = yield* getContext("requestApi");
	const state = yield* select(PrintEngineSelectors.transactionLogState);
	const persistentEntries: PartialTransactionLogPersistentEntry[] = [];
	const newAffectedItems: AffectedItem[] = affectedItems;

	if (SegmentTransactionLogHandler.match(action)) {
		const segmentAffectedItems: AffectedItem[] = yield* call(SegmentTransactionLogHandler.handle, {
			state,
			action,
			persistentEntries,
		});
		newAffectedItems.push(...segmentAffectedItems);
	} else if (SectionTransactionLogHandler.match(action)) {
		const sectionAffectedItems: AffectedItem[] = yield* call(SectionTransactionLogHandler.handle, {
			state,
			action,
			persistentEntries,
		});
		newAffectedItems.push(...sectionAffectedItems);
	} else if (WatermarkTransactionLogHandler.match(action)) {
		const watermarkAffectedItems: AffectedItem[] = yield* call(WatermarkTransactionLogHandler.handle, {
			state,
			action,
			persistentEntries,
		});
		newAffectedItems.push(...watermarkAffectedItems);
	} else if (TextstyleTransactionLogHandler.match(action)) {
		const textstyleAffectedItems: AffectedItem[] = yield* call(TextstyleTransactionLogHandler.handle, {
			state,
			action,
			persistentEntries,
		});
		newAffectedItems.push(...textstyleAffectedItems);
	} else if (ModelElementTransactionLogHandler.match(action)) {
		const elementAffectedItems: AffectedItem[] = yield* call(ModelElementTransactionLogHandler.handle, {
			state,
			action,
			persistentEntries,
		});
		newAffectedItems.push(...elementAffectedItems);
	} else if (RedoUndoTransactionLogHandler.match(action)) {
		yield* call(RedoUndoTransactionLogHandler.handle, {
			state,
			action,
			persistentEntries,
		});
	} else if (GeneralTransactionLogHandler.match(action)) {
		const generalAffectedItems: AffectedItem[] = yield* call(GeneralTransactionLogHandler.handle, {
			state,
			action,
			persistentEntries,
		});
		newAffectedItems.push(...generalAffectedItems);
	} else if (ElementReferenceTransactionLogHandler.match(action)) {
		const generalAffectedItems: AffectedItem[] = yield* call(ElementReferenceTransactionLogHandler.handle, {
			state,
			action,
			persistentEntries,
		});
		newAffectedItems.push(...generalAffectedItems);
	} else if (ReferenceContainerTransactionLogHandler.match(action)) {
		const referenceContainerAffectedItems: AffectedItem[] = yield* call(
			ReferenceContainerTransactionLogHandler.handle,
			{
				state,
				action,
				persistentEntries,
			}
		);
		newAffectedItems.push(...referenceContainerAffectedItems);
	} else {
		logger.error(`Unhandled transaction log action. Action type: ${action.type}, Payload:`, action.payload);
	}

	if (newAffectedItems.length !== 0) {
		yield* put(
			InteractionLogActions.addAffectedItems({ interactionId, affectedItems: newAffectedItems, region, regionId })
		);
	}

	const header = yield* select(PrintEngineSelectors.printHeader);
	if (header.id && persistentEntries.length !== 0) {
		interactionGraph.addTransactions(persistentEntries);
		requestApi.persistTransactionLog(persistentEntries, header.id);
	}
}

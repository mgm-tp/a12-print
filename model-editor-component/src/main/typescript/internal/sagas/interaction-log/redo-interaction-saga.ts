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
import { nanoid } from "nanoid";
import { SagaIterator } from "redux-saga";
import { getContext, put, select, takeEvery } from "typed-redux-saga";
import { AnyAction } from "typescript-fsa";

import { InteractionLogEntry } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";

import { InteractionLogActions, TransactionLogStateActions } from "../../redux/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { RequestApi } from "../../api/index.js";

export function* redoInteractionSaga(): SagaIterator {
	yield* takeEvery((action: AnyAction) => InteractionLogActions.redo.match(action), handleRedoInteractionSaga);
}

function* handleRedoInteractionSaga(): SagaIterator {
	const lastUndoInteraction = yield* select(PrintEngineSelectors.lastUndoInteraction);
	if (!lastUndoInteraction) {
		throw Error("Tried to redo but couldn't find any undo interaction to redo");
	}
	const requestApi: RequestApi = yield* getContext("requestApi");
	const interactionState = yield* select(PrintEngineSelectors.interactionLogState);
	const { region, regionId, ...interactionToRedo } = lastUndoInteraction;
	const interactionToRestoreId = interactionToRedo.affectedItems[0].id;
	const interactionEntryList = interactionState[region][regionId];
	let interactionToRestore;
	for (let i = interactionEntryList.length - 1; i >= 0; i--) {
		const entry = interactionEntryList[i];
		if (entry.interactionId === interactionToRestoreId) {
			interactionToRestore = entry;
			break;
		}
	}
	if (!interactionToRestore) {
		throw Error("Tried to redo but couldn't find original interaction to restore");
	}
	const newId = nanoid();
	const logEntry: InteractionLogEntry = {
		affectedItems: [{ type: "interaction", id: interactionToRedo.interactionId }],
		timestamp: Date.now(),
		interactionId: newId,
		type: "REDO",
		description: interactionToRedo.description,
	};
	yield* put(
		InteractionLogActions.addLogEntry({
			region,
			regionId,
			logEntry,
		})
	);

	const header = yield* select(PrintEngineSelectors.printHeader);
	requestApi.persistInteractionLog(header.id, {
		...logEntry,
		affectedInteractionId: interactionToRedo.interactionId,
		region,
		regionId,
	});

	yield* put(
		TransactionLogStateActions.redo({
			interactionId: newId,
			region,
			regionId,
			data: { interactionToRedo, interactionToRestore },
		})
	);
}

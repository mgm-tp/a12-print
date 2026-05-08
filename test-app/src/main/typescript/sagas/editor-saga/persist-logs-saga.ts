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
import { select, call, put, take, fork, delay, race, actionChannel, SagaGenerator } from "typed-redux-saga";
import { Action } from "typescript-fsa";
import { ActionPattern } from "redux-saga/effects";

import { LogHandler } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/marshaller";

import { EditorActions, EditorSelector, PersistLogsPayload } from "../../store/editor";
import { FileService } from "../../services/files-service";
import { CaseConfig } from "../../components/case-config/CaseConfig";

export function* persistLogsSaga(): SagaIterator {
	yield* handlePersistLogsSaga(EditorActions.persistLogs);
}

const handlePersistLogsSaga = (pattern: ActionPattern<Action<PersistLogsPayload>>) =>
	fork(function* () {
		while (true) {
			const action = yield* take(pattern);
			const actionPayloads: PersistLogsPayload[] = [action.payload];

			while (true) {
				const { debounced, latestAction } = yield* race({
					debounced: delay(500),
					latestAction: take(pattern),
				});

				if (debounced) {
					yield* put(EditorActions.batchPersistLogs(actionPayloads));
					break;
				}

				if (latestAction) {
					actionPayloads.push(latestAction.payload);
				}
			}
		}
	});

export function* batchPersistLogsSaga(): SagaGenerator<void> {
	const channel = yield* actionChannel(EditorActions.batchPersistLogs);
	while (true) {
		const action = yield* take(channel);
		yield* call(batchPersistLogs, action);
	}
}

function* batchPersistLogs(action: Action<PersistLogsPayload[]>): SagaGenerator<void> {
	const caseConfig = yield* select(EditorSelector.selectCaseConfig);

	if (!caseConfig) {
		console.error("Case config is undefined");
		return;
	}

	const logPayloads = action.payload;
	const newLogs: string[] = [];

	logPayloads.forEach(entry => {
		const { transactionLogs, interactionLog } = entry;
		if (transactionLogs) {
			newLogs.push(LogHandler.generateTransactionLogOutput(transactionLogs));
		} else if (interactionLog) {
			newLogs.push(LogHandler.generateInteractionLogOutput([interactionLog]));
		}
	});

	const walFilePath = CaseConfig.getWalFilePath(caseConfig.resource);
	const response = yield* call(FileService.writeWalFile, walFilePath, newLogs.join(""));

	if (FileService.isWalResponse(response)) {
		yield* put(EditorActions.setLogPersistentEntries(LogHandler.readLogInput(response.content)));
	}
}

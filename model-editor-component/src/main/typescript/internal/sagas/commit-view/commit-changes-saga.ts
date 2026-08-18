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
import { Action, AnyAction } from "typescript-fsa";
import partition from "lodash/partition.js";

import { PrintModelCreator } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/print-model-creator/index.js";
import {
	InteractionLogEntryType,
	Log,
	LogPersistentEntry,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";

import { EditorComponentApiActions, RequestApi } from "../../api/index.js";
import { InteractionLogActions, TransactionLogStateActions, CommitViewActions } from "../../redux/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { interactionGraph } from "../../constant/interaction-graph.js";
import { RESOURCE_KEYS } from "../../localization/index.js";
import { CommitInteractionRow } from "../../types/commit-view.js";

import { createCommitInteractionRows } from "./utils.js";

const log = LoggerFactory.getLogger("CommitChangesSaga");

export function* commitChangesSaga(): SagaIterator {
	yield* takeEvery(
		(action: AnyAction) => CommitViewActions.commitChanges.match(action),
		function* (action: Action<CommitInteractionRow[]>) {
			yield* put(CommitViewActions.setIsCommitting(true));
			yield* call(handleCommitChangesSaga, action);
			yield* put(CommitViewActions.setIsCommitting(false));
		}
	);
}

function* handleCommitChangesSaga(action: Action<CommitInteractionRow[]>) {
	const commits = action.payload.filter(el => el.state !== "pending");

	const requestApi = yield* getContext<RequestApi>("requestApi");
	const header = yield* select(PrintEngineSelectors.printHeader);
	if (!header.id) {
		return;
	}
	const loadPrintModelResponse = yield* call(requestApi.loadPrintModel, header.id);
	if (!loadPrintModelResponse?.printModel || !loadPrintModelResponse.logPersistentEntries) {
		log.error(`Failed to load PrintModel with id ${header.id}`);
		return;
	}
	const { printModel: initialPrintModel, logPersistentEntries } = loadPrintModelResponse;
	const [entriesToCommit, entriesToRemain] = partition(logPersistentEntries, ({ interactionLogPersistentEntry }) =>
		commits?.some(commit => commit.interactionId === interactionLogPersistentEntry.interactionId)
	);

	const filteredEntriesToRemain = filterRemainingUnusedLogs(entriesToRemain, logPersistentEntries);

	const { transactionLogStore } = Log.createStores(entriesToCommit, initialPrintModel);
	const newPrintModel = PrintModelCreator.createCleanModel(transactionLogStore);
	const savedPrintModelResponse = yield* call(requestApi.setPrintModel, newPrintModel, true, filteredEntriesToRemain);
	if (!savedPrintModelResponse?.printModel || savedPrintModelResponse.errorMap) {
		log.error(`The changes could not be commited`);
		yield* put(
			EditorComponentApiActions.addNotification({
				title: { key: RESOURCE_KEYS.validation.error.internalError },
				message: { key: RESOURCE_KEYS.sidebar.commitChanges.error.commitChangesFailed },
				severity: "error",
			})
		);
		return;
	}
	const { transactionLogStore: newTransactionLogStore, interactionLogStore } = Log.createStores(
		filteredEntriesToRemain,
		savedPrintModelResponse?.printModel,
		interactionGraph
	);

	yield* put(InteractionLogActions.setLogStore(interactionLogStore));
	yield* put(TransactionLogStateActions.setLogStore(newTransactionLogStore));
	yield* put(
		CommitViewActions.setLoadingPrintModelResponse({
			printModel: savedPrintModelResponse?.printModel,
			logPersistentEntries: filteredEntriesToRemain,
		})
	);

	const remainingCommitInteractionRows = yield* call(createCommitInteractionRows);
	yield* put(CommitViewActions.setCommitInteractionRows(remainingCommitInteractionRows));
}

const filterRemainingUnusedLogs = (entriesToRemain: LogPersistentEntry[], allEntries: LogPersistentEntry[]) => {
	const undoByRedoEntries = new Set();
	const setByUndoEntries = new Set();
	const filteredEntriesToRemain: LogPersistentEntry[] = [];

	const groupRemainingByRegion = entriesToRemain.reduce((group: Record<string, LogPersistentEntry[]>, entry) => {
		const { region, regionId } = entry.interactionLogPersistentEntry;
		const key = `${region}-${regionId}`;
		if (!group[key]) {
			group[key] = [entry];
		} else {
			group[key].push(entry);
		}
		return group;
	}, {});

	const latestCommitByRegion = new Map<string, LogPersistentEntry>();
	allEntries.forEach(entry => {
		const {
			interactionLogPersistentEntry: { region, regionId, timestamp },
		} = entry;
		const latestCommit = latestCommitByRegion.get(`${region}-${regionId}`);
		if (!latestCommit || timestamp > latestCommit.interactionLogPersistentEntry.timestamp) {
			latestCommitByRegion.set(`${region}-${regionId}`, entry);
		}
	});

	for (const [region, logs] of Object.entries(groupRemainingByRegion)) {
		const regionHeadCommit = latestCommitByRegion.get(region);

		const isSkipUndo = regionHeadCommit?.interactionLogPersistentEntry.type === "SET";
		processRegionLogs({
			filteredEntriesToRemain,
			isInitialSkipUndo: isSkipUndo,
			logs,
			setByUndoEntries,
			undoByRedoEntries,
		});
	}

	return filteredEntriesToRemain;
};

function processRegionLogs({
	logs,
	isInitialSkipUndo,
	undoByRedoEntries,
	filteredEntriesToRemain,
	setByUndoEntries,
}: {
	logs: LogPersistentEntry[];
	isInitialSkipUndo: boolean;
	undoByRedoEntries: Set<unknown>;
	setByUndoEntries: Set<unknown>;
	filteredEntriesToRemain: LogPersistentEntry[];
}) {
	let isSkipUndo = isInitialSkipUndo;

	function shouldSkip(
		type: InteractionLogEntryType,
		affectedInteractionId: unknown,
		interactionId: unknown
	): boolean {
		if (type === "REDO") {
			undoByRedoEntries.add(affectedInteractionId);
			return true;
		}

		if (type === "UNDO") {
			if (undoByRedoEntries.has(interactionId)) {
				return true;
			}

			if (isSkipUndo) {
				setByUndoEntries.add(affectedInteractionId);
				return true;
			}
		}

		if (type === "SET") {
			if (!isSkipUndo) {
				isSkipUndo = true;
			}

			if (setByUndoEntries.has(interactionId)) {
				return true;
			}
		}
		return false;
	}

	for (let index = logs.length - 1; index >= 0; index--) {
		const currentEntry = logs[index];
		const {
			interactionLogPersistentEntry: { type, affectedInteractionId, interactionId },
		} = currentEntry;

		if (shouldSkip(type, affectedInteractionId, interactionId)) {
			continue;
		}
		filteredEntriesToRemain.unshift(currentEntry);
	}
}

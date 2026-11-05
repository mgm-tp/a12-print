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
import type { SagaGenerator } from "typed-redux-saga";
import { call, getContext, put, select, takeEvery } from "typed-redux-saga";
import partition from "lodash/partition.js";
import type { PayloadAction } from "@reduxjs/toolkit";

import type {
	InteractionLogEntryType,
	LogPersistentEntry,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { PrintModelCreator, Log } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { PrintModel } from "@com.mgmtp.a12.print/print-model-api/model";
import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";

import type { RequestApi } from "../../api/index.js";
import {
	ConfirmationDialogType,
	InteractionLogActions,
	TransactionLogStateActions,
	CommitViewActions,
} from "../../redux/index.js";
import type { FragmentUsagePrintModelInfo } from "../../redux/confirmation-dialog/state.js";
import { FragmentUsageSelectors } from "../../redux/fragment-usage/selectors.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { interactionGraph } from "../../constant/interaction-graph.js";
import { RESOURCE_KEYS } from "../../../internal/localization/index.js";
import type { CommitInteractionRow } from "../../types/commit-view.js";
import { EditorComponentApiActions } from "../../../a12internal/api/actions-api.js";
import { PrintEngineActions } from "../../store/actions.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";

import { openConfirmationDialogSaga } from "../confirmation-dialog/open-confirmation-dialog-saga.js";

import { propagateFragmentElementChanges } from "./propagate-fragment-element-changes-saga.js";
import { createCommitInteractionRows } from "./utils.js";

const log = LoggerFactory.getLogger("CommitChangesSaga");

export function* commitChangesSaga(): SagaGenerator<void> {
	yield* takeEvery(CommitViewActions.commitChanges.match, function* (action: PayloadAction<CommitInteractionRow[]>) {
		yield* put(CommitViewActions.setIsCommitting(true));
		yield* call(handleCommitChangesSaga, action);
		yield* put(CommitViewActions.setIsCommitting(false));
	});
}

function* handleCommitChangesSaga(action: PayloadAction<CommitInteractionRow[]>) {
	const commits = action.payload.filter(el => el.state !== "pending");

	const modelSubType: ReturnType<typeof PrintEngineSelectors.printModelSubType> = yield* select(
		PrintEngineSelectors.printModelSubType
	);
	const usages: FragmentUsagePrintModelInfo[] =
		modelSubType === "fragment" ? yield* call(getAffectedFragmentUsages, commits) : [];
	if (usages.length > 0) {
		const confirmed = yield* call(openConfirmationDialogSaga, ConfirmationDialogType.COMMIT_AFFECTS_PRINT_MODELS, {
			usages,
		});
		if (!confirmed) {
			return;
		}
	}

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

	if (!savedPrintModelResponse?.printModel) {
		if (
			!savedPrintModelResponse ||
			(savedPrintModelResponse &&
				(savedPrintModelResponse.errorMap || !savedPrintModelResponse.precompileMessages))
		) {
			if (savedPrintModelResponse?.errorMap) {
				log.error(`The changes could not be commited: `, savedPrintModelResponse.errorMap);
			}
			yield* put(
				EditorComponentApiActions.addNotification({
					title: { key: RESOURCE_KEYS.validation.error.internalError },
					message: { key: RESOURCE_KEYS.sidebar.commitChanges.error.commitChangesFailed },
					severity: "error",
				})
			);
		}
		if (savedPrintModelResponse?.precompileMessages && savedPrintModelResponse.precompileMessages.length > 0) {
			yield* put(CommitViewActions.setCommitViewPrecompileMessages(savedPrintModelResponse.precompileMessages));
		}

		return;
	} else if (savedPrintModelResponse?.precompileMessages && savedPrintModelResponse.precompileMessages.length > 0) {
		yield* put(CommitViewActions.setCommitViewPrecompileMessages(savedPrintModelResponse.precompileMessages));
	}

	if (modelSubType === "fragment") {
		yield* call(
			propagateFragmentElementChangesSafely,
			commits,
			initialPrintModel,
			savedPrintModelResponse.printModel
		);
	}

	const { transactionLogStore: newTransactionLogStore, interactionLogStore } = Log.createStores(
		filteredEntriesToRemain,
		savedPrintModelResponse?.printModel,
		interactionGraph
	);

	yield* put(PrintEngineActions.removeInvalidSelections(newTransactionLogStore));
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

function* propagateFragmentElementChangesSafely(
	commits: CommitInteractionRow[],
	initialPrintModel: PrintModel,
	savedPrintModel: PrintModel
): SagaGenerator<void> {
	try {
		const affectedElementIds = yield* call(getAffectedEntityIds, commits, PRINT_MODEL_ELEMENT_AFFECTED_ITEM_TYPES);
		yield* call(propagateFragmentElementChanges, initialPrintModel, savedPrintModel, affectedElementIds);
	} catch (error) {
		log.error("Could not propagate the committed fragment element dimensions: ", error);
		yield* put(
			EditorComponentApiActions.addNotification({
				title: { key: RESOURCE_KEYS.validation.error.internalError },
				message: { key: RESOURCE_KEYS.sidebar.commitChanges.error.propagateFragmentChangesFailed },
				severity: "error",
			})
		);
	}
}

const PRINT_MODEL_ELEMENT_AFFECTED_ITEM_TYPES = new Set(["printModelElement"]);

const FRAGMENT_ENTITY_AFFECTED_ITEM_TYPES = new Set([
	"segment",
	"section",
	"watermark",
	"textStyle",
	...PRINT_MODEL_ELEMENT_AFFECTED_ITEM_TYPES,
]);

/** Resolves the ids of every entity of the given affected-item types touched by the given commit rows. */
function* getAffectedEntityIds(
	commits: CommitInteractionRow[],
	itemTypes: ReadonlySet<string>
): SagaGenerator<Set<string>> {
	const commitInteractionIds = new Set(commits.map(commit => commit.interactionId));
	const allInteractions = yield* select(PrintEngineSelectors.allInteractions);

	const affectedEntityIds = new Set<string>();
	for (const entry of allInteractions) {
		if (!commitInteractionIds.has(entry.interactionId)) {
			continue;
		}
		for (const item of entry.affectedItems) {
			if (itemTypes.has(item.type)) {
				affectedEntityIds.add(item.id);
			}
		}
	}

	return affectedEntityIds;
}

/**
 * Resolves the print models referencing any fragment entity touched by the commit rows, deduplicated by print model
 * (the dialog lists models, not references). Non-fragment element ids simply yield no usages.
 */
function* getAffectedFragmentUsages(commits: CommitInteractionRow[]): SagaGenerator<FragmentUsagePrintModelInfo[]> {
	const affectedEntityIds = yield* call(getAffectedEntityIds, commits, FRAGMENT_ENTITY_AFFECTED_ITEM_TYPES);

	return yield* select((state: PrintEngineState) => {
		const usagesByPrintModelId = new Map<string, FragmentUsagePrintModelInfo>();
		for (const entityId of affectedEntityIds) {
			for (const usage of FragmentUsageSelectors.usageForEntity(state, entityId)) {
				if (!usagesByPrintModelId.has(usage.printModelId)) {
					usagesByPrintModelId.set(usage.printModelId, usage);
				}
			}
		}
		return [...usagesByPrintModelId.values()];
	});
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

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

import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";
import type {
	PartialAnyPrintModelElement,
	PartialPrintModelContentGeneral,
	PartialPrintModelHeader,
	PartialSection,
	PartialSegment,
	PartialSegmentReference,
	PartialTextStyle,
	PartialWatermark,
	PrintModel,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	PRINT_MODEL_HEADER_LOG_ID,
} from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepMutable } from "@com.mgmtp.a12.print/print-model-api/utils";

import type { InteractionGraph } from "./interaction-graph.js";
import type {
	AffectedItem,
	AffectedItemType,
	InteractionLogEntry,
	InteractionLogPersistentEntry,
	InteractionLogStore,
} from "./interaction-log.js";
import { createNewInteractionLogStore } from "./interaction-log.js";
import type {
	PartialTransactionLogPersistentEntry,
	TransactionLogEntryCommand,
	TransactionLogStore,
} from "./transaction-log.js";
import {
	EntryType,
	TransactionLogPersistentEntry,
	createMemoizedObject,
	createNewTransactionLogStore,
} from "./transaction-log.js";

const log = LoggerFactory.getLogger("log.ts");

/**
 * Interface for the WAL file data send from the backend.
 */
export interface LogPersistentEntry {
	readonly interactionLogPersistentEntry: InteractionLogPersistentEntry;
	readonly transactionLogPersistentEntries: PartialTransactionLogPersistentEntry[];
}

export interface LogStores {
	transactionLogStore: TransactionLogStore;
	interactionLogStore: InteractionLogStore;
}

export namespace Log {
	/**
	 * The interaction graph instance should be passed here for a fully functionining commit view. The graph will be reset
	 * and reinitialized.
	 */
	export function createStores(
		logPersistentEntries: LogPersistentEntry[],
		printModel: PrintModel,
		interactionGraph?: InteractionGraph
	): LogStores {
		interactionGraph?.resetToPrintModel(printModel);
		const newTransactionLogStore = createNewTransactionLogStore(printModel);
		const newInteractionLogStore = createNewInteractionLogStore();
		if (logPersistentEntries.length !== 0) {
			addPersistentEntriesToLogStore(
				newTransactionLogStore,
				newInteractionLogStore,
				logPersistentEntries,
				interactionGraph
			);
		}
		return {
			transactionLogStore: newTransactionLogStore,
			interactionLogStore: newInteractionLogStore,
		};
	}
}

function addPersistentEntriesToLogStore(
	newTransactionLogStore: DeepMutable<TransactionLogStore>,
	newInteractionLogStore: InteractionLogStore,
	logPersistentEntries: LogPersistentEntry[],
	interactionGraph?: InteractionGraph
) {
	for (const entry of logPersistentEntries) {
		const { region, regionId, interactionId, timestamp, description, preventUndo, type, affectedInteractionId } =
			entry.interactionLogPersistentEntry;
		const regionEntries = newInteractionLogStore[region];

		const affectedItems: AffectedItem[] = [];
		addPersistentEntryByType(entry, newTransactionLogStore, affectedItems);

		if (affectedInteractionId) {
			if (affectedItems.length > 0) {
				throw Error(`Interactions with an affectedInteractionId could only have one affected item.`);
			}
			affectedItems.push({
				id: affectedInteractionId,
				type: "interaction",
			});
		}

		const newInteractionEntry: InteractionLogEntry = {
			interactionId,
			timestamp,
			description,
			preventUndo,
			type,
			affectedItems,
		};

		if (regionEntries[regionId]) {
			regionEntries[regionId].push(newInteractionEntry);
		} else {
			regionEntries[regionId] = [newInteractionEntry];
		}

		interactionGraph?.addTransactions(entry.transactionLogPersistentEntries);
	}
}

function addPersistentEntriesFromTransactionLogEntry(
	partialTransactionLogPersistentEntry: Required<PartialTransactionLogPersistentEntry>,
	entryType: EntryType,
	elementId: string,
	newTransactionLogStore: DeepMutable<TransactionLogStore>
) {
	const { ...log } = partialTransactionLogPersistentEntry;

	if (EntryType.isPrintModelHeader(entryType)) {
		const initialObject = newTransactionLogStore[PRINT_MODEL_HEADER_LOG_ID].initialObject;
		const newLogDiff = [...newTransactionLogStore[PRINT_MODEL_HEADER_LOG_ID].log, log];
		newTransactionLogStore[PRINT_MODEL_HEADER_LOG_ID] = {
			id: elementId,
			log: newLogDiff,
			memoizedObject: createMemoizedObject<PartialPrintModelHeader>(
				elementId,
				entryType,
				newLogDiff,
				initialObject
			),
			initialObject,
		};
		return;
	}
	if (EntryType.isPrintModelContentGeneral(entryType)) {
		const initialObject = newTransactionLogStore[PRINT_MODEL_CONTENT_GENERAL_LOG_ID].initialObject;
		const newLogDiff = [...newTransactionLogStore[PRINT_MODEL_CONTENT_GENERAL_LOG_ID].log, log];
		newTransactionLogStore[PRINT_MODEL_CONTENT_GENERAL_LOG_ID] = {
			id: elementId,
			log: newLogDiff,
			memoizedObject: createMemoizedObject<PartialPrintModelContentGeneral>(
				elementId,
				entryType,
				newLogDiff,
				initialObject
			),
			initialObject,
		};
		return;
	}
	if (EntryType.isSegment(entryType)) {
		const initialObject = newTransactionLogStore.segments.map[elementId]?.initialObject;
		const newLogDiff = [...(newTransactionLogStore.segments.map[elementId]?.log || []), log];
		newTransactionLogStore.segments.map[elementId] = {
			id: elementId,
			log: newLogDiff,
			memoizedObject: createMemoizedObject<PartialSegment>(elementId, entryType, newLogDiff, initialObject),
			initialObject,
		};
		return;
	}
	if (EntryType.isSegmentReference(entryType)) {
		const initialObject = newTransactionLogStore.segments.references[elementId]?.initialObject;
		const newLogDiff = [...(newTransactionLogStore.segments.references[elementId]?.log || []), log];
		newTransactionLogStore.segments.references[elementId] = {
			id: elementId,
			log: newLogDiff,
			memoizedObject: createMemoizedObject<PartialSegmentReference>(
				elementId,
				entryType,
				newLogDiff,
				initialObject
			),
			initialObject,
		};
		return;
	}
	if (EntryType.isSection(entryType)) {
		newTransactionLogStore.sections ??= { id: nanoid(), map: {} };
		const initialObject = newTransactionLogStore.sections.map[elementId]?.initialObject;
		const newLogDiff = [...(newTransactionLogStore.sections?.map[elementId]?.log || []), log];
		newTransactionLogStore.sections.map[elementId] = {
			id: elementId,
			log: newLogDiff,
			memoizedObject: createMemoizedObject<PartialSection>(elementId, entryType, newLogDiff, initialObject),
			initialObject,
		};
		return;
	}
	if (EntryType.isWatermark(entryType)) {
		newTransactionLogStore.watermarks ??= { id: nanoid(), map: {} };
		const initialObject = newTransactionLogStore.watermarks.map[elementId]?.initialObject;
		const newLogDiff = [...(newTransactionLogStore.watermarks?.map[elementId]?.log || []), log];
		newTransactionLogStore.watermarks.map[elementId] = {
			id: elementId,
			log: newLogDiff,
			memoizedObject: createMemoizedObject<PartialWatermark>(elementId, entryType, newLogDiff, initialObject),
			initialObject,
		};
		return;
	}
	if (EntryType.isTextStyle(entryType)) {
		newTransactionLogStore.textStyles ??= { id: nanoid(), map: {} };
		const initialObject = newTransactionLogStore.textStyles.map[elementId]?.initialObject;
		const newLogDiff = [...(newTransactionLogStore.textStyles?.map[elementId]?.log || []), log];
		newTransactionLogStore.textStyles.map[elementId] = {
			id: elementId,
			log: newLogDiff,
			memoizedObject: createMemoizedObject<PartialTextStyle>(elementId, entryType, newLogDiff, initialObject),
			initialObject,
		};
		return;
	}
	if (EntryType.isPrintModelElement(entryType)) {
		const initialObject = newTransactionLogStore.printModelElements[elementId]?.initialObject;
		const newLogDiff = [...(newTransactionLogStore.printModelElements[elementId]?.log || []), log];
		newTransactionLogStore.printModelElements[elementId] = {
			id: elementId,
			log: newLogDiff,
			memoizedObject: createMemoizedObject<PartialAnyPrintModelElement>(
				elementId,
				entryType,
				newLogDiff,
				initialObject
			),
			initialObject,
		};
		return;
	}

	throw new Error(`Unknown entry type: ${entryType}`);
}

function addPersistentEntriesFromPrintModelElement(
	entryType: EntryType,
	elementId: string,
	newTransactionLogStore: DeepMutable<TransactionLogStore>
) {
	const initialObject = newTransactionLogStore.printModelElements[elementId]?.initialObject;
	const newLogDiff = newTransactionLogStore.printModelElements[elementId]
		? newTransactionLogStore.printModelElements[elementId].log.slice()
		: [];
	newTransactionLogStore.printModelElements[elementId] = {
		id: elementId,
		log: newLogDiff,
		memoizedObject: createMemoizedObject<PartialAnyPrintModelElement>(
			elementId,
			entryType,
			newLogDiff,
			initialObject
		),
		initialObject,
	};
}

function addRelevantAffectedItems(
	entryType: EntryType,
	affectedItems: AffectedItem[],
	elementId: string,
	command: TransactionLogEntryCommand | undefined
) {
	const affectedItemType = EntryType.isPrintModelElement(entryType) ? "printModelElement" : entryType;
	if (
		!affectedItems.some(item => item.id === elementId && item.type === affectedItemType) &&
		(!command || command !== "UNDO")
	) {
		affectedItems.push({
			id: elementId,
			type: affectedItemType as AffectedItemType,
		});
	}
}

function addPersistentEntryByType(
	entry: LogPersistentEntry,
	newTransactionLogStore: DeepMutable<TransactionLogStore>,
	affectedItems: AffectedItem[]
) {
	for (const partialTransactionLogPersistentEntry of entry.transactionLogPersistentEntries) {
		const { id: elementId, entryType, command } = partialTransactionLogPersistentEntry;

		if (TransactionLogPersistentEntry.isTransactionLogEntry(partialTransactionLogPersistentEntry)) {
			addPersistentEntriesFromTransactionLogEntry(
				partialTransactionLogPersistentEntry,
				entryType,
				elementId,
				newTransactionLogStore
			);
		} else if (EntryType.isPrintModelElement(entryType)) {
			addPersistentEntriesFromPrintModelElement(entryType, elementId, newTransactionLogStore);
		} else {
			log.warn(`Unknown entry type: ${entryType} for partial entries`);
		}

		addRelevantAffectedItems(entryType, affectedItems, elementId, command);
	}
}

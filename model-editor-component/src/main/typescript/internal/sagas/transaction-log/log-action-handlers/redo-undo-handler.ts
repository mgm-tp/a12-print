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
import { call, put, select } from "typed-redux-saga";
import { nanoid } from "nanoid";

import type {
	EntryType,
	PartialTransactionLogPersistentEntry,
	TransactionLogStore,
	TransactionLogStoreEntry,
	AffectedItemType,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { TransactionLog, SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type {
	PartialAnyPrintModelElement,
	PartialPlaceableReference,
	PartialPrintModelContentGeneral,
	PartialPrintModelHeader,
	PartialSection,
	PartialSegment,
	PartialSegmentReference,
	PartialTextStyle,
	PartialWatermark,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	PRINT_MODEL_HEADER_LOG_ID,
	PartialArea,
	PartialBoundingBox,
	PartialOverride,
} from "@com.mgmtp.a12.print/print-model-api/model";

import {
	type AnyTransactionLogAction,
	isBaseElementFormState,
	NavigationActions,
	NavigationSelectors,
	type PrintModelRefs,
	TransactionLogStateActions,
	type ValidAnyTransactionLogAction,
} from "../../../redux/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";

const REDO_UNDO_ACTIONS = [TransactionLogStateActions.undo, TransactionLogStateActions.redo];

export const RedoUndoTransactionLogHandler = {
	match: function (action: AnyTransactionLogAction) {
		return REDO_UNDO_ACTIONS.some(elementAction => elementAction.match(action));
	},
	handle: handleRedoUndoActions,
};

function* handleRedoUndoActions({
	state,
	action,
	persistentEntries,
}: {
	state: TransactionLogStore;
	action: ValidAnyTransactionLogAction;
	persistentEntries: PartialTransactionLogPersistentEntry[];
}): SagaGenerator<void> {
	const { interactionId } = action.payload;

	if (TransactionLogStateActions.undo.match(action)) {
		const printModelRefs = yield* select(NavigationSelectors.activeEntities);

		const interactionToUndo = action.payload.data.interactionToUndo;
		let copyTransactionLogState: TransactionLogStore = state;
		const usedItems: string[] = [];
		for (const item of interactionToUndo.affectedItems) {
			if (usedItems.includes(item.id)) {
				continue;
			}
			const { storeEntry, entryType } = getStoreEntryAndType(item.id, item.type, copyTransactionLogState);
			const undoResult = TransactionLog.undo(
				storeEntry,
				entryType,
				interactionToUndo.interactionId,
				interactionId
			);
			persistentEntries.push(...undoResult.persistentEntries);
			copyTransactionLogState = applyUpdateToTransactionLogState(
				copyTransactionLogState,
				undoResult.storeEntry,
				undoResult.persistentEntries[0].entryType
			);
			usedItems.push(item.id);
		}
		yield* call(resolveUiAfterUndo, copyTransactionLogState, printModelRefs);
		yield* put(TransactionLogStateActions.setLogStore(copyTransactionLogState));
		return;
	}

	if (TransactionLogStateActions.redo.match(action)) {
		const { interactionToRedo, interactionToRestore } = action.payload.data;
		let copyTransactionLogState: TransactionLogStore = state;
		const usedItems: string[] = [];
		for (const item of interactionToRestore.affectedItems) {
			if (usedItems.includes(item.id)) {
				continue;
			}
			const { storeEntry, entryType } = getStoreEntryAndType(item.id, item.type, copyTransactionLogState);
			const redoResult = TransactionLog.undo(
				storeEntry,
				entryType,
				interactionToRedo.interactionId,
				interactionId
			);
			persistentEntries.push(...redoResult.persistentEntries);
			copyTransactionLogState = applyUpdateToTransactionLogState(
				copyTransactionLogState,
				redoResult.storeEntry,
				redoResult.persistentEntries[0].entryType
			);
			usedItems.push(item.id);
		}
		yield* put(TransactionLogStateActions.setLogStore(copyTransactionLogState));
	}
}

function getStoreEntryAndType(
	id: string,
	affectedType: AffectedItemType,
	transactionStore: TransactionLogStore
): { storeEntry: TransactionLogStoreEntry; entryType: EntryType } {
	if (affectedType === "printModelHeader") {
		return { storeEntry: transactionStore[PRINT_MODEL_HEADER_LOG_ID], entryType: "printModelHeader" };
	}
	if (affectedType === "printModelContentGeneral") {
		return {
			storeEntry: transactionStore[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
			entryType: "printModelContentGeneral",
		};
	}
	if (affectedType === "segment") {
		return { storeEntry: transactionStore.segments.map[id], entryType: "segment" };
	}
	if (affectedType === "segmentReference") {
		return { storeEntry: transactionStore.segments.references[id], entryType: "segmentReference" };
	}
	if (affectedType === "section") {
		if (!transactionStore.sections) {
			throw new Error(`No sections exist. Cannot undo section with id ${id}`);
		}
		return { storeEntry: transactionStore.sections.map[id], entryType: "section" };
	}
	if (affectedType === "watermark") {
		if (!transactionStore.watermarks) {
			throw new Error(`No watermarks exist. Cannot undo watermark with id ${id}`);
		}
		return { storeEntry: transactionStore.watermarks.map[id], entryType: "watermark" };
	}
	if (affectedType === "textStyle") {
		if (!transactionStore.textStyles) {
			throw new Error(`No textstyles exist. Cannot undo textstyle with id ${id}`);
		}
		return { storeEntry: transactionStore.textStyles.map[id], entryType: "textStyle" };
	}
	if (affectedType === "printModelElement") {
		const storeEntry = transactionStore.printModelElements[id];
		return { storeEntry, entryType: storeEntry.memoizedObject.type };
	}
	throw new Error("Got an interaction of type UNDO instead of an element type");
}

function applyUpdateToTransactionLogState(
	transactionLogState: TransactionLogStore,
	storeEntry: TransactionLogStoreEntry,
	entryType: EntryType
): TransactionLogStore {
	if (entryType === "printModelHeader") {
		return {
			...transactionLogState,
			[PRINT_MODEL_HEADER_LOG_ID]: storeEntry as TransactionLogStoreEntry<PartialPrintModelHeader>,
		};
	}
	if (entryType === "printModelContentGeneral") {
		return {
			...transactionLogState,
			[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]:
				storeEntry as TransactionLogStoreEntry<PartialPrintModelContentGeneral>,
		};
	}
	if (entryType === "segment") {
		return {
			...transactionLogState,
			segments: {
				...transactionLogState.segments,
				map: {
					...transactionLogState.segments.map,
					[storeEntry.id]: storeEntry as TransactionLogStoreEntry<PartialSegment>,
				},
			},
		};
	}
	if (entryType === "segmentReference") {
		return {
			...transactionLogState,
			segments: {
				...transactionLogState.segments,
				references: {
					...transactionLogState.segments.references,
					[storeEntry.id]: storeEntry as TransactionLogStoreEntry<PartialSegmentReference>,
				},
			},
		};
	}
	if (entryType === "section") {
		return {
			...transactionLogState,
			sections: {
				...transactionLogState.sections,
				id: transactionLogState.sections?.id || nanoid(),
				map: {
					...transactionLogState.sections?.map,
					[storeEntry.id]: storeEntry as TransactionLogStoreEntry<PartialSection>,
				},
			},
		};
	}
	if (entryType === "watermark") {
		return {
			...transactionLogState,
			watermarks: {
				...transactionLogState.watermarks,
				id: transactionLogState.watermarks?.id || nanoid(),
				map: {
					...transactionLogState.watermarks?.map,
					[storeEntry.id]: storeEntry as TransactionLogStoreEntry<PartialWatermark>,
				},
			},
		};
	}
	if (entryType === "textStyle") {
		return {
			...transactionLogState,
			textStyles: {
				...transactionLogState.textStyles,
				id: transactionLogState.textStyles?.id || nanoid(),
				map: {
					...transactionLogState.textStyles?.map,
					[storeEntry.id]: storeEntry as TransactionLogStoreEntry<PartialTextStyle>,
				},
			},
		};
	}
	return {
		...transactionLogState,
		printModelElements: {
			...transactionLogState.printModelElements,
			[storeEntry.id]: storeEntry as TransactionLogStoreEntry<PartialAnyPrintModelElement>,
		},
	};
}

function* resolveRemovedPrintModelRefs(
	general: PartialPrintModelContentGeneral,
	printModelRefs: PrintModelRefs
): SagaGenerator<boolean> {
	const { currentRefType, sectionId, segmentId, watermarkId } = printModelRefs;

	if (currentRefType === SidebarItem.SEGMENT && segmentId && !general.structure?.includes(segmentId)) {
		yield* put(NavigationActions.clearActiveEntity({ tab: SidebarItem.SEGMENT }));
		return true;
	}
	if (currentRefType === SidebarItem.SECTION && sectionId && !general.sections?.includes(sectionId)) {
		yield* put(NavigationActions.clearActiveEntity({ tab: SidebarItem.SECTION }));
		return true;
	}
	if (currentRefType === SidebarItem.WATERMARK && watermarkId && !general.watermarks?.includes(watermarkId)) {
		yield* put(NavigationActions.clearActiveEntity({ tab: SidebarItem.WATERMARK }));
		return true;
	}
	return false;
}

function getContainerMapAndId(
	currentRefType: SidebarItem,
	segmentId: string | undefined,
	sectionId: string | undefined,
	watermarkId: string | undefined,
	newState: TransactionLogStore
): {
	id: string | undefined;
	containerMap:
		| TransactionLogStore["segments"]
		| TransactionLogStore["sections"]
		| TransactionLogStore["watermarks"]
		| undefined;
} {
	if (currentRefType === SidebarItem.SEGMENT) {
		return { id: segmentId, containerMap: newState.segments };
	} else if (currentRefType === SidebarItem.SECTION) {
		return { id: sectionId, containerMap: newState.sections };
	} else {
		return { id: watermarkId, containerMap: newState.watermarks };
	}
}

function getElementReferences(
	container: PartialSegment | PartialSection | PartialWatermark,
	wrapper: PartialAnyPrintModelElement | undefined
): readonly PartialPlaceableReference[] {
	if (wrapper && PartialBoundingBox.isInstance(wrapper)) {
		return wrapper.boundingBox?.elementReferences || [];
	} else if (wrapper && PartialArea.isInstance(wrapper)) {
		return wrapper.area?.elementReferences || [];
	} else if (wrapper && PartialOverride.isInstance(wrapper)) {
		return wrapper.override?.boundingBox?.elementReferences || [];
	}
	return container.elementReferences || [];
}

function* resolveUiAfterUndo(newState: TransactionLogStore, printModelRefs: PrintModelRefs) {
	const { currentRefType, sectionId, segmentId, watermarkId } = printModelRefs;
	const general = newState[PRINT_MODEL_CONTENT_GENERAL_LOG_ID].memoizedObject;

	const shouldExit = yield* call(resolveRemovedPrintModelRefs, general, printModelRefs);
	if (shouldExit) {
		return;
	}

	const wrappers = yield* select(PrintEngineSelectors.wrappers);
	const currentDetailData = yield* select(NavigationSelectors.detailForm);
	const entityId = yield* select(PrintEngineSelectors.currentElementContainerId);
	const firstForm = yield* select(NavigationSelectors.firstForm);
	const editorMode = yield* select(NavigationSelectors.currentMode);
	const wrapperId = wrappers.length > 0 ? wrappers.at(-1)?.id : undefined;

	const { id, containerMap } = getContainerMapAndId(currentRefType, segmentId, sectionId, watermarkId, newState);

	if (!id || !containerMap) {
		return;
	}
	const container = containerMap.map[id].memoizedObject;
	const wrapper = wrapperId ? newState.printModelElements[wrapperId].memoizedObject : undefined;

	const elementReferences = getElementReferences(container, wrapper);

	if (
		currentDetailData &&
		firstForm &&
		isBaseElementFormState(firstForm) &&
		elementReferences?.every(el => el.refId !== firstForm?.id)
	) {
		if (entityId) {
			yield* put(
				NavigationActions.setDetailForm({ tab: currentRefType, entityId, mode: editorMode, form: undefined })
			);
			yield* put(
				NavigationActions.setSelectedElement({
					tab: currentRefType,
					entityId,
					mode: editorMode,
					elementId: undefined,
				})
			);
		}
	}
}

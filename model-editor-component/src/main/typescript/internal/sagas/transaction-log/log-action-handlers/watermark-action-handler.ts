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

import {
	type PartialTransactionLogPersistentEntry,
	type TransactionLogStore,
	type AffectedItem,
	SidebarItem,
	type TransactionLogStoreEntryMap,
	WATERMARKS_REFERENCES_ENTRY_ID,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { TransactionLog } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import {
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	type PartialAnyPrintModelElement,
	type PartialWatermark,
	type FragmentModelReference,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	clonePrintModelEntity,
	cloneWatermark,
	collectUsedTextStyleIds,
	createFragmentElementGetter,
} from "@com.mgmtp.a12.print/print-model-api/utils";

import type { AnyTransactionLogAction, ValidAnyTransactionLogAction } from "../../../redux/index.js";
import {
	ConfirmationDialogType,
	NavigationActions,
	NavigationSelectors,
	TransactionLogStateActions,
} from "../../../redux/index.js";
import { FragmentUsageSelectors } from "../../../redux/fragment-usage/selectors.js";
import { openConfirmationDialogSaga } from "../../confirmation-dialog/open-confirmation-dialog-saga.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";

import { appendTextStyleReferences, referenceFragmentTextStyles, replaceIdInPlace } from "./unlink-utils.js";

const WATERMARK_ACTIONS = [
	TransactionLogStateActions.addWatermark,
	TransactionLogStateActions.updateWatermark,
	TransactionLogStateActions.duplicateWatermark,
	TransactionLogStateActions.removeWatermark,
	TransactionLogStateActions.addWatermarkReference,
	TransactionLogStateActions.removeWatermarkReference,
	TransactionLogStateActions.unlinkWatermarkReference,
];

const MAX_WATERMARK_DEFINITIONS = 2;

export const WatermarkTransactionLogHandler = {
	match: function (action: AnyTransactionLogAction) {
		return WATERMARK_ACTIONS.some(watermarkAction => watermarkAction.match(action));
	},
	handle: handleWatermarkActions,
};

function* handleWatermarkActions({
	state,
	action,
	persistentEntries,
}: {
	state: TransactionLogStore;
	action: ValidAnyTransactionLogAction;
	persistentEntries: PartialTransactionLogPersistentEntry[];
}): SagaGenerator<AffectedItem[]> {
	const { interactionId } = action.payload;

	const newAffectedItems: AffectedItem[] = [];

	if (TransactionLogStateActions.addWatermark.match(action)) {
		const updatedWatermark = TransactionLog.createStoreEntryWatermark(
			state.watermarks,
			action.payload.data,
			interactionId
		);
		const contentGeneral = TransactionLog.selectPrintModelContentGeneral(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]);
		const updatedGeneral = TransactionLog.createStoreEntryPrintModelContentGeneral(
			state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
			{
				...contentGeneral,
				watermarks: [...(contentGeneral.watermarks || []), action.payload.data.id],
			},
			interactionId
		);
		persistentEntries.push(...updatedWatermark.persistentEntries, ...updatedGeneral.persistentEntries);
		newAffectedItems.push(
			...[
				{ type: "watermark" as const, id: updatedWatermark.storeEntry.id },
				{ type: "printModelContentGeneral" as const, id: updatedGeneral.storeEntry.id },
			]
		);
		const newWatermarks = state.watermarks || { id: nanoid(), map: {} };
		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				watermarks: {
					...newWatermarks,
					map: {
						...newWatermarks.map,
						[action.payload.data.id]: updatedWatermark.storeEntry,
					},
				},
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: updatedGeneral.storeEntry,
			})
		);
		return newAffectedItems;
	}

	if (TransactionLogStateActions.updateWatermark.match(action)) {
		const createStoreEntry = TransactionLog.createStoreEntryWatermark(
			state.watermarks,
			action.payload.data,
			interactionId
		);
		persistentEntries.push(...createStoreEntry.persistentEntries);
		newAffectedItems.push({ type: "watermark", id: createStoreEntry.storeEntry.id });

		const newWatermarks = state.watermarks || { id: nanoid(), map: {} };
		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				watermarks: {
					...newWatermarks,
					map: {
						...newWatermarks.map,
						[action.payload.data.id]: createStoreEntry.storeEntry,
					},
				},
			})
		);
		return newAffectedItems;
	}

	if (TransactionLogStateActions.duplicateWatermark.match(action)) {
		const { clonedWatermark, clonedWatermarkElements } = cloneWatermark(action.payload.data, {
			cloneObject: clonePrintModelEntity,
			getElement: function (elementId) {
				return TransactionLog.selectPrintModelElement(state.printModelElements, elementId);
			},
			elementIdMap: new Map(),
		});

		const creatStoreElementEntries = clonedWatermarkElements.map(element => {
			return TransactionLog.createStoreEntryPrintModelElement(state.printModelElements, element, interactionId);
		});
		const clonePersistentEntries = creatStoreElementEntries.map(entry => entry.persistentEntries);
		const cloneStoreEntries = creatStoreElementEntries.map(entry => entry.storeEntry);
		const updatedWatermark = TransactionLog.createStoreEntryWatermark(
			state.watermarks,
			clonedWatermark,
			interactionId
		);
		const contentGeneral = TransactionLog.selectPrintModelContentGeneral(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]);
		const updatedGeneral = TransactionLog.createStoreEntryPrintModelContentGeneral(
			state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
			{
				...contentGeneral,
				watermarks: [...(contentGeneral.watermarks || []), clonedWatermark.id],
			},
			interactionId
		);

		persistentEntries.push(
			...updatedWatermark.persistentEntries,
			...updatedGeneral.persistentEntries,
			...clonePersistentEntries.flat()
		);

		newAffectedItems.push(
			{ type: "watermark" as const, id: updatedWatermark.storeEntry.id },
			{ type: "printModelContentGeneral" as const, id: updatedGeneral.storeEntry.id },
			...cloneStoreEntries.map(storeEntry => ({
				type: "printModelElement" as const,
				id: storeEntry.id,
			}))
		);

		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				watermarks: {
					...state.watermarks,
					id: state.watermarks?.id || nanoid(),
					map: {
						...state.watermarks?.map,
						[updatedWatermark.storeEntry.id]: updatedWatermark.storeEntry,
					},
				},
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: updatedGeneral.storeEntry,
				printModelElements: {
					...state.printModelElements,
					...cloneStoreEntries.reduce(
						(newStoredEntries: TransactionLogStoreEntryMap<PartialAnyPrintModelElement>, storeEntry) => {
							newStoredEntries[storeEntry.id] = storeEntry;
							return newStoredEntries;
						},
						{}
					),
				},
			})
		);

		return newAffectedItems;
	}

	if (TransactionLogStateActions.removeWatermark.match(action)) {
		const usageMapLoading = yield* select(FragmentUsageSelectors.isUsageMapLoading);
		const usages = yield* select((printEngineState: PrintEngineState) =>
			FragmentUsageSelectors.usageForEntity(printEngineState, action.payload.data.id)
		);
		if (usageMapLoading || usages.length > 0) {
			yield* call(openConfirmationDialogSaga, ConfirmationDialogType.FRAGMENT_IN_USE, { usages });
			return newAffectedItems;
		}

		const isConfirmed = yield* call(openConfirmationDialogSaga, ConfirmationDialogType.DELETE);
		if (!isConfirmed) {
			return newAffectedItems;
		}

		const contentGeneral = TransactionLog.selectPrintModelContentGeneral(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]);
		const updatedContentGeneral = TransactionLog.createStoreEntryPrintModelContentGeneral(
			state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
			{
				...contentGeneral,
				watermarks: (contentGeneral.watermarks || []).filter(id => id !== action.payload.data.id),
			},
			interactionId
		);
		persistentEntries.push(...updatedContentGeneral.persistentEntries);
		newAffectedItems.push({ type: "printModelContentGeneral", id: updatedContentGeneral.storeEntry.id });
		yield* put(NavigationActions.clearActiveEntity({ tab: SidebarItem.WATERMARK }));
		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: updatedContentGeneral.storeEntry,
			})
		);

		return newAffectedItems;
	}

	if (TransactionLogStateActions.addWatermarkReference.match(action)) {
		const reference = action.payload.data;
		const existingRefs = TransactionLog.selectWatermarkReferences(state.watermarks?.referencesEntry);
		const newRefs = [...existingRefs.filter(r => r.id !== reference.id), reference];
		const contentGeneral = TransactionLog.selectPrintModelContentGeneral(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]);
		const newWatermarksOrder = [
			...(contentGeneral.watermarks || []).filter(id => id !== reference.id),
			reference.id,
		];
		yield* call(
			updateWatermarkReferences,
			state,
			newRefs,
			newWatermarksOrder,
			interactionId,
			persistentEntries,
			newAffectedItems
		);
		return newAffectedItems;
	}

	if (TransactionLogStateActions.removeWatermarkReference.match(action)) {
		const isConfirmed = yield* call(openConfirmationDialogSaga, ConfirmationDialogType.DELETE);
		if (!isConfirmed) {
			return newAffectedItems;
		}
		const { id } = action.payload.data;
		const existingRefs = TransactionLog.selectWatermarkReferences(state.watermarks?.referencesEntry);
		const newRefs = existingRefs.filter(r => r.id !== id);
		const contentGeneral = TransactionLog.selectPrintModelContentGeneral(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]);
		const newWatermarksOrder = (contentGeneral.watermarks || []).filter(watermarkId => watermarkId !== id);
		yield* call(
			updateWatermarkReferences,
			state,
			newRefs,
			newWatermarksOrder,
			interactionId,
			persistentEntries,
			newAffectedItems
		);
		return newAffectedItems;
	}

	if (TransactionLogStateActions.unlinkWatermarkReference.match(action)) {
		const { referenceId, fragmentContent } = action.payload.data;
		const ref = TransactionLog.selectWatermarkReferences(state.watermarks?.referencesEntry).find(
			r => r.id === referenceId
		);
		if (!ref) {
			return newAffectedItems;
		}

		const resolved = fragmentContent.watermarks?.definitions?.find(watermark => watermark.id === ref.refId);
		if (!resolved) {
			return newAffectedItems;
		}

		const contentGeneral = TransactionLog.selectPrintModelContentGeneral(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]);
		const existingWatermarkDefinitions = (contentGeneral.watermarks ?? []).flatMap(watermarkId => {
			const entry = state.watermarks?.map?.[watermarkId];
			return entry ? [entry.memoizedObject] : [];
		});
		const hasConflictingSlot = existingWatermarkDefinitions.some(
			watermark => watermark.pageOrientation === resolved.pageOrientation
		);
		if (hasConflictingSlot || existingWatermarkDefinitions.length >= MAX_WATERMARK_DEFINITIONS) {
			return newAffectedItems;
		}

		let hasUnresolved = false;
		const onUnresolved = () => {
			hasUnresolved = true;
		};

		const usedTextStyleIds = collectUsedTextStyleIds(resolved, fragmentContent);
		const { newReferences, newOrderIds, textStyleIdMap } = referenceFragmentTextStyles(
			state,
			fragmentContent,
			ref.model,
			usedTextStyleIds,
			onUnresolved
		);

		const { clonedWatermark, clonedWatermarkElements } = cloneWatermark(resolved, {
			cloneObject: clonePrintModelEntity,
			getElement: createFragmentElementGetter(fragmentContent),
			elementIdMap: new Map(),
			textStyleIdMap,
			onUnresolved,
		});

		if (hasUnresolved) {
			return newAffectedItems;
		}

		const newWatermark: PartialWatermark = clonedWatermark;

		const createStoreElementEntries = clonedWatermarkElements.map(element =>
			TransactionLog.createStoreEntryPrintModelElement(state.printModelElements, element, interactionId)
		);
		const clonePersistentEntries = createStoreElementEntries.map(entry => entry.persistentEntries);
		const cloneStoreEntries = createStoreElementEntries.map(entry => entry.storeEntry);

		const updatedWatermark = TransactionLog.createStoreEntryWatermark(
			state.watermarks,
			newWatermark,
			interactionId
		);

		const existingWatermarkRefs = TransactionLog.selectWatermarkReferences(state.watermarks?.referencesEntry);
		const updatedWatermarkRefsEntry = TransactionLog.createStoreEntryWatermarkReferences(
			state.watermarks?.referencesEntry,
			{
				id: WATERMARKS_REFERENCES_ENTRY_ID,
				references: existingWatermarkRefs.filter(r => r.id !== referenceId),
			},
			interactionId
		);

		const textStyleRefsUpdate = appendTextStyleReferences(state, newReferences, interactionId);

		const updatedGeneral = TransactionLog.createStoreEntryPrintModelContentGeneral(
			state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
			{
				...contentGeneral,
				watermarks: replaceIdInPlace(contentGeneral.watermarks, referenceId, newWatermark.id),
				textStyles: [...(contentGeneral.textStyles || []), ...newOrderIds],
			},
			interactionId
		);

		persistentEntries.push(
			...updatedWatermark.persistentEntries,
			...updatedWatermarkRefsEntry.persistentEntries,
			...textStyleRefsUpdate.persistentEntries,
			...updatedGeneral.persistentEntries,
			...clonePersistentEntries.flat()
		);
		newAffectedItems.push(
			{ type: "watermark" as const, id: updatedWatermark.storeEntry.id },
			{ type: "watermarkReferences" as const, id: updatedWatermarkRefsEntry.storeEntry.id },
			...textStyleRefsUpdate.affectedItems,
			{ type: "printModelContentGeneral" as const, id: updatedGeneral.storeEntry.id },
			...cloneStoreEntries.map(storeEntry => ({ type: "printModelElement" as const, id: storeEntry.id }))
		);

		const newWatermarks = state.watermarks || { id: nanoid(), map: {} };
		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				watermarks: {
					...newWatermarks,
					map: {
						...newWatermarks.map,
						[updatedWatermark.storeEntry.id]: updatedWatermark.storeEntry,
					},
					referencesEntry: updatedWatermarkRefsEntry.storeEntry,
				},
				textStyles: textStyleRefsUpdate.textStyles,
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: updatedGeneral.storeEntry,
				printModelElements: {
					...state.printModelElements,
					...cloneStoreEntries.reduce(
						(newStoredEntries: TransactionLogStoreEntryMap<PartialAnyPrintModelElement>, storeEntry) => {
							newStoredEntries[storeEntry.id] = storeEntry;
							return newStoredEntries;
						},
						{}
					),
				},
			})
		);

		const activeEntitiesAfterUnlink = yield* select(NavigationSelectors.activeEntities);
		if (activeEntitiesAfterUnlink.watermarkId === referenceId) {
			yield* put(NavigationActions.setActiveEntity({ tab: SidebarItem.WATERMARK, entityId: newWatermark.id }));
		}

		return newAffectedItems;
	}

	return newAffectedItems;
}

function* updateWatermarkReferences(
	state: TransactionLogStore,
	newRefs: FragmentModelReference[],
	newWatermarksOrder: ReadonlyArray<string>,
	interactionId: string,
	persistentEntries: PartialTransactionLogPersistentEntry[],
	newAffectedItems: AffectedItem[]
): SagaGenerator<void> {
	const updatedRefsEntry = TransactionLog.createStoreEntryWatermarkReferences(
		state.watermarks?.referencesEntry,
		{ id: WATERMARKS_REFERENCES_ENTRY_ID, references: newRefs },
		interactionId
	);
	const contentGeneral = TransactionLog.selectPrintModelContentGeneral(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]);
	const updatedGeneral = TransactionLog.createStoreEntryPrintModelContentGeneral(
		state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
		{ ...contentGeneral, watermarks: newWatermarksOrder },
		interactionId
	);
	persistentEntries.push(...updatedRefsEntry.persistentEntries, ...updatedGeneral.persistentEntries);
	newAffectedItems.push(
		{ type: "watermarkReferences" as const, id: updatedRefsEntry.storeEntry.id },
		{ type: "printModelContentGeneral" as const, id: updatedGeneral.storeEntry.id }
	);
	const newWatermarks = state.watermarks || { id: nanoid(), map: {} };
	yield* put(
		TransactionLogStateActions.setLogStore({
			...state,
			[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: updatedGeneral.storeEntry,
			watermarks: {
				...newWatermarks,
				referencesEntry: updatedRefsEntry.storeEntry,
			},
		})
	);
}

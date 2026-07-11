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
import { call, put } from "typed-redux-saga";
import { nanoid } from "nanoid";

import {
	type PartialTransactionLogPersistentEntry,
	type TransactionLogStore,
	type AffectedItem,
	SidebarItem,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { TransactionLog } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { PRINT_MODEL_CONTENT_GENERAL_LOG_ID } from "@com.mgmtp.a12.print/print-model-api/model";

import type { AnyTransactionLogAction, ValidAnyTransactionLogAction } from "../../../redux/index.js";
import { ConfirmationDialogType, NavigationActions, TransactionLogStateActions } from "../../../redux/index.js";
import { openConfirmationDialogSaga } from "../../confirmation-dialog/open-confirmation-dialog-saga.js";

const WATERMARK_ACTIONS = [
	TransactionLogStateActions.addWatermark,
	TransactionLogStateActions.updateWatermark,
	TransactionLogStateActions.removeWatermark,
];

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

	if (TransactionLogStateActions.removeWatermark.match(action)) {
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

	return newAffectedItems;
}

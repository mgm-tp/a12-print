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
import { call, put } from "typed-redux-saga";

import {
	PartialTransactionLogPersistentEntry,
	TransactionLog,
	TransactionLogStore,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/transaction-log.js";
import {
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	PRINT_MODEL_HEADER_LOG_ID,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/constant.js";
import { AffectedItem } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/interaction-log.js";
import { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";
import { AnnotationEntity, PrintModelEntity } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { openConfirmationDialogSaga } from "../../confirmation-dialog/open-confirmation-dialog-saga.js";
import {
	AnyTransactionLogAction,
	ConfirmationDialogType,
	TransactionLogStateActions,
	ValidAnyTransactionLogAction,
} from "../../../redux/index.js";

const GENERAL_ACTIONS = [
	TransactionLogStateActions.updatePrintHeader,
	TransactionLogStateActions.updatePrintContentGeneral,
	TransactionLogStateActions.reorderStructure,
];

export const GeneralTransactionLogHandler = {
	match: function (action: AnyTransactionLogAction) {
		return GENERAL_ACTIONS.some(elementAction => elementAction.match(action));
	},
	handle: handleGeneralActions,
};

function* handleGeneralActions({
	state,
	action,
	persistentEntries,
}: {
	state: TransactionLogStore;
	action: ValidAnyTransactionLogAction;
	persistentEntries: PartialTransactionLogPersistentEntry[];
}): SagaIterator<AffectedItem[]> {
	const { interactionId } = action.payload;

	const newAffectedItems: AffectedItem[] = [];

	if (TransactionLogStateActions.updatePrintHeader.match(action)) {
		const header = TransactionLog.selectPrintModelHeader(state[PRINT_MODEL_HEADER_LOG_ID]);
		const isDeleteAnnotation = (action.payload.data.annotations?.length || 0) < (header.annotations?.length || 0);

		if (isDeleteAnnotation && !isDeletedAnnotationRole(header.annotations, action.payload.data.annotations)) {
			const isConfirmed = yield* call(openConfirmationDialogSaga, ConfirmationDialogType.DELETE);
			if (!isConfirmed) {
				return newAffectedItems;
			}
		}

		const createStoreEntry = TransactionLog.createStoreEntryPrintModelHeader(
			state[PRINT_MODEL_HEADER_LOG_ID],
			action.payload.data,
			interactionId
		);
		persistentEntries.push(...createStoreEntry.persistentEntries);
		newAffectedItems.push({ type: "printModelHeader", id: createStoreEntry.storeEntry.id });
		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				[PRINT_MODEL_HEADER_LOG_ID]: createStoreEntry.storeEntry,
			})
		);

		return newAffectedItems;
	}

	if (TransactionLogStateActions.updatePrintContentGeneral.match(action)) {
		const createStoreEntry = TransactionLog.createStoreEntryPrintModelContentGeneral(
			state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
			action.payload.data,
			interactionId
		);
		persistentEntries.push(...createStoreEntry.persistentEntries);
		newAffectedItems.push({ type: "printModelContentGeneral", id: createStoreEntry.storeEntry.id });
		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: createStoreEntry.storeEntry,
			})
		);
		return newAffectedItems;
	}

	if (TransactionLogStateActions.reorderStructure.match(action)) {
		const contentGeneral = TransactionLog.selectPrintModelContentGeneral(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]);
		const structure = [...(contentGeneral.structure || [])];
		if (structure.length === 0) {
			return newAffectedItems;
		}

		const { currentIndex, targetIndex } = action.payload.data;
		const currentSegment = structure[currentIndex];
		structure[currentIndex] = structure[targetIndex];
		structure[targetIndex] = currentSegment;

		const updatedGeneral = TransactionLog.createStoreEntryPrintModelContentGeneral(
			state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
			{ ...contentGeneral, structure },
			interactionId
		);
		persistentEntries.push(...updatedGeneral.persistentEntries);
		newAffectedItems.push({ type: "printModelContentGeneral", id: updatedGeneral.storeEntry.id });

		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: updatedGeneral.storeEntry,
			})
		);
		return newAffectedItems;
	}

	return newAffectedItems;
}

function isDeletedAnnotationRole(
	oldHeader: readonly (DeepPartialRecursive<AnnotationEntity> & PrintModelEntity)[] | undefined,
	newHeader: readonly (DeepPartialRecursive<AnnotationEntity> & PrintModelEntity)[] | undefined
) {
	if (!oldHeader || !newHeader) {
		return false;
	}
	const hasRolesOld = oldHeader.find(val => val.name === "roles");
	const hasRolesNew = newHeader.find(val => val.name === "roles");
	return hasRolesOld && !hasRolesNew;
}

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
import { call, getContext, put, select, takeLatest } from "typed-redux-saga";
import type { PayloadAction } from "@reduxjs/toolkit";

import { createMemoizedObject } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { ModelReferenceEntity, PartialPrintModelHeader } from "@com.mgmtp.a12.print/print-model-api/model";
import { PRINT_MODEL_HEADER_LOG_ID } from "@com.mgmtp.a12.print/print-model-api/model";
import type { TransactionLogStore } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { ConfirmationDialogType, FragmentActions, TransactionLogStateActions } from "../../redux/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { SchemaActions } from "../../redux/schema/action.js";
import type { RequestApi } from "../../api/request-api.js";

import { openConfirmationDialogSaga } from "../confirmation-dialog/open-confirmation-dialog-saga.js";

export function* addFragmentModelReferenceSaga(): SagaGenerator<void> {
	yield* takeLatest(SchemaActions.addFragmentModelReference.match, handleAddFragmentModelReferenceSaga);
}

export function* handleAddFragmentModelReferenceSaga(action: PayloadAction<ModelReferenceEntity>): SagaGenerator<void> {
	const isConfirmed = yield* call(openConfirmationDialogSaga, ConfirmationDialogType.CANNOT_BE_UNDONE);
	if (!isConfirmed) {
		return;
	}

	const requestApi: RequestApi = yield* getContext<RequestApi>("requestApi");
	const transactionLogStore = yield* select(PrintEngineSelectors.transactionLogState);
	const printHeader = yield* select(PrintEngineSelectors.printHeader);

	const headerEntry = transactionLogStore[PRINT_MODEL_HEADER_LOG_ID];
	const initialHeader = headerEntry.initialObject;

	if (!printHeader.id || !initialHeader) {
		return;
	}

	const updatedInitialHeader: PartialPrintModelHeader = {
		...initialHeader,
		modelReferences: [...(initialHeader.modelReferences || []), action.payload],
	};

	const updatedStore: TransactionLogStore = {
		...transactionLogStore,
		[PRINT_MODEL_HEADER_LOG_ID]: {
			...headerEntry,
			memoizedObject: createMemoizedObject<PartialPrintModelHeader>(
				headerEntry.id,
				"printModelHeader",
				[...headerEntry.log],
				updatedInitialHeader
			),
			initialObject: updatedInitialHeader,
		},
	};

	yield* put(TransactionLogStateActions.setLogStore(updatedStore));

	const loadPrintModelResponse = yield* call(requestApi.loadPrintModel, printHeader.id);
	if (loadPrintModelResponse?.printModel) {
		const updatedPrintModel = {
			...loadPrintModelResponse.printModel,
			header: {
				...loadPrintModelResponse.printModel.header,
				modelReferences: [...(loadPrintModelResponse.printModel.header.modelReferences || []), action.payload],
			},
		};
		yield* call(requestApi.setPrintModel, updatedPrintModel, false);
	}

	yield* put(FragmentActions.loadFragment(action.payload.reference));
}

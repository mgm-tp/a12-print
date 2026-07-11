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
import { all, call, getContext, put, takeLatest } from "typed-redux-saga";
import type { PayloadAction } from "@reduxjs/toolkit";

import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";
import { Log, PrintModelCreator } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import type { RequestApi } from "../../api/index.js";
import {
	InteractionLogActions,
	RequestApiActions,
	TransactionLogStateActions,
	ValidationActions,
} from "../../redux/index.js";
import { interactionGraph } from "../../constant/interaction-graph.js";

import { ensureDocumentModelsLoaded } from "../document-model-data/load-document-model-data-saga.js";

const log = LoggerFactory.getLogger("InitialLoadPrintModelSaga");

export function* initializePrintModelSaga(): SagaGenerator<void> {
	yield* takeLatest(RequestApiActions.initializePrintModel.match, handleInitializePrintModelSaga);
}

function* handleInitializePrintModelSaga(action: PayloadAction<string>): SagaGenerator<void> {
	const requestApi: RequestApi = yield* getContext("requestApi");
	const loadPrintModelResponse = yield* call(requestApi.loadPrintModel, action.payload);

	if (loadPrintModelResponse?.printModel && loadPrintModelResponse.logPersistentEntries) {
		const stores = Log.createStores(
			loadPrintModelResponse.logPersistentEntries,
			loadPrintModelResponse.printModel,
			interactionGraph
		);

		const partialPrintModel = PrintModelCreator.createStoreModel(stores.transactionLogStore);
		const references = partialPrintModel.header?.modelReferences;

		const referencedDocumentModelIds =
			references?.flatMap(ref => (ref.reference && ref.modelType === "document" ? [ref.reference] : [])) ?? [];
		// Must complete before setLogStore so all document models are in the store when validation runs.
		yield* ensureDocumentModelsLoaded(referencedDocumentModelIds);

		yield* put(TransactionLogStateActions.setLogStore(stores.transactionLogStore));
		yield* put(InteractionLogActions.setLogStore(stores.interactionLogStore));
		yield* put(ValidationActions.validateTextStyles());
		yield* put(RequestApiActions.loadTypesettingModels());

		const referencedPrintModels =
			references?.flatMap(ref => (ref.reference && ref.modelType === "print" ? [ref.reference] : [])) || [];
		yield* all(referencedPrintModels.map(ref => put(RequestApiActions.loadDINTemplatePrintModel(ref))));
	} else {
		if (loadPrintModelResponse?.errorMap) {
			yield* put(ValidationActions.setErrorMap(loadPrintModelResponse.errorMap));
		}
		log.error(`No print model with id ${action.payload} loaded`);
	}
}

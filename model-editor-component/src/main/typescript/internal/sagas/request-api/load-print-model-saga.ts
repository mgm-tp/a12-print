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
import { call, getContext, put, takeLatest } from "typed-redux-saga";
import type { PayloadAction } from "@reduxjs/toolkit";

import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";
import { Log } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import type { RequestApi } from "../../api/index.js";
import {
	InteractionLogActions,
	RequestApiActions,
	TransactionLogStateActions,
	ValidationActions,
} from "../../redux/index.js";
import { interactionGraph } from "../../constant/interaction-graph.js";

const log = LoggerFactory.getLogger("LoadPrintModelSaga");

export function* loadPrintModelSaga(): SagaGenerator<void> {
	yield* takeLatest(RequestApiActions.loadPrintModel.match, handleLoadPrintModelSaga);
}

function* handleLoadPrintModelSaga(action: PayloadAction<string>): SagaGenerator<void> {
	const requestApi: RequestApi = yield* getContext("requestApi");
	const loadPrintModelResponse = yield* call(requestApi.loadPrintModel, action.payload);

	if (loadPrintModelResponse?.printModel && loadPrintModelResponse.logPersistentEntries) {
		const stores = Log.createStores(
			loadPrintModelResponse.logPersistentEntries,
			loadPrintModelResponse.printModel,
			interactionGraph
		);
		yield* put(TransactionLogStateActions.setLogStore(stores.transactionLogStore));
		yield* put(InteractionLogActions.setLogStore(stores.interactionLogStore));
	} else {
		if (loadPrintModelResponse?.errorMap) {
			yield* put(ValidationActions.setErrorMap(loadPrintModelResponse.errorMap));
		}
		log.error(`No print model with id ${action.payload} loaded`);
	}
}

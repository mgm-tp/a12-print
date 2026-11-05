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
import { getContext, put, call, select, takeEvery, type SagaGenerator } from "typed-redux-saga";
import type { PayloadAction } from "@reduxjs/toolkit";

import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";

import { FragmentActions, RequestApiActions, RequestApiSelectors } from "../../redux/index.js";
import type { RequestApi } from "../../api/request-api.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";

const log = LoggerFactory.getLogger("LoadFragmentSaga");

export function* loadFragmentSaga(): SagaGenerator<void> {
	yield* takeEvery(FragmentActions.loadFragment.match, handleLoadFragmentSaga);
}

export function* handleLoadFragmentSaga(action: PayloadAction<string>): SagaGenerator<void> {
	const fragmentModelId = action.payload;
	const cachedModel: ReturnType<typeof RequestApiSelectors.printModel> = yield* select((state: PrintEngineState) =>
		RequestApiSelectors.printModel(state, fragmentModelId)
	);
	if (cachedModel) {
		return;
	}

	const requestApi: RequestApi = yield* getContext("requestApi");
	const fragmentModel = yield* call(requestApi.loadFragmentModel, fragmentModelId);

	if (fragmentModel?.printModel) {
		yield* put(RequestApiActions.setFragmentModel(fragmentModel.printModel));
	} else {
		log.error(`The fragment model ${fragmentModelId} could not be loaded`);
		yield* put(RequestApiActions.setFragmentModelError(fragmentModelId));
	}
}

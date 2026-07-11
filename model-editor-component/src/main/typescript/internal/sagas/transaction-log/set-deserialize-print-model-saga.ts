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
import { getContext, put, select, takeEvery } from "typed-redux-saga";
import type { PayloadAction } from "@reduxjs/toolkit";

import type { MarshallerResult } from "@com.mgmtp.a12.print/print-model-api-utils/marshaller";
import type { PrintModel } from "@com.mgmtp.a12.print/print-model-api/model";

import { ValidationActions } from "../../redux/index.js";
import type { RequestApi } from "../../api/index.js";
import { ValidationSelectors } from "../../redux//validation/selectors.js";
import { EditorComponentApiActions } from "../../../a12internal/api/actions-api.js";

export function* setDeserializePrintModelResultSaga(): SagaGenerator<void> {
	yield* takeEvery(
		EditorComponentApiActions.setDeserializePrintModelResult.match,
		handleSetDeserializePrintModelResultSaga
	);
}

function* handleSetDeserializePrintModelResultSaga(action: PayloadAction<MarshallerResult<PrintModel, PrintModel>>) {
	const deserializeRes = action.payload;

	if (deserializeRes.report.relevantPaths.length) {
		yield* put(
			ValidationActions.appendErrors({
				errorMap: deserializeRes.report.errorMap,
			})
		);
	} else {
		yield* put(ValidationActions.setErrorMap(deserializeRes.report.errorMap));
	}
	const requestApi = yield* getContext<RequestApi>("requestApi");
	const validationState = yield* select(ValidationSelectors.validationState);
	requestApi.onValidationStateChange(validationState);
}

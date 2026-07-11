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
import { put, select, take, takeLatest } from "typed-redux-saga";
import type { PayloadAction } from "@reduxjs/toolkit";

import { NavigationActions, RequestApiActions, TransactionLogStateActions } from "../../redux/index.js";
import { PrintEngineActions } from "../../store/actions.js";
import { PrintEngineSelectors } from "../../store/selectors.js";

export function* onEditorPropsChangedSaga(): SagaGenerator<void> {
	yield* takeLatest(PrintEngineActions.editorPropsChanged.match, handleEditorPropsChanged);
}

function* handleEditorPropsChanged(
	action: PayloadAction<PrintEngineActions.EditorPropsChangedPayload>
): SagaGenerator<void> {
	const { printModelId, navigationPath } = action.payload;
	const currentModelId: string | undefined = yield* select(PrintEngineSelectors.printModelId);

	if (currentModelId !== printModelId) {
		yield* put(PrintEngineActions.resetState());
		yield* put(RequestApiActions.initializePrintModel(printModelId));
		yield* put(RequestApiActions.loadPrintModelIds());
		yield* put(RequestApiActions.loadTypesettingModelHeaders());

		yield* take(TransactionLogStateActions.setLogStore.match);

		if (navigationPath) {
			yield* put(NavigationActions.navigateFromPath({ path: navigationPath }));
		}
	} else if (navigationPath) {
		yield* put(NavigationActions.navigateFromPath({ path: navigationPath }));
	}
}

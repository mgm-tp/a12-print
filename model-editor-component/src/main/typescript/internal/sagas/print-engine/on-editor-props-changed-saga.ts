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
import { all, call, getContext, put, race, select, take, takeLatest } from "typed-redux-saga";
import type { PayloadAction } from "@reduxjs/toolkit";

import { PrintModelCreator } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import {
	FragmentActions,
	FragmentUsageActions,
	NavigationActions,
	RequestApiActions,
	RequestApiSelectors,
	TransactionLogStateActions,
} from "../../redux/index.js";
import { PrintEngineActions } from "../../store/actions.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import type { RequestApi } from "../../api/request-api.js";

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
		yield* put(RequestApiActions.loadPrintModelHeaders());
		yield* put(RequestApiActions.loadTypesettingModelHeaders());

		yield* take(TransactionLogStateActions.setLogStore.match);

		const fragmentModelRefs: ReturnType<typeof PrintEngineSelectors.fragmentModelReferences> = yield* select(
			PrintEngineSelectors.fragmentModelReferences
		);
		const distinctModelIds = [...new Set(fragmentModelRefs.flatMap(ref => (ref.reference ? [ref.reference] : [])))];
		for (const modelId of distinctModelIds) {
			yield* put(FragmentActions.loadFragment(modelId));
		}

		const modelSubType: ReturnType<typeof PrintEngineSelectors.printModelSubType> = yield* select(
			PrintEngineSelectors.printModelSubType
		);
		if (modelSubType === "fragment") {
			yield* put(FragmentUsageActions.loadUsageMap(printModelId));
		}

		if (distinctModelIds.length) {
			// Fragment models load asynchronously (put() above doesn't wait); navigating to a reference
			// can require resolving its target via printModelData (e.g. text style preview), so wait for
			// all of them before dispatching, or that resolution races the load and fails intermittently.
			yield* all(distinctModelIds.map(modelId => call(waitForFragmentModel, modelId)));
			// The initial validation ran before these models were available, so every fragment reference
			// looked unresolvable. Validate once more now that they are there.
			yield* call(revalidatePrintModel);
		}

		if (navigationPath) {
			yield* put(NavigationActions.navigateFromPath({ path: navigationPath }));
		}
	} else if (navigationPath) {
		yield* put(NavigationActions.navigateFromPath({ path: navigationPath }));
	}
}

/**
 * Runs the same validation path the editor uses after a model change - the serialize call reports its error map
 * back into the validation state.
 */
function* revalidatePrintModel(): SagaGenerator<void> {
	const requestApi: RequestApi = yield* getContext("requestApi");
	const logStore: ReturnType<typeof PrintEngineSelectors.transactionLogState> = yield* select(
		PrintEngineSelectors.transactionLogState
	);

	yield* call(requestApi.serializePrintModel, PrintModelCreator.createCleanModel(logStore));
}

function* waitForFragmentModel(modelId: string): SagaGenerator<void> {
	const cached: ReturnType<typeof RequestApiSelectors.printModel> = yield* select((state: PrintEngineState) =>
		RequestApiSelectors.printModel(state, modelId)
	);
	if (cached) {
		return;
	}
	// Races loaded/error so a fragment model that fails to load can't block navigation forever.
	let settledModelId: string | undefined;
	while (settledModelId !== modelId) {
		const { loaded, failed } = yield* race({
			loaded: take(RequestApiActions.setFragmentModel.match),
			failed: take(RequestApiActions.setFragmentModelError.match),
		});
		settledModelId = loaded ? loaded.payload.header.id : failed?.payload;
	}
}

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
import { call, put, select, takeEvery } from "typed-redux-saga";
import type { PayloadAction } from "@reduxjs/toolkit";

import { PrintModelCreator } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { PrintModelGarbageCollector } from "@com.mgmtp.a12.print/print-model-api-utils/garbage-collector";
import type { PrintModel } from "@com.mgmtp.a12.print/print-model-api/model";

import { NavigationActions } from "../../redux/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";

import { parsePath } from "./path-to-steps.js";
import { buildAncestrySteps, filterTableLayoutAncestors } from "./ancestry-steps.js";
import { stepsToNavigationState } from "./steps-to-navigation-state.js";
import { isElementNavigationStep, isWrapperElementNavigationStep } from "./navigation-steps.js";

export function* navigateFromPathSaga(): SagaGenerator<void> {
	yield* takeEvery(NavigationActions.navigateFromPath.match, handlenNavigateFromPath);
}

function* handlenNavigateFromPath(
	action: PayloadAction<NavigationActions.NavigateFromPathPayload>
): SagaGenerator<void> {
	const { path, target } = action.payload;

	const logStore = yield* select(PrintEngineSelectors.transactionLogState);

	const cleanPrintModelWithOverrides = PrintModelGarbageCollector.filterUnusedObjects(
		PrintModelCreator.createStoreModel(logStore) as PrintModel,
		true
	);

	const steps = yield* call(parsePath, path, cleanPrintModelWithOverrides);

	if (!steps.length) {
		return;
	}

	const rootStep = steps.at(0);

	if (!rootStep) {
		return;
	}

	if (isElementNavigationStep(rootStep) || isWrapperElementNavigationStep(rootStep)) {
		const ancestryTokens = buildAncestrySteps(rootStep, cleanPrintModelWithOverrides, target);
		steps.unshift(...ancestryTokens);
	}

	const navState = stepsToNavigationState(filterTableLayoutAncestors(steps));
	yield* put(NavigationActions.jumpTo(navState));
}

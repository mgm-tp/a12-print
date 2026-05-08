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
import { Action, AnyAction } from "typescript-fsa";
import { put, select, takeEvery } from "typed-redux-saga";
import { nanoid } from "nanoid";

import { InteractionLogActions } from "../../../main/typescript/internal/redux/index.js";
import { PrintEngineSelectors } from "../../../main/typescript/internal/store/selectors.js";

function* mockStartInteractionSaga(): SagaIterator {
	yield* takeEvery(
		(action: AnyAction) => InteractionLogActions.start.match(action),
		function* mockHandleStartInteractionSaga(action: Action<InteractionLogActions.StartPayload>): SagaIterator {
			const { transactionLogActions, region, description } = action.payload;
			if (transactionLogActions.length === 0) {
				return;
			}
			const regionId =
				region === "sidebar" ? (yield* select(PrintEngineSelectors.sidebar)).selectedItem : "mockRegionId123";
			const newInteractionId = nanoid();
			yield* put(
				InteractionLogActions.addLogEntry({
					region,
					regionId,
					logEntry: {
						timestamp: Date.now(),
						interactionId: newInteractionId,
						affectedItems: [],
						description,
						type: "SET",
					},
				})
			);
			for (const tlAction of transactionLogActions) {
				yield* put({
					...tlAction,
					payload: { ...tlAction.payload, interactionId: newInteractionId, region, regionId },
				});
			}
		}
	);
}

function* mockLoadDocumentModelDataSaga(): SagaIterator {
	// No-op mock saga
}

export const mockSagaMap: Record<string, () => SagaIterator> = {
	startInteractionSaga: mockStartInteractionSaga,
	loadDocumentModelDataSaga: mockLoadDocumentModelDataSaga,
};

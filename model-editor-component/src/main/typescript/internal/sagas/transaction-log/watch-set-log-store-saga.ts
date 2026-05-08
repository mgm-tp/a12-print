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
import { call, delay, fork, getContext, put, race, SagaGenerator, take } from "typed-redux-saga";
import { Action } from "typescript-fsa";
import uniqWith from "lodash/uniqWith.js";

import {
	AffectedItem,
	TransactionLogStore,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import { PrintModelCreator } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/print-model-creator/index.js";
import { PartialAnyPrintModelElement } from "@com.mgmtp.a12.print/print-model-api/lib/model/partial.js";

import { TransactionLogStateActions, ValidationActions } from "../../redux/index.js";
import { RequestApi } from "../../api/index.js";
import {
	createRelevantPathsFromAffectedItems,
	getAffectedItemMeta,
} from "../../utils/validation-relevant-path-utils.js";
import { ElementsUtils } from "../../utils/elements-utils.js";

export function* watchSetLogStoreSaga(): SagaGenerator<void> {
	yield* fork(function* () {
		while (true) {
			const action = yield* take<Action<TransactionLogStore>>(TransactionLogStateActions.setLogStore);
			let latestActionPayload: TransactionLogStore = action.payload;

			const affectedItems = getAffectedItemMeta(action.meta);

			while (true) {
				const { debounced, latestAction } = yield* race({
					debounced: delay(200),
					latestAction: take<Action<TransactionLogStore>>(TransactionLogStateActions.setLogStore),
				});

				if (debounced) {
					yield* call(processWatchSetLogStore, latestActionPayload, affectedItems);
					break;
				}

				if (latestAction) {
					affectedItems.push(...getAffectedItemMeta(latestAction.meta));
					latestActionPayload = latestAction.payload;
				}
			}
		}
	});
}

function* processWatchSetLogStore(payload: TransactionLogStore, affectedItems: AffectedItem[]): SagaIterator {
	const requestApi = yield* getContext<RequestApi>("requestApi");
	const printModel = PrintModelCreator.createCleanModel(payload);

	const partialPrintModel = PrintModelCreator.createStoreModel(payload);
	const uniqueAffectedItems = uniqWith(affectedItems, (a, b) => a.id === b.id);
	const referencesForAffectedItems = uniqueAffectedItems
		.flatMap(item => {
			const element = partialPrintModel.content?.elementDefinitions?.find(el => el.id === item.id);
			return (
				element &&
				ElementsUtils.getNestedReference(element as PartialAnyPrintModelElement, partialPrintModel).flatMap(
					entry => {
						const newAffectedItem: AffectedItem = {
							type: "printModelElement",
							id: entry,
						};
						return newAffectedItem;
					}
				)
			);
		})
		.filter(el => el !== undefined);

	const allAffectedItems = uniqWith(uniqueAffectedItems.concat(referencesForAffectedItems), (a, b) => a.id === b.id);

	if (allAffectedItems.length) {
		yield* put(
			ValidationActions.removeErrors({
				affectedItems: allAffectedItems,
			})
		);
	}

	const relevantPaths = createRelevantPathsFromAffectedItems(allAffectedItems, printModel);

	requestApi.serializePrintModel(printModel, relevantPaths);
}

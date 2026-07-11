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
import { call, delay, fork, put, race, select, take } from "typed-redux-saga";
import type { PayloadAction } from "@reduxjs/toolkit";

import type { PartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/model";

import { InteractionLogActions, TransactionLogStateActions } from "../../redux/index.js";
import type { UndoInteractionLogEntry } from "../../store/selectors.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { RESOURCE_KEYS } from "../../../internal/localization/index.js";

export function* updateElementHeightDomNodeSaga(): SagaGenerator<void> {
	yield* takeDomNodeHeightUpdate();
}

const DEBOUNCE_TIME = 300;
const PATTERN = InteractionLogActions.updateElementHeightDomNode.match;

function takeDomNodeHeightUpdate() {
	return fork(function* () {
		while (true) {
			const payloadPlaceable = (yield* take(PATTERN)).payload;
			const fullLogEntryList = yield* select(PrintEngineSelectors.currentViewInteractionList);
			const lastEntry = fullLogEntryList[fullLogEntryList.length - 1];
			const elementReferences = yield* select(PrintEngineSelectors.elementReferences);
			if (lastEntry) {
				const isHandled = yield* call(handleRecentEntry, lastEntry, payloadPlaceable, elementReferences);
				if (isHandled) {
					continue;
				}
			}

			const updatedPlaceables = yield* collectDebouncedPlaceables(payloadPlaceable);
			yield* put(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.other.fixInvalidElementHeights,
					region: "sidebar",
					preventUndo: true,
					transactionLogActions: [
						TransactionLogStateActions.updateReferenceElements({
							data: elementReferences.map(placeable =>
								updatedPlaceables[placeable.id] ? updatedPlaceables[placeable.id] : placeable
							),
						}),
					],
				})
			);
		}
	});
}

function* collectDebouncedPlaceables(payloadPlaceable: PartialValidPlaceableReference) {
	const updatedPlaceables: Record<string, PartialValidPlaceableReference> = {
		[payloadPlaceable.id]: payloadPlaceable,
	};

	while (true) {
		const { debounced, latestAction } = (yield* race({
			debounced: delay(DEBOUNCE_TIME),
			latestAction: take(PATTERN),
		})) as { debounced: true | undefined; latestAction?: PayloadAction<PartialValidPlaceableReference> };

		if (debounced) {
			break;
		}
		const latestPlaceable = latestAction?.payload;
		if (latestPlaceable) {
			updatedPlaceables[latestPlaceable.id] = latestPlaceable;
		}
	}

	return updatedPlaceables;
}

function hasMinHeightChanged(oldValue: PartialValidPlaceableReference, newValue: PartialValidPlaceableReference) {
	return oldValue.dimensions.minHeight.value !== newValue.dimensions.minHeight.value;
}

function* handleRecentEntry(
	lastEntry: UndoInteractionLogEntry,
	payloadPlaceable: PartialValidPlaceableReference,
	elementReferences: PartialValidPlaceableReference[]
): SagaGenerator<boolean> {
	const isDebounce = Date.now() - lastEntry.timestamp < DEBOUNCE_TIME;

	if (!isDebounce) {
		return false;
	}

	const originalReference = elementReferences.find(el => el.id === payloadPlaceable.id);
	const isMinHeightChanged = originalReference && hasMinHeightChanged(originalReference, payloadPlaceable);

	if (!isMinHeightChanged) {
		return false;
	}

	yield* put(
		TransactionLogStateActions.updateReferenceElements({
			interactionId: lastEntry.interactionId,
			region: lastEntry.region,
			regionId: lastEntry.regionId,
			data: elementReferences.map(el => (el.id === payloadPlaceable.id ? payloadPlaceable : el)),
		})
	);
	return true;
}

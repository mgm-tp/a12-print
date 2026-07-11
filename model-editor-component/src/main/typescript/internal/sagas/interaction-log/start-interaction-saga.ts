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
import { nanoid } from "nanoid";
import type { SagaGenerator } from "typed-redux-saga";
import { delay, fork, getContext, put, race, select, take, call } from "typed-redux-saga";
import type { Action, PayloadAction } from "@reduxjs/toolkit";

import type { InteractionLogEntry, InteractionRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import {
	GlobalRegion,
	ListingRegion,
	TableRegion,
	TextRegion,
	SidebarRegion,
	StageRegion,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";

import { InteractionLogActions } from "../../redux//interaction-log/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import type { RequestApi } from "../../api/index.js";
import {
	isBaseElementFormState,
	isListingColumnFormState,
	isListingFieldCompFormState,
	isListingGroupPropertyCompFormState,
	isListingPropertyCompFormState,
	isTableColumnFormState,
	NavigationSelectors,
} from "../../redux/index.js";
import { assertExists } from "../../utils/type-utils.js";

const log = LoggerFactory.getLogger("StartInteractionSaga");

const APPEND_INTERVAL = 200;

type InteractionSaga = (
	action: PayloadAction<InteractionLogActions.StartPayload>,
	interactionId: string,
	region: InteractionRegion,
	regionId: string
) => SagaGenerator<void>;

function takeInteractionStart(
	ms: number,
	pattern: (action: Action) => boolean,
	startSaga: InteractionSaga,
	appendSaga: InteractionSaga
) {
	return fork(function* () {
		while (true) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let action: any = yield* take(pattern);
			let implementSaga = startSaga;
			const interactionId = nanoid();
			const { region } = action.payload;
			const regionId: string | undefined = yield* call(getRegionId, region);

			if (!regionId) {
				log.error(`Could not find any regionId for region ${region}`);
				continue;
			}
			while (true) {
				yield* fork(implementSaga, action, interactionId, region, regionId);
				const { debounced, latestAction } = yield* race({
					debounced: delay(ms),
					latestAction: take(pattern),
				});
				if (debounced) {
					break;
				}
				implementSaga = appendSaga;
				action = latestAction;
			}
		}
	});
}

export function* startInteractionSaga(): SagaGenerator<void> {
	yield* takeInteractionStart(
		APPEND_INTERVAL,
		InteractionLogActions.start.match,
		handleStartInteractionSaga,
		handleAppendInteractionSaga
	);
}

function* handleStartInteractionSaga(
	action: PayloadAction<InteractionLogActions.StartPayload>,
	interactionId: string,
	region: InteractionRegion,
	regionId: string
): SagaGenerator<void> {
	const requestApi: RequestApi = yield* getContext("requestApi");
	const { transactionLogActions, description, preventUndo, affectedItems } = action.payload;
	if (transactionLogActions.length === 0) {
		return;
	}
	const logEntry: InteractionLogEntry = {
		timestamp: Date.now(),
		interactionId,
		affectedItems: affectedItems ?? [],
		description,
		type: "SET",
		preventUndo,
	};
	yield* put(
		InteractionLogActions.addLogEntry({
			region,
			regionId,
			logEntry,
		})
	);

	const header = yield* select(PrintEngineSelectors.printHeader);
	requestApi.persistInteractionLog(header.id, {
		...logEntry,
		region,
		regionId,
	});
	for (const tlAction of transactionLogActions) {
		yield* put({
			...tlAction,
			payload: { ...tlAction.payload, interactionId, region, regionId, affectedItems },
		});
	}
}

function* handleAppendInteractionSaga(
	action: PayloadAction<InteractionLogActions.StartPayload>,
	interactionId: string,
	region: InteractionRegion,
	regionId: string
): SagaGenerator<void> {
	const { transactionLogActions } = action.payload;
	if (transactionLogActions.length === 0) {
		return;
	}
	for (const tlAction of transactionLogActions) {
		yield* put({
			...tlAction,
			payload: { ...tlAction.payload, interactionId, region, regionId },
		});
	}
}

function* getRegionId(region: InteractionRegion) {
	const currentForm = yield* select(NavigationSelectors.currentForm);

	switch (region) {
		case ListingRegion.LISTING_COLUMN_FORM:
		case ListingRegion.FIELD_COMPUTATION_FORM:
		case ListingRegion.PROPERTY_COMPUTATION_FORM:
		case ListingRegion.GROUP_PROPERTY_COMPUTATION_FORM:
			return yield* call(getListingRegionIdSaga, region);
		case TableRegion.TABLE_COLUMN_FORM:
			return yield* call(getTableRegionIdSaga);
		case TextRegion.TEXT_FROM_FIELD:
		case TextRegion.TEXT_FROM_CALCULATION:
		case GlobalRegion.FORM:
			return currentForm && isBaseElementFormState(currentForm) ? currentForm.id : currentForm?.referenceId;
		case StageRegion.DEFAULT:
		case StageRegion.LAYOUT:
		case StageRegion.READING_ORDER:
			return yield* select(PrintEngineSelectors.currentCanvasEntityId);
		case StageRegion.SWITCH:
			return (yield* select(PrintEngineSelectors.currentWrapperContainer))?.id;
		case SidebarRegion.TEXT_STYLES:
			return yield* select(PrintEngineSelectors.selectedTextStyleId);
		default:
			return yield* select(NavigationSelectors.activeTab);
	}
}

function* getListingRegionIdSaga(region: InteractionRegion) {
	const currentForm = yield* select(NavigationSelectors.currentForm);

	assertExists(currentForm);

	if (region === ListingRegion.LISTING_COLUMN_FORM && currentForm && isListingColumnFormState(currentForm)) {
		return currentForm.columnId;
	}

	if (region === ListingRegion.FIELD_COMPUTATION_FORM && currentForm && isListingFieldCompFormState(currentForm)) {
		return currentForm.fieldCompId;
	}

	if (
		region === ListingRegion.PROPERTY_COMPUTATION_FORM &&
		currentForm &&
		isListingPropertyCompFormState(currentForm)
	) {
		return currentForm.propertyCompId;
	}

	if (
		region === ListingRegion.GROUP_PROPERTY_COMPUTATION_FORM &&
		currentForm &&
		isListingGroupPropertyCompFormState(currentForm)
	) {
		return currentForm.propertyCompId;
	}

	throw new Error("Listing region id does not exist");
}

function* getTableRegionIdSaga() {
	const columnForm = yield* select(state =>
		NavigationSelectors.formStateByType(state, TableRegion.TABLE_COLUMN_FORM)
	);

	if (columnForm && isTableColumnFormState(columnForm)) {
		return columnForm.columnId;
	}

	throw new Error("Table region id does not exist");
}

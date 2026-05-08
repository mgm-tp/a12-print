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
import { put, select } from "typed-redux-saga";
import { nanoid } from "nanoid";

import {
	PartialTransactionLogPersistentEntry,
	StoreEntryMapWithId,
	TransactionLog,
	TransactionLogStore,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/transaction-log.js";
import {
	AffectedItem,
	SidebarItem,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/interaction-log.js";
import {
	PartialSection,
	PartialSegment,
	PartialWatermark,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/partial.js";

import {
	AnyTransactionLogAction,
	TransactionLogStateActions,
	ValidAnyTransactionLogAction,
} from "../../../redux/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";

const REFERENCE_CONTAINER_ACTIONS = [TransactionLogStateActions.updateReferenceContainer];

export const ReferenceContainerTransactionLogHandler = {
	match: function (action: AnyTransactionLogAction) {
		return REFERENCE_CONTAINER_ACTIONS.some(elementAction => elementAction.match(action));
	},
	handle: handleReferenceContainerActions,
};

function* handleReferenceContainerActions({
	state,
	action,
	persistentEntries,
}: {
	state: TransactionLogStore;
	action: ValidAnyTransactionLogAction;
	persistentEntries: PartialTransactionLogPersistentEntry[];
}): SagaIterator<AffectedItem[]> {
	const { interactionId } = action.payload;

	const newAffectedItems: AffectedItem[] = [];

	if (TransactionLogStateActions.updateReferenceContainer.match(action)) {
		const printModelRefs = yield* select(PrintEngineSelectors.printModelRefs);

		const { entryKey, entryData, storeEntryFunction } = getReferenceContainerStore(
			state,
			printModelRefs.currentRefType
		);
		const updatedReferenceContainer = storeEntryFunction(entryData, action.payload.data, interactionId);
		persistentEntries.push(...updatedReferenceContainer.persistentEntries);
		newAffectedItems.push({ type: printModelRefs.currentRefType, id: updatedReferenceContainer.storeEntry.id });

		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				[entryKey]: {
					...entryData,
					map: {
						...entryData.map,
						[action.payload.data.id]: updatedReferenceContainer.storeEntry,
					},
				},
			})
		);

		return newAffectedItems;
	}
	return newAffectedItems;
}

function getReferenceContainerStore(
	state: TransactionLogStore,
	currentRefType: SidebarItem.SECTION | SidebarItem.SEGMENT | SidebarItem.WATERMARK
) {
	const containTypeAction: Record<
		SidebarItem.SEGMENT | SidebarItem.SECTION | SidebarItem.WATERMARK,
		Extract<keyof TransactionLogStore, "segments" | "sections" | "watermarks">
	> = {
		[SidebarItem.SEGMENT]: "segments",
		[SidebarItem.SECTION]: "sections",
		[SidebarItem.WATERMARK]: "watermarks",
	};

	const entryKey = containTypeAction[currentRefType];
	const entryData: StoreEntryMapWithId<PartialSegment | PartialSection | PartialWatermark> = state[entryKey] || {
		id: nanoid(),
		map: {},
	};

	let storeEntryFunction;

	if (SidebarItem.SEGMENT) {
		storeEntryFunction = TransactionLog.createStoreEntrySegment;
	} else if (SidebarItem.SECTION) {
		storeEntryFunction = TransactionLog.createStoreEntrySection;
	} else {
		storeEntryFunction = TransactionLog.createStoreEntryWatermark;
	}

	return { entryKey, entryData, storeEntryFunction };
}

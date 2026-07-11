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
import { call, put, select } from "typed-redux-saga";

import type {
	PartialTransactionLogPersistentEntry,
	StoreEntryMapWithId,
	TransactionLogStore,
	TransactionLogStoreEntry,
	AffectedItem,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type {
	PartialAnyPrintModelElement,
	PartialArea,
	PartialBoundingBox,
	PartialOverride,
	PartialSection,
	PartialSegment,
	PartialValidPlaceableReference,
	PartialWatermark,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	isPartialSection,
	isPartialSegment,
	isPartialWatermark,
	PartialSwitch,
} from "@com.mgmtp.a12.print/print-model-api/model";

import type { AnyTransactionLogAction, ValidAnyTransactionLogAction } from "../../../redux/index.js";
import { TransactionLogStateActions } from "../../../redux/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";
import { ElementsUtils } from "../../../utils/elements-utils.js";
import { createAffectedItemMeta } from "../../../utils/validation-relevant-path-utils.js";

import { createReferenceStore } from "./utils.js";

const ELEMENT_REFERENCE_ACTIONS = [
	TransactionLogStateActions.updateReferenceElements,
	TransactionLogStateActions.updateReferenceElement,
];

export const ElementReferenceTransactionLogHandler = {
	match: function (action: AnyTransactionLogAction) {
		return ELEMENT_REFERENCE_ACTIONS.some(elementAction => elementAction.match(action));
	},
	handle: handleElementReferenceActions,
};

function* handleElementReferenceActions({
	state,
	action,
	persistentEntries,
}: {
	state: TransactionLogStore;
	action: ValidAnyTransactionLogAction;
	persistentEntries: PartialTransactionLogPersistentEntry[];
}): SagaGenerator<AffectedItem[]> {
	const { interactionId } = action.payload;

	const newAffectedItems: AffectedItem[] = [];

	if (TransactionLogStateActions.updateReferenceElements.match(action)) {
		const { currentContainerElement, wrapperElement } = yield* call(getContainerElements);

		if (!currentContainerElement || (wrapperElement && PartialSwitch.isInstance(wrapperElement))) {
			return newAffectedItems;
		}

		const { newPersistentEntries } = yield* call(
			updateReferences,
			state,
			interactionId,
			wrapperElement ?? currentContainerElement,
			action.payload.data,
			newAffectedItems
		);
		persistentEntries.push(...newPersistentEntries);
		return newAffectedItems;
	}

	if (TransactionLogStateActions.updateReferenceElement.match(action)) {
		const { currentContainerElement, wrapperElement } = yield* call(getContainerElements);

		if (!currentContainerElement) {
			return newAffectedItems;
		}

		const elementReferences = wrapperElement
			? ElementsUtils.getElementReferences(wrapperElement)
			: currentContainerElement.elementReferences;

		const updatedElemntReferences = elementReferences
			? (elementReferences?.map(reference =>
					reference.refId === action.payload.data.refId ? action.payload.data : reference
				) as PartialValidPlaceableReference[])
			: [action.payload.data];

		const { newPersistentEntries } = yield* call(
			updateReferences,
			state,
			interactionId,
			wrapperElement ?? currentContainerElement,
			updatedElemntReferences,
			newAffectedItems
		);

		persistentEntries.push(...newPersistentEntries);
		return newAffectedItems;
	}

	return newAffectedItems;
}

type TopLevelContainer = PartialSegment | PartialSection | PartialWatermark;
type ElementContainer = PartialBoundingBox | PartialOverride | PartialArea;
type RenfereceContainer = TopLevelContainer | ElementContainer | PartialArea;

function* getContainerElements() {
	const currentContainerElement = yield* select(PrintEngineSelectors.currentContainerElement);
	const wrappers = yield* select(PrintEngineSelectors.wrappers);
	const wrapperElement = yield* select((state: PrintEngineState) =>
		PrintEngineSelectors.wrapperContainerElement(state, wrappers.at(-1)?.id)
	);

	return { currentContainerElement, wrapperElement };
}

/**
 * Mutates `affectedItems` by pushing the new entry.
 */
function* updateReferences(
	state: TransactionLogStore,
	interactionId: string,
	currentElementContainer: RenfereceContainer,
	elementReferences: readonly PartialValidPlaceableReference[],
	affectedItems: AffectedItem[]
) {
	const isTopLevelContainer =
		isPartialSegment(currentElementContainer) ||
		isPartialSection(currentElementContainer) ||
		isPartialWatermark(currentElementContainer);

	const { entryKey, affectKey, entryData, storeEntry } = createReferenceStore({
		state,
		currentElementContainer,
		elementReferences,
		interactionId,
	});

	const containerId = currentElementContainer.id;

	affectedItems.push({
		type: affectKey,
		id: storeEntry.storeEntry.id,
	});

	const updatedStore = isTopLevelContainer
		? {
				...state,
				[entryKey]: {
					...entryData,
					map: {
						...(entryData as StoreEntryMapWithId<TopLevelContainer>).map,
						[containerId]: storeEntry.storeEntry as TransactionLogStoreEntry<
							PartialSegment | PartialSection | PartialWatermark
						>,
					},
				},
			}
		: {
				...state,
				[entryKey]: {
					...entryData,
					[containerId]: storeEntry.storeEntry as TransactionLogStoreEntry<PartialAnyPrintModelElement>,
				},
			};

	yield* put(TransactionLogStateActions.setLogStore({ ...updatedStore, ...createAffectedItemMeta(affectedItems) }));

	return { newPersistentEntries: storeEntry.persistentEntries };
}

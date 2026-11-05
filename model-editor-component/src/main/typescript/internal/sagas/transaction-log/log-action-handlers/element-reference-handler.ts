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
import { nanoid } from "nanoid";

import type {
	PartialTransactionLogPersistentEntry,
	StoreEntryMapWithId,
	TransactionLogStore,
	TransactionLogStoreEntry,
	TransactionLogStoreEntryMap,
	AffectedItem,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { TransactionLog } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
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
	PartialAnyTopLevelContainerElement,
	PartialSwitch,
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	clonePrintModelElement,
	clonePrintModelEntity,
	CloneTreeTrace,
	collectUsedTextStyleIds,
	createFragmentElementGetter,
} from "@com.mgmtp.a12.print/print-model-api/utils";

import type { AnyTransactionLogAction, ValidAnyTransactionLogAction } from "../../../redux/index.js";
import { DetailViewActions, NavigationSelectors, TransactionLogStateActions } from "../../../redux/index.js";
import { isBaseElementFormState } from "../../../redux/navigation/types/form-state.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";
import { ElementsUtils } from "../../../utils/elements-utils.js";
import { createAffectedItemMeta } from "../../../utils/validation-relevant-path-utils.js";

import { clonePageBreakSourceInsideSectionAndWatermark } from "./model-element-action-handler.js";
import { appendTextStyleReferences, referenceFragmentTextStyles } from "./unlink-utils.js";
import { createReferenceStore } from "./utils.js";

const ELEMENT_REFERENCE_ACTIONS = [
	TransactionLogStateActions.updateReferenceElements,
	TransactionLogStateActions.updateReferenceElement,
	TransactionLogStateActions.unlinkElementReference,
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

		let elementReferences;
		if (wrapperElement) {
			elementReferences = ElementsUtils.getElementReferences(wrapperElement);
		} else if (PartialAnyTopLevelContainerElement.isInstance(currentContainerElement)) {
			elementReferences = currentContainerElement.elementReferences;
		} else {
			elementReferences = ElementsUtils.getElementReferences(currentContainerElement);
		}

		const updatedElementReferences = elementReferences
			? (elementReferences?.map(reference =>
					reference.id === action.payload.data.id ? action.payload.data : reference
				) as PartialValidPlaceableReference[])
			: [action.payload.data];

		const { newPersistentEntries } = yield* call(
			updateReferences,
			state,
			interactionId,
			wrapperElement ?? currentContainerElement,
			updatedElementReferences,
			newAffectedItems
		);

		persistentEntries.push(...newPersistentEntries);
		return newAffectedItems;
	}

	if (TransactionLogStateActions.unlinkElementReference.match(action)) {
		const { referenceId, fragmentContent } = action.payload.data;
		const { currentContainerElement, wrapperElement } = yield* call(getContainerElements);

		if (!currentContainerElement || (wrapperElement && PartialSwitch.isInstance(wrapperElement))) {
			return newAffectedItems;
		}

		let elementReferences;
		if (wrapperElement) {
			elementReferences = ElementsUtils.getElementReferences(wrapperElement);
		} else if (PartialAnyTopLevelContainerElement.isInstance(currentContainerElement)) {
			elementReferences = currentContainerElement.elementReferences;
		} else {
			elementReferences = ElementsUtils.getElementReferences(currentContainerElement);
		}

		const ref = elementReferences?.find(reference => reference.id === referenceId);
		if (!ref?.model) {
			return newAffectedItems;
		}

		const resolved = fragmentContent.elementDefinitions?.find(element => element.id === ref.refId);
		if (!resolved) {
			return newAffectedItems;
		}

		let hasUnresolved = false;
		const onUnresolved = () => {
			hasUnresolved = true;
		};

		const usedTextStyleIds = collectUsedTextStyleIds(resolved, fragmentContent);
		const { newReferences, newOrderIds, textStyleIdMap } = referenceFragmentTextStyles(
			state,
			fragmentContent,
			ref.model,
			usedTextStyleIds,
			onUnresolved
		);

		const newRootId = nanoid();
		const newRef = { ...ref, model: undefined, refId: newRootId } as PartialValidPlaceableReference;
		const elementIdMap = new Map([[resolved.id, newRootId]]);
		const isInsideSectionOrWatermark =
			isPartialSection(currentContainerElement) || isPartialWatermark(currentContainerElement);

		const [clonedRoot, ...clonedDescendants] = clonePrintModelElement(
			resolved as PartialAnyPrintModelElement,
			{
				cloneObject: clonePrintModelEntity,
				getElement: createFragmentElementGetter(fragmentContent),
				elementIdMap,
				textStyleIdMap,
				onUnresolved,
				clonePageBreakSource: isInsideSectionOrWatermark
					? clonePageBreakSourceInsideSectionAndWatermark
					: undefined,
			},
			new CloneTreeTrace([newRef])
		);

		if (hasUnresolved) {
			return newAffectedItems;
		}

		const localRoot: PartialAnyPrintModelElement = {
			...clonedRoot,
			id: newRootId,
			isFragment: undefined,
			fragmentDimensions: undefined,
		};

		const newElementReferences = (elementReferences ?? []).map(reference =>
			reference.id === referenceId ? newRef : reference
		) as PartialValidPlaceableReference[];

		const { updatedStore, persistentEntries: refPersistentEntries } = buildReferenceStoreUpdate(
			state,
			interactionId,
			wrapperElement ?? currentContainerElement,
			newElementReferences,
			newAffectedItems
		);

		const clonedElementsMap: TransactionLogStoreEntryMap<PartialAnyPrintModelElement> = {};
		[localRoot, ...clonedDescendants].forEach(element => {
			const createStoreEntry = TransactionLog.createStoreEntryPrintModelElement(
				state.printModelElements,
				element,
				interactionId
			);
			persistentEntries.push(...createStoreEntry.persistentEntries);
			newAffectedItems.push({ type: "printModelElement", id: createStoreEntry.storeEntry.id });
			clonedElementsMap[createStoreEntry.storeEntry.id] = createStoreEntry.storeEntry;
		});

		const textStyleRefsUpdate = appendTextStyleReferences(state, newReferences, interactionId);

		const contentGeneral = TransactionLog.selectPrintModelContentGeneral(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]);
		const updatedGeneral = TransactionLog.createStoreEntryPrintModelContentGeneral(
			state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
			{
				...contentGeneral,
				textStyles: [...(contentGeneral.textStyles ?? []), ...newOrderIds],
			},
			interactionId
		);

		persistentEntries.push(
			...refPersistentEntries,
			...textStyleRefsUpdate.persistentEntries,
			...updatedGeneral.persistentEntries
		);
		newAffectedItems.push(...textStyleRefsUpdate.affectedItems, {
			type: "printModelContentGeneral" as const,
			id: updatedGeneral.storeEntry.id,
		});

		// A wrapper container's own entry shares the `printModelElements` key with the newly cloned
		// elements (createReferenceStore's entryKey === "printModelElements" for wrappers) - both must
		// land in one merged object, not two separate assignments that would clobber each other.
		const mergedPrintModelElements = updatedStore.printModelElements
			? { ...updatedStore.printModelElements, ...clonedElementsMap }
			: { ...state.printModelElements, ...clonedElementsMap };

		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				...updatedStore,
				printModelElements: mergedPrintModelElements,
				textStyles: textStyleRefsUpdate.textStyles,
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: updatedGeneral.storeEntry,
				...createAffectedItemMeta(newAffectedItems),
			})
		);

		// The open form still shows the now unlinked fragment element read only - switch it to the editable copy.
		const openForm = yield* select(NavigationSelectors.firstForm);
		if (openForm && isBaseElementFormState(openForm) && openForm.id === ref.refId) {
			yield* put(DetailViewActions.openElementForm(newRootId));
		}

		return newAffectedItems;
	}

	return newAffectedItems;
}

type TopLevelContainer = PartialSegment | PartialSection | PartialWatermark;
type ElementContainer = PartialBoundingBox | PartialOverride | PartialArea;
type RenfereceContainer = TopLevelContainer | ElementContainer | PartialArea;

export function* getContainerElements() {
	const currentContainerElement = yield* select(PrintEngineSelectors.currentContainerElement);
	const wrappers = yield* select(PrintEngineSelectors.wrappers);
	const wrapperElement = yield* select((state: PrintEngineState) =>
		PrintEngineSelectors.wrapperContainerElement(state, wrappers.at(-1)?.id)
	);

	return { currentContainerElement, wrapperElement };
}

/**
 * Computes the store-shape update for a container's `elementReferences` write, without
 * dispatching. Mutates `affectedItems` by pushing the new entry. Pulled out of `updateReferences`
 * so the unlink branch can merge this update with newly cloned element definitions into a single
 * `setLogStore` dispatch instead of issuing two (the second of which would be computed from a
 * stale `state` and drop the first's data - see the wrapper-container note where both this
 * update's own `printModelElements` key and the cloned elements share that same key).
 */
function buildReferenceStoreUpdate(
	state: TransactionLogStore,
	interactionId: string,
	currentElementContainer: RenfereceContainer,
	elementReferences: readonly PartialValidPlaceableReference[],
	affectedItems: AffectedItem[]
): { updatedStore: Partial<TransactionLogStore>; persistentEntries: PartialTransactionLogPersistentEntry[] } {
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

	const updatedStore: Partial<TransactionLogStore> = isTopLevelContainer
		? {
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
				[entryKey]: {
					...entryData,
					[containerId]: storeEntry.storeEntry as TransactionLogStoreEntry<PartialAnyPrintModelElement>,
				},
			};

	return { updatedStore, persistentEntries: storeEntry.persistentEntries };
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
	const { updatedStore, persistentEntries } = buildReferenceStoreUpdate(
		state,
		interactionId,
		currentElementContainer,
		elementReferences,
		affectedItems
	);

	yield* put(
		TransactionLogStateActions.setLogStore({ ...state, ...updatedStore, ...createAffectedItemMeta(affectedItems) })
	);

	return { newPersistentEntries: persistentEntries };
}

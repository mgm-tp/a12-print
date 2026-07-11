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
import { put, select } from "typed-redux-saga";
import { nanoid } from "nanoid";

import type {
	PartialTransactionLogPersistentEntry,
	TransactionLogStore,
	TransactionLogStoreEntry,
	TransactionLogStoreEntryMap,
	AffectedItem,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { TransactionLog } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type {
	PartialAnyPrintModelElement,
	PartialArea,
	InputSource,
	PageBreakBehavior,
	PrintModelEntity,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	isPartialSection,
	isPartialValidPlaceableReference,
	isPartialWatermark,
	PartialSwitch,
} from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/utils";
import {
	clonePrintModelElement,
	clonePrintModelEntity,
	CloneTreeTrace,
} from "@com.mgmtp.a12.print/print-model-api/utils";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";

import {
	type AnyTransactionLogAction,
	NavigationSelectors,
	TransactionLogStateActions,
	type ValidAnyTransactionLogAction,
} from "../../../redux/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { createAffectedItemMeta } from "../../../utils/validation-relevant-path-utils.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";
import { changePartialMmMeasureValue } from "../../../utils/measure-utils.js";

import { createReferenceStore } from "./utils.js";

const MODEL_ELEMENTS_ACTIONS = [
	TransactionLogStateActions.updatePrintModelElements,
	TransactionLogStateActions.updateBoundingBox,
	TransactionLogStateActions.updateOverride,
	TransactionLogStateActions.updateArea,
	TransactionLogStateActions.updateSwitch,
	TransactionLogStateActions.copyPrintModelElements,
	TransactionLogStateActions.syncOverrides,
];

export const ModelElementTransactionLogHandler = {
	match: function (action: AnyTransactionLogAction) {
		return MODEL_ELEMENTS_ACTIONS.some(elementAction => elementAction.match(action));
	},
	handle: handleElementActions,
};

function* handleElementActions({
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

	if (TransactionLogStateActions.updatePrintModelElements.match(action)) {
		if (action.payload.data.length > 0) {
			const newPrintModelElements = createNewPrintModelElements(
				action.payload.data,
				state,
				persistentEntries,
				newAffectedItems,
				interactionId
			);

			yield* put(
				TransactionLogStateActions.setLogStore({
					...state,
					printModelElements: {
						...state.printModelElements,
						...newPrintModelElements,
					},
					...createAffectedItemMeta(newAffectedItems),
				})
			);
		}

		return newAffectedItems;
	}

	if (TransactionLogStateActions.updateBoundingBox.match(action)) {
		const currentContainerElement = yield* select(PrintEngineSelectors.currentContainerElement);
		const boundingBox = action.payload.data;
		if (boundingBox && boundingBox.id && currentContainerElement) {
			const entry = TransactionLog.createStoreEntryPrintModelElement(
				state.printModelElements,
				boundingBox,
				interactionId
			);
			yield* put(
				TransactionLogStateActions.setLogStore({
					...state,
					printModelElements: {
						...state.printModelElements,
						[boundingBox.id]: entry.storeEntry,
					},
				})
			);
			persistentEntries.push(...entry.persistentEntries);
			newAffectedItems.push({ type: "printModelElement", id: entry.storeEntry.id });
		}
		return newAffectedItems;
	}

	if (TransactionLogStateActions.updateOverride.match(action)) {
		const currentContainerElement = yield* select(PrintEngineSelectors.currentContainerElement);
		const overrideElement = action.payload.data;
		if (overrideElement && currentContainerElement) {
			const entry = TransactionLog.createStoreEntryPrintModelElement(
				state.printModelElements,
				overrideElement,
				interactionId
			);
			yield* put(
				TransactionLogStateActions.setLogStore({
					...state,
					printModelElements: {
						...state.printModelElements,
						[overrideElement.id]: entry.storeEntry,
					},
				})
			);
			persistentEntries.push(...entry.persistentEntries);
			newAffectedItems.push({ type: "printModelElement", id: entry.storeEntry.id });
		}
		return newAffectedItems;
	}

	if (TransactionLogStateActions.updateArea.match(action)) {
		const currentContainerElement = yield* select(PrintEngineSelectors.currentContainerElement);
		const areaElement = action.payload.data;
		if (areaElement?.id && currentContainerElement) {
			const entry = TransactionLog.createStoreEntryPrintModelElement(
				state.printModelElements,
				areaElement,
				interactionId
			);
			yield* put(
				TransactionLogStateActions.setLogStore({
					...state,
					printModelElements: {
						...state.printModelElements,
						[areaElement.id]: entry.storeEntry,
					},
				})
			);
			persistentEntries.push(...entry.persistentEntries);
			newAffectedItems.push({ type: "printModelElement", id: entry.storeEntry.id });
		}
		return newAffectedItems;
	}

	if (TransactionLogStateActions.updateSwitch.match(action)) {
		const currentContainerElement = yield* select(PrintEngineSelectors.currentContainerElement);
		const switchElement = action.payload.data;
		if (switchElement?.id && currentContainerElement) {
			const entry = TransactionLog.createStoreEntryPrintModelElement(
				state.printModelElements,
				switchElement,
				interactionId
			);
			const resUpdatedElements: Record<string, TransactionLogStoreEntry<PartialAnyPrintModelElement>> = {
				[switchElement.id]: entry.storeEntry,
			};
			persistentEntries.push(...entry.persistentEntries);
			newAffectedItems.push({ type: "printModelElement", id: entry.storeEntry.id });
			switchElement.switch?.cases?.forEach(({ refId }) => {
				const area = TransactionLog.selectPrintModelElement(
					state.printModelElements,
					refId || ""
				) as PartialArea;
				const updatedArea: PartialArea = {
					...area,
					area: {
						id: nanoid(),
						...area.area,
						dimensions: {
							id: nanoid(),
							...area.area?.dimensions,
							height: changePartialMmMeasureValue(
								switchElement.switch?.dimensions?.height?.value || 0,
								area.area?.dimensions?.height
							),
							width: changePartialMmMeasureValue(
								switchElement.switch?.dimensions?.width?.value || 0,
								area.area?.dimensions?.width
							),
						},
					},
				};
				const areaEntry = TransactionLog.createStoreEntryPrintModelElement(
					state.printModelElements,
					updatedArea,
					interactionId
				);
				resUpdatedElements[updatedArea.id] = areaEntry.storeEntry;
				persistentEntries.push(...areaEntry.persistentEntries);
				newAffectedItems.push({ type: "printModelElement", id: areaEntry.storeEntry.id });
			});
			yield* put(
				TransactionLogStateActions.setLogStore({
					...state,
					printModelElements: {
						...state.printModelElements,
						...resUpdatedElements,
					},
				})
			);
		}
		return newAffectedItems;
	}

	if (TransactionLogStateActions.copyPrintModelElements.match(action)) {
		const { copyElementIdsList, newReferenceElements, referenceIdMap } = action.payload.data;
		const currentContainerElement = yield* select(PrintEngineSelectors.currentContainerElement);
		const wrappers = yield* select(PrintEngineSelectors.wrappers);
		const wrapperElement = yield* select((state: PrintEngineState) =>
			PrintEngineSelectors.wrapperContainerElement(state, wrappers.at(-1)?.id)
		);

		if (!currentContainerElement || (wrapperElement && PartialSwitch.isInstance(wrapperElement))) {
			return newAffectedItems;
		}

		const isInsideSectionOrWatermark =
			isPartialSection(currentContainerElement) || isPartialWatermark(currentContainerElement);

		const printModelRefs = yield* select(NavigationSelectors.activeEntities);

		const { entryKey, entryData, storeEntry } = createReferenceStore({
			state,
			currentElementContainer: wrapperElement ?? currentContainerElement,
			elementReferences: newReferenceElements,
			interactionId,
		});

		persistentEntries.push(...storeEntry.persistentEntries);
		newAffectedItems.push({
			type: wrapperElement ? "printModelElement" : printModelRefs.currentRefType,
			id: storeEntry.storeEntry.id,
		});

		const newPrintModelElements = copyElementIdsList.reduce(
			(res: TransactionLogStoreEntryMap<PartialAnyPrintModelElement>, next) => {
				const elementToCopy = TransactionLog.selectPrintModelElement(state.printModelElements, next.copyId);

				const elementIdMap = referenceIdMap || new Map<string, string>();
				elementIdMap.set(next.copyId, next.newId);

				const placeableReference = newReferenceElements.find(ref => ref.refId === next.newId);
				const rootTreeTrace: CloneTreeTrace = new CloneTreeTrace(
					placeableReference ? [placeableReference] : []
				);

				const [copiedElement, ...copiedReferenceElements] = clonePrintModelElement(
					elementToCopy,
					{
						cloneObject: clonePrintModelEntity,
						getElement: function (elementId) {
							return TransactionLog.selectPrintModelElement(state.printModelElements, elementId);
						},
						elementIdMap,
						clonePageBreakSource: isInsideSectionOrWatermark
							? clonePageBreakSourceInsideSectionAndWatermark
							: undefined,
					},
					rootTreeTrace
				);

				const newElements = [
					{
						...copiedElement,
						id: next.newId,
					},
					...copiedReferenceElements,
				];

				newElements.forEach(newElement => {
					const createStoreEntry = TransactionLog.createStoreEntryPrintModelElement(
						state.printModelElements,
						newElement,
						interactionId
					);

					persistentEntries.push(...createStoreEntry.persistentEntries);
					newAffectedItems.push({ type: "printModelElement", id: createStoreEntry.storeEntry.id });
					res[newElement.id] = createStoreEntry.storeEntry;
				});

				return res;
			},
			{}
		);
		const containerId = wrapperElement ? wrapperElement.id : currentContainerElement.id;

		yield* put(
			TransactionLogStateActions.setLogStore(
				wrapperElement
					? {
							...state,
							[entryKey]: {
								...entryData,
								[containerId]: storeEntry.storeEntry,
								...newPrintModelElements,
							},
						}
					: {
							...state,
							[entryKey]: {
								...entryData,
								map: {
									...entryData.map,
									[containerId]: storeEntry.storeEntry,
								},
							},
							printModelElements: { ...state.printModelElements, ...newPrintModelElements },
						}
			)
		);

		return newAffectedItems;
	}

	if (TransactionLogStateActions.syncOverrides.match(action)) {
		const { updatedOverrides, newOverrides, deletedOverrides } = action.payload.data;

		const newPrintModelElements = createNewPrintModelElements(
			newOverrides,
			state,
			persistentEntries,
			newAffectedItems,
			interactionId
		);
		const printModelElements: TransactionLogStoreEntryMap<PartialAnyPrintModelElement> = {};

		Object.entries(state.printModelElements).forEach(([id, entry]) => {
			if (deletedOverrides.find(override => override.id === id)) {
				return;
			}
			printModelElements[id] = entry;
		});

		const updatedPrintModelElements = createNewPrintModelElements(
			updatedOverrides,
			state,
			persistentEntries,
			newAffectedItems,
			interactionId
		);

		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				printModelElements: {
					...state.printModelElements,
					...printModelElements,
					...updatedPrintModelElements,
					...newPrintModelElements,
				},
			})
		);
	}

	return newAffectedItems;
}

function createNewPrintModelElements(
	elements: PartialAnyPrintModelElement[],
	state: TransactionLogStore,
	persistentEntries: PartialTransactionLogPersistentEntry[],
	affectedItems: AffectedItem[],
	interactionId: string
) {
	return elements.reduce<{
		[id: string]: TransactionLogStoreEntry<PartialAnyPrintModelElement>;
	}>((res, pmElement) => {
		const createStoreEntry = TransactionLog.createStoreEntryPrintModelElement(
			state.printModelElements,
			pmElement,
			interactionId
		);
		persistentEntries.push(...createStoreEntry.persistentEntries);
		affectedItems.push({ type: "printModelElement", id: createStoreEntry.storeEntry.id });
		const entry = createStoreEntry.storeEntry;
		res[entry.id] = entry;
		return res;
	}, {});
}

function clonePageBreakSourceInsideSectionAndWatermark(
	pageBreakSource?: DeepPartialRecursive<InputSource<PageBreakBehavior>> & PrintModelEntity,
	elementIdMap?: Map<string, string>,
	trace?: CloneTreeTrace
): DeepPartialRecursive<InputSource<PageBreakBehavior>> & PrintModelEntity {
	const parentPlaceable = trace?.findParent(ref => isPartialValidPlaceableReference(ref));
	const newReference =
		parentPlaceable?.id ?? (pageBreakSource?.reference ? elementIdMap?.get(pageBreakSource?.reference) : undefined);

	if (!newReference) {
		throw new Error(
			"Could not get parent's placeable reference id from trace or get new reference id from context for reference"
		);
	}

	return {
		id: nanoid(),
		source: PossibleInputSource.INHERITED,
		path: pageBreakSource?.path,
		reference: newReference,
	};
}

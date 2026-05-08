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
import { nanoid } from "nanoid";
import { call, put } from "typed-redux-saga";

import { AffectedItem } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/interaction-log.js";
import { PRINT_MODEL_CONTENT_GENERAL_LOG_ID } from "@com.mgmtp.a12.print/print-model-api/lib/model/constant.js";
import {
	PartialTransactionLogPersistentEntry,
	SegmentsStoreEntryMapWithId,
	StoreEntryMapWithId,
	TransactionLog,
	TransactionLogStore,
	TransactionLogStoreEntry,
	TransactionLogStoreEntryMap,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/transaction-log.js";
import {
	PartialAnyPrintModelElement,
	PartialArea,
	PartialBoundingBox,
	PartialOverride,
	PartialPrintModelContentGeneral,
	PartialSection,
	PartialSegment,
	PartialSwitch,
	PartialWatermark,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/partial.js";
import { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";
import { PlaceableReference, PrintModelEntity } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { AnyTransactionLogAction, ConfirmationDialogType, TransactionLogStateActions } from "../../../redux/index.js";
import { openConfirmationDialogSaga } from "../../confirmation-dialog/open-confirmation-dialog-saga.js";
import { NewElementHeight } from "../../../components/hidden-height-context-wrapper/types.js";
import { changePartialMmMeasureValue } from "../../../utils/measure-utils.js";
import { ElementsUtils } from "../../../utils/elements-utils.js";
import { ValidAnyTransactionLogAction } from "../../../redux/transaction-log-state/actions.js";

const TEXTSTYLE_ACTIONS = [
	TransactionLogStateActions.addTextStyle,
	TransactionLogStateActions.updateTextStyle,
	TransactionLogStateActions.removeTextStyle,
	TransactionLogStateActions.moveTextStyle,
	TransactionLogStateActions.updateElementHeightsTextStyle,
];

export const TextstyleTransactionLogHandler = {
	match: function (action: AnyTransactionLogAction) {
		return TEXTSTYLE_ACTIONS.some(textstyleAction => textstyleAction.match(action));
	},
	handle: handleTextstyleActions,
};

function* handleTextstyleActions({
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

	if (TransactionLogStateActions.addTextStyle.match(action)) {
		const newTextStyleId = action.payload.data.id;
		const updatedTextStyle = TransactionLog.createStoreEntryTextStyle(
			state.textStyles,
			action.payload.data,
			interactionId
		);
		const updatedGeneral = addTextStyleToContentGeneral(
			state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
			newTextStyleId,
			interactionId
		);
		persistentEntries.push(...updatedTextStyle.persistentEntries, ...updatedGeneral.persistentEntries);
		newAffectedItems.push(
			{ type: "textStyle" as const, id: updatedTextStyle.storeEntry.id },
			{ type: "printModelContentGeneral" as const, id: updatedGeneral.storeEntry.id }
		);

		const newTextStyles = state.textStyles || { id: nanoid(), map: {} };
		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				textStyles: {
					...newTextStyles,
					map: {
						...newTextStyles.map,
						[newTextStyleId]: updatedTextStyle.storeEntry,
					},
				},
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: updatedGeneral.storeEntry,
			})
		);

		return newAffectedItems;
	}

	if (TransactionLogStateActions.updateTextStyle.match(action)) {
		const createStoreEntry = TransactionLog.createStoreEntryTextStyle(
			state.textStyles,
			action.payload.data,
			interactionId
		);
		persistentEntries.push(...createStoreEntry.persistentEntries);
		newAffectedItems.push({ type: "textStyle", id: createStoreEntry.storeEntry.id });

		const newTextStyles = state.textStyles || { id: nanoid(), map: {} };
		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				textStyles: {
					...newTextStyles,
					map: {
						...newTextStyles.map,
						[action.payload.data.id]: createStoreEntry.storeEntry,
					},
				},
			})
		);
	}

	if (TransactionLogStateActions.removeTextStyle.match(action)) {
		const isConfirmed = yield* call(openConfirmationDialogSaga, ConfirmationDialogType.DELETE);
		if (!isConfirmed) {
			return newAffectedItems;
		}

		const contentGeneral = TransactionLog.selectPrintModelContentGeneral(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]);
		const updatedContentGeneral = TransactionLog.createStoreEntryPrintModelContentGeneral(
			state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
			{
				...contentGeneral,
				textStyles: (contentGeneral.textStyles || []).filter(id => id !== action.payload.data.id),
			},
			interactionId
		);
		persistentEntries.push(...updatedContentGeneral.persistentEntries);
		newAffectedItems.push({ type: "printModelContentGeneral", id: updatedContentGeneral.storeEntry.id });

		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: updatedContentGeneral.storeEntry,
			})
		);
		return newAffectedItems;
	}

	if (TransactionLogStateActions.moveTextStyle.match(action)) {
		const contentGeneral = TransactionLog.selectPrintModelContentGeneral(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]);
		const textStyles = [...(contentGeneral.textStyles || [])];
		if (textStyles.length === 0) {
			return newAffectedItems;
		}

		const { currentIndex, targetIndex } = action.payload.data;
		[textStyles[currentIndex], textStyles[targetIndex]] = [textStyles[targetIndex], textStyles[currentIndex]];

		const updatedGeneral = TransactionLog.createStoreEntryPrintModelContentGeneral(
			state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
			{ ...contentGeneral, textStyles },
			interactionId
		);
		persistentEntries.push(...updatedGeneral.persistentEntries);
		newAffectedItems.push({ type: "printModelContentGeneral", id: updatedGeneral.storeEntry.id });

		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: updatedGeneral.storeEntry,
			})
		);
		return newAffectedItems;
	}

	if (TransactionLogStateActions.updateElementHeightsTextStyle.match(action)) {
		const { sectionsMap, segmentsMap, watermarksMap, wrapperMap } = action.payload.data;
		const newSections = updateElementHeightsMap(
			sectionsMap,
			state.sections || { id: nanoid(), map: {} },
			interactionId,
			persistentEntries,
			newAffectedItems,
			"section",
			TransactionLog.createStoreEntrySection
		);
		const newWatermarks = updateElementHeightsMap(
			watermarksMap,
			state.watermarks || { id: nanoid(), map: {} },
			interactionId,
			persistentEntries,
			newAffectedItems,
			"watermark",
			TransactionLog.createStoreEntryWatermark
		);
		const newSegments = updateElementHeightsMap(
			segmentsMap,
			state.segments,
			interactionId,
			persistentEntries,
			newAffectedItems,
			"segment",
			TransactionLog.createStoreEntrySegment
		);
		const newPrintModelElements = Object.entries(state.printModelElements).reduce<
			TransactionLogStoreEntryMap<PartialAnyPrintModelElement>
		>((res, [elementId, elementStoreEntry]) => {
			const memoizedObject = elementStoreEntry.memoizedObject;
			const newElementHeightList = wrapperMap[elementId];
			if (
				!newElementHeightList ||
				newElementHeightList.length === 0 ||
				!ElementsUtils.isWrapperElement(memoizedObject) ||
				PartialSwitch.isInstance(memoizedObject)
			) {
				return { ...res, [elementId]: elementStoreEntry };
			}

			const mapElRef = (elRef: DeepPartialRecursive<PlaceableReference> & PrintModelEntity) => {
				const changedEl = newElementHeightList.find(el => el.elId === elRef.refId);
				if (!changedEl) {
					return elRef;
				}
				return {
					...elRef,
					dimensions: {
						id: nanoid(),
						...elRef.dimensions,
						minHeight: changePartialMmMeasureValue(changedEl.newHeight, elRef.dimensions?.minHeight),
					},
				};
			};

			const currentElementContainer = updateContainerElementReferences(memoizedObject, mapElRef);

			const storeEntry = TransactionLog.createStoreEntryPrintModelElement(
				state.printModelElements,
				currentElementContainer,
				interactionId
			);
			persistentEntries.push(...storeEntry.persistentEntries);
			newAffectedItems.push({ type: "printModelElement", id: elementId });
			res[elementId] = storeEntry.storeEntry;
			return res;
		}, {});

		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				sections: newSections,
				watermarks: newWatermarks,
				segments: newSegments as SegmentsStoreEntryMapWithId<PartialSegment>,
				printModelElements: newPrintModelElements,
			})
		);
		return newAffectedItems;
	}

	return newAffectedItems;
}

function updateContainerElementReferences(
	elementContainer: PartialAnyPrintModelElement,
	mapElRef: (
		el: DeepPartialRecursive<PlaceableReference> & PrintModelEntity
	) => DeepPartialRecursive<PlaceableReference> & PrintModelEntity
): PartialAnyPrintModelElement {
	if (PartialBoundingBox.isInstance(elementContainer)) {
		return {
			...elementContainer,
			boundingBox: {
				...elementContainer.boundingBox,
				id: elementContainer.boundingBox?.id || nanoid(),
				elementReferences: elementContainer.boundingBox?.elementReferences?.map(mapElRef),
			},
		};
	}

	if (PartialArea.isInstance(elementContainer)) {
		return {
			...elementContainer,
			area: {
				...elementContainer.area,
				id: elementContainer.area?.id || nanoid(),
				elementReferences: elementContainer.area?.elementReferences?.map(mapElRef),
			},
		};
	}

	if (PartialOverride.isInstance(elementContainer)) {
		return {
			...elementContainer,
			override: {
				...elementContainer.override,
				id: elementContainer.override?.id || nanoid(),
				boundingBox: {
					...elementContainer.override?.boundingBox,
					id: elementContainer.override?.boundingBox?.id || nanoid(),
					elementReferences: elementContainer.override?.boundingBox?.elementReferences?.map(mapElRef),
				},
			},
		};
	}

	throw new Error("The element is not bounding box, area or override");
}

function addTextStyleToContentGeneral(
	rawContentGeneral: TransactionLogStoreEntry<PartialPrintModelContentGeneral>,
	textStyleId: string,
	interactionId: string
) {
	const contentGeneral = TransactionLog.selectPrintModelContentGeneral(rawContentGeneral);
	const newTextStyles = [...(contentGeneral.textStyles || []), textStyleId];

	return TransactionLog.createStoreEntryPrintModelContentGeneral(
		rawContentGeneral,
		{
			...contentGeneral,
			textStyles: newTextStyles,
		},
		interactionId
	);
}

function updateElementHeightsMap<T extends PartialSection | PartialSegment | PartialWatermark>(
	map: Record<string, NewElementHeight[]>,
	storeEntryMap: StoreEntryMapWithId<T>,
	interactionId: string,
	persistentEntries: PartialTransactionLogPersistentEntry[],
	affectedItems: AffectedItem[],
	type: "section" | "segment" | "watermark",
	createStoreEntryFn:
		| typeof TransactionLog.createStoreEntrySection
		| typeof TransactionLog.createStoreEntrySegment
		| typeof TransactionLog.createStoreEntryWatermark
) {
	return Object.entries(storeEntryMap.map).reduce<StoreEntryMapWithId>(
		(res, [containerId, containerStoreEntry]) => {
			const memoizedObject = containerStoreEntry.memoizedObject;
			const newElementHeightList = map[containerId];
			if (!newElementHeightList || newElementHeightList.length === 0) {
				return { ...res, map: { ...res.map, [containerId]: containerStoreEntry } };
			}
			const storeEntry = createStoreEntryFn(
				storeEntryMap,
				{
					...memoizedObject,
					elementReferences: memoizedObject.elementReferences?.map(elRef => {
						const changedEl = newElementHeightList.find(el => el.elId === elRef.refId);
						if (!changedEl) {
							return elRef;
						}
						return {
							...elRef,
							dimensions: {
								id: nanoid(),
								...elRef.dimensions,
								minHeight: changePartialMmMeasureValue(
									changedEl.newHeight,
									elRef.dimensions?.minHeight
								),
							},
						};
					}),
				},
				interactionId
			);
			persistentEntries.push(...storeEntry.persistentEntries);
			affectedItems.push({ type, id: containerId });
			res.map[containerId] = storeEntry.storeEntry;
			return res;
		},
		{ ...storeEntryMap, map: {} }
	);
}

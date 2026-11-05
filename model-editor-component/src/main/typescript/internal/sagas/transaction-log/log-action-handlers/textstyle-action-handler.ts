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

import {
	TEXT_STYLES_REFERENCES_ENTRY_ID,
	TransactionLog,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type {
	AffectedItem,
	PartialTransactionLogPersistentEntry,
	SegmentsStoreEntryMapWithId,
	StoreEntryMapWithId,
	TransactionLogStore,
	TransactionLogStoreEntry,
	TransactionLogStoreEntryMap,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type {
	FragmentModelReference,
	PartialAnyPrintModelElement,
	PartialPrintModelContentGeneral,
	PartialSection,
	PartialSegment,
	PartialTextStyle,
	PartialWatermark,
	PlaceableReference,
	PrintModelEntity,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	PartialArea,
	PartialBoundingBox,
	PartialOverride,
	PartialSwitch,
} from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/utils";

import type { AnyTransactionLogAction } from "../../../redux/index.js";
import { ConfirmationDialogType, TransactionLogStateActions } from "../../../redux/index.js";
import { openConfirmationDialogSaga } from "../../confirmation-dialog/open-confirmation-dialog-saga.js";
import type { NewElementHeight } from "../../../components/hidden-height-context-wrapper/types.js";
import { changeMmMeasureValue, changePartialMmMeasureValue } from "../../../utils/measure-utils.js";
import { ElementsUtils } from "../../../utils/elements-utils.js";
import type { ValidAnyTransactionLogAction } from "../../../redux/transaction-log-state/actions.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";
import { FragmentUsageSelectors } from "../../../redux/fragment-usage/selectors.js";

import { replaceIdInPlace } from "./unlink-utils.js";

const TEXTSTYLE_ACTIONS = [
	TransactionLogStateActions.addTextStyleReference,
	TransactionLogStateActions.removeTextStyleReference,
	TransactionLogStateActions.addTextStyle,
	TransactionLogStateActions.updateTextStyle,
	TransactionLogStateActions.removeTextStyle,
	TransactionLogStateActions.moveTextStyle,
	TransactionLogStateActions.updateElementHeightsTextStyle,
	TransactionLogStateActions.unlinkTextStyleReference,
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
}): SagaGenerator<AffectedItem[]> {
	const { interactionId } = action.payload;

	const newAffectedItems: AffectedItem[] = [];

	if (TransactionLogStateActions.addTextStyleReference.match(action)) {
		const reference = action.payload.data;
		const existingRefs = TransactionLog.selectTextStyleReferences(state.textStyles?.referencesEntry);
		const newRefs = [...existingRefs.filter(r => r.id !== reference.id), reference];
		const contentGeneral = TransactionLog.selectPrintModelContentGeneral(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]);
		const newTextStylesOrder = [
			...(contentGeneral.textStyles || []).filter(id => id !== reference.id),
			reference.id,
		];
		yield* call(
			updateTextStyleReferences,
			state,
			newRefs,
			newTextStylesOrder,
			interactionId,
			persistentEntries,
			newAffectedItems
		);
		return newAffectedItems;
	}

	if (TransactionLogStateActions.removeTextStyleReference.match(action)) {
		const { id } = action.payload.data;
		const existingRefs = TransactionLog.selectTextStyleReferences(state.textStyles?.referencesEntry);
		const newRefs = existingRefs.filter(r => r.id !== id);
		const contentGeneral = TransactionLog.selectPrintModelContentGeneral(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]);
		const newTextStylesOrder = (contentGeneral.textStyles || []).filter(textStyleId => textStyleId !== id);
		yield* call(
			updateTextStyleReferences,
			state,
			newRefs,
			newTextStylesOrder,
			interactionId,
			persistentEntries,
			newAffectedItems
		);
		return newAffectedItems;
	}

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
		const usageMapLoading = yield* select(FragmentUsageSelectors.isUsageMapLoading);
		const usages = yield* select((printEngineState: PrintEngineState) =>
			FragmentUsageSelectors.usageForEntity(printEngineState, action.payload.data.id)
		);
		if (usageMapLoading || usages.length > 0) {
			yield* call(openConfirmationDialogSaga, ConfirmationDialogType.FRAGMENT_IN_USE, { usages });
			return newAffectedItems;
		}

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
		const { sectionsMap, segmentsMap, watermarksMap, wrapperMap, fragmentsMap } = action.payload.data;
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
			state.segments!,
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
				newElementHeightList?.length &&
				ElementsUtils.isWrapperElement(memoizedObject) &&
				!PartialSwitch.isInstance(memoizedObject)
			) {
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
				return { ...res, [elementId]: storeEntry.storeEntry };
			}

			// standalone isFragment root elements own their dimensions directly (fragmentDimensions) instead of
			// holding placed child references, so their height fix-up updates the element itself, not a child ref.
			const newFragmentHeight = fragmentsMap[elementId]?.[0]?.newHeight;
			if (newFragmentHeight !== undefined && memoizedObject.fragmentDimensions) {
				const storeEntry = TransactionLog.createStoreEntryPrintModelElement(
					state.printModelElements,
					{
						...memoizedObject,
						fragmentDimensions: {
							...memoizedObject.fragmentDimensions,
							height: changeMmMeasureValue(newFragmentHeight, memoizedObject.fragmentDimensions.height),
						},
					},
					interactionId
				);
				persistentEntries.push(...storeEntry.persistentEntries);
				newAffectedItems.push({ type: "printModelElement", id: elementId });
				return { ...res, [elementId]: storeEntry.storeEntry };
			}

			return { ...res, [elementId]: elementStoreEntry };
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

	if (TransactionLogStateActions.unlinkTextStyleReference.match(action)) {
		const { referenceId, fragmentContent } = action.payload.data;
		const ref = TransactionLog.selectTextStyleReferences(state.textStyles?.referencesEntry).find(
			r => r.id === referenceId
		);
		if (!ref) {
			return newAffectedItems;
		}

		const fragmentDefinition = fragmentContent.textStyles?.definitions?.find(
			textStyle => textStyle.id === ref.refId
		);
		if (!fragmentDefinition) {
			return newAffectedItems;
		}

		const localId = nanoid();
		const clonedTextStyle: PartialTextStyle = { ...fragmentDefinition, id: localId };

		const updatedTextStyle = TransactionLog.createStoreEntryTextStyle(
			state.textStyles,
			clonedTextStyle,
			interactionId
		);

		const existingTextStyleRefs = TransactionLog.selectTextStyleReferences(state.textStyles?.referencesEntry);
		const updatedTextStyleRefsEntry = TransactionLog.createStoreEntryTextStyleReferences(
			state.textStyles?.referencesEntry,
			{
				id: TEXT_STYLES_REFERENCES_ENTRY_ID,
				references: existingTextStyleRefs.filter(r => r.id !== referenceId),
			},
			interactionId
		);

		const contentGeneral = TransactionLog.selectPrintModelContentGeneral(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]);
		const updatedGeneral = TransactionLog.createStoreEntryPrintModelContentGeneral(
			state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
			{
				...contentGeneral,
				textStyles: replaceIdInPlace(contentGeneral.textStyles, referenceId, localId),
			},
			interactionId
		);

		persistentEntries.push(
			...updatedTextStyle.persistentEntries,
			...updatedTextStyleRefsEntry.persistentEntries,
			...updatedGeneral.persistentEntries
		);
		newAffectedItems.push(
			{ type: "textStyle" as const, id: updatedTextStyle.storeEntry.id },
			{ type: "textStyleReferences" as const, id: updatedTextStyleRefsEntry.storeEntry.id },
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
						[localId]: updatedTextStyle.storeEntry,
					},
					referencesEntry: updatedTextStyleRefsEntry.storeEntry,
				},
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: updatedGeneral.storeEntry,
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

function* updateTextStyleReferences(
	state: TransactionLogStore,
	newRefs: FragmentModelReference[],
	newTextStylesOrder: ReadonlyArray<string>,
	interactionId: string,
	persistentEntries: PartialTransactionLogPersistentEntry[],
	newAffectedItems: AffectedItem[]
): SagaGenerator<void> {
	const updatedRefsEntry = TransactionLog.createStoreEntryTextStyleReferences(
		state.textStyles?.referencesEntry,
		{ id: TEXT_STYLES_REFERENCES_ENTRY_ID, references: newRefs },
		interactionId
	);
	const contentGeneral = TransactionLog.selectPrintModelContentGeneral(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]);
	const updatedGeneral = TransactionLog.createStoreEntryPrintModelContentGeneral(
		state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
		{ ...contentGeneral, textStyles: newTextStylesOrder },
		interactionId
	);
	persistentEntries.push(...updatedRefsEntry.persistentEntries, ...updatedGeneral.persistentEntries);
	newAffectedItems.push(
		{ type: "textStyleReferences" as const, id: updatedRefsEntry.storeEntry.id },
		{ type: "printModelContentGeneral" as const, id: updatedGeneral.storeEntry.id }
	);
	const newTextStyles = state.textStyles || { id: nanoid(), map: {} };
	yield* put(
		TransactionLogStateActions.setLogStore({
			...state,
			[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: updatedGeneral.storeEntry,
			textStyles: {
				...newTextStyles,
				referencesEntry: updatedRefsEntry.storeEntry,
			},
		})
	);
}

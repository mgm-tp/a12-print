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
import { call, put, select } from "typed-redux-saga";
import { nanoid } from "nanoid";

import {
	PartialTransactionLogPersistentEntry,
	SegmentsStoreEntryMapWithId,
	TransactionLog,
	TransactionLogStore,
	TransactionLogStoreEntry,
	TransactionLogStoreEntryMap,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/transaction-log.js";
import { AffectedItem } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/interaction-log.js";
import { cloneSegment } from "@com.mgmtp.a12.print/print-model-api/lib/utils/print-model/segment.js";
import {
	PartialAnyPrintModelElement,
	PartialOverride,
	PartialPrintModelContentGeneral,
	PartialSegment,
	PartialSegmentReference,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/partial.js";
import { PRINT_MODEL_CONTENT_GENERAL_LOG_ID } from "@com.mgmtp.a12.print/print-model-api/lib/model/constant.js";
import { clonePrintModelEntity } from "@com.mgmtp.a12.print/print-model-api/lib/utils/print-model/base.js";
import { Segment } from "@com.mgmtp.a12.print/print-model-api/lib/model/print-model.js";
import { PlaceableReference } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { openConfirmationDialogSaga } from "../../confirmation-dialog/open-confirmation-dialog-saga.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import {
	AnyTransactionLogAction,
	ConfirmationDialogType,
	EditorStateActions,
	TransactionLogStateActions,
	ValidAnyTransactionLogAction,
} from "../../../redux/index.js";
import { PrintEngineState } from "../../../store/root-reducer.js";
import { RequestApiSelectors } from "../../../redux/request-api/selectors.js";
import { getBoundingOverrideElements } from "../../../utils/din-template-utils.js";

const SEGMENT_ACTIONS = [
	TransactionLogStateActions.addSegment,
	TransactionLogStateActions.removeSegment,
	TransactionLogStateActions.duplicateSegment,
	TransactionLogStateActions.updateSegment,
	TransactionLogStateActions.updateSegments,
	TransactionLogStateActions.addSegmentReference,
	TransactionLogStateActions.addReferenceSegment,
];

export const SegmentTransactionLogHandler = {
	match: function (action: AnyTransactionLogAction) {
		return SEGMENT_ACTIONS.some(segmentAction => segmentAction.match(action));
	},
	handle: handleSegmentActions,
};

function* handleSegmentActions({
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

	if (TransactionLogStateActions.addSegment.match(action)) {
		const updatedSegment = TransactionLog.createStoreEntrySegment(
			state.segments,
			action.payload.data,
			interactionId
		);
		const updatedGeneral = addStructure(
			state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
			action.payload.data.id,
			interactionId
		);
		persistentEntries.push(...updatedSegment.persistentEntries, ...updatedGeneral.persistentEntries);
		newAffectedItems.push(
			{ type: "segment" as const, id: updatedSegment.storeEntry.id },
			{ type: "printModelContentGeneral" as const, id: updatedGeneral.storeEntry.id }
		);
		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				segments: {
					...state.segments,
					map: {
						...state.segments.map,
						[action.payload.data.id]: updatedSegment.storeEntry,
					},
				},
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: updatedGeneral.storeEntry,
			})
		);

		return newAffectedItems;
	}

	if (TransactionLogStateActions.removeSegment.match(action)) {
		const isConfirmed = yield* call(openConfirmationDialogSaga, ConfirmationDialogType.DELETE);
		if (!isConfirmed) {
			return newAffectedItems;
		}

		const printModelRefs = yield* select(PrintEngineSelectors.printModelRefs);

		const segmentId = action.payload.data.id;
		const contentGeneral = TransactionLog.selectPrintModelContentGeneral(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]);
		const updatedContentGeneral = TransactionLog.createStoreEntryPrintModelContentGeneral(
			state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
			{
				...contentGeneral,
				structure: (contentGeneral.structure || []).filter(id => id !== segmentId),
			},
			interactionId
		);
		persistentEntries.push(...updatedContentGeneral.persistentEntries);
		newAffectedItems.push({ type: "printModelContentGeneral", id: updatedContentGeneral.storeEntry.id });

		const updatedSegmentReferences = removeSegmentReferenceRef(
			state.segments,
			contentGeneral,
			segmentId,
			interactionId
		);
		if (updatedSegmentReferences) {
			persistentEntries.push(...updatedSegmentReferences.persistentEntries);
			newAffectedItems.push({ type: "segmentReference", id: updatedSegmentReferences.storeEntry.id });
		}

		const currentSegmentId = printModelRefs?.segmentId;
		if (currentSegmentId === action.payload.data.id) {
			yield* put(
				EditorStateActions.updatePrintModelRefs({
					...printModelRefs,
					segmentId: "",
				})
			);
		}
		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: updatedContentGeneral.storeEntry,
				segments: {
					...state.segments,
					references: updatedSegmentReferences
						? {
								...state.segments.references,
								[updatedSegmentReferences.storeEntry.id]: updatedSegmentReferences.storeEntry,
							}
						: state.segments.references,
				},
			})
		);

		return newAffectedItems;
	}

	if (TransactionLogStateActions.duplicateSegment.match(action)) {
		const { clonedSegment, clonedSegmentElements } = cloneSegment(action.payload.data, {
			cloneObject: clonePrintModelEntity,
			getElement: function (elementId) {
				return TransactionLog.selectPrintModelElement(state.printModelElements, elementId);
			},
			elementIdMap: new Map(),
		});

		const newSegment: PartialSegment = {
			...clonedSegment,
			dinTemplate: action.payload.data.dinTemplate
				? {
						...action.payload.data.dinTemplate,
						id: nanoid(),
					}
				: undefined,
		};

		const creatStoreElementEntries = clonedSegmentElements.map(element => {
			return TransactionLog.createStoreEntryPrintModelElement(state.printModelElements, element, interactionId);
		});
		const clonePersistentEntries = creatStoreElementEntries.map(entry => entry.persistentEntries);
		const cloneStoreEntries = creatStoreElementEntries.map(entry => entry.storeEntry);
		const updatedSegment = TransactionLog.createStoreEntrySegment(state.segments, newSegment, interactionId);
		const updatedGeneral = addStructure(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID], newSegment.id, interactionId);

		persistentEntries.push(
			...updatedSegment.persistentEntries,
			...updatedGeneral.persistentEntries,
			...clonePersistentEntries.flat()
		);
		newAffectedItems.push(
			{ type: "segment" as const, id: updatedSegment.storeEntry.id },
			{ type: "printModelContentGeneral" as const, id: updatedGeneral.storeEntry.id },
			...cloneStoreEntries.map(storeEntry => ({
				type: "printModelElement" as const,
				id: storeEntry.id,
			}))
		);
		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				segments: {
					...state.segments,
					map: {
						...state.segments.map,
						[updatedSegment.storeEntry.id]: updatedSegment.storeEntry,
					},
				},
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: updatedGeneral.storeEntry,
				printModelElements: {
					...state.printModelElements,
					...cloneStoreEntries.reduce(
						(newStoredEntries: TransactionLogStoreEntryMap<PartialAnyPrintModelElement>, storeEntry) => {
							newStoredEntries[storeEntry.id] = storeEntry;
							return newStoredEntries;
						},
						{}
					),
				},
			})
		);

		return newAffectedItems;
	}

	if (TransactionLogStateActions.updateSegment.match(action)) {
		const createStoreEntry = TransactionLog.createStoreEntrySegment(
			state.segments,
			action.payload.data,
			interactionId
		);
		persistentEntries.push(...createStoreEntry.persistentEntries);
		newAffectedItems.push({ type: "segment", id: createStoreEntry.storeEntry.id });
		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				segments: {
					...state.segments,
					map: {
						...state.segments.map,
						[action.payload.data.id]: createStoreEntry.storeEntry,
					},
				},
			})
		);
		return newAffectedItems;
	}

	if (TransactionLogStateActions.updateSegments.match(action)) {
		const newSegments: Record<string, TransactionLogStoreEntry<PartialSegment>> = {};
		action.payload.data.forEach(segment => {
			const createdStoreEntry = TransactionLog.createStoreEntrySegment(state.segments, segment, interactionId);
			newSegments[segment.id] = createdStoreEntry.storeEntry;
			persistentEntries.push(...createdStoreEntry.persistentEntries);
			newAffectedItems.push({ type: "segment", id: createdStoreEntry.storeEntry.id });
		});
		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				segments: {
					...state.segments,
					map: {
						...state.segments.map,
						...newSegments,
					},
				},
			})
		);
		return newAffectedItems;
	}

	if (TransactionLogStateActions.addSegmentReference.match(action)) {
		const createStoreEntry = TransactionLog.createStoreEntrySegmentReference(
			state.segments.references,
			action.payload.data,
			interactionId
		);
		persistentEntries.push(...createStoreEntry.persistentEntries);
		newAffectedItems.push({ type: "segmentReference", id: createStoreEntry.storeEntry.id });
		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				segments: {
					...state.segments,
					references: {
						...state.segments.references,
						[action.payload.data.id]: createStoreEntry.storeEntry,
					},
				},
			})
		);
		return newAffectedItems;
	}

	if (TransactionLogStateActions.addReferenceSegment.match(action)) {
		const { segment, dinTemplateSegmentItem } = action.payload.data;
		const { printModelId, segmentId } = dinTemplateSegmentItem;
		const segmentReference = yield* select((state: PrintEngineState) =>
			PrintEngineSelectors.segmentReferenceByPrintModelId(state, printModelId)
		);
		if (!segmentReference) {
			throw new Error(`Segment reference of printModel: ${printModelId} does not exists`);
		}
		const segmentReferenceWithRefId = createSegmentReference(segmentReference, segmentId);
		const referenceElementId = segmentReferenceWithRefId.id;

		const elementReferences = yield* select((state: PrintEngineState) =>
			RequestApiSelectors.elementReferences(state, printModelId, segmentId)
		);
		const overrideElements: PartialOverride[] = yield* call(
			getBoundingOverrideElements,
			segment.id,
			dinTemplateSegmentItem,
			referenceElementId,
			true
		);
		const newPrintModelElements = createNewPrintModelElements(
			overrideElements as PartialAnyPrintModelElement[],
			state,
			persistentEntries,
			newAffectedItems,
			interactionId
		);
		const referenceSegment = createReferenceSegment(
			action.payload.data.segment,
			segmentId,
			getElementReference(overrideElements, elementReferences.slice()),
			referenceElementId
		);

		const updatedSegment = TransactionLog.createStoreEntrySegment(state.segments, referenceSegment, interactionId);
		const updatedGeneral = addStructure(
			state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
			referenceSegment.id,
			interactionId
		);
		const updatedSegmentReference = TransactionLog.createStoreEntrySegmentReference(
			state.segments.references,
			segmentReferenceWithRefId,
			interactionId
		);

		persistentEntries.push(
			...updatedSegment.persistentEntries,
			...updatedGeneral.persistentEntries,
			...updatedSegmentReference.persistentEntries
		);
		newAffectedItems.push(
			{ type: "segment" as const, id: updatedSegment.storeEntry.id },
			{ type: "printModelContentGeneral" as const, id: updatedGeneral.storeEntry.id },
			{ type: "segmentReference" as const, id: updatedSegmentReference.storeEntry.id }
		);
		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				segments: {
					...state.segments,
					map: {
						...state.segments.map,
						[referenceSegment.id]: updatedSegment.storeEntry,
					},
					references: {
						...state.segments.references,
						[segmentReferenceWithRefId.id]: updatedSegmentReference.storeEntry,
					},
				},
				printModelElements: {
					...state.printModelElements,
					...newPrintModelElements,
				},
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: updatedGeneral.storeEntry,
			})
		);
		return newAffectedItems;
	}
	return newAffectedItems;
}

function addStructure(
	rawContentGeneral: TransactionLogStoreEntry<PartialPrintModelContentGeneral>,
	addedSegmentId: string,
	interactionId: string
) {
	const contentGeneral = TransactionLog.selectPrintModelContentGeneral(rawContentGeneral);
	const newStructure = [...(contentGeneral.structure || []), addedSegmentId];

	return TransactionLog.createStoreEntryPrintModelContentGeneral(
		rawContentGeneral,
		{
			...contentGeneral,
			structure: newStructure,
		},
		interactionId
	);
}

function removeSegmentReferenceRef(
	rawSegments: SegmentsStoreEntryMapWithId<PartialSegment>,
	contentGeneral: PartialPrintModelContentGeneral,
	segmentId: string,
	interactionId: string
) {
	const segment = TransactionLog.selectSegment(rawSegments.map, segmentId);
	if (!segment.dinTemplate?.referenceId || !segment.dinTemplate.refId) {
		return;
	}
	const filterOutSegmentIds = new Set([segment.id, ...(contentGeneral.structure || [])]);
	const segmentsByDINTemplateRefId = TransactionLog.selectSegmentsByDINTemplateRefId(
		rawSegments.map,
		segment.dinTemplate.refId
	).filter(currentSegment => filterOutSegmentIds.has(currentSegment.id));
	if (segmentsByDINTemplateRefId.length > 0) {
		return;
	}
	const segmentReference = TransactionLog.selectSegmentReference(
		rawSegments.references,
		segment.dinTemplate.referenceId
	);
	return TransactionLog.createStoreEntrySegmentReference(
		rawSegments.references,
		{
			...segmentReference,
			refIds: (segmentReference.refIds || []).filter(({ refId }) => refId !== segment.dinTemplate?.refId),
		},
		interactionId
	);
}

function createSegmentReference(segmentReference: PartialSegmentReference, segmentId: string): PartialSegmentReference {
	const segmentReferenceRefIds = (segmentReference.refIds || []).slice();
	const refsBySegmentId = segmentReferenceRefIds.filter(ref => ref.refId === segmentId);
	return refsBySegmentId.length === 0
		? {
				...segmentReference,
				refIds: [...segmentReferenceRefIds, { id: nanoid(), refId: segmentId }],
			}
		: segmentReference;
}

function createReferenceSegment(
	segment: Segment | PartialSegment,
	segmentId: string,
	elementReferences: PlaceableReference[],
	referenceElementId: string = ""
): Segment | PartialSegment {
	return {
		...segment,
		dinTemplate: {
			id: nanoid(),
			referenceId: referenceElementId,
			refId: segmentId,
		},
		elementReferences,
	};
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

function getElementReference(
	overrideElements: PartialOverride[],
	elementReferences: PlaceableReference[]
): PlaceableReference[] {
	return elementReferences.map(
		ref =>
			({
				...ref,
				id: nanoid(),
				refId: overrideElements.find(element => element.override?.refId === ref.refId)?.id,
			}) as PlaceableReference
	);
}

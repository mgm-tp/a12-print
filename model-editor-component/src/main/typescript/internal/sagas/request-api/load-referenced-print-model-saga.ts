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
import { call, getContext, put, select, takeEvery } from "typed-redux-saga";
import { nanoid } from "nanoid";
import type { PayloadAction } from "@reduxjs/toolkit";

import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";
import type {
	PartialPlaceableReference,
	PartialSegment,
	PartialSegmentReference,
	PrintModel,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	ElementType,
	OverrideType,
	PartialBoundingBox,
	PartialOverride,
	ReferenceType,
	SourceType,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { clonePrintModelEntity } from "@com.mgmtp.a12.print/print-model-api/utils";

import type { RequestApi } from "../../api/index.js";
import { InteractionLogActions, RequestApiActions, TransactionLogStateActions } from "../../redux/index.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { RESOURCE_KEYS } from "../../../internal/localization/index.js";

const log = LoggerFactory.getLogger("loadReferencedPrintModelSaga");

// Interfaces

interface TemplateStructureElementReference {
	boundingBox: PartialBoundingBox;
	placeable: PartialPlaceableReference;
	elementReferences: Map<string, TemplateStructureElementReference>;
}

interface TemplateStructure {
	segmentId: string;
	elementReferences: Map<string, TemplateStructureElementReference>;
}

interface ElementReferencesUpdateResult<T> {
	updated: T;
	deletedOverrides: PartialOverride[];
	isUpdated: boolean;
}

// Main Saga

export function* loadReferencedPrintModelSaga(): SagaGenerator<void> {
	yield* takeEvery(RequestApiActions.loadReferencedPrintModel.match, handleLoadReferencedPrintModelSaga);
}

function* handleLoadReferencedPrintModelSaga(action: PayloadAction<string>): SagaGenerator<void> {
	const id = action.payload;
	const printModel: PrintModel | undefined = yield* call(getPrintModel, id);
	if (printModel) {
		yield* put(RequestApiActions.setPrintModelData({ id, printModel }));
		yield* call(loadPlaceableReferences, printModel);
	} else {
		log.error(`No print model data with id ${id} loaded`);
	}
}

function* getPrintModel(id: string): SagaGenerator<PrintModel | undefined> {
	const requestApi: RequestApi = yield* getContext("requestApi");
	const printModel = yield* call(requestApi.loadPrintModel, id);
	return printModel?.printModel;
}

function* loadPlaceableReferences(printModel: PrintModel) {
	const referenceSegments = yield* select(PrintEngineSelectors.referenceSegments);
	const segmentReference = yield* select((state: PrintEngineState) =>
		PrintEngineSelectors.segmentReferenceByPrintModelId(state, printModel.header.id)
	);

	if (!segmentReference) {
		return;
	}

	const overrideMaps = yield* call(buildOverrideMaps);
	const templateStructureMap = buildTemplateStructureMap(referenceSegments, segmentReference, printModel);

	const syncResults = syncAllReferenceSegments(
		referenceSegments,
		segmentReference,
		templateStructureMap,
		overrideMaps
	);

	yield* call(dispatchSyncActions, syncResults);
}

function* buildOverrideMaps() {
	const allOverrides: PartialOverride[] = (yield* select(PrintEngineSelectors.printModelElements)).filter(
		PartialOverride.isInstance
	);

	const byOverrideRefId = allOverrides.reduce<Map<string, PartialOverride[]>>((map, override) => {
		if (override.override?.refId) {
			map.set(override.override.refId, [...(map.get(override.override.refId) || []), override]);
		}
		return map;
	}, new Map<string, PartialOverride[]>());

	const byId = allOverrides.reduce<Map<string, PartialOverride>>((map, override) => {
		map.set(override.id, override);
		return map;
	}, new Map<string, PartialOverride>());

	return { byOverrideRefId, byId };
}

interface OverrideMaps {
	byOverrideRefId: Map<string, PartialOverride[]>;
	byId: Map<string, PartialOverride>;
}

interface SyncResults {
	updatedSegments: PartialSegment[];
	allUpdatedOverrides: PartialOverride[];
	allNewOverrides: PartialOverride[];
	allDeletedOverrides: PartialOverride[];
}

function syncAllReferenceSegments(
	referenceSegments: PartialSegment[],
	segmentReference: PartialSegmentReference,
	templateStructureMap: Map<string, TemplateStructure>,
	overrideMaps: OverrideMaps
): SyncResults {
	const structureChangeMap = new Map<string, boolean>();
	const updatedSegments: PartialSegment[] = [];
	const allUpdatedOverrides: PartialOverride[] = [];
	const allNewOverrides: PartialOverride[] = [];
	const allDeletedOverrides: PartialOverride[] = [];

	for (const refSegment of referenceSegments) {
		const templateSegmentId = segmentReference.refIds?.find(
			el => el.refId === refSegment.dinTemplate?.refId
		)?.refId;

		if (!templateSegmentId || structureChangeMap.get(templateSegmentId) === false) {
			continue;
		}

		const templateStructure = templateStructureMap.get(templateSegmentId);
		if (!templateStructure) {
			continue;
		}

		const { isUpdated, updatedSegment, deletedOverrides, newOverrides, updatedOverrides } = syncReferenceSegment(
			refSegment,
			templateStructure,
			overrideMaps.byOverrideRefId,
			overrideMaps.byId
		);

		allDeletedOverrides.push(...deletedOverrides);
		allNewOverrides.push(...newOverrides);
		allUpdatedOverrides.push(...updatedOverrides);

		if (isUpdated) {
			updatedSegments.push(updatedSegment);
		}

		const isStructureChanged =
			isUpdated || !!deletedOverrides.length || !!newOverrides.length || !!updatedOverrides.length;
		structureChangeMap.set(templateSegmentId, isStructureChanged);
	}

	return { updatedSegments, allUpdatedOverrides, allNewOverrides, allDeletedOverrides };
}

function* dispatchSyncActions(syncResults: SyncResults) {
	const { updatedSegments, allUpdatedOverrides, allNewOverrides, allDeletedOverrides } = syncResults;
	const transactionLogActions = [];

	if (updatedSegments.length) {
		transactionLogActions.push(TransactionLogStateActions.updateSegments({ data: updatedSegments }));
	}

	if (allUpdatedOverrides.length || allNewOverrides.length || allDeletedOverrides.length) {
		transactionLogActions.push(
			TransactionLogStateActions.syncOverrides({
				data: {
					updatedOverrides: allUpdatedOverrides,
					newOverrides: allNewOverrides,
					deletedOverrides: allDeletedOverrides,
				},
			})
		);
	}

	if (transactionLogActions.length) {
		yield* put(
			InteractionLogActions.start({
				description: RESOURCE_KEYS.interaction.segment.SegmentToolbar.loadOverrideElements,
				preventUndo: true,
				region: "sidebar",
				transactionLogActions,
			})
		);
	}
}

// Template Structure Builders

function buildTemplateStructureMap(
	referenceSegments: PartialSegment[],
	segmentReference: PartialSegmentReference,
	printModel: PrintModel
) {
	const referenceTemplateIds = new Set<string>();
	referenceSegments.forEach(refSegment => {
		const templateSegmentId = segmentReference.refIds?.find(
			el => el.refId === refSegment.dinTemplate?.refId
		)?.refId;

		if (templateSegmentId) {
			referenceTemplateIds.add(templateSegmentId);
		}
	});
	const templateSegments = printModel.content.segments.definitions.filter(seg => referenceTemplateIds.has(seg.id));

	const templateStructureMap = new Map<string, TemplateStructure>();

	const boundingBoxMap = printModel.content.elementDefinitions
		.filter(PartialBoundingBox.isInstance)
		.reduce<Map<string, PartialBoundingBox>>((map, boundingBox) => {
			map.set(boundingBox.id, boundingBox);
			return map;
		}, new Map<string, PartialBoundingBox>());

	templateSegments.forEach(templateSegment => {
		const structure: TemplateStructure = {
			segmentId: templateSegment.id,
			elementReferences: buildElementReferenceStructure(
				templateSegment.elementReferences ? [...templateSegment.elementReferences] : [],
				boundingBoxMap
			),
		};

		templateStructureMap.set(templateSegment.id, structure);
	});

	return templateStructureMap;
}

function buildElementReferenceStructure(
	elementReferences: PartialPlaceableReference[],
	boundingBoxMap: Map<string, PartialBoundingBox>
) {
	const elementReferenceStructure = new Map<string, TemplateStructureElementReference>();

	elementReferences.forEach(elementRef => {
		const boundingBox = elementRef.refId && boundingBoxMap.get(elementRef.refId);
		if (boundingBox) {
			const structureElementRef: TemplateStructureElementReference = {
				boundingBox: boundingBox,
				placeable: elementRef,
				elementReferences: buildElementReferenceStructure(
					boundingBox.boundingBox?.elementReferences ? [...boundingBox.boundingBox.elementReferences] : [],
					boundingBoxMap
				),
			};
			elementReferenceStructure.set(elementRef.refId, structureElementRef);
		}
	});
	return elementReferenceStructure;
}

// Sync Functions

function syncReferenceSegment(
	segment: PartialSegment,
	templateStructure: TemplateStructure,
	overrideMapByOverrideRefId: Map<string, PartialOverride[]>,
	overrideMapById: Map<string, PartialOverride>
) {
	const updatedOverrides: PartialOverride[] = [];
	const newOverrides: PartialOverride[] = [];
	const deletedOverrides: PartialOverride[] = [];

	const updatedElementReferences: PartialPlaceableReference[] = [];
	const newElementReferences: PartialPlaceableReference[] = [];
	const handledOverrideIds = new Set<string>();

	templateStructure.elementReferences.forEach((templateElementRef, refId) => {
		const refOverrides = overrideMapByOverrideRefId?.get(refId);
		const nestedOverride = refOverrides?.shift();

		if (refOverrides && nestedOverride) {
			overrideMapByOverrideRefId.set(refId, refOverrides);
		}

		handledOverrideIds.add(refId);

		if (!nestedOverride) {
			const result = handleNewTemplateElement(
				templateElementRef,
				overrideMapByOverrideRefId,
				overrideMapById,
				segment
			);
			newElementReferences.push(result.newPlaceableReference);
			updatedOverrides.push(...result.updatedOverrides);
			deletedOverrides.push(...result.deletedOverrides);
			newOverrides.push(...result.newOverrides);
			return;
		}

		let overrideElementRef = segment?.elementReferences?.find(el => el.refId === nestedOverride.id);

		if (!overrideElementRef) {
			overrideElementRef = {
				...clonePrintModelEntity(templateElementRef.placeable),
				id: templateElementRef.placeable.id, // use stable id from template
				refId: nestedOverride.id,
			};
			newElementReferences.push(overrideElementRef);
		}

		const result = handleExistingNestedOverride(
			templateElementRef,
			nestedOverride,
			overrideElementRef,
			overrideMapByOverrideRefId,
			overrideMapById,
			segment
		);
		if (result.updatedElementReference) {
			updatedElementReferences.push(result.updatedElementReference);
		}
		updatedOverrides.push(...result.updatedOverrides);
		deletedOverrides.push(...result.deletedOverrides);
		newOverrides.push(...result.newOverrides);
	});

	const updateResult = applyElementReferencesUpdates(
		segment,
		updatedElementReferences,
		newElementReferences,
		overrideMapById,
		handledOverrideIds
	);

	deletedOverrides.push(...updateResult.deletedOverrides);

	return {
		updatedSegment: updateResult.updated,
		deletedOverrides,
		updatedOverrides,
		newOverrides,
		isUpdated: updateResult.isUpdated,
	};
}

function syncOverride(
	templateStructureElementReference: TemplateStructureElementReference,
	override: PartialOverride,
	overrideMapByOverrideRefId: Map<string, PartialOverride[]>,
	overrideMapById: Map<string, PartialOverride>,
	segment: PartialSegment
) {
	const newOverrides: PartialOverride[] = [];
	const updatedOverrides: PartialOverride[] = [];
	const deletedOverrides: PartialOverride[] = [];

	const updatedElementReferences: PartialPlaceableReference[] = [];
	const newElementReferences: PartialPlaceableReference[] = [];
	const handledOverrideIds = new Set<string>();

	templateStructureElementReference.elementReferences.forEach((templateElementRef, refId) => {
		const refOverrides = overrideMapByOverrideRefId?.get(refId);
		const nestedOverride = refOverrides?.shift();

		if (refOverrides && nestedOverride) {
			overrideMapByOverrideRefId.set(refId, refOverrides);
		}

		handledOverrideIds.add(refId);

		if (!nestedOverride) {
			const result = handleNewTemplateElement(
				templateElementRef,
				overrideMapByOverrideRefId,
				overrideMapById,
				segment
			);
			newElementReferences.push(result.newPlaceableReference);
			updatedOverrides.push(...result.updatedOverrides);
			deletedOverrides.push(...result.deletedOverrides);
			newOverrides.push(...result.newOverrides);
			return;
		}

		let overrideElementRef = override?.override?.boundingBox?.elementReferences?.find(
			el => el.refId === nestedOverride.id
		);

		if (!overrideElementRef) {
			overrideElementRef = {
				...clonePrintModelEntity(templateElementRef.placeable),
				id: templateElementRef.placeable.id, // use stable id from template
				refId: nestedOverride.id,
			};
			newElementReferences.push(overrideElementRef);
		}

		const result = handleExistingNestedOverride(
			templateElementRef,
			nestedOverride,
			overrideElementRef,
			overrideMapByOverrideRefId,
			overrideMapById,
			segment
		);
		if (result.updatedElementReference) {
			updatedElementReferences.push(result.updatedElementReference);
		}
		updatedOverrides.push(...result.updatedOverrides);
		deletedOverrides.push(...result.deletedOverrides);
		newOverrides.push(...result.newOverrides);
	});

	const boundingBox = override.override?.boundingBox || { elementReferences: [] };
	const updateResult = applyElementReferencesUpdates(
		boundingBox,
		updatedElementReferences,
		newElementReferences,
		overrideMapById,
		handledOverrideIds
	);

	deletedOverrides.push(...updateResult.deletedOverrides);

	const updatedOverride: PartialOverride = updateResult.isUpdated
		? {
				...override,
				override: {
					...override.override,
					id: override.override?.id || nanoid(),
					boundingBox: {
						...updateResult.updated,
						id: override.override?.boundingBox?.id || nanoid(),
					},
				},
			}
		: { ...override };

	return { isUpdated: updateResult.isUpdated, updatedOverride, updatedOverrides, deletedOverrides, newOverrides };
}

// Handler Functions For Syncing

function handleNewTemplateElement(
	templateElementRef: TemplateStructureElementReference,
	overrideMapByOverrideRefId: Map<string, PartialOverride[]>,
	overrideMapById: Map<string, PartialOverride>,
	segment: PartialSegment
) {
	const { newOverride, newPlaceableReference } = handleNewBoundingBox(
		templateElementRef.boundingBox,
		templateElementRef.placeable,
		segment
	);

	const syncResult = syncOverride(
		templateElementRef,
		newOverride,
		overrideMapByOverrideRefId,
		overrideMapById,
		segment
	);

	const newOverrides: PartialOverride[] = [...syncResult.newOverrides];

	if (syncResult.isUpdated) {
		const redefinedNewOverride: PartialOverride = {
			...newOverride,
			override: {
				...newOverride.override,
				id: newOverride.override?.id || nanoid(),
				boundingBox: {
					...newOverride.override?.boundingBox,
					id: newOverride.override?.boundingBox?.id || nanoid(),
					elementReferences: syncResult.updatedOverride.override?.boundingBox?.elementReferences,
				},
			},
		};
		newOverrides.push(redefinedNewOverride);
	} else {
		newOverrides.push(newOverride);
	}

	return {
		newPlaceableReference,
		newOverrides,
		updatedOverrides: syncResult.updatedOverrides,
		deletedOverrides: syncResult.deletedOverrides,
	};
}

function handleExistingNestedOverride(
	templateElementRef: TemplateStructureElementReference,
	nestedOverride: PartialOverride,
	overrideElementRef: PartialPlaceableReference | undefined,
	overrideMapByOverrideRefId: Map<string, PartialOverride[]>,
	overrideMapById: Map<string, PartialOverride>,
	segment: PartialSegment
) {
	let updatedElementReference: PartialPlaceableReference | undefined;

	const { positionEqual, dimensionsEqual } = areElementReferencesEqual(
		templateElementRef.placeable,
		overrideElementRef!
	);

	const isElementRefUpdated = !positionEqual || !dimensionsEqual;
	if (overrideElementRef && isElementRefUpdated) {
		updatedElementReference = syncElementReference(overrideElementRef, templateElementRef.placeable);
	}

	const syncResult = syncOverride(
		templateElementRef,
		nestedOverride,
		overrideMapByOverrideRefId,
		overrideMapById,
		segment
	);

	const updatedOverrides = [...syncResult.updatedOverrides];
	if (syncResult.isUpdated) {
		updatedOverrides.push(syncResult.updatedOverride);
	}

	return {
		updatedElementReference,
		updatedOverrides,
		deletedOverrides: syncResult.deletedOverrides,
		newOverrides: syncResult.newOverrides,
	};
}

function handleNewBoundingBox(
	boundingBox: PartialBoundingBox,
	reference: PartialPlaceableReference,
	segment: PartialSegment
) {
	const newOverride = createOverride(boundingBox, segment);
	const newPlaceableReference: PartialPlaceableReference = {
		...clonePrintModelEntity(reference),
		id: reference.id, // use stable id from template
		refId: newOverride.id,
	};
	return { newOverride, newPlaceableReference };
}

function applyElementReferencesUpdates<T extends { elementReferences?: readonly PartialPlaceableReference[] }>(
	entity: T,
	updatedElementReferences: PartialPlaceableReference[],
	newElementReferences: PartialPlaceableReference[],
	overrideMapById: Map<string, PartialOverride>,
	handledOverrideIds: Set<string>
): ElementReferencesUpdateResult<T> {
	let updated: T = { ...entity };

	if (updatedElementReferences.length) {
		updated = {
			...updated,
			elementReferences: applyUpdatedElementReferences(
				[...(entity.elementReferences || [])],
				updatedElementReferences
			),
		};
	}

	if (newElementReferences.length) {
		updated = {
			...updated,
			elementReferences: [...(updated.elementReferences || []), ...newElementReferences],
		};
	}

	const entityDeletedOverrides = getDeletedOverrides(
		entity.elementReferences || [],
		overrideMapById,
		handledOverrideIds
	);

	if (entityDeletedOverrides.length) {
		updated = {
			...updated,
			elementReferences: updated.elementReferences?.filter(
				el => !entityDeletedOverrides.find(del => del.id === el.refId)
			),
		};
	}

	const isUpdated =
		!!updatedElementReferences.length || !!newElementReferences.length || !!entityDeletedOverrides.length;

	return { updated, deletedOverrides: entityDeletedOverrides, isUpdated };
}

function applyUpdatedElementReferences(
	oldElementReferences: PartialPlaceableReference[],
	updatedElementReferences: PartialPlaceableReference[]
) {
	return oldElementReferences.map(el => {
		const updatedElRef = updatedElementReferences.find(updated => updated.refId === el.refId);
		return updatedElRef ?? el;
	});
}

// Utility Functions

function areElementReferencesEqual(
	ref1: PartialPlaceableReference,
	ref2: PartialPlaceableReference
): { positionEqual: boolean; dimensionsEqual: boolean } {
	const pos1 = ref1.position;
	const pos2 = ref2.position;
	const dim1 = ref1.dimensions;
	const dim2 = ref2.dimensions;

	const positionEqual = pos1?.x?.value === pos2?.x?.value && pos1?.y?.value === pos2?.y?.value;
	const dimensionsEqual =
		dim1?.minWidth?.value === dim2?.minWidth?.value && dim1?.minHeight?.value === dim2?.minHeight?.value;

	return { positionEqual, dimensionsEqual };
}

function syncElementReference(ref1: PartialPlaceableReference, ref2: PartialPlaceableReference) {
	const cloneRef = { ...ref1 };

	const { positionEqual, dimensionsEqual } = areElementReferencesEqual(ref1, ref2);

	if (!positionEqual) {
		cloneRef.position = {
			...cloneRef.position,
			id: cloneRef.position?.id || nanoid(),
			x: ref2.position?.x,
			y: ref2.position?.y,
		};
	}

	if (!dimensionsEqual) {
		cloneRef.dimensions = {
			...cloneRef.dimensions,
			id: cloneRef.dimensions?.id || nanoid(),
			minWidth: ref2.dimensions?.minWidth,
			minHeight: ref2.dimensions?.minHeight,
		};
	}

	return cloneRef;
}

function createOverride(boundingBox: PartialBoundingBox, segment: PartialSegment): PartialOverride {
	return {
		id: nanoid(),
		type: ElementType.Override,
		override: {
			id: nanoid(),
			refId: boundingBox.id,
			overrideType: OverrideType.BoundingBox,
			source: {
				id: nanoid(),
				sourceType: SourceType.Reference,
				referenceType: ReferenceType.Segment,
				referenceElementId: segment.dinTemplate?.referenceId,
			},
			boundingBox: {
				id: nanoid(),
				elementReferences: [],
			},
		},
	};
}

function getDeletedOverrides(
	elementReferences: readonly PartialPlaceableReference[],
	overrideMapById: Map<string, PartialOverride>,
	handledOverrideIds: Set<string>
) {
	const deletedOverrides: PartialOverride[] = [];
	elementReferences.forEach(elementRef => {
		const override = elementRef.refId ? overrideMapById.get(elementRef.refId) : undefined;
		if (override && !handledOverrideIds.has(override.override?.refId || "")) {
			deletedOverrides.push(override);
		}
	});
	return deletedOverrides;
}

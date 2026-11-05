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
import { call, getContext, select } from "typed-redux-saga";
import type { SagaGenerator } from "typed-redux-saga";
import { nanoid } from "nanoid";

import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";
import {
	GlobalRegion,
	Log,
	TransactionLog,
	type InteractionLogPersistentEntry,
	type PartialTransactionLogPersistentEntry,
	type TransactionLogStore,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import {
	Area,
	BoundingBox,
	Override,
	type PlaceableReference,
	type PrintModel,
	type PrintModelElement,
	type Section,
	type Segment,
	type Watermark,
} from "@com.mgmtp.a12.print/print-model-api/model";

import type { RequestApi } from "../../api/index.js";
import { FragmentUsageSelectors } from "../../redux/fragment-usage/selectors.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import { changeMmMeasureValue } from "../../utils/measure-utils.js";
import { RESOURCE_KEYS } from "../../localization/index.js";

import {
	findElementFragmentPlacements,
	type ElementFragmentPlacementLocation,
	type ElementFragmentPlacementMatch,
} from "../fragment-usage/find-element-fragment-placements.js";

const log = LoggerFactory.getLogger("PropagateFragmentElementChangesSaga");

interface NewDimensions {
	width: number;
	height: number;
}

/**
 * For every committed fragment element whose dimensions changed, appends a pending transaction log entry to each
 * print model placing it. Those models aren't open here, hence persistTransactionLog instead of the interaction log.
 */
export function* propagateFragmentElementChanges(
	initialPrintModel: PrintModel,
	updatedPrintModel: PrintModel,
	affectedElementIds: ReadonlySet<string>
): SagaGenerator<void> {
	const changedDimensionsById = findChangedFragmentDimensions(
		initialPrintModel,
		updatedPrintModel,
		affectedElementIds
	);
	if (changedDimensionsById.size === 0) {
		return;
	}

	const fragmentModelId = updatedPrintModel.header.id;
	if (!fragmentModelId) {
		return;
	}

	const foreignModelIds = new Set<string>();
	for (const elementId of changedDimensionsById.keys()) {
		const usages = yield* select((state: PrintEngineState) =>
			FragmentUsageSelectors.usageForEntity(state, elementId)
		);
		usages.forEach(usage => foreignModelIds.add(usage.printModelId));
	}

	const requestApi: RequestApi = yield* getContext("requestApi");
	for (const foreignModelId of foreignModelIds) {
		yield* call(propagateToForeignModel, requestApi, foreignModelId, fragmentModelId, changedDimensionsById);
	}
}

function findChangedFragmentDimensions(
	initialPrintModel: PrintModel,
	updatedPrintModel: PrintModel,
	affectedElementIds: ReadonlySet<string>
): Map<string, NewDimensions> {
	const initialById = new Map(initialPrintModel.content.elementDefinitions.map(element => [element.id, element]));
	const changed = new Map<string, NewDimensions>();

	for (const elementId of affectedElementIds) {
		const after = updatedPrintModel.content.elementDefinitions.find(element => element.id === elementId);
		if (!after?.isFragment || !after.fragmentDimensions) {
			continue;
		}

		const before = initialById.get(elementId);
		const width = after.fragmentDimensions.width.value;
		const height = after.fragmentDimensions.height.value;
		const isUnchanged =
			before?.fragmentDimensions?.width.value === width && before?.fragmentDimensions?.height.value === height;
		if (!isUnchanged) {
			changed.set(elementId, { width, height });
		}
	}

	return changed;
}

function* propagateToForeignModel(
	requestApi: RequestApi,
	foreignModelId: string,
	fragmentModelId: string,
	changedDimensionsById: ReadonlyMap<string, NewDimensions>
): SagaGenerator<void> {
	const loadResponse = yield* call(requestApi.loadPrintModel, foreignModelId);
	if (!loadResponse?.printModel) {
		log.error(`Could not load print model ${foreignModelId} to propagate fragment element dimension changes`);
		return;
	}
	const foreignModel = loadResponse.printModel;
	const { transactionLogStore } = Log.createStores([], foreignModel);

	const matches = findElementFragmentPlacements(foreignModel, fragmentModelId);
	const outdatedMatches = matches.filter(match => isOutdated(match, changedDimensionsById));
	if (!outdatedMatches.length) {
		return;
	}

	const interactionId = nanoid();
	const persistentEntries: PartialTransactionLogPersistentEntry[] = [];

	for (const group of groupMatchesByContainer(outdatedMatches, changedDimensionsById)) {
		const updatedContainer = patchElementReferences(group.location, group.patchesByReferenceIndex);
		const result = createStoreEntryForContainer(
			group.location.kind,
			updatedContainer,
			transactionLogStore,
			interactionId
		);
		persistentEntries.push(...result.persistentEntries);
	}

	if (persistentEntries.length === 0) {
		return;
	}

	const interactionLogEntry: InteractionLogPersistentEntry = {
		interactionId,
		timestamp: Date.now(),
		type: "SET",
		region: GlobalRegion.SIDEBAR,
		regionId: fragmentModelId,
		description: RESOURCE_KEYS.interaction.fragment.element.updateElementReferenceDimensions,
	};
	yield* call(requestApi.persistInteractionLog, foreignModelId, interactionLogEntry);
	yield* call(requestApi.persistTransactionLog, persistentEntries, foreignModelId);
}

function isOutdated(match: ElementFragmentPlacementMatch, changedDimensionsById: ReadonlyMap<string, NewDimensions>) {
	const newDimensions = changedDimensionsById.get(match.reference.refId);
	if (!newDimensions) {
		return false;
	}
	return (
		match.reference.dimensions.minWidth.value !== newDimensions.width ||
		match.reference.dimensions.minHeight.value !== newDimensions.height
	);
}

interface ContainerGroup {
	location: ElementFragmentPlacementLocation;
	patchesByReferenceIndex: Map<number, NewDimensions>;
}

function groupMatchesByContainer(
	matches: ElementFragmentPlacementMatch[],
	changedDimensionsById: ReadonlyMap<string, NewDimensions>
): ContainerGroup[] {
	const groups = new Map<string, ContainerGroup>();

	for (const match of matches) {
		const newDimensions = changedDimensionsById.get(match.reference.refId);
		if (!newDimensions) {
			continue;
		}
		const key = `${match.location.kind}-${match.location.container.id}`;
		const group = groups.get(key) ?? { location: match.location, patchesByReferenceIndex: new Map() };
		group.patchesByReferenceIndex.set(match.referenceIndex, newDimensions);
		groups.set(key, group);
	}

	return [...groups.values()];
}

function patchElementReferences(
	location: ElementFragmentPlacementLocation,
	patchesByReferenceIndex: Map<number, NewDimensions>
) {
	const patchReferences = (references: readonly PlaceableReference[]) =>
		references.map((reference, index) => {
			const newDimensions = patchesByReferenceIndex.get(index);
			if (!newDimensions) {
				return reference;
			}
			return {
				...reference,
				dimensions: {
					...reference.dimensions,
					minWidth: changeMmMeasureValue(newDimensions.width, reference.dimensions.minWidth),
					minHeight: changeMmMeasureValue(newDimensions.height, reference.dimensions.minHeight),
				},
			};
		});

	if (location.kind !== "wrapper") {
		return { ...location.container, elementReferences: patchReferences(location.container.elementReferences) };
	}

	const wrapperElement = location.container;
	if (Area.isInstance(wrapperElement)) {
		return {
			...wrapperElement,
			area: { ...wrapperElement.area, elementReferences: patchReferences(wrapperElement.area.elementReferences) },
		};
	}
	if (BoundingBox.isInstance(wrapperElement)) {
		return {
			...wrapperElement,
			boundingBox: {
				...wrapperElement.boundingBox,
				elementReferences: patchReferences(wrapperElement.boundingBox.elementReferences),
			},
		};
	}
	if (Override.isInstance(wrapperElement)) {
		return {
			...wrapperElement,
			override: {
				...wrapperElement.override,
				boundingBox: {
					...wrapperElement.override.boundingBox,
					elementReferences: patchReferences(wrapperElement.override.boundingBox?.elementReferences || []),
				},
			},
		};
	}
	throw new Error(`Unexpected wrapper element type for a fragment placement container: ${wrapperElement.type}`);
}

function createStoreEntryForContainer(
	kind: ElementFragmentPlacementLocation["kind"],
	updatedContainer: Segment | Section | Watermark | PrintModelElement,
	transactionLogStore: TransactionLogStore,
	interactionId: string
) {
	switch (kind) {
		case "segment":
			return TransactionLog.createStoreEntrySegment(
				transactionLogStore.segments,
				updatedContainer as Segment,
				interactionId
			);
		case "section":
			return TransactionLog.createStoreEntrySection(
				transactionLogStore.sections,
				updatedContainer as Section,
				interactionId
			);
		case "watermark":
			return TransactionLog.createStoreEntryWatermark(
				transactionLogStore.watermarks,
				updatedContainer as Watermark,
				interactionId
			);
		case "wrapper":
			return TransactionLog.createStoreEntryPrintModelElement(
				transactionLogStore.printModelElements,
				updatedContainer as PrintModelElement,
				interactionId
			);
	}
}

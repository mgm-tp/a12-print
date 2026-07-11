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

import type { AffectedItemType, TransactionLogStore } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { TransactionLog } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type {
	PartialSection,
	PartialSegment,
	PartialValidPlaceableReference,
	PartialWatermark,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	isPartialSection,
	isPartialSegment,
	isPartialWatermark,
	PartialArea,
	PartialBoundingBox,
	PartialOverride,
} from "@com.mgmtp.a12.print/print-model-api/model";

type TopLevelContainer = PartialSegment | PartialSection | PartialWatermark;
type ElementContainer = PartialBoundingBox | PartialOverride | PartialArea;
type RenfereceContainer = TopLevelContainer | ElementContainer | PartialArea;

function createTopContainerStore({
	state,
	currentElementContainer,
	elementReferences,
	interactionId,
}: {
	state: TransactionLogStore;
	currentElementContainer: TopLevelContainer;
	elementReferences: readonly PartialValidPlaceableReference[];
	interactionId: string;
}) {
	const EMPTY_DATA = {
		id: nanoid(),
		map: {},
	};
	if (isPartialSegment(currentElementContainer)) {
		const entryData = state.segments || EMPTY_DATA;

		return {
			entryKey: "segments",
			affectKey: "segment" as const,
			entryData,
			storeEntry: TransactionLog.createStoreEntrySegment(
				entryData,
				{
					...currentElementContainer,
					elementReferences,
				},
				interactionId
			),
		};
	}

	if (isPartialSection(currentElementContainer)) {
		const entryData = state.sections || EMPTY_DATA;

		return {
			entryKey: "sections",
			affectKey: "section" as const,
			entryData,
			storeEntry: TransactionLog.createStoreEntrySection(
				entryData,
				{
					...currentElementContainer,
					elementReferences,
				},
				interactionId
			),
		};
	}

	if (isPartialWatermark(currentElementContainer)) {
		const entryData = state.watermarks || EMPTY_DATA;

		return {
			entryKey: "watermarks",
			affectKey: "watermark" as const,
			entryData,
			storeEntry: TransactionLog.createStoreEntryWatermark(
				entryData,
				{
					...currentElementContainer,
					elementReferences,
				},
				interactionId
			),
		};
	}
	throw new Error("Stored entry does not existed");
}

function createElemntContainerStore({
	state,
	currentElementContainer,
	elementReferences,
	interactionId,
}: {
	state: TransactionLogStore;
	currentElementContainer: ElementContainer;
	elementReferences: readonly PartialValidPlaceableReference[];
	interactionId: string;
}) {
	const entryData = state.printModelElements;
	const affectKey: AffectedItemType = "printModelElement" as const;
	const entryKey = "printModelElements";

	function createStoreEntry() {
		let updatedContainer: ElementContainer;

		if (PartialBoundingBox.isInstance(currentElementContainer)) {
			updatedContainer = {
				...currentElementContainer,
				boundingBox: {
					...currentElementContainer.boundingBox,
					id: currentElementContainer.boundingBox?.id || nanoid(),
					elementReferences,
				},
			};
		} else if (PartialOverride.isInstance(currentElementContainer)) {
			updatedContainer = {
				...currentElementContainer,
				override: {
					...currentElementContainer?.override,
					boundingBox: {
						...currentElementContainer?.override?.boundingBox,
						id: currentElementContainer?.override?.boundingBox?.id || nanoid(),
						elementReferences,
					},
					id: currentElementContainer?.override?.id || nanoid(),
				},
			};
		} else if (PartialArea.isInstance(currentElementContainer)) {
			updatedContainer = {
				...currentElementContainer,
				area: {
					...currentElementContainer.area,
					id: currentElementContainer.area?.id || nanoid(),
					elementReferences,
				},
			};
		} else {
			throw new Error("Stored entry does not existed");
		}

		return TransactionLog.createStoreEntryPrintModelElement(entryData, updatedContainer, interactionId);
	}

	return {
		entryKey,
		affectKey,
		entryData,
		storeEntry: createStoreEntry(),
	};
}

export function createReferenceStore({
	state,
	currentElementContainer,
	elementReferences,
	interactionId,
}: {
	state: TransactionLogStore;
	currentElementContainer: RenfereceContainer;
	elementReferences: readonly PartialValidPlaceableReference[];
	interactionId: string;
}) {
	const isTopLevelContainer =
		isPartialSegment(currentElementContainer) ||
		isPartialSection(currentElementContainer) ||
		isPartialWatermark(currentElementContainer);

	if (isTopLevelContainer) {
		return createTopContainerStore({
			state,
			currentElementContainer: currentElementContainer as TopLevelContainer,
			elementReferences,
			interactionId,
		});
	}

	return createElemntContainerStore({
		state,
		currentElementContainer: currentElementContainer as ElementContainer,
		interactionId,
		elementReferences,
	});
}

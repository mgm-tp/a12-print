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
import { select } from "typed-redux-saga";
import { nanoid } from "nanoid";

import {
	ElementType,
	OverrideType,
	PartialBoundingBox,
	PartialOverride,
	PlaceableReference,
	ReferenceType,
	SourceType,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { PrintEngineState } from "../store/root-reducer.js";
import { PrintEngineSelectors } from "../store/selectors.js";
import { RequestApiSelectors } from "../redux/request-api/selectors.js";
import { DinTemplateSegmentItem } from "../components/segments/din-template-segment-item.js";

export function* getBoundingOverrideElements(
	currentSegmentId: string,
	dinTemplateSegmentItem: DinTemplateSegmentItem,
	referenceElementId: string = "",
	isNewSegment = false
) {
	const { printModelId, segmentId } = dinTemplateSegmentItem;
	const templateBoundingBoxElements = yield* select((state: PrintEngineState) =>
		RequestApiSelectors.segmentElements(state, printModelId, segmentId).filter(PartialBoundingBox.isInstance)
	);
	const currentOverrideElements = yield* select((state: PrintEngineState) =>
		isNewSegment
			? []
			: PrintEngineSelectors.segmentElements(state, currentSegmentId).filter(PartialOverride.isInstance)
	);

	if (templateBoundingBoxElements.length === 0) {
		return [];
	}

	const overrideElements = templateBoundingBoxElements.map(boundingBoxElement => {
		const overrideElement = getOverrideElementByRefId(currentOverrideElements, boundingBoxElement.id);
		return overrideElement ? overrideElement : createOverrideElement(boundingBoxElement, referenceElementId);
	});

	return overrideElements.slice().map(overrideElement => {
		const boundingBoxElement = getBoundingBoxElementById(
			templateBoundingBoxElements,
			overrideElement.override?.refId
		);
		if (boundingBoxElement && boundingBoxElement.boundingBox?.elementReferences?.length) {
			return {
				...overrideElement,
				override: {
					...overrideElement.override,
					boundingBox: {
						...overrideElement.override?.boundingBox,
						elementReferences: boundingBoxElement.boundingBox.elementReferences.map(
							ref =>
								({
									...ref,
									id: nanoid(),
									refId: getOverrideElementByRefId(overrideElements, ref.refId)?.id,
									dimensions: {
										...ref.dimensions,
										id: nanoid(),
									},
								}) as PlaceableReference
						),
					},
				},
			} as PartialOverride;
		}
		return overrideElement;
	});
}

function createOverrideElement(element: PartialBoundingBox, referenceElementId: string = ""): PartialOverride {
	return {
		id: nanoid(),
		type: ElementType.Override,
		override: {
			id: nanoid(),
			refId: element.id,
			overrideType: OverrideType.BoundingBox,
			source: {
				id: nanoid(),
				sourceType: SourceType.Reference,
				referenceType: ReferenceType.Segment,
				referenceElementId,
			},
			boundingBox: {
				id: nanoid(),
				elementReferences: [],
			},
		},
	};
}

function getBoundingBoxElementById(boundingBoxElements: PartialBoundingBox[], id?: string) {
	return boundingBoxElements.find(element => element.id === id);
}

function getOverrideElementByRefId(overrideElements: PartialOverride[], id?: string): PartialOverride | undefined {
	return overrideElements.find(element => element.override?.refId === id);
}

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
import type { PrintModelElement } from "../../model/index.js";
import { type PartialPlaceableReference, type PartialSegment } from "../../model/index.js";

import { type CloneContext } from "./type.js";
import { clonePrintModelElement } from "./print-model-element.js";
import { CloneTreeTrace } from "./clone-tree-trace.js";

export function cloneSegment(
	segment: PartialSegment,
	context: CloneContext,
	trace: CloneTreeTrace = new CloneTreeTrace([])
) {
	const { elementReferences = [], ...restProperties } = segment;
	const clonedReferences: PartialPlaceableReference[] = [];
	const clonedSegmentElements: PrintModelElement[] = [];
	const clonedSegment: PartialSegment = {
		...context.cloneObject(restProperties),
		elementReferences: [],
	};
	const segmentTrace = trace.with(clonedSegment);

	elementReferences.forEach(elementReference => {
		const targetElement = elementReference.refId ? context.getElement(elementReference.refId) : undefined;

		if (!targetElement) {
			return;
		}

		const clonedReference = {
			...context.cloneObject(elementReference),
			refId: "", // will be set after cloning the target element
		};

		context.elementIdMap.set(elementReference.id, clonedReference.id);

		const clonedTargetElement = clonePrintModelElement(targetElement, context, segmentTrace.with(clonedReference));

		if (!clonedTargetElement[0].id) {
			throw new Error(`Cloned element does not have an id. Original element id: ${targetElement.id}`);
		}

		clonedReference.refId = clonedTargetElement[0].id;
		clonedReferences.push(clonedReference);
		clonedSegmentElements.push(...clonedTargetElement);
	});

	return {
		clonedSegment: {
			...clonedSegment,
			elementReferences: clonedReferences,
		},
		clonedSegmentElements,
	};
}

export function cloneSegments(
	structure: readonly string[],
	segmentDefinitions: readonly PartialSegment[],
	context: CloneContext,
	trace: CloneTreeTrace = new CloneTreeTrace([])
) {
	const clonedSegments: PartialSegment[] = [];
	const clonedElements: PrintModelElement[] = [];
	const newStructure: string[] = [];

	structure.forEach(segmentId => {
		const targetSegment = segmentDefinitions.find(segment => segment.id === segmentId);
		if (!targetSegment) {
			return;
		}
		const { clonedSegment, clonedSegmentElements } = cloneSegment(targetSegment, context, trace);
		clonedSegments.push(clonedSegment);
		clonedElements.push(...clonedSegmentElements);
		newStructure.push(clonedSegment.id);
	});

	return {
		clonedSegments,
		clonedElements,
		newStructure,
	};
}

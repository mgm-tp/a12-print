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
import { PartialPlaceableReference, PartialWatermark, PrintModelElement } from "../../model/index.js";

import { CloneContext } from "./type.js";
import { clonePrintModelElement } from "./print-model-element.js";
import { CloneTreeTrace } from "./clone-tree-trace.js";

export function cloneWatermarks(
	watermarks: readonly string[],
	watermarkDefinitions: readonly PartialWatermark[],
	context: CloneContext,
	trace: CloneTreeTrace = new CloneTreeTrace([])
) {
	const clonedWatermarks: PartialWatermark[] = [];
	const clonedElements: PrintModelElement[] = [];
	const newWatermarks: string[] = [];

	watermarks.map(watermarkId => {
		const targetWatermark = watermarkDefinitions.find(watermark => watermark.id === watermarkId);
		if (!targetWatermark) {
			return;
		}
		const { clonedWatermark, clonedWatermarkElements } = cloneWatermark(targetWatermark, context, trace);
		clonedWatermarks.push(clonedWatermark);
		newWatermarks.push(clonedWatermark.id);
		clonedElements.push(...clonedWatermarkElements);
	});

	return {
		clonedWatermarks,
		clonedElements,
		newWatermarks,
	};
}

function cloneWatermark(
	watermark: PartialWatermark,
	context: CloneContext,
	trace: CloneTreeTrace = new CloneTreeTrace([])
) {
	const { elementReferences = [], ...restProperties } = watermark;
	const clonedReferences: PartialPlaceableReference[] = [];
	const clonedWatermarkElements: PrintModelElement[] = [];
	const clonedWatermark: PartialWatermark = {
		...context.cloneObject(restProperties),
		elementReferences: [],
	};

	const watermarkTrace = trace.with(clonedWatermark);

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

		const clonedTargetElement = clonePrintModelElement(
			targetElement,
			context,
			watermarkTrace.with(clonedReference)
		);

		if (!clonedTargetElement[0].id) {
			throw new Error(`Cloned element does not have an id. Original element id: ${targetElement.id}`);
		}

		clonedReference.refId = clonedTargetElement[0].id;

		clonedReferences.push(clonedReference);
		clonedWatermarkElements.push(...clonedTargetElement);
	});

	return {
		clonedWatermark: {
			...clonedWatermark,
			elementReferences: clonedReferences,
		},
		clonedWatermarkElements: clonedWatermarkElements,
	};
}

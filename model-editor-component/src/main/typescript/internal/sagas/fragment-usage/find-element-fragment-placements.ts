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

export type ElementFragmentPlacementLocation =
	| { kind: "segment"; container: Segment; containerIndex: number }
	| { kind: "section"; container: Section; containerIndex: number }
	| { kind: "watermark"; container: Watermark; containerIndex: number }
	| { kind: "wrapper"; container: PrintModelElement; containerIndex: number };

export interface ElementFragmentPlacementMatch {
	location: ElementFragmentPlacementLocation;
	reference: PlaceableReference;
	referenceIndex: number;
}

/**
 * Finds every placement referencing fragmentModelId. Wrapper elements keep their nested elementReferences in their
 * own elementDefinitions entry, so scanning top-level containers plus all definitions covers every nesting depth.
 */
export function findElementFragmentPlacements(
	printModel: PrintModel,
	fragmentModelId: string
): ElementFragmentPlacementMatch[] {
	const matches: ElementFragmentPlacementMatch[] = [];

	const scan = (location: ElementFragmentPlacementLocation, references: readonly PlaceableReference[]) => {
		references.forEach((reference, referenceIndex) => {
			if (reference.model === fragmentModelId) {
				matches.push({ location, reference, referenceIndex });
			}
		});
	};

	(printModel.content.segments?.definitions || []).forEach((segment, containerIndex) =>
		scan({ kind: "segment", container: segment, containerIndex }, segment.elementReferences)
	);
	(printModel.content.sections?.definitions || []).forEach((section, containerIndex) =>
		scan({ kind: "section", container: section, containerIndex }, section.elementReferences)
	);
	(printModel.content.watermarks?.definitions || []).forEach((watermark, containerIndex) =>
		scan({ kind: "watermark", container: watermark, containerIndex }, watermark.elementReferences)
	);
	printModel.content.elementDefinitions.forEach((elementDef, containerIndex) => {
		const references = getWrapperOwnElementReferences(elementDef);
		if (references) {
			scan({ kind: "wrapper", container: elementDef, containerIndex }, references);
		}
	});

	return matches;
}

function getWrapperOwnElementReferences(element: PrintModelElement): readonly PlaceableReference[] | undefined {
	if (Area.isInstance(element)) {
		return element.area.elementReferences;
	}
	if (BoundingBox.isInstance(element)) {
		return element.boundingBox.elementReferences;
	}
	if (Override.isInstance(element)) {
		return element.override.boundingBox?.elementReferences;
	}
	return undefined;
}

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
import type {
	Measure,
	PlaceableReference,
	PrintModel,
	PrintModelElement,
	Section,
	Segment,
	Watermark,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { ElementType, MeasureUnit, PageOrientation, SegmentType } from "@com.mgmtp.a12.print/print-model-api/model";

/**
 * Builders for print models placing element fragment references. They produce just enough structure to satisfy the
 * strict Area/BoundingBox/Override type guards without pulling in a full fixture model.
 */
export const FRAGMENT_MODEL_ID = "fragment-model-1";

export function mm(value: number): Measure {
	return { id: `measure-${value}`, value, unit: MeasureUnit.Millimeter };
}

export function buildPlaceable(id: string, refId: string, model: string | undefined): PlaceableReference {
	return {
		id,
		refId,
		...(model && { model }),
		dimensions: { id: `${id}-dim`, minWidth: mm(40), minHeight: mm(20) },
		position: { id: `${id}-pos`, x: mm(0), y: mm(0) },
	} as unknown as PlaceableReference;
}

export function buildSegment(id: string, elementReferences: PlaceableReference[]): Segment {
	return { id, type: SegmentType.Default, title: id, dataContexts: [], elementReferences } as unknown as Segment;
}

export function buildSection(id: string, elementReferences: PlaceableReference[]): Section {
	return {
		id,
		title: id,
		pageOrientation: PageOrientation.Portrait,
		headerHeight: mm(20),
		elementReferences,
	} as unknown as Section;
}

export function buildWatermark(id: string, elementReferences: PlaceableReference[]): Watermark {
	return {
		id,
		title: id,
		pageOrientation: PageOrientation.Portrait,
		elementReferences,
	} as unknown as Watermark;
}

export function buildArea(id: string, elementReferences: PlaceableReference[]): PrintModelElement {
	return {
		id,
		name: id,
		type: ElementType.Area,
		area: { id: `${id}-area`, dimensions: { id: `${id}-dim`, width: mm(80), height: mm(60) }, elementReferences },
	} as unknown as PrintModelElement;
}

export function buildBoundingBox(id: string, elementReferences: PlaceableReference[]): PrintModelElement {
	return {
		id,
		name: id,
		type: ElementType.BoundingBox,
		boundingBox: {
			id: `${id}-bb`,
			dimensions: { id: `${id}-dim`, width: mm(80), height: mm(60) },
			elementReferences,
		},
	} as unknown as PrintModelElement;
}

export function buildOverride(id: string, elementReferences: PlaceableReference[]): PrintModelElement {
	return {
		id,
		name: id,
		type: ElementType.Override,
		override: { id: `${id}-ov`, boundingBox: { id: `${id}-bb`, elementReferences } },
	} as unknown as PrintModelElement;
}

/**
 * A standalone fragment element definition, i.e. the thing a placement's refId points at. It carries only what makes an
 * element a fragment; add the properties of the given type here once a test needs them.
 */
export function buildFragmentElement(
	id: string,
	width: number,
	height: number,
	type: ElementType = ElementType.Text
): PrintModelElement {
	return {
		id,
		name: id,
		type,
		isFragment: true,
		fragmentDimensions: { id: `${id}-fd`, width: mm(width), height: mm(height) },
	} as unknown as PrintModelElement;
}

export interface PrintModelParts {
	segments?: Segment[];
	sections?: Section[];
	watermarks?: Watermark[];
	elementDefinitions?: PrintModelElement[];
}

export function buildPrintModel(parts: PrintModelParts, id = "pm-1"): PrintModel {
	const { segments, sections, watermarks, elementDefinitions = [] } = parts;
	return {
		header: { id, modelType: "print", modelVersion: "4.0", description: "", annotations: [] },
		content: {
			id: `${id}-content`,
			general: { id: `${id}-general`, segmentDefaults: { id: `${id}-sd`, fontSize: 12 } },
			elementDefinitions,
			...(segments && {
				segments: { id: `${id}-segments`, definitions: segments, references: [], fragmentReferences: [] },
			}),
			...(sections && { sections: { id: `${id}-sections`, definitions: sections, references: [] } }),
			...(watermarks && { watermarks: { id: `${id}-watermarks`, definitions: watermarks, references: [] } }),
		},
	} as unknown as PrintModel;
}

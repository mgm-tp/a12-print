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

import { Transformer } from "../../../utils.ts/transformer.js";
import { ReferenceTransformer } from "../../../utils.ts/reference-transformer.js";
import { TransformTreeTrace } from "../../../utils.ts/tree-trace.js";
import type { GenericObject } from "../../../utils.ts/types.js";

import type * as OldModel from "../01_meta-data-computation/print-model.js";

import type * as NewModel from "./print-model.js";

function createDefaultPageBreakBehavior(
	path: string
): NewModel.InputSourceDTO<NewModel.Enumeration_PageBreakBehavior_ValueDTO> {
	return {
		id: nanoid(),
		source: "DEFAULT",
		path,
	};
}

function createInheritedPageBreakBehavior(
	path: string,
	reference: string
): NewModel.InputSourceDTO<NewModel.Enumeration_PageBreakBehavior_ValueDTO> {
	return {
		id: nanoid(),
		source: "INHERITED",
		path,
		reference,
	};
}

function createSegmentPageBreakBehavior(): NewModel.InputSourceDTO<NewModel.Enumeration_PageBreakBehavior_ValueDTO> {
	return createDefaultPageBreakBehavior("/content/segments/definitions/elementReferences/pageBreakBehavior/value/");
}

function createSectionPageBreakBehavior(): NewModel.InputSourceDTO<NewModel.Enumeration_PageBreakBehavior_ValueDTO> {
	return createDefaultPageBreakBehavior("/content/sections/definitions/elementReferences/pageBreakBehavior/value/");
}

function createWatermarkPageBreakBehavior(): NewModel.InputSourceDTO<NewModel.Enumeration_PageBreakBehavior_ValueDTO> {
	return createDefaultPageBreakBehavior("/content/watermarks/definitions/elementReferences/pageBreakBehavior/value/");
}

function createPageBreakBehavior(
	path: string,
	reference?: string
): NewModel.InputSourceDTO<NewModel.Enumeration_PageBreakBehavior_ValueDTO> {
	if (reference) {
		return createInheritedPageBreakBehavior(path, reference);
	}
	return createDefaultPageBreakBehavior(path);
}

function transformElementReferences(
	elementReferences: OldModel.ElementReferencesDTO[],
	createPageBreakBehaviorFn: () => NewModel.InputSourceDTO<NewModel.Enumeration_PageBreakBehavior_ValueDTO>
): NewModel.ElementReferencesDTO[] {
	return elementReferences?.map(reference => {
		return {
			...reference,
			pageBreakBehavior: createPageBreakBehaviorFn(),
		};
	});
}

function transformSegment(segment: OldModel.DefinitionsDTO): NewModel.DefinitionsDTO {
	return {
		...segment,
		elementReferences: transformElementReferences(segment.elementReferences || [], createSegmentPageBreakBehavior),
	};
}

function transformSection(section: OldModel.DefinitionsDTO_1): NewModel.DefinitionsDTO_1 {
	return {
		...section,
		elementReferences: transformElementReferences(section.elementReferences || [], createSectionPageBreakBehavior),
	};
}

function transformWatermark(watermark: OldModel.DefinitionsDTO_3): NewModel.DefinitionsDTO_3 {
	return {
		...watermark,
		elementReferences: transformElementReferences(
			watermark.elementReferences || [],
			createWatermarkPageBreakBehavior
		),
	};
}

function isPlaceableElementReference(obj: GenericObject) {
	return "id" in obj && "refId" in obj && "position" in obj && "dimensions" in obj;
}

function transformBoundingBox(
	elementDefinition: OldModel.ElementDefinitionsDTO,
	path: TransformTreeTrace
): Pick<NewModel.ElementDefinitionsDTO, "id" | "type" | "boundingBox"> {
	const parentPlaceableReference = path.findParent(isPlaceableElementReference);
	const sourcePath = "/content/elementDefinitions/boundingBox/elementReferences/pageBreakBehavior/value/";

	return {
		...elementDefinition,
		boundingBox: {
			...elementDefinition.boundingBox,
			elementReferences: transformElementReferences(elementDefinition.boundingBox?.elementReferences || [], () =>
				createPageBreakBehavior(sourcePath, parentPlaceableReference?.id)
			),
		},
	};
}

function transformArea(
	elementDefinition: OldModel.ElementDefinitionsDTO,
	path: TransformTreeTrace
): Pick<NewModel.ElementDefinitionsDTO, "id" | "type" | "area"> {
	const parentPlaceableReference = path.findParent(isPlaceableElementReference);
	const sourcePath = "/content/elementDefinitions/area/elementReferences/pageBreakBehavior/value/";

	return {
		...elementDefinition,
		area: {
			...elementDefinition.area,
			elementReferences: transformElementReferences(elementDefinition.area?.elementReferences || [], () =>
				createPageBreakBehavior(sourcePath, parentPlaceableReference?.id)
			),
		},
	};
}

function transformOverride(
	elementDefinition: OldModel.ElementDefinitionsDTO,
	path: TransformTreeTrace
): Pick<NewModel.ElementDefinitionsDTO, "id" | "type" | "override"> {
	const parentPlaceableReference = path.findParent(isPlaceableElementReference);
	const sourcePath = "/content/elementDefinitions/override/boundingBox/elementReferences/pageBreakBehavior/value/";

	return {
		...elementDefinition,
		override: {
			...elementDefinition.override,
			boundingBox: {
				...elementDefinition.override?.boundingBox,
				elementReferences: transformElementReferences(
					elementDefinition.override?.boundingBox?.elementReferences || [],
					() => createPageBreakBehavior(sourcePath, parentPlaceableReference?.id)
				),
			},
		},
	};
}

function transformElementDefinitions(
	elementDefinition: OldModel.ElementDefinitionsDTO,
	path: TransformTreeTrace
): NewModel.ElementDefinitionsDTO {
	if (elementDefinition.type === "BoundingBox") {
		return transformBoundingBox(elementDefinition, path);
	}

	if (elementDefinition.type === "Area") {
		return transformArea(elementDefinition, path);
	}
	if (elementDefinition.type === "Override") {
		return transformOverride(elementDefinition, path);
	}

	return elementDefinition as NewModel.ElementDefinitionsDTO;
}

function nestedReferenceGetter(element: OldModel.ElementDefinitionsDTO) {
	if (element.type === "Switch") {
		return element.switch?.cases;
	}

	if (element.type === "Area") {
		return element.area?.elementReferences;
	}

	if (element.type === "BoundingBox") {
		return element.boundingBox?.elementReferences;
	}

	if (element.type === "Override") {
		return element.override?.boundingBox?.elementReferences;
	}

	return undefined;
}

export function transformPageBreakBehavior(oldModel: OldModel.PrintModelDTO): NewModel.PrintModelDTO {
	const elementReferencesTransformer = new ReferenceTransformer(
		oldModel.content.elementDefinitions || [],
		(input: OldModel.ElementDefinitionsDTO, path: TransformTreeTrace) => transformElementDefinitions(input, path),
		nestedReferenceGetter
	);

	let transformedSegments;
	let transformedSections;
	let transformedWatermarks;

	if (oldModel.content.segments?.definitions) {
		transformedSegments = Transformer.transform({
			input: oldModel.content.segments.definitions,
			handler: (element: OldModel.DefinitionsDTO): NewModel.DefinitionsDTO => {
				if (element.elementReferences) {
					elementReferencesTransformer.handleReferences(
						element.elementReferences,
						new TransformTreeTrace([element])
					);
				}
				return transformSegment(element);
			},
		}) as NewModel.DefinitionsDTO[];
	}

	if (oldModel.content.sections?.definitions) {
		transformedSections = Transformer.transform({
			input: oldModel.content.sections.definitions,
			handler: (element: OldModel.DefinitionsDTO_1): NewModel.DefinitionsDTO_1 => {
				if (element.elementReferences) {
					elementReferencesTransformer.handleReferences(
						element.elementReferences,
						new TransformTreeTrace([element])
					);
				}
				return transformSection(element);
			},
		}) as NewModel.DefinitionsDTO_1[];
	}

	if (oldModel.content.watermarks?.definitions) {
		transformedWatermarks = Transformer.transform({
			input: oldModel.content.watermarks.definitions,
			handler: (element: OldModel.DefinitionsDTO_3): NewModel.DefinitionsDTO_3 => {
				if (element.elementReferences) {
					elementReferencesTransformer.handleReferences(
						element.elementReferences,
						new TransformTreeTrace([element])
					);
				}
				return transformWatermark(element);
			},
		}) as NewModel.DefinitionsDTO_3[];
	}

	elementReferencesTransformer.forEachUnhandled((unhandledElement, index) => {
		if (unhandledElement.type === "Override") {
			elementReferencesTransformer.handleElement(unhandledElement, index);
		}
	});

	elementReferencesTransformer.resolveUnhandled(unhandledElement => {
		return unhandledElement;
	});

	const transformedElementDefinitions = elementReferencesTransformer.getHandledElements();
	return {
		...oldModel,
		content: {
			...oldModel.content,
			segments: oldModel.content.segments
				? {
						...oldModel.content.segments,
						definitions: transformedSegments,
					}
				: undefined,
			sections: oldModel.content.sections
				? {
						...oldModel.content.sections,
						definitions: transformedSections,
					}
				: undefined,
			watermarks: oldModel.content.watermarks
				? {
						...oldModel.content.watermarks,
						definitions: transformedWatermarks,
					}
				: undefined,
			elementDefinitions: transformedElementDefinitions,
		},
	};
}

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
import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type {
	PartialPrintModel,
	PartialArea,
	PartialBoundingBox,
	PrintModel,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	ElementType,
	MeasureUnit,
	PageOrientation,
	SectionUsage,
	SegmentType,
} from "@com.mgmtp.a12.print/print-model-api/model";

import { buildAncestrySteps } from "../ancestry-steps.js";
import type { ElementNavigationStep } from "../navigation-steps.js";

describe("buildAncestrySteps", () => {
	const fragmentElementId = "fragment-element-1";
	const fragmentElementDef = { id: fragmentElementId, type: ElementType.Text, name: "my_text" };

	const elementToken: ElementNavigationStep = {
		kind: "element",
		elementId: fragmentElementId,
		elementDef: fragmentElementDef,
		jsonPath: [],
	};

	const model: PartialPrintModel = {
		content: {
			id: "content-1",
			segments: { id: "segments-container", definitions: [] },
			sections: { id: "sections-container", definitions: [] },
			watermarks: { id: "watermarks-container", definitions: [] },
			elementDefinitions: [fragmentElementDef],
		},
	};

	describe("fragment elements", () => {
		it("returns a canvasRoot step pointing to the fragment container", () => {
			const targetContainer = { type: SidebarItem.FRAGMENT, id: fragmentElementId };

			const steps = buildAncestrySteps(elementToken, model, targetContainer);

			expect(steps).toHaveLength(1);
			expect(steps[0]).toEqual({
				kind: "canvasRoot",
				type: SidebarItem.FRAGMENT,
				entityId: fragmentElementId,
				jsonPath: [],
			});
		});

		it("returns empty ancestry when no targetContainer is provided and element is only in elementDefinitions", () => {
			const steps = buildAncestrySteps(elementToken, model);

			// Fragment elements are not found by the walker (it only searches segments, sections, watermarks)
			expect(steps).toEqual([]);
		});
	});

	describe("elements nested in a fragment element", () => {
		const fragmentAreaId = "fragment-area";
		const boundingBoxId = "bounding-box-in-fragment";
		const textId = "text-in-fragment-area";
		const deepTextId = "text-in-bounding-box";

		const textElement = { id: textId, type: ElementType.Text, name: "nested_text" };
		const deepTextElement = { id: deepTextId, type: ElementType.Text, name: "deep_text" };
		const boundingBoxElement: PartialBoundingBox = {
			id: boundingBoxId,
			type: ElementType.BoundingBox,
			name: "my_bounding_box",
			boundingBox: {
				id: "bounding-box-props",
				elementReferences: [{ refId: deepTextId, id: "ref-deep-text" }],
			},
		};
		const fragmentArea: PartialArea = {
			id: fragmentAreaId,
			type: ElementType.Area,
			name: "fragment_area",
			isFragment: true,
			area: {
				id: "fragment-area-props",
				elementReferences: [
					{ refId: textId, id: "ref-text" },
					{ refId: boundingBoxId, id: "ref-bounding-box" },
				],
			},
		};

		const fragmentModel: PartialPrintModel = {
			content: {
				id: "content-fragment",
				segments: { id: "segments-container", definitions: [] },
				sections: { id: "sections-container", definitions: [] },
				watermarks: { id: "watermarks-container", definitions: [] },
				elementDefinitions: [fragmentArea, textElement, boundingBoxElement, deepTextElement],
			},
		};

		function tokenFor(elementId: string, elementDef: ElementNavigationStep["elementDef"]): ElementNavigationStep {
			return { kind: "element", elementId, elementDef, jsonPath: [] };
		}

		it("opens the fragment element and drills into it", () => {
			const steps = buildAncestrySteps(tokenFor(textId, textElement), fragmentModel);

			expect(steps).toEqual([
				{ kind: "canvasRoot", type: SidebarItem.FRAGMENT, entityId: fragmentAreaId, jsonPath: [] },
				expect.objectContaining({ kind: "wrapper", elementId: fragmentAreaId }),
			]);
		});

		it("drills through every wrapper between the fragment element and a deeply nested element", () => {
			const steps = buildAncestrySteps(tokenFor(deepTextId, deepTextElement), fragmentModel);

			expect(steps).toEqual([
				{ kind: "canvasRoot", type: SidebarItem.FRAGMENT, entityId: fragmentAreaId, jsonPath: [] },
				expect.objectContaining({ kind: "wrapper", elementId: fragmentAreaId }),
				expect.objectContaining({ kind: "wrapper", elementId: boundingBoxId }),
			]);
		});

		it("drills into the fragment element given as targetContainer", () => {
			const targetContainer = { type: SidebarItem.FRAGMENT, id: fragmentAreaId };

			const steps = buildAncestrySteps(tokenFor(textId, textElement), fragmentModel, targetContainer);

			expect(steps).toEqual([
				{ kind: "canvasRoot", type: SidebarItem.FRAGMENT, entityId: fragmentAreaId, jsonPath: [] },
				expect.objectContaining({ kind: "wrapper", elementId: fragmentAreaId }),
			]);
		});
	});

	describe("segment elements", () => {
		const segmentId = "segment-1";
		const areaId = "area-1";
		const textId = "text-in-area";

		const textElement = { id: textId, type: ElementType.Text, name: "nested_text" };
		const areaElement: PartialArea = {
			id: areaId,
			type: ElementType.Area,
			name: "my_area",
			area: {
				id: "area-props-1",
				elementReferences: [{ refId: textId, id: "ref-1" }],
			},
		};

		const modelWithSegment: PartialPrintModel = {
			content: {
				id: "content-2",
				segments: {
					id: "segments-container",
					definitions: [
						{
							id: segmentId,
							type: SegmentType.Default,
							title: "Test Segment",
							elementReferences: [{ refId: areaId, id: "ref-area" }],
							dataContexts: [],
						},
					],
				},
				sections: { id: "sections-container", definitions: [] },
				watermarks: { id: "watermarks-container", definitions: [] },
				elementDefinitions: [areaElement, textElement],
			},
		};

		it("finds ancestry of a nested element within a segment", () => {
			const nestedToken: ElementNavigationStep = {
				kind: "element",
				elementId: textId,
				elementDef: textElement,
				jsonPath: [],
			};
			const targetContainer = { type: SidebarItem.SEGMENT, id: segmentId };

			const steps = buildAncestrySteps(nestedToken, modelWithSegment, targetContainer);

			expect(steps.length).toBeGreaterThan(0);
			expect(steps[0]).toMatchObject({ kind: "canvasRoot", type: SidebarItem.SEGMENT, entityId: segmentId });
		});

		it("finds ancestry without explicit targetContainer", () => {
			const nestedToken: ElementNavigationStep = {
				kind: "element",
				elementId: textId,
				elementDef: textElement,
				jsonPath: [],
			};

			const steps = buildAncestrySteps(nestedToken, modelWithSegment);

			expect(steps.length).toBeGreaterThan(0);
			expect(steps[0]).toMatchObject({ kind: "canvasRoot", type: SidebarItem.SEGMENT });
		});
	});

	describe("elements in a section referenced from a print fragment model", () => {
		const textId = "text-in-fragment-section";
		const textElement = { id: textId, type: ElementType.Text, name: "fragment_text" };
		const sectionReferenceId = "section-reference-1";

		const fragmentModel = {
			header: { id: "fragment-model", modelType: "print", modelSubType: "fragment" },
			content: {
				id: "fragment-content",
				sections: {
					id: "fragment-sections",
					definitions: [
						{
							id: "fragment-section",
							title: "Fragment Section",
							sectionUsage: SectionUsage.First,
							pageOrientation: PageOrientation.Portrait,
							headerHeight: { id: "hh-1", value: 10, unit: MeasureUnit.Millimeter },
							footerHeight: { id: "fh-1", value: 10, unit: MeasureUnit.Millimeter },
							elementReferences: [{ refId: textId, id: "ref-text" }],
						},
					],
				},
				elementDefinitions: [textElement],
			},
		} as unknown as PrintModel;

		const modelUsingFragmentSection: PartialPrintModel = {
			header: {
				id: "using-model",
				modelType: "print",
				modelReferences: [
					{ id: "mr-1", modelType: "print", purpose: "print-fragment", reference: "fragment-model" },
				],
			},
			content: {
				id: "content-3",
				general: { id: "general-1", sections: [sectionReferenceId] },
				segments: { id: "segments-container", definitions: [] },
				sections: {
					id: "sections-container",
					definitions: [],
					references: [
						{
							id: sectionReferenceId,
							refId: "fragment-section",
							model: "fragment-model",
							sectionUsage: SectionUsage.First,
						},
					],
				},
				watermarks: { id: "watermarks-container", definitions: [] },
				elementDefinitions: [],
			},
		};

		const nestedToken: ElementNavigationStep = {
			kind: "element",
			elementId: textId,
			elementDef: textElement,
			jsonPath: [],
		};

		it("finds the ancestry through the section reference", () => {
			const steps = buildAncestrySteps(nestedToken, modelUsingFragmentSection, undefined, [fragmentModel]);

			expect(steps.length).toBeGreaterThan(0);
			expect(steps[0]).toMatchObject({
				kind: "canvasRoot",
				type: SidebarItem.SECTION,
				entityId: sectionReferenceId,
			});
		});

		it("finds the ancestry when the referencing section is given as targetContainer", () => {
			const targetContainer = { type: SidebarItem.SECTION, id: sectionReferenceId };

			const steps = buildAncestrySteps(nestedToken, modelUsingFragmentSection, targetContainer, [fragmentModel]);

			expect(steps[0]).toMatchObject({
				kind: "canvasRoot",
				type: SidebarItem.SECTION,
				entityId: sectionReferenceId,
			});
		});

		it("returns an empty ancestry while the fragment model is not loaded", () => {
			const steps = buildAncestrySteps(nestedToken, modelUsingFragmentSection);

			expect(steps).toEqual([]);
		});
	});
});

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
import type { EntityInstancePath } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import type {
	PartialAnyPrintModelElement,
	PartialPrintModel,
	PartialSection,
	PartialSegment,
	PartialValidPlaceableReference,
	PartialWatermark,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	PartialArea,
	PartialBoundingBox,
	PartialOverride,
	PartialSwitch,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import testPrintModelWithAllElements from "../../../../../../test/typescript/models/Print-model-with-all-elements.json" with { type: "json" };
import testPrintModelWithHideConditions from "../../../../../../test/typescript/models/Print-model-with-hide-conditions.json" with { type: "json" };

import type {
	CanvasRootNavigationStep,
	ElementNavigationStep,
	ReferenceNavigationStep,
	RootNavigationStep,
	TextStyleNavigationStep,
	WrapperElementNavigationStep,
} from "../navigation-steps.js";
import { parsePath } from "../path-to-steps.js";
import { stepsToNavigationState } from "../steps-to-navigation-state.js";

const modelWithAllElements = testPrintModelWithAllElements as unknown as PartialPrintModel;
const modelWithHideConditions = testPrintModelWithHideConditions as unknown as PartialPrintModel;

/** Build a single EntityInstancePath entry. index is 1-based (adjustIndex in parsePath subtracts 1). */
const p = (elementName: string, index: number) => ({ elementName, index });
const CONTENT = p("content", 1);

function getWrapperReferences(elem: PartialAnyPrintModelElement): readonly PartialValidPlaceableReference[] {
	if (PartialArea.isInstance(elem)) return (elem.area?.elementReferences ?? []) as PartialValidPlaceableReference[];
	if (PartialBoundingBox.isInstance(elem))
		return (elem.boundingBox?.elementReferences ?? []) as PartialValidPlaceableReference[];
	if (PartialOverride.isInstance(elem))
		return (elem.override?.boundingBox?.elementReferences ?? []) as PartialValidPlaceableReference[];
	return [];
}

describe("parsePath", () => {
	describe("empty and unknown paths", () => {
		it("returns [] for an empty path", () => {
			expect(parsePath([], modelWithAllElements)).toEqual([]);
		});

		it("returns [] for an unknown root element", () => {
			expect(parsePath([p("unknown", 1)], modelWithAllElements)).toEqual([]);
		});

		it("returns [] for content with an unknown child", () => {
			expect(parsePath([CONTENT, p("unknown", 1)], modelWithAllElements)).toEqual([]);
		});
	});

	describe("header paths", () => {
		it("maps [header] to a GENERAL root step", () => {
			const steps = parsePath([p("header", 1)], modelWithAllElements);
			expect(steps).toHaveLength(1);
			expect(steps[0].kind).toBe("root");
			expect((steps[0] as RootNavigationStep).type).toBe(SidebarItem.GENERAL);
		});

		it("maps [header, modelReferences] to a SCHEMA root step", () => {
			const steps = parsePath([p("header", 1), p("modelReferences", 1)], modelWithAllElements);
			expect(steps).toHaveLength(1);
			expect(steps[0].kind).toBe("root");
			expect((steps[0] as RootNavigationStep).type).toBe(SidebarItem.SCHEMA);
		});

		it("maps [header, <other field>] to a GENERAL root step", () => {
			const steps = parsePath([p("header", 1), p("id", 1)], modelWithAllElements);
			expect(steps).toHaveLength(1);
			expect(steps[0].kind).toBe("root");
			expect((steps[0] as RootNavigationStep).type).toBe(SidebarItem.GENERAL);
		});
	});

	describe("content root paths", () => {
		it("maps [content, general] to a GENERAL root step", () => {
			const steps = parsePath([CONTENT, p("general", 1)], modelWithAllElements);
			expect(steps).toHaveLength(1);
			expect(steps[0].kind).toBe("root");
			expect((steps[0] as RootNavigationStep).type).toBe(SidebarItem.GENERAL);
		});

		it("maps [content, textStyles] to a TEXT_STYLES root step", () => {
			const steps = parsePath([CONTENT, p("textStyles", 1)], modelWithAllElements);
			expect(steps).toHaveLength(1);
			expect(steps[0].kind).toBe("root");
			expect((steps[0] as RootNavigationStep).type).toBe(SidebarItem.TEXT_STYLES);
		});
	});

	describe("segment canvas paths", () => {
		const definitions = (modelWithAllElements.content?.segments?.definitions ?? []) as PartialSegment[];

		definitions.forEach((segment, i) => {
			const basePath: EntityInstancePath = [CONTENT, p("segments", i + 1)];

			it(`segment[${i}] "${segment.id}" → single canvasRoot SEGMENT step`, () => {
				const steps = parsePath(basePath, modelWithAllElements);
				expect(steps).toHaveLength(1);
				expect(steps[0].kind).toBe("canvasRoot");
				expect((steps[0] as CanvasRootNavigationStep).type).toBe(SidebarItem.SEGMENT);
				expect((steps[0] as CanvasRootNavigationStep).entityId).toBe(segment.id);
			});

			const refs = (segment.elementReferences ?? []) as PartialValidPlaceableReference[];
			refs.forEach((ref, j) => {
				it(`segment[${i}] ref[${j}] "${ref.id}" with pageBreakBehavior → [canvasRoot, reference] steps`, () => {
					const path: EntityInstancePath = [
						...basePath,
						p("elementReferences", j + 1),
						p("pageBreakBehavior", 1),
					];
					const steps = parsePath(path, modelWithAllElements);
					expect(steps).toHaveLength(2);
					expect(steps[0].kind).toBe("canvasRoot");
					expect((steps[0] as CanvasRootNavigationStep).entityId).toBe(segment.id);
					expect(steps[1].kind).toBe("reference");
					expect((steps[1] as ReferenceNavigationStep).elementId).toBe(segment.id);
					expect((steps[1] as ReferenceNavigationStep).referenceId).toBe(ref.id);
				});

				it(`segment[${i}] ref[${j}] "${ref.id}" without navigable sub-path → single canvasRoot step`, () => {
					const path: EntityInstancePath = [...basePath, p("elementReferences", j + 1)];
					const steps = parsePath(path, modelWithAllElements);
					expect(steps).toHaveLength(1);
					expect(steps[0].kind).toBe("canvasRoot");
					expect((steps[0] as CanvasRootNavigationStep).entityId).toBe(segment.id);
				});
			});
		});
	});

	describe("section canvas paths", () => {
		const definitions = (modelWithAllElements.content?.sections?.definitions ?? []) as PartialSection[];

		definitions.forEach((section, i) => {
			const basePath: EntityInstancePath = [CONTENT, p("sections", i + 1)];

			it(`section[${i}] "${section.id}" → single canvasRoot SECTION step`, () => {
				const steps = parsePath(basePath, modelWithAllElements);
				expect(steps).toHaveLength(1);
				expect(steps[0].kind).toBe("canvasRoot");
				expect((steps[0] as CanvasRootNavigationStep).type).toBe(SidebarItem.SECTION);
				expect((steps[0] as CanvasRootNavigationStep).entityId).toBe(section.id);
			});

			const refs = (section.elementReferences ?? []) as PartialValidPlaceableReference[];
			refs.forEach((ref, j) => {
				it(`section[${i}] ref[${j}] "${ref.id}" with pageBreakBehavior → [canvasRoot, reference] steps`, () => {
					const path: EntityInstancePath = [
						...basePath,
						p("elementReferences", j + 1),
						p("pageBreakBehavior", 1),
					];
					const steps = parsePath(path, modelWithAllElements);
					expect(steps).toHaveLength(2);
					expect(steps[0].kind).toBe("canvasRoot");
					expect((steps[0] as CanvasRootNavigationStep).entityId).toBe(section.id);
					expect(steps[1].kind).toBe("reference");
					expect((steps[1] as ReferenceNavigationStep).elementId).toBe(section.id);
					expect((steps[1] as ReferenceNavigationStep).referenceId).toBe(ref.id);
				});
			});
		});
	});

	describe("watermark canvas paths", () => {
		const definitions = (modelWithAllElements.content?.watermarks?.definitions ?? []) as PartialWatermark[];

		definitions.forEach((watermark, i) => {
			const basePath: EntityInstancePath = [CONTENT, p("watermarks", i + 1)];

			it(`watermark[${i}] "${watermark.id}" → single canvasRoot WATERMARK step`, () => {
				const steps = parsePath(basePath, modelWithAllElements);
				expect(steps).toHaveLength(1);
				expect(steps[0].kind).toBe("canvasRoot");
				expect((steps[0] as CanvasRootNavigationStep).type).toBe(SidebarItem.WATERMARK);
				expect((steps[0] as CanvasRootNavigationStep).entityId).toBe(watermark.id);
			});

			const refs = (watermark.elementReferences ?? []) as PartialValidPlaceableReference[];
			refs.forEach((ref, j) => {
				it(`watermark[${i}] ref[${j}] "${ref.id}" with pageBreakBehavior → [canvasRoot, reference] steps`, () => {
					const path: EntityInstancePath = [
						...basePath,
						p("elementReferences", j + 1),
						p("pageBreakBehavior", 1),
					];
					const steps = parsePath(path, modelWithAllElements);
					expect(steps).toHaveLength(2);
					expect(steps[0].kind).toBe("canvasRoot");
					expect((steps[0] as CanvasRootNavigationStep).entityId).toBe(watermark.id);
					expect(steps[1].kind).toBe("reference");
					expect((steps[1] as ReferenceNavigationStep).elementId).toBe(watermark.id);
					expect((steps[1] as ReferenceNavigationStep).referenceId).toBe(ref.id);
				});
			});
		});
	});

	describe("element definition paths", () => {
		const elementDefs = (modelWithAllElements.content?.elementDefinitions ?? []) as PartialAnyPrintModelElement[];

		elementDefs.forEach((elem, i) => {
			const basePath: EntityInstancePath = [CONTENT, p("elementDefinitions", i + 1)];
			const isSwitch = PartialSwitch.isInstance(elem);
			const isWrapperNonSwitch =
				!isSwitch &&
				(PartialArea.isInstance(elem) ||
					PartialBoundingBox.isInstance(elem) ||
					PartialOverride.isInstance(elem));
			const isWrapper = isSwitch || isWrapperNonSwitch;

			if (!isWrapper) {
				it(`elementDef[${i}] "${elem.id}" (non-wrapper) → single element step`, () => {
					const steps = parsePath(basePath, modelWithAllElements);
					expect(steps).toHaveLength(1);
					expect(steps[0].kind).toBe("element");
					expect((steps[0] as ElementNavigationStep).elementId).toBe(elem.id);
				});
			} else if (isSwitch) {
				it(`elementDef[${i}] "${elem.id}" (Switch, no cases in path) → single element step`, () => {
					const steps = parsePath(basePath, modelWithAllElements);
					expect(steps).toHaveLength(1);
					expect(steps[0].kind).toBe("element");
					expect((steps[0] as ElementNavigationStep).elementId).toBe(elem.id);
				});

				it(`elementDef[${i}] "${elem.id}" (Switch, with cases in path) → single wrapper step`, () => {
					const path: EntityInstancePath = [...basePath, p("cases", 1)];
					const steps = parsePath(path, modelWithAllElements);
					expect(steps).toHaveLength(1);
					expect(steps[0].kind).toBe("wrapper");
					expect((steps[0] as WrapperElementNavigationStep).elementId).toBe(elem.id);
				});
			} else {
				it(`elementDef[${i}] "${elem.id}" (wrapper, no elementReferences in path) → single element step`, () => {
					const steps = parsePath(basePath, modelWithAllElements);
					expect(steps).toHaveLength(1);
					expect(steps[0].kind).toBe("element");
					expect((steps[0] as ElementNavigationStep).elementId).toBe(elem.id);
				});

				const refs = getWrapperReferences(elem);
				refs.forEach((ref, j) => {
					it(`elementDef[${i}] "${elem.id}" ref[${j}] "${ref.id}" with pageBreakBehavior → [wrapper, reference] steps`, () => {
						const path: EntityInstancePath = [
							...basePath,
							p("elementReferences", j + 1),
							p("pageBreakBehavior", 1),
						];
						const steps = parsePath(path, modelWithAllElements);
						expect(steps).toHaveLength(2);
						expect(steps[0].kind).toBe("wrapper");
						expect((steps[0] as WrapperElementNavigationStep).elementId).toBe(elem.id);
						expect(steps[1].kind).toBe("reference");
						expect((steps[1] as ReferenceNavigationStep).elementId).toBe(elem.id);
						expect((steps[1] as ReferenceNavigationStep).referenceId).toBe(ref.id);
					});
				});
			}
		});
	});

	describe("hide conditions paths (modelWithHideConditions)", () => {
		function testHideConditionRefs(
			canvasType: "segments" | "sections",
			tab: SidebarItem,
			definitions: PartialSegment[] | PartialSection[]
		) {
			(definitions as Array<PartialSegment | PartialSection>).forEach((entity, i) => {
				const basePath: EntityInstancePath = [CONTENT, p(canvasType, i + 1)];
				const refs = (entity.elementReferences ?? []) as PartialValidPlaceableReference[];

				refs.forEach((ref, j) => {
					const hasHideConditions = ((ref as { hideConditions?: unknown[] }).hideConditions ?? []).length > 0;
					if (!hasHideConditions) return;

					it(`${canvasType}[${i}] ref[${j}] "${ref.id}" with hideConditions → [canvasRoot, reference] steps`, () => {
						const path: EntityInstancePath = [
							...basePath,
							p("elementReferences", j + 1),
							p("hideConditions", 1),
						];
						const steps = parsePath(path, modelWithHideConditions);
						expect(steps).toHaveLength(2);
						expect(steps[0].kind).toBe("canvasRoot");
						expect((steps[0] as CanvasRootNavigationStep).type).toBe(tab);
						expect((steps[0] as CanvasRootNavigationStep).entityId).toBe(entity.id);
						expect(steps[1].kind).toBe("reference");
						expect((steps[1] as ReferenceNavigationStep).elementId).toBe(entity.id);
						expect((steps[1] as ReferenceNavigationStep).referenceId).toBe(ref.id);
					});
				});
			});
		}

		testHideConditionRefs(
			"segments",
			SidebarItem.SEGMENT,
			(modelWithHideConditions.content?.segments?.definitions ?? []) as PartialSegment[]
		);

		testHideConditionRefs(
			"sections",
			SidebarItem.SECTION,
			(modelWithHideConditions.content?.sections?.definitions ?? []) as PartialSection[]
		);
	});

	describe("model reference paths", () => {
		const modelWithModelReferences = {
			header: {
				modelReferences: [
					{ modelType: "document", reference: "DomainText" },
					{ modelType: "typesetting", reference: "Typesetting" },
					{ modelType: "print", reference: "Fragment", purpose: "print-fragment" },
					{ modelType: "print", reference: "DinTemplate", purpose: "DINTemplate" },
				],
			},
		} as unknown as PartialPrintModel;

		function expandedSectionsFor(referenceIndex: number) {
			const path = [p("header", 1), p("modelReferences", referenceIndex), p("reference", 1)];
			return stepsToNavigationState(parsePath(path, modelWithModelReferences))[SidebarItem.SCHEMA]
				?.expandedSections;
		}

		it("expands the section of a Model Reference whose index is marked as given", () => {
			const path = [p("header", 1), { elementName: "modelReferences", index: 3, isRepeatable: true }];

			const steps = parsePath(path, modelWithModelReferences);

			expect(stepsToNavigationState(steps)[SidebarItem.SCHEMA]?.expandedSections).toEqual(["fragment"]);
		});

		it("only opens the Schema tab for a path ending at the Model References", () => {
			const steps = parsePath([p("header", 1), p("modelReferences", 1)], modelWithModelReferences);

			expect(steps).toEqual([expect.objectContaining({ kind: "root", type: SidebarItem.SCHEMA })]);
		});

		it.each([
			[1, "document"],
			[2, "typesetting"],
			[3, "fragment"],
			[4, "print"],
		])("expands the section of the Model Reference %i: %s", (referenceIndex, section) => {
			expect(expandedSectionsFor(referenceIndex)).toEqual([section]);
		});

		it("only opens the Schema tab for a Model Reference the model does not have", () => {
			const steps = parsePath(
				[p("header", 1), p("modelReferences", 5), p("reference", 1)],
				modelWithModelReferences
			);

			expect(steps).toHaveLength(1);
			expect(expandedSectionsFor(5)).toBeUndefined();
		});
	});

	describe("text style paths", () => {
		const modelWithTextStyles = {
			content: {
				textStyles: {
					definitions: [{ id: "ts-def-1" }, { id: "ts-def-2" }],
					references: [{ id: "ts-ref-1", refId: "frag-ts-def-1", model: "fragment-model-1" }],
				},
			},
		} as unknown as PartialPrintModel;

		it("maps [content, textStyles] with a resolvable index to [root, textStyle] steps", () => {
			const steps = parsePath([CONTENT, p("textStyles", 1)], modelWithTextStyles);
			expect(steps).toHaveLength(2);
			expect(steps[0].kind).toBe("root");
			expect((steps[0] as RootNavigationStep).type).toBe(SidebarItem.TEXT_STYLES);
			expect(steps[1].kind).toBe("textStyle");
			expect((steps[1] as TextStyleNavigationStep).textStyleId).toBe("ts-def-1");
		});

		it("maps [content, textStyles] with an out-of-range index to a single root step", () => {
			const steps = parsePath([CONTENT, p("textStyles", 99)], modelWithTextStyles);
			expect(steps).toHaveLength(1);
			expect(steps[0].kind).toBe("root");
			expect((steps[0] as RootNavigationStep).type).toBe(SidebarItem.TEXT_STYLES);
		});

		it("maps [content, textStyleReferences] with a resolvable reference to [root, textStyle] steps", () => {
			const steps = parsePath([CONTENT, p("textStyleReferences", 1)], modelWithTextStyles);
			expect(steps).toHaveLength(2);
			expect(steps[0].kind).toBe("root");
			expect((steps[0] as RootNavigationStep).type).toBe(SidebarItem.TEXT_STYLES);
			expect(steps[1].kind).toBe("textStyle");
			// resolves to the reference's own id, not refId — matches PrintEngineSelectors.textStyle's convention.
			expect((steps[1] as TextStyleNavigationStep).textStyleId).toBe("ts-ref-1");
		});

		it("maps [content, textStyleReferences] with an out-of-range index to a single root step", () => {
			const steps = parsePath([CONTENT, p("textStyleReferences", 99)], modelWithTextStyles);
			expect(steps).toHaveLength(1);
			expect(steps[0].kind).toBe("root");
		});
	});

	describe("fragment reference paths (segmentReferences/sectionReferences/watermarkReferences)", () => {
		const modelWithFragmentReferences = {
			content: {
				segments: {
					fragmentReferences: [{ id: "seg-ref-1", refId: "frag-seg-def-1", model: "fragment-model-1" }],
				},
				sections: {
					references: [{ id: "sec-ref-1", refId: "frag-sec-def-1", model: "fragment-model-1" }],
				},
				watermarks: {
					references: [{ id: "wm-ref-1", refId: "frag-wm-def-1", model: "fragment-model-1" }],
				},
			},
		} as unknown as PartialPrintModel;

		it("maps [content, segmentReferences] to a single canvasRoot SEGMENT step at the reference's own id", () => {
			const steps = parsePath([CONTENT, p("segmentReferences", 1)], modelWithFragmentReferences);
			expect(steps).toHaveLength(1);
			expect(steps[0].kind).toBe("canvasRoot");
			expect((steps[0] as CanvasRootNavigationStep).type).toBe(SidebarItem.SEGMENT);
			expect((steps[0] as CanvasRootNavigationStep).entityId).toBe("seg-ref-1");
		});

		it("maps [content, sectionReferences] to a single canvasRoot SECTION step", () => {
			const steps = parsePath([CONTENT, p("sectionReferences", 1)], modelWithFragmentReferences);
			expect(steps).toHaveLength(1);
			expect(steps[0].kind).toBe("canvasRoot");
			expect((steps[0] as CanvasRootNavigationStep).type).toBe(SidebarItem.SECTION);
			expect((steps[0] as CanvasRootNavigationStep).entityId).toBe("sec-ref-1");
		});

		it("maps [content, watermarkReferences] to a single canvasRoot WATERMARK step", () => {
			const steps = parsePath([CONTENT, p("watermarkReferences", 1)], modelWithFragmentReferences);
			expect(steps).toHaveLength(1);
			expect(steps[0].kind).toBe("canvasRoot");
			expect((steps[0] as CanvasRootNavigationStep).type).toBe(SidebarItem.WATERMARK);
			expect((steps[0] as CanvasRootNavigationStep).entityId).toBe("wm-ref-1");
		});

		it("returns [] for an out-of-range reference index", () => {
			expect(parsePath([CONTENT, p("segmentReferences", 99)], modelWithFragmentReferences)).toEqual([]);
		});

		it("returns [] when the referenced canvas type has no fragment references at all", () => {
			const emptyModel = { content: {} } as unknown as PartialPrintModel;
			expect(parsePath([CONTENT, p("sectionReferences", 1)], emptyModel)).toEqual([]);
		});
	});

	describe("element fragment placements (elementReferences carrying a model)", () => {
		// Unlike a local placement, a fragment placement is navigable without a sub-path.
		const SEGMENT_ID = "seg-with-fragment-placement";
		const modelWithElementFragmentPlacement = {
			content: {
				segments: {
					definitions: [
						{
							id: SEGMENT_ID,
							elementReferences: [
								{ id: "local-placement", refId: "local-element" },
								{ id: "fragment-placement", refId: "frag-element", model: "fragment-model-1" },
							],
						},
					],
				},
			},
		} as unknown as PartialPrintModel;

		const basePath: EntityInstancePath = [CONTENT, p("segments", 1)];

		it("maps a fragment placement without a sub-path to [canvasRoot, reference] steps", () => {
			const steps = parsePath([...basePath, p("elementReferences", 2)], modelWithElementFragmentPlacement);

			expect(steps).toHaveLength(2);
			expect(steps[0].kind).toBe("canvasRoot");
			expect((steps[0] as CanvasRootNavigationStep).entityId).toBe(SEGMENT_ID);
			expect(steps[1].kind).toBe("reference");
			expect((steps[1] as ReferenceNavigationStep).referenceId).toBe("fragment-placement");
			expect((steps[1] as ReferenceNavigationStep).reference.refId).toBe("frag-element");
		});

		it("still maps a local placement without a sub-path to a single canvasRoot step", () => {
			const steps = parsePath([...basePath, p("elementReferences", 1)], modelWithElementFragmentPlacement);

			expect(steps).toHaveLength(1);
			expect(steps[0].kind).toBe("canvasRoot");
		});

		it("maps a fragment placement with a pageBreakBehavior sub-path to [canvasRoot, reference] steps", () => {
			const steps = parsePath(
				[...basePath, p("elementReferences", 2), p("pageBreakBehavior", 1)],
				modelWithElementFragmentPlacement
			);

			expect(steps).toHaveLength(2);
			expect(steps[1].kind).toBe("reference");
			expect((steps[1] as ReferenceNavigationStep).referenceId).toBe("fragment-placement");
		});

		it("maps an out-of-range placement index to a single canvasRoot step instead of throwing", () => {
			const steps = parsePath([...basePath, p("elementReferences", 99)], modelWithElementFragmentPlacement);

			expect(steps).toHaveLength(1);
			expect(steps[0].kind).toBe("canvasRoot");
		});
	});
});

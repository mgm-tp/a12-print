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
	SegmentType,
	type PrintModel,
	type PrintModelElement,
	type PartialText,
	type Reference,
	type Segment,
	type Section,
	type Watermark,
	SegmentReferencePurpose,
	SegmentReferenceDirection,
} from "../../model/index.js";
import printModelFixture from "../../../../test/resources/print-models/PrintModel-with-text.json" with { type: "json" };
import { deserializeFixture, createComplexModel } from "../../../../test/typescript/test-utils/walker-test-utils.js";

import { PrintModelWalker } from "../print-model-walker.js";
import { DescendCommand, PrintModelVisitor, TraversalCommand } from "../print-model-visitor.js";
import { ReferenceListResolver } from "../reference-resolver.js";
import { DefaultSegmentIdResolver } from "../segment-id-resolver.js";
import { DefaultSectionIdResolver } from "../section-id-resolver.js";
import { DefaultWatermarkIdResolver } from "../watermark-id-resolver.js";
import { ReferenceElementListResolver } from "../reference-element-resolver.js";
import { PrintModelListResolver } from "../print-model-resolver.js";
import { PrintModelTrace } from "../print-model-trace.js";

const printModel = deserializeFixture(printModelFixture);

class CollectingVisitor extends PrintModelVisitor {
	public visitedElements: string[] = [];
	public visitedSegments: string[] = [];
	public visitedReferences: string[] = [];
	public beforeElements: string[] = [];
	public afterElements: string[] = [];
	public unresolvedElements: string[] = [];

	beforeVisitElement(element: PrintModelElement): void {
		this.beforeElements.push(element.type);
	}

	afterVisitElement(element: PrintModelElement): void {
		this.afterElements.push(element.type);
	}

	visitElement(element: PrintModelElement, printModelTrace: PrintModelTrace): TraversalCommand {
		this.visitedElements.push(element.type);
		return super.visitElement(element, printModelTrace);
	}

	visitSegment(segment: { id: string; title?: string }, _printModelTrace: PrintModelTrace): TraversalCommand {
		this.visitedSegments.push(segment.id);
		return TraversalCommand.CONTINUE;
	}

	visitReference(reference: Reference, printModelTrace: PrintModelTrace, index?: number): TraversalCommand {
		this.visitedReferences.push(reference.refId);
		return super.visitReference(reference, printModelTrace, index);
	}

	visitUnresolvedElement(reference: Reference, _printModelTrace: PrintModelTrace, _index?: number): TraversalCommand {
		this.unresolvedElements.push(reference.refId);
		return TraversalCommand.CONTINUE;
	}
}

const complexModel = createComplexModel();

function createComplexWalker(visitor: PrintModelVisitor, model: PrintModel = complexModel): PrintModelWalker {
	return createWalker(visitor, model);
}

function createWalker(visitor: PrintModelVisitor, model: PrintModel = printModel): PrintModelWalker {
	return new PrintModelWalker(
		visitor,
		ReferenceListResolver.fromModel(model),
		DefaultSegmentIdResolver.fromModel(model),
		DefaultSectionIdResolver.fromModel(model),
		DefaultWatermarkIdResolver.fromModel(model)
	);
}

describe("PrintModelWalker", () => {
	describe("walking a full print model", () => {
		it("visits the segment", () => {
			const visitor = new CollectingVisitor();
			const walker = createWalker(visitor);

			walker.walkPrintModel(printModel);

			expect(visitor.visitedSegments).toContain("ID_291d178b-85c4-4d9f-ac6f-12ea4e62083f");
		});

		it("visits all element references in the segment", () => {
			const visitor = new CollectingVisitor();
			const walker = createWalker(visitor);

			walker.walkPrintModel(printModel);

			expect(visitor.visitedReferences.length).toBeGreaterThan(0);
			expect(visitor.visitedReferences).toContain("aymJotzgBFBPVVufje123");
			expect(visitor.visitedReferences).toContain("54GejfuVVPBFBgztoJmya");
			expect(visitor.visitedReferences).toContain("aymJotzgBFBPVVufjeG45");
		});

		it("visits all resolved elements", () => {
			const visitor = new CollectingVisitor();
			const walker = createWalker(visitor);

			walker.walkPrintModel(printModel);

			expect(visitor.visitedElements).toContain("Text");
			expect(visitor.visitedElements).toContain("Field");
			expect(visitor.visitedElements).toContain("Calculation");
			expect(visitor.visitedElements).toContain("PageNumber");
			expect(visitor.visitedElements).toContain("PageNumberTotal");
		});

		it("calls beforeVisitElement and afterVisitElement for each element", () => {
			const visitor = new CollectingVisitor();
			const walker = createWalker(visitor);

			walker.walkPrintModel(printModel);

			expect(visitor.beforeElements.length).toBe(visitor.afterElements.length);
			expect(visitor.beforeElements.length).toBeGreaterThan(0);
		});

		it("descends into text entities", () => {
			const visitor = new CollectingVisitor();
			const walker = createWalker(visitor);

			walker.walkPrintModel(printModel);

			// Text element "aymJotzgBFBPVVufjeG56" contains entities referencing Field and Calculation
			expect(visitor.visitedReferences).toContain("Bh8Qr9ZG9283i87ZIPcY_");
			expect(visitor.visitedReferences).toContain("vkMPtkFmNFedvHa3l7fOo");
		});
	});

	describe("traversal commands", () => {
		it("HALT stops traversal and propagates up", () => {
			class HaltingVisitor extends CollectingVisitor {
				visitElement(element: PrintModelElement, _printModelTrace: PrintModelTrace): TraversalCommand {
					this.visitedElements.push(element.type);
					return TraversalCommand.HALT;
				}
			}

			const visitor = new HaltingVisitor();
			const walker = createWalker(visitor);

			const result = walker.walkPrintModel(printModel);

			expect(result).toBe(TraversalCommand.HALT);
			// Only the first leaf element should be visited before halt propagates
			expect(visitor.visitedElements.length).toBe(1);
		});

		it("STOP breaks the current reference loop but continues at higher level", () => {
			let refCount = 0;

			class StoppingVisitor extends CollectingVisitor {
				visitReference(
					reference: Reference,
					printModelTrace: PrintModelTrace,
					index?: number
				): TraversalCommand {
					refCount++;
					if (refCount === 1) {
						return TraversalCommand.STOP;
					}
					return super.visitReference(reference, printModelTrace, index);
				}
			}

			const visitor = new StoppingVisitor();
			const walker = createWalker(visitor);

			const result = walker.walkPrintModel(printModel);

			// STOP breaks out of walkReferences loop, but visitContainer still runs
			expect(result).toBe(TraversalCommand.CONTINUE);
		});

		it("CONTINUE keeps walking all elements", () => {
			const visitor = new CollectingVisitor();
			const walker = createWalker(visitor);

			const result = walker.walkPrintModel(printModel);

			expect(result).toBe(TraversalCommand.CONTINUE);
			expect(visitor.visitedElements.length).toBeGreaterThan(1);
		});
	});

	describe("descend commands", () => {
		it("NO_DESCEND skips child references", () => {
			class NoDescendVisitor extends CollectingVisitor {
				descendContainer(): DescendCommand {
					return DescendCommand.NO_DESCEND;
				}
			}

			const visitor = new NoDescendVisitor();
			const walker = createWalker(visitor);

			walker.walkPrintModel(printModel);

			// Should visit the segment container but no elements inside
			expect(visitor.visitedSegments.length).toBeGreaterThan(0);
			expect(visitor.visitedElements).toHaveLength(0);
		});

		it("ELEMENT_FIRST visits the container before descending", () => {
			const order: string[] = [];

			class ElementFirstVisitor extends CollectingVisitor {
				descendContainer(): DescendCommand {
					return DescendCommand.ELEMENT_FIRST;
				}

				visitSegment(segment: { id: string }): TraversalCommand {
					order.push("segment:" + segment.id);
					return TraversalCommand.CONTINUE;
				}

				visitElement(element: PrintModelElement, printModelTrace: PrintModelTrace): TraversalCommand {
					order.push("element:" + element.type);
					return super.visitElement(element, printModelTrace);
				}
			}

			const visitor = new ElementFirstVisitor();
			const walker = createWalker(visitor);

			walker.walkPrintModel(printModel);

			const segmentIndex = order.findIndex(e => e.startsWith("segment:"));
			const firstElementIndex = order.findIndex(e => e.startsWith("element:"));
			expect(segmentIndex).toBeLessThan(firstElementIndex);
		});

		it("DESCEND_FIRST visits children before the container", () => {
			const order: string[] = [];

			class DescendFirstVisitor extends CollectingVisitor {
				descendContainer(): DescendCommand {
					return DescendCommand.DESCEND_FIRST;
				}

				visitSegment(segment: { id: string }): TraversalCommand {
					order.push("segment:" + segment.id);
					return TraversalCommand.CONTINUE;
				}

				visitElement(element: PrintModelElement, printModelTrace: PrintModelTrace): TraversalCommand {
					order.push("element:" + element.type);
					return super.visitElement(element, printModelTrace);
				}
			}

			const visitor = new DescendFirstVisitor();
			const walker = createWalker(visitor);

			walker.walkPrintModel(printModel);

			const segmentIndex = order.findIndex(e => e.startsWith("segment:"));
			const firstElementIndex = order.findIndex(e => e.startsWith("element:"));
			expect(firstElementIndex).toBeLessThan(segmentIndex);
		});

		it("NO_DESCEND on print model skips content traversal", () => {
			let printModelVisited = false;

			class NoDescendPrintModelVisitor extends CollectingVisitor {
				descendPrintModel(): DescendCommand {
					return DescendCommand.NO_DESCEND;
				}

				visitPrintModel(): TraversalCommand {
					printModelVisited = true;
					return TraversalCommand.CONTINUE;
				}
			}

			const visitor = new NoDescendPrintModelVisitor();
			const walker = createWalker(visitor);

			walker.walkPrintModel(printModel);

			expect(printModelVisited).toBe(true);
			expect(visitor.visitedSegments).toHaveLength(0);
			expect(visitor.visitedElements).toHaveLength(0);
		});
	});

	describe("unresolved elements", () => {
		it("calls visitUnresolvedElement for unknown refIds", () => {
			const brokenModel: PrintModel = {
				...printModel,
				content: {
					...printModel.content,
					elementDefinitions: [], // no element definitions → references can't be resolved
				},
			};

			const visitor = new CollectingVisitor();
			const walker = createWalker(visitor, brokenModel);

			walker.walkPrintModel(brokenModel);

			expect(visitor.unresolvedElements.length).toBeGreaterThan(0);
			expect(visitor.visitedElements).toHaveLength(0);
		});

		it("calls visitUnresolvedSegment for unknown segment IDs", () => {
			let unresolvedSegmentId;

			class UnresolvedSegmentVisitor extends CollectingVisitor {
				visitUnresolvedSegment(id: string): TraversalCommand {
					unresolvedSegmentId = id;
					return TraversalCommand.CONTINUE;
				}
			}

			const brokenModel: PrintModel = {
				...printModel,
				content: {
					...printModel.content,
					segments: {
						...printModel.content.segments,
						definitions: [], // no segments → can't resolve structure IDs
					},
				},
			};

			const visitor = new UnresolvedSegmentVisitor();
			const walker = createWalker(visitor, brokenModel);

			walker.walkPrintModel(brokenModel);

			expect(unresolvedSegmentId).toBe("ID_291d178b-85c4-4d9f-ac6f-12ea4e62083f");
		});
	});

	describe("walkReferences", () => {
		it("walks individual references in sequence", () => {
			const visitor = new CollectingVisitor();
			const walker = createWalker(visitor);
			const references = printModel.content.segments.definitions[0].elementReferences;

			walker.walkReferences(references);

			// visitedReferences includes both direct references and nested text entities
			expect(visitor.visitedReferences.length).toBeGreaterThanOrEqual(references.length);
			for (const ref of references) {
				expect(visitor.visitedReferences).toContain(ref.refId);
			}
		});
	});

	describe("walkElement", () => {
		it("walks a single element directly", () => {
			const visitor = new CollectingVisitor();
			const walker = createWalker(visitor);
			const textElement = printModel.content.elementDefinitions.find(e => e.type === "Text");

			walker.walkElement(textElement as PartialText);

			expect(visitor.beforeElements).toContain("Text");
			expect(visitor.afterElements).toContain("Text");
		});
	});
});

describe("PrintModelWalker with complex model", () => {
	describe("sections and watermarks", () => {
		it("walks sections after structure", () => {
			const visitedSections: string[] = [];

			class SectionVisitor extends CollectingVisitor {
				visitSection(section: Section, _printModelTrace: PrintModelTrace): TraversalCommand {
					visitedSections.push(section.id);
					return TraversalCommand.CONTINUE;
				}
			}

			const visitor = new SectionVisitor();
			const walker = createComplexWalker(visitor);

			walker.walkPrintModel(complexModel);

			expect(visitedSections).toContain("sec-1");
		});

		it("walks watermarks after sections", () => {
			const visitedWatermarks: string[] = [];

			class WatermarkVisitor extends CollectingVisitor {
				visitWatermark(watermark: Watermark, _printModelTrace: PrintModelTrace): TraversalCommand {
					visitedWatermarks.push(watermark.id);
					return TraversalCommand.CONTINUE;
				}
			}

			const visitor = new WatermarkVisitor();
			const walker = createComplexWalker(visitor);

			walker.walkPrintModel(complexModel);

			expect(visitedWatermarks).toContain("wm-1");
		});

		it("calls visitUnresolvedSection for unknown section IDs", () => {
			let unresolvedId: string | undefined;

			class UnresolvedSectionVisitor extends CollectingVisitor {
				visitUnresolvedSection(id: string): TraversalCommand {
					unresolvedId = id;
					return TraversalCommand.CONTINUE;
				}
			}

			const model: PrintModel = {
				...complexModel,
				content: {
					...complexModel.content,
					sections: { id: "empty", definitions: [] },
				},
			};

			const visitor = new UnresolvedSectionVisitor();
			const walker = createComplexWalker(visitor, model);

			walker.walkPrintModel(model);

			expect(unresolvedId).toBe("sec-1");
		});

		it("calls visitUnresolvedWatermark for unknown watermark IDs", () => {
			let unresolvedId: string | undefined;

			class UnresolvedWatermarkVisitor extends CollectingVisitor {
				visitUnresolvedWatermark(id: string): TraversalCommand {
					unresolvedId = id;
					return TraversalCommand.CONTINUE;
				}
			}

			const model: PrintModel = {
				...complexModel,
				content: {
					...complexModel.content,
					watermarks: { id: "empty", definitions: [] },
				},
			};

			const visitor = new UnresolvedWatermarkVisitor();
			const walker = createComplexWalker(visitor, model);

			walker.walkPrintModel(model);

			expect(unresolvedId).toBe("wm-1");
		});

		it("STOP in sections breaks section loop but continues", () => {
			class StoppingSectionVisitor extends CollectingVisitor {
				visitSection(): TraversalCommand {
					return TraversalCommand.STOP;
				}
			}

			const visitor = new StoppingSectionVisitor();
			const walker = createComplexWalker(visitor);

			const result = walker.walkPrintModel(complexModel);

			expect(result).toBe(TraversalCommand.CONTINUE);
		});

		it("HALT in watermarks stops entire walk", () => {
			class HaltingWatermarkVisitor extends CollectingVisitor {
				visitWatermark(): TraversalCommand {
					return TraversalCommand.HALT;
				}
			}

			const visitor = new HaltingWatermarkVisitor();
			const walker = createComplexWalker(visitor);

			const result = walker.walkPrintModel(complexModel);

			expect(result).toBe(TraversalCommand.HALT);
		});
	});

	describe("descendPrintModel ELEMENT_FIRST", () => {
		it("visits print model before walking content", () => {
			const order: string[] = [];

			class ElementFirstPrintModelVisitor extends CollectingVisitor {
				descendPrintModel(): DescendCommand {
					return DescendCommand.ELEMENT_FIRST;
				}

				visitPrintModel(): TraversalCommand {
					order.push("printModel");
					return TraversalCommand.CONTINUE;
				}

				visitSegment(segment: { id: string }): TraversalCommand {
					order.push("segment:" + segment.id);
					return TraversalCommand.CONTINUE;
				}
			}

			const visitor = new ElementFirstPrintModelVisitor();
			const walker = createComplexWalker(visitor);

			walker.walkPrintModel(complexModel);

			expect(order[0]).toBe("printModel");
			expect(order).toContain("segment:seg-1");
		});

		it("skips content if visitPrintModel returns non-CONTINUE", () => {
			class HaltingPrintModelVisitor extends CollectingVisitor {
				descendPrintModel(): DescendCommand {
					return DescendCommand.ELEMENT_FIRST;
				}

				visitPrintModel(): TraversalCommand {
					return TraversalCommand.HALT;
				}
			}

			const visitor = new HaltingPrintModelVisitor();
			const walker = createComplexWalker(visitor);

			const result = walker.walkPrintModel(complexModel);

			expect(result).toBe(TraversalCommand.HALT);
			expect(visitor.visitedSegments).toHaveLength(0);
		});
	});

	describe("element type coverage", () => {
		it("visits all leaf element types", () => {
			const visitor = new CollectingVisitor();
			const walker = createComplexWalker(visitor);

			walker.walkPrintModel(complexModel);

			expect(visitor.visitedElements).toContain("Field");
			expect(visitor.visitedElements).toContain("Calculation");
			expect(visitor.visitedElements).toContain("Listing");
			expect(visitor.visitedElements).toContain("Image");
			expect(visitor.visitedElements).toContain("Line");
			expect(visitor.visitedElements).toContain("Expression");
			expect(visitor.visitedElements).toContain("BarChart");
			expect(visitor.visitedElements).toContain("LineChart");
			expect(visitor.visitedElements).toContain("PieChart");
			expect(visitor.visitedElements).toContain("Table");
			expect(visitor.visitedElements).toContain("TableLayout");
			expect(visitor.visitedElements).toContain("BoundingBox");
			expect(visitor.visitedElements).toContain("Area");
			expect(visitor.visitedElements).toContain("Override");
			expect(visitor.visitedElements).toContain("Switch");
		});

		it("descends into element references", () => {
			const visitor = new CollectingVisitor();
			const walker = createComplexWalker(visitor);

			walker.walkPrintModel(complexModel);

			// BoundingBox contains a ref to "el-line"
			expect(visitor.visitedReferences).toContain("el-line");
			// Area contains a ref to "el-image"
			expect(visitor.visitedReferences).toContain("el-image");
			// Table column references "el-field"
			expect(visitor.visitedReferences).toContain("el-field");
			// TableLayout cell references "el-calc"
			expect(visitor.visitedReferences).toContain("el-calc");
			// Switch case references "el-calc"
			expect(visitor.visitedReferences).toContain("el-calc");
			// Override has boundingBox.elementReferences pointing to "el-field"
			expect(visitor.visitedReferences).toContain("el-field");
		});
	});

	describe("walkSegment", () => {
		it("walks a segment directly", () => {
			const visitor = new CollectingVisitor();
			const walker = createComplexWalker(visitor);
			const segment = complexModel.content.segments.definitions[0];

			walker.walkSegment(segment);

			expect(visitor.visitedSegments).toContain("seg-1");
			expect(visitor.visitedElements.length).toBeGreaterThan(0);
		});
	});

	describe("walkSection", () => {
		it("walks a section directly", () => {
			const visitedSections: string[] = [];

			class SectionVisitor extends CollectingVisitor {
				visitSection(section: Section): TraversalCommand {
					visitedSections.push(section.id);
					return TraversalCommand.CONTINUE;
				}
			}

			const visitor = new SectionVisitor();
			const walker = createComplexWalker(visitor);
			const section = complexModel.content.sections?.definitions?.[0];

			if (!section) throw new Error("Expected section to be defined");

			walker.walkSection(section);

			expect(visitedSections).toContain("sec-1");
		});
	});

	describe("DIN template", () => {
		const createComplexWalkerWithReferencedModel = (visitor: CollectingVisitor, referencedModel: PrintModel) =>
			new PrintModelWalker(
				visitor,
				ReferenceListResolver.fromModel(complexModel),
				DefaultSegmentIdResolver.fromModel(complexModel),
				DefaultSectionIdResolver.fromModel(complexModel),
				DefaultWatermarkIdResolver.fromModel(complexModel),
				new ReferenceElementListResolver([
					{
						id: "ref-elem-1",
						referenceModel: "ref-model",
						purpose: SegmentReferencePurpose.DINTemplate,
						direction: SegmentReferenceDirection.IncomingReference,
					},
				]),
				new PrintModelListResolver([referencedModel])
			);

		it("walkDinTemplate returns CONTINUE when referenceId or refId is missing", () => {
			const visitor = new CollectingVisitor();
			const walker = createComplexWalker(visitor);

			const result = walker.walkDinTemplate({ id: "din-1" }, PrintModelTrace.ROOT_PATH);

			expect(result).toBe(TraversalCommand.CONTINUE);
		});

		it("walkDinTemplate calls visitUnresolvedDinTemplate when segment cannot be resolved", () => {
			let unresolvedTemplateId: string | undefined;

			class DinVisitor extends CollectingVisitor {
				visitUnresolvedDinTemplate(templateId: string): TraversalCommand {
					unresolvedTemplateId = templateId;
					return TraversalCommand.CONTINUE;
				}
			}

			const visitor = new DinVisitor();
			const referencedModel: PrintModel = {
				header: { id: "ref-model" },
				content: {
					id: "rc-1",
					general: { id: "rg-1", structure: [], sections: [], watermarks: [], textStyles: [] },
					segments: { id: "rs-1", definitions: [], references: [] },
					elementDefinitions: [],
					textStyles: { id: "rts-1", definitions: [] },
				},
			} as unknown as PrintModel;

			const walker = createComplexWalkerWithReferencedModel(visitor, referencedModel);

			const result = walker.walkDinTemplate(
				{ id: "din-1", referenceId: "ref-elem-1", refId: "nonexistent-segment" },
				PrintModelTrace.ROOT_PATH
			);

			expect(result).toBe(TraversalCommand.CONTINUE);
			expect(unresolvedTemplateId).toBe("nonexistent-segment");
		});

		it("walkDinTemplate resolves and visits a DIN template segment", () => {
			let dinTemplateVisited = false;

			class DinVisitor extends CollectingVisitor {
				visitDINTemplate(_dinTemplate: Segment): TraversalCommand {
					dinTemplateVisited = true;
					return TraversalCommand.CONTINUE;
				}
			}

			const dinSegment: Segment = {
				id: "din-seg-1",
				title: "DIN Segment",
				type: SegmentType.Default,
				elementReferences: [],
				dataContexts: [],
			};

			const referencedModel: PrintModel = {
				header: { id: "ref-model" },
				content: {
					id: "rc-1",
					general: { id: "rg-1", structure: ["din-seg-1"], sections: [], watermarks: [], textStyles: [] },
					segments: { id: "rs-1", definitions: [dinSegment], references: [] },
					elementDefinitions: [],
					textStyles: { id: "rts-1", definitions: [] },
				},
			} as unknown as PrintModel;

			const visitor = new DinVisitor();
			const walker = createComplexWalkerWithReferencedModel(visitor, referencedModel);

			const result = walker.walkDinTemplate(
				{ id: "din-1", referenceId: "ref-elem-1", refId: "din-seg-1" },
				PrintModelTrace.ROOT_PATH
			);

			expect(result).toBe(TraversalCommand.CONTINUE);
			expect(dinTemplateVisited).toBe(true);
		});
	});

	describe("HALT and STOP propagation in structure", () => {
		it("HALT in structure stops further segments", () => {
			class HaltSegmentVisitor extends CollectingVisitor {
				visitSegment(): TraversalCommand {
					return TraversalCommand.HALT;
				}
			}

			const visitor = new HaltSegmentVisitor();
			const walker = createComplexWalker(visitor);

			const result = walker.walkPrintModel(complexModel);

			expect(result).toBe(TraversalCommand.HALT);
		});

		it("STOP in structure breaks loop but returns CONTINUE", () => {
			class StopSegmentVisitor extends CollectingVisitor {
				visitSegment(): TraversalCommand {
					return TraversalCommand.STOP;
				}
			}

			const visitor = new StopSegmentVisitor();
			const walker = createComplexWalker(visitor);

			const result = walker.walkPrintModel(complexModel);

			// STOP breaks the structure loop; sections/watermarks still run
			expect(result).toBe(TraversalCommand.CONTINUE);
		});
	});
});

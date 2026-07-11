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
import { SegmentType } from "../../model/index.js";
import type {
	PartialMetadata,
	PartialPrintModel,
	PartialPrintModelElement,
	PartialReference,
	PartialSection,
	PartialSegment,
	PartialWatermark,
} from "../../model/partial.js";
import type { ExtendedEntityInstancePathBuilder } from "../../errors/extended-entity-instance-path.js";
import printModelFixture from "../../../../test/resources/print-models/PrintModel-with-text.json" with { type: "json" };
import {
	deserializeFixture,
	makePlaceableRef,
	createComplexPartialModel,
} from "../../../../test/typescript/test-utils/walker-test-utils.js";

import { DescendCommand, TraversalCommand } from "../print-model-visitor.js";
import { PartialPrintModelVisitor } from "../partial/partial-print-model-visitor.js";
import { createPartialPrintModelWalker } from "../partial/create-partial-print-model-walker.js";
import type { PartialPrintModelTrace } from "../partial/partial-print-model-trace.js";

const printModel = deserializeFixture(printModelFixture);
const partialModel = printModel as PartialPrintModel;

class PartialCollectingVisitor extends PartialPrintModelVisitor {
	public visitedElements: string[] = [];
	public visitedSegments: string[] = [];
	public visitedReferences: string[] = [];
	public beforeElements: string[] = [];
	public afterElements: string[] = [];
	public unresolvedElements: unknown[] = [];
	public metadataVisited = false;
	public undefinedElements: unknown[] = [];

	beforeVisitElement(element: PartialPrintModelElement): void {
		this.beforeElements.push(element.type ?? "unknown");
	}

	afterVisitElement(element: PartialPrintModelElement): void {
		this.afterElements.push(element.type ?? "unknown");
	}

	visitElement(
		element: PartialPrintModelElement,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		this.visitedElements.push(element.type ?? "unknown");
		return super.visitElement(element, printModelTrace, printModelPath);
	}

	visitSegment(
		segment: PartialSegment,
		_printModelTrace: PartialPrintModelTrace,
		_printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		this.visitedSegments.push(segment.id ?? "unknown");
		return TraversalCommand.CONTINUE;
	}

	visitReference(
		reference: PartialReference,
		printModelTrace: PartialPrintModelTrace,
		index: number,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		this.visitedReferences.push(reference.refId ?? "unknown");
		return super.visitReference(reference, printModelTrace, index, printModelPath);
	}

	visitMetadata(_metadata: PartialMetadata, _printModelPath: ExtendedEntityInstancePathBuilder): TraversalCommand {
		this.metadataVisited = true;
		return TraversalCommand.CONTINUE;
	}

	visitUnresolvedElement(
		reference: PartialReference,
		_printModelTrace: PartialPrintModelTrace,
		_index?: number
	): TraversalCommand {
		this.unresolvedElements.push(reference.refId);
		return TraversalCommand.CONTINUE;
	}

	visitUndefinedElement(
		element: PartialPrintModelElement,
		_printModelTrace: PartialPrintModelTrace
	): TraversalCommand {
		this.undefinedElements.push(element);
		return TraversalCommand.CONTINUE;
	}
}

describe("PartialPrintModelWalker", () => {
	describe("walking a partial print model", () => {
		it("visits the segment", () => {
			const visitor = new PartialCollectingVisitor();
			const walker = createPartialPrintModelWalker(partialModel, visitor);

			walker.walkPrintModel(partialModel);

			expect(visitor.visitedSegments).toContain("ID_291d178b-85c4-4d9f-ac6f-12ea4e62083f");
		});

		it("visits all element references in the segment", () => {
			const visitor = new PartialCollectingVisitor();
			const walker = createPartialPrintModelWalker(partialModel, visitor);

			walker.walkPrintModel(partialModel);

			expect(visitor.visitedReferences.length).toBeGreaterThan(0);
			expect(visitor.visitedReferences).toContain("aymJotzgBFBPVVufje123");
			expect(visitor.visitedReferences).toContain("54GejfuVVPBFBgztoJmya");
		});

		it("visits all resolved elements", () => {
			const visitor = new PartialCollectingVisitor();
			const walker = createPartialPrintModelWalker(partialModel, visitor);

			walker.walkPrintModel(partialModel);

			expect(visitor.visitedElements).toContain("Text");
			expect(visitor.visitedElements).toContain("Field");
			expect(visitor.visitedElements).toContain("Calculation");
			expect(visitor.visitedElements).toContain("PageNumber");
			expect(visitor.visitedElements).toContain("PageNumberTotal");
		});

		it("calls beforeVisitElement and afterVisitElement for each element", () => {
			const visitor = new PartialCollectingVisitor();
			const walker = createPartialPrintModelWalker(partialModel, visitor);

			walker.walkPrintModel(partialModel);

			expect(visitor.beforeElements.length).toBe(visitor.afterElements.length);
			expect(visitor.beforeElements.length).toBeGreaterThan(0);
		});

		it("visits metadata", () => {
			const visitor = new PartialCollectingVisitor();
			const walker = createPartialPrintModelWalker(partialModel, visitor);

			walker.walkPrintModel(partialModel);

			expect(visitor.metadataVisited).toBe(true);
		});
	});

	describe("handling missing/partial data", () => {
		it("returns HALT when content is undefined", () => {
			const modelWithoutContent: PartialPrintModel = {
				header: partialModel.header,
			};

			const visitor = new PartialCollectingVisitor();
			const walker = createPartialPrintModelWalker(modelWithoutContent, visitor);

			const result = walker.walkPrintModel(modelWithoutContent);

			expect(result).toBe(TraversalCommand.HALT);
			expect(visitor.visitedElements).toHaveLength(0);
		});

		it("returns CONTINUE when general is undefined", () => {
			const modelWithoutGeneral: PartialPrintModel = {
				header: partialModel.header,
				content: {
					id: "test",
				},
			};

			const visitor = new PartialCollectingVisitor();
			const walker = createPartialPrintModelWalker(modelWithoutGeneral, visitor);

			const result = walker.walkPrintModel(modelWithoutGeneral);

			expect(result).toBe(TraversalCommand.CONTINUE);
			expect(visitor.visitedSegments).toHaveLength(0);
		});

		it("skips metadata when not present", () => {
			const modelWithoutMetadata: PartialPrintModel = {
				...partialModel,
				content: {
					...partialModel.content,
					id: "test-content",
					general: {
						...partialModel.content?.general,
						id: "test-general",
						metadata: undefined,
					},
				},
			};

			const visitor = new PartialCollectingVisitor();
			const walker = createPartialPrintModelWalker(modelWithoutMetadata, visitor);

			walker.walkPrintModel(modelWithoutMetadata);

			expect(visitor.metadataVisited).toBe(false);
		});
	});

	describe("traversal commands", () => {
		it("HALT stops traversal and propagates up", () => {
			class HaltingVisitor extends PartialCollectingVisitor {
				visitElement(
					element: PartialPrintModelElement,
					_printModelTrace: PartialPrintModelTrace,
					_printModelPath: ExtendedEntityInstancePathBuilder
				): TraversalCommand {
					this.visitedElements.push(element.type ?? "unknown");
					return TraversalCommand.HALT;
				}
			}

			const visitor = new HaltingVisitor();
			const walker = createPartialPrintModelWalker(partialModel, visitor);

			const result = walker.walkPrintModel(partialModel);

			expect(result).toBe(TraversalCommand.HALT);
			expect(visitor.visitedElements.length).toBe(1);
		});

		it("CONTINUE keeps walking all elements", () => {
			const visitor = new PartialCollectingVisitor();
			const walker = createPartialPrintModelWalker(partialModel, visitor);

			const result = walker.walkPrintModel(partialModel);

			expect(result).toBe(TraversalCommand.CONTINUE);
			expect(visitor.visitedElements.length).toBeGreaterThan(1);
		});
	});

	describe("descend commands", () => {
		it("NO_DESCEND skips child references", () => {
			class NoDescendVisitor extends PartialCollectingVisitor {
				descendContainer(): DescendCommand {
					return DescendCommand.NO_DESCEND;
				}
			}

			const visitor = new NoDescendVisitor();
			const walker = createPartialPrintModelWalker(partialModel, visitor);

			walker.walkPrintModel(partialModel);

			expect(visitor.visitedSegments.length).toBeGreaterThan(0);
			expect(visitor.visitedElements).toHaveLength(0);
		});

		it("ELEMENT_FIRST visits the container before descending", () => {
			const order: string[] = [];

			class ElementFirstVisitor extends PartialCollectingVisitor {
				descendContainer(): DescendCommand {
					return DescendCommand.ELEMENT_FIRST;
				}

				visitSegment(
					segment: PartialSegment,
					_printModelTrace: PartialPrintModelTrace,
					_printModelPath: ExtendedEntityInstancePathBuilder
				): TraversalCommand {
					order.push("segment:" + segment.id);
					return TraversalCommand.CONTINUE;
				}

				visitElement(
					element: PartialPrintModelElement,
					printModelTrace: PartialPrintModelTrace,
					printModelPath: ExtendedEntityInstancePathBuilder
				): TraversalCommand {
					order.push("element:" + element.type);
					return super.visitElement(element, printModelTrace, printModelPath);
				}
			}

			const visitor = new ElementFirstVisitor();
			const walker = createPartialPrintModelWalker(partialModel, visitor);

			walker.walkPrintModel(partialModel);

			const segmentIndex = order.findIndex(e => e.startsWith("segment:"));
			const firstElementIndex = order.findIndex(e => e.startsWith("element:"));
			expect(segmentIndex).toBeLessThan(firstElementIndex);
		});
	});

	describe("unresolved elements", () => {
		it("calls visitUnresolvedElement for unknown refIds", () => {
			const brokenModel: PartialPrintModel = {
				...partialModel,
				content: {
					...partialModel.content,
					id: "test-content",
					elementDefinitions: [],
				},
			};

			const visitor = new PartialCollectingVisitor();
			const walker = createPartialPrintModelWalker(brokenModel, visitor);

			walker.walkPrintModel(brokenModel);

			expect(visitor.unresolvedElements.length).toBeGreaterThan(0);
			expect(visitor.visitedElements).toHaveLength(0);
		});
	});
});

describe("PartialPrintModelWalker with complex model", () => {
	const complexModel = createComplexPartialModel();

	describe("sections and watermarks", () => {
		it("walks sections after structure", () => {
			const visitedSections: string[] = [];

			class SectionVisitor extends PartialCollectingVisitor {
				visitSection(
					section: PartialSection,
					_printModelTrace: PartialPrintModelTrace,
					_printModelPath: ExtendedEntityInstancePathBuilder
				): TraversalCommand {
					visitedSections.push(section.id);
					return TraversalCommand.CONTINUE;
				}
			}

			const visitor = new SectionVisitor();
			const walker = createPartialPrintModelWalker(complexModel, visitor);

			walker.walkPrintModel(complexModel);

			expect(visitedSections).toContain("sec-1");
		});

		it("walks watermarks after sections", () => {
			const visitedWatermarks: string[] = [];

			class WatermarkVisitor extends PartialCollectingVisitor {
				visitWatermark(
					watermark: PartialWatermark,
					_printModelTrace: PartialPrintModelTrace,
					_printModelPath: ExtendedEntityInstancePathBuilder
				): TraversalCommand {
					visitedWatermarks.push(watermark.id);
					return TraversalCommand.CONTINUE;
				}
			}

			const visitor = new WatermarkVisitor();
			const walker = createPartialPrintModelWalker(complexModel, visitor);

			walker.walkPrintModel(complexModel);

			expect(visitedWatermarks).toContain("wm-1");
		});

		it("calls visitUnresolvedSection for unknown section IDs", () => {
			let unresolvedId: string | undefined;

			class UnresolvedSectionVisitor extends PartialCollectingVisitor {
				visitUnresolvedSection(id: string): TraversalCommand {
					unresolvedId = id;
					return TraversalCommand.CONTINUE;
				}
			}

			const model: PartialPrintModel = {
				...complexModel,
				content: {
					...complexModel.content,
					id: "test-content",
					sections: { id: "empty", definitions: [] },
				},
			};

			const visitor = new UnresolvedSectionVisitor();
			const walker = createPartialPrintModelWalker(model, visitor);

			walker.walkPrintModel(model);

			expect(unresolvedId).toBe("sec-1");
		});

		it("calls visitUnresolvedWatermark for unknown watermark IDs", () => {
			let unresolvedId: string | undefined;

			class UnresolvedWatermarkVisitor extends PartialCollectingVisitor {
				visitUnresolvedWatermark(id: string): TraversalCommand {
					unresolvedId = id;
					return TraversalCommand.CONTINUE;
				}
			}

			const model: PartialPrintModel = {
				...complexModel,
				content: {
					...complexModel.content,
					id: "test-content",
					watermarks: { id: "empty", definitions: [] },
				},
			};

			const visitor = new UnresolvedWatermarkVisitor();
			const walker = createPartialPrintModelWalker(model, visitor);

			walker.walkPrintModel(model);

			expect(unresolvedId).toBe("wm-1");
		});

		it("HALT in sections stops entire walk", () => {
			class HaltingSectionVisitor extends PartialCollectingVisitor {
				visitSection(): TraversalCommand {
					return TraversalCommand.HALT;
				}
			}

			const visitor = new HaltingSectionVisitor();
			const walker = createPartialPrintModelWalker(complexModel, visitor);

			const result = walker.walkPrintModel(complexModel);

			expect(result).toBe(TraversalCommand.HALT);
		});

		it("STOP in watermarks breaks watermark loop", () => {
			class StoppingWatermarkVisitor extends PartialCollectingVisitor {
				visitWatermark(): TraversalCommand {
					return TraversalCommand.STOP;
				}
			}

			const visitor = new StoppingWatermarkVisitor();
			const walker = createPartialPrintModelWalker(complexModel, visitor);

			const result = walker.walkPrintModel(complexModel);

			expect(result).toBe(TraversalCommand.CONTINUE);
		});
	});

	describe("descendPrintModel ELEMENT_FIRST", () => {
		it("visits print model before walking content", () => {
			const order: string[] = [];

			class ElementFirstPrintModelVisitor extends PartialCollectingVisitor {
				descendPrintModel(): DescendCommand {
					return DescendCommand.ELEMENT_FIRST;
				}

				visitPrintModel(): TraversalCommand {
					order.push("printModel");
					return TraversalCommand.CONTINUE;
				}

				visitSegment(
					segment: PartialSegment,
					_printModelTrace: PartialPrintModelTrace,
					_printModelPath: ExtendedEntityInstancePathBuilder
				): TraversalCommand {
					order.push("segment:" + segment.id);
					return TraversalCommand.CONTINUE;
				}
			}

			const visitor = new ElementFirstPrintModelVisitor();
			const walker = createPartialPrintModelWalker(complexModel, visitor);

			walker.walkPrintModel(complexModel);

			expect(order[0]).toBe("printModel");
			expect(order).toContain("segment:seg-1");
		});

		it("skips content if visitPrintModel returns non-CONTINUE", () => {
			class HaltingPrintModelVisitor extends PartialCollectingVisitor {
				descendPrintModel(): DescendCommand {
					return DescendCommand.ELEMENT_FIRST;
				}

				visitPrintModel(): TraversalCommand {
					return TraversalCommand.HALT;
				}
			}

			const visitor = new HaltingPrintModelVisitor();
			const walker = createPartialPrintModelWalker(complexModel, visitor);

			const result = walker.walkPrintModel(complexModel);

			expect(result).toBe(TraversalCommand.HALT);
			expect(visitor.visitedSegments).toHaveLength(0);
		});
	});

	describe("element type coverage", () => {
		it("visits all leaf element types", () => {
			const visitor = new PartialCollectingVisitor();
			const walker = createPartialPrintModelWalker(complexModel, visitor);

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
			const visitor = new PartialCollectingVisitor();
			const walker = createPartialPrintModelWalker(complexModel, visitor);

			walker.walkPrintModel(complexModel);

			expect(visitor.visitedReferences).toContain("el-line");
			expect(visitor.visitedReferences).toContain("el-image");
			expect(visitor.visitedReferences).toContain("el-field");
			expect(visitor.visitedReferences).toContain("el-calc");
			expect(visitor.visitedReferences).toContain("el-calc");
		});
	});

	describe("walkSegment and walkSection", () => {
		it("walkSegment walks a segment directly", () => {
			const visitor = new PartialCollectingVisitor();
			const walker = createPartialPrintModelWalker(complexModel, visitor);
			const segment = complexModel.content?.segments?.definitions?.[0];

			if (!segment) throw new Error("Expected segment to be defined");

			walker.walkSegment(segment);

			expect(visitor.visitedSegments).toContain("seg-1");
			expect(visitor.visitedElements.length).toBeGreaterThan(0);
		});

		it("walkSection walks a section directly", () => {
			const visitedSections: string[] = [];

			class SectionVisitor extends PartialCollectingVisitor {
				visitSection(
					section: PartialSection,
					_printModelTrace: PartialPrintModelTrace,
					_printModelPath: ExtendedEntityInstancePathBuilder
				): TraversalCommand {
					visitedSections.push(section.id);
					return TraversalCommand.CONTINUE;
				}
			}

			const visitor = new SectionVisitor();
			const walker = createPartialPrintModelWalker(complexModel, visitor);
			const section = complexModel.content?.sections?.definitions?.[0];

			if (!section) throw new Error("Expected section to be defined");

			walker.walkSection(section);

			expect(visitedSections).toContain("sec-1");
		});

		it("walkWatermark walks a watermark directly", () => {
			const visitedWatermarks: string[] = [];

			class WatermarkVisitor extends PartialCollectingVisitor {
				visitWatermark(
					watermark: PartialWatermark,
					_printModelTrace: PartialPrintModelTrace,
					_printModelPath: ExtendedEntityInstancePathBuilder
				): TraversalCommand {
					visitedWatermarks.push(watermark.id);
					return TraversalCommand.CONTINUE;
				}
			}

			const visitor = new WatermarkVisitor();
			const walker = createPartialPrintModelWalker(complexModel, visitor);
			const watermark = complexModel.content?.watermarks?.definitions?.[0];

			if (!watermark) throw new Error("Expected watermark to be defined");

			walker.walkWatermark(watermark);

			expect(visitedWatermarks).toContain("wm-1");
		});
	});

	describe("visitUndefinedElement", () => {
		it("calls visitUndefinedElement for elements without valid type", () => {
			const modelWithBadElement: PartialPrintModel = {
				...complexModel,
				content: {
					...complexModel.content,
					id: "content-bad",
					segments: {
						...complexModel.content?.segments,
						id: "segs-bad",
						definitions: [
							{
								id: "seg-bad",
								title: "Bad Segment",
								type: SegmentType.Default,
								elementReferences: [makePlaceableRef("bad-ref", "el-bad")],
								dataContexts: [],
							},
						],
					},
					general: {
						...complexModel.content?.general,
						id: "gen-bad",
						structure: ["seg-bad"],
						sections: [],
						watermarks: [],
					},
					elementDefinitions: [{ id: "el-bad" }], // no type → undefined element
				},
			};

			const visitor = new PartialCollectingVisitor();
			const walker = createPartialPrintModelWalker(modelWithBadElement, visitor);

			walker.walkPrintModel(modelWithBadElement);

			expect(visitor.undefinedElements.length).toBe(1);
		});
	});

	describe("DESCEND_FIRST visits children before container", () => {
		it("visits elements before segment with DESCEND_FIRST", () => {
			const order: string[] = [];

			class DescendFirstVisitor extends PartialCollectingVisitor {
				descendContainer(): DescendCommand {
					return DescendCommand.DESCEND_FIRST;
				}

				visitSegment(
					segment: PartialSegment,
					_printModelTrace: PartialPrintModelTrace,
					_printModelPath: ExtendedEntityInstancePathBuilder
				): TraversalCommand {
					order.push("segment:" + segment.id);
					return TraversalCommand.CONTINUE;
				}

				visitElement(
					element: PartialPrintModelElement,
					printModelTrace: PartialPrintModelTrace,
					printModelPath: ExtendedEntityInstancePathBuilder
				): TraversalCommand {
					order.push("element:" + element.type);
					return super.visitElement(element, printModelTrace, printModelPath);
				}
			}

			const visitor = new DescendFirstVisitor();
			const walker = createPartialPrintModelWalker(complexModel, visitor);

			walker.walkPrintModel(complexModel);

			const segmentIndex = order.findIndex(e => e.startsWith("segment:"));
			const firstElementIndex = order.findIndex(e => e.startsWith("element:"));
			expect(firstElementIndex).toBeLessThan(segmentIndex);
		});
	});

	describe("STOP in references", () => {
		it("STOP in visitReference breaks reference loop but continues", () => {
			let refCount = 0;

			class StoppingRefVisitor extends PartialCollectingVisitor {
				visitReference(
					reference: PartialReference,
					printModelTrace: PartialPrintModelTrace,
					index: number,
					printModelPath: ExtendedEntityInstancePathBuilder
				): TraversalCommand {
					refCount++;
					if (refCount === 1) {
						return TraversalCommand.STOP;
					}
					return super.visitReference(reference, printModelTrace, index, printModelPath);
				}
			}

			const visitor = new StoppingRefVisitor();
			const walker = createPartialPrintModelWalker(complexModel, visitor);

			const result = walker.walkPrintModel(complexModel);

			expect(result).toBe(TraversalCommand.CONTINUE);
		});
	});
});

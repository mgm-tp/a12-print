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
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs/promises";

import { jest } from "@jest/globals";

import type {
	PartialBoundingBox,
	PartialOverride,
	PartialPlaceableReference,
	PartialPrintModel,
	PartialPrintModelElement,
	PartialReference,
	PartialSection,
	PartialSegment,
	PartialTableColumnReference,
	PartialTableLayoutCellReference,
	PartialWatermark,
	Segment,
} from "@com.mgmtp.a12.print/print-model-api/model";
import type { PartialPrintModelWalker } from "@com.mgmtp.a12.print/print-model-api/walker";
import {
	createPartialPrintModelWalker,
	extendContainerReferencesBasePath,
	getElementDefinitionBasePath,
	getPartialReferences,
	PartialPrintModelTrace,
	PartialPrintModelVisitor,
	TraversalCommand,
} from "@com.mgmtp.a12.print/print-model-api/walker";

import { PrintModelCreator } from "../../../a12internal/utils/print-model-creator.js";
import { PrintModelMarshaller } from "../../../marshaller/index.js";
import testPartialPrintModel from "../../../../../test/resources/print-models/Print-model-with-pending-changes.json" with { type: "json" };
import printModelWithDinTemplate from "../../../../../test/resources/print-models/PrintModel-with-din-template.json" with { type: "json" };
import { PartialPrintModelPathVisitor } from "../../../../../test/typescript/test-utils/walker/partial-print-model-path-visitor.js";
import { LogHandler } from "../../../a12internal/transaction-log/log-handler.js";
import { Log } from "../../../a12internal/transaction-log/log.js";

const printModelMarshaller = new PrintModelMarshaller();

const deserializedPrintModelWithDinTemplate = printModelMarshaller.deserialize(printModelWithDinTemplate).result!;

describe("PartialPrintModelWalker", () => {
	let testPrintModel: PartialPrintModel;

	beforeAll(async () => {
		const content = await fs.readFile("src/test/resources/transaction-log/Print-model-with-pending-changes.wal", {
			encoding: "utf8",
		});

		const logEntries = LogHandler.readLogInput(content);

		const deserializeResult = printModelMarshaller.deserialize(testPartialPrintModel);
		const printModel = deserializeResult.result;

		if (!printModel) {
			throw new Error("Cannot read test print model");
		}
		const { transactionLogStore } = Log.createStores(logEntries, printModel);
		testPrintModel = PrintModelCreator.createStoreModel(transactionLogStore);
	});

	describe("Test Print Model Paths", () => {
		it("Should track paths correct", async () => {
			const visitor = new PartialPrintModelPathVisitor();
			jest.spyOn(visitor, "visitUnresolvedDinTemplate").mockClear().mockReturnValue(TraversalCommand.STOP);
			const walker = createPartialPrintModelWalker(testPrintModel, visitor);

			walker.walkPrintModel(testPrintModel);

			expect(visitor.visitedPaths).toMatchSnapshot();
		});

		it("Should resolve the same paths for each starting point", async () => {
			const visitor = new PartialPrintModelPathVisitor();
			jest.spyOn(visitor, "visitUnresolvedDinTemplate").mockClear().mockReturnValue(TraversalCommand.STOP);
			const walker = createPartialPrintModelWalker(testPrintModel, visitor);

			walker.walkPrintModel(testPrintModel);
			walker.walkPrintModelContent(testPrintModel.content as any);
			walker.walkWatermark(testPrintModel.content?.watermarks?.definitions?.at(0) as any, 0);
			walker.walkWatermark(testPrintModel.content?.watermarks?.definitions?.at(1) as any, 1);
			walker.walkSegment(testPrintModel.content?.segments?.definitions?.at(0) as any, 0);

			const allElements = testPrintModel?.content?.elementDefinitions || [];
			for (let i = 0; i < allElements.length!; i++) {
				const element = allElements[i];
				const basePath = getElementDefinitionBasePath(element as any, i);
				walker.walkElement(element!, PartialPrintModelTrace.ROOT_PATH, basePath, i);

				const references = getPartialReferences(element!) || [];
				const instancePath = PartialPrintModelTrace.ROOT_PATH.with(element!, i);
				walker.walkReferences(references, instancePath, basePath);

				for (let j = 0; j < references.length; j++) {
					const referenceBasePath = extendContainerReferencesBasePath(element, basePath as any, j);
					walker.walkReference(references[j], instancePath, referenceBasePath, j);
				}
			}
			expect(visitor.visitedIdToPathMap).toMatchSnapshot();
			const inconsistentPaths = [...visitor.visitedIdToPathMap.entries()].filter(
				([_, paths]) => paths.size !== 1
			);

			expect(inconsistentPaths).toEqual([]);
		});
	});

	describe("Visitor that visits every single element", () => {
		class PrintModelVisitorEverything extends PartialPrintModelVisitor {
			visitedElements: PartialPrintModelElement[] = [];
			visitedSegments: PartialSegment[] = [];
			visitedSections: PartialSection[] = [];
			visitedWatermarks: PartialWatermark[] = [];

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			afterVisitElement(element: PartialPrintModelElement) {
				// do nothing
			}

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			beforeVisitElement(element: PartialPrintModelElement) {
				// do nothing
			}

			visitSegment(segment: PartialSegment): TraversalCommand {
				this.visitedSegments.push(segment);
				return TraversalCommand.CONTINUE;
			}

			visitSection(section: PartialSection): TraversalCommand {
				this.visitedSections.push(section);
				return TraversalCommand.CONTINUE;
			}

			visitWatermark(watermark: PartialWatermark): TraversalCommand {
				this.visitedWatermarks.push(watermark);
				return TraversalCommand.CONTINUE;
			}

			defaultVisitElement(element: PartialPrintModelElement): TraversalCommand {
				this.visitedElements.push(element);
				return TraversalCommand.CONTINUE;
			}

			visitUnresolvedDinTemplate(): TraversalCommand {
				return TraversalCommand.STOP;
			}
		}

		it("Start at PrintModel", async () => {
			const visitor = new PrintModelVisitorEverything();

			const walker = createPartialPrintModelWalker(testPrintModel, visitor);

			walker.walkPrintModel(testPrintModel);

			expect(visitor.visitedSegments.length).toBe(4);
			expect(visitor.visitedSections.length).toBe(2);
			expect(visitor.visitedWatermarks.length).toBe(2);
			expect(visitor.visitedElements.length).toBe(64);
		});

		it("Start at Segment", () => {
			let visitor = new PrintModelVisitorEverything();
			let walker = createPartialPrintModelWalker(testPrintModel, visitor);

			const firstSegment = testPrintModel.content?.segments?.definitions?.[0];

			if (!firstSegment) {
				throw new Error("The segment is undefined");
			}

			walker.walkSegment(firstSegment);
			expect(visitor.visitedElements.length).toBe(22);

			visitor = new PrintModelVisitorEverything();
			walker = createPartialPrintModelWalker(testPrintModel, visitor);

			const thirdSegment = testPrintModel.content?.segments?.definitions?.[2];

			if (!thirdSegment) {
				throw new Error("The segment is undefined");
			}
			walker.walkSegment(thirdSegment);
			expect(visitor.visitedElements.length).toBe(21);
		});

		it("Start at Section", () => {
			const visitor = new PrintModelVisitorEverything();
			const walker = createPartialPrintModelWalker(testPrintModel, visitor);

			const firstSection = testPrintModel.content?.sections?.definitions?.[0];

			if (!firstSection) {
				throw new Error("The section is undefined");
			}

			walker.walkSection(firstSection);
			expect(visitor.visitedElements.length).toBe(3);
		});

		it("Start at Watermark", () => {
			const visitor = new PrintModelVisitorEverything();
			const walker = createPartialPrintModelWalker(testPrintModel, visitor);

			const watermark = testPrintModel.content?.watermarks?.definitions?.[0];

			if (!watermark) {
				throw new Error("The watermark is undefined");
			}

			walker.walkWatermark(watermark);
			expect(visitor.visitedElements.length).toBe(1);
		});
	});

	describe("Visitor that visit all references", () => {
		class PrintModelVisitorEverything extends PartialPrintModelVisitor {
			placeableReferences: PartialPlaceableReference[] = [];
			tableColumnReferences: PartialTableColumnReference[] = [];
			tableLayoutCellReferences: PartialTableLayoutCellReference[] = [];
			textEntityReference: PartialReference[] = [];
			switchCaseReference: PartialReference[] = [];
			undefinedReferences: PartialReference[] = [];

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			afterVisitElement(element: PartialPrintModelElement) {
				// do nothing
			}

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			beforeVisitElement(element: PartialPrintModelElement) {
				// do nothing
			}

			visitUnresolvedDinTemplate(): TraversalCommand {
				return TraversalCommand.STOP;
			}

			visitPlaceableReference(reference: PartialPlaceableReference): TraversalCommand {
				this.placeableReferences.push(reference);
				return TraversalCommand.CONTINUE;
			}

			visitTableColumnReference(reference: PartialTableColumnReference): TraversalCommand {
				this.tableColumnReferences.push(reference);
				return TraversalCommand.CONTINUE;
			}

			visitTableLayoutCellReference(reference: PartialTableLayoutCellReference): TraversalCommand {
				this.tableLayoutCellReferences.push(reference);
				return TraversalCommand.CONTINUE;
			}

			visitTextEntityReference(reference: PartialReference): TraversalCommand {
				this.textEntityReference.push(reference);
				return TraversalCommand.CONTINUE;
			}
			visitSwitchCaseReference(reference: PartialReference): TraversalCommand {
				this.switchCaseReference.push(reference);
				return TraversalCommand.CONTINUE;
			}

			visitUndefinedReference(reference: PartialReference): TraversalCommand {
				this.undefinedReferences.push(reference);
				return TraversalCommand.STOP;
			}
		}

		it("Start at PrintModel", () => {
			const visitor = new PrintModelVisitorEverything();
			const walker = createPartialPrintModelWalker(testPrintModel, visitor);

			walker.walkPrintModel(testPrintModel);

			expect(visitor.placeableReferences.length).toBe(39);
			expect(visitor.tableLayoutCellReferences.length).toBe(6);
			expect(visitor.tableColumnReferences.length).toBe(2);
			expect(visitor.textEntityReference.length).toBe(14);
			expect(visitor.switchCaseReference.length).toBe(3);
			expect(visitor.undefinedReferences.length).toBe(1);
		});
	});

	describe("Visitor that visit referenced DIN template", () => {
		class PrintModelDinTemplateVisitor extends PartialPrintModelVisitor {
			elements: PartialPrintModelElement[] = [];
			referencedBoundingBoxes: Array<[PartialBoundingBox, PartialOverride]> = [];
			dinTemplates: Array<Segment> = [];

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			afterVisitElement(element: PartialPrintModelElement) {
				// do nothing
			}

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			beforeVisitElement(element: PartialPrintModelElement) {
				// do nothing
			}

			defaultVisitElement(element: PartialPrintModelElement): TraversalCommand {
				this.elements.push(element);
				return TraversalCommand.CONTINUE;
			}

			visitDINTemplate(dinTemplate: Segment): TraversalCommand {
				this.dinTemplates.push(dinTemplate);
				return TraversalCommand.CONTINUE;
			}

			visitOverriddenBoundingBox(boundingBox: PartialBoundingBox, override: PartialOverride): TraversalCommand {
				this.referencedBoundingBoxes.push([boundingBox, override]);
				return TraversalCommand.CONTINUE;
			}

			getElements() {
				return this.elements;
			}

			getReferencedBoundingBoxes() {
				return this.referencedBoundingBoxes;
			}

			getDinTemplates() {
				return this.dinTemplates;
			}
		}

		let visitor: PrintModelDinTemplateVisitor;
		let walker: PartialPrintModelWalker;

		beforeAll(() => {
			visitor = new PrintModelDinTemplateVisitor();
			walker = createPartialPrintModelWalker(testPrintModel, visitor, [deserializedPrintModelWithDinTemplate]);

			walker.walkPrintModel(testPrintModel);
		});

		it("visit DIN Template", () => {
			const dinTemplates = visitor.getDinTemplates();
			expect(dinTemplates.length).toBe(1);
			const firstDinTemplate = dinTemplates[0];
			expect(firstDinTemplate.id).toBe("Template1");
			expect(firstDinTemplate.elementReferences.length).toBe(2);
		});

		it("visit override elements and it's referenced bounding box", () => {
			const referencedBoundingBoxes = visitor.getReferencedBoundingBoxes();
			expect(referencedBoundingBoxes.length).toBe(3);

			const [firstBoundingBox, firstOverride] = referencedBoundingBoxes[0];
			expect(firstBoundingBox.id).toBe("BlueBox");
			expect(firstOverride.override?.refId).toBe("BlueBox");

			const [secondBoundingBox, secondOverride] = referencedBoundingBoxes[1];
			expect(secondBoundingBox.id).toBe("GreenBox");
			expect(secondOverride.override?.refId).toBe("GreenBox");

			const [thirdBoundingBox, thirdOverride] = referencedBoundingBoxes[2];
			expect(thirdBoundingBox.id).toBe("YellowBox");
			expect(thirdOverride.override?.refId).toBe("YellowBox");
		});
	});
});

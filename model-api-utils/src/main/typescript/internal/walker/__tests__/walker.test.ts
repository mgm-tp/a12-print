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
	BoundingBox,
	isPlaceableReference,
	Override,
	PrintModel,
	PrintModelElement,
	Reference,
	Segment,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { PrintModelTrace } from "@com.mgmtp.a12.print/print-model-api/lib/walker/print-model-trace.js";
import {
	PrintModelVisitor,
	TraversalCommand,
} from "@com.mgmtp.a12.print/print-model-api/lib/walker/print-model-visitor.js";
import { PrintModelWalker } from "@com.mgmtp.a12.print/print-model-api/lib/walker/print-model-walker.js";
import {
	CachedReferenceResolver,
	ReferenceListResolver,
} from "@com.mgmtp.a12.print/print-model-api/lib/walker/reference-resolver.js";
import {
	CachedSectionIdResolver,
	DefaultSectionIdResolver,
} from "@com.mgmtp.a12.print/print-model-api/lib/walker/section-id-resolver.js";
import {
	CachedSegmentIdResolver,
	DefaultSegmentIdResolver,
} from "@com.mgmtp.a12.print/print-model-api/lib/walker/segment-id-resolver.js";
import {
	CachedWatermarkIdResolver,
	DefaultWatermarkIdResolver,
} from "@com.mgmtp.a12.print/print-model-api/lib/walker/watermark-id-resolver.js";
import {
	CachedReferenceElementListResolver,
	ReferenceElementListResolver,
} from "@com.mgmtp.a12.print/print-model-api/lib/walker/reference-element-resolver.js";
import {
	CachedPrintModelListResolver,
	PrintModelListResolver,
} from "@com.mgmtp.a12.print/print-model-api/lib/walker/print-model-resolver.js";

import { PrintModelMarshaller } from "../../../marshaller/index.js";
import printModelWithAllElements from "../../../../../test/resources/print-models/Print-model-with-all-elements.json" with { type: "json" };
import PrintModelWithDinTemplateReference from "../../../../../test/resources/print-models/PrintModel-with-din-template-reference.json" with { type: "json" };
import printModelWithDinTemplate from "../../../../../test/resources/print-models/PrintModel-with-din-template.json" with { type: "json" };
import {
	field,
	pieChart,
	printModel,
	segment1,
	table,
	textWithField,
} from "../../../../../test/typescript/test-utils/model.js";
import { PrintValidationMode } from "../../validation/print-validator.js";

const marshaller = new PrintModelMarshaller();

const deserializedPrintModelWithDinTemplate = marshaller.deserialize(
	printModelWithDinTemplate,
	[],
	PrintValidationMode.SKIP_REFERENCES
).result!;
const deserializedPrintModelWithDinTemplateReference = marshaller.deserialize(
	PrintModelWithDinTemplateReference,
	[],
	PrintValidationMode.SKIP_REFERENCES
).result!;
const deserializePrintModelWithAllElements = marshaller.deserialize(
	printModelWithAllElements,
	[],
	PrintValidationMode.SKIP_REFERENCES
).result!;

function createPrintModelWalker(
	printModel: PrintModel,
	visitor: PrintModelVisitor,
	printModelList: PrintModel[] = [printModel]
) {
	const refResolver = ReferenceListResolver.fromModel(printModel);
	const segmentIdResolver = DefaultSegmentIdResolver.fromModel(printModel);
	const sectionIdResolver = DefaultSectionIdResolver.fromModel(printModel);
	const watermarkIdResolver = DefaultWatermarkIdResolver.fromModel(printModel);
	const referenceElementListResolver = ReferenceElementListResolver.fromModel(printModel);
	const printModelListResolver = PrintModelListResolver.fromModelList(printModelList);

	const cachedRefResolver = new CachedReferenceResolver(refResolver);
	const cachedSegmentIdResolver = new CachedSegmentIdResolver(segmentIdResolver);
	const cachedSectionIdResolver = new CachedSectionIdResolver(sectionIdResolver);
	const cachedWatermarkIdResolver = new CachedWatermarkIdResolver(watermarkIdResolver);
	const cachedReferenceElementListResolver = new CachedReferenceElementListResolver(referenceElementListResolver);
	const cachedPrintModelListResolver = new CachedPrintModelListResolver(printModelListResolver);

	return new PrintModelWalker(
		visitor,
		cachedRefResolver,
		cachedSegmentIdResolver,
		cachedSectionIdResolver,
		cachedWatermarkIdResolver,
		cachedReferenceElementListResolver,
		cachedPrintModelListResolver
	);
}

describe("PrintModelWalker", () => {
	describe("Visitor that visits every single element", () => {
		class PrintModelVisitorEverything extends PrintModelVisitor {
			elements: PrintModelElement[] = [];

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			afterVisitElement(element: PrintModelElement) {
				// do nothing
			}

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			beforeVisitElement(element: PrintModelElement) {
				// do nothing
			}

			defaultVisitElement(element: PrintModelElement): TraversalCommand {
				this.elements.push(element);
				return TraversalCommand.CONTINUE;
			}

			getElements() {
				return this.elements;
			}
		}

		let visitor: PrintModelVisitorEverything;
		let walker: PrintModelWalker;
		beforeEach(() => {
			visitor = new PrintModelVisitorEverything();
			walker = createPrintModelWalker(printModel, visitor);
		});

		it("start at PrintModel", () => {
			walker.walkPrintModel(printModel);
			const elements = visitor.getElements();
			const length = elements.length;
			const firstElement = elements[0];
			const lastElement = elements[length - 1];

			expect(length).toBe(6);
			expect(firstElement).toBe(field);
			expect(lastElement).toBe(table);
		});

		it("start at Segment", () => {
			walker.walkSegment(segment1);
			const elements = visitor.getElements();
			const length = elements.length;
			const firstElement = elements[0];
			const lastElement = elements[length - 1];

			expect(length).toBe(5);
			expect(firstElement).toBe(field);
			expect(lastElement).toBe(pieChart);
		});

		it("start at PrintModelElement", () => {
			walker.walkElement(textWithField);
			const elements = visitor.getElements();
			const length = elements.length;
			const firstElement = elements[0];
			const lastElement = elements[length - 1];

			expect(length).toBe(2);
			expect(firstElement).toBe(field);
			expect(lastElement).toBe(textWithField);
		});

		it("start at PrintModelElement without references", () => {
			walker.walkElement(pieChart);
			const elements = visitor.getElements();
			const length = elements.length;
			const firstElement = elements[0];
			const lastElement = elements[length - 1];

			expect(elements.length).toBe(1);
			expect(firstElement).toBe(pieChart);
			expect(lastElement).toBe(pieChart);
		});
	});

	describe("Visitor that visits only Placeable elements", () => {
		class PrintModelVisitorPlaceable extends PrintModelVisitor {
			elements: PrintModelElement[] = [];

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			afterVisitElement(element: PrintModelElement) {
				// do nothing
			}

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			beforeVisitElement(element: PrintModelElement) {
				// do nothing
			}

			visitReference(reference: Reference, printModelTrace: PrintModelTrace, index?: number): TraversalCommand {
				if (isPlaceableReference(reference)) {
					return this.visitPlaceableReference(reference, printModelTrace, index);
				}
				return TraversalCommand.STOP;
			}

			defaultVisitElement(element: PrintModelElement): TraversalCommand {
				this.elements.push(element);
				return TraversalCommand.CONTINUE;
			}

			getElements() {
				return this.elements;
			}
		}

		let visitor: PrintModelVisitorPlaceable;
		let walker: PrintModelWalker;

		beforeEach(() => {
			visitor = new PrintModelVisitorPlaceable();
			walker = createPrintModelWalker(printModel, visitor);
		});

		it("start at PrintModel", () => {
			walker.walkPrintModel(printModel);
			const elements = visitor.getElements();
			const length = elements.length;
			const firstElement = elements[0];
			const lastElement = elements[length - 1];

			expect(length).toBe(4);
			expect(firstElement).toBe(textWithField);
			expect(lastElement).toBe(table);
		});

		it("start at Segment", () => {
			walker.walkSegment(segment1);
			const elements = visitor.getElements();
			const length = elements.length;
			const firstElement = elements[0];
			const lastElement = elements[length - 1];

			expect(length).toBe(3);
			expect(firstElement).toBe(textWithField);
			expect(lastElement).toBe(pieChart);
		});
	});

	describe("Visitor that visit referenced DIN template", () => {
		class PrintModelDinTemplateVisitor extends PrintModelVisitor {
			elements: PrintModelElement[] = [];
			referencedBoundingBoxes: Array<[BoundingBox, Override]> = [];
			dinTemplates: Array<Segment> = [];

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			afterVisitElement(element: PrintModelElement) {
				// do nothing
			}

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			beforeVisitElement(element: PrintModelElement) {
				// do nothing
			}

			defaultVisitElement(element: PrintModelElement): TraversalCommand {
				this.elements.push(element);
				return TraversalCommand.CONTINUE;
			}

			visitDINTemplate(dinTemplate: Segment): TraversalCommand {
				this.dinTemplates.push(dinTemplate);
				return TraversalCommand.CONTINUE;
			}

			visitOverriddenBoundingBox(boundingBox: BoundingBox, override: Override): TraversalCommand {
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
		let walker: PrintModelWalker;
		beforeAll(() => {
			visitor = new PrintModelDinTemplateVisitor();
			walker = createPrintModelWalker(deserializedPrintModelWithDinTemplateReference, visitor, [
				deserializedPrintModelWithDinTemplate,
				deserializedPrintModelWithDinTemplateReference,
			]);
			walker.walkPrintModel(deserializedPrintModelWithDinTemplateReference);
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
			expect(firstOverride.override.refId).toBe("BlueBox");

			const [secondBoundingBox, secondOverride] = referencedBoundingBoxes[1];
			expect(secondBoundingBox.id).toBe("GreenBox");
			expect(secondOverride.override.refId).toBe("GreenBox");

			const [thirdBoundingBox, thirdOverride] = referencedBoundingBoxes[2];
			expect(thirdBoundingBox.id).toBe("YellowBox");
			expect(thirdOverride.override.refId).toBe("YellowBox");
		});

		it("visit every elements excluding override elements", () => {
			const visitedElements = visitor.getElements();
			expect(visitedElements.length).toBe(
				deserializedPrintModelWithDinTemplateReference.content.elementDefinitions.length - 3
			);
		});
	});

	describe("Visitor that visit all element", () => {
		class PrintModelVisitorExhausted extends PrintModelVisitor {
			elements: PrintModelElement[] = [];
			unknownElements: PrintModelElement[] = [];

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			afterVisitElement(element: PrintModelElement) {
				// do nothing
			}

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			beforeVisitElement(element: PrintModelElement) {
				// do nothing
			}

			defaultVisitElement(element: PrintModelElement): TraversalCommand {
				this.elements.push(element);
				return TraversalCommand.CONTINUE;
			}

			visitUnknownElement(element: PrintModelElement): TraversalCommand {
				this.unknownElements.push(element);
				return TraversalCommand.CONTINUE;
			}

			getElements() {
				return this.elements;
			}

			getUnknownElements() {
				return this.unknownElements;
			}
		}

		let visitor: PrintModelVisitorExhausted = new PrintModelVisitorExhausted();
		let walker: PrintModelWalker;

		beforeAll(() => {
			visitor = new PrintModelVisitorExhausted();
			walker = createPrintModelWalker(deserializePrintModelWithAllElements, visitor);
		});

		it("visit all elements", () => {
			walker.walkPrintModel(deserializePrintModelWithAllElements);
			expect(visitor.getElements().length).toBe(
				deserializePrintModelWithAllElements.content.elementDefinitions.length
			);

			expect(visitor.getUnknownElements().length).toBe(0);
		});
	});
});

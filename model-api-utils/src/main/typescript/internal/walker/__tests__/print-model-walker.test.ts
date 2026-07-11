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
import { jest } from "@jest/globals";

import type { AnyContainerElement, PrintModelElement } from "@com.mgmtp.a12.print/print-model-api/model";
import type {
	SectionIdResolver,
	SegmentIdResolver,
	WatermarkIdResolver,
} from "@com.mgmtp.a12.print/print-model-api/walker";
import {
	DescendCommand,
	PrintModelVisitor,
	TraversalCommand,
	PrintModelWalker,
	getReferences,
	ReferenceListResolver,
	DefaultSectionIdResolver,
	DefaultSegmentIdResolver,
	DefaultWatermarkIdResolver,
} from "@com.mgmtp.a12.print/print-model-api/walker";

import {
	area,
	boundingBox,
	field,
	override,
	pieChart,
	printContentWithSection,
	printModel,
	printModelWithSection,
	section,
	segment1,
	table,
	tableLayout,
	textWithField,
} from "../../../../../test/typescript/test-utils/model.js";

describe("PrintModelWalker (isolation)", () => {
	let underTest: PrintModelWalker;
	let visitor: PrintModelVisitorEverything;
	let referenceResolver: ReferenceListResolver;
	let sectionResolver: SectionIdResolver;
	let segmentResolver: SegmentIdResolver;
	let watermarkResolver: WatermarkIdResolver;

	class PrintModelVisitorEverything extends PrintModelVisitor {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		afterVisitElement(element: PrintModelElement) {
			// do nothing
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		beforeVisitElement(element: PrintModelElement) {
			// do nothing
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		defaultVisitElement(element: PrintModelElement): TraversalCommand {
			return TraversalCommand.CONTINUE;
		}
	}

	beforeEach(() => {
		visitor = new PrintModelVisitorEverything();
		referenceResolver = new ReferenceListResolver([]);
		segmentResolver = new DefaultSegmentIdResolver([]);
		sectionResolver = new DefaultSectionIdResolver([]);
		watermarkResolver = new DefaultWatermarkIdResolver([]);

		underTest = new PrintModelWalker(
			visitor,
			referenceResolver,
			segmentResolver,
			sectionResolver,
			watermarkResolver
		);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe("test walkPrintModel", () => {
		it("given DESCEND_FIRST - when walkPrintModel - then walkPrintModelContent and visitPrintModel", () => {
			const descendPrintModelStub = jest
				.spyOn(visitor, "descendPrintModel" as any)
				.mockClear()
				.mockReturnValue(DescendCommand.DESCEND_FIRST);
			const visitPrintModelStub = jest
				.spyOn(visitor, "visitPrintModel")
				.mockClear()
				.mockReturnValue(TraversalCommand.HALT);
			const walkPrintModelContentStub = jest
				.spyOn(underTest, "walkPrintModelContent" as any)
				.mockClear()
				.mockReturnValue(TraversalCommand.CONTINUE);

			const actualResult = underTest.walkPrintModel(printModel);

			const descendPrintModelStubOrder = descendPrintModelStub.mock.invocationCallOrder[0];
			const walkPrintModelContentStubOrder = walkPrintModelContentStub.mock.invocationCallOrder[0];
			const visitPrintModelStubOrder = visitPrintModelStub.mock.invocationCallOrder[0];
			expect(descendPrintModelStubOrder).toBeLessThan(walkPrintModelContentStubOrder);
			expect(walkPrintModelContentStubOrder).toBeLessThan(visitPrintModelStubOrder);

			expect(actualResult).toBe(TraversalCommand.HALT);
		});

		it("given DESCEND_FIRST - when walkPrintModel - then walkPrintModelContent only", () => {
			const descendPrintModelStub = jest
				.spyOn(visitor, "descendPrintModel" as any)
				.mockClear()
				.mockReturnValue(DescendCommand.DESCEND_FIRST);
			const walkPrintModelContentStub = jest
				.spyOn(underTest, "walkPrintModelContent" as any)
				.mockClear()
				.mockReturnValue(TraversalCommand.HALT);
			const visitPrintModelStub = jest
				.spyOn(visitor, "visitPrintModel")
				.mockClear()
				.mockImplementation(jest.fn() as any);

			const actualResult = underTest.walkPrintModel(printModel);

			const descendPrintModelStubOrder = descendPrintModelStub.mock.invocationCallOrder[0];
			const walkPrintModelContentStubOrder = walkPrintModelContentStub.mock.invocationCallOrder[0];
			expect(descendPrintModelStubOrder).toBeLessThan(walkPrintModelContentStubOrder);
			expect(visitPrintModelStub).not.toHaveBeenCalled();

			expect(actualResult).toBe(TraversalCommand.HALT);
		});

		it("given ELEMENT_FIRST - when walkPrintModel - then visitPrintModel and walkPrintModelContent", () => {
			const descendPrintModelStub = jest
				.spyOn(visitor, "descendPrintModel" as any)
				.mockClear()
				.mockReturnValue(DescendCommand.ELEMENT_FIRST);
			const visitPrintModelStub = jest
				.spyOn(visitor, "visitPrintModel")
				.mockClear()
				.mockReturnValue(TraversalCommand.CONTINUE);
			const walkPrintModelContentStub = jest
				.spyOn(underTest, "walkPrintModelContent" as any)
				.mockClear()
				.mockReturnValue(TraversalCommand.HALT);

			const actualResult = underTest.walkPrintModel(printModelWithSection);

			const descendPrintModelStubOrder = descendPrintModelStub.mock.invocationCallOrder[0];
			const visitPrintModelStubOrder = visitPrintModelStub.mock.invocationCallOrder[0];
			const walkPrintModelContentStubOrder = walkPrintModelContentStub.mock.invocationCallOrder[0];
			expect(descendPrintModelStubOrder).toBeLessThan(visitPrintModelStubOrder);
			expect(visitPrintModelStubOrder).toBeLessThan(walkPrintModelContentStubOrder);

			expect(actualResult).toBe(TraversalCommand.HALT);
		});

		it("given ELEMENT_FIRST - when walkPrintModel - then visitPrintModel only", () => {
			const descendPrintModelStub = jest
				.spyOn(visitor, "descendPrintModel" as any)
				.mockClear()
				.mockReturnValue(DescendCommand.ELEMENT_FIRST);
			const visitPrintModelStub = jest
				.spyOn(visitor, "visitPrintModel")
				.mockClear()
				.mockReturnValue(TraversalCommand.HALT);
			const walkPrintModelContentStub = jest
				.spyOn(underTest, "walkPrintModelContent" as any)
				.mockClear()
				.mockImplementation(jest.fn() as any);

			const actualResult = underTest.walkPrintModel(printModelWithSection);

			const descendPrintModelStubOrder = descendPrintModelStub.mock.invocationCallOrder[0];
			const visitPrintModelStubOrder = visitPrintModelStub.mock.invocationCallOrder[0];
			expect(descendPrintModelStubOrder).toBeLessThan(visitPrintModelStubOrder);
			expect(walkPrintModelContentStub).not.toHaveBeenCalled();

			expect(actualResult).toBe(TraversalCommand.HALT);
		});

		it("given NO_DESCEND - when walkPrintModel - then visitPrintModel only", () => {
			const descendPrintModelStub = jest
				.spyOn(visitor, "descendPrintModel" as any)
				.mockClear()
				.mockReturnValue(DescendCommand.NO_DESCEND);
			const visitPrintModelStub = jest
				.spyOn(visitor, "visitPrintModel")
				.mockClear()
				.mockReturnValue(TraversalCommand.HALT);

			const actualResult = underTest.walkPrintModel(printModelWithSection);

			const descendPrintModelStubOrder = descendPrintModelStub.mock.invocationCallOrder[0];
			const visitPrintModelStubOrder = visitPrintModelStub.mock.invocationCallOrder[0];
			expect(descendPrintModelStubOrder).toBeLessThan(visitPrintModelStubOrder);

			expect(actualResult).toBe(TraversalCommand.HALT);
		});
	});

	describe("test walkPrintModelContent", () => {
		it("given PrintModel has section - when walkPrintModelContent - then walkSections", () => {
			const walkStructureStub = jest
				.spyOn(underTest, "walkStructure" as any)
				.mockClear()
				.mockReturnValue(TraversalCommand.CONTINUE);
			const walkSectionsStub = jest
				.spyOn(underTest, "walkSections" as any)
				.mockClear()
				.mockReturnValue(TraversalCommand.CONTINUE);

			const actualResult = underTest.walkPrintModelContent(printModelWithSection.content);

			expect(walkStructureStub).toHaveBeenCalled();
			expect(walkSectionsStub).toHaveBeenCalled();
			expect(actualResult).toBe(TraversalCommand.CONTINUE);
		});
		it("given PrintModel doesn't have section - when walkPrintModelContent - then not walkSections", () => {
			const walkStructureStub = jest
				.spyOn(underTest, "walkStructure" as any)
				.mockClear()
				.mockReturnValue(TraversalCommand.HALT);
			const walkSectionsStub = jest
				.spyOn(underTest, "walkSections" as any)
				.mockClear()
				.mockImplementation(jest.fn() as any);

			const actualResult = underTest.walkPrintModelContent(printModel.content);

			expect(walkStructureStub).toHaveBeenCalled();
			expect(walkSectionsStub).not.toHaveBeenCalled();

			expect(actualResult).toBe(TraversalCommand.HALT);
		});
	});

	describe("test walkStructure", () => {
		it("given empty segment - when walkStructure - then visitUnresolvedSegment and return STOP", () => {
			const resolveSectionIdStub = jest
				.spyOn(segmentResolver, "resolveSegmentId")
				.mockClear()
				.mockReturnValue(undefined);
			const visitUnresolvedSectionStub = jest
				.spyOn(visitor, "visitUnresolvedSegment" as any)
				.mockClear()
				.mockReturnValue(TraversalCommand.STOP);
			const walkContainerStub = jest
				.spyOn(underTest, "walkContainer" as any)
				.mockClear()
				.mockImplementation(jest.fn() as any);

			const actualResult = underTest["walkStructure"](printContentWithSection.general.structure);

			expect(resolveSectionIdStub).toHaveBeenCalled();
			expect(visitUnresolvedSectionStub).toHaveBeenCalled();
			expect(walkContainerStub).not.toHaveBeenCalled();
			expect(actualResult).toBe(TraversalCommand.CONTINUE);
		});

		it("given empty segment - when walkStructure - then visitUnresolvedSegment and return STOP", () => {
			const resolveSectionIdStub = jest
				.spyOn(segmentResolver, "resolveSegmentId")
				.mockClear()
				.mockReturnValue(undefined);
			const visitUnresolvedSectionStub = jest
				.spyOn(visitor, "visitUnresolvedSegment" as any)
				.mockClear()
				.mockReturnValue(TraversalCommand.HALT);
			const walkContainerStub = jest
				.spyOn(underTest, "walkContainer" as any)
				.mockClear()
				.mockImplementation(jest.fn() as any);

			const actualResult = underTest["walkStructure"](printContentWithSection.general.structure);

			expect(resolveSectionIdStub).toHaveBeenCalled();
			expect(visitUnresolvedSectionStub).toHaveBeenCalled();
			expect(walkContainerStub).not.toHaveBeenCalled();
			expect(actualResult).toBe(TraversalCommand.HALT);
		});

		it("given segment - when walkStructure - then WalkContainer return CONTINUE", () => {
			const resolveSectionIdStub = jest
				.spyOn(segmentResolver, "resolveSegmentId")
				.mockClear()
				.mockReturnValue(printContentWithSection.segments.definitions[0]);
			const walkContainerStub = jest
				.spyOn(underTest, "walkContainer" as any)
				.mockClear()
				.mockReturnValue(TraversalCommand.STOP);

			const result = underTest["walkStructure"](printContentWithSection.general.structure);

			expect(resolveSectionIdStub).toHaveBeenCalled();
			expect(walkContainerStub).toHaveBeenCalled();
			expect(result).toBe(TraversalCommand.CONTINUE);
		});

		it("given segment - when walkStructure - then WalkContainer return HALT", () => {
			const resolveSectionIdStub = jest
				.spyOn(segmentResolver, "resolveSegmentId")
				.mockClear()
				.mockReturnValue(printContentWithSection.segments.definitions[0]);
			const walkContainerStub = jest
				.spyOn(underTest, "walkContainer" as any)
				.mockClear()
				.mockReturnValue(TraversalCommand.HALT);

			const result = underTest["walkStructure"](printContentWithSection.general.structure);

			expect(resolveSectionIdStub).toHaveBeenCalled();
			expect(walkContainerStub).toHaveBeenCalled();
			expect(result).toBe(TraversalCommand.HALT);
		});
	});

	describe("test walkSections", () => {
		it("given empty sections - when walkSections - then visitUnresolvedSection return CONTINUE", () => {
			const resolveSectionIdStub = jest
				.spyOn(sectionResolver, "resolveSectionId")
				.mockClear()
				.mockReturnValue(undefined);
			const walkContainerStub = jest
				.spyOn(underTest, "walkContainer" as any)
				.mockClear()
				.mockImplementation(jest.fn() as any);
			const visitUnresolvedSection = jest
				.spyOn(visitor, "visitUnresolvedSection" as any)
				.mockClear()
				.mockReturnValue(TraversalCommand.STOP);

			const result = underTest["walkSections"](printContentWithSection.general.sections as any);

			expect(resolveSectionIdStub).toHaveBeenCalled();
			expect(visitUnresolvedSection).toHaveBeenCalled();
			expect(walkContainerStub).not.toHaveBeenCalled();
			expect(result).toBe(TraversalCommand.CONTINUE);
		});

		it("given empty sections - when walkSections - then visitUnresolvedSection return HALT", () => {
			const resolveSectionIdStub = jest
				.spyOn(sectionResolver, "resolveSectionId")
				.mockClear()
				.mockReturnValue(undefined);
			const walkContainerStub = jest
				.spyOn(underTest, "walkContainer" as any)
				.mockClear()
				.mockImplementation(jest.fn() as any);
			const visitUnresolvedSection = jest
				.spyOn(visitor, "visitUnresolvedSection" as any)
				.mockClear()
				.mockReturnValue(TraversalCommand.HALT);

			const result = underTest["walkSections"](printContentWithSection.general.sections as any);

			expect(resolveSectionIdStub).toHaveBeenCalled();
			expect(visitUnresolvedSection).toHaveBeenCalled();
			expect(walkContainerStub).not.toHaveBeenCalled();

			expect(result).toBe(TraversalCommand.HALT);
		});

		it("given section - when walkSections - then walkContainer return HALT", () => {
			const resolveSectionIdStub = jest
				.spyOn(sectionResolver, "resolveSectionId")
				.mockClear()
				.mockReturnValue(printContentWithSection.sections?.definitions[0]);
			const walkContainerStub = jest
				.spyOn(underTest, "walkContainer" as any)
				.mockClear()
				.mockReturnValue(TraversalCommand.HALT);
			const visitUnresolvedSection = jest
				.spyOn(visitor, "visitUnresolvedSection" as any)
				.mockClear()
				.mockImplementation(jest.fn() as any);

			const result = underTest["walkSections"](printContentWithSection.general.sections as any);

			expect(resolveSectionIdStub).toHaveBeenCalled();
			expect(walkContainerStub).toHaveBeenCalled();
			expect(visitUnresolvedSection).not.toHaveBeenCalled();

			expect(result).toBe(TraversalCommand.HALT);
		});

		it("given section - when walkSections - then walkContainer return CONTINUE", () => {
			const resolveSectionIdStub = jest
				.spyOn(sectionResolver, "resolveSectionId")
				.mockClear()
				.mockReturnValue(printContentWithSection.sections?.definitions[0]);
			const walkContainerStub = jest
				.spyOn(underTest, "walkContainer" as any)
				.mockClear()
				.mockReturnValue(TraversalCommand.STOP);
			const visitUnresolvedSection = jest
				.spyOn(visitor, "visitUnresolvedSection" as any)
				.mockClear()
				.mockImplementation(jest.fn() as any);

			const result = underTest["walkSections"](printContentWithSection.general.sections as any);

			expect(resolveSectionIdStub).toHaveBeenCalled();
			expect(walkContainerStub).toHaveBeenCalled();
			expect(visitUnresolvedSection).not.toHaveBeenCalled();

			expect(result).toBe(TraversalCommand.CONTINUE);
		});
	});

	describe("test walkSegment", () => {
		it("given segment - when walkSegment - then walkContainer", () => {
			const walkContainerStub = jest
				.spyOn(underTest, "walkContainer" as any)
				.mockClear()
				.mockReturnValue(TraversalCommand.CONTINUE);

			const result = underTest.walkSegment(segment1);

			expect(result).toBe(TraversalCommand.CONTINUE);

			expect(walkContainerStub).toHaveBeenCalled();
		});
	});

	describe("test walkSection", () => {
		it("given section - when walkSection - then walkContainer", () => {
			const walkContainerStub = jest
				.spyOn(underTest, "walkContainer" as any)
				.mockClear()
				.mockReturnValue(TraversalCommand.CONTINUE);

			const result = underTest.walkSection(section);

			expect(result).toBe(TraversalCommand.CONTINUE);

			expect(walkContainerStub).toHaveBeenCalled();
		});
	});

	describe("test walkContainer", () => {
		it("given container does not have reference - when walkContainer - then throw Error", () => {
			expect(function () {
				underTest["walkContainer"](pieChart as unknown as AnyContainerElement);
			}).toThrow("Could not get references from AnyContainerElement");
		});

		it("given DESCEND_FIRST - when walkContainer - then walkReferences and visitContainer", () => {
			const descendContainerStub = jest
				.spyOn(visitor, "descendContainer")
				.mockClear()
				.mockReturnValue(DescendCommand.DESCEND_FIRST);
			const walkReferencesStub = jest
				.spyOn(underTest, "walkReferences" as any)
				.mockClear()
				.mockReturnValue(TraversalCommand.CONTINUE);
			const visitContainerStub = jest
				.spyOn(visitor, "visitContainer")
				.mockClear()
				.mockReturnValue(TraversalCommand.HALT);

			const actualResult = underTest["walkContainer"](segment1);

			const descendContainerStubOrder = descendContainerStub.mock.invocationCallOrder[0];
			const walkReferencesStubOrder = walkReferencesStub.mock.invocationCallOrder[0];
			const visitContainerStubOrder = visitContainerStub.mock.invocationCallOrder[0];
			expect(descendContainerStubOrder).toBeLessThan(walkReferencesStubOrder);
			expect(walkReferencesStubOrder).toBeLessThan(visitContainerStubOrder);

			expect(actualResult).toBe(TraversalCommand.HALT);
		});

		it("given DESCEND_FIRST - when walkContainer - then walkReferences only", () => {
			const descendContainerStub = jest
				.spyOn(visitor, "descendContainer")
				.mockClear()
				.mockReturnValue(DescendCommand.DESCEND_FIRST);
			const walkReferencesStub = jest
				.spyOn(underTest, "walkReferences" as any)
				.mockClear()
				.mockReturnValue(TraversalCommand.HALT);
			const visitContainerStub = jest
				.spyOn(visitor, "visitContainer")
				.mockClear()
				.mockImplementation(jest.fn() as any);

			const actualResult = underTest["walkContainer"](segment1);

			const descendContainerStubOrder = descendContainerStub.mock.invocationCallOrder[0];
			const walkReferencesStubOrder = walkReferencesStub.mock.invocationCallOrder[0];
			expect(descendContainerStubOrder).toBeLessThan(walkReferencesStubOrder);

			expect(visitContainerStub).not.toHaveBeenCalled();
			expect(actualResult).toBe(TraversalCommand.HALT);
		});

		it("given ELEMENT_FIRST - when walkContainer - then visitContainer and walkReferences", () => {
			const descendContainerStub = jest
				.spyOn(visitor, "descendContainer")
				.mockClear()
				.mockReturnValue(DescendCommand.ELEMENT_FIRST);
			const visitContainerStub = jest
				.spyOn(visitor, "visitContainer")
				.mockClear()
				.mockReturnValue(TraversalCommand.CONTINUE);
			const walkReferencesStub = jest
				.spyOn(underTest, "walkReferences" as any)
				.mockClear()
				.mockReturnValue(TraversalCommand.CONTINUE);

			const result = underTest["walkContainer"](segment1);

			const descendContainerStubOrder = descendContainerStub.mock.invocationCallOrder[0];
			const visitContainerStubOrder = visitContainerStub.mock.invocationCallOrder[0];
			const walkReferencesStubOrder = walkReferencesStub.mock.invocationCallOrder[0];
			expect(descendContainerStubOrder).toBeLessThan(visitContainerStubOrder);
			expect(visitContainerStubOrder).toBeLessThan(walkReferencesStubOrder);

			expect(result).toBe(TraversalCommand.CONTINUE);
		});

		it("given ELEMENT_FIRST - when walkContainer - then visitContainer only", () => {
			const descendContainerStub = jest
				.spyOn(visitor, "descendContainer")
				.mockClear()
				.mockReturnValue(DescendCommand.ELEMENT_FIRST);
			const visitContainerStub = jest
				.spyOn(visitor, "visitContainer")
				.mockClear()
				.mockReturnValue(TraversalCommand.HALT);

			const result = underTest["walkContainer"](segment1);

			const descendContainerStubOrder = descendContainerStub.mock.invocationCallOrder[0];
			const visitContainerStubOrder = visitContainerStub.mock.invocationCallOrder[0];
			expect(descendContainerStubOrder).toBeLessThan(visitContainerStubOrder);

			expect(result).toBe(TraversalCommand.HALT);
		});

		it("given NO_DESCEND - when walkContainer - then visitContainer only", () => {
			const descendContainerStub = jest
				.spyOn(visitor, "descendContainer")
				.mockClear()
				.mockReturnValue(DescendCommand.NO_DESCEND);
			const visitContainerStub = jest
				.spyOn(visitor, "visitContainer")
				.mockClear()
				.mockReturnValue(TraversalCommand.HALT);
			const walkReferencesStub = jest
				.spyOn(underTest, "walkReferences" as any)
				.mockClear()
				.mockImplementation(jest.fn() as any);

			const result = underTest["walkContainer"](segment1);

			const descendContainerStubOrder = descendContainerStub.mock.invocationCallOrder[0];
			const visitContainerStubOrder = visitContainerStub.mock.invocationCallOrder[0];
			expect(descendContainerStubOrder).toBeLessThan(visitContainerStubOrder);

			expect(walkReferencesStub).not.toHaveBeenCalled();
			expect(result).toBe(TraversalCommand.HALT);
		});

		it("given NO_DESCEND - when walkContainer - then visitContainer and return STOP", () => {
			const descendContainerStub = jest
				.spyOn(visitor, "descendContainer")
				.mockClear()
				.mockReturnValue(DescendCommand.NO_DESCEND);
			const visitContainerStub = jest
				.spyOn(visitor, "visitContainer")
				.mockClear()
				.mockReturnValue(TraversalCommand.STOP);
			const walkReferencesStub = jest
				.spyOn(underTest, "walkReferences" as any)
				.mockClear()
				.mockImplementation(jest.fn() as any);

			const result = underTest["walkContainer"](segment1);

			const descendContainerStubOrder = descendContainerStub.mock.invocationCallOrder[0];
			const visitContainerStubOrder = visitContainerStub.mock.invocationCallOrder[0];
			expect(descendContainerStubOrder).toBeLessThan(visitContainerStubOrder);

			expect(walkReferencesStub).not.toHaveBeenCalled();
			expect(result).toBe(TraversalCommand.STOP);
		});
	});

	describe("test walkReferences", () => {
		it("given walkReference returns STOP - when walkReferences - then return CONTINUE", () => {
			const walkReferenceStub = jest
				.spyOn(underTest, "walkReference" as any)
				.mockClear()
				.mockReturnValue(TraversalCommand.STOP);

			const result = underTest["walkReferences"](textWithField.text.entities);

			expect(result).toBe(TraversalCommand.CONTINUE);

			expect(walkReferenceStub).toHaveBeenCalled();
		});

		it("given walkReference returns HALT - when walkReferences - then return HALT", () => {
			const walkReferenceStub = jest
				.spyOn(underTest, "walkReference" as any)
				.mockClear()
				.mockReturnValue(TraversalCommand.HALT);

			const result = underTest["walkReferences"](textWithField.text.entities);

			expect(result).toBe(TraversalCommand.HALT);

			expect(walkReferenceStub).toHaveBeenCalled();
		});

		it("given walkReference returns CONTINUE - when walkReferences - then return CONTINUE", () => {
			const walkReferenceStub = jest
				.spyOn(underTest, "walkReference" as any)
				.mockClear()
				.mockReturnValue(TraversalCommand.CONTINUE);

			const result = underTest["walkReferences"](textWithField.text.entities);

			expect(result).toBe(TraversalCommand.CONTINUE);

			expect(walkReferenceStub).toHaveBeenCalled();
		});
	});

	describe("test walkReference", () => {
		it("given empty PrintModelTreeTrace - when walkReference - then return CONTINUE", () => {
			const visitReferenceStub = jest
				.spyOn(visitor, "visitReference")
				.mockClear()
				.mockReturnValue(TraversalCommand.CONTINUE);
			const resolveReferenceStub = jest
				.spyOn(referenceResolver, "resolveReference")
				.mockClear()
				.mockReturnValue(undefined);
			const visitUnresolvedElementStub = jest
				.spyOn(visitor, "visitUnresolvedElement")
				.mockClear()
				.mockReturnValue(TraversalCommand.CONTINUE);
			const walkElementStub = jest
				.spyOn(underTest, "walkElement")
				.mockClear()
				.mockImplementation(jest.fn() as any);

			const result = underTest.walkReference(textWithField.text.entities[0]);

			expect(visitReferenceStub).toHaveBeenCalled();
			expect(resolveReferenceStub).toHaveBeenCalled();
			expect(visitUnresolvedElementStub).toHaveBeenCalled();
			expect(walkElementStub).not.toHaveBeenCalled();

			expect(result).toBe(TraversalCommand.CONTINUE);
		});

		it("given PrintModelTreeTrace - when walkReference - then return CONTINUE", () => {
			const visitReferenceStub = jest
				.spyOn(visitor, "visitReference")
				.mockClear()
				.mockReturnValue(TraversalCommand.CONTINUE);
			const resolveReferenceStub = jest
				.spyOn(referenceResolver, "resolveReference")
				.mockClear()
				.mockReturnValue(field);
			const walkElementStub = jest
				.spyOn(underTest, "walkElement")
				.mockClear()
				.mockReturnValue(TraversalCommand.CONTINUE);
			const visitUnresolvedElementStub = jest
				.spyOn(visitor, "visitUnresolvedElement")
				.mockClear()
				.mockImplementation(jest.fn() as any);

			const result = underTest.walkReference(textWithField.text.entities[0]);

			expect(visitReferenceStub).toHaveBeenCalled();
			expect(resolveReferenceStub).toHaveBeenCalled();
			expect(walkElementStub).toHaveBeenCalled();
			expect(visitUnresolvedElementStub).not.toHaveBeenCalled();

			expect(result).toBe(TraversalCommand.CONTINUE);
		});
	});

	describe("test walkElement", () => {
		it("given reference container - when walkElement - then walkContainer", () => {
			const walkContainerStub = jest
				.spyOn(underTest, "walkContainer" as any)
				.mockClear()
				.mockReturnValue(TraversalCommand.CONTINUE);
			const visitElementStub = jest
				.spyOn(visitor, "visitElement")
				.mockClear()
				.mockImplementation(jest.fn() as any);

			const result = underTest.walkElement(textWithField);

			expect(result).toBe(TraversalCommand.CONTINUE);

			expect(walkContainerStub).toHaveBeenCalled();
			expect(visitElementStub).not.toHaveBeenCalled();
		});

		it("given model element - when walkElement - then visitElement", () => {
			const visitElementStub = jest
				.spyOn(visitor, "visitElement")
				.mockClear()
				.mockReturnValue(TraversalCommand.CONTINUE);
			const walkContainerStub = jest
				.spyOn(underTest, "walkContainer" as any)
				.mockClear()
				.mockImplementation(jest.fn() as any);

			const result = underTest.walkElement(pieChart);

			expect(result).toBe(TraversalCommand.CONTINUE);

			expect(visitElementStub).toHaveBeenCalled();
			expect(walkContainerStub).not.toHaveBeenCalled();
		});
	});
});

describe("getReferences", () => {
	it("should return elementReferences if element is section", () => {
		const result = getReferences(section);

		const expectedReferences = section.elementReferences;
		expect(result).toBe(expectedReferences);
	});

	it("should return elementReferences if element is segment", () => {
		const result = getReferences(segment1);

		const expectedReferences = segment1.elementReferences;
		expect(result).toBe(expectedReferences);
	});

	it("should return elementReferences if element is instance of Area", () => {
		const result = getReferences(area);

		const expectedReferences = area.area.elementReferences;
		expect(result).toBe(expectedReferences);
	});

	it("should return elementReferences if element is instance of Bounding Box", () => {
		const result = getReferences(boundingBox);

		const expectedReferences = boundingBox.boundingBox.elementReferences;
		expect(result).toBe(expectedReferences);
	});

	it("should return elementReferences if element is instance of Override", () => {
		const result = getReferences(override);

		const expectedReferences = override.override.boundingBox?.elementReferences;
		expect(result).toBe(expectedReferences);
	});

	it("should return text entities if element is instance of Text", () => {
		const result = getReferences(textWithField);

		const expectedReferences = textWithField.text.entities;
		expect(result).toBe(expectedReferences);
	});

	it("should return table column if element is instance of Table", () => {
		const result = getReferences(table);

		const expectedReferences = table.table.columns;
		expect(result).toBe(expectedReferences);
	});

	it("should return table layout cells if element is instance of Table Layout", () => {
		const result = getReferences(tableLayout);

		const expectedReferences = tableLayout.tableLayout.cells;
		expect(result).toBe(expectedReferences);
	});

	it("should return undefined if element is instance of other print element that doesn't have reference", () => {
		const result = getReferences(pieChart);
		expect(result).toBeUndefined();
	});

	it("should throw Error if element type does not exist in getReferences", () => {
		const unknownElement = {
			id: "element-id",
			type: "unknown",
		} as any as PrintModelElement;

		expect(function () {
			getReferences(unknownElement);
		}).toThrow("Element of type unknown does not exist in getReferences");
	});
});

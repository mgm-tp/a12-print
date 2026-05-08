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

import {
	MeasureUnit,
	PageOrientation,
	SectionUsage,
	PartialSection,
	PartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { createPartialValidReference } from "../../../../../test/typescript/test-utils/index.js";

import { EditorUtils } from "../editor-utils.js";
import { PlainMeasureDimensions, PlainMeasurePosition } from "../measure-utils.js";
import { ElementsUtils } from "../elements-utils.js";

describe("editor utils", () => {
	const colliedReference1: PartialValidPlaceableReference = createPartialValidReference(0, 0, 4, 8);
	const colliedReference2: PartialValidPlaceableReference = createPartialValidReference(1, 1, 5, 6);
	const colliedReference3: PartialValidPlaceableReference = createPartialValidReference(7, 3, 4, 4);
	const colliedReference4: PartialValidPlaceableReference = createPartialValidReference(5, 5, 5, 5);
	const colliedReference5: PartialValidPlaceableReference = createPartialValidReference(9, 9, 4, 4);
	const noColliedReference: PartialValidPlaceableReference = createPartialValidReference(0, 20, 4, 4);

	describe("isColliding", () => {
		test("should return true if references are colliding", () => {
			expect(EditorUtils.isColliding(colliedReference1, colliedReference2)).toBe(true);
		});

		test("should return false if comparing the same reference", () => {
			expect(EditorUtils.isColliding(colliedReference1, colliedReference1)).toBe(false);
		});

		test("should return false if references are not colliding", () => {
			expect(EditorUtils.isColliding(colliedReference1, colliedReference4)).toBe(false);
		});
	});

	describe("checkCollisionsSingle", () => {
		test("should return an array of colliding references", () => {
			const references = [
				colliedReference1,
				colliedReference2,
				colliedReference3,
				colliedReference4,
				colliedReference5,
			];

			expect(EditorUtils.checkCollisionsSingle(colliedReference1, references).length).toEqual(2);
		});

		test("should return an empty array if there are no collisions", () => {
			const references = [colliedReference1, colliedReference4, colliedReference5];
			expect(EditorUtils.checkCollisionsSingle(colliedReference1, references).length).toEqual(0);
		});

		test("should return an empty array if no references are provided", () => {
			expect(EditorUtils.checkCollisionsSingle(colliedReference1, []).length).toEqual(0);
		});
	});

	describe("checkCollisionsAll", () => {
		test("should return an array of colliding references", () => {
			const references = [
				colliedReference1,
				colliedReference2,
				colliedReference3,
				colliedReference4,
				colliedReference5,
				noColliedReference,
			];
			expect(EditorUtils.checkCollisionsAll(references).length).toEqual(5);
		});

		test("should return an empty array if there are no collisions", () => {
			const references = [colliedReference1, colliedReference4, noColliedReference];
			expect(EditorUtils.checkCollisionsAll(references).length).toEqual(0);
		});

		test("should return an empty array if there are only one reference", () => {
			const references = [colliedReference1];
			expect(EditorUtils.checkCollisionsAll(references).length).toEqual(0);
		});

		test("should return an empty array if there are only no references", () => {
			const references: PartialValidPlaceableReference[] = [];
			expect(EditorUtils.checkCollisionsAll(references).length).toEqual(0);
		});
	});

	const box = createPositionAndDimensions(10, 10, 15, 10);

	// inside of box
	const posAndDimensions1 = createPositionAndDimensions(11.5, 11.5, 4, 4);

	// outside of box
	const posAndDimensions2 = createPositionAndDimensions(21, 16, 4, 4);

	// partially inside of box
	const posAndDimensions3 = createPositionAndDimensions(15, 20, 5, 10);

	// inside of box
	const posAndDimensions4 = createPositionAndDimensions(10, 12, 4, 10);

	// outside of box
	const posAndDimensions5 = createPositionAndDimensions(1, 0.5, 4, 4);

	describe("isElementInBox", () => {
		test("should return true if the element is inside of the box", () => {
			expect(EditorUtils.isElementInBox(box, posAndDimensions1)).toBe(true);
			expect(EditorUtils.isElementInBox(box, posAndDimensions4)).toBe(true);
		});

		test("should return false when the element is outside of the box", () => {
			expect(EditorUtils.isElementInBox(box, posAndDimensions2)).toBe(false);
			expect(EditorUtils.isElementInBox(box, posAndDimensions5)).toBe(false);
		});

		test("should return false when the element is partially inside of box", () => {
			expect(EditorUtils.isElementInBox(box, posAndDimensions3)).toBe(false);
		});
	});

	describe("checkAllElementsInBox", () => {
		function createReferences(elements: (PlainMeasurePosition & PlainMeasureDimensions)[]) {
			return elements.map(element =>
				createPartialValidReference(
					element.x.value - box.x.value,
					element.y.value - box.y.value,
					element.minHeight.value,
					element.minWidth.value
				)
			);
		}

		test("should return an array of references which are outside of box", () => {
			const references = createReferences([
				posAndDimensions1,
				posAndDimensions2,
				posAndDimensions3,
				posAndDimensions4,
				posAndDimensions5,
			]);
			expect(EditorUtils.checkAllElementsInBox(references, box).length).toEqual(3);
		});

		test("should return an empty array if all elements are inside of box", () => {
			const references = createReferences([posAndDimensions1, posAndDimensions4]);
			expect(EditorUtils.checkAllElementsInBox(references, box).length).toEqual(0);
		});

		test("should return an array of references if all elements are outside of box", () => {
			const references = createReferences([posAndDimensions2, posAndDimensions3, posAndDimensions5]);
			expect(EditorUtils.checkAllElementsInBox(references, box).length).toEqual(references.length);
		});

		test("should return an empty array if references are empty", () => {
			expect(EditorUtils.checkAllElementsInBox([], box).length).toEqual(0);
		});
	});

	describe("getRealPage", () => {
		test("should return 0 if the position is smaller than dimension height", () => {
			expect(EditorUtils.getRealPage(500, 600)).toEqual(0);
		});

		test("should round down value if the position is larger than dimension height", () => {
			expect(EditorUtils.getRealPage(700, 600)).toEqual(1);
			expect(EditorUtils.getRealPage(900, 600)).toEqual(1);
			expect(EditorUtils.getRealPage(1199, 600)).toEqual(1);
			expect(EditorUtils.getRealPage(1300, 600)).toEqual(2);
			expect(EditorUtils.getRealPage(6500, 600)).toEqual(10);
		});

		test("should return 0 if the position is 0", () => {
			expect(EditorUtils.getRealPage(0, 500)).toEqual(0);
		});
	});

	describe("isCloserToTopLeft", () => {
		const containerBox = createPosition(10, 10);
		test("should return true if the target position is closer than the other position", () => {
			const targetPos1: PlainMeasurePosition = createPosition(20, 20);
			const otherPos1: PlainMeasurePosition = createPosition(30, 30);
			expect(EditorUtils.isCloserToTopLeft(targetPos1, otherPos1, containerBox)).toBe(true);

			const targetPos2: PlainMeasurePosition = createPosition(5, 5);
			const otherPos2: PlainMeasurePosition = createPosition(0, 0);
			expect(EditorUtils.isCloserToTopLeft(targetPos2, otherPos2, containerBox)).toBe(true);
		});

		test("should return false if the target position is farther than the other position", () => {
			const targetPos1: PlainMeasurePosition = createPosition(30, 30);
			const otherPos1: PlainMeasurePosition = createPosition(20, 20);
			expect(EditorUtils.isCloserToTopLeft(targetPos1, otherPos1, containerBox)).toBe(false);

			const targetPos2: PlainMeasurePosition = createPosition(0, 0);
			const otherPos2: PlainMeasurePosition = createPosition(5, 5);
			expect(EditorUtils.isCloserToTopLeft(targetPos2, otherPos2, containerBox)).toBe(false);
		});

		test("should return true if the target position is equal to the other position", () => {
			const targetPos: PlainMeasurePosition = createPosition(30, 30);
			const otherPos = { ...targetPos };
			expect(EditorUtils.isCloserToTopLeft(targetPos, otherPos, containerBox)).toBe(true);
		});

		test("should return true if the target position is closer to default box position value", () => {
			const targetPos1: PlainMeasurePosition = createPosition(10, 15);
			const otherPos1: PlainMeasurePosition = createPosition(10, 16);
			expect(EditorUtils.isCloserToTopLeft(targetPos1, otherPos1)).toBe(true);
		});

		test("should return false if the other position is closer to default box position value", () => {
			const targetPos1: PlainMeasurePosition = createPosition(10, 16);
			const otherPos1: PlainMeasurePosition = createPosition(10, 15);
			expect(EditorUtils.isCloserToTopLeft(targetPos1, otherPos1)).toBe(false);
		});
	});

	describe("isElementOverlapping", () => {
		test("should return true if the elements overlap", () => {
			const targetElement = createPositionAndDimensions(10, 10, 10, 10);
			const otherElement = createPositionAndDimensions(15, 15, 5, 5);
			expect(EditorUtils.isElementOverlapping(targetElement, otherElement)).toBe(true);
		});

		test("should return true if the target element is inside of the other element", () => {
			const targetElement = createPositionAndDimensions(10, 10, 5, 5);
			const otherElement = createPositionAndDimensions(5, 5, 20, 20);
			expect(EditorUtils.isElementOverlapping(targetElement, otherElement)).toBe(true);
		});

		test("should return false if the elements don't overlap", () => {
			const targetElement = createPositionAndDimensions(10, 10, 10, 10);
			const otherElement = createPositionAndDimensions(21, 10, 5, 5);
			expect(EditorUtils.isElementOverlapping(targetElement, otherElement)).toBe(false);
		});

		test("should return true if the elements overlap at the edge", () => {
			const targetElement = createPositionAndDimensions(10, 10, 10, 10);
			const otherElement = createPositionAndDimensions(20, 10, 5, 5);
			expect(EditorUtils.isElementOverlapping(targetElement, otherElement)).toBe(true);
		});

		test("should return true if elements overlap with strict parameter set to true", () => {
			const targetElement = createPositionAndDimensions(10, 10, 10, 10);
			const otherElement = createPositionAndDimensions(5, 5, 10, 10);
			expect(EditorUtils.isElementOverlapping(targetElement, otherElement, true)).toBe(true);
		});

		test("should return true if the target element is inside of the other element with strict parameter set to true", () => {
			const targetElement = createPositionAndDimensions(10, 10, 20, 20);
			const otherElement = createPositionAndDimensions(15, 15, 5, 5);
			expect(EditorUtils.isElementOverlapping(targetElement, otherElement, true)).toBe(true);
		});

		test("should return false if elements don't overlap with strict parameter set to true", () => {
			const targetElement = createPositionAndDimensions(10, 10, 10, 10);
			const otherElement = createPositionAndDimensions(20, 11, 5, 5);
			expect(EditorUtils.isElementOverlapping(targetElement, otherElement, true)).toBe(false);
		});

		test("should return false if elements overlap at the edge with strict parameter set to true", () => {
			const targetElement = createPositionAndDimensions(10, 10, 10, 10);
			const otherElement = createPositionAndDimensions(20, 10, 5, 5);
			expect(EditorUtils.isElementOverlapping(targetElement, otherElement, true)).toBe(false);
		});
	});

	describe("getSegmentSectionUsage", () => {
		test("should return 'Remaining' if section usage is 'Remaining'", () => {
			const section: PartialSection = {
				id: "test",
				sectionUsage: SectionUsage.Remaining,
			};
			expect(EditorUtils.getSegmentSectionUsage(1, section)).toEqual(SectionUsage.Remaining);
			expect(EditorUtils.getSegmentSectionUsage(10, section)).toEqual(SectionUsage.Remaining);
		});

		test("should return 'Remaining' if section usage is 'First' and page number is not first page", () => {
			const section: PartialSection = {
				id: "test",
				sectionUsage: SectionUsage.First,
			};
			expect(EditorUtils.getSegmentSectionUsage(10, section)).toEqual(SectionUsage.Remaining);
		});

		test("should return 'Remaining' if section usage is 'First' and page number is first page", () => {
			const section: PartialSection = {
				id: "test",
				sectionUsage: SectionUsage.First,
			};
			expect(EditorUtils.getSegmentSectionUsage(1, section)).toEqual(SectionUsage.First);
		});

		test("should return 'First' if the page number is the first page and the section is undefined", () => {
			expect(EditorUtils.getSegmentSectionUsage(1)).toEqual(SectionUsage.First);
		});

		test("should return 'Remaining' if the page number is not the first page", () => {
			expect(EditorUtils.getSegmentSectionUsage(2)).toEqual(SectionUsage.Remaining);
		});
	});

	describe("getLowestElementReference", () => {
		test("should return the lowest element reference if there are no offsets and margin", () => {
			const reference1 = createPartialValidReference(0, 0, 10, 10);
			const reference2 = createPartialValidReference(10, 20, 10, 10);
			const reference3 = createPartialValidReference(10, 21, 10, 10);
			const reference4 = createPartialValidReference(10, 100, 10, 10);
			const reference5 = createPartialValidReference(10, 101, 5, 10);
			expect(
				EditorUtils.getLowestElementReference([reference1, reference2, reference3, reference4, reference5])
			).toEqual(reference4);
		});

		test("should return the lowest element reference if there are no offsets", () => {
			const reference1 = createPartialValidReference(0, 0, 10, 10);
			const reference2 = createPartialValidReference(10, 20, 10, 10);
			const reference3 = createPartialValidReference(10, 21, 10, 10, 10, 100);
			const reference4 = createPartialValidReference(10, 100, 10, 10, 0, 10);
			const reference5 = createPartialValidReference(10, 101, 5, 10, 0, 10);
			expect(
				EditorUtils.getLowestElementReference([reference1, reference2, reference3, reference4, reference5])
			).toEqual(reference3);
		});

		test("should return the lowest element reference if there are offsets present", () => {
			const reference1 = createPartialValidReference(0, 120, 10, 0);
			const reference2 = createPartialValidReference(0, 100, 10, 0);

			const getOffset = (end: number, start: number, reference: PartialValidPlaceableReference) => {
				if (reference.id === reference2.id) {
					return 50;
				}
				return 0;
			};

			expect(EditorUtils.getLowestElementReference([reference1, reference2], getOffset)).toEqual(reference2);
		});
	});

	describe("calculateNumberOfPages", () => {
		test("should return 1 if element reference is undefined", () => {
			expect(EditorUtils.calculateNumberOfPages(200)).toEqual(1);
		});

		test("should return 1 if element reference is empty", () => {
			expect(EditorUtils.calculateNumberOfPages(200, [])).toEqual(1);
		});

		test("should return 1 if there are no elements higher than the page height", () => {
			const reference1 = createPartialValidReference(10, 10, 10, 10);
			const reference2 = createPartialValidReference(10, 100, 50, 200);
			const reference3 = createPartialValidReference(10, 190, 10, 10);

			expect(EditorUtils.calculateNumberOfPages(200, [reference1, reference2, reference3])).toEqual(1);
		});

		test("should return the correct number of pages if there are elements higher than the page height", () => {
			const reference1 = createPartialValidReference(10, 10, 10, 10);
			const reference2 = createPartialValidReference(10, 100, 110, 200);
			const reference3 = createPartialValidReference(10, 300, 50, 10, 0, 50.1);

			expect(EditorUtils.calculateNumberOfPages(200, [reference1, reference2, reference3])).toEqual(3);
		});
	});

	describe("isHorizontallyOverlap", () => {
		test("should return true if the elements have the same position and width", () => {
			const targetReference = createPartialValidReference(10, 10, 0, 20);
			const otherReference = createPartialValidReference(10, 20, 0, 20);
			expect(EditorUtils.isHorizontallyOverlap(targetReference, otherReference)).toEqual(true);
		});

		test("should return true if the other element partially overlaps", () => {
			const targetReference = createPartialValidReference(10, 10, 0, 20);
			const otherReference = createPartialValidReference(15, 20, 0, 20);
			expect(EditorUtils.isHorizontallyOverlap(targetReference, otherReference)).toEqual(true);
			expect(EditorUtils.isHorizontallyOverlap(otherReference, targetReference)).toEqual(true);
		});

		test("should return true if the other element fully overlaps", () => {
			const targetReference = createPartialValidReference(10, 10, 0, 20);
			const otherReference = createPartialValidReference(15, 20, 0, 10);
			expect(EditorUtils.isHorizontallyOverlap(targetReference, otherReference)).toEqual(true);
			expect(EditorUtils.isHorizontallyOverlap(otherReference, targetReference)).toEqual(true);
		});

		test("should return false if the elements don't overlaps", () => {
			const targetReference = createPartialValidReference(20, 10, 0, 20);
			const otherReference = createPartialValidReference(5, 20, 0, 10);
			expect(EditorUtils.isHorizontallyOverlap(targetReference, otherReference)).toEqual(false);
			expect(EditorUtils.isHorizontallyOverlap(otherReference, targetReference)).toEqual(false);
		});
	});

	describe("isElementOverlapSection", () => {
		const firstPortraitSection: PartialSection = {
			id: nanoid(),
			sectionUsage: SectionUsage.First,
			pageOrientation: PageOrientation.Portrait,
			footerHeight: {
				id: nanoid(),
				value: 20,
				unit: MeasureUnit.Millimeter,
			},
		};

		const remainingPortraitSection: PartialSection = {
			id: nanoid(),
			sectionUsage: SectionUsage.Remaining,
			pageOrientation: PageOrientation.Portrait,
			footerHeight: {
				id: nanoid(),
				value: 20,
				unit: MeasureUnit.Millimeter,
			},
		};
		test("should return true if the element overlaps the first page footer", () => {
			const reference = createPartialValidReference(0, 170, 20, 10);
			expect(EditorUtils.isElementOverlapFooter(reference, 200, () => undefined, firstPortraitSection)).toEqual(
				true
			);
		});

		test("should return true if the element overlaps the remaining page footer of the first segment", () => {
			const reference = createPartialValidReference(0, 370, 20, 10);
			const getSection = () => remainingPortraitSection;
			expect(EditorUtils.isElementOverlapFooter(reference, 200, getSection, firstPortraitSection)).toEqual(true);
		});

		test("should return true if the element overlaps the remaining page footer", () => {
			const reference = createPartialValidReference(0, 370, 20, 10);
			expect(
				EditorUtils.isElementOverlapFooter(reference, 200, () => undefined, remainingPortraitSection)
			).toEqual(true);
		});

		test("should return false if the element does not overlap with any footer", () => {
			const reference = createPartialValidReference(0, 270, 20, 10);
			const getSection = () => remainingPortraitSection;
			expect(EditorUtils.isElementOverlapFooter(reference, 200, getSection, firstPortraitSection)).toEqual(false);
		});

		test("should return false if there are no sections", () => {
			const reference = createPartialValidReference(0, 190, 20, 10);
			expect(EditorUtils.isElementOverlapFooter(reference, 200, () => undefined, undefined)).toEqual(false);
		});
	});

	describe("getActualBottomPageNumber", () => {
		const remainingSection: PartialSection = {
			id: nanoid(),
			sectionUsage: SectionUsage.Remaining,
			pageOrientation: PageOrientation.Portrait,
			headerHeight: {
				id: nanoid(),
				value: 25,
				unit: MeasureUnit.Millimeter,
			},
			footerHeight: {
				id: nanoid(),
				value: 20,
				unit: MeasureUnit.Millimeter,
			},
		};
		const pageHeight = 200;

		test("should return 1 if the element doesn't overlap the first page footer", () => {
			const referencePosY = 150;
			const reference = createPartialValidReference(10, referencePosY, 20, 10, 0, 20);
			const pageNumber = Math.ceil(referencePosY / pageHeight);
			const endOfElement = ElementsUtils.getActualBottomPosition(reference);

			expect(
				EditorUtils.getActualBottomPageNumber({
					pageNumber,
					pageHeight,
					remainingSection,
					previousEndOfElement: endOfElement,
				})
			).toEqual(1);
		});

		test("should return 2 if the element overlaps the first page footer", () => {
			const referencePosY = 190;
			const reference = createPartialValidReference(10, referencePosY, 20, 10, 0, 20);
			const pageNumber = Math.ceil(referencePosY / pageHeight);
			const endOfElement = ElementsUtils.getActualBottomPosition(reference);

			expect(
				EditorUtils.getActualBottomPageNumber({
					pageNumber,
					pageHeight,
					remainingSection,
					previousEndOfElement: endOfElement,
				})
			).toEqual(2);
		});

		test("should return the correct end page if the element overlaps multiple headers and footers", () => {
			const referencePosY = 190;
			const reference = createPartialValidReference(10, referencePosY, 165, 10, 0, 20);
			const pageNumber = Math.ceil(referencePosY / pageHeight);
			const endOfElement = ElementsUtils.getActualBottomPosition(reference);

			expect(
				EditorUtils.getActualBottomPageNumber({
					pageNumber,
					pageHeight,
					remainingSection,
					previousEndOfElement: endOfElement,
				})
			).toEqual(3);
		});

		test("should return 1 if the element doesn't extend beyond the first page and has no header or footer", () => {
			const referencePosY = 150;
			const reference = createPartialValidReference(10, referencePosY, 20, 10, 0, 20);
			const pageNumber = Math.ceil(referencePosY / pageHeight);
			const endOfElement = ElementsUtils.getActualBottomPosition(reference);

			expect(
				EditorUtils.getActualBottomPageNumber({
					pageNumber,
					pageHeight,
					previousEndOfElement: endOfElement,
				})
			).toEqual(1);
		});

		test("should return 2 if the element extends beyond the first page and has no header or footer", () => {
			const referencePosY = 150;
			const reference = createPartialValidReference(10, referencePosY, 30, 10, 0, 25);
			const pageNumber = Math.ceil(referencePosY / pageHeight);
			const endOfElement = ElementsUtils.getActualBottomPosition(reference);

			expect(
				EditorUtils.getActualBottomPageNumber({
					pageNumber,
					pageHeight,
					previousEndOfElement: endOfElement,
				})
			).toEqual(2);
		});

		test("should return 3 if the element starts on the first page, ends on the third page, and has no header and footer", () => {
			const referencePosY = 150;
			const reference = createPartialValidReference(10, referencePosY, 200, 10, 0, 100);
			const pageNumber = Math.ceil(referencePosY / pageHeight);
			const endOfElement = ElementsUtils.getActualBottomPosition(reference);

			expect(
				EditorUtils.getActualBottomPageNumber({
					pageNumber,
					pageHeight,
					previousEndOfElement: endOfElement,
				})
			).toEqual(3);
		});
	});
});

function createPosition(x: number, y: number): PlainMeasurePosition {
	return {
		x: {
			value: x,
			unit: MeasureUnit.Millimeter,
		},
		y: {
			value: y,
			unit: MeasureUnit.Millimeter,
		},
	};
}

function createPositionAndDimensions(
	x: number,
	y: number,
	minHeight: number,
	minWidth: number
): PlainMeasurePosition & PlainMeasureDimensions {
	return {
		...createPosition(x, y),
		minHeight: {
			value: minHeight,
			unit: MeasureUnit.Millimeter,
		},
		minWidth: {
			value: minWidth,
			unit: MeasureUnit.Millimeter,
		},
	};
}

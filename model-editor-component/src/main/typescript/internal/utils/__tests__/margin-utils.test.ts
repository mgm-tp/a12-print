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

import type { Margin, Margins, PartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/model";
import { MarginType, MeasureUnit } from "@com.mgmtp.a12.print/print-model-api/model";

import { EditorConst } from "../../constant/editor.js";
import { createPartialValidReference } from "../../../../../test/typescript/test-utils/index.js";

import {
	calculateNewMargin,
	changePartialMarginValue,
	getLimitBottomValue,
	getLimitElement,
	getLimitTopValue,
} from "../margin-utils.js";
import { ElementsUtils } from "../elements-utils.js";

const { MM_TO_PX } = EditorConst;

describe("margin utils", () => {
	describe("changePartialMarginValue", () => {
		const margins: Margins = {
			id: nanoid(),
			top: {
				id: nanoid(),
				type: MarginType.EXPLICIT,
				margin: {
					value: 10,
					unit: MeasureUnit.Millimeter,
					id: nanoid(),
				},
			},
		};

		test("should return new margin with provided side if origin is not provided", () => {
			const adjustedMargin = 10;
			const newMargins = changePartialMarginValue(adjustedMargin, "top");
			expect(newMargins.id).toBeTruthy();
			expect(newMargins.bottom).toBeUndefined();
			expect(newMargins.top).toMatchObject<Margin>(createExpectedMargin(adjustedMargin));
		});

		test("should return correct margin with provided side if origin is undefine and margin type is provided", () => {
			const adjustedMargin = 15;
			const newMargins = changePartialMarginValue(adjustedMargin, "bottom", undefined, MarginType.IMPLICIT);
			expect(newMargins.id).toBeTruthy();
			expect(newMargins.top).toBeUndefined();
			expect(newMargins.bottom).toMatchObject<Margin>(createExpectedMargin(adjustedMargin, MarginType.IMPLICIT));
		});

		test("should return origin margin with adjusted value", () => {
			const adjustedMargin = 20;
			const newMargins = changePartialMarginValue(adjustedMargin, "top", margins);
			expect(newMargins).toMatchObject({
				...margins,
				top: {
					...newMargins.top,
					margin: {
						...newMargins.top?.margin,
						value: adjustedMargin,
					},
				},
			});
		});

		test("should return origin margin with added margin side", () => {
			const addedMargin = 20;
			const newMargins = changePartialMarginValue(addedMargin, "bottom", margins);
			expect(newMargins).toMatchObject<Margins>({
				...margins,
				bottom: {
					id: expect.any(String),
					type: MarginType.EXPLICIT,
					margin: {
						id: expect.any(String),
						unit: MeasureUnit.Millimeter,
						value: addedMargin,
					},
				},
			});
		});

		test("should return origin margin with undefined value if value is 0", () => {
			const newMargins = changePartialMarginValue(0, "top", margins);
			expect(newMargins).toMatchObject<Margins>({
				...margins,
				top: undefined,
			});
		});
	});

	describe("calculateNewMargin", () => {
		const reference: PartialValidPlaceableReference = {
			id: nanoid(),
			refId: nanoid(),
			position: {
				id: nanoid(),
				x: {
					id: nanoid(),
					value: 100,
					unit: MeasureUnit.Millimeter,
				},
				y: {
					id: nanoid(),
					value: 100,
					unit: MeasureUnit.Millimeter,
				},
			},
			dimensions: {
				id: nanoid(),
				minHeight: {
					id: nanoid(),
					value: 50,
					unit: MeasureUnit.Millimeter,
				},
				minWidth: {
					id: nanoid(),
					value: 20,
					unit: MeasureUnit.Millimeter,
				},
			},
		};

		test("should return correct top margin value", () => {
			const [marginValue, isSkip] = calculateNewMargin({
				isTop: true,
				anchorClientY: MM_TO_PX(100),
				currentClientY: MM_TO_PX(50),
				reference,
				limitPosY: 0,
				zoomFactor: 1,
			});

			expect(isSkip).toBe(false);
			expect(marginValue).toBe(50);
		});

		test("should return correct top margin value with zoom factor", () => {
			const [marginValue, isSkip] = calculateNewMargin({
				isTop: true,
				anchorClientY: MM_TO_PX(100),
				currentClientY: MM_TO_PX(50),
				reference,
				limitPosY: 10,
				zoomFactor: 0.75,
			});
			expect(isSkip).toBe(false);
			expect(marginValue).toBe(66);
		});

		test("should return isSkip true if top margin value is lower than limit", () => {
			const [marginValue, isSkip] = calculateNewMargin({
				isTop: true,
				anchorClientY: MM_TO_PX(100),
				currentClientY: MM_TO_PX(50),
				reference,
				limitPosY: MM_TO_PX(30),
				zoomFactor: 1,
			});
			expect(isSkip).toBe(true);
			expect(marginValue).toBe(50);
		});

		test("should return isSkip true if top margin value is lower than limit with zoom factor", () => {
			const [marginValue, isSkip] = calculateNewMargin({
				isTop: true,
				anchorClientY: MM_TO_PX(100),
				currentClientY: MM_TO_PX(50),
				reference,
				limitPosY: 50,
				zoomFactor: 1.5,
			});
			expect(isSkip).toBe(false);
			expect(marginValue).toBe(33);
		});

		test("should return correct bottom margin value", () => {
			const [marginValue, isSkip] = calculateNewMargin({
				isTop: false,
				anchorClientY: MM_TO_PX(100),
				currentClientY: MM_TO_PX(210),
				reference,
				limitPosY: 0,
				zoomFactor: 1,
			});

			expect(isSkip).toBe(false);
			expect(marginValue).toBe(110);
		});

		test("should return correct bottom margin value with zoom factor", () => {
			const [marginValue, isSkip] = calculateNewMargin({
				isTop: false,
				anchorClientY: MM_TO_PX(100),
				currentClientY: MM_TO_PX(210),
				reference,
				limitPosY: 0,
				zoomFactor: 0.3,
			});

			expect(isSkip).toBe(false);
			expect(marginValue).toBe(366);
		});

		test("should return isSkip true if bottom margin value is higher than limit", () => {
			const [marginValue, isSkip] = calculateNewMargin({
				isTop: false,
				anchorClientY: MM_TO_PX(100),
				currentClientY: MM_TO_PX(210),
				reference,
				limitPosY: 0,
				zoomFactor: 0.3,
			});

			expect(isSkip).toBe(false);
			expect(marginValue).toBe(366);
		});

		test("should return isSkip true if bottom margin value is higher than limit with zoom factor", () => {
			const [marginValue, isSkip] = calculateNewMargin({
				isTop: false,
				anchorClientY: MM_TO_PX(100),
				currentClientY: MM_TO_PX(220),
				reference,
				limitPosY: 200,
				zoomFactor: 1.2,
			});

			expect(isSkip).toBe(true);
			expect(marginValue).toBe(100);
		});
	});

	describe("getLimitTopValue", () => {
		test("should return the element limit if element limit is higher than the zone limit", () => {
			expect(getLimitTopValue(50, { top: { unit: MeasureUnit.Millimeter, value: 40 } })).toBe(50);
		});

		test("should return the zone limit if the zone limit is higher than element limit", () => {
			expect(getLimitTopValue(50, { top: { unit: MeasureUnit.Millimeter, value: 60 } })).toBe(60);
		});

		test("should return the element limit if only the element limit is provided", () => {
			expect(getLimitTopValue(50)).toBe(50);
		});

		test("should return the zone limit if only the zone limit is provided", () => {
			expect(getLimitTopValue(undefined, { top: { unit: MeasureUnit.Millimeter, value: 60 } })).toBe(60);
		});

		test("should return undefined if no parameters are provided", () => {
			expect(getLimitTopValue()).toBe(undefined);
		});
	});

	describe("getLimitBottomValue", () => {
		test("should return the element limit if the element limit is smaller than the zone limit", () => {
			expect(getLimitBottomValue(100, { bottom: { unit: MeasureUnit.Millimeter, value: 120 } })).toBe(100);
		});

		test("should return the zone limit if only the zone limit is smaller than the element limit", () => {
			expect(getLimitBottomValue(120, { bottom: { unit: MeasureUnit.Millimeter, value: 100 } })).toBe(100);
		});

		test("should return the element limit if only the element limit is provided", () => {
			expect(getLimitBottomValue(120)).toBe(120);
		});

		test("should return the zone limit if only the zone limit is provided", () => {
			expect(getLimitBottomValue(120)).toBe(120);
		});

		test("should return undefined if no parameters are provided", () => {
			expect(getLimitBottomValue(undefined)).toBe(undefined);
		});
	});

	describe("getLimitElement", () => {
		const targetReference = createPartialValidReference(500, 500, 50, 100);
		const nonHorizontalTopOverlap = [
			createPartialValidReference(400, 300, 50, 99),
			createPartialValidReference(601, 400, 50, 50),
		];
		const expectedTopReference = createPartialValidReference(450, 200, 50, 51);
		const topReferences = [
			createPartialValidReference(500, 100, 50, 50),
			...nonHorizontalTopOverlap,
			expectedTopReference,
		];

		const nonHorizontalBottomOverlap = [
			createPartialValidReference(400, 600, 50, 99),
			createPartialValidReference(601, 700, 50, 50),
		];
		const expectedBottomReference = createPartialValidReference(400, 700, 50, 150);
		const bottomReferences = [
			...nonHorizontalBottomOverlap,
			expectedBottomReference,
			createPartialValidReference(500, 800, 50, 50),
		];

		test("should return correct top element reference", () => {
			const [top, bottom] = getLimitElement(topReferences, targetReference);
			expect(top).toBe(ElementsUtils.getActualBottomPosition(expectedTopReference));
			expect(bottom).toBe(undefined);
		});

		test("should return correct bottom element reference", () => {
			const [top, bottom] = getLimitElement(bottomReferences, targetReference);
			expect(top).toBe(undefined);
			expect(bottom).toBe(ElementsUtils.getActualTopPosition(expectedBottomReference));
		});

		test("should return correct element reference for top and bottom", () => {
			const [top, bottom] = getLimitElement([...topReferences, ...bottomReferences], targetReference);
			expect(top).toBe(ElementsUtils.getActualBottomPosition(expectedTopReference));
			expect(bottom).toBe(ElementsUtils.getActualTopPosition(expectedBottomReference));
		});

		test("should return undefined if there are no limit element references", () => {
			const [top, bottom] = getLimitElement(
				[...nonHorizontalTopOverlap, ...nonHorizontalBottomOverlap],
				targetReference
			);
			expect(top).toBe(undefined);
			expect(bottom).toBe(undefined);
		});

		test("should return correct top element reference including margins", () => {
			const expectedTopReference = createPartialValidReference(550, 390, 50, 100, 0, 40);
			const [top, bottom] = getLimitElement(
				[createPartialValidReference(500, 410, 50, 50, 0, 10), expectedTopReference],
				targetReference
			);
			expect(top).toBe(ElementsUtils.getActualBottomPosition(expectedTopReference));
			expect(bottom).toBe(undefined);
		});

		test("should return correct bottom element reference including margins", () => {
			const expectedBottomReference = createPartialValidReference(550, 610, 50, 100, 75, 0);
			const [top, bottom] = getLimitElement(
				[createPartialValidReference(500, 550, 50, 50, 10, 10), expectedBottomReference],
				targetReference
			);
			expect(bottom).toBe(ElementsUtils.getActualTopPosition(expectedBottomReference));
			expect(top).toBe(undefined);
		});
	});
});

function createExpectedMargin(value: number, type: MarginType = MarginType.EXPLICIT): Margin {
	return {
		id: expect.any(String),
		type,
		margin: {
			value,
			unit: MeasureUnit.Millimeter,
			id: expect.any(String),
		},
	};
}

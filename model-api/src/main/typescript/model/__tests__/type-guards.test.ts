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
import { SectionUsage, type Section, type Watermark } from "../print-model.js";
import { isSection, isWatermark, PageOrientation } from "../print-model.js";
import { MeasureUnit } from "../elements/base.js";
import { ElementType, PrintModelElement } from "../elements/print-model-element.js";
import type { PartialSection, PartialWatermark } from "../partial.js";
import { isPartialSection, isPartialWatermark } from "../partial.js";

const measure = { id: "m-id", value: 20, unit: MeasureUnit.Millimeter };

const baseSection: Section = {
	id: "section-id",
	title: "My Section",
	pageOrientation: PageOrientation.Portrait,
	headerHeight: measure,
	footerHeight: { id: "fh-id", value: 10, unit: MeasureUnit.Millimeter },
	elementReferences: [],
	sectionUsage: SectionUsage.First,
};

const fragmentSection: Section = {
	...baseSection,
	sectionUsage: SectionUsage.Remaining,
};

const baseWatermark: Watermark = {
	id: "watermark-id",
	title: "My Watermark",
	pageOrientation: PageOrientation.Portrait,
	elementReferences: [],
};

const partialSection: PartialSection = {
	id: "partial-section-id",
	pageOrientation: PageOrientation.Portrait,
	headerHeight: measure,
};

const partialWatermark: PartialWatermark = {
	id: "partial-watermark-id",
	pageOrientation: PageOrientation.Portrait,
};

describe("isSection / isWatermark type guards (headerHeight discriminator)", () => {
	describe("isSection", () => {
		it("returns true for a Section with headerHeight", () => {
			expect(isSection(baseSection)).toBe(true);
		});

		it("returns true for a Section of a fragment model", () => {
			expect(isSection(fragmentSection)).toBe(true);
		});

		it("returns false for a Watermark (no headerHeight)", () => {
			expect(isSection(baseWatermark)).toBe(false);
		});

		it("returns false for a plain object missing headerHeight", () => {
			expect(
				isSection({ id: "x", title: "t", pageOrientation: PageOrientation.Portrait, elementReferences: [] })
			).toBe(false);
		});

		it("returns false for null and primitives", () => {
			expect(isSection(null)).toBe(false);
			expect(isSection(undefined)).toBe(false);
			expect(isSection("string")).toBe(false);
		});
	});

	describe("isWatermark", () => {
		it("returns true for a Watermark (no headerHeight)", () => {
			expect(isWatermark(baseWatermark)).toBe(true);
		});

		it("returns false for a Section (has headerHeight)", () => {
			expect(isWatermark(baseSection)).toBe(false);
		});

		it("returns false for a plain object missing required fields", () => {
			expect(isWatermark({ id: "x", pageOrientation: PageOrientation.Portrait })).toBe(false);
		});
	});
});

describe("isPartialSection / isPartialWatermark type guards", () => {
	describe("isPartialSection", () => {
		it("returns true for a PartialSection (has pageOrientation and headerHeight)", () => {
			expect(isPartialSection(partialSection)).toBe(true);
		});

		it("returns false for a PartialWatermark (no headerHeight)", () => {
			expect(isPartialSection(partialWatermark)).toBe(false);
		});
	});

	describe("isPartialWatermark", () => {
		it("returns true for a PartialWatermark (has pageOrientation, no headerHeight)", () => {
			expect(isPartialWatermark(partialWatermark)).toBe(true);
		});

		it("returns false for a PartialSection (has headerHeight)", () => {
			expect(isPartialWatermark(partialSection)).toBe(false);
		});
	});
});

describe("PrintModelElement.isFragmentElement type guard", () => {
	const baseElement: PrintModelElement = { id: "element-id", type: ElementType.Text, name: "My Text" };

	it("returns true for a fragment element with fragmentDimensions", () => {
		expect(
			PrintModelElement.isFragmentElement({
				...baseElement,
				isFragment: true,
				fragmentDimensions: { id: "fd-id", width: measure, height: measure },
			})
		).toBe(true);
	});

	it("returns false for a fragment element without fragmentDimensions", () => {
		expect(PrintModelElement.isFragmentElement({ ...baseElement, isFragment: true })).toBe(false);
	});

	it("returns false for a non-fragment element carrying fragmentDimensions", () => {
		expect(
			PrintModelElement.isFragmentElement({
				...baseElement,
				fragmentDimensions: { id: "fd-id", width: measure, height: measure },
			})
		).toBe(false);
	});

	it("returns false for a plain element", () => {
		expect(PrintModelElement.isFragmentElement(baseElement)).toBe(false);
	});
});

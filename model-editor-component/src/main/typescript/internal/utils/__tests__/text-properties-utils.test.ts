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
import type { PartialTextProperties } from "@com.mgmtp.a12.print/print-model-api/model";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";

import { hasAnyTextProperties, hasNonInheritedTextProperties } from "../text-properties-utils.js";

const makeInputSource = (source: PossibleInputSource, value?: unknown) => ({
	id: "id",
	source,
	path: "textProperties.bold",
	value,
});

describe("hasNonInheritedTextProperties", () => {
	it("returns false for undefined", () => {
		expect(hasNonInheritedTextProperties(undefined)).toBe(false);
	});

	it("returns false when textProperties has no sub-properties", () => {
		const textProperties = { id: "id" } as PartialTextProperties;
		expect(hasNonInheritedTextProperties(textProperties)).toBe(false);
	});

	it("returns false when all properties have INHERITED source", () => {
		const textProperties: PartialTextProperties = {
			id: "id",
			bold: makeInputSource(PossibleInputSource.INHERITED) as PartialTextProperties["bold"],
			italic: makeInputSource(PossibleInputSource.INHERITED) as PartialTextProperties["italic"],
		};
		expect(hasNonInheritedTextProperties(textProperties)).toBe(false);
	});

	it("returns true when any property has INPUT source", () => {
		const textProperties: PartialTextProperties = {
			id: "id",
			bold: makeInputSource(PossibleInputSource.INPUT, true) as PartialTextProperties["bold"],
			italic: makeInputSource(PossibleInputSource.INHERITED) as PartialTextProperties["italic"],
		};
		expect(hasNonInheritedTextProperties(textProperties)).toBe(true);
	});

	it("returns true when any property has DEFAULT source", () => {
		const textProperties: PartialTextProperties = {
			id: "id",
			color: makeInputSource(PossibleInputSource.DEFAULT, "#000000") as PartialTextProperties["color"],
		};
		expect(hasNonInheritedTextProperties(textProperties)).toBe(true);
	});

	it("returns true for INPUT source even when value is undefined", () => {
		const textProperties: PartialTextProperties = {
			id: "id",
			bold: makeInputSource(PossibleInputSource.INPUT) as PartialTextProperties["bold"],
		};
		expect(hasNonInheritedTextProperties(textProperties)).toBe(true);
	});

	it("returns true when only one of many properties is INPUT", () => {
		const textProperties: PartialTextProperties = {
			id: "id",
			bold: makeInputSource(PossibleInputSource.INHERITED) as PartialTextProperties["bold"],
			italic: makeInputSource(PossibleInputSource.INHERITED) as PartialTextProperties["italic"],
			alignment: makeInputSource(PossibleInputSource.INPUT) as PartialTextProperties["alignment"],
		};
		expect(hasNonInheritedTextProperties(textProperties)).toBe(true);
	});
});

describe("hasAnyTextProperties", () => {
	it("returns false for undefined", () => {
		expect(hasAnyTextProperties(undefined)).toBe(false);
	});

	it("returns true for an object (even empty)", () => {
		expect(hasAnyTextProperties({})).toBe(true);
	});

	it("returns true for textProperties with INHERITED source", () => {
		const textProperties: PartialTextProperties = {
			id: "id",
			bold: makeInputSource(PossibleInputSource.INHERITED) as PartialTextProperties["bold"],
		};
		expect(hasAnyTextProperties(textProperties)).toBe(true);
	});

	it("returns true for textProperties with INPUT source", () => {
		const textProperties: PartialTextProperties = {
			id: "id",
			bold: makeInputSource(PossibleInputSource.INPUT, true) as PartialTextProperties["bold"],
		};
		expect(hasAnyTextProperties(textProperties)).toBe(true);
	});
});

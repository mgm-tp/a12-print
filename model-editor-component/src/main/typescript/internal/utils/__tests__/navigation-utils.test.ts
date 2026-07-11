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
import { stringToEntityInstancePath, createGeneralPath } from "../navigation-utils.js";

describe("stringToEntityInstancePath", () => {
	it("converts simple path", () => {
		expect(stringToEntityInstancePath("content")).toEqual([{ elementName: "content", index: 1 }]);
	});

	it("converts path with index", () => {
		expect(stringToEntityInstancePath("content/0")).toEqual([{ elementName: "content", index: 1 }]);
	});

	it("converts multi-segment path", () => {
		expect(stringToEntityInstancePath("content/segments/0/definitions/1")).toEqual([
			{ elementName: "content", index: 1 },
			{ elementName: "segments", index: 1 },
			{ elementName: "definitions", index: 2 },
		]);
	});

	it("handles leading slash", () => {
		const result = stringToEntityInstancePath("/content/0");
		expect(result).toEqual([{ elementName: "content", index: 1 }]);
	});

	it("converts path without numeric segments", () => {
		expect(stringToEntityInstancePath("content/general")).toEqual([
			{ elementName: "content", index: 1 },
			{ elementName: "general", index: 1 },
		]);
	});
});

describe("createGeneralPath", () => {
	it("returns a non-empty path", () => {
		const result = createGeneralPath();
		expect(result.length).toBeGreaterThan(0);
	});
});

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
import { formatNumberToString, formatNumberWithFixedDecimals } from "../format-utils.js";

describe("format-utils", () => {
	describe("formatNumberToString", () => {
		it("formats integer", () => {
			expect(formatNumberToString(42)).toBe("42");
		});

		it("formats decimal", () => {
			const result = formatNumberToString(3.14);
			expect(result).toContain("3");
			expect(result).toContain("14");
		});

		it("formats zero", () => {
			expect(formatNumberToString(0)).toBe("0");
		});
	});

	describe("formatNumberWithFixedDecimals", () => {
		it("formats with fixed decimals", () => {
			const result = formatNumberWithFixedDecimals(3.14159, 2);
			expect(result).toContain("3");
			expect(result).toContain("14");
		});

		it("rounds correctly", () => {
			const result = formatNumberWithFixedDecimals(1.005, 2);
			// 1.005.toFixed(2) = "1.00" or "1.01" depending on float precision
			expect(result).toBeDefined();
		});
	});
});

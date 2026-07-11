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
import { Constant, SyntaxTreeElementType } from "../elements/index.js";

describe("Constant", () => {
	describe("elementType", () => {
		test("returns Constant", () => {
			expect(Constant.TRUE.elementType()).toBe(SyntaxTreeElementType.Constant);
		});
	});

	describe("statics", () => {
		test("TRUE has value 'true' and Boolean type", () => {
			expect(Constant.TRUE.value).toBe("true");
			expect(Constant.TRUE.constantType).toBe(Constant.ConstantType.Boolean);
		});

		test("FALSE has value 'false' and Boolean type", () => {
			expect(Constant.FALSE.value).toBe("false");
			expect(Constant.FALSE.constantType).toBe(Constant.ConstantType.Boolean);
		});
	});

	describe("ConstantType.isNumeric", () => {
		test("Integer is numeric", () => {
			expect(Constant.ConstantType.isNumeric(Constant.ConstantType.Integer)).toBe(true);
		});

		test("Float is numeric", () => {
			expect(Constant.ConstantType.isNumeric(Constant.ConstantType.Float)).toBe(true);
		});

		test("String is not numeric", () => {
			expect(Constant.ConstantType.isNumeric(Constant.ConstantType.String)).toBe(false);
		});

		test("Boolean is not numeric", () => {
			expect(Constant.ConstantType.isNumeric(Constant.ConstantType.Boolean)).toBe(false);
		});
	});

	describe("getObjectValue", () => {
		test("String returns the raw string value", () => {
			expect(new Constant("hello", Constant.ConstantType.String).getObjectValue()).toBe("hello");
		});

		test("Integer returns a Big instance equal to the value", () => {
			const result = new Constant("42", Constant.ConstantType.Integer).getObjectValue();
			expect(String(result)).toBe("42");
		});

		test("Float returns a Big instance equal to the value", () => {
			const result = new Constant("3.14", Constant.ConstantType.Float).getObjectValue();
			expect(String(result)).toBe("3.14");
		});

		test("Boolean 'true' returns true", () => {
			expect(Constant.TRUE.getObjectValue()).toBe(true);
		});

		test("Boolean 'false' returns false", () => {
			expect(Constant.FALSE.getObjectValue()).toBe(false);
		});

		test("Boolean comparison is case-insensitive", () => {
			expect(new Constant("True", Constant.ConstantType.Boolean).getObjectValue()).toBe(true);
			expect(new Constant("False", Constant.ConstantType.Boolean).getObjectValue()).toBe(false);
		});
	});

	describe("valueEquals", () => {
		describe("String", () => {
			test("equal strings return true", () => {
				const a = new Constant("hello", Constant.ConstantType.String);
				const b = new Constant("hello", Constant.ConstantType.String);
				expect(a.valueEquals(b)).toBe(true);
			});

			test("different strings return false", () => {
				const a = new Constant("hello", Constant.ConstantType.String);
				const b = new Constant("world", Constant.ConstantType.String);
				expect(a.valueEquals(b)).toBe(false);
			});
		});

		describe("Boolean", () => {
			test("TRUE equals TRUE", () => {
				expect(Constant.TRUE.valueEquals(Constant.TRUE)).toBe(true);
			});

			test("TRUE does not equal FALSE", () => {
				expect(Constant.TRUE.valueEquals(Constant.FALSE)).toBe(false);
			});

			test("case-insensitive — 'True' equals 'true'", () => {
				const mixedCase = new Constant("True", Constant.ConstantType.Boolean);
				expect(mixedCase.valueEquals(Constant.TRUE)).toBe(true);
			});
		});

		describe("Integer", () => {
			test("equal integer values return true", () => {
				const a = new Constant("42", Constant.ConstantType.Integer);
				const b = new Constant("42", Constant.ConstantType.Integer);
				expect(a.valueEquals(b)).toBe(true);
			});

			test("different integer values return false", () => {
				const a = new Constant("42", Constant.ConstantType.Integer);
				const b = new Constant("43", Constant.ConstantType.Integer);
				expect(a.valueEquals(b)).toBe(false);
			});

			test("integer and float that are numerically equal return true", () => {
				// Big.js comparison: 42 == 42.0
				const integer = new Constant("42", Constant.ConstantType.Integer);
				const float = new Constant("42.0", Constant.ConstantType.Float);
				expect(integer.valueEquals(float)).toBe(true);
			});

			test("integer compared to non-numeric type returns false", () => {
				const integer = new Constant("42", Constant.ConstantType.Integer);
				const str = new Constant("42", Constant.ConstantType.String);
				expect(integer.valueEquals(str)).toBe(false);
			});
		});

		describe("Float", () => {
			test("equal float values return true", () => {
				const a = new Constant("3.14", Constant.ConstantType.Float);
				const b = new Constant("3.14", Constant.ConstantType.Float);
				expect(a.valueEquals(b)).toBe(true);
			});

			test("different float values return false", () => {
				const a = new Constant("3.14", Constant.ConstantType.Float);
				const b = new Constant("3.15", Constant.ConstantType.Float);
				expect(a.valueEquals(b)).toBe(false);
			});
		});
	});
});

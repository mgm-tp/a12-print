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
import { ReferenceSegment, SyntaxTreeElementType } from "../../internal/elements/index.js";

import { ComputationParser } from "../computation-parser.js";
import { Variable } from "../elements/index.js";

describe("Variable", () => {
	describe("elementType", () => {
		test("returns Variable", () => {
			expect(ComputationParser.variable("a/b").elementType()).toBe(SyntaxTreeElementType.Variable);
		});
	});

	describe("compareSegments", () => {
		test("identical segment arrays return 0", () => {
			const segs = [new ReferenceSegment("a", false, false), new ReferenceSegment("b", false, false)];
			expect(Variable.compareSegments(segs, segs)).toBe(0);
		});

		test("empty arrays return 0", () => {
			expect(Variable.compareSegments([], [])).toBe(0);
		});

		test("differing label produces non-zero", () => {
			const a = [new ReferenceSegment("a", false, false)];
			const b = [new ReferenceSegment("b", false, false)];
			expect(Variable.compareSegments(a, b)).not.toBe(0);
		});

		test("non-list sorts before list when labels are equal", () => {
			// compareBoolean(false, true) returns negative
			const nonList = [new ReferenceSegment("a", false, false)];
			const list = [new ReferenceSegment("a", true, false)];
			expect(Variable.compareSegments(nonList, list)).toBeLessThan(0);
			expect(Variable.compareSegments(list, nonList)).toBeGreaterThan(0);
		});

		test("non-turning-group sorts before turning-group when label and isList are equal", () => {
			const plain = [new ReferenceSegment("a", false, false)];
			const turning = [new ReferenceSegment("a", false, true)];
			expect(Variable.compareSegments(plain, turning)).toBeLessThan(0);
		});

		test("shorter array sorts before longer array with same prefix", () => {
			const shorter = [new ReferenceSegment("a", false, false)];
			const longer = [new ReferenceSegment("a", false, false), new ReferenceSegment("b", false, false)];
			expect(Variable.compareSegments(shorter, longer)).toBeLessThan(0);
			expect(Variable.compareSegments(longer, shorter)).toBeGreaterThan(0);
		});
	});

	describe("compareFull", () => {
		test("relative sorts before absolute (false < true)", () => {
			const rel = ComputationParser.variable("a/b");
			const abs = ComputationParser.variable("/a/b");
			expect(Variable.compareFull(rel, abs)).toBeLessThan(0);
			expect(Variable.compareFull(abs, rel)).toBeGreaterThan(0);
		});

		test("identical variables return 0", () => {
			const a = ComputationParser.variable("a/b");
			const b = ComputationParser.variable("a/b");
			expect(Variable.compareFull(a, b)).toBe(0);
		});

		test("same isAbsolute, different path — ordered by segments", () => {
			const a = ComputationParser.variable("a/b");
			const b = ComputationParser.variable("c/d");
			expect(Variable.compareFull(a, b)).not.toBe(0);
		});
	});

	describe("join", () => {
		test("absolute prefix preserves isAbsolute and concatenates segments", () => {
			const prefix = ComputationParser.variable("/a/b");
			const postfix = ComputationParser.variable("c/d");
			const result = Variable.join(prefix, postfix);
			expect(result.isAbsolute).toBe(true);
			expect(result.segments.map(s => s.label)).toEqual(["a", "b", "c", "d"]);
		});

		test("relative prefix produces relative result", () => {
			const prefix = ComputationParser.variable("a/b");
			const postfix = ComputationParser.variable("c");
			const result = Variable.join(prefix, postfix);
			expect(result.isAbsolute).toBe(false);
			expect(result.segments).toHaveLength(3);
		});
	});

	describe("isPrefixOf", () => {
		test("throws when either path is relative", () => {
			const rel = ComputationParser.variable("a/b");
			const abs = ComputationParser.variable("/a/b");
			expect(() => rel.isPrefixOf(abs)).toThrow("requires absolute paths");
			expect(() => abs.isPrefixOf(rel)).toThrow("requires absolute paths");
		});

		test("a path is a prefix of itself", () => {
			const a = ComputationParser.variable("/a/b");
			const b = ComputationParser.variable("/a/b");
			expect(a.isPrefixOf(b)).toBe(true);
		});

		test("proper prefix returns true", () => {
			const prefix = ComputationParser.variable("/a/b");
			const full = ComputationParser.variable("/a/b/c");
			expect(prefix.isPrefixOf(full)).toBe(true);
		});

		test("different path returns false", () => {
			const a = ComputationParser.variable("/a/b");
			const b = ComputationParser.variable("/x/y");
			expect(a.isPrefixOf(b)).toBe(false);
		});

		test("longer variable is never a prefix of a shorter one", () => {
			const longer = ComputationParser.variable("/a/b/c");
			const shorter = ComputationParser.variable("/a/b");
			expect(longer.isPrefixOf(shorter)).toBe(false);
		});
	});

	describe("getParent", () => {
		test("removes last segment", () => {
			const v = ComputationParser.variable("/a/b/c");
			const parent = v.getParent();
			expect(parent.isAbsolute).toBe(true);
			expect(parent.segments.map(s => s.label)).toEqual(["a", "b"]);
		});

		test("single-segment variable produces empty segments", () => {
			const v = ComputationParser.variable("/a");
			const parent = v.getParent();
			expect(parent.isAbsolute).toBe(true);
			expect(parent.segments).toHaveLength(0);
		});
	});

	describe("compareTo", () => {
		test("delegates to compareFull", () => {
			const a = ComputationParser.variable("a/b");
			const b = ComputationParser.variable("c/d");
			expect(a.compareTo(b)).toBe(Variable.compareFull(a, b));
		});
	});
});

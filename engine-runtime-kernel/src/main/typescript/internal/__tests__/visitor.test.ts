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
import { ComputationParser } from "../../a12internal/computation-parser.js";
import type { Variable } from "../../a12internal/elements/index.js";

import { Constant, TreeHeight, VariableSearch } from "../elements/index.js";

describe("TreeHeight", () => {
	const parser = new ComputationParser();

	test("Constant leaf counts as 1", () => {
		expect(TreeHeight.find(Constant.TRUE)).toBe(1);
	});

	test("Variable leaf counts as 1", () => {
		const v = ComputationParser.variable("a/b");
		expect(TreeHeight.find(v)).toBe(1);
	});

	test("Dereference wrapping a Variable counts as 2", () => {
		// Dereference(1) + Variable(1) = 2
		const element = parser.parseScript("[a/b]");
		expect(TreeHeight.find(element)).toBe(2);
	});

	test("Compare with two Dereference branches counts as 5", () => {
		// Compare(1) + Dereference(1) + Variable(1) + Dereference(1) + Variable(1) = 5
		const element = parser.parseScript("[a/b] == [c/d]");
		expect(TreeHeight.find(element)).toBe(5);
	});

	test("Compare with Dereference and Constant counts as 4", () => {
		// Compare(1) + Dereference(1) + Variable(1) + Constant(1) = 4
		const element = parser.parseScript("[a/b] == 1");
		expect(TreeHeight.find(element)).toBe(4);
	});

	test("Logic AND over two Compare subtrees counts as 9", () => {
		// Logic(1) + 2 × (Compare(1) + Dereference(1) + Variable(1) + Constant(1)) = 1 + 8 = 9
		const element = parser.parseScript("[a/b] == 1 AND [c/d] == 2");
		expect(TreeHeight.find(element)).toBe(9);
	});

	test("Predicate with EmptySignature counts as 2", () => {
		// Predicate(1) + EmptySignature(1) = 2
		const element = parser.parseScript("FieldFilled");
		expect(TreeHeight.find(element)).toBe(2);
	});

	test("Predicate with ParameterList containing one Variable counts as 3", () => {
		// Predicate(1) + ParameterList(1) + Variable(1) = 3
		const element = parser.parseScript("FieldFilled(a/b)");
		expect(TreeHeight.find(element)).toBe(3);
	});
});

describe("VariableSearch", () => {
	test("findDistinctVariables with a Variable returns a Set of size 1", () => {
		const v = ComputationParser.variable("a/b");
		const result = VariableSearch.findDistinctVariables(v);
		expect(result.size).toBe(1);
	});

	test("findDistinctVariables returns the exact Variable instance passed in", () => {
		const v = ComputationParser.variable("a/b");
		const result = VariableSearch.findDistinctVariables(v);
		expect(result.has(v)).toBe(true);
	});

	test("the same Variable instance passed twice produces a Set of size 1", () => {
		const v = ComputationParser.variable("a/b");
		const result1 = VariableSearch.findDistinctVariables(v);
		const result2 = VariableSearch.findDistinctVariables(v);
		// each call creates a fresh Set — both contain the same reference
		expect(result1.size).toBe(1);
		expect(result2.has(v)).toBe(true);
	});

	test("create builds a custom fold over a Variable", () => {
		const collectLabels = VariableSearch.create(
			(v: Variable, acc: string[]) => {
				acc.push(...v.segments.map(s => s.label));
			},
			() => [] as string[]
		);
		const v = ComputationParser.variable("x/y/z");
		const labels = collectLabels(v);
		expect(labels).toEqual(["x", "y", "z"]);
	});
});

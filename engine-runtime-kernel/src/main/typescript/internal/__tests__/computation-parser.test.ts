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
import type { ComputationAlternative } from "@com.mgmtp.a12.print/print-model-api/model";

import { ComputationParser } from "../../a12internal/computation-parser.js";
import type { Variable } from "../../a12internal/elements/index.js";

import type { Dereference } from "../elements/index.js";
import {
	Arithmetic,
	Compare,
	Constant,
	Logic,
	Predicate,
	ReferenceSegment,
	SyntaxTreeElementType,
} from "../elements/index.js";

describe("ComputationParser", () => {
	test("should parse without exception", () => {
		const parser = new ComputationParser();
		const source =
			"FieldFilled(../relative/path1) " +
			"AND ( " +
			'[../relative/path2] == "World" ' +
			'OR [/absolute/path1] == "Hello" ' +
			")";
		const result = parser.parseTree(source);

		expect(result.source).toBe(source);
		expect(result.root).not.toBeNull();
	});
});

describe("parseScript", () => {
	const parser = new ComputationParser();

	test("logic AND", () => {
		const element = parser.parseScript("[a/b] == 1 AND [c/d] == 2");
		expect(element.elementType()).toBe(SyntaxTreeElementType.Logic);
		const logic = element as Logic;
		expect(logic.operator).toBe(Logic.Operator.And);
		expect(logic.branches).toHaveLength(2);
	});

	test("logic OR", () => {
		const element = parser.parseScript("[a/b] == 1 OR [c/d] == 2");
		expect(element.elementType()).toBe(SyntaxTreeElementType.Logic);
		expect((element as Logic).operator).toBe(Logic.Operator.Or);
	});

	test("chained AND produces right-nested binary tree", () => {
		// Grammar: A AND B AND C → Logic(And, [A, Logic(And, [B, C])]), not a flat 3-branch list
		const element = parser.parseScript("[a/b] == 1 AND [c/d] == 2 AND [e/f] == 3");
		expect(element.elementType()).toBe(SyntaxTreeElementType.Logic);
		const outer = element as Logic;
		expect(outer.operator).toBe(Logic.Operator.And);
		expect(outer.branches).toHaveLength(2);
		expect(outer.branches[1].elementType()).toBe(SyntaxTreeElementType.Logic);
	});

	test("compare ==", () => {
		const element = parser.parseScript('[a/b] == "hello"');
		expect(element.elementType()).toBe(SyntaxTreeElementType.Compare);
		expect((element as Compare).operator).toBe(Compare.Operator.Equality);
	});

	test("compare !=", () => {
		const element = parser.parseScript('[a/b] != "hello"');
		expect((element as Compare).operator).toBe(Compare.Operator.UnEquality);
	});

	test("compare >", () => {
		const element = parser.parseScript("[a/b] > 42");
		expect((element as Compare).operator).toBe(Compare.Operator.GreaterThan);
	});

	test("compare >=", () => {
		const element = parser.parseScript("[a/b] >= 42");
		expect((element as Compare).operator).toBe(Compare.Operator.GreaterThanOrEqual);
	});

	test("compare <", () => {
		const element = parser.parseScript("[a/b] < 42");
		expect((element as Compare).operator).toBe(Compare.Operator.LessThan);
	});

	test("compare <=", () => {
		const element = parser.parseScript("[a/b] <= 42");
		expect((element as Compare).operator).toBe(Compare.Operator.LessThanOrEqual);
	});

	test("arithmetic +", () => {
		const element = parser.parseScript("[a/b] + [c/d]");
		expect(element.elementType()).toBe(SyntaxTreeElementType.Arithmetic);
		expect((element as Arithmetic).operator).toBe(Arithmetic.Operator.Plus);
	});

	test("arithmetic -", () => {
		const element = parser.parseScript("[a/b] - [c/d]");
		expect((element as Arithmetic).operator).toBe(Arithmetic.Operator.Minus);
	});

	test("arithmetic *", () => {
		const element = parser.parseScript("[a/b] * [c/d]");
		expect((element as Arithmetic).operator).toBe(Arithmetic.Operator.Multiplication);
	});

	test("arithmetic /", () => {
		const element = parser.parseScript("[a/b] / [c/d]");
		expect((element as Arithmetic).operator).toBe(Arithmetic.Operator.Division);
	});

	test("constant boolean true", () => {
		const element = parser.parseScript("true");
		expect(element).toBe(Constant.TRUE);
	});

	test("constant boolean false", () => {
		const element = parser.parseScript("false");
		expect(element).toBe(Constant.FALSE);
	});

	test("constant integer", () => {
		const element = parser.parseScript("42") as Constant;
		expect(element.constantType).toBe(Constant.ConstantType.Integer);
		expect(element.value).toBe("42");
	});

	test("constant float", () => {
		const element = parser.parseScript("3.14") as Constant;
		expect(element.constantType).toBe(Constant.ConstantType.Float);
		expect(element.value).toBe("3.14");
	});

	test("constant string", () => {
		const element = parser.parseScript('"hello"') as Constant;
		expect(element.constantType).toBe(Constant.ConstantType.String);
		expect(element.value).toBe("hello");
	});

	test("dereference", () => {
		const element = parser.parseScript("[a/b]") as Dereference;
		expect(element.elementType()).toBe(SyntaxTreeElementType.Dereference);
		expect(element.variable.isAbsolute).toBe(false);
		expect(element.variable.segments).toHaveLength(2);
		expect(element.variable.segments[0].label).toBe("a");
		expect(element.variable.segments[1].label).toBe("b");
	});

	test("predicate with empty signature", () => {
		const element = parser.parseScript("FieldFilled") as Predicate;
		expect(element.elementType()).toBe(SyntaxTreeElementType.Predicate);
		expect(element.label).toBe("FieldFilled");
		expect(element.signature.signatureType()).toBe(Predicate.SignatureType.EmptySignature);
	});

	test("predicate with parameter list", () => {
		const element = parser.parseScript("FieldFilled(a/b)") as Predicate;
		expect(element.label).toBe("FieldFilled");
		expect(element.signature.signatureType()).toBe(Predicate.SignatureType.ParameterList);
		expect((element.signature as Predicate.ParameterList).parameters).toHaveLength(1);
	});

	test("absolute variable reference", () => {
		const element = parser.parseScript("FieldFilled(/a/b)") as Predicate;
		const v = (element.signature as Predicate.ParameterList).parameters[0] as Variable;
		expect(v.isAbsolute).toBe(true);
		expect(v.segments).toHaveLength(2);
	});

	test("upward reference variable", () => {
		const element = parser.parseScript("FieldFilled(../a)") as Predicate;
		const v = (element.signature as Predicate.ParameterList).parameters[0] as Variable;
		expect(v.segments).toHaveLength(2);
		expect(v.segments[0]).toBe(ReferenceSegment.UPWARD_REFERENCE);
		expect(v.segments[1].label).toBe("a");
	});

	test("list segment variable", () => {
		const element = parser.parseScript("FieldFilled(a*/b)") as Predicate;
		const v = (element.signature as Predicate.ParameterList).parameters[0] as Variable;
		expect(v.segments[0].isList).toBe(true);
		expect(v.segments[0].label).toBe("a");
		expect(v.segments[1].label).toBe("b");
	});
});

describe("variable (static)", () => {
	test("parses relative variable", () => {
		const v = ComputationParser.variable("a/b/c");
		expect(v.isAbsolute).toBe(false);
		expect(v.segments).toHaveLength(3);
		expect(v.segments.map(s => s.label)).toEqual(["a", "b", "c"]);
	});

	test("parses absolute variable", () => {
		const v = ComputationParser.variable("/a/b");
		expect(v.isAbsolute).toBe(true);
		expect(v.segments).toHaveLength(2);
	});

	test("throws on invalid input", () => {
		// "[a/b]" begins with "[" which is not valid in the variable grammar rule
		expect(() => ComputationParser.variable("")).toThrow(/Unable to parse variable/);
	});
});

describe("parseHideCondition", () => {
	const parser = new ComputationParser();

	test("parses with precondition", () => {
		const tree = parser.parseHideCondition({ precondition: "[a/b] == 1" });
		expect(tree.source).toBe("[a/b] == 1");
		expect(tree.root.elementType()).toBe(SyntaxTreeElementType.Compare);
	});

	test("throws without precondition", () => {
		expect(() => parser.parseHideCondition({})).toThrow(/Unable to parse hideCondition/);
	});
});

describe("parse", () => {
	const parser = new ComputationParser();

	test("uses Constant.TRUE as precondition when none given", () => {
		const [precondition, operation] = parser.parse({ operation: "[a/b] == 1" } as ComputationAlternative);
		expect(precondition.root).toBe(Constant.TRUE);
		expect(operation.root.elementType()).toBe(SyntaxTreeElementType.Compare);
	});

	test("uses parsed precondition when given", () => {
		const [precondition, operation] = parser.parse({
			precondition: "[c/d] == 2",
			operation: "[a/b] == 1",
		} as ComputationAlternative);
		expect(precondition.root.elementType()).toBe(SyntaxTreeElementType.Compare);
		expect(operation.root.elementType()).toBe(SyntaxTreeElementType.Compare);
	});
});

describe("parseTree", () => {
	const parser = new ComputationParser();

	test("throws on invalid expression", () => {
		// "[a for b]" parses successfully but enterSemanticIndex in the builder throws explicitly
		expect(() => parser.parseTree("[a for b]")).toThrow(/Unable to parse computation/);
	});
});

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
import {
	Arithmetic,
	Compare,
	Constant,
	Dereference,
	Logic,
	Predicate,
	ReferenceSegment,
} from "../../internal/elements/index.js";

import { ComputationParser } from "../computation-parser.js";
import { SyntaxTreeRenderer } from "../elements/visitor/SyntaxTreeRenderer.js";

function deref(path: string): Dereference {
	return new Dereference(ComputationParser.variable(path));
}

describe("SyntaxTreeRenderer", () => {
	const renderer = new SyntaxTreeRenderer();

	describe("render", () => {
		describe("logic", () => {
			test("AND operator", () => {
				const left = new Compare(Compare.Operator.Equality, [deref("a/b"), Constant.TRUE]);
				const right = new Compare(Compare.Operator.Equality, [deref("c/d"), Constant.TRUE]);
				expect(renderer.render(new Logic(Logic.Operator.And, [left, right]))).toBe(
					"[a/b] == true AND [c/d] == true"
				);
			});

			test("OR operator", () => {
				const left = new Compare(Compare.Operator.Equality, [deref("a/b"), Constant.TRUE]);
				const right = new Compare(Compare.Operator.Equality, [deref("c/d"), Constant.TRUE]);
				expect(renderer.render(new Logic(Logic.Operator.Or, [left, right]))).toBe(
					"[a/b] == true OR [c/d] == true"
				);
			});

			test("nested OR inside AND gets braces", () => {
				const orBranch = new Logic(Logic.Operator.Or, [
					new Compare(Compare.Operator.Equality, [deref("a/b"), Constant.TRUE]),
					new Compare(Compare.Operator.Equality, [deref("c/d"), Constant.TRUE]),
				]);
				const andNode = new Logic(Logic.Operator.And, [
					orBranch,
					new Compare(Compare.Operator.Equality, [deref("e/f"), Constant.TRUE]),
				]);
				expect(renderer.render(andNode)).toBe("([a/b] == true OR [c/d] == true) AND [e/f] == true");
			});

			test("nested AND inside OR gets braces", () => {
				const andBranch = new Logic(Logic.Operator.And, [
					new Compare(Compare.Operator.Equality, [deref("c/d"), Constant.TRUE]),
					new Compare(Compare.Operator.Equality, [deref("e/f"), Constant.TRUE]),
				]);
				const orNode = new Logic(Logic.Operator.Or, [
					new Compare(Compare.Operator.Equality, [deref("a/b"), Constant.TRUE]),
					andBranch,
				]);
				expect(renderer.render(orNode)).toBe("[a/b] == true OR ([c/d] == true AND [e/f] == true)");
			});

			test("same operator does not add braces", () => {
				// right branch shares the AND operator → no parens
				const inner = new Logic(Logic.Operator.And, [
					new Compare(Compare.Operator.Equality, [deref("c/d"), Constant.TRUE]),
					new Compare(Compare.Operator.Equality, [deref("e/f"), Constant.TRUE]),
				]);
				const outer = new Logic(Logic.Operator.And, [
					new Compare(Compare.Operator.Equality, [deref("a/b"), Constant.TRUE]),
					inner,
				]);
				expect(renderer.render(outer)).toBe("[a/b] == true AND [c/d] == true AND [e/f] == true");
			});

			test("both branches of AND get braces when both are OR", () => {
				const or1 = new Logic(Logic.Operator.Or, [
					new Compare(Compare.Operator.Equality, [deref("a/b"), Constant.TRUE]),
					new Compare(Compare.Operator.Equality, [deref("c/d"), Constant.TRUE]),
				]);
				const or2 = new Logic(Logic.Operator.Or, [
					new Compare(Compare.Operator.Equality, [deref("e/f"), Constant.TRUE]),
					new Compare(Compare.Operator.Equality, [deref("g/h"), Constant.TRUE]),
				]);
				expect(renderer.render(new Logic(Logic.Operator.And, [or1, or2]))).toBe(
					"([a/b] == true OR [c/d] == true) AND ([e/f] == true OR [g/h] == true)"
				);
			});
		});

		describe("compare operators", () => {
			test("Equality renders as '=='", () => {
				expect(renderer.render(new Compare(Compare.Operator.Equality, [deref("a/b"), Constant.TRUE]))).toBe(
					"[a/b] == true"
				);
			});

			test("UnEquality renders as '!='", () => {
				expect(renderer.render(new Compare(Compare.Operator.UnEquality, [deref("a/b"), Constant.TRUE]))).toBe(
					"[a/b] != true"
				);
			});

			test("GreaterThan renders as '>'", () => {
				expect(renderer.render(new Compare(Compare.Operator.GreaterThan, [deref("a/b"), Constant.TRUE]))).toBe(
					"[a/b] > true"
				);
			});

			test("GreaterThanOrEqual renders as '>='", () => {
				expect(
					renderer.render(new Compare(Compare.Operator.GreaterThanOrEqual, [deref("a/b"), Constant.TRUE]))
				).toBe("[a/b] >= true");
			});

			test("LessThan renders as '<'", () => {
				expect(renderer.render(new Compare(Compare.Operator.LessThan, [deref("a/b"), Constant.TRUE]))).toBe(
					"[a/b] < true"
				);
			});

			test("LessThanOrEqual renders as '<='", () => {
				expect(
					renderer.render(new Compare(Compare.Operator.LessThanOrEqual, [deref("a/b"), Constant.TRUE]))
				).toBe("[a/b] <= true");
			});
		});

		describe("arithmetic operators", () => {
			test("Plus renders as '+'", () => {
				expect(renderer.render(new Arithmetic(Arithmetic.Operator.Plus, [deref("a/b"), deref("c/d")]))).toBe(
					"[a/b] + [c/d]"
				);
			});

			test("Minus renders as '-'", () => {
				expect(renderer.render(new Arithmetic(Arithmetic.Operator.Minus, [deref("a/b"), deref("c/d")]))).toBe(
					"[a/b] - [c/d]"
				);
			});

			test("Multiplication renders as '*'", () => {
				expect(
					renderer.render(new Arithmetic(Arithmetic.Operator.Multiplication, [deref("a/b"), deref("c/d")]))
				).toBe("[a/b] * [c/d]");
			});

			test("Division renders as '/'", () => {
				expect(
					renderer.render(new Arithmetic(Arithmetic.Operator.Division, [deref("a/b"), deref("c/d")]))
				).toBe("[a/b] / [c/d]");
			});

			test("lower-priority left branch gets braces", () => {
				const plus = new Arithmetic(Arithmetic.Operator.Plus, [deref("a/b"), deref("c/d")]);
				const mul = new Arithmetic(Arithmetic.Operator.Multiplication, [plus, deref("e/f")]);
				expect(renderer.render(mul)).toBe("([a/b] + [c/d]) * [e/f]");
			});

			test("lower-priority right branch gets braces", () => {
				const plus = new Arithmetic(Arithmetic.Operator.Plus, [deref("c/d"), deref("e/f")]);
				const mul = new Arithmetic(Arithmetic.Operator.Multiplication, [deref("a/b"), plus]);
				expect(renderer.render(mul)).toBe("[a/b] * ([c/d] + [e/f])");
			});

			test("same operator chain does not add braces", () => {
				const inner = new Arithmetic(Arithmetic.Operator.Plus, [deref("c/d"), deref("e/f")]);
				const outer = new Arithmetic(Arithmetic.Operator.Plus, [deref("a/b"), inner]);
				expect(renderer.render(outer)).toBe("[a/b] + [c/d] + [e/f]");
			});

			test("both branches get braces when both differ from the outer operator", () => {
				const plus = new Arithmetic(Arithmetic.Operator.Plus, [deref("a/b"), deref("c/d")]);
				const minus = new Arithmetic(Arithmetic.Operator.Minus, [deref("e/f"), deref("g/h")]);
				const mul = new Arithmetic(Arithmetic.Operator.Multiplication, [plus, minus]);
				expect(renderer.render(mul)).toBe("([a/b] + [c/d]) * ([e/f] - [g/h])");
			});
		});

		describe("constants", () => {
			test("boolean true", () => {
				expect(renderer.render(Constant.TRUE)).toBe("true");
			});

			test("boolean false", () => {
				expect(renderer.render(Constant.FALSE)).toBe("false");
			});

			test("integer", () => {
				expect(renderer.render(new Constant("42", Constant.ConstantType.Integer))).toBe("42");
			});

			test("float", () => {
				expect(renderer.render(new Constant("3.14", Constant.ConstantType.Float))).toBe("3.14");
			});

			test("string is re-quoted", () => {
				// string value is stored without quotes; renderer wraps it in double quotes
				expect(renderer.render(new Constant("hello", Constant.ConstantType.String))).toBe('"hello"');
			});
		});

		describe("variables and dereferences", () => {
			test("relative variable path", () => {
				const sig = new Predicate.ParameterList([ComputationParser.variable("a/b/c")]);
				expect(renderer.render(new Predicate("FieldFilled", sig))).toBe("FieldFilled(a/b/c)");
			});

			test("absolute variable path", () => {
				const sig = new Predicate.ParameterList([ComputationParser.variable("/a/b")]);
				expect(renderer.render(new Predicate("FieldFilled", sig))).toBe("FieldFilled(/a/b)");
			});

			test("list segment variable", () => {
				const sig = new Predicate.ParameterList([ComputationParser.variable("a*/b")]);
				expect(renderer.render(new Predicate("FieldFilled", sig))).toBe("FieldFilled(a*/b)");
			});

			test("upward reference variable", () => {
				const sig = new Predicate.ParameterList([ComputationParser.variable("../a")]);
				expect(renderer.render(new Predicate("FieldFilled", sig))).toBe("FieldFilled(../a)");
			});

			test("dereference wraps variable in brackets", () => {
				expect(renderer.render(deref("a/b"))).toBe("[a/b]");
			});
		});

		describe("predicates", () => {
			test("empty signature renders only the label", () => {
				expect(renderer.render(new Predicate("FieldFilled", Predicate.EmptySignature.Instance))).toBe(
					"FieldFilled"
				);
			});

			test("parameter list with one parameter", () => {
				const sig = new Predicate.ParameterList([ComputationParser.variable("a/b")]);
				expect(renderer.render(new Predicate("FieldFilled", sig))).toBe("FieldFilled(a/b)");
			});

			test("parameter list with multiple parameters — comma-separated, no spaces", () => {
				const sig = new Predicate.ParameterList([
					ComputationParser.variable("a/b"),
					ComputationParser.variable("c/d"),
				]);
				expect(renderer.render(new Predicate("FieldFilled", sig))).toBe("FieldFilled(a/b,c/d)");
			});

			test("consistence signature renders as 'left TO right'", () => {
				const sig = new Predicate.ConsistenceSignature(
					new Predicate.ParameterList([ComputationParser.variable("a/b")]),
					new Predicate.ParameterList([ComputationParser.variable("c/d")])
				);
				expect(renderer.render(new Predicate("FieldFilled", sig))).toBe("FieldFilled(a/b TO c/d)");
			});

			test("infix predicate — dereferences flank the label", () => {
				const sig = new Predicate.InfixParameterList(deref("a/b"), deref("c/d"));
				expect(renderer.render(new Predicate("FieldName", sig))).toBe("[a/b] FieldName [c/d]");
			});

			test("inclusion signature", () => {
				const sig = new Predicate.InclusionSignature(
					new Predicate.ParameterList([ComputationParser.variable("a/b")]),
					new Predicate.ParameterList([ComputationParser.variable("c/d")])
				);
				expect(renderer.render(new Predicate("FieldIn", sig))).toBe("FieldIn(a/b IN c/d)");
			});
		});

		describe("complex expressions", () => {
			test("arithmetic inside compare", () => {
				const node = new Compare(Compare.Operator.GreaterThanOrEqual, [
					new Arithmetic(Arithmetic.Operator.Plus, [deref("a/b"), deref("c/d")]),
					new Constant("42", Constant.ConstantType.Integer),
				]);
				expect(renderer.render(node)).toBe("[a/b] + [c/d] >= 42");
			});

			test("predicate as logic operand does not get braces", () => {
				// Predicate.elementType() is not Logic, so the brace filter returns false
				const pred = new Predicate(
					"FieldFilled",
					new Predicate.ParameterList([ComputationParser.variable("a/b")])
				);
				const comp = new Compare(Compare.Operator.Equality, [
					deref("c/d"),
					new Constant("1", Constant.ConstantType.Integer),
				]);
				expect(renderer.render(new Logic(Logic.Operator.And, [pred, comp]))).toBe(
					"FieldFilled(a/b) AND [c/d] == 1"
				);
			});

			test("deeply nested: logic over compare over arithmetic", () => {
				const left = new Compare(Compare.Operator.GreaterThanOrEqual, [
					new Arithmetic(Arithmetic.Operator.Plus, [deref("a/b"), deref("c/d")]),
					new Constant("1", Constant.ConstantType.Integer),
				]);
				const right = new Compare(Compare.Operator.LessThanOrEqual, [
					new Arithmetic(Arithmetic.Operator.Multiplication, [deref("e/f"), deref("g/h")]),
					new Constant("100", Constant.ConstantType.Integer),
				]);
				expect(renderer.render(new Logic(Logic.Operator.And, [left, right]))).toBe(
					"[a/b] + [c/d] >= 1 AND [e/f] * [g/h] <= 100"
				);
			});
		});
	});

	describe("getPath", () => {
		test("empty segments returns empty string", () => {
			expect(SyntaxTreeRenderer.getPath(false, [])).toBe("");
			expect(SyntaxTreeRenderer.getPath(true, [])).toBe("");
		});

		test("relative single segment", () => {
			expect(SyntaxTreeRenderer.getPath(false, [new ReferenceSegment("a", false, false)])).toBe("a");
		});

		test("absolute single segment", () => {
			expect(SyntaxTreeRenderer.getPath(true, [new ReferenceSegment("a", false, false)])).toBe("/a");
		});

		test("relative multi-segment", () => {
			const segments = [new ReferenceSegment("a", false, false), new ReferenceSegment("b", false, false)];
			expect(SyntaxTreeRenderer.getPath(false, segments)).toBe("a/b");
		});

		test("absolute multi-segment", () => {
			const segments = [new ReferenceSegment("a", false, false), new ReferenceSegment("b", false, false)];
			expect(SyntaxTreeRenderer.getPath(true, segments)).toBe("/a/b");
		});

		test("list segment appends *", () => {
			expect(SyntaxTreeRenderer.getPath(false, [new ReferenceSegment("a", true, false)])).toBe("a*");
		});

		test("list segment with withoutRep=true suppresses *", () => {
			expect(SyntaxTreeRenderer.getPath(false, [new ReferenceSegment("a", true, false)], true)).toBe("a");
		});

		test("upward reference segment", () => {
			expect(SyntaxTreeRenderer.getPath(false, [ReferenceSegment.UPWARD_REFERENCE])).toBe("..");
		});

		test("turning group segment prefixes label with ..", () => {
			// isTurningGroup=true causes the renderer to prepend UPWARD_REFERENCE.label before the segment label
			expect(SyntaxTreeRenderer.getPath(false, [new ReferenceSegment("a", false, true)])).toBe("..a");
		});
	});
});

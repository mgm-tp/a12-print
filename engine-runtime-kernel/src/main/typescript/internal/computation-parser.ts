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
	CharStream,
	CharStreams,
	CommonTokenStream,
	ParserRuleContext,
	ParseTreeListener,
	ParseTreeWalker,
	TerminalNode,
} from "antlr4";

import { ComputationAlternative } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import PrintComputationLexer from "./generated/antlr/PrintComputationTSLexer.js";
import PrintComputationParser, {
	AbsoluteReferenceContext,
	ArithmeticOperationContext,
	CompareOperationContext,
	ConstantContext,
	DereferenceContext,
	InfixPredicateContext,
	LogicOperationContext,
	PredicateConsistenceParameterContext,
	PredicateContext,
	PredicateInclusionParameterContext,
	PredicateParameterListContext,
	ReferenceLabelContext,
	ReferenceListContext,
	RelativeReferenceContext,
	RootReferenceContext,
	SemanticIndexContext,
	TurningGroupContext,
	UpwardReferenceContext,
	VariableAttributeContext,
} from "./generated/antlr/PrintComputationTSParser.js";

import {
	Arithmetic,
	Compare,
	ComputationSyntaxTree,
	Constant,
	Dereference,
	Logic,
	Predicate,
	ReferenceSegment,
	Stack,
	SyntaxTreeElement,
	Variable,
} from "./index.js";

export class ComputationParser {
	static variable(path: string): Variable {
		try {
			return this.internalParseVariable(path) as Variable;
		} catch (e) {
			throw new Error(`Unable to parse variable: ${path}`);
		}
	}

	private static internalParseVariable(computation: string): SyntaxTreeElement {
		const parser = new PrintComputationParser(
			new CommonTokenStream(new PrintComputationLexer(CharStreams.fromString(computation)))
		);
		const tree = parser.variable();

		if (tree.exception) {
			throw tree.exception;
		}

		const walker = new ParseTreeWalker();
		const builder = new ComputationParser.ComputationBuilder();
		walker.walk(builder, tree);
		return builder.build();
	}

	parseScript(computation: string): SyntaxTreeElement {
		const lexer = new PrintComputationLexer(new CharStream(computation));
		const tokenStream = new CommonTokenStream(lexer);
		const parser = new PrintComputationParser(tokenStream);

		const tree = parser.computation();

		if (tree.exception) {
			throw tree.exception;
		}

		const walker = new ParseTreeWalker();
		const builder = new ComputationParser.ComputationBuilder();
		walker.walk(builder, tree);
		return builder.build();
	}

	parseHideCondition(hideCondition: { precondition?: string }): ComputationSyntaxTree {
		if (!hideCondition.precondition) {
			throw new Error("Unable to parse hideCondition");
		}
		return this.parseTree(hideCondition.precondition);
	}

	parse(computationAlternative: ComputationAlternative): ComputationSyntaxTree[] {
		const trees: ComputationSyntaxTree[] = [];
		if (!computationAlternative.precondition) {
			trees.push(new ComputationSyntaxTree("", Constant.TRUE));
		} else {
			const preconditionTree: ComputationSyntaxTree = this.parseTree(computationAlternative.precondition);
			if (preconditionTree) {
				trees.push(preconditionTree);
			} else {
				trees.push(new ComputationSyntaxTree("", Constant.TRUE));
			}
		}
		trees.push(this.parseTree(computationAlternative.operation));
		return trees;
	}

	parseTree(source: string): ComputationSyntaxTree {
		try {
			return new ComputationSyntaxTree(source, this.parseScript(source));
		} catch (e) {
			throw new Error("Unable to parse computation.");
		}
	}
}

export namespace ComputationParser {
	export class ComputationBuilder extends ParseTreeListener {
		private readonly children: Stack<SyntaxTreeElement> = new Stack();
		private segments: ReferenceSegment[] = [];

		private static getArity(ctx: ParserRuleContext): number {
			const children = ctx.children?.filter(e => !(e instanceof TerminalNode));
			return children ? children.length : 0;
		}

		build(): SyntaxTreeElement {
			const root = this.takeLatest();
			if (!this.children.isEmpty()) {
				throw new Error("ast is malformed");
			}
			return root;
		}

		exitTurningGroup(ctx: TurningGroupContext): void {
			const lastSegment = this.segments.pop();
			if (!lastSegment) {
				throw new Error("lastSegment is undefined");
			}
			this.segments.push(new ReferenceSegment(lastSegment.label, lastSegment.isList, true));
		}

		enterReferenceList(ctx: ReferenceListContext): void {
			this.segments.push(new ReferenceSegment(ctx.LABEL().getText(), true, false));
		}

		enterReferenceLabel(ctx: ReferenceLabelContext): void {
			this.segments.push(new ReferenceSegment(ctx.LABEL().getText(), false, false));
		}

		enterUpwardReference(ctx: UpwardReferenceContext): void {
			this.segments.push(ReferenceSegment.UPWARD_REFERENCE);
		}

		exitArithmeticOperation(ctx: ArithmeticOperationContext): void {
			if (ctx.arithmeticOperation()) {
				// this is the quoted operation
				return;
			}

			let operator: Arithmetic.Operator;
			if (ctx.SLASH()) {
				operator = Arithmetic.Operator.Division;
			} else if (ctx.MINUS_OPERATOR()) {
				operator = Arithmetic.Operator.Minus;
			} else if (ctx.MULTIPLICATION_OPERATOR()) {
				operator = Arithmetic.Operator.Multiplication;
			} else if (ctx.PLUS_OPERATOR()) {
				operator = Arithmetic.Operator.Plus;
			} else {
				throw new Error("invalid Arithmetic Operator");
			}
			const branches = this.takeN(new Array(ComputationBuilder.getArity(ctx)));
			this.children.push(new Arithmetic(operator, branches));
		}

		exitLogicOperation(ctx: LogicOperationContext): void {
			if (ctx.logicOperation()) {
				// this is the quoted operation
				return;
			}
			let operator: Logic.Operator;
			if (ctx.AND_OPERATOR_list().length > 0) {
				operator = Logic.Operator.And;
			} else if (ctx.OR_OPERATOR_list().length > 0) {
				operator = Logic.Operator.Or;
			} else {
				throw new Error("invalid Logic Operator");
			}
			const branches = this.takeN(new Array(ComputationBuilder.getArity(ctx)));
			this.children.push(new Logic(operator, branches));
		}

		exitCompareOperation(ctx: CompareOperationContext): void {
			let operator: Compare.Operator;

			if (ctx.compareOperation()) {
				// this is the quoted operation
				return;
			}

			if (ctx.EQUALITY_OPERATOR()) {
				operator = Compare.Operator.Equality;
			} else if (ctx.UNEQUALITY_OPERATOR()) {
				operator = Compare.Operator.UnEquality;
			} else if (ctx.GREATER_THAN_OPERATOR()) {
				operator = Compare.Operator.GreaterThan;
			} else if (ctx.GREATER_THAN_OR_EQUAL_OPERATOR()) {
				operator = Compare.Operator.GreaterThanOrEqual;
			} else if (ctx.LESS_THAN_OPERATOR()) {
				operator = Compare.Operator.LessThan;
			} else if (ctx.LESS_THAN_OR_EQUAL_OPERATOR()) {
				operator = Compare.Operator.LessThanOrEqual;
			} else {
				throw new Error("invalid Logic Operator");
			}
			const branches = this.takeN(new Array(ComputationBuilder.getArity(ctx)));
			this.children.push(new Compare(operator, branches));
		}

		exitAbsoluteReference(ctx: AbsoluteReferenceContext): void {
			this.children.push(new Variable(this.takeSegments(), true));
		}

		exitRelativeReference(ctx: RelativeReferenceContext): void {
			this.children.push(new Variable(this.takeSegments(), false));
		}

		exitRootReference(ctx: RootReferenceContext): void {
			this.children.push(new Variable([], true));
		}

		exitDereference(ctx: DereferenceContext): void {
			this.children.push(new Dereference(this.takeLatest()));
		}

		exitPredicate(ctx: PredicateContext): void {
			if (this.children.isEmpty()) {
				this.children.push(new Predicate(ctx._operator.text, Predicate.EmptySignature.Instance));
			} else {
				this.children.push(new Predicate(ctx._operator.text, this.takeLatest()));
			}
		}

		exitInfixPredicate(ctx: InfixPredicateContext): void {
			const signature = new Predicate.InfixParameterList(this.takeLatest(), this.takeLatest());
			this.children.push(new Predicate(ctx._operator.text, signature));
		}

		exitPredicateParameterList(ctx: PredicateParameterListContext): void {
			const parameters = this.takeN(new Array(ComputationBuilder.getArity(ctx)));
			this.children.push(new Predicate.ParameterList(parameters));
		}

		exitPredicateConsistenceParameter(ctx: PredicateConsistenceParameterContext): void {
			this.children.push(new Predicate.ConsistenceSignature(this.takeLatest(), this.takeLatest()));
		}

		exitPredicateInclusionParameter(ctx: PredicateInclusionParameterContext): void {
			this.children.push(new Predicate.InclusionSignature(this.takeLatest(), this.takeLatest()));
		}

		exitConstant(ctx: ConstantContext): void {
			let constantType: Constant.ConstantType;
			if (ctx.BOOLEAN_LITERAL()) {
				if (ctx.BOOLEAN_LITERAL().getText().toLowerCase() === Constant.TRUE.value.toLowerCase()) {
					this.children.push(Constant.TRUE);
				} else {
					this.children.push(Constant.FALSE);
				}
				return;
			} else if (ctx.FLOATING_POINT_LITERAL()) {
				constantType = Constant.ConstantType.Float;
			} else if (ctx.NUMBER_LITERAL()) {
				constantType = Constant.ConstantType.Integer;
			} else if (ctx.STRING_LITERAL()) {
				constantType = Constant.ConstantType.String;
			} else {
				throw new Error("invalid Constant");
			}
			this.children.push(new Constant(ctx._value.text, constantType));
		}

		enterSemanticIndex(ctx: SemanticIndexContext): void {
			throw new Error("SemanticIndex is not implemented");
		}

		enterVariableAttribute(ctx: VariableAttributeContext): void {
			throw new Error("VariableAttribute is not implemented");
		}

		private takeSegments(): ReferenceSegment[] {
			const segments = [...this.segments];
			this.segments = [];
			return segments;
		}

		private takeN<A>(result: A[]): A[] {
			let i = result.length - 1;
			if (i < 0) {
				throw new Error("takeN 0");
			}
			while (!this.children.isEmpty() && i >= 0) {
				const element = this.children.pop() as A;
				if (!element) {
					throw new Error("takenN element is undefined");
				}
				result[i] = element;
				i--;
			}
			if (i >= 0) {
				throw new Error("takenN element is undefined");
			}
			return result;
		}

		private takeLatest<T extends SyntaxTreeElement>(): T {
			return this.children.pop() as T;
		}
	}
}

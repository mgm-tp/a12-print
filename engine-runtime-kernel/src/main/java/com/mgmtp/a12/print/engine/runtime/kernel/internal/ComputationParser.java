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
package com.mgmtp.a12.print.engine.runtime.kernel.internal;

import com.mgmtp.a12.print.engine.runtime.kernel.internal.antlr.PrintComputationBaseListener;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.antlr.PrintComputationLexer;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.antlr.PrintComputationParser;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.*;
import com.mgmtp.a12.print.model.api.model.element.base.ComputationAlternative;
import com.mgmtp.a12.print.model.api.model.element.base.HideCondition;
import org.antlr.v4.runtime.CharStreams;
import org.antlr.v4.runtime.CommonTokenStream;
import org.antlr.v4.runtime.ParserRuleContext;
import org.antlr.v4.runtime.tree.ParseTreeWalker;
import org.antlr.v4.runtime.tree.TerminalNode;

import java.util.ArrayList;
import java.util.List;
import java.util.Stack;

public class ComputationParser {

	public static Variable variable(String path) {
		try {
			return (Variable) internalParseVariable(path);
		} catch (ComputationParsingException e) {
			throw e;
		} catch (Exception e) {
			throw new ComputationParsingException("Unable to parse variable.", e);
		}
	}

	private static SyntaxTreeElement parseScript(String computation) {
		var parser = new PrintComputationParser(new CommonTokenStream(
			new PrintComputationLexer(CharStreams.fromString(computation))
		));
		var tree = parser.computation();

		if (tree.exception != null) {
			throw tree.exception;
		}

		var walker = new ParseTreeWalker();
		var builder = new ComputationBuilder();
		walker.walk(builder, tree);
		return builder.build();
	}

	private static SyntaxTreeElement internalParseVariable(String computation) {
		var parser = new PrintComputationParser(new CommonTokenStream(
			new PrintComputationLexer(CharStreams.fromString(computation))
		));
		var tree = parser.variable();

		if (tree.exception != null) {
			throw tree.exception;
		}

		var walker = new ParseTreeWalker();
		var builder = new ComputationBuilder();
		walker.walk(builder, tree);
		return builder.build();
	}

	public ComputationSyntaxTree parse(HideCondition hideCondition) {
		return parseTree(hideCondition.getPrecondition());
	}

	public ComputationSyntaxTree[] parse(ComputationAlternative computationAlternative) {
		return new ComputationSyntaxTree[]{
			computationAlternative.getPrecondition().map(this::parseTree).orElseGet(() ->
				ComputationSyntaxTree.builder().source("").root(Constant.TRUE).build()
			),
			parseTree(computationAlternative.getOperation())
		};
	}

	public ComputationSyntaxTree parseTree(String source) {
		try {
			return ComputationSyntaxTree.builder()
										.source(source)
										.root(parseScript(source))
										.build();

		} catch (ComputationParsingException e) {
			throw e;
		} catch (Exception e) {
			throw new ComputationParsingException("Unable to parse computation.", e);
		}
	}

	private static class ComputationBuilder extends PrintComputationBaseListener {
		private final Stack<SyntaxTreeElement> children = new Stack<>();
		private final List<ReferenceSegment> segments = new ArrayList<>();

		private static int getArity(ParserRuleContext ctx) {
			return (int) ctx.children.stream().filter(e -> !(e instanceof TerminalNode)).count();
		}

		private ReferenceSegment[] takeSegments() {
			var segment = segments.toArray(new ReferenceSegment[0]);
			segments.clear();
			return segment;
		}

		private <A> A[] takeN(A[] result) {
			var i = result.length - 1;
			if (i < 0) {
				throw new ComputationParsingException("takeN 0");
			}
			while (!children.isEmpty() && i >= 0) {
				var element = (A) children.pop();
				if (element == null) {
					throw new ComputationParsingException("takenN element is null");
				}
				result[i] = element;
				i--;
			}
			if (i >= 0) {
				throw new ComputationParsingException("takenN element is null");
			}
			return result;
		}

		private <T extends SyntaxTreeElement> T takeLatest() {
			return (T) children.pop();
		}

		public SyntaxTreeElement build() {
			var root = takeLatest();
			if (!children.isEmpty()) {
				throw new ComputationParsingException("ast is malformed");
			}
			return root;
		}

		@Override
		public void exitTurningGroup(PrintComputationParser.TurningGroupContext ctx) {
			var builder = segments.remove(segments.size() - 1).toBuilder();
			builder.isTurningGroup(true);
			segments.add(builder.build());
		}

		@Override
		public void enterReferenceList(PrintComputationParser.ReferenceListContext ctx) {
			segments.add(ReferenceSegment.builder().isList(true).label(ctx.label.getText()).build());
		}

		@Override
		public void enterReferenceLabel(PrintComputationParser.ReferenceLabelContext ctx) {
			segments.add(ReferenceSegment.builder().isList(false).label(ctx.label.getText()).build());
		}

		@Override
		public void enterUpwardReference(PrintComputationParser.UpwardReferenceContext ctx) {
			segments.add(ReferenceSegment.UPWARD_REFERENCE);
		}

		@Override
		public void exitArithmeticOperation(PrintComputationParser.ArithmeticOperationContext ctx) {

			if (ctx.arithmeticOperation() != null) {
				// this is the quoted operation
				return;
			}

			Arithmetic.Operator operator;
			if (ctx.SLASH() != null) {
				operator = Arithmetic.Operator.DIVISION;
			} else if (ctx.MINUS_OPERATOR() != null) {
				operator = Arithmetic.Operator.MINUS;
			} else if (ctx.MULTIPLICATION_OPERATOR() != null) {
				operator = Arithmetic.Operator.MULTIPLICATION;
			} else if (ctx.PLUS_OPERATOR() != null) {
				operator = Arithmetic.Operator.PLUS;
			} else {
				throw new ComputationParsingException("invalid Arithmetic Operator");
			}
			children.push(
				Arithmetic.builder()
						  .operator(operator)
						  .branches(takeN(new ArithmeticBranch[getArity(ctx)]))
						  .build()
			);
		}

		@Override
		public void exitLogicOperation(PrintComputationParser.LogicOperationContext ctx) {

			if (ctx.logicOperation() != null) {
				// this is the quoted operation
				return;
			}
			Logic.Operator operator;
			if (!ctx.AND_OPERATOR().isEmpty()) {
				operator = Logic.Operator.AND;
			} else if (!ctx.OR_OPERATOR().isEmpty()) {
				operator = Logic.Operator.OR;
			} else {
				throw new ComputationParsingException("invalid Logic Operator");
			}
			final var branches = takeN(new LogicBranch[getArity(ctx)]);
			children.push(
				Logic.builder()
					 .operator(operator)
					 .branches(branches)
					 .build()
			);
		}

		@Override
		public void exitCompareOperation(PrintComputationParser.CompareOperationContext ctx) {
			Compare.Operator operator;

			if (ctx.compareOperation() != null) {
				// this is the quoted operation
				return;
			}

			if (ctx.EQUALITY_OPERATOR() != null) {
				operator = Compare.Operator.EQUALITY;
			} else if (ctx.UNEQUALITY_OPERATOR() != null) {
				operator = Compare.Operator.UN_EQUALITY;
			} else if (ctx.GREATER_THAN_OPERATOR() != null) {
				operator = Compare.Operator.GREATER_THAN;
			} else if (ctx.GREATER_THAN_OR_EQUAL_OPERATOR() != null) {
				operator = Compare.Operator.GREATER_THAN_OR_EQUAL;
			} else if (ctx.LESS_THAN_OPERATOR() != null) {
				operator = Compare.Operator.LESS_THAN;
			} else if (ctx.LESS_THAN_OR_EQUAL_OPERATOR() != null) {
				operator = Compare.Operator.LESS_THAN_OR_EQUAL;
			} else {
				throw new ComputationParsingException("invalid Logic Operator");
			}

			children.push(
				Compare.builder()
					   .operator(operator)
					   .branches(takeN(new CompareBranch[getArity(ctx)]))
					   .build()
			);
		}

		@Override
		public void exitAbsoluteReference(PrintComputationParser.AbsoluteReferenceContext ctx) {
			children.push(Variable.builder()
								  .isAbsolute(true)
								  .segments(takeSegments())
								  .build());
		}

		@Override
		public void exitRelativeReference(PrintComputationParser.RelativeReferenceContext ctx) {
			children.push(Variable.builder()
								  .isAbsolute(false)
								  .segments(takeSegments())
								  .build());
		}

		@Override
		public void exitRootReference(PrintComputationParser.RootReferenceContext ctx) {
			children.push(Variable.builder()
								  .isAbsolute(true)
								  .segments(new ReferenceSegment[0])
								  .build());
		}

		@Override
		public void exitDereference(PrintComputationParser.DereferenceContext ctx) {
			children.push(Dereference.builder().variable(takeLatest()).build());
		}

		@Override
		public void exitPredicate(PrintComputationParser.PredicateContext ctx) {
			if (children.empty()) {
				children.push(
					Predicate.builder()
							 .label(ctx.operator.getText())
							 .signature(
								 Predicate.EmptySignature.Instance
							 ).build()
				);
			} else {
				children.push(
					Predicate.builder()
							 .label(ctx.operator.getText())
							 .signature(takeLatest()).build()
				);
			}
		}

		@Override
		public void exitInfixPredicate(PrintComputationParser.InfixPredicateContext ctx) {
			children.push(
				Predicate.builder()
						 .label(ctx.operator.getText())
						 .signature(
							 Predicate
								 .InfixParameterList
								 .builder()
								 .rightParameter(takeLatest())
								 .leftParameter(takeLatest())
								 .build()
						 ).build()
			);
		}

		@Override
		public void exitPredicateParameterList(PrintComputationParser.PredicateParameterListContext ctx) {
			children.push(Predicate
				.ParameterList
				.builder()
				.parameters(takeN(new Predicate.Parameter[getArity(ctx)]))
				.build());
		}

		@Override
		public void exitPredicateConsistenceParameter(PrintComputationParser.PredicateConsistenceParameterContext ctx) {
			children.push(Predicate
				.ConsistenceSignature
				.builder()
				.right(takeLatest())
				.left(takeLatest())
				.build());
		}

		@Override
		public void exitPredicateInclusionParameter(PrintComputationParser.PredicateInclusionParameterContext ctx) {
			children.push(Predicate
				.InclusionSignature
				.builder()
				.right(takeLatest())
				.left(takeLatest())
				.build());
		}

		@Override
		public void exitConstant(PrintComputationParser.ConstantContext ctx) {
			Constant.ConstantType constantType;
			if (ctx.BOOLEAN_LITERAL() != null) {
				if (ctx.BOOLEAN_LITERAL().getText().equalsIgnoreCase(Constant.TRUE.getValue())) {
					children.add(Constant.TRUE);
				} else {
					children.add(Constant.FALSE);
				}
				return;
			} else if (ctx.FLOATING_POINT_LITERAL() != null) {
				constantType = Constant.ConstantType.FLOAT;
			} else if (ctx.NUMBER_LITERAL() != null) {
				constantType = Constant.ConstantType.INTEGER;
			} else if (ctx.STRING_LITERAL() != null) {
				constantType = Constant.ConstantType.STRING;
			} else {
				throw new ComputationParsingException("invalid Constant");
			}
			children.add(Constant.builder().constantType(constantType).value(ctx.value.getText()).build());
		}

		@Override
		public void enterSemanticIndex(PrintComputationParser.SemanticIndexContext ctx) {
			throw new ComputationParsingException("SemanticIndex is not implemented");
		}

		@Override
		public void enterVariableAttribute(PrintComputationParser.VariableAttributeContext ctx) {
			throw new ComputationParsingException("VariableAttribute is not implemented");
		}
	}

}

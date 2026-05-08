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
package com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.rules;

import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.rules.util.RewriteRuleFactoryTestAssertion;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.*;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.visitor.SyntaxTreeRenderer;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.Arrays;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class CommutativeBranchOrderingNormalisationTest {

	private static final Variable variable
		= Variable.builder().isAbsolute(true).segments(new ReferenceSegment[]{ReferenceSegment.builder().label("var1").build()}).build();
	private static final Constant constantInteger
		= Constant.builder().constantType(Constant.ConstantType.INTEGER).value("1").build();
	private static final Constant constantString
		= Constant.builder().constantType(Constant.ConstantType.STRING).value("1").build();
	private static final Dereference dereference
		= Dereference.builder().variable(variable).build();
	private static final Predicate predicate
		= Predicate.builder().label("Test").signature(Predicate.ParameterList.builder().parameters(new Predicate.Parameter[]{dereference}).build()).build();
	private static final Logic sortedAnd
		= Logic.builder()
			   .operator(Logic.Operator.AND)
			   .branches(new LogicBranch[]{
				   constantInteger,
				   variable
			   })
			   .build();

	private static final Logic unsortedAnd
		= Logic.builder()
			   .operator(Logic.Operator.AND)
			   .branches(new LogicBranch[]{
				   variable,
				   constantInteger
			   })
			   .build();

	private static final Compare sortedEq
		= Compare.builder()
				 .operator(Compare.Operator.EQUALITY)
				 .branches(new CompareBranch[]{
					 constantInteger,
					 variable
				 })
				 .build();

	private static final Compare unsortedEq
		= Compare.builder()
				 .operator(Compare.Operator.EQUALITY)
				 .branches(new CompareBranch[]{
					 variable,
					 constantInteger
				 })
				 .build();

	static Stream<RewriteRuleFactoryTestAssertion> positiveCases() {
		final var builder = RewriteRuleFactoryTestAssertion.StreamBuilder
			.builder()
			.rule(new CommutativeBranchOrderingNormalisation());

		/* Begin Logic Term*/
		shallowLogicReorder(builder, variable, constantInteger);

		shallowLogicReorder(builder, Constant.TRUE, Constant.FALSE);

		shallowLogicReorder(builder, variable, constantString);

		shallowLogicReorder(builder, dereference, variable);
		shallowLogicReorder(builder, dereference, constantInteger);
		shallowLogicReorder(builder, dereference, constantString);

		shallowLogicReorder(builder, constantInteger, constantString);
		shallowLogicReorder(builder, constantInteger, constantString);

		shallowLogicReorder(builder, predicate, constantString);
		shallowLogicReorder(builder, predicate, constantInteger);
		shallowLogicReorder(builder, predicate, variable);
		shallowLogicReorder(builder, predicate, dereference);

		shallowLogicReorder(builder, predicate, dereference);

		shallowLogicReorder(builder, sortedAnd, predicate);

		/* Begin EqualityLike Term*/

		shallowEqualityReorder(builder, variable, constantInteger);
		shallowEqualityReorder(builder, variable, constantString);

		shallowEqualityReorder(builder, dereference, variable);
		shallowEqualityReorder(builder, dereference, constantInteger);
		shallowEqualityReorder(builder, dereference, constantString);

		shallowEqualityReorder(builder, constantInteger, constantString);
		shallowEqualityReorder(builder, constantInteger, constantString);

		shallowEqualityReorder(builder, predicate, constantString);
		shallowEqualityReorder(builder, predicate, constantInteger);
		shallowEqualityReorder(builder, predicate, variable);
		shallowEqualityReorder(builder, predicate, dereference);

		shallowEqualityReorder(builder, predicate, dereference);

		shallowEqualityReorder(builder, sortedEq, predicate);

		/* Begin Recursion*/

		builder.instance(RewriteRuleFactoryTestAssertion
			.Instance
			.builder()
			.name("Recursive Application of Rule to Logic")
			.input(Logic.builder().operator(Logic.Operator.AND).branches(new LogicBranch[]{
				unsortedAnd,
				predicate,
				variable,
				constantInteger,
				sortedAnd,
				constantString,
				dereference
			}).build())
			.expectedOutput(
				Logic.builder().operator(Logic.Operator.AND).branches(new LogicBranch[]{
					constantString,
					constantInteger,
					variable,
					dereference,
					predicate,
					sortedAnd,
					sortedAnd
				}).build()
			)
			.build()
		);

		builder.instance(RewriteRuleFactoryTestAssertion
			.Instance
			.builder()
			.name("Recursive Application of Rule to Compare")
			.input(Compare.builder().operator(Compare.Operator.UN_EQUALITY).branches(new CompareBranch[]{
				unsortedEq,
				predicate,
				variable,
				constantInteger,
				sortedEq,
				constantString,
				dereference
			}).build())
			.expectedOutput(
				Compare.builder().operator(Compare.Operator.UN_EQUALITY).branches(new CompareBranch[]{
					constantString,
					constantInteger,
					variable,
					dereference,
					predicate,
					sortedEq,
					sortedEq
				}).build()
			)
			.build()
		);

		builder.instance(RewriteRuleFactoryTestAssertion
			.Instance
			.builder()
			.name("Recursive Application of Rule to Logic with Compare")
			.input(Logic.builder().operator(Logic.Operator.AND).branches(new LogicBranch[]{
				unsortedAnd,
				predicate,
				variable,
				unsortedEq,
				constantInteger,
				sortedAnd,
				constantString,
				dereference,
				sortedEq
			}).build())
			.expectedOutput(
				Logic.builder().operator(Logic.Operator.AND).branches(new LogicBranch[]{
					constantString,
					constantInteger,
					variable,
					dereference,
					predicate,
					sortedEq,
					sortedEq,
					sortedAnd,
					sortedAnd
				}).build()
			)
			.build()
		);

		return builder.build().build();
	}

	static void shallowLogicReorder(RewriteRuleFactoryTestAssertion.StreamBuilder.StreamBuilderBuilder builder, LogicBranch a, LogicBranch b) {
		builder.instance(logicReorderInstance(
			Logic.Operator.AND, a, b
		)).instance(logicReorderInstance(
			Logic.Operator.OR, a, b
		));
	}

	static RewriteRuleFactoryTestAssertion.Instance logicReorderInstance(Logic.Operator operator, LogicBranch a, LogicBranch b) {
		final var input = Logic.builder()
							   .operator(operator)
							   .branches(new LogicBranch[]{
								   a,
								   b
							   })
							   .build();
		final var expectedOutput = Logic.builder()
										.operator(operator)
										.branches(new LogicBranch[]{
											b,
											a
										})
										.build();
		return RewriteRuleFactoryTestAssertion
			.Instance
			.builder()
			.name(String.format(
				"%s is rewritten to %s",
				new SyntaxTreeRenderer().render(input),
				new SyntaxTreeRenderer().render(expectedOutput))
			)
			.input(input)
			.expectedOutput(expectedOutput)
			.build();
	}

	static void shallowEqualityReorder(RewriteRuleFactoryTestAssertion.StreamBuilder.StreamBuilderBuilder builder, CompareBranch a, CompareBranch b) {
		builder.instance(compareReorderInstance(
			Compare.Operator.EQUALITY, a, b
		)).instance(compareReorderInstance(
			Compare.Operator.UN_EQUALITY, a, b
		));
	}

	static RewriteRuleFactoryTestAssertion.Instance compareReorderInstance(Compare.Operator operator, CompareBranch a, CompareBranch b) {
		final var input = Compare.builder()
								 .operator(operator)
								 .branches(new CompareBranch[]{
									 a,
									 b
								 })
								 .build();
		final var expectedOutput = Compare.builder()
										  .operator(operator)
										  .branches(new CompareBranch[]{
											  b,
											  a
										  })
										  .build();
		return RewriteRuleFactoryTestAssertion
			.Instance
			.builder()
			.name(String.format(
				"%s is rewritten to %s",
				new SyntaxTreeRenderer().render(input),
				new SyntaxTreeRenderer().render(expectedOutput))
			)
			.input(input)
			.expectedOutput(expectedOutput)
			.build();
	}

	static RewriteRuleFactoryTestAssertion.Instance doesNotApply(Compare.Operator operator, CompareBranch a, CompareBranch b) {
		final var input = Compare.builder()
								 .operator(operator)
								 .branches(new CompareBranch[]{
									 a,
									 b
								 })
								 .build();
		return RewriteRuleFactoryTestAssertion
			.Instance
			.builder()
			.name(String.format(
				"is not applied to %s",
				new SyntaxTreeRenderer().render(input)
			))
			.input(input)
			.expectedOutput(input)
			.build();
	}

	static Stream<RewriteRuleFactoryTestAssertion> invalidCases() {
		final var builder = RewriteRuleFactoryTestAssertion.StreamBuilder
			.builder()
			.rule(new CommutativeBranchOrderingNormalisation());

		for (var op : Arrays.stream(Compare.Operator.values()).filter(e -> !e.isEqualityOrUnEquality()).collect(Collectors.toList())) {


			builder.instance(doesNotApply(op, variable, constantInteger));

			builder.instance(doesNotApply(op, variable, constantInteger));
			builder.instance(doesNotApply(op, variable, constantString));

			builder.instance(doesNotApply(op, dereference, variable));
			builder.instance(doesNotApply(op, dereference, constantInteger));
			builder.instance(doesNotApply(op, dereference, constantString));

			builder.instance(doesNotApply(op, constantInteger, constantString));
			builder.instance(doesNotApply(op, constantInteger, constantString));

			builder.instance(doesNotApply(op, predicate, constantString));
			builder.instance(doesNotApply(op, predicate, constantInteger));
			builder.instance(doesNotApply(op, predicate, variable));
			builder.instance(doesNotApply(op, predicate, dereference));

			builder.instance(doesNotApply(op, predicate, dereference));

			builder.instance(doesNotApply(op, sortedEq, predicate));

		}

		return builder.build().build();
	}

	@ParameterizedTest
	@MethodSource("positiveCases")
	void validApplications(RewriteRuleFactoryTestAssertion normalisationAssertion) {
		assertDoesNotThrow(normalisationAssertion::run);
	}

	@ParameterizedTest
	@MethodSource("invalidCases")
	void invalidApplications(RewriteRuleFactoryTestAssertion normalisationAssertion) {
		assertDoesNotThrow(normalisationAssertion::run);
	}
}

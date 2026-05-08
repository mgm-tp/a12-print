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
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Compare;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.CompareBranch;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Constant;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.SyntaxTreeElement;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.visitor.SyntaxTreeRenderer;
import lombok.NonNull;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.Arrays;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class ConstantNumberCompareShortCircuitNormalisationTest {

	private static final Constant constantIntegerOne
		= Constant.builder().constantType(Constant.ConstantType.INTEGER).value("1").build();

	private static final Constant constantFloatOne
		= Constant.builder().constantType(Constant.ConstantType.FLOAT).value("1.0").build();
	private static final Constant constantFloatOneDotOne
		= Constant.builder().constantType(Constant.ConstantType.FLOAT).value("1.1").build();

	private static final Constant constantStringOne
		= Constant.builder().constantType(Constant.ConstantType.STRING).value("1").build();


	static Stream<RewriteRuleFactoryTestAssertion> positiveCases() {
		final var builder = RewriteRuleFactoryTestAssertion.StreamBuilder
			.builder()
			.rule(new ConstantNumberCompareShortCircuitNormalisation());

		for(var operator : Arrays.stream(Compare.Operator.values()).filter(Compare.Operator::entailsEqualitySemantic).collect(Collectors.toList())) {
			builder.instance(applies(operator, constantIntegerOne, constantIntegerOne, Constant.TRUE));
			builder.instance(applies(operator, constantFloatOne, constantIntegerOne, Constant.TRUE));
			builder.instance(applies(operator, constantFloatOne, constantFloatOne, Constant.TRUE));
			builder.instance(applies(operator, constantFloatOneDotOne, constantFloatOneDotOne, Constant.TRUE));
		}

		builder.instance(applies(Compare.Operator.UN_EQUALITY, constantIntegerOne, constantIntegerOne, Constant.FALSE));
		builder.instance(applies(Compare.Operator.UN_EQUALITY, constantFloatOne, constantIntegerOne, Constant.FALSE));
		builder.instance(applies(Compare.Operator.UN_EQUALITY, constantFloatOne, constantFloatOne, Constant.FALSE));
		builder.instance(applies(Compare.Operator.UN_EQUALITY, constantFloatOneDotOne, constantFloatOneDotOne, Constant.FALSE));


		builder.instance(applies(Compare.Operator.LESS_THAN, constantFloatOneDotOne, constantIntegerOne, Constant.FALSE));
		builder.instance(applies(Compare.Operator.LESS_THAN_OR_EQUAL, constantFloatOneDotOne, constantIntegerOne, Constant.FALSE));
		builder.instance(applies(Compare.Operator.GREATER_THAN, constantFloatOneDotOne, constantIntegerOne, Constant.TRUE));
		builder.instance(applies(Compare.Operator.GREATER_THAN_OR_EQUAL, constantFloatOneDotOne, constantIntegerOne, Constant.TRUE));

		return builder.build().build();
	}


	private static RewriteRuleFactoryTestAssertion.Instance applies(Compare.Operator op, @NonNull CompareBranch a, @NonNull CompareBranch b, @NonNull SyntaxTreeElement result) {
		final var input = Compare.builder()
								 .operator(op)
								 .branches(new CompareBranch[]{
									 a,
									 b
								 })
								 .build();

		return RewriteRuleFactoryTestAssertion
			.Instance
			.builder()
			.name(String.format(
				"%s is rewritten to %s",
				new SyntaxTreeRenderer().render(input),
				new SyntaxTreeRenderer().render(result)
			))
			.input(input)
			.expectedOutput(result)
			.build();
	}

	private static RewriteRuleFactoryTestAssertion.Instance doesNotApply(Compare.Operator op, @NonNull CompareBranch a, @NonNull CompareBranch b) {
		final var input = Compare.builder()
								 .operator(op)
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
			.rule(new ConstantNumberCompareShortCircuitNormalisation());

		for (var op : Arrays.stream(Compare.Operator.values()).filter(e -> !e.isEqualityOrUnEquality()).collect(Collectors.toList())) {

			builder.instance(doesNotApply(op, constantStringOne, constantIntegerOne));
			builder.instance(doesNotApply(op, constantIntegerOne, constantStringOne));
			builder.instance(doesNotApply(op, Constant.TRUE, Constant.TRUE));
			builder.instance(doesNotApply(op, Constant.FALSE, Constant.FALSE));
			builder.instance(doesNotApply(op, constantIntegerOne, Constant.TRUE));
			builder.instance(doesNotApply(op, constantIntegerOne, Constant.FALSE));
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

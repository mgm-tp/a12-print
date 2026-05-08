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
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class CommutativeLogicBranchFoldNormalisationTest {
	private static final Variable variable
		= Variable.builder().isAbsolute(true).segments(new ReferenceSegment[]{ReferenceSegment.builder().label("var1").build()}).build();
	private static final Constant constantInteger
		= Constant.builder().constantType(Constant.ConstantType.INTEGER).value("1").build();

	static Stream<RewriteRuleFactoryTestAssertion> positiveCases() {
		final var builder = RewriteRuleFactoryTestAssertion.StreamBuilder
			.builder()
			.rule(new CommutativeLogicBranchFoldNormalisation());
		{
			var innerAnd
				= Logic.builder()
					   .operator(Logic.Operator.AND)
					   .branches(new LogicBranch[]{
						   constantInteger,
						   variable
					   })
					   .build();
			var innerOr
				= Logic.builder()
					   .operator(Logic.Operator.OR)
					   .branches(new LogicBranch[]{
						   constantInteger,
						   variable
					   })
					   .build();
			var outerAnd = Logic.builder()
								.operator(Logic.Operator.AND)
								.branches(new LogicBranch[]{
									innerAnd,
									constantInteger,
									innerOr
								}).build();

			builder.instance(
				RewriteRuleFactoryTestAssertion
					.Instance
					.builder()
					.input(outerAnd)
					.expectedOutput(
						Logic.builder()
							 .operator(Logic.Operator.AND)
							 .branches(new LogicBranch[]{
								 constantInteger,
								 variable,
								 constantInteger,
								 innerOr
							 }).build()
					)
					.build()
			);

		}

		{

			for (var op : Logic.Operator.values()) {

				var innerAnd
					= Logic.builder()
						   .operator(op)
						   .branches(new LogicBranch[]{
							   constantInteger,
							   variable
						   })
						   .build();
				var outerAnd = Logic.builder()
									.operator(op)
									.branches(new LogicBranch[]{
										innerAnd,
										constantInteger
									}).build();

				builder.instance(
					RewriteRuleFactoryTestAssertion
						.Instance
						.builder()
						.input(outerAnd)
						.expectedOutput(
							Logic.builder()
								 .operator(op)
								 .branches(new LogicBranch[]{
									 constantInteger,
									 variable,
									 constantInteger
								 }).build()
						)
						.build()
				);
			}

		}

		return builder.build().build();
	}

	static Stream<RewriteRuleFactoryTestAssertion> invalidCases() {
		final var builder = RewriteRuleFactoryTestAssertion.StreamBuilder
			.builder()
			.rule(new CommutativeLogicBranchFoldNormalisation());

		{
			for (var inner : Logic.Operator.values()) {

				for (var op : Logic.Operator.values()) {

					if(inner == op){
						continue;
					}
					var inner2And
						= Logic.builder()
							   .operator(op)
							   .branches(new LogicBranch[]{
								   constantInteger,
								   variable
							   })
							   .build();
					var innerAnd
						= Logic.builder()
							   .operator(inner)
							   .branches(new LogicBranch[]{
								   constantInteger,
								   variable,
								   inner2And
							   })
							   .build();
					var outerAnd = Logic.builder()
										.operator(op)
										.branches(new LogicBranch[]{
											innerAnd,
											constantInteger
										}).build();

					builder.instance(
						RewriteRuleFactoryTestAssertion
							.Instance
							.builder()
							.name("does not apply to mixed logic branches " + op.name() + " " + inner.name() + " " + op.name())
							.input(outerAnd)
							.expectedOutput(outerAnd)
							.build()
					);
				}
			}

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

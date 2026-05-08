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
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class IdentityEqualityCompareShortCircuitNormalisationTest {


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
	private static final Predicate predicate2
		= Predicate.builder().label("Test").signature(Predicate.ParameterList.builder().parameters(new Predicate.Parameter[]{constantInteger}).build()).build();

	static Stream<RewriteRuleFactoryTestAssertion> positiveCases() {
		final var builder = RewriteRuleFactoryTestAssertion.StreamBuilder
			.builder()
			.rule(new IdentityEqualityCompareShortCircuitNormalisation());

		for (var cmp : Arrays.stream(Compare.Operator.values()).filter(Compare.Operator::entailsEqualitySemantic).collect(Collectors.toList())) {

			for (var term : List.of(Constant.TRUE, Constant.FALSE, variable, constantInteger, constantString, predicate, dereference, predicate2)) {

				builder.instance(
					RewriteRuleFactoryTestAssertion
						.Instance
						.builder()
						.input(Compare.builder()
									  .operator(cmp)
									  .branches(new CompareBranch[]{
										  term,
										  term,
									  })
									  .build())
						.expectedOutput(Constant.TRUE)
						.build()
				);
			}

		}

		return builder.build().build();
	}

	static Stream<RewriteRuleFactoryTestAssertion> invalidCases() {
		final var builder = RewriteRuleFactoryTestAssertion.StreamBuilder
			.builder()
			.rule(new IdentityEqualityCompareShortCircuitNormalisation());

		for (var cmp : Arrays.stream(Compare.Operator.values()).filter(Compare.Operator::entailsEqualitySemantic).collect(Collectors.toList())) {

			for (var term : List.of(Constant.TRUE, Constant.FALSE, variable, constantInteger, constantString, predicate, predicate2)) {

				for (var diffTerm : List.of(Constant.TRUE, Constant.FALSE, variable, constantInteger, constantString, predicate, predicate2)) {
					if(term.equals(diffTerm)){
						continue;
					}
					final var input = Compare.builder()
											 .operator(cmp)
											 .branches(new CompareBranch[]{
												 term,
												 term,
												 diffTerm
											 })
											 .build();

					builder.instance(
						RewriteRuleFactoryTestAssertion
							.Instance
							.builder()
							.name(String.format("does not apply if there is any none-equal branch (%s)", new SyntaxTreeRenderer().render(input)))
							.input(input)
							.expectedOutput(input)
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

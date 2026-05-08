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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.rewrite;

import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Constant;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Predicate;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.ReferenceSegment;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Variable;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PatternOnConstantNormalisationTest {

	@Test
	void patternMatched() {

		final var rule = new PatternOnConstantNormalisation();

		assertThat(rule.apply(
			Predicate
				.builder()
				.label("PatternMatched")
				.signature(
					Predicate.InfixParameterList
						.builder()
						.leftParameter(
							Constant.builder()
									.constantType(Constant.ConstantType.STRING)
									.value("HelloWorld")
									.build()
						).rightParameter(
								 Constant.builder()
										 .constantType(Constant.ConstantType.STRING)
										 .value("Hello.*")
										 .build()
							 )
						.build()
				)
				.build()
		)).isEqualTo(Constant.TRUE);

		assertThat(rule.apply(
			Predicate
				.builder()
				.label("PatternMatched")
				.signature(
					Predicate.InfixParameterList
						.builder()
						.leftParameter(
							Constant.builder()
									.constantType(Constant.ConstantType.STRING)
									.value("HelloWorld")
									.build()
						).rightParameter(
								 Constant.builder()
										 .constantType(Constant.ConstantType.STRING)
										 .value("Pattern.*")
										 .build()
							 )
						.build()
				)
				.build()
		)).isEqualTo(Constant.FALSE);
	}

	@Test
	void patternViolated() {

		final var rule = new PatternOnConstantNormalisation();

		assertThat(rule.apply(
			Predicate
				.builder()
				.label("PatternViolated")
				.signature(
					Predicate.InfixParameterList
						.builder()
						.leftParameter(
							Constant.builder()
									.constantType(Constant.ConstantType.STRING)
									.value("HelloWorld")
									.build()
						).rightParameter(
								 Constant.builder()
										 .constantType(Constant.ConstantType.STRING)
										 .value("Hello.*")
										 .build()
							 )
						.build()
				)
				.build()
		)).isEqualTo(Constant.FALSE);

		assertThat(rule.apply(
			Predicate
				.builder()
				.label("PatternViolated")
				.signature(
					Predicate.InfixParameterList
						.builder()
						.leftParameter(
							Constant.builder()
									.constantType(Constant.ConstantType.STRING)
									.value("HelloWorld")
									.build()
						).rightParameter(
								 Constant.builder()
										 .constantType(Constant.ConstantType.STRING)
										 .value("Pattern.*")
										 .build()
							 )
						.build()
				)
				.build()
		)).isEqualTo(Constant.TRUE);

	}

	@Test
	void notAppliedIfLeftIsNotAConstant() {
		final var rule = new PatternOnConstantNormalisation();

		final var input = Predicate
			.builder()
			.label("PatternMatched")
			.signature(
				Predicate.InfixParameterList
					.builder()
					.leftParameter(
						Variable.builder()
								.isAbsolute(true)
								.segments(new ReferenceSegment[]{
									ReferenceSegment.builder().label("Hello").build()
								})
								.build()
					).rightParameter(
							 Constant.builder()
									 .constantType(Constant.ConstantType.STRING)
									 .value("Hello.*")
									 .build()
						 )
					.build()
			)
			.build();
		assertThat(rule.apply(input)).isEqualTo(input);

	}

	@Test
	void notAppliedIfRightIsNotAConstant() {
		final var rule = new PatternOnConstantNormalisation();

		final var input = Predicate
			.builder()
			.label("PatternMatched")
			.signature(
				Predicate.InfixParameterList
					.builder()
					.leftParameter(
						Constant.builder()
								.constantType(Constant.ConstantType.STRING)
								.value("Hello.*")
								.build()
					).rightParameter(
							 Variable.builder()
									 .isAbsolute(true)
									 .segments(new ReferenceSegment[]{
										 ReferenceSegment.builder().label("Hello").build()
									 })
									 .build()
						 )
					.build()
			)
			.build();
		assertThat(rule.apply(input)).isEqualTo(input);

	}

}

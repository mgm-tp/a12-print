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
package com.mgmtp.a12.print.engine.runtime.kernel.internal.elements;

import com.mgmtp.a12.print.engine.runtime.kernel.internal.ComputationParser;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.RewriteSyntaxTree;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RewriteSyntaxTreeTest {

	@Test
	void replaceConstant() {

		var parser = new ComputationParser();
		var src = "\"Hello\" == \"World\"";
		var result = parser.parseTree(src);

		var replace = RewriteSyntaxTree
			.withRules().constant(
				(o, c) -> b -> Constant.TRUE
			)
			.build()
			.instantiate(result.getRoot())
			.apply();

		assertThat(replace).isEqualTo(
			Compare.builder()
				   .operator(Compare.Operator.EQUALITY)
				   .branches(new CompareBranch[]{
					   Constant.TRUE,
					   Constant.TRUE
				   })
				   .build()
		);

		assertThat(replace).isNotSameAs(result.getRoot());
	}

	@Test
	void replaceConstantAndOperator() {

		var parser = new ComputationParser();
		var src = "\"Hello\" == \"World\"";
		var result = parser.parseTree(src);

		var replace = RewriteSyntaxTree
			.withRules()
			.constant(
				(original, clone) -> "Hello".equals(original.getValue()) ? (b -> Constant.TRUE) : (b -> clone)
			)
			.compare(
				(original, clone) -> Compare.Operator.EQUALITY.equals(original.getOperator())
					? b -> b.operator(Compare.Operator.UN_EQUALITY).build()
					: b -> clone
			)
			.build()
			.instantiate(result.getRoot())
			.apply();

		assertThat(replace).isNotSameAs(result.getRoot());
		assertThat(replace).isEqualTo(
			Compare.builder()
				   .operator(Compare.Operator.UN_EQUALITY)
				   .branches(new CompareBranch[]{
					   Constant.TRUE,
					   Constant.builder()
							   .constantType(Constant.ConstantType.STRING)
							   .value("World")
						   .build()
				   })
				   .build()
		);
	}

}

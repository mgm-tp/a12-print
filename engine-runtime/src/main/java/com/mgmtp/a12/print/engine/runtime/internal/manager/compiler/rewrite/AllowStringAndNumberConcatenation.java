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

import com.mgmtp.a12.print.engine.runtime.kernel.internal.SyntaxTreePredicateClassifier;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EggRewriteRuleFactory;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EggRewriteRuleInstance;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EquivalenceGeneralizationGraph;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.RewriteSyntaxTree;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.*;
import lombok.Builder;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Builder
@RequiredArgsConstructor
public class AllowStringAndNumberConcatenation implements EggRewriteRuleFactory {

	@NonNull
	private final EquivalenceGeneralizationGraph equivalenceGeneralizationGraph;

	@NonNull
	private final SyntaxTreePredicateClassifier syntaxTreePredicateClassifier;

	@Override
	public EggRewriteRuleInstance instantiate(SyntaxTreeElement e) {
		return RewriteSyntaxTree
			.withRules()
			.arithmetic((o, clone) -> {

				if (!o.getOperator().equals(Arithmetic.Operator.PLUS)) {
					return b -> clone;
				}

				final var branchTypes = Arrays
					.stream(clone.getBranches())
					.map(syntaxTreePredicateClassifier::classifyFieldType)
					.collect(Collectors.toList());

				if (!branchTypes.contains(ComputationFieldType.NUMBER)) {
					return b -> clone;
				}

				if (branchTypes.stream().noneMatch(ComputationFieldType::isStringLike)) {
					return b -> clone;
				}


				final var branches = new ArrayList<>(List.of(o.getBranches()));
				for (var i = 0; i < branchTypes.size(); i++) {

					if (branchTypes.get(i).equals(ComputationFieldType.NUMBER)
						&& branches.get(i).elementType().equals(SyntaxTreeElementType.DEREFERENCE)) {

						final var branch = (Dereference) branches.get(i);
						branches.set(i, Predicate.builder()
												 .label("FieldValueAsString")
												 .signature(
													 Predicate
														 .ParameterList
														 .builder()
														 .parameters(new Predicate.Parameter[]{
															 branch.getVariable()
														 })
														 .build()
												 )
												 .build());
					}

				}
				final var branchArray = branches.toArray(ArithmeticBranch[]::new);
				return b -> b.branches(branchArray).build();

			})
			.build()
			.instantiate(e);
	}
}

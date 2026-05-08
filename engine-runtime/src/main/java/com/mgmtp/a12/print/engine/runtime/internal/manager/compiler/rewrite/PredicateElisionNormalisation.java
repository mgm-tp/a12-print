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

import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.synthetics.SyntheticVariable;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.synthetics.SyntheticVariableType;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EggRewriteRuleFactory;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EggRewriteRuleInstance;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.RewriteSyntaxTree;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.*;
import lombok.RequiredArgsConstructor;

import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.function.BiFunction;
import java.util.function.Function;

@RequiredArgsConstructor
public class PredicateElisionNormalisation implements EggRewriteRuleFactory {

	private Function<Predicate.PredicateBuilder, SyntaxTreeElement> tryElidePredicateToConstant(
		Predicate predicate,
		BiFunction<Predicate.PredicateBuilder, Set<Variable>, SyntaxTreeElement> value
	) {
		if (predicate.getSignature().signatureType().equals(Predicate.SignatureType.PARAMETER_LIST)) {

			final var parameterList = (Predicate.ParameterList) predicate.getSignature();
			final var signatureVariables = new HashSet<Variable>();
			parameterList.accept(
				new SyntaxTreeElementVisitor() {
					@Override
					public void visit(Variable node, VisitationState state) {
						signatureVariables.add(node);
					}
				},
				VisitationState.stateless()
			);
			if (signatureVariables.stream().allMatch(Objects::nonNull)) {
				return b -> value.apply(b, signatureVariables);
			}
		}
		return null;
	}


	@Override
	public EggRewriteRuleInstance instantiate(SyntaxTreeElement e) {

		return RewriteSyntaxTree
			.withRules()
			.predicate((o, clone) -> {
				Function<Predicate.PredicateBuilder, SyntaxTreeElement> result = null;

				if (o.getLabel().equals("FieldFilled")) {
					result = createFieldFilledEvaluation(o);
				}

				if (o.getLabel().equals("FieldNotFilled")) {
					result = createFieldNotFilledEvaluation(o);
				}

				if (o.getLabel().equals("Length")) {
					result = createLengthEvaluation(o);
				}

				if (o.getLabel().equals("FieldValueAsString")) {
					result = createFieldValueEvaluation(o);
				}

				return result == null ? b -> clone : result;
			})
			.build()
			.instantiate(e);

	}

	private Function<Predicate.PredicateBuilder, SyntaxTreeElement> createFieldValueEvaluation(Predicate o) {
		return tryElidePredicateToConstant(
			o,
			(a, b) -> b.stream().allMatch(SyntheticVariable.NotFilled::equals)
				? Constant.builder().constantType(Constant.ConstantType.STRING).value("").build()
				: a.build()
		);
	}

	private Function<Predicate.PredicateBuilder, SyntaxTreeElement> createLengthEvaluation(Predicate o) {
		return tryElidePredicateToConstant(o, (a, b) -> {
		if (b.stream().allMatch(SyntheticVariable.NotFilled::equals)) {
			return Constant.builder().constantType(Constant.ConstantType.INTEGER).value("0").build();
		} else {
			return a.build();
		}
	});
	}

	private Function<Predicate.PredicateBuilder, SyntaxTreeElement> createFieldNotFilledEvaluation(Predicate o) {
		return tryElidePredicateToConstant(o, (a, b) -> {
			if (b.stream().allMatch(SyntheticVariable.NotFilled::equals)) {
				return Constant.TRUE;
			}
			return b.stream().allMatch(v -> SyntheticVariable.isSynthetic(v) && SyntheticVariable.from(v).getSyntheticVariableType().equals(SyntheticVariableType.CONSTANT))
				? Constant.FALSE
				: a.build();
		});
	}

	private Function<Predicate.PredicateBuilder, SyntaxTreeElement> createFieldFilledEvaluation(Predicate o) {
		return tryElidePredicateToConstant(o, (a, b) -> {
				if (b.stream().noneMatch(SyntheticVariable.NotFilled::equals)) {
					return b.stream().allMatch(v -> SyntheticVariable.isSynthetic(v) && SyntheticVariable.from(v).getSyntheticVariableType().equals(SyntheticVariableType.CONSTANT))
						? Constant.TRUE
						: a.build();
				}
				return Constant.FALSE;
			}
		);
	}
}

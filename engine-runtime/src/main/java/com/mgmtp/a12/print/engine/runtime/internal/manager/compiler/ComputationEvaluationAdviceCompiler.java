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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler;

import com.mgmtp.a12.print.engine.runtime.internal.manager.ComputationEvaluationAdvice;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.computation.TypedComputationExpression;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.TypedComputationExpressionCache;
import lombok.Builder;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.tuple.Pair;

import java.util.*;
import java.util.function.Consumer;
import java.util.function.Function;


@Slf4j
@Builder
public class ComputationEvaluationAdviceCompiler {

	@NonNull
	private final TypedComputationExpressionCache strategyCache = new TypedComputationExpressionCache();
	@NonNull
	private final List<LogicContainerCompilation> computations;
	@NonNull
	private final List<LogicComponentStatementSyntaxTreeAnalysis> syntaxTreeAnalyses;

	private final HashMap<ComputationEvaluationAdvice, TypedComputationExpression> results = new HashMap<>();

	public void compileAdvices(Function<ComputationEvaluationAdvice, TypedComputationExpression> compile) {
		final var backlog = new TreeSet<>(
			Comparator.comparing(
						  (Pair<Integer, ComputationEvaluationAdvice> a) -> a.getKey())
					  .thenComparing(Pair::getValue)
		);

		final Consumer<ComputationEvaluationAdvice> tryAdd = a -> Optional.ofNullable(a).ifPresent(
			advice -> backlog.add(Pair.of(0, advice))
		);

		addComputations(tryAdd);

		syntaxTreeAnalyses.forEach(a -> tryAdd.accept(a.getAdvice()));

		final var advices = new ArrayList<ComputationEvaluationAdvice>();
		final var done = new HashSet<String>();
		while (!backlog.isEmpty()) {
			final var next = backlog.pollFirst();
			if (next == null) {
				break;
			}
			if (done.containsAll(next.getValue().getProviderIdDependencies())) {
				done.add(next.getValue().getProviderId());
				advices.add(next.getValue());
			} else {
				backlog.add(Pair.of(next.getKey() + 1, next.getValue()));
			}
		}

		for (var advice : advices) {
			if (advice.evaluationCategory().equals(ComputationEvaluationAdvice.Category.RESOLVE_PROVIDER)) {
				final var result = strategyCache.get(
					((ComputationEvaluationAdvice.ResolveComputationEvaluationProvider) advice).getSourceProviderId());
				strategyCache.addStrategy(advice.getProviderId(), result);
				results.put(advice, result);
			} else {
				final var result = compile.apply(advice);
				strategyCache.addStrategy(advice.getProviderId(), result);
				results.put(advice, result);
			}
		}

	}

	private void addComputations(Consumer<ComputationEvaluationAdvice> tryAdd) {
		for (var compilation : computations) {
			for (var component : compilation.getComponents()) {
				for (var statement : component.getStatements()) {
					tryAdd.accept(statement.getAdvice());
				}
			}
		}
	}

	public @NonNull TypedComputationExpression getExpression(ComputationEvaluationAdvice advice) {
		return Optional.ofNullable(results.get(advice)).orElseThrow();
	}

	public @NonNull TypedComputationExpression getExpressionById(String s) {
		return strategyCache.get(s);

	}

	public @NonNull TypedComputationExpressionCache getTypedComputationExpressionCache() {
		return strategyCache;
	}
}



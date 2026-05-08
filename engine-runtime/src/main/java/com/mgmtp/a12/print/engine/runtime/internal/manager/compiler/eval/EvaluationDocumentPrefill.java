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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.eval;

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocument;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.computation.ComputationExpression;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.ComputationExpressionDependency;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.ComputeDocumentDependency;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Variable;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.visitor.SyntaxTreeRenderer;
import lombok.Data;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.function.BiFunction;

import static com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.eval.EvaluationDocumentModelCompiler.MODEL;

@Data
public class EvaluationDocumentPrefill {

	private final Map<String, Map<String, String>> evalDocumentModelInputs = new HashMap<>();

	public ComputationExpression createAdapter(
		final EvaluationDocumentModelCompiler evaluationDocumentModelCompiler,
		final ComputationStatement statement
	) {

		final var fieldPath = evaluationDocumentModelCompiler.getFieldPath(statement);
		final var resultPrefix = statement.getResultPrefix();

		final var valueLens = resultPrefix.map(computedPrefix ->
			(BiFunction<ComputationExpression.Parameters, PrintDocument, Optional<Object>>) (parameters, computedDocument) -> {

				final var prefix = Variable.builder()
										   .isAbsolute(true)
										   .segments(Arrays.copyOfRange(computedPrefix.getSegments(), 1, computedPrefix.getSegments().length))
										   .build();

				final var context = parameters.getPrintDocumentContext().orElseThrow(
					() -> new PrintException("repeatable computation requires a repetition context")
				);

				final var range = context.findRepetitionPrefix(prefix).orElseThrow(
					() -> new PrintException("repeatable computation requires a repetition context")
				);

				final var repPath = String.format("/%s%s",
					MODEL,
					SyntaxTreeRenderer.getPath(
						true,
						true,
						Arrays.copyOf(computedPrefix.getSegments(), computedPrefix.getSegments().length)
					)
				);

				final var documentContext = computedDocument.context();
				final var compContext = documentContext
					.findRepetitions(repPath)
					.filter(rep -> rep.findCurrentRepetition().getStart() == range.getStart())
					.findAny();

				return compContext.flatMap(printDocumentContext -> printDocumentContext
					.findSingleFieldInstance(fieldPath)
					.flatMap(PrintDocumentContext.Entity::getValue));
			}
		).orElseGet(() ->
			(p, document) -> document
				.context()
				.findSingleFieldInstance(fieldPath)
				.flatMap(PrintDocumentContext.Entity::getValue)
		);

		final var evalDocumentModelName = statement.getEvaluationDocumentModelRequirements().getEvalDocumentModelName();
		return (parameters, job, internalCorePrintEngineRuntime) -> {
			final var syntheticVariables = evalDocumentModelInputs.get(evalDocumentModelName);
			if (syntheticVariables != null && !syntheticVariables.isEmpty()) {
				internalCorePrintEngineRuntime.streamComputationExpressionDependency(
					syntheticVariables.entrySet()
									  .stream()
									  .filter(e -> !parameters.getValues().containsKey(e.getValue()))
									  .map(entry -> ComputationExpressionDependency
										  .builder()
										  .expressionId(entry.getKey())
										  .parameters(parameters)
										  .build()
									  )
				).forEach(evaluation -> evaluation.getObject().ifPresent(
					v -> {
						synchronized (parameters) {
							final var values = parameters.getValues();
							values.put(syntheticVariables.get(evaluation.getExpressionId()), v);
						}
					}
				));
			}

			final var document = internalCorePrintEngineRuntime.provide(
				new ComputeDocumentDependency(evalDocumentModelName, parameters)
			).get();

			return valueLens.apply(parameters, document);
		};
	}

}

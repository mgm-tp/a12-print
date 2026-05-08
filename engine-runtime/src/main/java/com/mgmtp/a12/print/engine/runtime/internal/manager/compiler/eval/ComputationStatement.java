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

import com.mgmtp.a12.print.engine.runtime.internal.manager.ComputationEvaluationAdvice;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.synthetics.SyntheticVariable;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.synthetics.SyntheticVariableType;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Variable;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.visitor.VariableSearch;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NonNull;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Getter
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ComputationStatement {

	@NonNull
	private final ComputationEvaluationAdvice.KernelComputation kernelComputation;
	@NonNull
	private final Map<SyntheticVariableType, List<SyntheticVariable>> syntheticVariableMap;
	@NonNull
	private final List<SyntheticVariable> metaVariables;
	@NonNull
	private final List<SyntheticVariable> metaConstants;

	@NonNull
	private final Set<Variable> variables;

	@NonNull
	private final List<EvaluationDocumentModelReference> documentModels;

	@Builder.Default
	private Variable resultPrefix = null;

	public static ComputationStatement build(
		ComputationEvaluationAdvice.KernelComputation kernelComputation
	) {

		final var variables = VariableSearch.findDistinctVariables(
			kernelComputation.getSyntaxTreeElement()
		);

		final var synthetics = new HashMap<SyntheticVariableType, List<SyntheticVariable>>();

		variables
			.stream()
			.filter(SyntheticVariable::isSynthetic)
			.map(SyntheticVariable::from)
			.collect(Collectors.toList())
			.forEach(e -> {
				variables.remove(e.getVariable());
				synthetics.compute(
					e.getSyntheticVariableType(),
					(k, value) -> {
						final var list = value != null
							? value
							: new ArrayList<SyntheticVariable>(1);
						list.add(e);
						return list;
					}
				);
			});

		final var metaVariables = synthetics.remove(SyntheticVariableType.META);
		List<SyntheticVariable> metaConstants = null;
		if (metaVariables != null) {
			metaConstants = metaVariables.stream().filter(
				e -> e.getMetaField().equals(SyntheticVariable.MetaField.CONSTANT) && !e.getMetaConstant().isLocalized()
			).collect(Collectors.toList());
			metaVariables.removeAll(metaConstants);
		}

		final var documentModels = variables
			.stream().map(e -> {
				final var firstSegment = e.getSegments()[0];
				final var modelName = firstSegment.getLabel();
				final var cleanedUpModelName = cleanUpModelName(modelName);

				return new EvaluationDocumentModelReference(cleanedUpModelName, modelName, false);
			})
			.collect(Collectors.toCollection(ArrayList::new));

		if (
			metaConstants != null && !metaConstants.isEmpty()
				|| (metaVariables != null && !metaVariables.isEmpty())
				|| documentModels.isEmpty()
		) {
			documentModels.add(EvaluationDocumentModelCompiler.SyntheticModel);
		}

		return ComputationStatement
			.builder()
			.documentModels(documentModels)
			.syntheticVariableMap(synthetics)
			.kernelComputation(kernelComputation)
			.metaConstants(metaConstants == null ? List.of() : metaConstants)
			.metaVariables(metaVariables == null ? List.of() : metaVariables)
			.variables(variables)
			.build();
	}

	public Stream<SyntheticVariable> getSyntheticVariables() {
		return Stream.concat(
			syntheticVariableMap.values().stream().flatMap(Collection::stream),
			Stream.concat(
				metaVariables.stream(),
				metaConstants.stream()
			)
		);
	}

	@EqualsAndHashCode.Include
	public String key() {
		return kernelComputation.getProviderId();
	}

	public EvaluationDocumentModelRequirements getEvaluationDocumentModelRequirements() {
		return new EvaluationDocumentModelRequirements(getDocumentModels().toArray(EvaluationDocumentModelReference[]::new));
	}

	public Optional<Variable> getResultPrefix(){
		return Optional.ofNullable(resultPrefix);
	}
	public void setResultPrefix(@NonNull Variable next) {
		this.resultPrefix = next;
	}

	/*
	 	model name has the rules: Use only letters, digits, hyphens, underscores and periods. Furthermore, the name may only start with a letter or underscore
	 	model group name has the rules: A group name may only contain letters, numbers or underscores. Group names must begin with a letter or an underscore.

	 	That means that just the hyphens and periods needs to be replaced.
	 */
	private static String cleanUpModelName(String modelName) {
		return modelName.replaceAll("[-.]", "_");
	}
}

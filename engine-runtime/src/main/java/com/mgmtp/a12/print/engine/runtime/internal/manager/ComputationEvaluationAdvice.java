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
package com.mgmtp.a12.print.engine.runtime.internal.manager;

import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.synthetics.SyntheticVariable;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.egg.EggNode;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.*;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.visitor.SyntaxTreeRenderer;
import lombok.Builder;
import lombok.Data;
import lombok.NonNull;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public interface ComputationEvaluationAdvice extends Comparable<ComputationEvaluationAdvice> {


	Category evaluationCategory();

	@NonNull String getProviderId();

	Set<String> getProviderIdDependencies();

	ComputationFieldType getComputationFieldType();

	@Override
	default int compareTo(@NonNull ComputationEvaluationAdvice other) {
		return Comparator.comparing(ComputationEvaluationAdvice::evaluationCategory)
						 .thenComparing(e -> e.getProviderIdDependencies().size())
						 .thenComparing(ComputationEvaluationAdvice::getProviderId)
						 .thenComparing(ComputationEvaluationAdvice::getComputationFieldType)
						 .compare(this, other);

	}

	enum Category {
		CONSTANT,
		META_CONSTANT,
		NULL_CHECK,
		NO_VALUE,
		FIELD,
		META_FIELD,
		LOGIC_EXPRESSION,
		ARITHMETIC_EXPRESSION,
		COMPARE_EXPRESSION,
		KERNEL_COMPUTATION,
		RESOLVE_PROVIDER,
	}

	@Data
	class ResolveComputationEvaluationProvider implements ComputationEvaluationAdvice {

		public static final String RESOLVE_PROVIDER_PREFIX = "Resolve#";
		@NonNull
		private final EggNode node;
		@NonNull
		private final String providerId;
		@NonNull
		private ComputationFieldType computationFieldType;

		public @NonNull String getProviderId() {
			return RESOLVE_PROVIDER_PREFIX + providerId;
		}

		public String getSourceProviderId() {
			return providerId;
		}

		@Override
		public Category evaluationCategory() {
			return Category.RESOLVE_PROVIDER;
		}

		@Override
		public Set<String> getProviderIdDependencies() {
			return Set.of(providerId);
		}

	}

	@Data
	class MetaFieldValue implements ComputationEvaluationAdvice {

		@NonNull
		private final String providerId;

		@NonNull
		private final SyntheticVariable syntheticField;

		@Override
		public Category evaluationCategory() {
			return Category.META_FIELD;
		}

		@Override
		public Set<String> getProviderIdDependencies() {
			return Set.of();
		}

		@Override
		public ComputationFieldType getComputationFieldType() {
			return syntheticField.getComputationFieldType();
		}

	}

	@Data
	class MetaConstantValue implements ComputationEvaluationAdvice {

		@NonNull
		private final String providerId;

		@NonNull
		private final SyntheticVariable syntheticField;

		@Override
		public Category evaluationCategory() {
			return Category.META_CONSTANT;
		}

		@Override
		public Set<String> getProviderIdDependencies() {
			return Set.of();
		}

		@Override
		public ComputationFieldType getComputationFieldType() {
			return syntheticField.getComputationFieldType();
		}

	}

	@Data
	class FieldValue implements ComputationEvaluationAdvice {

		@NonNull
		private final String providerId;

		@NonNull
		private final Variable variable;
		@NonNull
		private final ComputationFieldType computationFieldType;

		@Override
		public Category evaluationCategory() {
			return Category.FIELD;
		}

		@Override
		public Set<String> getProviderIdDependencies() {
			return Set.of();
		}

	}

	@Data
	class NoValue implements ComputationEvaluationAdvice {

		public static final NoValue Instance = new NoValue();

		@Override
		public Category evaluationCategory() {
			return Category.NO_VALUE;
		}

		@Override
		public @NonNull String getProviderId() {
			return SyntaxTreeRenderer.getPath(false, SyntheticVariable.NotFilled.getSegments());
		}

		@Override
		public Set<String> getProviderIdDependencies() {
			return Set.of();
		}

		@Override
		public ComputationFieldType getComputationFieldType() {
			return ComputationFieldType.STRING;
		}
	}

	@Data
	class ConstantValue implements ComputationEvaluationAdvice {

		@NonNull
		private final String providerId;

		@NonNull
		private final Constant literalValue;
		@NonNull
		private final ComputationFieldType computationFieldType;

		@Override
		public Category evaluationCategory() {
			return Category.CONSTANT;
		}

		@Override
		public Set<String> getProviderIdDependencies() {
			return Set.of();
		}
	}

	@Data
	@Builder
	class NullCheck implements ComputationEvaluationAdvice {

		@NonNull
		private final String providerId;
		@NonNull
		private final String targetProviderId;

		private boolean checkIfValueIsNull;

		@Override
		public Category evaluationCategory() {
			return Category.NULL_CHECK;
		}

		@Override
		public Set<String> getProviderIdDependencies() {
			return Set.of(targetProviderId);
		}

		@Override
		public ComputationFieldType getComputationFieldType() {
			return ComputationFieldType.BOOLEAN;
		}
	}

	@Data
	@Builder(toBuilder = true)
	class KernelComputation implements ComputationEvaluationAdvice {

		@NonNull
		private final String providerId;
		@NonNull
		private final SyntaxTreeElement syntaxTreeElement;
		@NonNull
		private final ComputationFieldType computationFieldType;

		@Override
		public Set<String> getProviderIdDependencies() {
			return Set.of();
		}

		@Override
		public Category evaluationCategory() {
			return Category.KERNEL_COMPUTATION;
		}
	}

	@Data
	@Builder(toBuilder = true)
	class JavaFunctionalExpression implements ComputationEvaluationAdvice {

		@NonNull
		private final List<String> branchProviderIds;
		@NonNull
		private final Category category;
		@NonNull
		private final ComputationFieldType computationFieldType;
		@NonNull
		private final String providerId;

		private Arithmetic.Operator arithmeticOperator;
		private Compare.Operator compareOperator;
		private Logic.Operator logicOperator;

		@Override
		public Set<String> getProviderIdDependencies() {
			assert !branchProviderIds.isEmpty();
			return branchProviderIds.stream().collect(Collectors.toUnmodifiableSet());
		}

		@Override
		public Category evaluationCategory() {
			return category;
		}
	}

}

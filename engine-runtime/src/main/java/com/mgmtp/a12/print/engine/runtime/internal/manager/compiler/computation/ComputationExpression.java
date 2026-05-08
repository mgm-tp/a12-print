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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.computation;

import com.mgmtp.a12.kernel.md.document.api.IEntityInstance;
import com.mgmtp.a12.kernel.md.model.api.IElement;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.engine.ValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntime;
import lombok.Data;
import lombok.NonNull;

import java.util.*;
import java.util.function.BiPredicate;
import java.util.function.IntPredicate;

public interface ComputationExpression {


	static @NonNull <A extends Object, B extends Object> ComputationExpression binaryPredicate(
		Class<? extends A> a,
		Class<? extends B> b,
		@NonNull ComputationExpression left,
		@NonNull ComputationExpression right,
		@NonNull BiPredicate<A, B> map
	) {
		return (parameters, job, runtime) -> Optional.of(
			map.test(
				a.cast( left.call(parameters, job, runtime).orElse(null)),
				b.cast( right.call(parameters, job, runtime).orElse(null))
			)
		);
	}

	static @NonNull <A> ComputationExpression compare(
		Class<? extends A> aClass,
		@NonNull ComputationExpression left,
		@NonNull ComputationExpression right,
		@NonNull Comparator<A> comparator,
		@NonNull IntPredicate evaluator
	) {
		return binaryPredicate(aClass, aClass, left, right, (A a, A b) -> evaluator.test(comparator.compare(a, b)));
	}

	Optional<Object> call(@NonNull Parameters parameters, @NonNull PrintJob job, @NonNull InternalCorePrintEngineRuntime internalCorePrintEngineRuntime);

	default ComputationExpression notNullOrElse(final @NonNull ComputationExpression other) {
		return (parameters, job, runtime) -> {
			final var result = call(parameters, job, runtime);
			if (result.isPresent()) {
				return result;
			}
			return other.call(parameters, job, runtime);
		};
	}

	default ComputationExpression ifThen(final @NonNull ComputationExpression operation) {
		return (parameters, job, runtime) -> {
			final var result = call(parameters, job, runtime);
			if (result.filter(e -> Objects.equals(true, e)).isPresent()) {
				return operation.call(parameters, job, runtime);
			}
			return Optional.empty();
		};
	}

	@Data
	class Parameters implements ValueDependency<Object> {
		private static final String ELEMENT_PARAMETER_KEY = "@Runtime/Element";
		private static final String PRINT_DOCUMENT_CONTEXT_PARAMETER_KEY = "@Runtime/Print/Document/Context";
		private static final String ENTITY_INSTANCE_PARAMETER_KEY = "@Runtime/EntityInstance";
		public static final Parameters None = new Parameters();

		private final Map<String, Object> values = new HashMap<>();

		public static boolean isRuntimeParameter(String key) {
			return key.startsWith("@Runtime");
		}

		public Parameters withEntityInstance(IEntityInstance entityInstance) {
			values.put(ENTITY_INSTANCE_PARAMETER_KEY, entityInstance);
			return this;
		}

		public Parameters withElement(IElement element) {
			values.put(ELEMENT_PARAMETER_KEY, element);
			return this;
		}

		public Parameters withPrintDocumentContext(PrintDocumentContext printDocumentContext) {
			values.put(PRINT_DOCUMENT_CONTEXT_PARAMETER_KEY, printDocumentContext);
			return this;
		}

		public Optional<IEntityInstance> getEntityInstance() {
			return Optional.ofNullable((IEntityInstance) values.get(ENTITY_INSTANCE_PARAMETER_KEY));
		}

		public Optional<IElement> getElement() {
			return Optional.ofNullable((IElement) values.get(ELEMENT_PARAMETER_KEY));
		}

		public Optional<PrintDocumentContext> getPrintDocumentContext() {
			return Optional.ofNullable((PrintDocumentContext) values.get(PRINT_DOCUMENT_CONTEXT_PARAMETER_KEY));
		}
	}

}

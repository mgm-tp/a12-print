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

import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.ComputationFieldType;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;

import java.util.Optional;

@Slf4j
public class ComputationExpressionTrace implements TypedComputationExpression {

	@NonNull
	private final TypedComputationExpression typedComputationExpression;

	private ComputationExpressionTrace(@NonNull TypedComputationExpression typedComputationExpression) {
		this.typedComputationExpression = typedComputationExpression;
	}

	public static TypedComputationExpression trace(TypedComputationExpression expression) {
		if(expression instanceof ComputationExpressionTrace) {
			return expression;
		} else {
			return new ComputationExpressionTrace(expression);
		}
	}

	@Override
	public Optional<Object> call(@NonNull Parameters parameters, @NonNull PrintJob job, @NonNull InternalCorePrintEngineRuntime internalCorePrintEngineRuntime) {
		final var result = typedComputationExpression.call(parameters, job, internalCorePrintEngineRuntime);
		if (log.isDebugEnabled()) {
			result.ifPresentOrElse(v -> {
					log.debug("{} was evaluated to `{}`", getProviderId(), v);
				},
				() -> {
					log.debug("{} was evaluated to null or empty", getProviderId());
				}
			);
		}
		return result;
	}

	@Override
	public @NonNull String getProviderId() {
		return typedComputationExpression.getProviderId();
	}

	@Override
	public @NonNull ComputationFieldType getComputationFieldType() {
		return typedComputationExpression.getComputationFieldType();
	}
}

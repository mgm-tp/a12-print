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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider;

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.computation.ComputationExpressionTrace;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.computation.TypedComputationExpression;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;


@Slf4j
public class TypedComputationExpressionCache {

	@NonNull
	private final Map<String, TypedComputationExpression> strategies = new HashMap<>();

	public synchronized void addStrategy(@NonNull String strategyKey, @NonNull TypedComputationExpression strategy) {
		log.debug("add: {}", strategyKey);
		if(log.isDebugEnabled()) {
			strategies.put(strategyKey, ComputationExpressionTrace.trace(strategy));
		} else {
			strategies.put(strategyKey, strategy);
		}

	}

	public synchronized @NonNull TypedComputationExpression get(String operationProviderId) {
		final var strategy = strategies.get(operationProviderId);
		if (strategy == null) {
			throw new PrintException("missing ComputationEvaluationStrategy for provider: " + operationProviderId);
		}
		return strategy;
	}
}

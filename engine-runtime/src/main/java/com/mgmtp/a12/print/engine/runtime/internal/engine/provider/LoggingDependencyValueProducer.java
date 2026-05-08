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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.PrintResult;
import com.mgmtp.a12.print.engine.runtime.PrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.GenericDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.ValueDependency;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.time.StopWatch;

/**
 * Provider that wrap another provider and log if a provider is called, also the time it takes to execute the provider.
 **/
@RequiredArgsConstructor
@Slf4j
public class LoggingDependencyValueProducer<
	TValue,
	TDependency extends ValueDependency<TValue>,
	TJob extends PrintJob,
	TEngine extends PrintEngine<? extends PrintResult>,
	TRuntime extends PrintEngineRuntime
	>
	implements
	GenericDependencyValueProvider<TValue, TDependency, TJob, TEngine, TRuntime> {

	private final GenericDependencyValueProvider<TValue, TDependency, TJob, TEngine, TRuntime> valueProvider;

	@Override
	public ValueFactory<TValue> produce(TDependency dependency, TJob job, TEngine engine, TRuntime runtime) {
		final StopWatch stopWatch = new StopWatch();
		stopWatch.start();
		try {
			return valueProvider.produce(dependency, job, engine, runtime);
		} finally {
			stopWatch.stop();
			log.trace("Call provider {} took {} with selector {}", valueProvider.getClass().getSimpleName(),
				stopWatch.formatTime(), dependency);
		}
	}
}

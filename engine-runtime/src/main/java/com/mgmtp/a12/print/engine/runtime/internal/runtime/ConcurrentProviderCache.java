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
package com.mgmtp.a12.print.engine.runtime.internal.runtime;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.PrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.CacheableGenericDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.ValueDependency;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;

@RequiredArgsConstructor
public class ConcurrentProviderCache<Job extends PrintJob, Engine extends PrintEngine<?>, Runtime extends PrintEngineRuntime> implements IProviderCache<Object, ValueDependency<Object>, Job, Engine, Runtime> {
	private final ConcurrentHashMap<ValueDependency<Object>, Future<Object>> cache = new ConcurrentHashMap<>();
	@NonNull
	private final ExecutorService service;
	@NonNull
	private final CacheableGenericDependencyValueProvider<Object, ValueDependency<Object>, ? super Job, ? super Engine, ? super Runtime> provider;

	@Override
	public synchronized ValueFactory<Object> produce(ValueDependency<Object> dependency, Job job, Engine engine, Runtime runtime) {
		return awaitTask(
			cache.computeIfAbsent(
				dependency,
				d -> service.submit(() -> provider.produce(d, job, engine, runtime).get())
			)
		);
	}

	@Override
	public CacheableGenericDependencyValueProvider<Object, ValueDependency<Object>, Job, Engine, Runtime> asCacheable() {
		throw new IllegalStateException();
	}

	protected PrintException wrapPrintException(Exception e) {
		return new PrintException("Task awaiting was interrupted by: ", e);
	}

	private ValueFactory<Object> awaitTask(Future<Object> future) {
		return () -> {
			try {
				return future.get();
			} catch (PrintException e) {
				throw e;
			} catch (Exception e) {
				throw wrapPrintException(e);
			}
		};
	}


}

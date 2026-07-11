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
package com.mgmtp.a12.print.engine.runtime;

import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;

import java.util.Optional;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.ForkJoinWorkerThread;
import com.mgmtp.a12.model.utils.OnlyForUsage;

/**
 * Used to get default instance of {@link ExecutorService}.
 */
@OnlyForUsage
public class ExecutorServiceFactory {

	/**
	 * Get default implementation of {@link ExecutorService}.
	 *
	 * @param parallelism the parallelism level. For default value, use Runtime.availableProcessors.
	 * @param threadName the name for this thread
	 * @return ExecutorService for running {@link java.util.concurrent.ForkJoinTask}s
	 */
	public static ExecutorService getInstance(int parallelism, String threadName) {
		return new ForkJoinPool(
			parallelism,
			p -> {
				final ForkJoinWorkerThread worker = new CustomPrintWorkerThreadFactory().newThread(p);
				worker.setName(Optional.ofNullable(threadName).orElse(Constants.DEFAULT_THREAD_NAME) + Constants.HYPHEN + worker.getPoolIndex());
				return worker;
			},
			null,
			true
		);
	}

	/**
	 * Get default implementation of {@link ExecutorService}.
	 *
	 * @return ExecutorService for running {@link java.util.concurrent.ForkJoinTask}s
	 */
	public static ExecutorService getInstance() {
		return getInstance(Runtime.getRuntime().availableProcessors(), Constants.DEFAULT_THREAD_NAME);
	}

	private static class CustomPrintWorkerThreadFactory implements ForkJoinPool.ForkJoinWorkerThreadFactory {
		@Override
		public final ForkJoinWorkerThread newThread(final ForkJoinPool pool) {
			return new CustomPrintWorkerThread(pool);
		}

	}

	private static class CustomPrintWorkerThread extends ForkJoinWorkerThread {

		private CustomPrintWorkerThread(final ForkJoinPool pool) {
			super(pool);
			setContextClassLoader(CustomPrintWorkerThreadFactory.class.getClassLoader());
		}
	}

}

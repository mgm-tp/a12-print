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
package com.mgmtp.a12.print.shell.internal.service;

import com.mgmtp.a12.print.shell.internal.exceptions.PrintShellException;
import lombok.Data;
import lombok.NonNull;

import java.io.PrintStream;
import java.text.DecimalFormat;
import java.util.Objects;
import java.util.concurrent.Callable;
import java.util.concurrent.TimeUnit;

public class ProfilingService {

	@NonNull
	private final Runtime runtime;

	public ProfilingService() {
		this.runtime = Runtime.getRuntime();
	}

	public static <T> ExecutionTime<T> executionTime(Callable<T> exec) {

		long startTime = System.nanoTime();
		try {
			final var result = exec.call();
			long endTime = System.nanoTime();
			final var ms = TimeUnit.MILLISECONDS.convert(endTime - startTime, TimeUnit.NANOSECONDS);
			return new ExecutionTime<>(ms, result);
		} catch (Exception e) {
			throw new PrintShellException(e);
		}

	}

	public static String readableFileSize(long size) {
		if (size <= 0) return "0";
		final String[] units = new String[]{"B", "kB", "MB", "GB", "TB"};
		int digitGroups = (int) (Math.log10(size) / Math.log10(1024));
		return new DecimalFormat("#,##0.#").format(size / Math.pow(1024, digitGroups)) + " " + units[digitGroups];
	}

	public long getMaxMemory() {
		return runtime.maxMemory();
	}

	public long getUsedMemory() {
		return getTotalMemory() - getFreeMemory();
	}

	public long getTotalMemory() {
		return runtime.totalMemory();
	}

	public long getFreeMemory() {
		return runtime.freeMemory();
	}

	public <T> T appendSnapshotWithExecutionTime(String prefix, PrintStream stream, Callable<T> action)  {
		final var execTime = executionTime(action);
		try {
			appendSnapshot(prefix, execTime.getTimeInMs(), stream);
		} catch (Exception e) {
			throw new PrintShellException(e);
		}
		return execTime.getResult();
	}

	public synchronized void appendSnapshot(String prefix, Long duration, PrintStream stream) {

		stream.printf("Snapshot:     %1$15s\t", prefix);
		stream.printf("Total Memory: %1$" + 15 + "s\t", readableFileSize(getTotalMemory()));
		stream.printf("Free Memory:  %1$" + 15 + "s\t", readableFileSize(getFreeMemory()));
		stream.printf("Max Memory:   %1$" + 15 + "s\t", readableFileSize(getMaxMemory()));
		stream.printf("Used Memory:  %1$" + 15 + "s\t", readableFileSize(getUsedMemory()));
		stream.printf("Execution  :  %1$" + 15 + "s ms\t", Objects.requireNonNullElse(duration, "--"));

		stream.println();

	}

	public void appendResultInfo(String text, String value, PrintStream stream) {
		stream.printf("%s: %s", text, value);
		stream.println();
	}

	public void gcPressure() {
		runtime.gc();
	}

	@Data
	private static class ExecutionTime<T> {
		public final long timeInMs;
		@NonNull
		public final T result;
	}

}

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
package com.mgmtp.a12.print.shell.internal.command.utils;

import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.mgmtp.a12.print.shell.internal.ApplicationShell;

import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.awaitility.Awaitility.await;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.slf4j.Logger.ROOT_LOGGER_NAME;

public class ShellUtil {

	public static void runShellCommand(
		String[] args,
		String expectedResult
	) {
		runShellCommand(args, List.of(expectedResult), 0);
	}

	public static void runShellCommand(
		String[] args,
		String expectedResult,
		int expectedExitCode
	) {
		runShellCommand(args, List.of(expectedResult), expectedExitCode);
	}

	public static void runShellCommand(String[] args, List<String> expectedResults, int expectedExitCode) {
		final var loggerContext = (LoggerContext) org.slf4j.LoggerFactory.getILoggerFactory();
		final var logger = loggerContext.getLogger(ROOT_LOGGER_NAME);
		final var listAppender = new ListAppender<ILoggingEvent>();
		listAppender.start();
		logger.addAppender(listAppender);

		final var cmd = ApplicationShell.getCommandLine();
		final var exitCode = cmd.execute(args);

		assertEquals(expectedExitCode, exitCode);

		if (!expectedResults.isEmpty()) {
			await().atMost(20, TimeUnit.SECONDS).untilAsserted(() -> {
				final var output = listAppender.list.stream()
					.map(ILoggingEvent::getFormattedMessage)
					.reduce("", (a, b) -> a + b);
				for (String text : expectedResults) {
					assertTrue(output.contains(text));
				}
			});
		}

		assertEquals(expectedExitCode, exitCode);

		logger.detachAppender(listAppender);
		listAppender.stop();
	}
}

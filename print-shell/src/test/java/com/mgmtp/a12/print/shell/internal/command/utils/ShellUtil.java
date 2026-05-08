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
import org.jline.terminal.Terminal;
import org.springframework.shell.test.ShellTestClient;

import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.awaitility.Awaitility.await;
import static org.slf4j.Logger.ROOT_LOGGER_NAME;

public class ShellUtil {

	public static void runShellCommand(
		Terminal terminal,
		ShellTestClient client,
		String command,
		String expectedResult
	) {
		runShellCommand(terminal, client, command, List.of(expectedResult));
	}

	public static void runShellCommand(
		Terminal terminal,
		ShellTestClient client,
		String command,
		List<String> expectedResults
	) {

		TerminalAppender terminalAppender = new TerminalAppender(terminal);

		LoggerContext loggerContext = (LoggerContext) org.slf4j.LoggerFactory.getILoggerFactory();
		loggerContext.getLogger(ROOT_LOGGER_NAME).addAppender(terminalAppender);

		ShellTestClient.InteractiveShellSession session = client
			.interactive()
			.run();

		session.write(session.writeSequence().text(command).carriageReturn().build());

		await().atMost(20, TimeUnit.SECONDS).untilAsserted(() -> {
			PrintShellAssertions.assertThat(session.screen()).containsTexts(expectedResults);
		});

		terminalAppender.stop();
	}
}

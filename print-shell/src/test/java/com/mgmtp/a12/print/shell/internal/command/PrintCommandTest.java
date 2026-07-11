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
package com.mgmtp.a12.print.shell.internal.command;

import com.mgmtp.a12.print.shell.internal.PrintShellConstants;
import com.mgmtp.a12.print.shell.internal.command.utils.ShellUtil;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PrintCommandTest {

	private static final String PRINT_WORKSPACE_PATH = Objects.requireNonNull(PrintCommandTest.class.getResource("/print")).getPath();
	private static final String PRINT_ALL_WORKSPACE_PATH = Objects.requireNonNull(PrintCommandTest.class.getResource("/printAll")).getPath();

	@Test
	void printTestWithoutDocument() {
		String printModelId = "PrintWithoutDocumentModel";
		printSuccessfully(
			new String[]{"print", "-w", PRINT_WORKSPACE_PATH, "-p", printModelId}
		);

		List<String> files = getFiles(PRINT_WORKSPACE_PATH);

		// pdf file is present
		assertTrue(files.stream().anyMatch(file -> file.equals(String.format("%s.pdf", printModelId))));
	}

	@Test
	void printTestWithLogFile() {
		String printModelId = "PrintWithShell";
		String documentId = "TestDocument";
		printSuccessfully(
			new String[]{
				"print",
				"-w", PRINT_WORKSPACE_PATH,
				"-p", printModelId,
				"-d", documentId,
				"-l", "DEBUG",
				"-f"
			}
		);

		List<String> files = getFiles(PRINT_WORKSPACE_PATH);
		// pdf file is present
		assertTrue(files.stream().anyMatch(file -> file.equals(String.format("%s-%s.pdf", printModelId, documentId))));

		// log file is present
		assertTrue(files.stream().anyMatch(file -> file.equals(String.format("%s-%s.log", printModelId, documentId))));
	}

	@Test
	void printAllTest() {
		ShellUtil.runShellCommand(
			new String[]{"print-all", "-w", PRINT_ALL_WORKSPACE_PATH},
			List.of("PrintWithShell-TestDocument.pdf", "PrintWithShell-SecondTestDocument.pdf"),
			0
		);

		List<String> files = getFiles(PRINT_ALL_WORKSPACE_PATH);
		assertTrue(files.stream().anyMatch(file -> file.equals(
			String.format("%s-%s.pdf", "PrintWithShell", "SecondTestDocument"))
		));
		assertTrue(files.stream().anyMatch(file -> file.equals(
			String.format("%s-%s.pdf", "PrintWithShell", "TestDocument"))
		));
	}

	@Test
	void printLocaleTimeZoneTest() {
		String printModelId = "PrintWithShell";
		String documentId = "TestDocument";
		assertThatCode(() -> printSuccessfully(
			new String[] {"print", "-w", PRINT_WORKSPACE_PATH, "-p", printModelId, "-d", documentId, "-t", "GMT", "--locale", "en"})
		).doesNotThrowAnyException();
	}

	private void printSuccessfully(String[] command) {
		ShellUtil.runShellCommand(
			command,
			"Save PDF result to"
		);
	}

	private List<String> getFiles(String workspacePath) {
		File folder = new File(workspacePath + "/" + PrintShellConstants.RESULT_DIRECTORY);
		List<String> files = new ArrayList<>();

		Arrays.stream(Objects.requireNonNull(folder.listFiles())).forEach(file -> {
			if (file.isFile()) {
				files.add(file.getName());
			}
		});

		return files;
	}
}

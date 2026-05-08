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

import com.mgmtp.a12.print.shell.internal.command.utils.ShellUtil;
import com.mgmtp.a12.print.shell.internal.command.utils.TestConfiguration;
import com.mgmtp.a12.print.shell.internal.configuration.PrintShellConfiguration;
import com.mgmtp.a12.print.shell.internal.service.*;
import com.mgmtp.a12.print.shell.internal.workspace.WorkspaceBuilder;
import com.mgmtp.a12.print.shell.internal.workspace.WorkspaceVisitor;
import com.mgmtp.a12.print.workspace.internal.handler.FileHandler;
import org.jline.terminal.Terminal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.shell.test.ShellTestClient;
import org.springframework.shell.test.autoconfigure.ShellTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.util.FileSystemUtils;

import java.io.IOException;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThatCode;

@ShellTest(terminalWidth = 200)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@Import({
	WorkspaceBuilder.class,
	WorkspaceVisitor.class,
	FileHandler.class,
	PrintShellConfiguration.class,
	MigrationService.class,
	PdfComparisonService.class,
	PrintService.class,
	ProfilingService.class,
	PrintDocumentService.class,
	TestConfiguration.class
})
public class MigrationCommandTest {

	@Autowired
	ShellTestClient client;

	@Autowired
	PrintShellConfiguration printShellConfiguration;

	@Autowired
	Terminal terminal;
	private static final URL MIGRATION_WORKSPACE_URL = Objects.requireNonNull(MigrationCommandTest.class.getResource("/migration"));

	@BeforeEach
	void cleanResultFolders() throws IOException, URISyntaxException {
		Path migrationDir = Paths.get(MIGRATION_WORKSPACE_URL.toURI());
		try (Stream<Path> walk = Files.walk(migrationDir)) {
			walk.filter(path -> Files.isDirectory(path)
					&& path.getFileName().toString().equals(printShellConfiguration.resultDirectory))
				.forEach(p -> FileSystemUtils.deleteRecursively(p.toFile()));
		}
	}

    @Test
	void migrationTest() {
		assertThatCode(() -> ShellUtil.runShellCommand(
				terminal,
				client,
				String.format("migrate -w %s -o %b", MIGRATION_WORKSPACE_URL.getPath(), false),
				List.of("Updated file 'PrintModelToMigrate'", "Updated file 'PrintModelWithMigrationAnnotation'", "Updated file 'PrintModelWithLastShellVersion'", "Skip Migration of PrintModelForTypescriptMigration")
			)
		).doesNotThrowAnyException();
	}
}

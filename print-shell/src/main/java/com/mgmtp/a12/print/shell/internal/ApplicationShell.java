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
package com.mgmtp.a12.print.shell.internal;

import com.mgmtp.a12.kernel.md.model.api.IDocumentModel;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.ExecutorServiceFactory;
import com.mgmtp.a12.print.engine.runtime.PrintJobManager;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.shell.internal.commands.*;
import com.mgmtp.a12.print.shell.internal.commands.jmh.JmhCommand;
import com.mgmtp.a12.print.shell.internal.service.PdfComparisonService;
import com.mgmtp.a12.print.shell.internal.service.PrintDocumentService;
import com.mgmtp.a12.print.shell.internal.service.PrintService;
import com.mgmtp.a12.print.shell.internal.service.ProfilingService;
import com.mgmtp.a12.print.shell.internal.workspace.WorkspaceBuilder;
import com.mgmtp.a12.print.shell.internal.workspace.WorkspaceVisitor;
import com.mgmtp.a12.print.workspace.internal.handler.FileHandler;
import com.mgmtp.a12.print.workspace.internal.handler.WorkspaceHandler;
import org.jline.reader.LineReaderBuilder;
import org.jline.reader.impl.history.DefaultHistory;
import org.jline.terminal.Terminal;
import org.jline.terminal.TerminalBuilder;
import picocli.CommandLine;
import picocli.shell.jline3.PicocliJLineCompleter;

import java.io.IOException;
import java.io.PrintWriter;

public class ApplicationShell {

	private static final WorkspaceHandler workspaceHandler = new WorkspaceHandler();

	public static void main(String[] args) throws IOException {
		final var cmd = getCommandLine();

		if (args.length > 0) {
			int exitCode = cmd.execute(args);
			System.exit(exitCode);
		}

		final var terminal = TerminalBuilder.builder()
			.system(true)
			.build();
		printBanner(terminal.writer());
		startShell(cmd, terminal);
	}

	public static CommandLine getCommandLine() {
		final var cmd = new CommandLine(new RootCommand());
		createSubCommands(cmd);

		return cmd;
	}

	private static void createSubCommands(CommandLine cmd) {
		final var printThreadPool = ExecutorServiceFactory.getInstance();
		// tag::PrintJobManagerApi[]
		final var printJobManagerApi = new PrintJobManager.PrintJobManagerApi() {
			@Override
			public String loadPrintModel(String id) {
				return findPrintModelContent(id); // <1>
			}

			@Override
			public IDocumentModel loadDocumentModel(String id) {
				return findDocumentModelById(id); // <2>
			}
		};
		// end::PrintJobManagerApi[]
		final var fileHandler = new FileHandler(workspaceHandler, eventMessage -> {
			// There is no event handling needed for the workspace in the shell
		});
		final var printService = new PrintService(
			workspaceHandler,
			printThreadPool,
			printJobManagerApi,
			fileHandler
		);

		final var workspaceVisitor = new WorkspaceVisitor(fileHandler);
		final var workspaceBuilder = new WorkspaceBuilder(workspaceVisitor);
		final var printDocumentService = new PrintDocumentService(workspaceHandler);

		cmd.addSubcommand(new PrintCommand(
			printService,
			printThreadPool,
			workspaceHandler,
			workspaceBuilder,
			printDocumentService
		));
		cmd.addSubcommand(new PrintAllCommand(
			printService,
			printThreadPool,
			workspaceHandler,
			workspaceBuilder
		));

		final var pdfComparisonService = new PdfComparisonService();
		cmd.addSubcommand(new PdfCompareCommand(pdfComparisonService));
		cmd.addSubcommand(new PdfCompareAllCommand(pdfComparisonService, workspaceBuilder));

		final var profilingService = new ProfilingService();
		cmd.addSubcommand(new ProfilingCommand(
			printService,
			printThreadPool,
			printJobManagerApi,
			workspaceHandler,
			workspaceBuilder,
			printDocumentService,
			profilingService
		));

		cmd.addSubcommand(new JmhCommand(
			workspaceBuilder,
			workspaceHandler,
			printJobManagerApi,
			printDocumentService
		));
	}

	private static String findPrintModelContent(String id) {
		return workspaceHandler
			.getModelFileElementsByType(Constants.PRINT_MODEL_TYPE).stream()
			.filter(e -> e.getModelHeader().getId().equals(id))
			.findFirst()
			.map(workspaceHandler::getFileElementContent)
			.orElseThrow(() -> new PrintException(String.format("Unable to locate PrintModel %s", id)));
	}

	private static IDocumentModel findDocumentModelById(String id) {
		return workspaceHandler.getDocumentModelById(id);
	}

	private static void startShell(CommandLine cmd, Terminal terminal) throws IOException {
		final var lineReader = LineReaderBuilder.builder()
				.terminal(terminal)
				.history(new DefaultHistory())
				.completer(new PicocliJLineCompleter(cmd.getCommandSpec()))
				.build();

		while (true) {
			final var line = lineReader.readLine("print-shell:$ ");
			if (line.equalsIgnoreCase("exit") || line.equalsIgnoreCase("quit")) {
				break;
			}

			try {
				final var pl = lineReader.getParser().parse(line, 0);
				final var arguments = pl.words().toArray(new String[0]);
				cmd.execute(arguments);
			} catch (Exception e) {
				terminal.writer().println("Error: " + e.getMessage());
				terminal.flush();
			}
		}

		terminal.close();
	}

	private static void printBanner(PrintWriter printWriter) {
		try (var inputStream = ApplicationShell.class.getResourceAsStream("/banner.txt")) {
			if (inputStream != null) {
				new String(inputStream.readAllBytes()).lines().forEach(printWriter::println);
			} else {
				printWriter.println("Print Shell Application");
			}
		} catch (IOException e) {
			printWriter.println("Print Shell Application");
		}
	}
}

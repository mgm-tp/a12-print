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
package com.mgmtp.a12.print.shell.internal.commands;

import com.mgmtp.a12.kernel.md.document.apiV2.immutable.DocumentV2;
import com.mgmtp.a12.print.engine.api.PdfBoxPrintEngineConfig;
import com.mgmtp.a12.print.engine.runtime.pdfBox.PdfBoxPrintEngine;
import com.mgmtp.a12.print.shell.internal.service.PrintService;
import com.mgmtp.a12.print.shell.internal.workspace.WorkspaceBuilder;
import com.mgmtp.a12.print.workspace.internal.handler.WorkspaceHandler;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import picocli.CommandLine;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutorService;
import java.util.regex.Pattern;
import java.util.stream.Stream;


@Slf4j
@CommandLine.Command(
	name = "print-all",
	description = "Print all print models in the workspace"
)
@RequiredArgsConstructor
public class PrintAllCommand implements Runnable {

	@NonNull
	private final PrintService printService;

	@NonNull
	private final ExecutorService printThreadPool;

	@NonNull
	private final WorkspaceHandler workspaceHandler;

	@NonNull
	private final WorkspaceBuilder workspaceBuilder;

	@CommandLine.Option(
		names = {"--workspace", "-w"},
		description = "Workspace (String): Path to directory, which includes the print model to print. Default: current directory"
	) private String workspacePath = "";

	@CommandLine.Option(
		names = {"--log-level", "-l"},
		description = "Log Level (String): Define the log level the print is running with. Default: INFO"
	) private String logLevel = "INFO";

	@CommandLine.Option(
		names = {"--log-file", "-f"},
		description = "Log File (Boolean): Define if the log will be saved in a file next to the print model. Default: false"
	) private boolean createLogFile = false;

	@CommandLine.Option(
		names = {"--time-zone", "-t"},
		description = "Time Zone (String): Time Zone for the print run. Default: Current Java virtual machine Time Zone"
	) private String timeZone = "";

	@CommandLine.Option(
		names = {"--locale", "-lo"},
		description = "Locale (String): Locale for the print run. Default: de"
	) private String locale = "de";

	@CommandLine.Option(
		names = {"--suffix", "-s"},
		description = "A suffix is attached to the final PDF file name, separated by a '-'"
	) private String suffix = "";

	@CommandLine.Option(
		names = {"--filter"},
		description = "Filter (Regex) for the Print Model id which is checked before evaluation"
	) private String filter = "";

	@Override
	public void run() {
		workspaceBuilder.build(workspacePath);

		final var printEngine = new PdfBoxPrintEngine(
			printThreadPool,
			new PdfBoxPrintEngineConfig(workspaceHandler.getPrintConfig().getAvailableFonts())
		);

		final var modelFileElements = workspaceHandler.getModelFileElementsByType("print");
		modelFileElements.forEach(modelFileElement -> {
			if (filter.isEmpty() || Pattern.compile(filter).asMatchPredicate().test(modelFileElement.getModelHeader().getId())) {
				Map<String, List<String>> possibleDocuments = workspaceHandler.getPossibleDocuments(modelFileElement.getModelHeader().getId());
				Stream<DocumentV2> documents = possibleDocuments.isEmpty()
					? Stream.of((DocumentV2) null)
					: possibleDocuments.values().stream()
					.flatMap(Collection::stream)
					.map(workspaceHandler::getDocument)
					.flatMap(Optional::stream);

				documents.forEach(doc -> printService.print(printEngine, modelFileElement, doc, logLevel, createLogFile, timeZone, locale, suffix));
			} else {
				log.info("The print model {} is skipped because the filter is not matching", modelFileElement.getModelHeader().getId());
			}
		});
	}
}

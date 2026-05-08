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

import com.mgmtp.a12.kernel.md.document.apiV2.immutable.DocumentV2;
import com.mgmtp.a12.print.engine.api.PdfBoxPrintEngineConfig;
import com.mgmtp.a12.print.engine.api.PdfPrintResult;
import com.mgmtp.a12.print.engine.runtime.PrintEngine;
import com.mgmtp.a12.print.engine.runtime.pdf.PdfPrintEngine;
import com.mgmtp.a12.print.engine.runtime.pdfBox.PdfBoxPrintEngine;
import com.mgmtp.a12.print.shell.internal.exceptions.PrintShellException;
import com.mgmtp.a12.print.shell.internal.service.PrintDocumentService;
import com.mgmtp.a12.print.shell.internal.service.PrintService;
import com.mgmtp.a12.print.shell.internal.workspace.WorkspaceBuilder;
import com.mgmtp.a12.print.workspace.internal.elements.ModelFileElement;
import com.mgmtp.a12.print.workspace.internal.handler.WorkspaceHandler;
import lombok.AllArgsConstructor;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.shell.standard.ShellComponent;
import org.springframework.shell.standard.ShellMethod;
import org.springframework.shell.standard.ShellOption;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutorService;
import java.util.regex.Pattern;

@ShellComponent
@AllArgsConstructor
@Slf4j
public class PrintCommand {

	@NonNull
	private final PrintService printService;

	@NonNull
	private final ExecutorService printThreadPool;

	@NonNull
	private final WorkspaceHandler workspaceHandler;

	@NonNull
	private final WorkspaceBuilder workspaceBuilder;

	@NonNull
	private final PrintDocumentService printDocumentService;

	@ShellMethod(value = "Print print model")
	public void print(
		@ShellOption(
			value = {"--print-model-id", "-p"},
			help = "Print Model Id (String): Print model id to print"
		) final String printModelId,
		@ShellOption(
			value = {"--workspace", "-w"},
			help = "Workspace (String): Path to directory, which includes the print model to print. Default: current directory",
			defaultValue = ""
		) final String workspacePath,
		@ShellOption(
			value = {"--document-id", "-d"},
			help = "Document Id (String): The Id of the document to print (e.g. for document DomainDocument-1 the Id is 1). Default: first document in workspace",
			defaultValue = ""
		) final String documentId,
		@ShellOption(
			value = {"--log-level", "-l"},
			help = "Log Level (String): Define the log level the print is running with. Default: INFO",
			defaultValue = "INFO"
		) final String logLevel,
		@ShellOption(
			value = {"--log-file", "-f"},
			help = "Log File (Boolean): Define if the log will be saved in a file next to the print model. Default: false",
			defaultValue = "false"
		) final boolean createLogFile,
		@ShellOption(
			value = {"--time-zone", "-t"},
			help = "Time Zone (String): Time Zone for the print run. Default: Current Java virtual machine Time Zone",
			defaultValue = ""
		) final String timeZone,
		@ShellOption(
			value = {"--locale"},
			help = "Locale (String): Locale for the print run. Default: de",
			defaultValue = "de"
		) final String locale,
		@Deprecated
		@ShellOption(
			value = {"--useExperimentalRendering", "-x"},
			help = "Use the experimental rendering (Boolean): If true, enables experimental rendering. Default: false",
			defaultValue = "false"
		) final boolean useExperimentalRendering,
		@ShellOption(
			value = {"--suffix", "-s"},
			help = "A suffix is attached to the final PDF file name, separated by a '-'",
			defaultValue = ""
		) final String suffix
	) {
		workspaceBuilder.build(workspacePath);

		Optional<ModelFileElement> printModelFileElement = workspaceHandler.getModelFileElement(printModelId);

		if (printModelFileElement.isEmpty()) {
			throw new PrintShellException("The print model with the given print model id is not present.");
		}

		DocumentV2 documentToPrint = printDocumentService.getDocumentToPrint(printModelId, documentId);

		final var printEngine = setupPrintEngine(useExperimentalRendering);

		printService.print(printEngine, printModelFileElement.get(), documentToPrint, logLevel, createLogFile, timeZone, locale, useExperimentalRendering, suffix);
	}

	@ShellMethod(value = "Print all print models in workspace")
	public void printAll(
		@ShellOption(
			value = {"--workspace", "-w"},
			help = "Workspace (String): Path to directory, which includes the print model to print. Default: current directory",
			defaultValue = ""
		) final String workspacePath,
		@ShellOption(
			value = {"--log-level", "-l"},
			help = "Log Level (String): Define the log level the print is running with. Default: INFO",
			defaultValue = "INFO"
		) final String logLevel,
		@ShellOption(
			value = {"--log-file", "-f"},
			help = "Log File (Boolean): Define if the log will be saved in a file next to the print model. Default: false",
			defaultValue = "false"
		) final boolean createLogFile,
		@ShellOption(
			value = {"--time-zone", "-t"},
			help = "Time Zone (String): Time Zone for the print run. Default: Current Java virtual machine Time Zone",
			defaultValue = ""
		) final String timeZone,
		@ShellOption(
			value = {"--locale", "-lo"},
			help = "Locale (String): Locale for the print run. Default: de",
			defaultValue = "de"
		) final String locale,
		@Deprecated
		@ShellOption(
			value = {"--useExperimentalRendering", "-x"},
			help = "Use the experimental rendering (Boolean): If true, enables experimental rendering. Default: false",
			defaultValue = "false"
		) final boolean useExperimentalRendering,
		@ShellOption(
			value = {"--suffix", "-s"},
			help = "A suffix is attached to the final PDF file name, separated by a '-'",
			defaultValue = ""
		) final String suffix,
		@ShellOption(
			value = {"--filter"},
			help = "Filter (Regex) for the Print Model id which is checked before evaluation",
			defaultValue = ""
		) final String filter
	) {
		workspaceBuilder.build(workspacePath);

		final var printEngine = setupPrintEngine(useExperimentalRendering);

		final var modelFileElements = workspaceHandler.getModelFileElementsByType("print");
		modelFileElements.forEach(modelFileElement -> {
			if (filter.isEmpty() || Pattern.compile(filter).asMatchPredicate().test(modelFileElement.getModelHeader().getId())) {
				Map<String, List<String>> possibleDocuments = workspaceHandler.getPossibleDocuments(modelFileElement.getModelHeader().getId());
				possibleDocuments.values().stream().flatMap(Collection::stream).toList().forEach(documentId -> {
					Optional<DocumentV2> documentToPrint = workspaceHandler.getDocument(documentId);
					documentToPrint.ifPresent(document ->
						printService.print(printEngine, modelFileElement, document, logLevel, createLogFile, timeZone, locale, useExperimentalRendering, suffix)
					);
				});
			} else {
				log.info("The print model {} is skipped because the filter is not matching", modelFileElement.getModelHeader().getId());
			}
		});
	}

	private PrintEngine<PdfPrintResult> setupPrintEngine(boolean useExperimentalRendering) {
		return useExperimentalRendering
			? new PdfBoxPrintEngine(printThreadPool, new PdfBoxPrintEngineConfig(workspaceHandler.getPrintConfig().getAvailableFonts()))
			: new PdfPrintEngine(printThreadPool, workspaceHandler.getPrintConfig());
	}
}

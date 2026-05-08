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
package com.mgmtp.a12.print.shell.internal.command.jmh;

import com.mgmtp.a12.kernel.md.model.api.IDocumentModel;
import com.mgmtp.a12.print.engine.api.PdfBoxPrintEngineConfig;
import com.mgmtp.a12.print.engine.api.PrintJobConfig;
import com.mgmtp.a12.print.engine.runtime.ExecutorServiceFactory;
import com.mgmtp.a12.print.engine.runtime.KernelDocumentProvider;
import com.mgmtp.a12.print.engine.runtime.KernelDocumentV2Provider;
import com.mgmtp.a12.print.engine.runtime.PrintJobManager;
import com.mgmtp.a12.print.engine.runtime.pdf.PdfPrintEngine;
import com.mgmtp.a12.print.engine.runtime.pdfBox.PdfBoxPrintEngine;
import com.mgmtp.a12.print.shell.internal.exceptions.PrintShellException;
import com.mgmtp.a12.print.shell.internal.service.PrintDocumentService;
import com.mgmtp.a12.print.shell.internal.workspace.WorkspaceBuilder;
import com.mgmtp.a12.print.workspace.internal.handler.WorkspaceHandler;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.openjdk.jmh.annotations.Mode;
import org.openjdk.jmh.results.format.ResultFormatType;
import org.openjdk.jmh.runner.Runner;
import org.openjdk.jmh.runner.RunnerException;
import org.openjdk.jmh.runner.options.OptionsBuilder;
import org.openjdk.jmh.runner.options.VerboseMode;
import org.openjdk.jmh.runner.options.WarmupMode;
import org.springframework.shell.standard.ShellComponent;
import org.springframework.shell.standard.ShellMethod;
import org.springframework.shell.standard.ShellOption;

import java.nio.file.Path;
import java.util.HashMap;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

@ShellComponent
@AllArgsConstructor
@Slf4j
public class JmhCommand {

	private final WorkspaceBuilder workspaceBuilder;
	private final WorkspaceHandler workspaceHandler;

	private final PrintJobManager.PrintJobManagerApi printJobManagerApi;
	private final PrintDocumentService printDocumentService;

	@ShellMethod(value = "jmh for Model")
	public void jmh(
		@ShellOption(
			value = {"--warmup"},
			defaultValue = "5",
			help = "Warmup Iterations(u-int): The number of executions that should be performed before the actual measurement."
		) final int warmupIterations,
		@ShellOption(
			value = {"--iterations"},
			defaultValue = "100",
			help = "Iterations(u-int): The number of executions that should be performed for the actual measurement."
		) final int measurementIterations,
		@ShellOption(
			value = {"--out", "-o"},
			defaultValue = "",
			help = "Output Folder (String): Path to directory, where output Files will be saved"
		) final String outputFile,
		@ShellOption(
			value = {"--workspace", "-w"},
			help = "Workspace (String): Path to directory, which includes the print model to print. Default: current directory",
			defaultValue = ShellOption.NULL
		) final String workspacePath,
		@ShellOption(
			value = {"--print-model", "-p"},
			help = "The Name of the PrintModel that should be measured",
			defaultValue = ShellOption.NULL
		) final String printModelName,
		@ShellOption(
			value = {"--document", "-d"},
			help = "The Filename of the Document that should be printed",
			defaultValue = ""
		) final String documentFileName,
		@Deprecated
		@ShellOption(
			value = {"--useExperimentalRendering", "-x"},
			help = "Use the experimental rendering (Boolean): If true, enables experimental rendering. Default: false",
			defaultValue = "false"
		) final boolean useExperimentalRendering
	) throws RunnerException {

		Objects.requireNonNull(workspacePath, "workspacePath");
		Objects.requireNonNull(printModelName, "printModelName");

		log.debug("Starting jmh Command");

		workspaceBuilder.build(workspacePath);

		final var printModelFileElement = workspaceHandler.getModelFileElement(
			printModelName
		);

		if (printModelFileElement.isEmpty()) {
			throw new PrintShellException("The print model with the given print model id is not present.");
		}

		final var documentToPrint = printDocumentService.getDocumentToPrint(
			printModelName,
			documentFileName
		);

		final var manageApi = getCachedManagerApi();
		final var manager = new PrintJobManager(
			ExecutorServiceFactory.getInstance(),
			manageApi,
			PrintJobConfig.DEFAULT,
			useExperimentalRendering
		);
		final var printModelId = manager.prepare(
			manageApi.loadPrintModel(printModelName)
		);

		final var printEngine = useExperimentalRendering
			? new PdfBoxPrintEngine(
				ExecutorServiceFactory.getInstance(),
				new PdfBoxPrintEngineConfig(workspaceHandler.getPrintConfig().getAvailableFonts())
			)
			: new PdfPrintEngine(
				ExecutorServiceFactory.getInstance(),
				workspaceHandler.getPrintConfig()
			);

		JmhCommandContext.setInstance(
			JmhCommandContext.builder()
				.printModelId(printModelId)
				.pdfPrintEngine(printEngine)
				.manager(manager)
				.documentProvider(KernelDocumentProvider.fromDocument(KernelDocumentV2Provider.CONVERTER.toDocumentV1(documentToPrint)))
				.build()
		);

		final var opt = new OptionsBuilder()
			.include(PrintBenchmark.class.getSimpleName())
			.warmupIterations(warmupIterations)
			.measurementIterations(measurementIterations)
			.shouldDoGC(true)
			.result(Path.of(outputFile, "result.json.jmh").toAbsolutePath().toString())
			.resultFormat(ResultFormatType.JSON)
			.mode(Mode.AverageTime)
			.forks(0)
			.warmupBatchSize(2)
			.warmupMode(WarmupMode.BULK)
			.verbosity(VerboseMode.NORMAL)
			.timeUnit(TimeUnit.MILLISECONDS)
			.build();

		log.info("JMH Setup Completed, starting Benchmark");

		new Runner(opt).runSingle();
	}

	private PrintJobManager.PrintJobManagerApi getCachedManagerApi() {
		final var dmCache = new HashMap<String, IDocumentModel>(1);
		final var pmCache = new HashMap<String, String>(1);
		return new PrintJobManager.PrintJobManagerApi() {
			@Override
			public String loadPrintModel(String id) {
				return pmCache.computeIfAbsent(id, printJobManagerApi::loadPrintModel);
			}

			@Override
			public IDocumentModel loadDocumentModel(String id) {
				return dmCache.computeIfAbsent(id, printJobManagerApi::loadDocumentModel);
			}
		};
	}

}

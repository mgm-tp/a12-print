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

import com.mgmtp.a12.print.engine.api.PrintJobConfig;
import com.mgmtp.a12.print.engine.runtime.PrintJobManager;
import com.mgmtp.a12.print.engine.runtime.pdfBox.PdfBoxPrintEngine;
import com.mgmtp.a12.print.shell.internal.exceptions.PrintShellException;
import com.mgmtp.a12.print.shell.internal.service.PrintDocumentService;
import com.mgmtp.a12.print.shell.internal.service.PrintService;
import com.mgmtp.a12.print.shell.internal.service.ProfilingService;
import com.mgmtp.a12.print.shell.internal.workspace.WorkspaceBuilder;
import com.mgmtp.a12.print.workspace.internal.handler.WorkspaceHandler;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.LocaleUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import picocli.CommandLine;

import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.util.TimeZone;
import java.util.concurrent.ExecutorService;
import java.util.stream.IntStream;

import static com.mgmtp.a12.print.shell.internal.service.ProfilingService.readableFileSize;

@CommandLine.Command(
	name = "profiling",
	description = "Profile Print Model"
)
@RequiredArgsConstructor
@Slf4j
public class ProfilingCommand implements Runnable {

	@NonNull
	private final PrintService printService;

	@NonNull
	private final ExecutorService printThreadPool;

	@NonNull
	private final PrintJobManager.PrintJobManagerApi printJobManagerApi;

	@NonNull
	private final WorkspaceHandler workspaceHandler;

	@NonNull
	private final WorkspaceBuilder workspaceBuilder;

	@NonNull
	private final PrintDocumentService printDocumentService;

	@NonNull
	private final ProfilingService profilingService;

	@CommandLine.Option(
		names = {"--print-model-id", "-p"},
		description ="Print Model Id (String): Print model id to print",
		required = true
	) private String printModelId;

	@CommandLine.Option(
		names = {"--workspace", "-w"},
		description ="Workspace (String): Path to directory, which includes the print model to print. Default: current directory"
	) private String workspacePath = "";

	@CommandLine.Option(
		names = {"--document-id", "-d"},
		description ="Document Id (String): The Id of the document to print (e.g. for document DomainDocument-1 the Id is 1). Default: first document in workspace"
	) private String documentId = "";

	@CommandLine.Option(
		names = {"--log-level", "-l"},
		description ="Log Level (String): Define the log level the print is running with. Default: INFO"
	) private String logLevel = "INFO";

	@CommandLine.Option(
		names = {"--log-file", "-f"},
		description ="Log File (Boolean): Define if the log will be saved in a file next to the print model. Default: false"
	) private boolean createLogFile = false;

	@CommandLine.Option(
		names = {"--time-zone", "-t"},
		description ="Time Zone (String): Time Zone for the print run. Default: Current Java virtual machine Time Zone"
	) private String timeZoneLiteral = "";

	@CommandLine.Option(
		names = {"--locale"},
		description ="Locale (String): Locale for the print run. Default: de"
	) private String locale = "de";

	@CommandLine.Option(
		names = {"--iterations"},
		description ="Number if print times the PrintJob is executed for measurement"
	) private int iterations = 100;

	@CommandLine.Option(
		names = {"--warmup"},
		description ="Number if print times the PrintJob is executed for warmup before measuring the iterations"
	) private int warmupIterations = 10;

	@CommandLine.Option(
		names = {"--parallel"},
		description ="Execute all Iterations in parallel"
	) private boolean parallel = false;

	@CommandLine.Option(
		names = {"--ongoingGCPressure"},
		description ="Request a GC and finalization after every iteration"
	) private boolean ongoingGCPressure = false;

	@Override
	public void run() {
		workspaceBuilder.build(workspacePath);

		final var printModelFileElement = workspaceHandler
			.getModelFileElement(printModelId)
			.orElseThrow(() -> new PrintShellException("The print model with the given print model id is not present."));

		final var printModelContent = workspaceHandler.getFileElementContent(printModelFileElement);
		final var documentToPrint = printDocumentService.getDocumentToPrint(printModelId, documentId);

		final var printModelPath = printModelFileElement.getPath();
		final var resultFileName = printService.getResultFileName(printModelPath, documentToPrint);

		final var printEngine = setupPrintEngine();

		printService.withLogSettingContext(
			logLevel, createLogFile, printModelPath, resultFileName,
			() -> {
				log.info("Start to prepare the print model: {}", printModelFileElement.getModelHeader().getId());

				final var printJobManager = new PrintJobManager(printThreadPool, printJobManagerApi, PrintJobConfig.DEFAULT);
				final var preparedPrintModelId = printJobManager.prepare(printModelContent);

				final var timeZone = StringUtils.isBlank(timeZoneLiteral)
					? TimeZone.getDefault()
					: TimeZone.getTimeZone(ZoneId.of(timeZoneLiteral));

				printService.createResultDirectory(printModelPath);

				// init buffer with 20 MB

				final var snapshotFile = printService.getPathNextToModel(
					printModelPath,
					resultFileName + "-print_profile",
					"log"
				);

				try (final var snapshot = new PrintStream(new FileOutputStream(snapshotFile), true, StandardCharsets.UTF_8)) {

					profilingService.gcPressure();
					profilingService.appendSnapshot("Before Warmup", null, snapshot);

					try (final var outStream = new ByteArrayOutputStream(20 * 1024 * 1024)) {
						for (var i = 0; i < warmupIterations; i++) {
							outStream.reset();
							final var result = printService.printWithoutPrepare(printEngine, preparedPrintModelId, documentToPrint, timeZone, LocaleUtils.toLocale(locale));
							try {
								result.copyTo(outStream);
							} catch (IOException e) {
								throw new PrintShellException(e);
							}
						}
					}

					profilingService.appendSnapshot("After Warmup", null, snapshot);
					profilingService.gcPressure();
					profilingService.appendSnapshot("Baseline", null, snapshot);

					var stream = IntStream.range(0, iterations);
					byte[] byteArray;
					if (parallel) {
						stream = stream.parallel();
					}
					try (final var outStream = new ByteArrayOutputStream(20 * 1024 * 1024)) {

						stream.forEach(iteration -> {
							final var printResult = profilingService.appendSnapshotWithExecutionTime(
								"Iteration: " + iteration, snapshot,
								() -> printService.printWithoutPrepare(
									printEngine,
									preparedPrintModelId,
									documentToPrint,
									timeZone,
									LocaleUtils.toLocale(locale)
								)
							);
							synchronized (outStream) {
								outStream.reset();
								try {
									printResult.copyTo(outStream);
								} catch (IOException e) {
									throw new PrintShellException(e);
								}
								if (ongoingGCPressure) {
									profilingService.gcPressure();
									profilingService.appendSnapshot("Iteration (GC): " + iteration, null, snapshot);
								}
							}

						});
						byteArray = outStream.toByteArray();
					}
					profilingService.appendSnapshot("Done", null, snapshot);
					profilingService.gcPressure();
					profilingService.appendSnapshot("Done (GC)", null, snapshot);

					final var document = Loader.loadPDF(new RandomAccessReadBuffer(byteArray));
					final var fileSize = byteArray.length;
					final var filePages = document.getNumberOfPages();
					final var documentEntityInstancesCount = documentToPrint.directFields().size();
					profilingService.appendResultInfo("The PDF file size", readableFileSize(fileSize), snapshot);
					profilingService.appendResultInfo("The PDF file pages", String.valueOf(filePages), snapshot);
					profilingService.appendResultInfo("The document entity instances", String.valueOf(documentEntityInstancesCount), snapshot);
				}

			}
		);


	}

	private PdfBoxPrintEngine setupPrintEngine() {
		return new PdfBoxPrintEngine(
			printThreadPool,
			workspaceHandler.getPrintConfig()
		);
	}
}

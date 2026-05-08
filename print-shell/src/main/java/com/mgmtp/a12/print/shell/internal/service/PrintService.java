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

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.encoder.PatternLayoutEncoder;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.FileAppender;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mgmtp.a12.kernel.md.document.apiV2.immutable.DocumentV2;
import com.mgmtp.a12.print.engine.api.PdfPrintEngine;
import com.mgmtp.a12.print.engine.api.PdfPrintResult;
import com.mgmtp.a12.print.engine.api.PrintJobConfig;
import com.mgmtp.a12.print.engine.api.PrintModelId;
import com.mgmtp.a12.print.engine.runtime.*;
import com.mgmtp.a12.print.shell.internal.configuration.PrintShellConfiguration;
import com.mgmtp.a12.print.shell.internal.exceptions.PrintShellException;
import com.mgmtp.a12.print.typesetting.internal.model.impl.TypesettingModelDto;
import com.mgmtp.a12.print.typesetting.internal.serialization.ObjectMapperFactory;
import com.mgmtp.a12.print.typesetting.internal.validation.ITypesettingModelValidator;
import com.mgmtp.a12.print.typesetting.internal.validation.TypesettingModelValidator;
import com.mgmtp.a12.print.workspace.internal.elements.ModelFileElement;
import com.mgmtp.a12.print.workspace.internal.handler.FileHandler;
import com.mgmtp.a12.print.workspace.internal.handler.WorkspaceHandler;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.LocaleUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Path;
import java.time.ZoneId;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.ExecutorService;

@Service
@RequiredArgsConstructor
@Slf4j
public class PrintService {
	private static final ObjectMapper objectMapper = ObjectMapperFactory.createTypesettingModelMapper();

	private static final String LOG_PACKAGE = "com.mgmtp.a12.print";

	private final WorkspaceHandler workspaceHandler;
	private final PrintShellConfiguration printShellConfiguration;
	@NonNull
	private final ExecutorService printThreadPool;
	@NonNull
	private final PrintJobManager.PrintJobManagerApi printJobManagerApi;

	private final FileHandler fileHandler;

	private FileAppender<ILoggingEvent> fileAppender;
	private final ITypesettingModelValidator typesettingModelValidator = new TypesettingModelValidator();

	public PdfPrintResult printWithoutPrepare(
		final PdfPrintEngine printEngine,
		PrintModelId printModelId,
		DocumentV2 documentToPrint,
		final TimeZone timeZone,
		final Locale locale
	) {
		final var printJobManager = new PrintJobManager(printThreadPool, printJobManagerApi, PrintJobConfig.DEFAULT);
		final var printJob = printJobManager
			.createNewJob(printModelId)
			.withProvider(KernelDocumentV2Provider.fromDocument(documentToPrint))
			.withLocale(locale)
			.withTimeZone(timeZone);

		return printEngine.execute(printJob);
	}

	public void print(
		final PrintEngine<PdfPrintResult> printEngine,
		ModelFileElement printModelFileElement,
		DocumentV2 documentToPrint,
		final String logLevel,
		final boolean createLogFile,
		final String timeZone,
		final String locale,
		final boolean useExperimentalRendering,
		final String suffix
	) {
		try {
			String printModelContent = workspaceHandler.getFileElementContent(printModelFileElement);

			Path printModelPath = printModelFileElement.getPath();
			String resultFileName = getResultFileName(printModelPath, documentToPrint);

			setLogSettings(logLevel, createLogFile, printModelPath, resultFileName);

			log.info("Start to prepare the print model: {}", printModelFileElement.getModelHeader().getId());

			final var printJobManager = new PrintJobManager(printThreadPool, printJobManagerApi, PrintJobConfig.DEFAULT, useExperimentalRendering);
			final var printModelPrepareId = printJobManager.prepare(printModelContent);
			final var printJob = printJobManager.createNewJob(printModelPrepareId);

			printJob.withProvider(KernelDocumentV2Provider.fromDocument(documentToPrint));
			printJob.withProvider(TypesettingModelProvider.fromLoader(id -> {
				final var typesettingFileModel = workspaceHandler.getModelFileElement(id);
				if (typesettingFileModel.isEmpty()) {
					throw new PrintShellException(String.format("The typesetting model with the given id (%s) is not present.", id));
				}
				final var content = workspaceHandler.getFileElementContent(typesettingFileModel.get());

				return this.validateAndMarshallTypesettingDto(content);
			}));

			Locale parsedLocale = LocaleUtils.toLocale(locale);
			printJob.withLocale(parsedLocale);

			printJob.withTimeZone(
				StringUtils.isBlank(timeZone)
					? TimeZone.getDefault()
					: TimeZone.getTimeZone(ZoneId.of(timeZone))
			);

			log.info("Start to print the print model: {}", printModelFileElement.getModelHeader().getId());
			PdfPrintResult pdfPrintResult = printEngine.execute(printJob);

			savePDFResult(printModelPath, resultFileName, pdfPrintResult, suffix);

			resetLogSettings();
		} catch (Exception exception) {
			resetLogSettings();
			throw new PrintShellException(exception);
		}
	}

	public String getResultFileName(
		Path printModelPath,
		DocumentV2 documentToPrint
	) {
		String printModelFileName = FilenameUtils.getBaseName(printModelPath.getFileName().toString());

		String documentIdToPrint = documentToPrint.getId().orElse(null);
		return documentIdToPrint == null
			? printModelFileName
			: String.format("%s-%s", printModelFileName, documentIdToPrint);
	}

	public void withLogSettingContext(
		String logLevel,
		boolean createLogFile,
		Path printModelPath,
		String resultFileName,
		Action action
	) {
		setLogSettings(logLevel, createLogFile, printModelPath, resultFileName);
		try {
			action.call();
		} catch (Exception e) {
			throw new RuntimeException(e);
		} finally {
			resetLogSettings();
		}
	}

	public void resetLogSettings() {
		LoggerContext loggerContext = (LoggerContext) LoggerFactory.getILoggerFactory();
		Logger logger = loggerContext.getLogger(LOG_PACKAGE);
		logger.setLevel(Level.INFO);

		if (this.fileAppender != null) {
			logger.detachAppender(this.fileAppender);
		}
	}

	public void setLogSettings(
		String logLevel,
		boolean createLogFile,
		Path printModelPath,
		String resultFileName
	) {
		LoggerContext loggerContext = (LoggerContext) LoggerFactory.getILoggerFactory();
		Logger logger = loggerContext.getLogger(LOG_PACKAGE);
		logger.setLevel(Level.toLevel(logLevel, Level.INFO));

		if (createLogFile) {
			FileAppender<ILoggingEvent> appender = new FileAppender<>();

			createResultDirectory(printModelPath);

			String logFilePath = getPathNextToModel(printModelPath, resultFileName, "log");

			appender.setFile(logFilePath);
			appender.setName("PrintCommandLogger");
			appender.setContext(loggerContext);
			appender.setAppend(false);

			PatternLayoutEncoder encoder = new PatternLayoutEncoder();
			encoder.setContext(loggerContext);
			encoder.setPattern("%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n");
			encoder.start();

			appender.setEncoder(encoder);
			appender.start();

			logger.addAppender(appender);

			this.fileAppender = appender;

			fileHandler.create(new File(logFilePath).toPath());
		}
	}

	public String getPathNextToModel(
		Path printModelPath,
		String resultFileName,
		String extension
	) {
		return printModelPath.resolveSibling(
			String.format("%s/%s.%s", printShellConfiguration.getResultDirectory(), resultFileName, extension)
		).toString();
	}

	public void createResultDirectory(
		Path printModelPath
	) {
		String parentPathOfPdfFile = printModelPath.getParent().resolve(printShellConfiguration.getResultDirectory()).toString();
		new File(parentPathOfPdfFile).mkdirs();
	}

	private void savePDFResult(
		Path printModelPath,
		String resultFileName,
		PdfPrintResult pdfPrintResult,
		String suffix
	) throws IOException {
		String pathToPdfFile = getPathNextToModel(
			printModelPath,
			String.format(
				"%s%s%s",
				resultFileName,
				suffix.isEmpty() ? "" : "-",
				suffix
			),
			"pdf"
		);

		log.info("Save PDF result to {}", pathToPdfFile);

		createResultDirectory(printModelPath);
		File pdfResultFile = new File(pathToPdfFile);
		pdfResultFile.createNewFile();

		try (FileOutputStream pdfResultStream = new FileOutputStream(pdfResultFile)) {
			pdfPrintResult.copyTo(pdfResultStream);
		}

		fileHandler.create(pdfResultFile.toPath());
	}

	private TypesettingModelDto validateAndMarshallTypesettingDto(String typesetting) {
		try {
			var validation = typesettingModelValidator.validate(typesetting, Locale.ENGLISH);
			if (!validation.noErrorOccurred()) {
				throw new PrintShellException("Typesetting is not valid.");
			}
			return objectMapper.readValue(typesetting, TypesettingModelDto.class);

		} catch (JsonProcessingException e) {
			throw new PrintShellException("Unable to load printModel", e);
		}
	}
}

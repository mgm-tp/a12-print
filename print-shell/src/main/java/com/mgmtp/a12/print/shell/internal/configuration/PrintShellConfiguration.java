// tag::License[]
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
// end::License[]
package com.mgmtp.a12.print.shell.internal.configuration;
// tag::Import[]

import com.mgmtp.a12.kernel.md.model.api.IDocumentModel;
import com.mgmtp.a12.print.engine.api.PrintEngineConfig;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.ExecutorServiceFactory;
import com.mgmtp.a12.print.engine.runtime.PrintJobManager;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.pdf.PdfPrintEngine;
import com.mgmtp.a12.print.workspace.internal.event.EventService;
import com.mgmtp.a12.print.workspace.internal.handler.FileHandler;
import com.mgmtp.a12.print.workspace.internal.handler.WorkspaceHandler;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;

import java.util.concurrent.ExecutorService;

@Configuration
@ConfigurationProperties(prefix = "print.shell")
@Data
@RequiredArgsConstructor
public class PrintShellConfiguration {
	// tag::resultDirectory[]
	public String resultDirectory = "result";
	// end::resultDirectory[]
	public static final String PRINT_THREAD_POOL = "printThreadPool";

	@Bean
	@Qualifier(PRINT_THREAD_POOL)
	public ExecutorService printThreadPool() {
		return ExecutorServiceFactory.getInstance();
	}

	// tag::WorkspaceAPIs[]
	@Bean
	public WorkspaceHandler workspaceHandler() {
		return new WorkspaceHandler();
	}

	@Bean
	public EventService eventService() {
		return eventMessage -> {
			// There is no event handling needed for the workspace in the shell
		};
	}

	@Bean
	public FileHandler fileHandler(
		final @NonNull WorkspaceHandler workspaceHandler,
		final @NonNull EventService eventService
	) {
		return new FileHandler(workspaceHandler, eventService);
	}
	// end::WorkspaceAPIs[]

	@Bean
	public PrintJobManager.PrintJobManagerApi printJobManagerApi(
		// tag::workspaceHandler[]
		final @lombok.NonNull WorkspaceHandler workspaceHandler
		// end::workspaceHandler[]
	) {

		return new PrintJobManager.PrintJobManagerApi() {
			@Override
			public String loadPrintModel(String id) {
				// tag::loadPrintModel[]
				return workspaceHandler
					.getModelFileElementsByType(Constants.PRINT_MODEL_TYPE).stream()
					.filter(e -> e.getModelHeader().getId().equals(id))
					.findFirst()
					.map(workspaceHandler::getFileElementContent)
					.orElseThrow(() -> new PrintException(String.format("unable to locate PrintModel %s", id)));
				// end::loadPrintModel[]
				// load print model content with the provided id <1>
			}

			@Override
			public IDocumentModel loadDocumentModel(String id) {
				// tag::loadPrintModel[]
				return workspaceHandler.getDocumentModelById(id);
				// end::loadPrintModel[]
				// load document model with the provided id <2>

			}
		};
	}

	@Bean
	public PdfPrintEngine pdfPrintEngine(@lombok.NonNull @Qualifier(PRINT_THREAD_POOL) ExecutorService printThreadPool) {
		return new PdfPrintEngine(
			printThreadPool,
			PrintEngineConfig.DEFAULT.toBuilder()
				.availableFonts(PrintEngineConfig.DEFAULT_FONTS) // <3>
				.build()
		);
	}
}

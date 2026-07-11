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
package com.mgmtp.a12.print.engine.runtime;

import com.mgmtp.a12.kernel.md.model.api.IDocumentModel;
import com.mgmtp.a12.print.engine.api.JobManager;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.PrintJobConfig;
import com.mgmtp.a12.print.engine.api.PrintModelId;
import com.mgmtp.a12.print.engine.api.StaticImageProvider;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintCompilerException;
import com.mgmtp.a12.print.engine.api.message.PrintMessageReport;
import com.mgmtp.a12.print.engine.runtime.internal.manager.ManagedPrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.manager.PrintModelCompilerRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompilationContext;
import com.mgmtp.a12.print.engine.runtime.internal.message.PrintMessageCollector;
import com.mgmtp.a12.print.engine.runtime.internal.message.PrintMessageReportImpl;
import lombok.NonNull;
import org.apache.commons.lang3.StringUtils;

import java.util.concurrent.ExecutorService;
import com.mgmtp.a12.model.utils.OnlyForUsage;

// tag::PrintJobManager[]

/**
 * Used to create {@link PrintJob}s and compile {@link com.mgmtp.a12.print.model.api.model.PrintModel}s
 */
@OnlyForUsage
public class PrintJobManager implements JobManager {
	private final PrintModelCompilerRuntime compiler;

	public PrintJobManager(
		@NonNull ExecutorService executorService,
		@NonNull PrintJobManagerApi api,
		@NonNull PrintJobConfig printJobConfig
	) {
		this.compiler = new PrintModelCompilerRuntime(executorService, api, printJobConfig);
	}

	public PrintJobManager(
		@NonNull ExecutorService executorService,
		@NonNull PrintJobManagerApi api,
		@NonNull PrintJobConfig printJobConfig,
		@NonNull StaticImageProvider staticImageProvider
	) {
		this.compiler = new PrintModelCompilerRuntime(executorService, api, printJobConfig, staticImageProvider);
	}

	@Override
	public PrintMessageReport<PrintModelId> prepareWithReport(@NonNull String printModel) {
		return PrintMessageReportImpl.wrapException(() -> {
			PrintModelId id = compiler.compile(printModel).getId();
			return new PrintMessageReportImpl<>(id, PrintMessageCollector.getMessages());
		}, PrintCompilerException.class, PrintCompilerException::new);
	}

	/**
	 * Compiles a {@link com.mgmtp.a12.print.model.api.model.PrintModel}.
	 */
	@Override
	public PrintModelId prepare(String printModel) throws PrintCompilerException {
		final var prepareResult = prepareWithReport(printModel);
		if (prepareResult.noErrorOccurred()) {
			return prepareResult.getResult();
		}
		throw new PrintCompilerException(
			"The Print Model prepare failed with the following messages: {}",
			StringUtils.join(prepareResult.getMessages(), "\n")
		);
	}

	@Override
	public PrintMessageReport<PrintJob> createNewJobWithReport(@NonNull PrintModelId printModelId) {
		return PrintMessageReportImpl.wrapException(() -> {
			final var printJob = ManagedPrintJob.builder()
				.printModelCompilationContext(getCompiledPrintModel(printModelId))
				.build();
			printJob.withProvider(PrintModelProvider.fromLoader(this::getCompiledPrintModel));
			return new PrintMessageReportImpl<>(printJob, PrintMessageCollector.getMessages());
		}, PrintCompilerException.class, PrintCompilerException::new);
	}

	@Override
	public PrintJob createNewJob(PrintModelId printModelId) throws PrintCompilerException {
		final var result = createNewJobWithReport(printModelId);
		if (result.noErrorOccurred()) {
			return result.getResult();
		}
		throw new PrintCompilerException(
			"The Print Job creation failed with the following messages: {}",
			StringUtils.join(result.getMessages(), "\n")
		);
	}

	private PrintModelCompilationContext getCompiledPrintModel(@NonNull PrintModelId printModelId) {
		final var context = compiler.get(printModelId);
		return context.orElseThrow(
			() -> new PrintCompilerException("PrintModel {} is not prepared.", printModelId)
		).awaitCompilation();
	}

	// end::PrintJobManager[]

	// tag::PrintJobManagerApi[]

	/**
	 * Provides interfaces that load print and document models by given IDs.
	 */
	public interface PrintJobManagerApi {

		/**
		 * Load the Print model content by ID
		 */
		String loadPrintModel(String id);

		/**
		 * Load the document model structure by ID
		 *
		 * @param id document model ID
		 */
		IDocumentModel loadDocumentModel(String id);

	}

	// end::PrintJobManagerApi[]

}

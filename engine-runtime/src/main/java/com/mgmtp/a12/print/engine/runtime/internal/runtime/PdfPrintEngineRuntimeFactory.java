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
package com.mgmtp.a12.print.engine.runtime.internal.runtime;

import com.mgmtp.a12.print.engine.api.PdfPrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.CacheableGenericDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.engine.ValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.heightCalculation.EvaluatedHeightDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.MarkupCollectorValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.overrideResolver.OverrideElementDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer.PDDocumentDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.restriction.PdfJobRestrictionContextDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.renderer.pdf.PdfRendererFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.rendering.MarkupCollector;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfPrintEngineRuntimeApiFactory;
import com.mgmtp.a12.print.engine.runtime.internal.manager.ManagedPrintJob;
import com.mgmtp.a12.print.model.api.walker.model.resolver.OverrideElementListResolver;
import lombok.Builder;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.ExecutorService;

@Builder(builderClassName = "Builder")
@Slf4j
public class PdfPrintEngineRuntimeFactory extends InternalPdfPrintEngineRuntimeFactory<PrintJob, PdfPrintEngine> {

	private final ExecutorService executorService;

	public PdfPrintEngineRuntimeFactory(
		@NonNull ExecutorService executorService
	) {
		super(new CorePrintEngineRuntimeFactory<>(executorService));
		this.executorService = executorService;
	}

	@Override
	protected IProviderCache<?, ?, ? super PrintJob, ? super PdfPrintEngine, ? extends InternalCorePrintEngineRuntime> createCache(
		CacheableGenericDependencyValueProvider<Object, ValueDependency<Object>, ? super PrintJob, ? super PdfPrintEngine, ? extends InternalCorePrintEngineRuntime> provider
	) {
		if (executorService == null) {
			return new SynchronizedProviderCache<>(provider);
		} else {
			return new ConcurrentProviderCache<>(executorService, provider);
		}
	}


	@Override
	protected InternalPdfPrintEngineRuntime mapRuntime(InternalPdfPrintEngineRuntime runtime) {
		if (executorService != null) {
			return new ConcurrentPdfPrintEngineRuntime(
				runtime,
				executorService
			);
		} else {
			return runtime;
		}
	}

	@Override
	protected InternalPdfPrintEngineRuntimeApiFactory<PrintJob, PdfPrintEngine> getEngineDependentRuntimeApiFactory(
		PdfPrintEngine engine,
		InternalPdfPrintEngineRuntimeApiFactory.Builder<PrintJob, PdfPrintEngine> engineSpecificBuilder
	) {
		var config = engine.getConfig();
		final var pdfRenderer = new PdfRendererFactory(config.getAvailableFonts());

		return engineSpecificBuilder
			.withProviderForPDDocumentDependency(new PDDocumentDependencyValueProducer(pdfRenderer))
			.withProviderForEvaluatedHeightDependency(new EvaluatedHeightDependencyValueProducer(pdfRenderer))
			.build();
	}

	@Override
	protected InternalPdfPrintEngineRuntimeApiFactory<PrintJob, PdfPrintEngine> getJobDependentRuntimeApiFactory(
		PrintJob job, PdfPrintEngine engine, InternalPdfPrintEngineRuntimeApiFactory.Builder<PrintJob, PdfPrintEngine> jobSpecific
	) {
		if (job instanceof ManagedPrintJob) {
			addJobDependenciesFromManagedJob(jobSpecific, engine, (ManagedPrintJob) job);
		}

		return jobSpecific.build();
	}

	protected void addJobDependenciesFromManagedJob(
		InternalPdfPrintEngineRuntimeApiFactory.Builder<PrintJob, PdfPrintEngine> jobSpecific,
		PdfPrintEngine engine,
		ManagedPrintJob managedPrintJob
	) {
		final var printModelCompilationContext = managedPrintJob.getPrintModelCompilationContext();

		if (printModelCompilationContext.isPdfBoxPrintProcess()) {
			throw new PrintException("Please initialize the 'PrintJobManager' with the flag 'usePdfBoxPrintProcess' set to 'false' in order to be able to run the PdfPrintEngine");
		}

		final var overrideElementResolver = OverrideElementListResolver.fromModel(printModelCompilationContext);
		final var overrideElementProvider = new OverrideElementDependencyValueProducer(overrideElementResolver);

		final var spreadExpressionManager = printModelCompilationContext
			.getSpreadExpressionManager().asCacheable();

		jobSpecific
			.withProviderForMarkupCollectorDependency(new MarkupCollectorValueProducer(
				((com.mgmtp.a12.print.engine.runtime.pdf.PdfPrintEngine) engine).isIncludeHtmlMarkup()
					? new MarkupCollector()
					: null
			))
			// Job Bound DataProvider
			.withProviderForSpreadExpressionManagerDependency(
				spreadExpressionManager
			)
			// Model Bound Resolver
			.withProviderForOverrideElementDependency(overrideElementProvider)
			// Stream Provider
			.withStreamProviderForSpreadExpressionManagerDependency(spreadExpressionManager);
	}

}

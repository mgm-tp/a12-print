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

import com.mgmtp.a12.print.engine.api.JobDependencyProvider;
import com.mgmtp.a12.print.engine.api.PdfBoxPrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.CacheableGenericDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.PdfBoxDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.TypesettingModelJobDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.ValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.TypesettingModelDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntimeApiFactory;
import com.mgmtp.a12.print.engine.runtime.internal.manager.ManagedPrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.text.CachedTextWidthResolver;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.text.LineWrapper;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.text.TextComponentDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.FontLoaderDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.HtmlTokenizer;
import com.mgmtp.a12.print.typesetting.internal.model.TypesettingModel;
import lombok.Builder;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.concurrent.ExecutorService;

@Builder(builderClassName = "Builder")
@Slf4j
public class PdfBoxPrintEngineRuntimeFactory extends InternalPdfBoxPrintEngineRuntimeFactory<PrintJob, PdfBoxPrintEngine> {

	private final ExecutorService executorService;

	public PdfBoxPrintEngineRuntimeFactory(
		@NonNull ExecutorService executorService
	) {
		super(new CorePrintEngineRuntimeFactory<>(executorService));
		this.executorService = executorService;
	}

	@Override
	protected IProviderCache<?, ?, ? super PrintJob, ? super PdfBoxPrintEngine, ? extends InternalCorePrintEngineRuntime> createCache(
		CacheableGenericDependencyValueProvider<Object, ValueDependency<Object>, ? super PrintJob, ? super PdfBoxPrintEngine, ? extends InternalCorePrintEngineRuntime> provider
	) {
		if (executorService == null) {
			return new SynchronizedProviderCache<>(provider);
		} else {
			return new ConcurrentProviderCache<>(executorService, provider);
		}
	}


	@Override
	protected InternalPdfBoxPrintEngineRuntime mapRuntime(InternalPdfBoxPrintEngineRuntime runtime) {
		if (executorService != null) {
			return new ConcurrentPdfBoxPrintEngineRuntime(
				runtime,
				executorService
			);
		} else {
			return runtime;
		}
	}

	@Override
	protected InternalPdfBoxPrintEngineRuntimeApiFactory<PrintJob, PdfBoxPrintEngine> getEngineDependentRuntimeApiFactory(
		PdfBoxPrintEngine engine,
		InternalPdfBoxPrintEngineRuntimeApiFactory.Builder<PrintJob, PdfBoxPrintEngine> engineSpecificBuilder
	) {
		var config = engine.getConfig();

		final var textWidthResolver = new CachedTextWidthResolver();
		final var htmlTokenizer = new HtmlTokenizer();
		final var lineWrapper = new LineWrapper(textWidthResolver, htmlTokenizer);

		return engineSpecificBuilder
			.withProviderForTextComponentDependency(
				new TextComponentDependencyValueProducer(lineWrapper).asCacheable()
			)
			.withProviderForFontLoaderDependency(
				new FontLoaderDependencyValueProducer(config.getAvailableFonts()).asCacheable()
			)
			.build();
	}

	@Override
	protected InternalPdfBoxPrintEngineRuntimeApiFactory<PrintJob, PdfBoxPrintEngine> getJobDependentRuntimeApiFactory(
		PrintJob job, PdfBoxPrintEngine engine, InternalPdfBoxPrintEngineRuntimeApiFactory.Builder<PrintJob, PdfBoxPrintEngine> jobSpecific
	) {
		if (job instanceof ManagedPrintJob) {
			addJobDependenciesFromManagedJob(jobSpecific, (ManagedPrintJob) job);
		}

		return jobSpecific.build();
	}

	private static PdfBoxDependencyValueProvider<TypesettingModel, TypesettingModelDependency> getTypesettingModelDependencyProvider(
		final ArrayList<JobDependencyProvider> providers
	) {
		return (dependency, job, engine, runtime) -> {
			final var typesettingModelJobDependency = new TypesettingModelJobDependency(dependency::getTypesettingModelId);

			var noMatchingProviderExists = true;
			for (JobDependencyProvider provider : providers) {
				if (!provider.canProvide(typesettingModelJobDependency)) {
					continue;
				}
				provider.provide(typesettingModelJobDependency);
				noMatchingProviderExists = false;
			}

			if (noMatchingProviderExists) {
				throw new PrintException(String.format(
					"There is no matching provider to load the typesetting model with the id %s", dependency.getTypesettingModelId()
				));
			}

			final var typesettingModel = typesettingModelJobDependency.getTypesettingModel();
			if (typesettingModel.isEmpty()) {
				throw new PrintException("Missing Typesetting Model: " + dependency.getTypesettingModelId());
			}

			return typesettingModel::get;
		};
	}

	protected void addJobDependenciesFromManagedJob(
		InternalPdfBoxPrintEngineRuntimeApiFactory.Builder<PrintJob, PdfBoxPrintEngine> jobSpecific,
		ManagedPrintJob managedPrintJob
	) {
		final var printModelCompilationContext = managedPrintJob.getPrintModelCompilationContext();
		final var componentTreeManager = printModelCompilationContext
			.getComponentTreeManager().asCacheable();
		final var providers = new ArrayList<>(managedPrintJob.getDataProviderList().keySet());

		jobSpecific
			.withProviderForComponentTreeDependencySelector(printModelCompilationContext
				.getComponentTreeDependencySelectorProducer().asCacheable())
			.withProviderForComponentTreeManagerDependency(componentTreeManager)
			.withStreamProviderForComponentTreeManagerDependency(componentTreeManager)
			.withProviderForTypesettingModelDependency(getTypesettingModelDependencyProvider(providers));
	}

}

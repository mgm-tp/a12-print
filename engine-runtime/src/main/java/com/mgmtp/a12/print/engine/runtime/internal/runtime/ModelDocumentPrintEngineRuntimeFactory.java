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

import com.mgmtp.a12.print.engine.api.ModelDocumentPrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintJobRestrictionException;
import com.mgmtp.a12.print.engine.runtime.internal.CacheableGenericDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.engine.ValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.listing.ListingElementDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalModelDocumentPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalModelDocumentPrintEngineRuntimeApiFactory;
import com.mgmtp.a12.print.engine.runtime.internal.manager.ManagedPrintJob;
import lombok.Builder;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.ExecutorService;

@Builder(builderClassName = "Builder")
@Slf4j
public class ModelDocumentPrintEngineRuntimeFactory extends InternalModelDocumentPrintEngineRuntimeFactory<PrintJob, ModelDocumentPrintEngine> {

	private final ExecutorService executorService;

	public ModelDocumentPrintEngineRuntimeFactory(@NonNull ExecutorService executorService) {
		super(new CorePrintEngineRuntimeFactory<>(executorService));
		this.executorService = executorService;
	}

	@Override
	protected IProviderCache<?, ?, ? super PrintJob, ? super ModelDocumentPrintEngine, ? extends InternalCorePrintEngineRuntime> createCache(
		CacheableGenericDependencyValueProvider<Object, ValueDependency<Object>, ? super PrintJob, ? super ModelDocumentPrintEngine, ? extends InternalCorePrintEngineRuntime> provider
	) {
		if (executorService == null) {
			return new SynchronizedProviderCache<>(provider);
		} else {
			return new ConcurrentProviderCache<>(executorService, provider);
		}
	}


	@Override
	protected InternalModelDocumentPrintEngineRuntime mapRuntime(InternalModelDocumentPrintEngineRuntime runtime) {
		if (executorService != null) {
			return new ConcurrentModelDocumentPrintEngineRuntime(
				runtime,
				executorService
			);
		} else {
			return runtime;
		}
	}

	@Override
	protected InternalModelDocumentPrintEngineRuntimeApiFactory<PrintJob, ModelDocumentPrintEngine> getEngineDependentRuntimeApiFactory(
		ModelDocumentPrintEngine engine,
		InternalModelDocumentPrintEngineRuntimeApiFactory.Builder<PrintJob, ModelDocumentPrintEngine> engineSpecificBuilder
	) {
		return engineSpecificBuilder
			.withProviderForListingElementDependency(new ListingElementDependencyValueProducer())
			.build();
	}

	@Override
	protected InternalModelDocumentPrintEngineRuntimeApiFactory<PrintJob, ModelDocumentPrintEngine> getJobDependentRuntimeApiFactory(
		PrintJob job, ModelDocumentPrintEngine engine, InternalModelDocumentPrintEngineRuntimeApiFactory.Builder<PrintJob, ModelDocumentPrintEngine> jobSpecific
	) {
		if (job instanceof ManagedPrintJob) {
			addJobDependenciesFromManagedJob(jobSpecific, (ManagedPrintJob) job);
		}

		return jobSpecific.build();
	}

	protected void addJobDependenciesFromManagedJob(
		InternalModelDocumentPrintEngineRuntimeApiFactory.Builder<PrintJob, ModelDocumentPrintEngine> jobSpecific,
		ManagedPrintJob managedPrintJob
	) {

		if (managedPrintJob.getRestriction() != null) {
			throw new PrintJobRestrictionException("ModelDocumentPrintEngineRuntime currently does not support restrictions.");
		}
	}
}

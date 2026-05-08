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

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.CacheableGenericDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.GenericDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.engine.ValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.ElementModelDocumentDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.ReferenceModelDocumentDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.area.AreaElementDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.switchCase.SwitchElementDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.text.TextBasedElementValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.section.ModelDocumentSectionDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.segment.ModelDocumentSegmentDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.watermark.ModelDocumentWatermarkDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.generated.*;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntimeApi;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalModelDocumentPrintEngineRuntimeApi;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalModelDocumentPrintEngineRuntimeApiFactory;
import lombok.experimental.Delegate;

import java.util.HashMap;
import java.util.function.Function;

public abstract class InternalModelDocumentPrintEngineRuntimeFactory<Job extends PrintJob, Engine extends PrintEngine<?>> {

	private final InternalModelDocumentPrintEngineRuntimeApiFactory<Job, Engine> internalModelDocumentPrintEngineRuntimeApiFactory;
	private final CorePrintEngineRuntimeFactory<Job, Engine> internalCorePrintEngineRuntimeFactory;

	public InternalModelDocumentPrintEngineRuntimeFactory(
		CorePrintEngineRuntimeFactory<Job, Engine> internalCorePrintEngineRuntimeFactory
	) {
		this.internalModelDocumentPrintEngineRuntimeApiFactory = getInternalModelDocumentPrintEngineRuntimeApiFactory();
		this.internalCorePrintEngineRuntimeFactory = internalCorePrintEngineRuntimeFactory;
	}

	protected abstract IProviderCache<?, ?, ? super Job, ? super Engine, ? extends InternalCorePrintEngineRuntime> createCache(CacheableGenericDependencyValueProvider<Object, ValueDependency<Object>, ? super Job, ? super Engine, ? extends InternalCorePrintEngineRuntime> provider);

	private Function<GenericDependencyValueProvider<?, ?, ? super Job, ? super Engine, ? extends InternalCorePrintEngineRuntime>, GenericDependencyValueProvider<?, ?, ? super Job, ? super Engine, ? extends InternalCorePrintEngineRuntime>> postProcess() {
		final var map = new HashMap<GenericDependencyValueProvider<?, ?, ? super Job, ? super Engine, ? extends InternalCorePrintEngineRuntime>, GenericDependencyValueProvider<?, ?, ? super Job, ? super Engine, ? extends InternalCorePrintEngineRuntime>>();
		return (genericDependencyValueProvider) -> map.computeIfAbsent(genericDependencyValueProvider, g -> {
			if (g instanceof CacheableGenericDependencyValueProvider<?, ?, ?, ?, ?>) {
				return createCache((CacheableGenericDependencyValueProvider<Object, ValueDependency<Object>, ? super Job, ? super Engine, ? extends InternalCorePrintEngineRuntime>) g);
			} else {
				return g;
			}
		});
	}

	public Function<Job, InternalModelDocumentPrintEngineRuntime> build(Engine engine) {
		final var engineModelDocumentSpecific = getEngineDependentRuntimeApiFactory(engine, internalModelDocumentPrintEngineRuntimeApiFactory.toBuilder());
		final var engineCoreSpecific = internalCorePrintEngineRuntimeFactory.getEngineDependentRuntimeApiFactory(
			engine, internalCorePrintEngineRuntimeFactory.getInternalCorePrintEngineRuntimeApiFactory().toBuilder()
		);
		return job -> mapRuntime(
			new InternalModelDocumentPrintEngineRuntimeFactory.PrintEngineRuntimeDelegate(runtime ->
				internalCorePrintEngineRuntimeFactory.getJobDependentRuntimeApiFactory(job, engine, engineCoreSpecific.toBuilder())
					.postProcess(postProcess())
					.build(job, engine, runtime),
				runtime ->
					getJobDependentRuntimeApiFactory(job, engine, engineModelDocumentSpecific.toBuilder())
						.postProcess(postProcess())
						.build(job, engine, runtime)
			)
		);
	}


	protected InternalModelDocumentPrintEngineRuntime mapRuntime(InternalModelDocumentPrintEngineRuntime runtime) {
		return runtime;
	}

	protected abstract InternalModelDocumentPrintEngineRuntimeApiFactory<Job, Engine> getEngineDependentRuntimeApiFactory(
		Engine engine,
		InternalModelDocumentPrintEngineRuntimeApiFactory.Builder<Job, Engine> engineSpecificBuilder
	);

	protected abstract InternalModelDocumentPrintEngineRuntimeApiFactory<Job, Engine> getJobDependentRuntimeApiFactory(
		Job job,
		Engine engine,
		InternalModelDocumentPrintEngineRuntimeApiFactory.Builder<Job, Engine> jobSpecific
	);

	protected InternalModelDocumentPrintEngineRuntimeApiFactory<Job, Engine> getInternalModelDocumentPrintEngineRuntimeApiFactory() {
		return InternalModelDocumentPrintEngineRuntimeApiFactory
			.<Job, Engine> factory()
			.withProviderForModelDocumentSegmentDependency(new ModelDocumentSegmentDependencyValueProducer())
			.withProviderForReferenceModelDocumentDependency(new ReferenceModelDocumentDependencyValueProducer())
			.withProviderForAreaElementDependency(new AreaElementDependencyValueProducer())
			.withProviderForSwitchElementDependency(new SwitchElementDependencyValueProducer())
			.withProviderForTextBasedElementDependency(new TextBasedElementValueProducer())
			.withProviderForModelDocumentSectionDependency(new ModelDocumentSectionDependencyValueProducer())
			.withProviderForModelDocumentSegmentDependency(new ModelDocumentSegmentDependencyValueProducer())
			.withProviderForModelDocumentWatermarkDependency(new ModelDocumentWatermarkDependencyValueProducer())
			.withProviderForElementModelDocumentDependency(new ElementModelDocumentDependencyValueProducer())
			.withStreamProviderForReferenceModelDocumentDependency(new ReferenceModelDocumentDependencyValueProducer())
			.withStreamProviderForModelDocumentSegmentDependency(new ModelDocumentSegmentDependencyValueProducer())
			.withStreamProviderForModelDocumentSectionDependency(new ModelDocumentSectionDependencyValueProducer())
			.withStreamProviderForModelDocumentWatermarkDependency(new ModelDocumentWatermarkDependencyValueProducer())
			.withStreamProviderForElementModelDocumentDependency(new ElementModelDocumentDependencyValueProducer())
			.build();
	}


	protected static class PrintEngineRuntimeDelegate implements InternalModelDocumentPrintEngineRuntime {
		@Delegate(types = {InternalModelDocumentPrintEngineRuntimeApi.class})
		protected final InternalModelDocumentPrintEngineRuntimeApi internalModelDocumentPrintEngineRuntime;

		@Delegate(types = {com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntimeApi.class})
		protected final InternalCorePrintEngineRuntimeApi internalCorePrintEngineRuntime;

		public PrintEngineRuntimeDelegate(
			Function<InternalModelDocumentPrintEngineRuntime, InternalCorePrintEngineRuntimeApi> coreFactory,
			Function<InternalModelDocumentPrintEngineRuntime, InternalModelDocumentPrintEngineRuntimeApi> modelDocumentFactory
		) {
			this.internalModelDocumentPrintEngineRuntime = modelDocumentFactory.apply(this);
			this.internalCorePrintEngineRuntime = coreFactory.apply(this);
		}
	}
}

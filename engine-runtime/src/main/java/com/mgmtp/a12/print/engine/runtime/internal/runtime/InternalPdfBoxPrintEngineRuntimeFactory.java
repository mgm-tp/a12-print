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
import com.mgmtp.a12.print.engine.runtime.internal.generated.*;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntimeApi;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntimeApi;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntimeApiFactory;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.ElementComponentDependencyDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.ReferenceComponentDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.*;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.text.TextElementComponentDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.segment.SegmentHandleDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.watermark.WatermarkHandleDependencyValueProducer;
import lombok.experimental.Delegate;

import java.util.HashMap;
import java.util.function.Function;

public abstract class InternalPdfBoxPrintEngineRuntimeFactory<Job extends PrintJob, Engine extends PrintEngine<?>> {

	private final InternalPdfBoxPrintEngineRuntimeApiFactory<Job, Engine> internalPdfBoxPrintEngineRuntimeApiFactory;
	private final CorePrintEngineRuntimeFactory<Job, Engine> internalCorePrintEngineRuntimeFactory;

	public InternalPdfBoxPrintEngineRuntimeFactory(
		CorePrintEngineRuntimeFactory<Job, Engine> internalCorePrintEngineRuntimeFactory
	) {
		this.internalPdfBoxPrintEngineRuntimeApiFactory = getInternalPdfBoxPrintEngineRuntimeApiFactory();
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

	public Function<Job, InternalPdfBoxPrintEngineRuntime> build(Engine engine) {
		final var enginePdfSpecific = getEngineDependentRuntimeApiFactory(engine, internalPdfBoxPrintEngineRuntimeApiFactory.toBuilder());
		final var engineCoreSpecific = internalCorePrintEngineRuntimeFactory.getEngineDependentRuntimeApiFactory(
			engine, internalCorePrintEngineRuntimeFactory.getInternalCorePrintEngineRuntimeApiFactory().toBuilder()
		);
		return job -> mapRuntime(
			new PrintEngineRuntimeDelegate(runtime ->
				internalCorePrintEngineRuntimeFactory.getJobDependentRuntimeApiFactory(job, engine, engineCoreSpecific.toBuilder())
						.postProcess(postProcess())
						.build(job, engine, runtime),
				runtime ->
					getJobDependentRuntimeApiFactory(job, engine, enginePdfSpecific.toBuilder())
						.postProcess(postProcess())
						.build(job, engine, runtime)
			)
		);
	}


	protected InternalPdfBoxPrintEngineRuntime mapRuntime(InternalPdfBoxPrintEngineRuntime runtime) {
		return runtime;
	}

	protected abstract com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntimeApiFactory<Job, Engine> getEngineDependentRuntimeApiFactory(
		Engine engine,
		InternalPdfBoxPrintEngineRuntimeApiFactory.Builder<Job, Engine> engineSpecificBuilder
	);

	protected abstract InternalPdfBoxPrintEngineRuntimeApiFactory<Job, Engine> getJobDependentRuntimeApiFactory(
		Job job,
		Engine engine,
		InternalPdfBoxPrintEngineRuntimeApiFactory.Builder<Job, Engine> jobSpecific
	);

	protected InternalPdfBoxPrintEngineRuntimeApiFactory<Job, Engine> getInternalPdfBoxPrintEngineRuntimeApiFactory() {
		return InternalPdfBoxPrintEngineRuntimeApiFactory
			.<Job, Engine> factory()
			.withProviderForReferenceComponentDependency(new ReferenceComponentDependencyValueProducer())
			.withProviderForElementComponentDependency(new ElementComponentDependencyDependencyValueProducer())

			.withProviderForImageComponentDependency(new ImageComponentDependencyValueProducer().asCacheable())
			.withProviderForChartComponentDependency(new ChartComponentDependencyValueProducer().asCacheable())
			.withProviderForFieldComponentDependency(new FieldComponentDependencyValueProducer().asCacheable())
			.withProviderForCalculationComponentDependency(new CalculationComponentDependencyValueProducer().asCacheable())
			.withProviderForLineComponentDependency(new LineComponentDependencyValueProducer().asCacheable())
			.withProviderForTableComponentDependency(new TableComponentDependencyValueProducer().asCacheable())
			.withProviderForTableLayoutComponentDependency(new TableLayoutComponentDependencyValueProducer().asCacheable())
			.withProviderForTextElementComponentDependency(new TextElementComponentDependencyValueProducer().asCacheable())
			.withProviderForListingComponentDependency(new ListingComponentDependencyValueProducer().asCacheable())

			.withProviderForSegmentHandleDependency(new SegmentHandleDependencyValueProducer())
			.withStreamProviderForSegmentHandleDependency(new SegmentHandleDependencyValueProducer())
			.withProviderForWatermarkHandleDependency(new WatermarkHandleDependencyValueProducer())
			.withStreamProviderForWatermarkHandleDependency(new WatermarkHandleDependencyValueProducer())
			.withStreamProviderForReferenceComponentDependency(new ReferenceComponentDependencyValueProducer())
			.withStreamProviderForElementComponentDependency(new ElementComponentDependencyDependencyValueProducer())

			.build();
	}


	protected static class PrintEngineRuntimeDelegate implements InternalPdfBoxPrintEngineRuntime {
		@Delegate(types = {InternalPdfBoxPrintEngineRuntimeApi.class})
		protected final InternalPdfBoxPrintEngineRuntimeApi InternalPdfBoxPrintEngineRuntime;

		@Delegate(types = {com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntimeApi.class})
		protected final InternalCorePrintEngineRuntimeApi internalCorePrintEngineRuntime;

		public PrintEngineRuntimeDelegate(
			Function<InternalPdfBoxPrintEngineRuntime, InternalCorePrintEngineRuntimeApi> coreFactory,
			Function<InternalPdfBoxPrintEngineRuntime, InternalPdfBoxPrintEngineRuntimeApi> pdfFactory
		) {
			this.InternalPdfBoxPrintEngineRuntime = pdfFactory.apply(this);
			this.internalCorePrintEngineRuntime = coreFactory.apply(this);
		}
	}


}

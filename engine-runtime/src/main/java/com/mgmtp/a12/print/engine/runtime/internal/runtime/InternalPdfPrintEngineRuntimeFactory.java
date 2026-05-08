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
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.attachments.AddAttachmentDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.ElementMarkupResultDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.ReferenceMarkupResultDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.container.area.AreaMarkupDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.container.boundingBox.BoundingBoxMarkupDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.container.switchCase.SwitchMarkupDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.listing.ListingMarkupDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.table.TableMarkupDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.tableLayout.TableLayoutMarkupDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.text.TextBasedElementMarkupDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.AddStylesToMarkupValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.merge.MergePDDocumentsDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.pdfBox.ContentInserterDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.pdfBox.InsertPDObjectsDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer.ModelSegmentPrintDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.segment.EmptySegmentDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.segment.SegmentMarkupResultDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.watermark.AddWatermarkDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.rendering.CssUtil;
import com.mgmtp.a12.print.engine.runtime.internal.generated.*;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntimeApi;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfPrintEngineRuntimeApi;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfPrintEngineRuntimeApiFactory;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.FinalYPositionDependencyValueProducer;
import lombok.experimental.Delegate;

import java.util.HashMap;
import java.util.function.Function;

public abstract class InternalPdfPrintEngineRuntimeFactory<Job extends PrintJob, Engine extends PrintEngine<?>> {

	private final InternalPdfPrintEngineRuntimeApiFactory<Job, Engine> internalPdfPrintEngineRuntimeApiFactory;
	private final CorePrintEngineRuntimeFactory<Job, Engine> internalCorePrintEngineRuntimeFactory;

	public InternalPdfPrintEngineRuntimeFactory(
		CorePrintEngineRuntimeFactory<Job, Engine> internalCorePrintEngineRuntimeFactory
	) {
		this.internalPdfPrintEngineRuntimeApiFactory = getInternalPdfPrintEngineRuntimeApiFactory();
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

	public Function<Job, InternalPdfPrintEngineRuntime> build(Engine engine) {
		final var enginePdfSpecific = getEngineDependentRuntimeApiFactory(engine, internalPdfPrintEngineRuntimeApiFactory.toBuilder());
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


	protected InternalPdfPrintEngineRuntime mapRuntime(InternalPdfPrintEngineRuntime runtime) {
		return runtime;
	}

	protected abstract InternalPdfPrintEngineRuntimeApiFactory<Job, Engine> getEngineDependentRuntimeApiFactory(
		Engine engine,
		InternalPdfPrintEngineRuntimeApiFactory.Builder<Job, Engine> engineSpecificBuilder
	);

	protected abstract InternalPdfPrintEngineRuntimeApiFactory<Job, Engine> getJobDependentRuntimeApiFactory(
		Job job,
		Engine engine,
		InternalPdfPrintEngineRuntimeApiFactory.Builder<Job, Engine> jobSpecific
	);

	protected CssUtil createCssUtil() {
		return new CssUtil();
	}

	protected InternalPdfPrintEngineRuntimeApiFactory<Job, Engine> getInternalPdfPrintEngineRuntimeApiFactory() {
		final var cssUtil = createCssUtil();
		final var elementMarkupResultProducer
			= new ElementMarkupResultDependencyValueProducer().asCacheable();
		final var referenceMarkupResultProducer
			= new ReferenceMarkupResultDependencyValueProducer().asCacheable();

		return InternalPdfPrintEngineRuntimeApiFactory
			.<Job, Engine> factory()
			.withProviderForModelSegmentPrintResultDependency(new ModelSegmentPrintDependencyValueProducer())
			.withProviderForMergePDDocumentDependency(new MergePDDocumentsDependencyValueProducer())
			.withProviderForAddAttachmentDependency(new AddAttachmentDependencyValueProducer())
			.withProviderForAddWatermarkDependency(new AddWatermarkDependencyValueProducer())
			.withProviderForAddStylesToMarkupDependency(new AddStylesToMarkupValueProducer())

			.withProviderForSegmentMarkupResultDependency(new SegmentMarkupResultDependencyValueProducer())
			.withProviderForEmptySegmentDependency(new EmptySegmentDependencyValueProducer())

			.withProviderForListingMarkupDependency(new ListingMarkupDependencyValueProducer(cssUtil))
			.withProviderForTableLayoutMarkupDependency(new TableLayoutMarkupDependencyValueProducer())
			.withProviderForTableMarkupDependency(new TableMarkupDependencyValueProducer(cssUtil))
			.withProviderForTextBasedElementMarkupDependency(new TextBasedElementMarkupDependencyValueProducer(cssUtil))
			.withProviderForBoundingBoxMarkupDependency(new BoundingBoxMarkupDependencyValueProducer())
			.withProviderForAreaMarkupDependency(new AreaMarkupDependencyValueProducer())
			.withProviderForSwitchMarkupDependency(new SwitchMarkupDependencyValueProducer())

			// pdfBox
			.withProviderForContentInserterDependency(new ContentInserterDependencyValueProducer())
			.withProviderForInsertPDObjectsDependency(new InsertPDObjectsDependencyValueProducer())

			// markup
			.withProviderForElementMarkupResultDependency(elementMarkupResultProducer)
			.withProviderForReferenceMarkupResultDependency(referenceMarkupResultProducer)

			// layout
			.withProviderForFinalYPositionDependency(new FinalYPositionDependencyValueProducer().asCacheable())

			// Stream Provider
			.withStreamProviderForModelSegmentPrintResultDependency(new ModelSegmentPrintDependencyValueProducer())
			.withStreamProviderForReferenceMarkupResultDependency(referenceMarkupResultProducer)
			.withStreamProviderForElementMarkupResultDependency(elementMarkupResultProducer)
			.withStreamProviderForContentInserterDependency(new ContentInserterDependencyValueProducer())
			.build();
	}


	protected static class PrintEngineRuntimeDelegate implements InternalPdfPrintEngineRuntime {
		@Delegate(types = {InternalPdfPrintEngineRuntimeApi.class})
		protected final InternalPdfPrintEngineRuntimeApi internalPdfPrintEngineRuntime;

		@Delegate(types = {InternalCorePrintEngineRuntimeApi.class})
		protected final InternalCorePrintEngineRuntimeApi internalCorePrintEngineRuntime;

		public PrintEngineRuntimeDelegate(
			Function<InternalPdfPrintEngineRuntime, InternalCorePrintEngineRuntimeApi> coreFactory,
			Function<InternalPdfPrintEngineRuntime, InternalPdfPrintEngineRuntimeApi> pdfFactory
		) {
			this.internalPdfPrintEngineRuntime = pdfFactory.apply(this);
			this.internalCorePrintEngineRuntime = coreFactory.apply(this);
		}
	}


}

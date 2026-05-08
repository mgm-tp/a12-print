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
import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.AttachmentJobDependency;
import com.mgmtp.a12.print.engine.runtime.internal.CoreDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.PrintModelJobDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.calculation.CalculationDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.chart.ChartDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.expression.ExpressionDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.field.FieldValueDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.image.ImageDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.listing.ListingDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.table.TableValuesDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.tableLayout.TableLayoutValuesDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.text.TextDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.expression.ExpressionEntityReplacerDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.fieldType.FieldTypeDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.fieldType.FieldTypeFromPathDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.formatter.FormattedValueDependencyProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.html.AddStylesToHtmlPdfDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.html.HtmlReplacementDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.html.SanitizePdfDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.id.IdPdfDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.AttachmentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.PrintModelDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markdown.MarkdownToHtmlDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.metadata.AccessibilityMetadataDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.referenceElementResolver.PrintModelReferenceElementDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.referenceResolver.ReferenceElementDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer.HtmlDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.restriction.PdfJobRestrictionContextDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.sectionResolver.SectionByIdDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.segmentResolver.SegmentByIdDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.textStyleResolver.TextStyleByIdDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.watermarkResolver.WatermarkByIdDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.rendering.CssUtil;
import com.mgmtp.a12.print.engine.runtime.internal.engine.rendering.HTMLCleanUpUtil;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntimeApiFactory;
import com.mgmtp.a12.print.engine.runtime.internal.manager.ManagedPrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompilationContext;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.walker.model.resolver.*;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.concurrent.ExecutorService;

@Builder(builderClassName = "Builder")
@Slf4j
@RequiredArgsConstructor
public class CorePrintEngineRuntimeFactory<Job extends PrintJob, Engine extends PrintEngine<?>> {

	private final ExecutorService executorService;

	protected InternalCorePrintEngineRuntimeApiFactory<Job, Engine> getEngineDependentRuntimeApiFactory(PrintEngine<?> engine, InternalCorePrintEngineRuntimeApiFactory.Builder<Job, Engine> engineSpecificBuilder) {
		var config = engine.getConfig();
		final var htmlCleanup = new HTMLCleanUpUtil(config.getAllowedHtmlTags(), config.getAllowedStyles());
		return engineSpecificBuilder
			.withProviderForSanitizeValueDependency(new SanitizePdfDependencyValueProducer(htmlCleanup))
			.withProviderForHtmlDependency(new HtmlDependencyValueProducer(config.getTemplateDirectory(), new CssUtil()))
			.build();
	}

	private static CoreDependencyValueProvider<PrintModel, PrintModelDependency> getPrintModelDependencyProvider(
		final PrintModelCompilationContext printModel,
		final ArrayList<JobDependencyProvider> providers
	) {
		return (dependency, job, engine, runtime) -> {
			if (dependency.getPrintModelId().equals(job.getPrintModelId())) {
				return () -> printModel;
			}

			final var printModelDependency = new PrintModelJobDependency(dependency::getPrintModelId);

			for (JobDependencyProvider provider : providers) {
				if (!provider.canProvide(printModelDependency)) {
					continue;
				}
				provider.provide(printModelDependency);
			}

			final var referencedPrintModel = printModelDependency.getPrintModel();
			if (referencedPrintModel.isEmpty()) {
				throw new PrintException("Missing PrintModel: " + dependency.getPrintModelId().getModelHeaderId());
			}

			return referencedPrintModel::get;
		};
	}

	protected InternalCorePrintEngineRuntimeApiFactory<Job, Engine> getJobDependentRuntimeApiFactory(PrintJob job, PrintEngine<?> engine, InternalCorePrintEngineRuntimeApiFactory.Builder<Job, Engine> jobSpecific) {
		if (job instanceof ManagedPrintJob) {
			addJobDependenciesFromManagedJob(jobSpecific, (ManagedPrintJob) job);
		}

		return jobSpecific.build();
	}

	private static CoreDependencyValueProvider<ByteArrayInputStream, AttachmentDependency> getAttachmentDependencyProvider(
		final ArrayList<JobDependencyProvider> providers
	) {
		return (dependency, job, engine, runtime) -> {
			final var attachmentJobDependency = new AttachmentJobDependency(dependency::getAttachmentId);

			var noMatchingProviderExists = true;
			for (JobDependencyProvider provider : providers) {
				if (!provider.canProvide(attachmentJobDependency)) {
					continue;
				}
				provider.provide(attachmentJobDependency);
				noMatchingProviderExists = false;
			}

			if (noMatchingProviderExists) {
				throw new PrintException(String.format(
					"There is no matching provider to load the attachment with the id %s", dependency.getAttachmentId()
				));
			}

			final var attachment = attachmentJobDependency.getAttachment();
			if (attachment.isEmpty()) {
				throw new PrintException("Missing Attachment: " + dependency.getAttachmentId());
			}

			return attachment::get;
		};
	}

	protected void addJobDependenciesFromManagedJob(
		InternalCorePrintEngineRuntimeApiFactory.Builder<Job, Engine> jobSpecific,
		ManagedPrintJob managedPrintJob
	) {
		final var printModel = managedPrintJob.getPrintModelCompilationContext();

		final var referenceResolver = ReferenceMultiModelResolver.fromModel(printModel);
		final var referenceProvider = new ReferenceElementDependencyValueProducer(referenceResolver);

		final var segmentResolver = SegmentIdListResolver.fromModel(printModel);
		final var segmentProvider = new SegmentByIdDependencyValueProducer(segmentResolver);

		final var sectionResolver = SectionIdListResolver.fromModel(printModel);
		final var sectionProvider = new SectionByIdDependencyValueProducer(sectionResolver);

		final var watermarkResolver = WatermarkIdListResolver.fromModel(printModel);
		final var watermarkProvider = new WatermarkByIdDependencyValueProducer(watermarkResolver);

		final var referenceElementResolver = ReferenceElementListResolver.fromModel(printModel);
		final var referenceElementProvider = new PrintModelReferenceElementDependencyValueProducer(referenceElementResolver);

		final var computationEvaluator
			= printModel.getLogicContainerEvaluationDependencyValueProducer();

		final var expressionEvaluator = printModel
			.getComputationExpressionDependencyValueProducer();

		final var providers = new ArrayList<>(managedPrintJob.getDataProviderList().keySet());

		final var textStyleResolver = TextStyleIdListResolver.fromModel(printModel);
		final var textStyleProvider = new TextStyleByIdDependencyValueProducer(textStyleResolver);

		jobSpecific
			.withProviderForPdfJobRestrictionContextDependency(
				new PdfJobRestrictionContextDependencyValueProducer(managedPrintJob.getRestriction())
			)
			// Job Bound DataProvider
			.withProviderForAttachmentDependency(getAttachmentDependencyProvider(providers))
			.withProviderForPrintModelDependency(getPrintModelDependencyProvider(printModel, providers))
			.withProviderForDocumentDependency(new PrintDocumentDependencyValueProducer(printModel, providers).asCacheable())
			.withProviderForDocumentModelDependency((dependency, job, engine, runtime) -> {
				var documentModel = printModel.getDocumentModelIndexMap().get(dependency.getDocumentModelId());
				if (documentModel == null) {
					throw new PrintException("Unable to resolve DocumentModel: " + dependency.getDocumentModelId());
				}
				return () -> documentModel;
			})
			.withProviderForLogicContainerEvaluationDependency(
				computationEvaluator
			)
			.withProviderForComputationExpressionDependency(
				expressionEvaluator
			)
			.withProviderForPreCompiledExpressionDependency(
				printModel.getPreCompiledExpressionMap()
			)
			.withProviderForComputeDocumentDependency(
				printModel.getComputeDocumentDependencyValueProducer().asCacheable()
			)
			.withProviderForPreCompiledListingDependency(
				printModel.getPreCompiledListingMap()
			)
			.withProviderForTextStyleDependency(textStyleProvider)
			// Model Bound Resolver
			.withProviderForReferenceElementDependency(referenceProvider)
			.withProviderForSegmentDependency(segmentProvider)
			.withProviderForSectionDependency(sectionProvider)
			.withProviderForWatermarkDependency(watermarkProvider)
			.withProviderForPrintModelReferenceElementDependency(referenceElementProvider)
			// Stream Provider
			.withStreamProviderForSegmentDependency(segmentProvider)
			.withStreamProviderForSectionDependency(sectionProvider)
			.withStreamProviderForWatermarkDependency(watermarkProvider)
			.withStreamProviderForLogicContainerEvaluationDependency(computationEvaluator)
			.withStreamProviderForComputationExpressionDependency(expressionEvaluator);
	}

	protected InternalCorePrintEngineRuntimeApiFactory<Job, Engine> getInternalCorePrintEngineRuntimeApiFactory() {
		return InternalCorePrintEngineRuntimeApiFactory
			.<Job, Engine> factory()
			.withProviderForFormattedValueDependency(new FormattedValueDependencyProducer().asCacheable())
			.withProviderForCalculationValueDependency(new CalculationDependencyValueProducer())
			.withProviderForFieldTypeFromPathValueDependency(new FieldTypeFromPathDependencyValueProducer())
			.withProviderForImageValueDependency(new ImageDependencyValueProducer())
			.withProviderForChartValueDependency(new ChartDependencyValueProducer())
			.withProviderForHtmlReplacementDependency(new HtmlReplacementDependencyValueProducer())
			.withProviderForAddStylesToHtmlDependency(new AddStylesToHtmlPdfDependencyValueProducer())
			.withProviderForTextValueDependency(new TextDependencyValueProducer())
			.withProviderForFieldValueDependency(new FieldValueDependencyValueProducer())
			.withProviderForFieldTypeDependency(new FieldTypeDependencyValueProducer())
			.withProviderForTableLayoutValuesDependency(new TableLayoutValuesDependencyValueProducer())
			.withProviderForNewIdDependency(new IdPdfDependencyValueProducer())
			.withProviderForListingValueDependency(new ListingDependencyValueProducer())
			.withProviderForTableValuesDependency(new TableValuesDependencyValueProducer())
			.withProviderForMarkdownToHtmlDependency(new MarkdownToHtmlDependencyValueProducer())
			.withProviderForExpressionEntityReplacerDependency(new ExpressionEntityReplacerDependencyValueProducer())
			.withProviderForExpressionValueDependency(new ExpressionDependencyValueProducer())
			.withProviderForAccessibilityMetadataDependency(new AccessibilityMetadataDependencyValueProducer().asCacheable())
			.build();
	}
}

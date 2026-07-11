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
package com.mgmtp.a12.print.engine.runtime.modelDocument;

import com.mgmtp.a12.model.utils.OnlyForUsage;
import com.mgmtp.a12.print.engine.api.ModelDocumentPrintResult;
import com.mgmtp.a12.print.engine.api.PdfBoxPrintEngineConfig;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintDomainException;
import com.mgmtp.a12.print.engine.api.message.PrintMessageReport;
import com.mgmtp.a12.print.engine.runtime.PrintEngine;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.DocumentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.PrintModelDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.metadata.AccessibilityMetadataDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.ContainerProviderDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.AttachmentWrapper;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.section.ModelDocumentSectionDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.section.ModelDocumentSectionResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.segment.ModelDocumentSegmentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.segment.ModelDocumentSegmentResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.watermark.ModelDocumentWatermarkDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.watermark.ModelDocumentWatermarkResult;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalModelDocumentPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.computation.ComputationExpression;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.LogicContainerEvaluationDependency;
import com.mgmtp.a12.print.engine.runtime.internal.message.PrintMessageCollector;
import com.mgmtp.a12.print.engine.runtime.internal.message.PrintMessageReportImpl;
import com.mgmtp.a12.print.engine.runtime.internal.runtime.ModelDocumentPrintEngineRuntimeFactory;
import com.mgmtp.a12.print.engine.runtime.internal.runtime.RuntimeWalker;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Variable;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.container.BaseReferenceContainer;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.element.base.DataContext;
import com.mgmtp.a12.print.model.api.model.element.properties.PageOrientation;
import com.mgmtp.a12.print.model.api.model.element.type.boundingBox.BoundingBox;
import com.mgmtp.a12.print.model.api.model.element.type.override.OverrideElement;
import com.mgmtp.a12.print.model.api.model.reference.ElementReference;
import com.mgmtp.a12.print.model.api.model.section.ModelSection;
import com.mgmtp.a12.print.model.api.model.segment.ModelSegment;
import com.mgmtp.a12.print.model.api.model.watermark.Watermark;
import com.mgmtp.a12.print.model.api.walker.DescendCommand;
import com.mgmtp.a12.print.model.api.walker.TraversalCommand;
import com.mgmtp.a12.print.model.api.walker.model.ExhaustivePrintModelVisitor;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;
import com.mgmtp.a12.print.model.document.internal.PrintModelDocument;
import com.mgmtp.a12.print.model.document.internal.attachments.PrintAttachment;
import com.mgmtp.a12.print.model.document.internal.section.PrintSection;
import com.mgmtp.a12.print.model.document.internal.segment.PrintSegment;
import com.mgmtp.a12.print.model.document.internal.watermark.PrintWatermark;
import lombok.Data;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.Value;
import lombok.extern.slf4j.Slf4j;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.io.OutputStream;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Provides the ability to execute {@link PrintJob}s.
 */
@OnlyForUsage
@Slf4j
public class ModelDocumentPrintEngine extends PrintEngine<ModelDocumentPrintResult> implements com.mgmtp.a12.print.engine.api.ModelDocumentPrintEngine {

	private static final ObjectMapper OBJECT_MAPPER = new JsonMapper();

	private final @NonNull ExecutorService executorService;
	@NonNull
	private final Function<PrintJob, InternalModelDocumentPrintEngineRuntime> runtimeFactory;

	/**
	 * @param service the ExecutorService that is used for the execution of concurrent processes.
	 */
	public ModelDocumentPrintEngine(
		@NonNull ExecutorService service,
		@NonNull PdfBoxPrintEngineConfig config
	) {
		super(config);
		this.runtimeFactory = ModelDocumentPrintEngineRuntimeFactory
			.builder()
			.executorService(service)
			.build()
			.build(this);
		this.executorService = service;
	}

	@Override
	public PrintMessageReport<ModelDocumentPrintResult> executeWithReport(PrintJob printJob) throws PrintException {
		try {
			return executorService.submit(() -> PrintMessageReportImpl.wrapException(() -> {
				final var result = printInternal(printJob, runtimeFactory.apply(printJob));
				return new PrintMessageReportImpl<>(result, PrintMessageCollector.getMessages());
			}, PrintException.class, PrintException::new)).get();
		} catch (ExecutionException | InterruptedException e) {
			throw new PrintException("PrintJob was interrupted due to: ", e);
		}
	}

	protected ModelDocumentPrintResult printInternal(
		PrintJob job,
		InternalModelDocumentPrintEngineRuntime runtime
	) {
		final PrintModel printModel = runtime.provide(
			new PrintModelDependency(job.getPrintModelId())
		).get();

		final var header = printModel.getHeader();
		final var documentModelReferences = header.getModelReferences().stream().filter(
			e -> e.getModelType().equals(Constants.DOCUMENT_MODEL_TYPE)
		).toList();

		if (documentModelReferences.size() > 1) {
			throw new PrintDomainException(
				"PrintModel '{}' supports only a single DocumentModel reference, but {} were found.",
				job.getPrintModelId().getModelHeaderId(), documentModelReferences.size());
		}

		var printDocumentContext = Optional.of(documentModelReferences)
			.filter(e -> !e.isEmpty())
			.map(t -> runtime.provide(
					new DocumentDependency(
						t.get(0).getReference()
					)).get()
			).orElse(null);

		final var attachments = new ArrayList<PrintAttachment>();

		final var segmentResults = getSegmentResults(
			runtime, printModel, printDocumentContext
		);
		segmentResults.forEach(res -> attachments.addAll(res.getAttachments()));

		final var watermarkResults = getWatermarks(runtime, printModel, printDocumentContext);
		final var collectedWatermarks = collectWatermarks(
			watermarkResults.stream().map(AttachmentWrapper::getElement).toList(), runtime, printDocumentContext
		);

		final var sectionResults = getSectionResults(
			runtime, printModel, printDocumentContext
		);
		sectionResults.forEach(res -> attachments.addAll(res.getAttachments()));
		final var sectionElements = sectionResults.stream().map(AttachmentWrapper::getElement).toList();

		final var segments = new ArrayList<PrintSegment>();
		for(var i = 0; i < segmentResults.size(); i++) {
			final var segmentResult = segmentResults.get(i).getElement();
			final var headerSections = new ArrayList<PrintSection>();
			final var footerSections = new ArrayList<PrintSection>();

			if (i == 0) {
				addSections(sectionElements, segmentResult, ModelSection.SectionUsage.FIRST, headerSections, footerSections);
			}

			addSections(sectionElements, segmentResult, ModelSection.SectionUsage.REMAINING, headerSections, footerSections);

			segments.add(new PrintSegment(
				segmentResult.getId(),
				segmentResult.getElements(),
				headerSections,
				footerSections,
				segmentResult.getPageOrientation(),
				collectedWatermarks.get(segmentResult.getPageOrientation()).orElse(null)
			));
		}

		final var runtimeMetadata = runtime.provide(
			new AccessibilityMetadataDependency(job.getPrintModelId(), printDocumentContext)
		).get();

		final var printModelDocument = new PrintModelDocument(
			segments,
			attachments,
			runtimeMetadata.getLanguage(),
			runtimeMetadata.getTitle(),
			runtimeMetadata.getAuthor(),
			runtimeMetadata.getDescription()
		);

		return new ModelDocumentPrintResult() {
			@Override
			public PrintModelDocument getPrintModelDocument() {
				return printModelDocument;
			}

			@Override
			public void copyTo(OutputStream outputStream) throws PrintException, IOException {
				outputStream.write(OBJECT_MAPPER.writeValueAsBytes(printModelDocument));
			}
		};
	}

	private void addSections(
		List<ModelDocumentSectionResult> sectionResults,
		ModelDocumentSegmentResult segmentResult,
		ModelSection.SectionUsage sectionUsage,
		List<PrintSection> headerSections,
		List<PrintSection> footerSections
	) {
		sectionResults.stream().filter(sectionResult ->
			sectionResult.getModelSection().getSectionUsage().equals(sectionUsage) &&
				sectionResult.getModelSection().getPageOrientation().equals(segmentResult.getPageOrientation())
		).findAny().ifPresent(section -> {
			final var modelSection = section.getModelSection();
			headerSections.add(new PrintSection(modelSection.getId(), section.getHeaderElements(), modelSection.getSectionUsage()));
			footerSections.add(new PrintSection(modelSection.getId(), section.getFooterElements(), modelSection.getSectionUsage()));
		});
	}

	private Map<PageOrientation, Optional<PrintWatermark>> collectWatermarks(
		@NonNull List<ModelDocumentWatermarkResult> watermarkResults,
		@NonNull InternalModelDocumentPrintEngineRuntime runtime,
		PrintDocumentContext printDocumentContext
	) {
		return Arrays.stream(PageOrientation.values()).collect(Collectors.toMap(
			pageOrientation -> pageOrientation,
			pageOrientation -> {
				final var result = watermarkResults.stream().filter(res ->
					res.getWatermarkTrace().getTracedElement().getPageOrientation().equals(pageOrientation)
				).findAny();

				return result.flatMap(res -> {
					final var watermark = res.getWatermarkTrace().getTracedElement();
					final var visible = runtime.provide(
						new LogicContainerEvaluationDependency(res.getWatermarkTrace(),
							new ComputationExpression.Parameters()
								.withPrintDocumentContext(printDocumentContext))
					).get();

					if (!watermark.getConditions().isEmpty() && visible.getValue().filter(e -> Objects.equals(e, true)).isEmpty()) {
						return Optional.empty();
					}

					return Optional.of(res.getWatermark());
				});
			}
		));
	}

	private List<AttachmentWrapper<ModelDocumentSegmentResult>> getSegmentResults(
		@NonNull InternalModelDocumentPrintEngineRuntime runtime,
		@NonNull PrintModel printModel,
		PrintDocumentContext printDocumentContext
	) {
		final var visitor = new ModelDocumentSegmentCollector(printDocumentContext);
		final var dependencies = new RuntimeWalker<>(runtime)
			.walkStructure(
				PrintModelPath.create(printModel),
				visitor,
				printModel.getContent().getGeneral().getStructure(),
				ModelDocumentSegmentCollector::getContainerDependencies
			)
			.stream()
			.map(ModelDocumentSegmentDependency.class::cast)
			.toList();

		dependencies.forEach(dep -> dep.setOverriddenBoundingBoxes(visitor.getOverriddenBoundingBoxes()));

		return runtime
			.streamModelDocumentSegmentDependency(dependencies.stream())
			.collect(Collectors.toList());
	}

	private List<AttachmentWrapper<ModelDocumentSectionResult>> getSectionResults(
		@NonNull InternalModelDocumentPrintEngineRuntime runtime,
		@NonNull PrintModel printModel,
		PrintDocumentContext printDocumentContext
	) {
		return runtime
			.streamModelDocumentSectionDependency(
				new RuntimeWalker<>(runtime)
					.walkSections(
						PrintModelPath.create(printModel),
						new ModelDocumentSegmentCollector(printDocumentContext),
						printModel.getContent().getGeneral().getSections(),
						ModelDocumentSegmentCollector::getContainerDependencies
					)
					.stream()
					.map(ModelDocumentSectionDependency.class::cast)
			)
			.collect(Collectors.toList());
	}

	private List<AttachmentWrapper<ModelDocumentWatermarkResult>> getWatermarks(
		@NonNull InternalModelDocumentPrintEngineRuntime runtime,
		@NonNull PrintModel printModel,
		PrintDocumentContext printDocumentContext
	) {
		return runtime
			.streamModelDocumentWatermarkDependency(
				new RuntimeWalker<>(runtime)
					.walkWatermarks(
						PrintModelPath.create(printModel),
						new ModelDocumentSegmentCollector(printDocumentContext),
						printModel.getContent().getGeneral().getWatermarks(),
						ModelDocumentSegmentCollector::getContainerDependencies
					)
					.stream()
					.map(ModelDocumentWatermarkDependency.class::cast)
			)
			.collect(Collectors.toList());
	}

	@Data
	@RequiredArgsConstructor
	private static class ModelDocumentSegmentCollector implements ExhaustivePrintModelVisitor {
		private final List<ContainerProviderDependency> containerDependencies = new ArrayList<>();
		private final PrintDocumentContext documentContext;

		private final HashMap<String, PrintModelTreeTrace<ModelSegment>> segmentsWithDinSegment = new HashMap<>();

		private final List<OverriddenBoundingBoxes> overriddenBoundingBoxes = new ArrayList<>();

		@Override
		public TraversalCommand visitSegment(ModelSegment segment, PrintModelPath path) {
			final var dinTemplate = segment.getDinTemplate();
			if (dinTemplate.isEmpty()) {
				final var segmentTrace = new PrintModelTreeTrace<>(
					path,
					segment
				);
				if (segment.getType().equals(ModelSegment.ModelSegmentType.REPEATABLE)) {
					final var repSegmentContext = segment.getDataContexts().stream()
						.filter(DataContext::isRepetition).findFirst();

					if (repSegmentContext.isPresent()) {
						final var documentContextRepetitions = documentContext
							.findRepetitions(Variable.abs(repSegmentContext.get().getPath()))
							.toList();

						for (final var repContext : documentContextRepetitions) {
							containerDependencies.add(new ModelDocumentSegmentDependency(
								segmentTrace,
								repContext,
								segment.getReferences().stream().map(segmentTrace::createDescendent).toList()
							));
						}
					}
				} else if (segment.getType().equals(ModelSegment.ModelSegmentType.DEFAULT)) {
					containerDependencies.add(new ModelDocumentSegmentDependency(
						segmentTrace,
						documentContext,
						segment.getReferences().stream().map(segmentTrace::createDescendent).toList()
					));
				} else {
					throw new PrintDomainException("The type {} of segment is not supported", segment.getType());
				}
			} else {
				segmentsWithDinSegment.put(dinTemplate.get().getRefId(), new PrintModelTreeTrace<>(
					path,
					segment
				));
			}
			return TraversalCommand.CONTINUE;
		}

		@Override
		public TraversalCommand visitDINTemplate(ModelSegment dinTemplate, PrintModelPath path) {
			final var relatedSegmentTrace = segmentsWithDinSegment.get(dinTemplate.getId());

			if (relatedSegmentTrace == null) {
				throw new PrintException("The corresponding segment was not visited before");
			}

			final var relatedSegment = relatedSegmentTrace.getTracedElement();

			containerDependencies.add(new ModelDocumentSegmentDependency(
				relatedSegmentTrace,
				documentContext,
				Stream.concat(
					relatedSegment.getReferences().stream().map(relatedSegmentTrace::createDescendent),
					dinTemplate.getReferences().stream().map(relatedSegmentTrace::createDescendent)
				).toList()
			));

			return TraversalCommand.CONTINUE;
		}

		@Override
		public TraversalCommand visitWatermark(Watermark watermark, PrintModelPath path) {
			containerDependencies.add(new ModelDocumentWatermarkDependency(
				new PrintModelTreeTrace<>(
					path,
					watermark
				),
				documentContext
			));
			return TraversalCommand.CONTINUE;
		}

		@Override
		public TraversalCommand visitSection(ModelSection section, PrintModelPath path) {
			containerDependencies.add(new ModelDocumentSectionDependency(
				new PrintModelTreeTrace<>(
					path,
					section
				),
				documentContext
			));
			return TraversalCommand.CONTINUE;
		}

		@Override
		public TraversalCommand visitOverriddenBoundingBox(BoundingBox boundingBox, PrintModelPath path, OverrideElement overrideElement) {
			overriddenBoundingBoxes.add(new OverriddenBoundingBoxes(boundingBox, path, overrideElement));
			return TraversalCommand.CONTINUE;
		}

		@Override
		public TraversalCommand defaultVisitElement(PrintModelElement element, PrintModelPath path) {
			return TraversalCommand.CONTINUE;
		}

		@Override
		public DescendCommand descendContainer(BaseReferenceContainer<? extends ElementReference> container,
											   PrintModelPath path, int index) {
			return DescendCommand.NO_DESCEND;
		}
	}

	@Value
	@OnlyForUsage
	public static class OverriddenBoundingBoxes {
		@NonNull BoundingBox boundingBox;
		@NonNull PrintModelPath path;
		@NonNull OverrideElement overrideElement;
	}
}


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
package com.mgmtp.a12.print.engine.runtime.pdfBox;

import com.mgmtp.a12.print.engine.api.PdfBoxPrintEngineConfig;
import com.mgmtp.a12.print.engine.api.PdfPrintResult;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintDomainException;
import com.mgmtp.a12.print.engine.api.message.PrintMessageReport;
import com.mgmtp.a12.print.engine.runtime.PrintEngine;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.DocumentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.PrintModelDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.AttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.metadata.AccessibilityMetadataDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.computation.ComputationExpression;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.LogicContainerEvaluationDependency;
import com.mgmtp.a12.print.engine.runtime.internal.message.PrintMessageCollector;
import com.mgmtp.a12.print.engine.runtime.internal.message.PrintMessageReportImpl;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.documentHandle.PDDocumentHandle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.documentHandle.SegmentDocumentHandle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.pdDocument.PDDocumentInitializer;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.ContentStreamAdapter;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.segment.SegmentHandleDependency;
import com.mgmtp.a12.print.engine.runtime.internal.runtime.PdfBoxPrintEngineRuntimeFactory;
import com.mgmtp.a12.print.engine.runtime.internal.runtime.RuntimeWalker;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Variable;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.container.BaseReferenceContainer;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.element.base.DataContext;
import com.mgmtp.a12.print.model.api.model.element.properties.PageOrientation;
import com.mgmtp.a12.print.model.api.model.reference.ElementReference;
import com.mgmtp.a12.print.model.api.model.section.ModelSection;
import com.mgmtp.a12.print.model.api.model.section.ModelSectionContainer;
import com.mgmtp.a12.print.model.api.model.segment.ModelSegment;
import com.mgmtp.a12.print.model.api.model.watermark.Watermark;
import com.mgmtp.a12.print.model.api.walker.DescendCommand;
import com.mgmtp.a12.print.model.api.walker.TraversalCommand;
import com.mgmtp.a12.print.model.api.walker.model.ExhaustivePrintModelVisitor;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;
import lombok.Data;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.apache.pdfbox.pdmodel.PDDocument;

import java.io.IOException;
import java.io.OutputStream;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.function.Function;
import java.util.stream.Collectors;
import com.mgmtp.a12.model.utils.OnlyForUsage;

/**
 * Provides the ability to execute {@link PrintJob}s.
 */
@OnlyForUsage
@Slf4j
public class PdfBoxPrintEngine extends PrintEngine<PdfPrintResult> implements com.mgmtp.a12.print.engine.api.PdfBoxPrintEngine {

	private final @NonNull ExecutorService executorService;
	private final @NonNull Function<PrintJob, InternalPdfBoxPrintEngineRuntime> runtimeFactory;

	/**
	 * @param service the ExecutorService that is used for the execution of concurrent processes.
	 * @param config the relevant {@link PdfBoxPrintEngineConfig}
	 */
	public PdfBoxPrintEngine(@NonNull ExecutorService service, @NonNull PdfBoxPrintEngineConfig config) {
		super(config);
		this.runtimeFactory = PdfBoxPrintEngineRuntimeFactory
			.builder()
			.executorService(service)
			.build()
			.build(this);
		this.executorService = service;
	}

	@Override
	public PrintMessageReport<PdfPrintResult> executeWithReport(PrintJob printJob) throws PrintException {
		try {
			return executorService.submit(() -> PrintMessageReportImpl.wrapException(() -> {
				final var resultDocument = printInternal(printJob, runtimeFactory.apply(printJob));
				return new PrintMessageReportImpl<>(resultDocument, PrintMessageCollector.getMessages());
			}, PrintException.class, PrintException::new)).get();
		} catch (ExecutionException | InterruptedException e) {
			throw new PrintException("PrintJob was interrupted due to:", e);
		}
	}

	protected PdfPrintResult printInternal(
		PrintJob job,
		InternalPdfBoxPrintEngineRuntime runtime
	) {
		final PrintModel printModel = runtime.provide(new PrintModelDependency(job.getPrintModelId())).get();
		final var documentModelReferences = printModel.getHeader().getModelReferences().stream().filter(
			e -> e.getModelType().equals(Constants.DOCUMENT_MODEL_TYPE)
		).toList();

		if (documentModelReferences.size() > 1) {
			throw new PrintDomainException(
				"PrintModel '{}' supports only a single DocumentModel reference, but {} were found.",
				job.getPrintModelId().getModelHeaderId(), documentModelReferences.size());
		}

		final var printDocumentContext = Optional.of(documentModelReferences)
			.filter(e -> !e.isEmpty())
			.map(t -> runtime.provide(new DocumentDependency(t.getFirst().getReference())).get()
			).orElse(null);

		final var accessibilityMetadata = runtime.provide(
			new AccessibilityMetadataDependency(job.getPrintModelId(), printDocumentContext)
		).get();

		final var pdDocument = PDDocumentInitializer.initialize(
			accessibilityMetadata,
			job.getTimeZone()
		);
		final var sections = getSections(printModel);
		final var segmentHandles = getSegmentHandles(runtime, printModel, printDocumentContext, pdDocument, sections);

		final var overallContentStreams = new ArrayList<ContentStreamAdapter>();
		final var attachmentsToAppend = new LinkedHashMap<String, AttachmentToAppend>();
		final var totalPageCount = segmentHandles.stream().mapToInt(SegmentDocumentHandle::getAdapterStreamCount).sum();

		int pageNumberOffset = 0;
		for (final var segmentHandle : segmentHandles) {
			final var streams = segmentHandle.getAdaptersWithSection(
				runtime, printDocumentContext, totalPageCount, pageNumberOffset
			);
			attachmentsToAppend.putAll(segmentHandle.getAttachmentsToAppend());
			overallContentStreams.addAll(streams);
			pageNumberOffset += streams.size();
		}

		final var documentHandle = new PDDocumentHandle(overallContentStreams, attachmentsToAppend, pdDocument);
		final var watermarks = getWatermarks(runtime, printDocumentContext, printModel);
		documentHandle.finalizePages(watermarks, runtime, printDocumentContext);

		return outputStream -> {
			try (pdDocument) {
				pdDocument.save(new OutputStream() {
					@Override
					public void write(int b) throws IOException {
						outputStream.write(b);
					}

					@Override
					public void flush() throws IOException {
						outputStream.flush();
					}
				});
			}
		};
	}

	private Map<ImmutablePair<PageOrientation, Boolean>, ModelSection> getSections(PrintModel printModel) {
		final var sectionMap = new HashMap<ImmutablePair<PageOrientation, Boolean>, ModelSection>();
		final var sections = printModel.getContent().getSections().map(ModelSectionContainer::getDefinitions).orElse(List.of());
		for (final var section : sections) {
			sectionMap.put(
				new ImmutablePair<>(section.getPageOrientation(), section.getSectionUsage().equals(ModelSection.SectionUsage.FIRST)),
				section
			);
		}
		return sectionMap;
	}

	private List<PrintModelTreeTrace<Watermark>> getWatermarks(
		@NonNull InternalPdfBoxPrintEngineRuntime runtime,
		PrintDocumentContext printDocumentContext,
		@NonNull PrintModel printModel
	) {
		return new RuntimeWalker<>(runtime)
			.walkWatermarks(
				PrintModelPath.create(printModel),
				new WatermarksCollector(runtime, printDocumentContext),
				printModel.getContent().getGeneral().getWatermarks(),
				WatermarksCollector::getWatermarks
			);
	}

	private List<SegmentDocumentHandle> getSegmentHandles(
		@NonNull InternalPdfBoxPrintEngineRuntime runtime,
		@NonNull PrintModel printModel,
		PrintDocumentContext printDocumentContext,
		@NonNull PDDocument pdDocument,
		Map<ImmutablePair<PageOrientation, Boolean>, ModelSection> sections
	) {
		return runtime
			.streamSegmentHandleDependency(
				new RuntimeWalker<>(runtime)
					.walkStructure(
						PrintModelPath.create(printModel),
						new ModelSegmentCollector(printDocumentContext, pdDocument, sections),
						printModel.getContent().getGeneral().getStructure(),
						ModelSegmentCollector::getSegmentHandleDependencies
					)
					.stream()
			)
			.collect(Collectors.toList());
	}

	@Data
	@RequiredArgsConstructor
	private static class WatermarksCollector implements ExhaustivePrintModelVisitor {
		@NonNull
		private final InternalPdfBoxPrintEngineRuntime runtime;
		private final PrintDocumentContext documentContext;

		private final List<PrintModelTreeTrace<Watermark>> watermarks = new ArrayList<>();

		@Override
		public TraversalCommand visitWatermark(Watermark watermark, PrintModelPath path) {
			final var trace = new PrintModelTreeTrace<>(path, watermark);
			final var visible = runtime.provide(
				new LogicContainerEvaluationDependency(trace,
					new ComputationExpression.Parameters()
						.withPrintDocumentContext(documentContext))
			).get();

			if (watermark.getConditions().isEmpty() || visible.getValue().filter(e -> Objects.equals(e, true)).isPresent()) {
				watermarks.add(new PrintModelTreeTrace<>(path, watermark));
			}

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

	@Data
	@RequiredArgsConstructor
	private static class ModelSegmentCollector implements ExhaustivePrintModelVisitor {
		private final List<SegmentHandleDependency> segmentHandleDependencies = new ArrayList<>();
		private final PrintDocumentContext documentContext;
		@NonNull
		private final PDDocument pdDocument;
		private final Map<ImmutablePair<PageOrientation, Boolean>, ModelSection> sections;

		private boolean isFirstSectionInUse = false;

		@Override
		public TraversalCommand visitSegment(ModelSegment segment, PrintModelPath path) {
			if (segment.getType().equals(ModelSegment.ModelSegmentType.REPEATABLE)) {
				final var repSegmentContext = segment.getDataContexts().stream()
					.filter(DataContext::isRepetition).findFirst();

				if (repSegmentContext.isPresent()) {
					final var documentContextRepetitions = documentContext
						.findRepetitions(Variable.abs(repSegmentContext.get().getPath()))
						.toList();

					for (final var repContext : documentContextRepetitions) {
						addSegmentDependency(segment, path, repContext);
					}
				}
			} else if (segment.getType().equals(ModelSegment.ModelSegmentType.DEFAULT)) {
				addSegmentDependency(segment, path, documentContext);
			} else {
				throw new PrintDomainException("The type {} of segment is not supported", segment.getType());
			}

			return TraversalCommand.CONTINUE;
		}

		private void addSegmentDependency(
			ModelSegment segment,
			PrintModelPath path,
			PrintDocumentContext context
		) {
			ModelSection firstSection = null;
			if (!isFirstSectionInUse) {
				firstSection = sections.get(new ImmutablePair<>(segment.getPageOrientation(), true));
				isFirstSectionInUse = true;
			}
			final var remainingSection = sections.get(new ImmutablePair<>(segment.getPageOrientation(), false));

			segmentHandleDependencies.add(new SegmentHandleDependency(
				new PrintModelTreeTrace<>(
					path,
					segment
				),
				context,
				pdDocument,
				firstSection,
				remainingSection
			));
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
}

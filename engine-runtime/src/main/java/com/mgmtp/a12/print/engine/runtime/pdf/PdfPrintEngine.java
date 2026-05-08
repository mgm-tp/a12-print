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
package com.mgmtp.a12.print.engine.runtime.pdf;

import com.mgmtp.a12.print.engine.api.PdfPrintResult;
import com.mgmtp.a12.print.engine.api.PrintEngineConfig;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintCompilerException;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.PrintEngine;
import com.mgmtp.a12.print.engine.runtime.internal.CustomXRLogger;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocument;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.pdfBox.PDObjectInsertionResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.pdfBox.PDPageRemover;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.attachments.AddAttachmentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.DocumentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.PrintModelDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.AttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.MarkupCollectorDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.merge.MergePDDocumentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.pdfBox.InsertPDObjectsDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer.ModelSegmentPrintResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer.ModelSegmentPrintResultDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.restriction.PdfJobRestrictionContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.restriction.PdfJobRestrictionContextDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.segment.EmptySegmentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.watermark.AddWatermarkDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.watermark.AddWatermarkResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.rendering.MarkupCollectorKey;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.runtime.PdfPrintEngineRuntimeFactory;
import com.mgmtp.a12.print.engine.runtime.internal.runtime.RuntimeWalker;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Variable;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.container.BaseReferenceContainer;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.element.base.DataContext;
import com.mgmtp.a12.print.model.api.model.element.type.pageNumber.PageNumber;
import com.mgmtp.a12.print.model.api.model.reference.ElementReference;
import com.mgmtp.a12.print.model.api.model.segment.ModelSegment;
import com.mgmtp.a12.print.model.api.model.watermark.Watermark;
import com.mgmtp.a12.print.model.api.walker.DescendCommand;
import com.mgmtp.a12.print.model.api.walker.TraversalCommand;
import com.mgmtp.a12.print.model.api.walker.model.ExhaustivePrintModelVisitor;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelVisitor;
import com.openhtmltopdf.util.XRLog;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.cos.COSDictionary;
import org.apache.pdfbox.pdmodel.PDDocument;

import java.io.IOException;
import java.io.OutputStream;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Provides the ability to execute {@link PrintJob}s.
 * @deprecated since version 3.1.0
 * Will be replaced with {@link com.mgmtp.a12.print.engine.runtime.pdfBox.PdfBoxPrintEngine} in 4.0.0 (2026.06)
 */
@Slf4j
@Deprecated(since = "3.1.0")
public class PdfPrintEngine extends PrintEngine<PdfPrintResult> implements com.mgmtp.a12.print.engine.api.PdfPrintEngine {

	@Getter
	private final boolean includeHtmlMarkup;

	private final @NonNull ExecutorService executorService;
	@NonNull
	private final Function<PrintJob, InternalPdfPrintEngineRuntime> runtimeFactory;

	public PdfPrintEngine(@NonNull ExecutorService service, @NonNull PrintEngineConfig config) {
		this(service, config, false);
	}

	/**
	 * @param service the ExecutorService that is used for the execution of concurrent processes.
	 * @param config the relevant {@link PrintEngineConfig}
	 * @param includeHtmlMarkup if the {@link PdfPrintResult} should include the HTML from which the PDF-file was created. Useful for debugging purposes.
	 */
	public PdfPrintEngine(
		@NonNull ExecutorService service,
		@NonNull PrintEngineConfig config,
		boolean includeHtmlMarkup
	) {
		super(config);
		this.includeHtmlMarkup = includeHtmlMarkup;
		this.runtimeFactory = PdfPrintEngineRuntimeFactory
			.builder()
			.executorService(service)
			.build()
			.build(this);
		this.executorService = service;
		XRLog.setLoggerImpl(new CustomXRLogger());
	}

	/**
	 * @param printJob
	 * @return
	 * @throws PrintException if the print operation was interrupted by any exception.
	 */
	@Override
	public PdfPrintResult execute(PrintJob printJob) throws PrintException {
		try {
			return executorService.submit(() -> printInternal(printJob, runtimeFactory.apply(printJob))).get();
		} catch (PrintCompilerException | PrintException e) {
			throw e;
		} catch (Exception e) {
			throw new PrintException("PrintJob was interrupted due to:",e);
		}
	}

	protected PdfPrintResult printInternal(
		PrintJob job,
		InternalPdfPrintEngineRuntime runtime
	) {
		final PrintModel printModel = runtime.provide(
			new PrintModelDependency(job.getPrintModelId())
		).get();

		final var documentModelReferences = printModel.getHeader().getModelReferences().stream().filter(
			e -> e.getModelType().equals(Constants.DOCUMENT_MODEL_TYPE)
		).toList();

		if (documentModelReferences.size() > 1) {
			throw new PrintException("PrintModel currently does only support single DocumentModel References");
		}

		var printDocumentContext = Optional.of(documentModelReferences)
			.filter(e -> !e.isEmpty())
			.map(t -> runtime.provide(
					new DocumentDependency(t.getFirst().getReference())
				).map(PrintDocument::context).get()
			).orElse(null);

		final LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend = new LinkedHashMap<>();

		final var watermarkPrintResults = getWatermarkPrintResults(
			runtime, printModel, printDocumentContext
		);
		final var watermarkInsertResults = insertPDObjects(
			runtime,
			printDocumentContext,
			attachmentsToAppend,
			watermarkPrintResults,
			0,
			new ArrayList<>(),
			0,
			null
		);

		final var modelSegmentPrintResults = getSegmentPrintResults(
			runtime, printModel, printDocumentContext
		);
		final var totalPageCount = modelSegmentPrintResults.stream().mapToInt(res -> res.getPdDocument().getNumberOfPages()).sum();
		final var sectionsToRenderPerPage = getSectionsToRenderPerPage(runtime, printModel);

		final var jobRestrictionContext = runtime.provide(new PdfJobRestrictionContextDependency()).get();

		final var segmentInsertResults = insertPDObjects(
			runtime,
			printDocumentContext,
			attachmentsToAppend,
			modelSegmentPrintResults,
			totalPageCount,
			sectionsToRenderPerPage,
			jobRestrictionContext.getInclusivePageRangeStart(),
			jobRestrictionContext.getInclusivePageRangeEnd().orElse(null)
		);

		if (modelSegmentPrintResults.isEmpty()) {
			if (includeHtmlMarkup) {
				return ResultWithMarkups.builder().segmentHtmlMarkup(new ArrayList<>()).result(e -> {
				}).build();
			} else {
				return PdfPrintResult.empty();
			}
		}

		subsetAllFonts(segmentInsertResults, watermarkInsertResults);

		final var pdDocuments = new ArrayList<PDDocument>();
		final Optional<ArrayList<String>> includedHtmlMarkupResults = includeHtmlMarkup
			? Optional.of(new ArrayList<>())
			: Optional.empty();

		final var markupCollector = runtime.provide(new MarkupCollectorDependency()).get().orElse(null);
		final var markupCombiner = new MarkupCombiner(markupCollector);
		for (var result : segmentInsertResults) {
			if (includeHtmlMarkup) {
				final var segmentMarkup = markupCombiner.combineMarkupForSegment(
					new MarkupCollectorKey(result.getId(), printDocumentContext)
				);
				includedHtmlMarkupResults.ifPresent(m -> m.add(segmentMarkup));
			}
			pdDocuments.add(result.getPdDocument());
		}

		final PDDocument pdDocument = mergeSegmentPDDocuments(runtime, segmentInsertResults, printModel, pdDocuments);

		final var attachmentDocuments = new ArrayList<PDDocument>();
		PDDocument pdDocumentWithAttachments = handleAttachments(
			runtime,
			attachmentsToAppend,
			jobRestrictionContext,
			pdDocument,
			printModel,
			attachmentDocuments,
			segmentInsertResults,
			modelSegmentPrintResults
		);

		// add watermarks
		PDDocument pdDocumentWithWatermarks = pdDocumentWithAttachments;
		final var watermarkDocuments = new ArrayList<PDDocument>();
		if (!watermarkPrintResults.isEmpty() && pdDocumentWithWatermarks.getNumberOfPages() != 0) {
			final var watermarkResult = runtime.provide(new AddWatermarkDependency(
				pdDocumentWithAttachments,
				watermarkPrintResults,
				printDocumentContext
			)).get();

			pdDocumentWithWatermarks = watermarkResult.getResultDocument();
			watermarkDocuments.addAll(watermarkResult.getWatermarkResults().values().stream()
				.flatMap(Optional::stream)
				.map(AddWatermarkResult.WatermarkResult::getDocument)
				.toList());
		}

		final var finalPdDocument = pdDocumentWithWatermarks;
		final PdfPrintResult pdfPrintResult = outputStream -> {
			try (finalPdDocument; finalPdDocument) {
				finalPdDocument.save(new OutputStream() {
					@Override
					public void write(int b) throws IOException {
						outputStream.write(b);
					}

					@Override
					public void flush() throws IOException {
						outputStream.flush();
					}
				});

				// we need to close the documents after saving the origin document, because the origin
				// document uses resources from the documents and must therefore be closed beforehand
				Stream.of(
					watermarkDocuments.stream(),
					attachmentDocuments.stream(),
					pdDocuments.stream(),
					segmentInsertResults.stream().map(PDObjectInsertionResult::getElementPDDocumentsToClose).flatMap(Set::stream),
					watermarkInsertResults.stream().map(PDObjectInsertionResult::getElementPDDocumentsToClose).flatMap(Set::stream)
				).flatMap(el -> el).forEach(doc -> {
					try {
						doc.close();
					} catch (IOException e) {
						throw new PrintException(
							String.format("The document cannot be closed: %s", e.getMessage())
						);
					}
				});
			}
		};

		return includedHtmlMarkupResults.map(m ->
			(PdfPrintResult) ResultWithMarkups
				.builder()
				.segmentHtmlMarkup(m)
				.result(pdfPrintResult)
				.build()
		).orElse(pdfPrintResult);
	}

	private static PDDocument handleAttachments(
		InternalPdfPrintEngineRuntime runtime,
		LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend,
		PdfJobRestrictionContext jobRestrictionContext,
		PDDocument pdDocument,
		PrintModel printModel,
		ArrayList<PDDocument> attachmentDocuments,
		List<PDObjectInsertionResult> segmentInsertResults,
		List<ModelSegmentPrintResult> modelSegmentPrintResults
	) {
		PDDocument pdDocumentWithAttachments = pdDocument;
		final var currentPageCount = jobRestrictionContext.getInclusivePageRangeStart() + pdDocument.getNumberOfPages();
		if (
			!attachmentsToAppend.isEmpty() &&
			jobRestrictionContext.getInclusivePageRangeEnd().orElse(currentPageCount + 1) >= currentPageCount
		) {
			// add attachments
			final var addAttachmentResult = runtime.provide(new AddAttachmentDependency(
				pdDocument,
				attachmentsToAppend,
				printModel.getContent().getGeneral().getDetails().getLanguage()
			)).get();
			pdDocumentWithAttachments = addAttachmentResult.getCombinedDocument();
			attachmentDocuments.addAll(addAttachmentResult.getDocumentsToClose());

			final var removedPages = new ArrayList<COSDictionary>();
			var numberOfPages = jobRestrictionContext.getInclusivePageRangeStart() + pdDocumentWithAttachments.getNumberOfPages();
			if (segmentInsertResults.isEmpty()) {
				final var originNumberOfPages = modelSegmentPrintResults.stream().mapToInt(res -> res.getPdDocument().getNumberOfPages()).sum();

				removedPages.addAll(
					PDPageRemover.remove(pdDocumentWithAttachments, jobRestrictionContext.getInclusivePageRangeStart() - originNumberOfPages, true)
				);
			}
			final var exclusiveEnd = jobRestrictionContext.getExclusivePageRangeEnd();
			if (exclusiveEnd.isPresent()) {
				numberOfPages = numberOfPages - removedPages.size();
				removedPages.addAll(
					PDPageRemover.remove(pdDocumentWithAttachments, numberOfPages - exclusiveEnd.get(), false)
				);
			}
			PDPageRemover.deleteElementsWithRemovedPage(pdDocumentWithAttachments, removedPages);
		}
		return pdDocumentWithAttachments;
	}

	private static void subsetAllFonts(List<PDObjectInsertionResult> segmentInsertResults, List<PDObjectInsertionResult> watermarkInsertResults) {
		Stream.concat(
			segmentInsertResults.stream().map(PDObjectInsertionResult::getFontsToSubset).flatMap(Set::stream),
			watermarkInsertResults.stream().map(PDObjectInsertionResult::getFontsToSubset).flatMap(Set::stream)
		).collect(Collectors.toSet()).forEach(font -> {
			if (font.willBeSubset()) {
				try {
					font.subset();
				} catch (IOException e) {
					throw new PrintException(String.format("The font cannot be subset: %s", e.getMessage()));
				}
			}
		});
	}

	private static PDDocument mergeSegmentPDDocuments(InternalPdfPrintEngineRuntime runtime, List<PDObjectInsertionResult> segmentInsertResults, PrintModel printModel, ArrayList<PDDocument> pdDocuments) {
		final PDDocument pdDocument;
		if (segmentInsertResults.isEmpty()) {
			pdDocument = runtime.provide(new EmptySegmentDependency(printModel.getContent().getGeneral())).get();
			pdDocument.removePage(0);
		} else if (segmentInsertResults.size() > 1) {
			pdDocument = runtime.provide(new MergePDDocumentDependency(pdDocuments)).get();
		} else {
			pdDocument = pdDocuments.getFirst();
		}
		return pdDocument;
	}

	private List<PDObjectInsertionResult> insertPDObjects(
		@NonNull InternalPdfPrintEngineRuntime runtime,
		PrintDocumentContext printDocumentContext,
		@NonNull LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend,
		@NonNull List<ModelSegmentPrintResult> modelSegmentPrintResults,
		int totalPageCount,
		@NonNull List<String> sectionsToRenderPerPage,
		int rangeStart,
		Integer rangeEnd
	) {
		if (modelSegmentPrintResults.isEmpty()) {
			return new ArrayList<>();
		}

		final var insertPDObjectsResult = runtime.provide(new InsertPDObjectsDependency(
				printDocumentContext,
				modelSegmentPrintResults,
				totalPageCount,
				sectionsToRenderPerPage,
				rangeStart,
				rangeEnd
		)).get();

		attachmentsToAppend.putAll(insertPDObjectsResult.getAttachmentsToAppend());

		return insertPDObjectsResult.getPdObjectInsertionResults();
	}

	private List<String> getSectionsToRenderPerPage(
		@NonNull InternalPdfPrintEngineRuntime runtime,
		@NonNull PrintModel printModel
	) {
		return new RuntimeWalker<>(runtime)
			.walkSections(
				PrintModelPath.create(printModel),
				new PageNumberCollector(),
				printModel.getContent().getGeneral().getSections(),
				PageNumberCollector::getSectionsToRenderPerPage
			);
	}

	private List<ModelSegmentPrintResult> getSegmentPrintResults(
		@NonNull InternalPdfPrintEngineRuntime runtime,
		@NonNull PrintModel printModel,
		PrintDocumentContext printDocumentContext
	) {
		return runtime
			.streamModelSegmentPrintResultDependency(
				new RuntimeWalker<>(runtime)
					.walkStructure(
						PrintModelPath.create(printModel),
						new ModelSegmentCollector(printDocumentContext, runtime),
						printModel.getContent().getGeneral().getStructure(),
						ModelSegmentCollector::getModelSegmentPrintResultDependencies
					)
					.stream()
			)
			.collect(Collectors.toList());
	}

	private List<ModelSegmentPrintResult> getWatermarkPrintResults(
		@NonNull InternalPdfPrintEngineRuntime runtime,
		@NonNull PrintModel printModel,
		PrintDocumentContext printDocumentContext
	) {
		return runtime
			.streamModelSegmentPrintResultDependency(
				new RuntimeWalker<>(runtime)
					.walkWatermarks(
						PrintModelPath.create(printModel),
						new ModelSegmentCollector(printDocumentContext, runtime),
						printModel.getContent().getGeneral().getWatermarks(),
						ModelSegmentCollector::getModelSegmentPrintResultDependencies
					)
					.stream()
			)
			.collect(Collectors.toList());
	}

	@Data
	@RequiredArgsConstructor
	private static class ModelSegmentCollector implements ExhaustivePrintModelVisitor {
		private final List<ModelSegmentPrintResultDependency> modelSegmentPrintResultDependencies = new ArrayList<>();
		private final PrintDocumentContext documentContext;
		private final InternalPdfPrintEngineRuntime runtime;

		private int count = -1;

		@Override
		public TraversalCommand visitSegment(ModelSegment segment, PrintModelPath path) {
			if (segment.getType().equals(ModelSegment.ModelSegmentType.REPEATABLE)) {
				final var repSegmentContext = segment.getDataContexts().stream()
					.filter(DataContext::isRepetition).findFirst();

				if (repSegmentContext.isPresent()) {
					final var documentContextRepetitions = documentContext
						.findRepetitions(Variable.abs(repSegmentContext.get().getPath()))
						.toList();

					final var segmentComments = new StringBuilder();
					var repeatableSegmentIndex = 0;
					for (final var repContext : documentContextRepetitions) {
						addSegmentDependency(segment, path, repContext, repeatableSegmentIndex);
						repeatableSegmentIndex++;
						segmentComments.append(
							new MarkupCollectorKey(segment.getId(), repContext).getElementComment()
						);
					}

					runtime.provide(new MarkupCollectorDependency()).get().ifPresent(col -> col.add(
						new MarkupCollectorKey(segment.getId(), documentContext),
						segmentComments.toString())
					);
				}
			} else if (segment.getType().equals(ModelSegment.ModelSegmentType.DEFAULT)) {
				addSegmentDependency(segment, path, documentContext, null);
			} else {
				throw new PrintException("The type {} of segment is not supported", segment.getType());
			}

			return TraversalCommand.CONTINUE;
		}

		private void addSegmentDependency(
			ModelSegment segment,
			PrintModelPath path,
			PrintDocumentContext context,
			Integer repeatableSegmentIndex
		) {
			modelSegmentPrintResultDependencies.add(new ModelSegmentPrintResultDependency(
				count,
				new PrintModelTreeTrace<>(
					path,
					segment
				),
				context,
				repeatableSegmentIndex
			));
			count++;
		}

		@Override
		public TraversalCommand visitWatermark(Watermark watermark, PrintModelPath path) {
			modelSegmentPrintResultDependencies.add(new ModelSegmentPrintResultDependency(
				count,
				new PrintModelTreeTrace<>(
					path,
					watermark
				),
				documentContext,
				null
			));
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
	@Builder
	@AllArgsConstructor
	public static class ResultWithMarkups implements PdfPrintResult {
		@NonNull
		private final List<String> segmentHtmlMarkup;
		@NonNull
		private final PdfPrintResult result;

		@Override
		public void copyTo(OutputStream outputStream) throws IOException, PrintException {
			result.copyTo(outputStream);
		}
	}

	@Data
	@RequiredArgsConstructor
	private static class PageNumberCollector implements PrintModelVisitor {
		private List<String> sectionsToRenderPerPage = new ArrayList<>();

		@Override
		public TraversalCommand visitPageNumber(PageNumber pageNumber, PrintModelPath path) {
			final var parentTopLevelReferenceContainer = path.findParentTopLevelReferenceContainer().orElseThrow(() -> new PrintException(
				String.format("The page number element %s does not have a section as parent", pageNumber.getId())
			)).getTracedElement();

			if (!sectionsToRenderPerPage.contains(parentTopLevelReferenceContainer.getId())) {
				sectionsToRenderPerPage.add(parentTopLevelReferenceContainer.getId());
			}
			return TraversalCommand.CONTINUE;
		}
	}
}

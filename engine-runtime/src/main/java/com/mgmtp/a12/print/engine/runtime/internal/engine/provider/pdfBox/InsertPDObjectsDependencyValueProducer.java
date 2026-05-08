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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.pdfBox;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.PdfDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.pdfBox.PDDocumentContainer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.heightCalculation.EvaluatedHeightOffset;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.AttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.SpreadExpressionManagerDependency;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.SpreadExpressionResult;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

import java.util.*;
import java.util.stream.Collectors;

import static com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.SectionUtils.getFooterSectionId;
import static com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.SectionUtils.getHeaderSectionId;

@RequiredArgsConstructor
public class InsertPDObjectsDependencyValueProducer implements PdfDependencyValueProvider<InsertPDObjectsResult, InsertPDObjectsDependency> {

	@Override
	public ValueFactory<InsertPDObjectsResult> produce(InsertPDObjectsDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfPrintEngineRuntime runtime) {
		final var cachedSectionResult = new HashMap<String, SpreadExpressionResult>();
		final var modelSegmentPrintResults = dependency.getModelSegmentPrintResults();
		final var printDocumentContext = dependency.getPrintDocumentContext();
		final var totalPageCount = dependency.getTotalPageCount();
		final var sectionsToRenderPerPage = dependency.getSectionsToRenderPerPage();
		final var rangeStart = dependency.getRangeStart() + 1;
		final var rangeEnd = Optional.ofNullable(dependency.getRangeEnd()).map(end -> end + 1);

		final var attachmentsToAppend = new LinkedHashMap<String, AttachmentToAppend>();

		final var dependencies = new ArrayList<ContentInserterDependency>();
		var initialPageCount = 1;
		for (final var modelSegmentPrintResult : modelSegmentPrintResults) {
			final var segmentDocument = modelSegmentPrintResult.getPdDocument();
			final var numberOfPages = segmentDocument.getNumberOfPages();

			final var pdSegmentObject = modelSegmentPrintResult.getPdSegmentObject();
			final var matchingSections = pdSegmentObject.getMatchingSections();

			Map<Integer, PDDocumentContainer> firstPageHeaderSection = new HashMap<>();
			Map<Integer, PDDocumentContainer> firstPageFooterSection = new HashMap<>();
			Map<Integer, PDDocumentContainer> remainingPageHeaderSection = new HashMap<>();
			Map<Integer, PDDocumentContainer> remainingPageFooterSection = new HashMap<>();

			attachmentsToAppend.putAll(modelSegmentPrintResult.getAttachmentsToAppend());

			if (matchingSections != null) {
				if (matchingSections.getFirstPageSection() != null) {
					final var firstPageSectionId = matchingSections.getFirstPageSection().getId();
					getUsedSections(
						runtime,
						printDocumentContext,
						attachmentsToAppend,
						cachedSectionResult,
						firstPageSectionId,
						sectionsToRenderPerPage,
						totalPageCount,
						initialPageCount,
						numberOfPages,
						firstPageHeaderSection,
						firstPageFooterSection
					);
				}

				if (matchingSections.getRemainingPageSection() != null) {
					final var remainingPageSectionId = matchingSections.getRemainingPageSection().getId();
					getUsedSections(
						runtime,
						printDocumentContext,
						attachmentsToAppend,
						cachedSectionResult,
						remainingPageSectionId,
						sectionsToRenderPerPage,
						totalPageCount,
						initialPageCount,
						numberOfPages,
						remainingPageHeaderSection,
						remainingPageFooterSection
					);
				}
			}

			final var currentPageRangeStart = initialPageCount;
			final var lastIndex = numberOfPages - 1;
			final var currentPageRangeEnd = initialPageCount + lastIndex;

			if (
				rangeStart <= currentPageRangeEnd &&
					rangeEnd.orElse(currentPageRangeStart) >= currentPageRangeStart
			) {
				final var startPageIndex = Math.max(rangeStart - currentPageRangeStart, 0);
				final var endPageIndex = rangeEnd.map(end -> Math.min(end - currentPageRangeStart, lastIndex)).orElse(lastIndex);
				dependencies.add(new ContentInserterDependency(
					modelSegmentPrintResult.getSegmentId(),
					segmentDocument,
					pdSegmentObject,
					startPageIndex,
					endPageIndex,
					firstPageHeaderSection,
					firstPageFooterSection,
					remainingPageHeaderSection,
					remainingPageFooterSection
				));
			}

			initialPageCount = currentPageRangeEnd + 1;
		}

		final var pdObjectInsertionResults = runtime
			.streamContentInserterDependency(dependencies.stream())
			.collect(Collectors.toList());

		return () -> new InsertPDObjectsResult(pdObjectInsertionResults, attachmentsToAppend);
	}

	private void getUsedSections(
		@NonNull InternalPdfPrintEngineRuntime runtime,
		PrintDocumentContext printDocumentContext,
		LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend,
		Map<String, SpreadExpressionResult> cachedSectionResult,
		String sectionId,
		List<String> sectionsToRenderPerPage,
		int totalPageCount,
		int initialPageCount,
		int numberOfPages,
		Map<Integer, PDDocumentContainer> pageHeaderSection,
		Map<Integer, PDDocumentContainer> pageFooterSection
	) {
		if (sectionsToRenderPerPage.contains(sectionId)) {
			for (var i = 0; i < numberOfPages; i++) {
				final var currentInitialPageCount = initialPageCount + i;

				final var headerResult = getSectionSpreadResult(runtime, printDocumentContext, getHeaderSectionId(sectionId), currentInitialPageCount, totalPageCount);
				pageHeaderSection.put(i, (PDDocumentContainer) headerResult.getSortablePDDocument().getPdDocumentHolder());
				final var footerResult = getSectionSpreadResult(runtime, printDocumentContext, getFooterSectionId(sectionId), currentInitialPageCount, totalPageCount);
				pageFooterSection.put(i, (PDDocumentContainer) footerResult.getSortablePDDocument().getPdDocumentHolder());

				if (i == 0) {
					attachmentsToAppend.putAll(headerResult.getAttachmentsToAppend());
					attachmentsToAppend.putAll(footerResult.getAttachmentsToAppend());
				}
			}
		} else {
			setSectionsWithoutReRender(runtime, printDocumentContext, getHeaderSectionId(sectionId), totalPageCount, pageHeaderSection, attachmentsToAppend, cachedSectionResult);
			setSectionsWithoutReRender(runtime, printDocumentContext, getFooterSectionId(sectionId), totalPageCount, pageFooterSection, attachmentsToAppend, cachedSectionResult);
		}
	}

	private void setSectionsWithoutReRender(
		@NonNull InternalPdfPrintEngineRuntime runtime,
		PrintDocumentContext printDocumentContext,
		String sectionId,
		int totalPageCount,
		Map<Integer, PDDocumentContainer> pageSections,
		LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend,
		Map<String, SpreadExpressionResult> cachedSectionResult
	) {
		if (cachedSectionResult.containsKey(sectionId)) {
			pageSections.put(-1, (PDDocumentContainer) cachedSectionResult.get(sectionId).getSortablePDDocument().getPdDocumentHolder());
		} else {
			final var headerResult = getSectionSpreadResult(runtime, printDocumentContext, sectionId, 0, totalPageCount);
			pageSections.put(-1, (PDDocumentContainer) headerResult.getSortablePDDocument().getPdDocumentHolder());
			cachedSectionResult.put(sectionId, headerResult);
			attachmentsToAppend.putAll(headerResult.getAttachmentsToAppend());
		}
	}

	private SpreadExpressionResult getSectionSpreadResult(
		@NonNull InternalPdfPrintEngineRuntime runtime,
		PrintDocumentContext printDocumentContext,
		String id,
		int initialPageCount,
		int totalPageCount
	) {
		return runtime.provide(
			new SpreadExpressionManagerDependency(
				id,
				printDocumentContext,
				new EvaluatedHeightOffset(0, 0),
				totalPageCount,
				initialPageCount,
				null
			)
		).get();
	}
}

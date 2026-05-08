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
package com.mgmtp.a12.print.engine.runtime.internal.engine.pdfBox;

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.cos.COSArray;
import org.apache.pdfbox.cos.COSDictionary;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.documentinterchange.logicalstructure.PDParentTreeValue;
import org.apache.pdfbox.pdmodel.documentinterchange.logicalstructure.PDStructureTreeRoot;
import org.apache.pdfbox.pdmodel.font.PDFont;

import java.io.IOException;
import java.util.*;

@Slf4j
public class SegmentPDObjectInserter implements PDObjectInserter<PDObjectInsertionResult> {

	@NonNull private final String id;
	@NonNull private final PDDocument segmentDocument;
	@NonNull private final PDSegmentObject pdSegmentObject;
	private final int startIndex;
	private final int endIndex;

	private final COSDictionary structDictionary;
	private final PDStructureTreeRoot structureTreeRoot;
	private final Incrementer structParentsIncrementer;

	private final Map<Integer, PDDocumentContainer> firstPageHeaderSections;
	private final Map<Integer, PDDocumentContainer> firstPageFooterSections;
	private final Map<Integer, PDDocumentContainer> remainingPageHeaderSections;
	private final Map<Integer, PDDocumentContainer> remainingPageFooterSections;

	private final PDObjectsExtractor pdObjectsExtractor;

	private final Set<PDFont> fontsToSubset = new HashSet<>();
	private final Set<PDDocument> elementPDDocumentsToClose = new HashSet<>();

	public SegmentPDObjectInserter(
		@NonNull String id,
		@NonNull PDDocument segmentDocument,
		@NonNull PDSegmentObject pdSegmentObject,
		int startIndex,
		int endIndex,
		Map<Integer, PDDocumentContainer> firstPageHeaderSections,
		Map<Integer, PDDocumentContainer> firstPageFooterSections,
		Map<Integer, PDDocumentContainer> remainingPageHeaderSections,
		Map<Integer, PDDocumentContainer> remainingPageFooterSections
	) {
		this.id = id;
		this.segmentDocument = segmentDocument;
		this.pdSegmentObject = pdSegmentObject;
		this.startIndex = startIndex;
		this.endIndex = endIndex;
		this.firstPageHeaderSections = firstPageHeaderSections;
		this.firstPageFooterSections = firstPageFooterSections;
		this.remainingPageHeaderSections = remainingPageHeaderSections;
		this.remainingPageFooterSections = remainingPageFooterSections;

		this.structParentsIncrementer = new Incrementer(segmentDocument.getNumberOfPages() - 1);

		this.structureTreeRoot = segmentDocument.getDocumentCatalog().getStructureTreeRoot();

		if (structureTreeRoot != null) {
			if (!(structureTreeRoot.getK() instanceof final COSDictionary sourceStructDictionary) ||
				!sourceStructDictionary.getCOSName(COSName.S).equals(COSName.DOCUMENT)
			) {
				throw new PrintException("This type of 'K' structure is not covered");
			}
			this.structDictionary = sourceStructDictionary;
		} else {
			this.structDictionary = null;
		}

		this.pdObjectsExtractor = new PDObjectsExtractor(segmentDocument);
	}

	public PDObjectInsertionResult getInsertionResult() {
		return new PDObjectInsertionResult(id, segmentDocument, fontsToSubset, elementPDDocumentsToClose);
	}

	public void process() throws IOException {
		// extract all the necessary data from PDDocuments at the beginning
		final var segmentObjects = pdObjectsExtractor.extractContent(
			pdSegmentObject.getPDObjectHolders()
		);

		final var parentTreeNumbers = new HashMap<Integer, PDParentTreeValue>();
		final var kElements = new COSArray();
		final var deduplicatedType0Fonts = new HashMap<String, DeduplicatedType0Font>();
		final var simpleFontsToSubset = new HashSet<PDFont>();

		for (var pageIndex = this.startIndex; pageIndex <= this.endIndex; pageIndex++) {
			final var headerToAdd = pageIndex == 0 ? getFirstPageHeaderSection(pageIndex) : getRemainingPageHeaderSection(pageIndex);
			final var footerToAdd = pageIndex == 0 ? getFirstPageFooterSection(pageIndex) : getRemainingPageFooterSection(pageIndex);
			// extract footer/header for each page because of cloning
			final var headerElementsToAdd = extractSectionContent(headerToAdd.orElse(null));
			final var footerElementsToAdd = extractSectionContent(footerToAdd.orElse(null));

			final var pageContentInserter = new PagePDObjectInserter(
				segmentDocument,
				segmentObjects,
				structDictionary,
				structParentsIncrementer,
				deduplicatedType0Fonts,
				pageIndex,
				headerElementsToAdd,
				footerElementsToAdd
			);
			pageContentInserter.process();
			final var insertionResult = pageContentInserter.getInsertionResult();

			kElements.addAll(insertionResult.getKElements());
			simpleFontsToSubset.addAll(insertionResult.getSimpleFontsToSubset());
			elementPDDocumentsToClose.addAll(insertionResult.getElementPDDocumentsToClose());

			// add parent tree numbers for current page
			parentTreeNumbers.put(pageIndex, new PDParentTreeValue(insertionResult.getParentTreeKElements()));

			for (final var annoEntry: insertionResult.getAnnotationParentTreeKElements().entrySet()) {
				parentTreeNumbers.put(annoEntry.getKey(), new PDParentTreeValue(annoEntry.getValue()));
			}
		}

		// combine fonts to subset
		fontsToSubset.addAll(simpleFontsToSubset);
		for (final var deduplicatedType0Font: deduplicatedType0Fonts.values()) {
			final var targetCodePoints = deduplicatedType0Font.getTargetCodePoints();
			for (final var fontToMerge: deduplicatedType0Font.getFontsToMerge()) {
				targetCodePoints.addAll(PDFontReflection.getSubsetCodePoints(fontToMerge));
			}
			fontsToSubset.add(deduplicatedType0Font.getFontToSubset());
		}

		getStructDictionary().ifPresent(structDictionary -> {
			structDictionary.setItem(COSName.K, kElements);
		});
		getStructTreeRoot().ifPresent(structTreeRoot -> {
			structureTreeRoot.getParentTree().setNumbers(parentTreeNumbers);
			structureTreeRoot.setParentTreeNextKey(structParentsIncrementer.increase());
		});

		final var originPageNumber = segmentDocument.getNumberOfPages();
		PDPageRemover.remove(
			segmentDocument,
			this.startIndex,
			originPageNumber - (this.endIndex + 1)
		);
	}

	private Optional<COSDictionary> getStructDictionary() {
		return Optional.ofNullable(structDictionary);
	}

	private Optional<PDStructureTreeRoot> getStructTreeRoot() {
		return Optional.ofNullable(structureTreeRoot);
	}

	private List<ContainerElementPDObject> extractSectionContent(PDDocumentContainer documentContainer) throws IOException {
		if (documentContainer == null) {
			return null;
		}

		return pdObjectsExtractor.extractContent(documentContainer);
	}

	private Optional<PDDocumentContainer> getRemainingPageHeaderSection(int pageIndex) {
		return getSection(remainingPageHeaderSections, pageIndex);
	}

	private Optional<PDDocumentContainer> getRemainingPageFooterSection(int pageIndex) {
		return getSection(remainingPageFooterSections, pageIndex);
	}

	private Optional<PDDocumentContainer> getFirstPageHeaderSection(int pageIndex) {
		final var firstPageHeaderSection = getSection(firstPageHeaderSections, pageIndex);
		final var firstPageFooterSection = getSection(firstPageFooterSections, pageIndex);
		if (firstPageHeaderSection.isPresent()) {
			return firstPageHeaderSection;
		} else if (firstPageFooterSection.isEmpty() && getRemainingPageHeaderSection(pageIndex).isPresent()) {
			return getRemainingPageHeaderSection(pageIndex);
		}

		return Optional.empty();
	}

	private Optional<PDDocumentContainer> getFirstPageFooterSection(int pageIndex) {
		final var firstPageHeaderSection = getSection(firstPageHeaderSections, pageIndex);
		final var firstPageFooterSection = getSection(firstPageFooterSections, pageIndex);
		if (firstPageFooterSection.isPresent()) {
			return firstPageFooterSection;
		} else if (firstPageHeaderSection.isEmpty() && getRemainingPageFooterSection(pageIndex).isPresent()) {
			return getRemainingPageFooterSection(pageIndex);
		}

		return Optional.empty();
	}

	private Optional<PDDocumentContainer> getSection(@NonNull final Map<Integer, PDDocumentContainer> map, int pageIndex) {
		return map.containsKey(-1)
			? Optional.of(map.get(-1))
			: Optional.ofNullable(map.get(pageIndex));
	}
}

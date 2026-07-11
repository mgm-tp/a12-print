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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.documentHandle;

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.AttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.ComponentTreeManagerDependency;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.ComponentTreeReference;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.SectionUtils;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.Spread;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.componentTrees.SectionComponentTree;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.ContentStreamAdapter;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Position;
import com.mgmtp.a12.print.model.api.model.element.properties.PageOrientation;
import com.mgmtp.a12.print.model.api.model.section.ModelSection;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NonNull;
import lombok.Value;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;

import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil.floatToLongPt;

@Value
@Slf4j
public class SegmentDocumentHandle implements ContainerDocumentHandle {
	@NonNull
	PageOrientation pageOrientation;
	@NonNull
	PDDocument document;
	ModelSection firstSection;
	ModelSection remainingSection;
	@Getter(value = AccessLevel.NONE)
	List<ContentStreamAdapter> contentStreamAdapters = new ArrayList<>();

	long startForFirst;
	long endForFirst;
	long remainingHeaderHeight;
	long endForRemaining;

	long firstFooterHeight;
	long remainingFooterHeight;

	long pageHeight;

	long firstPageRegionSpace;
	long remainingPageRegionSpace;

	LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend = new LinkedHashMap<>();

	public SegmentDocumentHandle(
		@NonNull PageOrientation pageOrientation,
		@NonNull PDDocument document,
		ModelSection firstSection,
		ModelSection remainingSection
	) {
		this.pageOrientation = pageOrientation;
		this.document = document;
		this.firstSection = firstSection;
		this.remainingSection = remainingSection;

		this.pageHeight = pageOrientation.equals(PageOrientation.LANDSCAPE)
			? floatToLongPt(PDRectangle.A4.getWidth())
			: floatToLongPt(PDRectangle.A4.getHeight());

		long remainingPageStart = remainingSection != null
			? PDFUnitUtil.mmToLongPt(remainingSection.getHeaderHeight().getValue())
			: 0;
		long remainingPageEnd = remainingSection != null
			? PDFUnitUtil.mmToLongPt(remainingSection.getActualFooterHeight())
			: pageHeight;

		long firstPageStart;
		long firstPageEnd;
		if (firstSection != null) {
			firstPageStart = PDFUnitUtil.mmToLongPt(firstSection.getHeaderHeight().getValue());
			firstPageEnd = PDFUnitUtil.mmToLongPt(firstSection.getActualFooterHeight());
		} else {
			firstPageStart = remainingPageStart;
			firstPageEnd = remainingPageEnd;
		}

		this.endForFirst = firstPageEnd;
		this.startForFirst = firstPageStart;
		this.remainingHeaderHeight = remainingPageStart;
		this.endForRemaining = remainingPageEnd;

		this.firstFooterHeight = pageHeight - endForFirst;
		this.remainingFooterHeight = pageHeight - endForRemaining;

		this.remainingPageRegionSpace = remainingSection != null
			? getRegionSpace(pageHeight, remainingSection)
			: pageHeight;

		this.firstPageRegionSpace = firstSection != null
			? getRegionSpace(pageHeight, firstSection)
			: remainingPageRegionSpace;

		contentStreamAdapters.add(getNewContentStreamAdapter());
	}

	@Override
	public FinalYResult getFinalY(
		@NonNull ComponentTreeReference componentTreeReference,
		@NonNull List<Spread> currentSpreads,
		long yWithOffset,
		boolean isNested
	) {
		int pageNumber = getPageNumber(yWithOffset);

		var sectionOffset = 0L;
		// Is top most element in non nested container, with sections
		if (sectionOffsetCalculationNeeded(currentSpreads, isNested)) {
			sectionOffset += startForFirst;
			if (pageNumber > 1) {
				sectionOffset += firstFooterHeight;
				sectionOffset += (pageNumber - 2) * (remainingHeaderHeight + remainingFooterHeight);
				sectionOffset += remainingHeaderHeight;
			}

			var tempY = yWithOffset + sectionOffset;
			var tempPageNumber = getPageNumber(tempY);
			var tempPageRelativeY = tempY - ((tempPageNumber - 1) * pageHeight);

			while (
				(tempPageNumber != 1 && tempPageRelativeY < remainingHeaderHeight) ||
					tempPageRelativeY >= (tempPageNumber == 1 ? endForFirst : endForRemaining)
			) {
				sectionOffset += (tempPageRelativeY == 1 ? firstFooterHeight : remainingFooterHeight) + remainingHeaderHeight;
				tempY = yWithOffset + sectionOffset;
				tempPageNumber = getPageNumber(tempY);
				tempPageRelativeY = tempY - ((tempPageNumber - 1) * pageHeight);
			}
		}

		var finalY = ContainerDocumentHandle.super.getFinalY(
			componentTreeReference,
			currentSpreads,
			yWithOffset + sectionOffset,
			isNested
		).finalY();

		final var maxSpread = currentSpreads.stream()
			.max(Comparator.comparingLong(Spread::getSpread))
			.map(Spread::getSpreadWithoutBottomMargin)
			.orElse(null);

		pageNumber = getPageNumber(finalY);
		var whiteSpaceIntersectsWithPageBreak = false;
		if (maxSpread != null) {
			final var maxSpreadPageNumber = getPageNumber(maxSpread);
			if (hasSections()) {
				final var diffOffset = getSpreadDifferenceSectionOffset(finalY, maxSpread, pageNumber);
				whiteSpaceIntersectsWithPageBreak = diffOffset.pageNumber != maxSpreadPageNumber;
				finalY = diffOffset.finalY;
			} else {
				whiteSpaceIntersectsWithPageBreak = finalY - maxSpread > 0 &&
					pageNumber != maxSpreadPageNumber;
			}
		}

		return new FinalYResult(finalY, whiteSpaceIntersectsWithPageBreak);
	}

	private boolean sectionOffsetCalculationNeeded(@NonNull List<Spread> currentSpreads, boolean isNested) {
		return currentSpreads.isEmpty() && hasSections() && !isNested;
	}

	@Override
	public DistanceSectionOffset getDistanceSectionOffset(@NonNull Position position, long startYToCheckSectionOffset) {
		long finalY = position.getY();
		final int pageNumber = getPageNumber(finalY);
		final int startPageNumber = getPageNumber(startYToCheckSectionOffset);
		var sectionOffset = 0L;
		var whiteSpaceIntersectsWithPageBreak = false;
		if (hasSections()) {
			final var diffOffset = getSpreadDifferenceSectionOffset(finalY, startYToCheckSectionOffset, pageNumber);
			sectionOffset = diffOffset.sectionOffset;
			whiteSpaceIntersectsWithPageBreak = diffOffset.pageNumber != startPageNumber;
		} else {
			whiteSpaceIntersectsWithPageBreak = finalY - startYToCheckSectionOffset > 0 &&
				pageNumber != startPageNumber;
		}
		return new DistanceSectionOffset(sectionOffset, whiteSpaceIntersectsWithPageBreak);
	}

	@Override
	public long getRemainingSpace(@NonNull Position position) {
		final var finalY = position.getY();
		final int pageNumber = getPageNumber(finalY);
		final var pageRelativeY = finalY - ((pageNumber - 1) * pageHeight);
		return (pageNumber == 1 ? endForFirst : endForRemaining) - pageRelativeY;
	}

	@Override
	public RegionCursor getInitialRegionCursor(@NonNull Position position) {
		long finalY = position.getY();
		final int pageNumber = getPageNumber(finalY);
		final var pageRelativeY = finalY - ((pageNumber - 1) * pageHeight);
		final var contentStreamAdapter = getContentStreamAdapter(pageNumber);
		final var remainingSpace = (pageNumber == 1 ? endForFirst : endForRemaining) - pageRelativeY;
		final var regionSpace = pageNumber == 1 ? firstPageRegionSpace : remainingPageRegionSpace;

		if (
			pageRelativeY < (pageNumber == 1 ? startForFirst : remainingHeaderHeight) ||
				pageRelativeY > (pageNumber == 1 ? endForFirst : endForRemaining)
		) {
			log.warn("Calculated Y Position is not inside the target region");
		}

		return new RegionCursor(
			new Position(position.getX(), pageRelativeY),
			remainingSpace,
			regionSpace,
			0L,
			pageNumber,
			this,
			contentStreamAdapter
		);
	}

	private DifferenceSectionOffset getSpreadDifferenceSectionOffset(
		final long originY,
		final long maxSpread,
		final int pageNumber
	) {
		var sectionOffset = 0L;
		var finalY = originY;
		int finalPageNumber = pageNumber;
		final var elementDistance = finalY - maxSpread;
		if (elementDistance > 0) {
			int maxSpreadPageNumber = getPageNumber(maxSpread);

			if (maxSpreadPageNumber != pageNumber) {
				final var movedPages = pageNumber - maxSpreadPageNumber - 1;
				// add first footer
				sectionOffset += maxSpreadPageNumber == 1
					? firstFooterHeight
					: remainingFooterHeight;
				// add in between footer + header
				sectionOffset += movedPages * (remainingHeaderHeight + remainingFooterHeight);
				// add last header
				sectionOffset += remainingHeaderHeight;

				finalY += sectionOffset;
				finalPageNumber = getPageNumber(finalY);
			}
		}

		final var tempPageRelativeY = finalY - ((finalPageNumber - 1) * pageHeight);
		// add footer and header if y is in the footer of the current page
		if (tempPageRelativeY >= (pageNumber == 1 ? endForFirst : endForRemaining)) {
			final var offset = (pageNumber == 1 ? firstFooterHeight : remainingFooterHeight) + remainingHeaderHeight;
			finalY += offset;
			sectionOffset += offset;
			finalPageNumber++;
		}

		return new DifferenceSectionOffset(finalY, sectionOffset, finalPageNumber);
	}

	private record DifferenceSectionOffset(long finalY, long sectionOffset, int pageNumber) {}

	@Override
	public RegionCursor getPageBreakRegionCursor(@NonNull Position position, int previousPageNumber) {
		int pageNumber = previousPageNumber + 1;
		long pageRelativeY = remainingHeaderHeight;
		long sectionOffset = (previousPageNumber == 1 ? firstFooterHeight : remainingFooterHeight) + remainingHeaderHeight;
		final var remainingSpace = (pageNumber == 1 ? endForFirst : endForRemaining) - pageRelativeY;
		final var regionSpace = pageNumber == 1 ? firstPageRegionSpace : remainingPageRegionSpace;
		final var contentStreamAdapter = getContentStreamAdapter(pageNumber);

		return new RegionCursor(
			new Position(position.getX(), pageRelativeY),
			remainingSpace,
			regionSpace,
			sectionOffset,
			pageNumber,
			this,
			contentStreamAdapter
		);
	}

	@Override
	public void addAttachmentsToAppend(LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend) {
		for (final var entry : attachmentsToAppend.entrySet()) {
			this.attachmentsToAppend.putIfAbsent(entry.getKey(), entry.getValue());
		}
	}

	public int getAdapterStreamCount() {
		return contentStreamAdapters.size();
	}

	public List<ContentStreamAdapter> getAdaptersWithSection(
		@NonNull InternalPdfBoxPrintEngineRuntime runtime,
		PrintDocumentContext printDocumentContext,
		int totalPageCount,
		int pageCountOffset
	) {
		final var headerDependencies = new ArrayList<ComponentTreeManagerDependency>();
		final var footerDependencies = new ArrayList<ComponentTreeManagerDependency>();

		for (var i  = 0; i < contentStreamAdapters.size(); i++) {
			final var adapter = contentStreamAdapters.get(i);
			ModelSection section = null;
			if (i == 0 && firstSection != null) {
				section = firstSection;
			} else if (remainingSection != null) {
				section = remainingSection;
			}

			if (section != null) {
				final var currentPageCount = pageCountOffset + i + 1;
				headerDependencies.add(new ComponentTreeManagerDependency(
					SectionUtils.getHeaderSectionId(section.getId()),
					new SectionDocumentHandle(
						adapter,
						section,
						SectionComponentTree.SectionType.HEADER,
						totalPageCount,
						currentPageCount
					),
					printDocumentContext,
					false
				));
				footerDependencies.add(new ComponentTreeManagerDependency(
					SectionUtils.getFooterSectionId(section.getId()),
					new SectionDocumentHandle(
						adapter,
						section,
						SectionComponentTree.SectionType.FOOTER,
						totalPageCount,
						currentPageCount
					),
					printDocumentContext,
					false
				));
			}
		}

		runtime.streamComponentTreeManagerDependency(headerDependencies.stream()).toList();
		runtime.streamComponentTreeManagerDependency(footerDependencies.stream()).toList();

		return contentStreamAdapters;
	}

	private boolean hasSections() {
		return firstSection != null || remainingSection != null;
	}

	private static long getRegionSpace(long pageHeight, ModelSection section) {
		return pageHeight - (
			PDFUnitUtil.mmToLongPt(section.getHeaderHeight().getValue()) +
				PDFUnitUtil.mmToLongPt(section.getFooterHeight().getValue())
		);
	}

	public PDRectangle getPageBounds() {
		if (pageOrientation.equals(PageOrientation.LANDSCAPE)) {
			return new PDRectangle(PDRectangle.A4.getHeight(), PDRectangle.A4.getWidth());
		} else {
			return PDRectangle.A4;
		}
	}

	private ContentStreamAdapter getNewContentStreamAdapter() {
		synchronized (document) {
			return new ContentStreamAdapter(
				document,
				new PDPage(getPageBounds()),
				PDPageContentStream.AppendMode.APPEND,
				true,
				true
			);
		}
	}

	private ContentStreamAdapter getContentStreamAdapter(int pageNumber) {
		ContentStreamAdapter contentStreamAdapter = pageNumber > contentStreamAdapters.size()
			? null
			: contentStreamAdapters.get(pageNumber - 1);
		if (contentStreamAdapter == null) {
			// create empty pages
			for (var i = contentStreamAdapters.size(); i < pageNumber; i++) {
				contentStreamAdapter = getNewContentStreamAdapter();
				contentStreamAdapters.add(contentStreamAdapter);
			}
		}

		if (contentStreamAdapter == null) {
			throw new PrintException("The content stream adapter could not be created");
		}

		return contentStreamAdapter;
	}

	private int getPageNumber(long yPosition) {
		if (yPosition == 0) {
			return 1;
		}
		if (yPosition % pageHeight == 0) {
			return Math.toIntExact((yPosition / pageHeight) + 1);
		}
		return (int) Math.ceil((double) yPosition / pageHeight);
	}
}

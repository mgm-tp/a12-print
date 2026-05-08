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

import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.ComponentTreeResult;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.componentTrees.SectionComponentTree;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.ContentStreamAdapter;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Position;
import com.mgmtp.a12.print.model.api.model.section.ModelSection;
import lombok.NonNull;
import lombok.Value;
import org.apache.pdfbox.pdmodel.PDDocument;

@Value
public class SectionDocumentHandle implements ContainerDocumentHandle {
	@NonNull
	PDDocument document;
	@NonNull
	ContentStreamAdapter contentStreamAdapter;
	@NonNull
	SectionComponentTree.SectionType sectionType;
	long sectionStart;
	long sectionEnd;

	int totalPageCount;
	int currentPageCount;

	public SectionDocumentHandle(
		@NonNull ContentStreamAdapter contentStreamAdapter,
		@NonNull ModelSection modelSection,
		@NonNull SectionComponentTree.SectionType sectionType,
		int totalPageCount,
		int currentPageCount
	) {
		this.contentStreamAdapter = contentStreamAdapter;
		this.sectionType = sectionType;
		this.document = contentStreamAdapter.getDocument();

		if (sectionType == SectionComponentTree.SectionType.FOOTER) {
			sectionStart = PDFUnitUtil.mmToLongPt(modelSection.getActualFooterHeight());
			sectionEnd = contentStreamAdapter.getPageHeight();
		} else {
			sectionStart = 0L;
			sectionEnd = PDFUnitUtil.mmToLongPt(modelSection.getHeaderHeight().getValue());
		}

		this.totalPageCount = totalPageCount;
		this.currentPageCount = currentPageCount;
	}

	@Override
	public RegionCursor getInitialRegionCursor(@NonNull Position position) {
		final var finalY = position.getY();

		if (sectionStart <= finalY && finalY <= sectionEnd) {
			final var pageHeight = contentStreamAdapter.getPageHeight();
			return new RegionCursor(
				position,
				// give the element enough place to avoid page break handling
				pageHeight - (sectionEnd - finalY),
				pageHeight,
				0,
				0, // not relevant for sections because they are only rendered on first page
				this,
				contentStreamAdapter
			);
		}

		return null;
	}

	public ComponentTreeResult renderSection(SectionElementRenderer sectionElementRenderer) {
		final var width = this.contentStreamAdapter.getPageWidth();
		final var height = this.contentStreamAdapter.getPageHeight();
		this.contentStreamAdapter.saveGraphicsState();
		this.contentStreamAdapter.addRect(0, height - sectionEnd, width, sectionEnd - sectionStart);
		this.contentStreamAdapter.clip();

		final var componentTreeResult = sectionElementRenderer.render();

		this.contentStreamAdapter.restoreGraphicsState();

		return componentTreeResult;
	}

	@FunctionalInterface
	public interface SectionElementRenderer {
		ComponentTreeResult render();
	}
}

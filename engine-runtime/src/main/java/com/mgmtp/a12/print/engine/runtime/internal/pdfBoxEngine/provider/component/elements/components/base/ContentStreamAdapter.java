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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base;

import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.componentTrees.SectionComponentTree;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.documentHandle.ContainerDocumentHandle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.documentHandle.SectionDocumentHandle;
import lombok.NonNull;
import lombok.Value;
import org.apache.pdfbox.cos.COSDictionary;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.documentinterchange.logicalstructure.PDStructureElement;
import org.apache.pdfbox.pdmodel.documentinterchange.markedcontent.PDPropertyList;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState;
import org.apache.pdfbox.pdmodel.graphics.state.RenderingMode;
import org.apache.pdfbox.util.Matrix;

import java.io.Closeable;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil.floatToLongPt;
import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil.longPtToFloat;

@Value
public class ContentStreamAdapter implements Closeable {
	PDDocument document;
	PDPage page;
	PDPageContentStream contentStream;
	Incrementer tagIdIncrementer;
	List<PDStructureElement> linkStructElements = new ArrayList<>();
	List<AccessibilityData> accessibilityDataList = new ArrayList<>();
	List<AccessibilityData> headerAccessibilityDataList = new ArrayList<>();
	List<AccessibilityData> footerAccessibilityDataList = new ArrayList<>();

	public ContentStreamAdapter(
		@NonNull final PDDocument document,
		@NonNull final PDPage page,
		@NonNull final PDPageContentStream.AppendMode appendMode,
		final boolean compress,
		final boolean resetContext
	) {
		this(document, page, appendMode, compress, resetContext, new Incrementer(-1));
	}

	public ContentStreamAdapter(
		@NonNull final PDDocument document,
		@NonNull final PDPage page,
		@NonNull final PDPageContentStream.AppendMode appendMode,
		final boolean compress,
		final boolean resetContext,
		@NonNull Incrementer tagIdIncrementer
	) {
		this.document = document;
		this.page = page;
		this.tagIdIncrementer = tagIdIncrementer;

		try {
			this.contentStream = new PDPageContentStream(document, page, appendMode, compress, resetContext);
		} catch (Exception e) {
			throw new ContentStreamException(e);
		}
	}

	public void addLinkStructElements(
		@NonNull final List<PDStructureElement> linkStructElements
	) {
		this.linkStructElements.addAll(linkStructElements);
	}

	public void addAccessibilityData(
		@NonNull ContainerDocumentHandle containerDocumentHandle,
		@NonNull final AccessibilityData accessibilityData
	) {
		if (containerDocumentHandle instanceof SectionDocumentHandle sectionDocumentHandle) {
			if (sectionDocumentHandle.getSectionType().equals(SectionComponentTree.SectionType.HEADER)) {
				this.headerAccessibilityDataList.add(accessibilityData);
			} else {
				this.footerAccessibilityDataList.add(accessibilityData);
			}
		} else {
			this.accessibilityDataList.add(accessibilityData);
		}
	}

	private void catchException(ThrowingRunnable action) {
		try {
			action.run();
		} catch (Exception e) {
			throw new ContentStreamException(e);
		}
	}

	public long getPageHeight() {
		return floatToLongPt(this.page.getMediaBox().getHeight());
	}
	public long getPageWidth() {
		return floatToLongPt(this.page.getMediaBox().getWidth());
	}

	@Override
	public void close() {
		catchException(this.contentStream::close);
	}

	@FunctionalInterface
	private interface ThrowingRunnable {
		void run() throws IOException;
	}

	public void saveGraphicsState() {
		catchException(this.contentStream::saveGraphicsState);
	}

	public void restoreGraphicsState() {
		catchException(this.contentStream::restoreGraphicsState);
	}

	public void fill() {
		catchException(this.contentStream::fill);
	}

	public void stroke() {
		catchException(this.contentStream::stroke);
	}

	public void beginText() {
		catchException(this.contentStream::beginText);
	}

	public void endText() {
		catchException(this.contentStream::endText);
	}

	public void endMarkedContent() {
		catchException(this.contentStream::endMarkedContent);
	}

	public void clip() {
		catchException(this.contentStream::clip);
	}

	public void addRect(long x, long y, long width, long height) {
		catchException(() -> this.contentStream.addRect(longPtToFloat(x), longPtToFloat(y), longPtToFloat(width), longPtToFloat(height)));
	}

	public void setLineWidth(long lineWidth) {
		catchException(() -> this.contentStream.setLineWidth(longPtToFloat(lineWidth)));
	}

	public void setStrokingColor(float r, float g, float b) {
		catchException(() -> this.contentStream.setStrokingColor(r, g, b));
	}

	public void setNonStrokingColor(float r, float g, float b) {
		catchException(() -> this.contentStream.setNonStrokingColor(r, g, b));
	}

	public void setLineDashPattern(float[] pattern, float phase) {
		catchException(() -> this.contentStream.setLineDashPattern(pattern, phase));
	}

	public void drawImage(PDImageXObject image, long x, long y, long width, long height) {
		catchException(() -> this.contentStream.drawImage(image, longPtToFloat(x), longPtToFloat(y), longPtToFloat(width), longPtToFloat(height)));
	}

	public void drawImage(PDImageXObject image, Matrix matrix) {
		catchException(() -> this.contentStream.drawImage(image, matrix));
	}

	public void moveTo(long x, long y) {
		catchException(() -> this.contentStream.moveTo(longPtToFloat(x), longPtToFloat(y)));
	}

	public void lineTo(long x, long y) {
		catchException(() -> this.contentStream.lineTo(longPtToFloat(x), longPtToFloat(y)));
	}

	public void setRenderingMode(RenderingMode rm) {
		catchException(() -> this.contentStream.setRenderingMode(rm));
	}

	public void setTextMatrix(float a, float b, float c, float d, long e, long f) {
		catchException(() -> this.contentStream.setTextMatrix(new Matrix(
			a, b, c, d, longPtToFloat(e), longPtToFloat(f)
		)));
	}

	public void setFont(PDFont font, long fontSize) {
		synchronized (this.document) {
			catchException(() -> this.contentStream.setFont(font, longPtToFloat(fontSize)));
		}
	}

	public void showText(String text) {
		catchException(() -> this.contentStream.showText(text));
	}

	public void beginArtifactMarkedContent() {
		catchException(() -> this.contentStream.beginMarkedContent(COSName.ARTIFACT));
	}

	public int beginMarkedContent(COSName tag) {
		final var markedContentDictionary = new COSDictionary();
		final var newId = tagIdIncrementer.increase();
		markedContentDictionary.setInt(COSName.MCID, newId);

		catchException(() -> this.contentStream.beginMarkedContent(tag, PDPropertyList.create(markedContentDictionary)));

		return newId;
	}

	public void setGraphicsStateParameters(PDExtendedGraphicsState state) {
		catchException(() -> this.contentStream.setGraphicsStateParameters(state));
	}
}

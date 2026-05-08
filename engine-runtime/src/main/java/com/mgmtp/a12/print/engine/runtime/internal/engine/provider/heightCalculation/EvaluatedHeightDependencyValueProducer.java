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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.heightCalculation;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.PdfDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.pdfBox.PDDocumentWrapper;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer.HtmlDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.segment.TopLevelReferenceContainerHtmlTemplateParameters;
import com.mgmtp.a12.print.engine.runtime.internal.engine.renderer.pdf.PdfRendererFactory;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfPrintEngineRuntime;
import com.mgmtp.a12.print.model.api.model.section.ModelSection;
import com.openhtmltopdf.layout.Layer;
import com.openhtmltopdf.pdfboxout.PdfBoxRenderer;
import com.openhtmltopdf.render.Box;
import com.openhtmltopdf.render.LineBox;
import lombok.AllArgsConstructor;

import java.io.IOException;


@AllArgsConstructor
public class EvaluatedHeightDependencyValueProducer implements PdfDependencyValueProvider<EvaluatedHeightResult, EvaluatedHeightDependency> {

	private static  final float PDF_DOTS_PER_PIXEL = 20.0f;
	private static  final float MM_PER_INCH = 25.4f;
	private static  final int PIXELS_PER_INCH = 96;

	private final PdfRendererFactory pdfRendererFactory;

	private static int getHeightOfLargestChildLayer(final Layer rootLayer) {
		int height = rootLayer.getMaster().getHeight() + getPageBreakYDiff(rootLayer);
		for (final Layer layer : rootLayer.getChildren()) {
			final int childHeight = getHeightOfLargestChildLayer(layer);
			if (childHeight > height) {
				height = childHeight;
			}
		}
		return height;
	}

	private static int getPageBreakYDiff(Layer container) {
		if (
			container.getMaster().getHeight() ==
				container.getMaster().getPaintingInfo().getAggregateBounds().height) {
			return 0;
		}

		Integer topMostChildY = null;
		for (Box child: container.getMaster().getChildren()) {
			if (
				(!(child instanceof LineBox) ||
					((LineBox) child).isContainsContent()) &&
					(topMostChildY == null || child.getAbsY() < topMostChildY)
			) {
				topMostChildY = child.getAbsY();
			}
		}
		final var containerY = container.getMaster().getAbsY();

		return topMostChildY != null
			? Math.max(containerY, topMostChildY) - containerY
			: 0;
	}

	@Override
	public ValueFactory<EvaluatedHeightResult> produce(EvaluatedHeightDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfPrintEngineRuntime runtime) {

		final String templateName = engine.getConfig().getSegmentEntryTemplateName();
		final String markup = dependency.getMarkup();
		final var container = dependency.getContainer();
		final var matchingSections = dependency.getMatchingSections();
		final var totalPageCount = dependency.getTotalPageCount();
		final var initialPageCount = dependency.getInitialPageCount();
		final var pageNumberGlobalStyles = dependency.getPageNumberGlobalStyles();
		final var accessibilityMetadata = dependency.getAccessibilityMetadata();

		final var html = runtime.provide(
			new HtmlDependency(
				templateName,
				TopLevelReferenceContainerHtmlTemplateParameters
					.builder()
					.accessibilityMetadata(accessibilityMetadata)
					.containerId(container.getId())
					.pageOrientation(container.getPageOrientation())
					.markup(markup)
					.sections(matchingSections)
					.totalPageCount(totalPageCount)
					.pageNumberGlobalStyles(pageNumberGlobalStyles)
					.isInSection(container instanceof ModelSection)
					.build()
			)
		);
		return () -> getEvaluatedHeight(html.get(), initialPageCount);
	}

	private EvaluatedHeightResult getEvaluatedHeight(final String html, final int initialPageCount) {
		return getEvaluatedHeight(pdfRendererFactory, html, initialPageCount);
	}

	public static EvaluatedHeightResult getEvaluatedHeight(PdfRendererFactory pdfRendererFactory, final String html, final int initialPageCount) {
		try (final PdfBoxRenderer renderer = pdfRendererFactory.create(html, initialPageCount)) {
			renderer.layout();
			final Box box = renderer.getRootBox();
			final int height = getHeightOfLargestChildLayer(box.getLayer());

			renderer.createPDFWithoutClosing();

			return new EvaluatedHeightResult(
				convertToMillimeters(height),
				new PDDocumentWrapper(renderer.getPdfDocument())
			);
		} catch (IOException e) {
			throw new PrintException("Error during element extraction", e);
		}
	}

	private static int convertToMillimeters(float pixels) {
		return (int) Math.ceil((pixels / PDF_DOTS_PER_PIXEL) * MM_PER_INCH / PIXELS_PER_INCH);
	}

	public static int convertToPixel(int millimeters) {
		return (int) Math.floor((millimeters / MM_PER_INCH) * PIXELS_PER_INCH);
	}
}

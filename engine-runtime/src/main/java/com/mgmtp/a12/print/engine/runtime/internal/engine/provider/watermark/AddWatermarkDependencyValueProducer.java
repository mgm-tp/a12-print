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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.watermark;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.PdfDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer.ModelSegmentPrintResult;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.computation.ComputationExpression;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.LogicContainerEvaluationDependency;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.properties.PageOrientation;
import com.mgmtp.a12.print.model.api.model.watermark.Watermark;
import lombok.NonNull;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;


public class AddWatermarkDependencyValueProducer implements PdfDependencyValueProvider<AddWatermarkResult, AddWatermarkDependency> {

	@Override
	public ValueFactory<AddWatermarkResult> produce(AddWatermarkDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfPrintEngineRuntime runtime) {
		final var originPdDocument = dependency.getOriginPdDocument();

		final var watermarkDocuments = getWatermarkDocs(
			dependency.getWatermarkPrintResults(),
			runtime,
			dependency.getPrintDocumentContext()
		);

		if (watermarkDocuments.values().stream().anyMatch(Optional::isPresent)) {
			addWatermarks(
				watermarkDocuments,
				originPdDocument
			);
		}

		return () -> new AddWatermarkResult(originPdDocument, watermarkDocuments);
	}

	private Map<PageOrientation, Optional<AddWatermarkResult.WatermarkResult>> getWatermarkDocs(
		@NonNull List<ModelSegmentPrintResult> watermarkPrintResults,
		@NonNull InternalPdfPrintEngineRuntime runtime,
		PrintDocumentContext printDocumentContext
	) {
		return Arrays.stream(PageOrientation.values()).collect(Collectors.toMap(
			pageOrientation -> pageOrientation,
			pageOrientation -> {
				final var printResult = watermarkPrintResults.stream().filter(res ->
					res.getTopLevelReferenceContainer().getTracedElement().getPageOrientation().equals(pageOrientation)
				).findAny();

				return printResult.flatMap(res -> {
					try {
						final var watermark = (Watermark) res.getTopLevelReferenceContainer().getTracedElement();
						final var trace = new PrintModelTreeTrace<>(
							res.getTopLevelReferenceContainer().getPath(),
							watermark
						);

						final var visible = runtime.provide(
							new LogicContainerEvaluationDependency(trace,
								new ComputationExpression.Parameters()
									.withPrintDocumentContext(printDocumentContext))
						).get();

						if (!watermark.getConditions().isEmpty() && visible.getValue().filter(e -> Objects.equals(e, true)).isEmpty()) {
							return Optional.empty();
						}

						final var pdDocument = res.getPdDocument();
						final var opacity =
							((Watermark) res.getTopLevelReferenceContainer().getTracedElement()).getOpacity();

						if (opacity.isPresent() && opacity.get() != 1.0f) {
							for (final var page: pdDocument.getPages()) {
								final var contentStream = new PDPageContentStream(
									pdDocument,
									page,
									PDPageContentStream.AppendMode.PREPEND,
									false
								);
								final var graphicsState = new PDExtendedGraphicsState();
								graphicsState.setStrokingAlphaConstant(opacity.get());
								graphicsState.setNonStrokingAlphaConstant(opacity.get());
								contentStream.setGraphicsStateParameters(graphicsState);
								contentStream.close();
							}
						}

						return Optional.of(new AddWatermarkResult.WatermarkResult(pdDocument, res));
					} catch (IOException e) {
						throw new PrintException(e.getMessage());
					}
				});
			}
		));
	}

	private void addWatermarks(
		@NonNull Map<PageOrientation, Optional<AddWatermarkResult.WatermarkResult>> watermarkDocuments,
		@NonNull PDDocument pdDocument
	) {
		try (final var overlay = new OverlayWithTagging()) {
			overlay.setInputPDF(pdDocument);
			overlay.overlayDocuments(
				watermarkDocuments.entrySet().stream()
					.collect(Collectors.toMap(
						Map.Entry::getKey,
						e -> e.getValue().map(AddWatermarkResult.WatermarkResult::getDocument)
					))
			);
		}
	}
}

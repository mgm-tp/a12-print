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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.container.boundingBox;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.PdfDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.pdfBox.PDDocumentContainer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.container.ContainerHtmlTemplateParameters;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.heightCalculation.EvaluatedHeightDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.heightCalculation.EvaluatedHeightOffset;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.AddStylesToMarkupDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.AttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.MarkupCollectorDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer.HtmlDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.rendering.MarkupCollectorKey;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.MatchingSections;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.SortablePDDocument;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.SpreadExpressionManagerDependency;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.SpreadExpressionResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

@RequiredArgsConstructor
@Slf4j
public class BoundingBoxMarkupDependencyValueProducer implements PdfDependencyValueProvider<SpreadExpressionResult, BoundingBoxMarkupDependency> {

	private static final String TEMPLATE = "element/container.ftlx";

	@Override
	public ValueFactory<SpreadExpressionResult> produce(BoundingBoxMarkupDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfPrintEngineRuntime runtime) {
		final var boundingBox = dependency.getElement();
		final var referenceSpreadExpression = dependency.getReferenceSpreadExpression();
		final var position = referenceSpreadExpression.getPosition();
		final var childSpreadExpressionIds = dependency.getChildSpreadExpressionIds();
		final var yPosition = dependency.getYPosition();
		final var parentTopLevelReferenceContainer = dependency.getParentTopLevelReferenceContainer();
		final var totalPageCount = dependency.getTotalPageCount();
		final var initialPageCount = dependency.getInitialPageCount();
		final var evaluatedHeightOffset = dependency.getEvaluatedHeightOffset();
		final var printDocumentContext = dependency.getPrintDocumentContext();
		final var repeatableSegmentIndex = dependency.getRepeatableSegmentIndex();
		final var accessibilityMetadata = dependency.getAccessibilityMetadata();
		final var matchingSections = MatchingSections.awareOfSegmentIndex(
			dependency.getMatchingSections(), repeatableSegmentIndex
		);

		final var sortablePDDocuments = new ArrayList<SortablePDDocument>();
		final var spreadExpressionResults = new ArrayList<SpreadExpressionResult>();
		final LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend = new LinkedHashMap<>();
		final Map<String, String> pageNumberGlobalStyles = new HashMap<>();

		final var updatedEvaluatedHeightOffset = new EvaluatedHeightOffset(
			evaluatedHeightOffset.getYOffset() + yPosition,
			evaluatedHeightOffset.getXOffset() + position.getX().getValue()
		);
		runtime.streamSpreadExpressionManagerDependency(Arrays.stream(childSpreadExpressionIds).map(
			childSpreadExpressionId -> new SpreadExpressionManagerDependency(
				childSpreadExpressionId,
				printDocumentContext,
				updatedEvaluatedHeightOffset,
				totalPageCount,
				initialPageCount,
				repeatableSegmentIndex
			)
		)).forEachOrdered(spreadExpressionResult -> {
			spreadExpressionResults.add(spreadExpressionResult);
			sortablePDDocuments.add(spreadExpressionResult.getSortablePDDocument());
			attachmentsToAppend.putAll(spreadExpressionResult.getAttachmentsToAppend());
			pageNumberGlobalStyles.putAll(spreadExpressionResult.getPageNumberGlobalStyles());
		});

		final var markupCollector = runtime.provide(new MarkupCollectorDependency()).get();
		final var placeableReference = referenceSpreadExpression.getPlaceableReference();
		final HtmlDependency htmlDependency = new HtmlDependency(
			TEMPLATE,
			ContainerHtmlTemplateParameters
				.builder()
				.element(boundingBox)
				.dimensions(boundingBox.getBoundingBoxProperties().getDimensions())
				.placeableReference(placeableReference)
				.childElements(MarkupCollectorKey.ofSpreadExpressionResults(
					markupCollector.isPresent(),
					spreadExpressionResults,
					printDocumentContext
				))
				.build()
		);
		final var markup = runtime.provide(htmlDependency).get();
		final var screenReadingOrderWeight = referenceSpreadExpression.getPlaceableReference().getScreenReadingOrder().getScreenReadingOrderWeight();

		markupCollector.ifPresent(col -> {
			final var markupWithPosition = runtime.provide(new AddStylesToMarkupDependency(
				markup,
				Map.of("top", String.format("%dmm", yPosition)),
				true
			)).get();
			col.add(new MarkupCollectorKey(placeableReference.getRefId(), printDocumentContext, screenReadingOrderWeight), markupWithPosition);
		});

		final var evaluatedHeightMarkup = runtime.provide(new AddStylesToMarkupDependency(
			markup,
			Map.of(
				"top", String.format("%dmm", updatedEvaluatedHeightOffset.getYOffset()),
				"left", String.format("%dmm", updatedEvaluatedHeightOffset.getXOffset())
			),
			true
		)).get();

		final var evaluatedHeightResult = runtime.provide(new EvaluatedHeightDependency(
			evaluatedHeightMarkup,
			parentTopLevelReferenceContainer,
			accessibilityMetadata,
			matchingSections,
			totalPageCount,
			initialPageCount,
			pageNumberGlobalStyles
		)).get();

		final var expectedHeight = referenceSpreadExpression.getPlaceableReference().getDimensions().getHeight().getValue();
		final var spread = referenceSpreadExpression.getSpread(
			yPosition,
			expectedHeight
		);
		final var evaluatedHeight = evaluatedHeightResult.getEvaluatedHeight();

		if(expectedHeight != evaluatedHeight && log.isDebugEnabled()) {
			log.debug("The heights are different but should be the same ({}, {})", expectedHeight, evaluatedHeight);
		}

		return () -> new SpreadExpressionResult(
			dependency.getSpreadExpressionId(),
			new SortablePDDocument(
				new PDDocumentContainer(evaluatedHeightResult.getPdDocumentWrapper(), sortablePDDocuments),
				screenReadingOrderWeight
			),
			spread,
			yPosition,
			position.getY().getValue(),
			attachmentsToAppend,
			pageNumberGlobalStyles
		);
	}
}

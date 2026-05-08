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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.container.area;

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
import com.mgmtp.a12.print.model.api.model.element.base.Measure;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.base.DimensionsDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.base.MeasureDto;
import lombok.EqualsAndHashCode;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.Value;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

@RequiredArgsConstructor
@Slf4j
public class AreaMarkupDependencyValueProducer implements PdfDependencyValueProvider<AreaMarkupDependencyValueProducer.AreaSpreadExpressionResult, AreaMarkupDependency> {
	private static final String TEMPLATE = "element/container.ftlx";

	@Override
	public ValueFactory<AreaSpreadExpressionResult> produce(AreaMarkupDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfPrintEngineRuntime runtime) {
		final var area = dependency.getElement();
		final var referenceSpreadExpression = dependency.getReferenceSpreadExpression();
		final var position = referenceSpreadExpression.getPosition();
		final var childSpreadExpressionIds = dependency.getChildSpreadExpressionIds();
		final var yPosition = dependency.getYPosition();
		final var parentTopLevelReferenceContainer = dependency.getParentTopLevelReferenceContainer();
		final var totalPageCount = dependency.getTotalPageCount();
		final var initialPageCount = dependency.getInitialPageCount();
		final var evaluatedHeightOffset = dependency.getEvaluatedHeightOffset();
		final var bottomLineTopMargin = dependency.getBottomLineTopMargin();
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
		final var areaElementsHeight = runtime.streamSpreadExpressionManagerDependency(Arrays.stream(childSpreadExpressionIds).map(
			childSpreadExpressionId -> new SpreadExpressionManagerDependency(
				childSpreadExpressionId,
				printDocumentContext,
				updatedEvaluatedHeightOffset,
				totalPageCount,
				initialPageCount,
				repeatableSegmentIndex
			)
		)).map(spreadExpressionResult -> {
			spreadExpressionResults.add(spreadExpressionResult);
			sortablePDDocuments.add(spreadExpressionResult.getSortablePDDocument());
			attachmentsToAppend.putAll(spreadExpressionResult.getAttachmentsToAppend());
			pageNumberGlobalStyles.putAll(spreadExpressionResult.getPageNumberGlobalStyles());

			return spreadExpressionResult.getSpread();
		}).max(Integer::compare).orElse(0);

		final var maxHeight = Math.max(
			areaElementsHeight + bottomLineTopMargin,
			area.getAreaProperties().getDimensions().getHeight().getValue()
		);

		final var finalDimensions = DimensionsDto.builder()
			.width(area.getAreaProperties().getDimensions().getWidth())
			.height(MeasureDto.builder()
				.value(maxHeight)
				.unit(Measure.MeasureUnit.MILLIMETER)
				.build()
			).build();

		final var placeableReference = referenceSpreadExpression.getPlaceableReference();

		final var markupCollector = runtime.provide(new MarkupCollectorDependency()).get();
		final HtmlDependency htmlDependency = new HtmlDependency(
			TEMPLATE,
			ContainerHtmlTemplateParameters
				.builder()
				.element(area)
				.dimensions(finalDimensions)
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

			final var markupId = area.getId().equals(placeableReference.getRefId()) ? placeableReference.getRefId() : area.getId();
			col.add(new MarkupCollectorKey(markupId, printDocumentContext, screenReadingOrderWeight), markupWithPosition);
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

		final var spread = referenceSpreadExpression.getSpread(yPosition, maxHeight);
		final var spreadWithoutMargin = maxHeight + yPosition;

		final var evaluatedHeight = evaluatedHeightResult.getEvaluatedHeight();

		if(maxHeight != evaluatedHeight && log.isDebugEnabled()) {
			log.debug("The heights are different but should be the same ({}, {})", maxHeight, evaluatedHeight);
		}

		return () -> new AreaSpreadExpressionResult(
			dependency.getSpreadExpressionId(),
			new SortablePDDocument(
				new PDDocumentContainer(evaluatedHeightResult.getPdDocumentWrapper(), sortablePDDocuments),
				screenReadingOrderWeight
			),
			spread,
			spreadWithoutMargin,
			yPosition,
			position.getY().getValue(),
			attachmentsToAppend,
			pageNumberGlobalStyles
		);
	}

	@Value
	@EqualsAndHashCode(callSuper = true)
	public static class AreaSpreadExpressionResult extends SpreadExpressionResult {
		int spreadWithoutMargin;

		public AreaSpreadExpressionResult(
			@NonNull String spreadExpressionId,
			@NonNull SortablePDDocument sortablePDDocument,
			int spread,
			int spreadWithoutMargin,
			int finalYPosition,
			int originYPosition,
			@NonNull LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend,
			@NonNull Map<String, String> pageNumberGlobalStyles
		) {
			super(spreadExpressionId, sortablePDDocument, spread, finalYPosition, originYPosition, attachmentsToAppend, pageNumberGlobalStyles);
			this.spreadWithoutMargin = spreadWithoutMargin;
		}
	}
}

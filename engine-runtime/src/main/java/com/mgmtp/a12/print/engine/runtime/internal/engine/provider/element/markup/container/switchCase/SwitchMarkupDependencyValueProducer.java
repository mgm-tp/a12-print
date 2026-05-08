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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.container.switchCase;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.PdfDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.pdfBox.PDDocumentContainer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.container.area.AreaMarkupDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.container.area.AreaMarkupDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.AttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.MarkupCollectorDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.rendering.MarkupCollectorKey;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.computation.ComputationExpression;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.SortablePDDocument;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.SpreadExpressionResult;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.LogicContainerEvaluationDependency;
import com.mgmtp.a12.print.engine.runtime.internal.runtime.RuntimeWalker;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.container.BaseReferenceContainer;
import com.mgmtp.a12.print.model.api.model.element.type.area.Area;
import com.mgmtp.a12.print.model.api.model.element.type.switchCase.SwitchCase;
import com.mgmtp.a12.print.model.api.model.reference.ElementReference;
import com.mgmtp.a12.print.model.api.walker.DescendCommand;
import com.mgmtp.a12.print.model.api.walker.TraversalCommand;
import com.mgmtp.a12.print.model.api.walker.model.ExhaustivePrintModelVisitor;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;
import lombok.RequiredArgsConstructor;

import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

import static com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants.EMPTY_STRING;

@RequiredArgsConstructor
public class SwitchMarkupDependencyValueProducer implements PdfDependencyValueProvider<SpreadExpressionResult, SwitchMarkupDependency> {
	@Override
	public ValueFactory<SpreadExpressionResult> produce(SwitchMarkupDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfPrintEngineRuntime runtime) {
		final var switchElement = dependency.getElement();
		final var referenceSpreadExpression = dependency.getReferenceSpreadExpression();
		final var yPosition = dependency.getYPosition();
		final var totalPageCount = dependency.getTotalPageCount();
		final var initialPageCount = dependency.getInitialPageCount();
		final var evaluatedHeightOffset = dependency.getEvaluatedHeightOffset();
		final var parentTopLevelReferenceContainer = dependency.getParentTopLevelReferenceContainer();
		final var bottomLineTopMargin = dependency.getBottomLineTopMargin();
		final var printDocumentContext = dependency.getPrintDocumentContext();
		final var parentPath = dependency.getParentPath();
		final var matchingSections = dependency.getMatchingSections();
		final var repeatableSegmentIndex = dependency.getRepeatableSegmentIndex();
		final var accessibilityMetadata = dependency.getAccessibilityMetadata();

		final var visibleAreas = switchElement
			.getReferences()
			.stream()
			.map(SwitchCase.class::cast)
			.filter(switchCase -> {
				final var logicContainerEvaluation = runtime.provide(
					new LogicContainerEvaluationDependency(
						new PrintModelTreeTrace<>(parentPath, switchCase),
						new ComputationExpression.Parameters().withPrintDocumentContext(printDocumentContext)
					)
				).get();
				return logicContainerEvaluation.getValue().filter(e -> Objects.equals(e, true)).isPresent();
			})
			.toList();

		final LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend = new LinkedHashMap<>();
		final Map<String, String> pageNumberGlobalStyles = new HashMap<>();
		final var sortablePDDocuments = new ArrayList<SortablePDDocument>();
		final var repetitionSpread = new AtomicInteger(yPosition);
		final var areaComments = new StringBuilder();

		final var areaMarkupDependencyBuilder = AreaMarkupDependency
			.builder()
			.spreadExpressionId(dependency.getSpreadExpressionId())
			.referenceSpreadExpression(referenceSpreadExpression)
			.parentTopLevelReferenceContainer(parentTopLevelReferenceContainer)
			.accessibilityMetadata(accessibilityMetadata)
			.evaluatedHeightOffset(evaluatedHeightOffset)
			.bottomLineTopMargin(bottomLineTopMargin)
			.totalPageCount(totalPageCount)
			.initialPageCount(initialPageCount)
			.repeatableSegmentIndex(repeatableSegmentIndex)
			.matchingSections(matchingSections)
			.printDocumentContext(printDocumentContext);

		final var screenReadingOrderWeight = referenceSpreadExpression.getPlaceableReference().getScreenReadingOrder().getScreenReadingOrderWeight();
		final var markupCollector = runtime.provide(new MarkupCollectorDependency()).get();

		if (visibleAreas.isEmpty()) {
			markupCollector.ifPresent(col -> col.add(
				new MarkupCollectorKey(referenceSpreadExpression.getPlaceableReference().getRefId(), printDocumentContext, screenReadingOrderWeight),
				EMPTY_STRING
			));
			return () -> new SpreadExpressionResult(
				dependency.getSpreadExpressionId(),
				new SortablePDDocument(null, referenceSpreadExpression
					.getPlaceableReference()
					.getScreenReadingOrder()
					.getScreenReadingOrderWeight()),
				referenceSpreadExpression.getHiddenSpread(yPosition),
				referenceSpreadExpression.getHiddenGravitationYPosition(yPosition),
				referenceSpreadExpression.getPosition().getY().getValue(),
				new LinkedHashMap<>(),
				new HashMap<>()
			);
		}

		visibleAreas.forEach(visibleArea -> {
			final var areaSpreadExpressionResultValueFactory = new RuntimeWalker<>(runtime).walkReference(
				new ExhaustivePrintModelVisitor() {
					private ValueFactory<AreaMarkupDependencyValueProducer.AreaSpreadExpressionResult> result;

					public Optional<ValueFactory<AreaMarkupDependencyValueProducer.AreaSpreadExpressionResult>> getAreaSpreadExpressionResult() {
						return Optional.ofNullable(result);
					}

					@Override
					public DescendCommand descendContainer(BaseReferenceContainer<? extends ElementReference> container, PrintModelPath path, int index) {
						return DescendCommand.NO_DESCEND;
					}

					@Override
					public TraversalCommand visitArea(Area area, PrintModelPath path) {
						result = () -> runtime.provide(
							areaMarkupDependencyBuilder
								.element(area)
								.childSpreadExpressionIds(area.getReferences().stream().map(ElementReference::getRefId).toArray(String[]::new))
								.yPosition(repetitionSpread.get())
								.build()
						).get();
						return TraversalCommand.HALT;
					}
				},
				new PrintModelTreeTrace<>(parentPath, visibleArea),
				visitor -> visitor.getAreaSpreadExpressionResult()
			).orElseThrow(() -> new PrintException("The reference walker needs to return as AreaSpreadExpressionResult."));

			final var areaSpreadExpressionResult = areaSpreadExpressionResultValueFactory.get();
			attachmentsToAppend.putAll(areaSpreadExpressionResult.getAttachmentsToAppend());
			pageNumberGlobalStyles.putAll(areaSpreadExpressionResult.getPageNumberGlobalStyles());
			sortablePDDocuments.add(areaSpreadExpressionResult.getSortablePDDocument());
			repetitionSpread.set(areaSpreadExpressionResult.getSpreadWithoutMargin());
			areaComments.append(new MarkupCollectorKey(visibleArea.getRefId(), printDocumentContext).getElementComment());
		});

		markupCollector.ifPresent(col -> col.add(
			new MarkupCollectorKey(
				referenceSpreadExpression.getPlaceableReference().getRefId(),
				printDocumentContext,
				screenReadingOrderWeight
			),
			areaComments.toString()
		));

		final var heightOfAllRepetitions = repetitionSpread.get() - yPosition;
		final var spread = referenceSpreadExpression.getSpread(yPosition, heightOfAllRepetitions);

		return () -> new SpreadExpressionResult(
			dependency.getSpreadExpressionId(),
			new SortablePDDocument(
				new PDDocumentContainer(sortablePDDocuments),
				screenReadingOrderWeight
			),
			spread,
			yPosition,
			referenceSpreadExpression.getPosition().getY().getValue(),
			attachmentsToAppend,
			pageNumberGlobalStyles
		);
	}
}

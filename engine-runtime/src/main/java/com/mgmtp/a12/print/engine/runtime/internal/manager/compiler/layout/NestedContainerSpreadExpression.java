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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.PrintModelId;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.pdfBox.PDDocumentContainer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.container.area.AreaMarkupDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.container.boundingBox.BoundingBoxMarkupDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.container.switchCase.SwitchMarkupDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.AttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.MarkupCollectorDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.metadata.AccessibilityMetadataDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.rendering.MarkupCollectorKey;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.computation.ComputationExpression;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.LogicContainerEvaluationDependency;
import com.mgmtp.a12.print.engine.runtime.internal.runtime.RuntimeWalker;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Variable;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.container.BaseReferenceContainer;
import com.mgmtp.a12.print.model.api.model.container.TopLevelReferenceContainer;
import com.mgmtp.a12.print.model.api.model.element.base.DataContext;
import com.mgmtp.a12.print.model.api.model.element.type.area.Area;
import com.mgmtp.a12.print.model.api.model.element.type.boundingBox.BoundingBox;
import com.mgmtp.a12.print.model.api.model.element.type.switchCase.Switch;
import com.mgmtp.a12.print.model.api.model.reference.ElementReference;
import com.mgmtp.a12.print.model.api.walker.DescendCommand;
import com.mgmtp.a12.print.model.api.walker.TraversalCommand;
import com.mgmtp.a12.print.model.api.walker.model.ExhaustivePrintModelVisitor;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;
import lombok.EqualsAndHashCode;
import lombok.NonNull;
import lombok.Value;

import java.util.*;

import static com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants.EMPTY_STRING;

@Value
@EqualsAndHashCode(callSuper = true)
public class NestedContainerSpreadExpression extends ContainerSpreadExpression {

	private static final String TEMPLATE = "element/container.ftlx";

	@NonNull ReferenceSpreadExpression referenceSpreadExpression;
	@NonNull TopLevelReferenceContainer parentTopLevelReferenceContainer;

	private final MatchingSections matchingSections;

	int bottomLineTopMargin;

	public NestedContainerSpreadExpression(
		@NonNull String id,
		@NonNull BaseReferenceContainer<? extends ElementReference>  container,
		@NonNull TopLevelReferenceContainer parentTopLevelReferenceContainer,
		@NonNull String[] childSpreadExpressionIds,
		MatchingSections matchingSections,
		@NonNull PrintModelId printModelId,
		@NonNull ReferenceSpreadExpression referenceSpreadExpression,
		int bottomLineTopMargin
	){
		super(id, container, childSpreadExpressionIds, printModelId);
		this.bottomLineTopMargin = bottomLineTopMargin;
		this.referenceSpreadExpression = referenceSpreadExpression;
		this.parentTopLevelReferenceContainer = parentTopLevelReferenceContainer;
		this.matchingSections = matchingSections;
	}

	@Override
	public ValueFactory<SpreadExpressionResult> produce(SpreadExpressionDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfPrintEngineRuntime runtime) {
		final var printDocumentContext = dependency.getPrintDocumentContext();
		final var evaluatedHeightOffset = dependency.getEvaluatedHeightOffset();
		final var totalPageCount = dependency.getTotalPageCount();
		final var initialPageCount = dependency.getInitialPageCount();
		final var repeatableSegmentIndex = dependency.getRepeatableSegmentIndex();

		final var placeableReference = this.referenceSpreadExpression.getPlaceableReference();
		final var parentPath = this.referenceSpreadExpression.getParentPath();

		var isHidden = false;

		if (!placeableReference.getHideConditions().isEmpty()) {
			var hidden = runtime.provide(
				new LogicContainerEvaluationDependency(new PrintModelTreeTrace<>(parentPath, placeableReference),
					new ComputationExpression.Parameters()
						.withPrintDocumentContext(dependency.getPrintDocumentContext()))
			).get();
			isHidden = hidden.getValue().filter(e -> Objects.equals(e, true)).isPresent();
		}

		final var finalYPosition = runtime.provide(new FinalYPositionDependency(
			this.referenceSpreadExpression.getDependentSpreadExpressionIds(),
			evaluatedHeightOffset,
			this.referenceSpreadExpression.getPosition(),
			this.referenceSpreadExpression.getTopMargin().orElse(null),
			totalPageCount,
			initialPageCount,
			repeatableSegmentIndex,
			printDocumentContext
		)).get();

		final var screenReadingOrderWeight = referenceSpreadExpression
			.getPlaceableReference()
			.getScreenReadingOrder()
			.getScreenReadingOrderWeight();

		if (isHidden) {
			return () -> getHiddenSpreadExpressionResult(
				dependency.getSpreadExpressionId(), runtime, placeableReference.getRefId(), printDocumentContext, screenReadingOrderWeight, finalYPosition
			);
		}

		final var accessibilityMetadata = runtime.provide(new AccessibilityMetadataDependency(getPrintModelId(), printDocumentContext)).get();

		return new RuntimeWalker<>(runtime).walkContainer(
			new ExhaustivePrintModelVisitor() {

				private ValueFactory<SpreadExpressionResult> result;

				public Optional<ValueFactory<SpreadExpressionResult>> getSpreadExpressionResult() {
					return Optional.ofNullable(result);
				}

				@Override
				public DescendCommand descendContainer(BaseReferenceContainer<? extends ElementReference> container, PrintModelPath path, int index) {
					return DescendCommand.NO_DESCEND;
				}

				@Override
				public TraversalCommand visitBoundingBox(BoundingBox box, PrintModelPath path) {
					result = runtime.provide(BoundingBoxMarkupDependency.builder()
						.spreadExpressionId(dependency.getSpreadExpressionId())
						.element(box)
						.referenceSpreadExpression(referenceSpreadExpression)
						.printDocumentContext(printDocumentContext)
						.accessibilityMetadata(accessibilityMetadata)
						.parentTopLevelReferenceContainer(parentTopLevelReferenceContainer)
						.childSpreadExpressionIds(getChildSpreadExpressionIds())
						.matchingSections(matchingSections)
						.yPosition(finalYPosition)
						.evaluatedHeightOffset(evaluatedHeightOffset)
						.totalPageCount(totalPageCount)
						.initialPageCount(initialPageCount)
						.repeatableSegmentIndex(repeatableSegmentIndex)
						.build()
					);
					return TraversalCommand.HALT;
				}

				@Override
				public TraversalCommand visitArea(Area area, PrintModelPath path) {
					final var repAreaContext = area.getAreaProperties().getDataContexts().stream()
						.filter(DataContext::isRepetition).findFirst();

					final var areaMarkupDependencyBuilder = AreaMarkupDependency.builder()
						.spreadExpressionId(dependency.getSpreadExpressionId())
						.element(area)
						.referenceSpreadExpression(referenceSpreadExpression)
						.evaluatedHeightOffset(evaluatedHeightOffset)
						.accessibilityMetadata(accessibilityMetadata)
						.parentTopLevelReferenceContainer(parentTopLevelReferenceContainer)
						.bottomLineTopMargin(bottomLineTopMargin)
						.matchingSections(matchingSections)
						.totalPageCount(totalPageCount)
						.initialPageCount(initialPageCount)
						.repeatableSegmentIndex(repeatableSegmentIndex)
						.childSpreadExpressionIds(getChildSpreadExpressionIds());

					if (repAreaContext.isPresent()) {
						final var documentContextRepetitions = printDocumentContext
							.findRepetitions(Variable.abs(repAreaContext.get().getPath()))
							.toList();

						if (documentContextRepetitions.isEmpty()) {
							result = () -> getHiddenSpreadExpressionResult(
							 	dependency.getSpreadExpressionId(), runtime, placeableReference.getRefId(), printDocumentContext, screenReadingOrderWeight, finalYPosition
							);
							return TraversalCommand.HALT;
						}

						final LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend = new LinkedHashMap<>();
						final Map<String, String> pageNumberGlobalStyles = new HashMap<>();
						final var sortablePDDocuments = new ArrayList<SortablePDDocument>();

						final int documentContextRepetitionCount = documentContextRepetitions.size();
						final int repetitionCount = area.getAreaProperties().getMaxRepetitions().map(maxRepetitions ->
								Math.min(
									documentContextRepetitionCount,
									maxRepetitions
								)
							).orElse(documentContextRepetitionCount);

						int repetitionSpread = finalYPosition;
						final var areaComments = new StringBuilder();

						for (var i = 0; i < repetitionCount; i++) {
							final var repetition = documentContextRepetitions.get(i);
							final var repAreaResult = runtime.provide(areaMarkupDependencyBuilder
								.yPosition(repetitionSpread)
								.printDocumentContext(repetition)
								.build()
							).get();
							attachmentsToAppend.putAll(repAreaResult.getAttachmentsToAppend());
							pageNumberGlobalStyles.putAll(repAreaResult.getPageNumberGlobalStyles());
							sortablePDDocuments.add(repAreaResult.getSortablePDDocument());
							repetitionSpread = repAreaResult.getSpreadWithoutMargin();
							areaComments.append(
								new MarkupCollectorKey(area.getId(), repetition).getElementComment()
							);
						}

						runtime.provide(new MarkupCollectorDependency()).get().ifPresent(col -> col.add(
							new MarkupCollectorKey(area.getId(), printDocumentContext, screenReadingOrderWeight),
							areaComments.toString())
						);

						final var heightOfAllRepetitions = repetitionSpread - finalYPosition;
						final var spread = referenceSpreadExpression.getSpread(finalYPosition, heightOfAllRepetitions);

						result = () -> new SpreadExpressionResult(
							dependency.getSpreadExpressionId(),
							new SortablePDDocument(
								new PDDocumentContainer(sortablePDDocuments),
								screenReadingOrderWeight
							),
							spread,
							finalYPosition,
							referenceSpreadExpression.getPosition().getY().getValue(),
							attachmentsToAppend,
							pageNumberGlobalStyles
						);
					} else {
						result = () -> runtime.provide(areaMarkupDependencyBuilder
							.yPosition(finalYPosition)
							.printDocumentContext(printDocumentContext)
							.build()
						).get();
					}
					return TraversalCommand.HALT;
				}

				@Override
				public TraversalCommand visitSwitch(Switch switchElement, PrintModelPath path) {
					result = runtime.provide(
						SwitchMarkupDependency
							.builder()
							.spreadExpressionId(dependency.getSpreadExpressionId())
							.element(switchElement)
							.parentTopLevelReferenceContainer(parentTopLevelReferenceContainer)
							.accessibilityMetadata(accessibilityMetadata)
							.referenceSpreadExpression(referenceSpreadExpression)
							.matchingSections(matchingSections)
							.parentPath(parentPath)
							.printDocumentContext(printDocumentContext)
							.yPosition(finalYPosition)
							.evaluatedHeightOffset(evaluatedHeightOffset)
							.totalPageCount(totalPageCount)
							.initialPageCount(initialPageCount)
							.repeatableSegmentIndex(repeatableSegmentIndex)
							.build()
					);
					return TraversalCommand.HALT;
				}
			},
			new PrintModelTreeTrace<>(parentPath, getContainer()),
			visitor -> visitor.getSpreadExpressionResult()
		).orElseThrow(() -> new PrintException("The container walker needs to return as SpreadExpressionResult."));
	}

	private SpreadExpressionResult getHiddenSpreadExpressionResult(
		String spreadExpressionId,
		InternalPdfPrintEngineRuntime runtime,
		String id,
		PrintDocumentContext documentContext,
		int screenReadingOrderWeight,
		int finalYPosition
	) {
		runtime.provide(new MarkupCollectorDependency()).get().ifPresent(col -> col.add(
			new MarkupCollectorKey(id, documentContext, screenReadingOrderWeight),
			EMPTY_STRING
		));
		return new SpreadExpressionResult(
			spreadExpressionId,
			new SortablePDDocument(null, screenReadingOrderWeight),
			referenceSpreadExpression.getHiddenSpread(finalYPosition),
			referenceSpreadExpression.getHiddenGravitationYPosition(finalYPosition),
			referenceSpreadExpression.getPosition().getY().getValue(),
			new LinkedHashMap<>(),
			new HashMap<>()
		);
	}
}

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
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.pdfBox.PDDocumentWrapper;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.ReferenceMarkupResultDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.heightCalculation.EvaluatedHeightDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.AddStylesToMarkupDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.AttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.MarkupCollectorDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.metadata.AccessibilityMetadataDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.rendering.MarkupCollectorKey;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfPrintEngineRuntime;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.container.TopLevelReferenceContainer;
import com.mgmtp.a12.print.model.api.model.element.base.Position;
import com.mgmtp.a12.print.model.api.model.reference.PlaceableReference;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NonNull;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import static com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants.EMPTY_STRING;

@Data
@AllArgsConstructor
public class ReferenceSpreadExpression implements SpreadExpression {
	@NonNull
	private final String id;

	/*
		separate position which takes footer position and section offset into account
	 */
	@NonNull
	private final Position position;

	@NonNull
	private final PlaceableReference placeableReference;
	@NonNull
	private final PrintModelPath parentPath;
	@NonNull
	private final PrintModelId printModelId;
	@NonNull
	private final TopLevelReferenceContainer parentTopLevelReferenceContainer;

	private final MatchingSections matchingSections;

	private String[] dependentSpreadExpressionIds;

	private Integer bottomMargin;

	private Integer topMargin;

	public int getBottom() {
		return this.getPosition().getY().getValue() +
			this.getPlaceableReference().getDimensions().getHeight().getValue();
	}

	@Override
	public ValueFactory<SpreadExpressionResult> produce(SpreadExpressionDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfPrintEngineRuntime runtime) {
		final var printDocumentContext = dependency.getPrintDocumentContext();
		final var evaluatedHeightOffset = dependency.getEvaluatedHeightOffset();
		final var totalPageCount = dependency.getTotalPageCount();
		final var initialPageCount = dependency.getInitialPageCount();
		final var repeatableSegmentIndex = dependency.getRepeatableSegmentIndex();
		final var sections = MatchingSections.awareOfSegmentIndex(matchingSections, repeatableSegmentIndex);

		final var markupResultValueFactory = runtime.provide(new ReferenceMarkupResultDependency(
			new PrintModelTreeTrace<>(parentPath, placeableReference),
			printDocumentContext
		));
		final var markupResult = markupResultValueFactory.get();

		final int finalYPosition = runtime.provide(new FinalYPositionDependency(
			getDependentSpreadExpressionIds(),
			evaluatedHeightOffset,
			getPosition(),
			topMargin,
			totalPageCount,
			initialPageCount,
			repeatableSegmentIndex,
			printDocumentContext
		)).get();

		final int spread;
		final PDDocumentWrapper pdDocumentWrapper;
		final LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend;
		final Map<String, String> pageNumberGlobalStyles;

		final var screenReadingOrderWeight = placeableReference.getScreenReadingOrder().getScreenReadingOrderWeight();
		final var markupCollectorKey = new MarkupCollectorKey(placeableReference.getRefId(), printDocumentContext, screenReadingOrderWeight);
		final var markupCollector = runtime.provide(new MarkupCollectorDependency()).get();

		int gravitationYPosition;
		if (markupResult.isHidden()) {
			spread = getHiddenSpread(finalYPosition);
			gravitationYPosition = getHiddenGravitationYPosition(finalYPosition);
			pdDocumentWrapper = null;
			attachmentsToAppend = new LinkedHashMap<>();
			pageNumberGlobalStyles = new HashMap<>();

			markupCollector.ifPresent(col -> col.add(markupCollectorKey, EMPTY_STRING));
		} else {
			final var markup = runtime.provide(new AddStylesToMarkupDependency(
				markupResult.getMarkup(),
				Map.of("top", String.format("%dmm", finalYPosition)),
				true
			)).get();

			markupCollector.ifPresent(col -> col.add(markupCollectorKey, markup));

			final var evaluatedHeightMarkup = evaluatedHeightOffset.getYOffset() > 0 || evaluatedHeightOffset.getXOffset() > 0
				? runtime.provide(new AddStylesToMarkupDependency(
					markupResult.getMarkup(),
					Map.of(
						"top", String.format("%dmm", finalYPosition + evaluatedHeightOffset.getYOffset()),
						"left", String.format("%dmm", getPosition().getX().getValue() + evaluatedHeightOffset.getXOffset())
					),
					true
				)).get()
				: markup;

			pageNumberGlobalStyles = markupResult.getPageNumberGlobalStyles();

			final var accessibilityMetadata = runtime.provide(new AccessibilityMetadataDependency(printModelId, printDocumentContext)).get();

			final var evaluatedHeightResult = runtime.provide(new EvaluatedHeightDependency(
				evaluatedHeightMarkup,
				parentTopLevelReferenceContainer,
				accessibilityMetadata,
				sections,
				totalPageCount,
				initialPageCount,
				pageNumberGlobalStyles
			)).get();
			final var evaluatedHeight = evaluatedHeightResult.getEvaluatedHeight();

			pdDocumentWrapper = evaluatedHeightResult.getPdDocumentWrapper();

			attachmentsToAppend = markupResult.getAttachmentsToAppend();
			spread = getSpread(finalYPosition, evaluatedHeight);

			gravitationYPosition = getGravitationYPosition(
				finalYPosition,
				placeableReference.getDimensions().getHeight().getValue(),
				evaluatedHeight
			);
		}

		return () -> new SpreadExpressionResult(
			dependency.getSpreadExpressionId(),
			new SortablePDDocument(
				pdDocumentWrapper,
				screenReadingOrderWeight
			),
			spread,
			gravitationYPosition,
			getPosition().getY().getValue(),
			attachmentsToAppend,
			pageNumberGlobalStyles
		);
	}

	public int getSpread(int yPosition, Integer evaluatedHeight) {
		return yPosition + evaluatedHeight + getBottomMargin().orElse(0);
	}

	public int getHiddenSpread(int yPosition) {
		// if the element is hidden the spread is the same as the
		// yPosition because the height and the bottom margin are hidden
		return yPosition;
	}

	public Optional<Integer> getBottomMargin() {
		return Optional.ofNullable(bottomMargin);
	}

	public Optional<Integer> getTopMargin() {
		return Optional.ofNullable(topMargin);
	}

	public int getHiddenGravitationYPosition(int yPosition) {
		// if the element is hidden the y position needs to be reduced with the outer box of the element
		// this is important for the calculations of the Y positions of the elements, which have the current element as dependency
		return yPosition -
			placeableReference.getDimensions().getHeight().getValue() -
			getBottomMargin().orElse(0) -
			getTopMargin().orElse(0);
	}

	private int getGravitationYPosition(int yPosition, int originHeight, int evaluatedHeight) {
		// if the element height is smaller than before the difference needs to be subtracted from the Y position
		return yPosition - Math.max(originHeight - evaluatedHeight, 0);
	}
}

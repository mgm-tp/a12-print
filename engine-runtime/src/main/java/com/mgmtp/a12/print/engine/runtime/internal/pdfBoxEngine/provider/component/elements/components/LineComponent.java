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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components;

import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.documentHandle.RegionCursor;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.BaseComponent;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.ComponentResult;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.PreflightedComponent;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.PreflightedComponentResult;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Size;
import com.mgmtp.a12.print.model.api.model.element.properties.BorderProperties;
import lombok.EqualsAndHashCode;
import lombok.NonNull;
import lombok.Value;
import lombok.experimental.SuperBuilder;

import java.util.Optional;

import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.RenderUtils.setBorderStyle;
import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.RenderUtils.setStrokingColor;

@Value
@EqualsAndHashCode(callSuper = true)
@SuperBuilder(toBuilder = true)
public class LineComponent extends BaseComponent {
	Integer color;
	BorderProperties.BorderStyle style;
	Long thickness;
	Size size;

	public LineComponent(
		String id,
		Integer color,
		BorderProperties.BorderStyle style,
		Long thickness,
		Size size
	) {
		super(id);
		this.color = color;
		this.style = style;
		this.size = size;
		this.thickness = thickness;
	}

	@Override
	public ComponentResult render(@NonNull RegionCursor regionCursor, boolean preventPageBreak) {
		final var preflightResult = preflightLine(regionCursor, preventPageBreak);
		return renderLine(preflightResult, regionCursor);
	}

	@Override
	public PreflightedComponent preflight(@NonNull RegionCursor regionCursor, boolean preventPageBreak) {
		final var preflightResult = preflightLine(regionCursor, preventPageBreak);

		return new PreflightedComponent() {
			@Override
			public PreflightedComponentResult renderPreflightedComponent() {
				return new PreflightedComponentResult(
					renderLine(preflightResult, regionCursor),
					regionCursor
				);
			}

			@Override
			public ComponentResult getPreflightedComponentResult() {
				return getPreflightedComponentResultFromLineResult(preflightResult);
			}
		};
	}

	private ComponentResult getPreflightedComponentResultFromLineResult(
		@NonNull LinePreflightResult preflightResult
	) {
		final var resultLineHeight = preflightResult.lineHeight;
		if (resultLineHeight == 0) {
			return new ComponentResult(Optional.empty(), 0);
		} else if (preflightResult.onNextPage) {
			return new ComponentResult(Optional.of(this), resultLineHeight);
		} else if (preflightResult.remainingLineThickness != null) {
			return new ComponentResult(Optional.of(
				this.toBuilder().thickness(preflightResult.remainingLineThickness).build()
			), resultLineHeight);
		} else {
			return new ComponentResult(Optional.empty(), resultLineHeight);
		}
	}

	record LinePreflightResult(long lineHeight, Long remainingLineThickness, boolean onNextPage) {}

	private LinePreflightResult preflightLine(@NonNull RegionCursor regionCursor, boolean preventPageBreak) {
		final var remainingSpace = regionCursor.getRemainingRegionSpace();
		final var regionSpace = regionCursor.getRegionSpace();
		final var lineThickness = Optional.ofNullable(thickness);

		if (lineThickness.isPresent() && lineThickness.get() == 0L) {
			return new LinePreflightResult( 0, null, false);
		}

		long resultLineHeight = getLineHeight();

		Long remainingLineThickness = null;
		if (isLocatedOnPageBreak(resultLineHeight, remainingSpace)) {
			remainingLineThickness = resultLineHeight - remainingSpace;
			resultLineHeight = remainingSpace;
			if (preventPageBreak && resultLineHeight <= regionSpace) {
				return new LinePreflightResult(resultLineHeight, null, true);
			}
		}

		if (remainingLineThickness != null) {
			return new LinePreflightResult(resultLineHeight, remainingLineThickness, false);
		}

		return new LinePreflightResult(resultLineHeight, null, false);
	}

	private ComponentResult renderLine(
		@NonNull LinePreflightResult preflightResult,
		@NonNull RegionCursor regionCursor
	) {
		final var contentStream = regionCursor.getContentStream();
		final var position = regionCursor.getPosition();
		final var width = size.getWidth();
		final var resultLineHeight = preflightResult.lineHeight;

		if (resultLineHeight == 0) {
			return new ComponentResult(Optional.empty(), 0);
		} else if (preflightResult.onNextPage) {
			return new ComponentResult(Optional.of(this), resultLineHeight);
		}

		final var lineColor = Optional.ofNullable(color);
		final var lineThickness = Optional.ofNullable(thickness);
		final var lineStyle = Optional.ofNullable(style);

		final var hasGraphicStateChanges =
			lineThickness.isPresent() ||
				(lineColor.isPresent() && lineColor.get() != 0) ||
				(lineStyle.isPresent() && lineStyle.get() != BorderProperties.BorderStyle.SOLID);

		if (hasGraphicStateChanges) {
			contentStream.saveGraphicsState();
		}

		contentStream.beginArtifactMarkedContent();

		if (resultLineHeight != 100L) {
			contentStream.setLineWidth(resultLineHeight);
		}

		lineColor.ifPresent(value -> setStrokingColor(contentStream, value));

		if (lineStyle.isPresent()) {
			setBorderStyle(contentStream, lineStyle.get(), resultLineHeight);
		}

		final var invertedY = PDFUnitUtil.invertYPos(position.getY(), resultLineHeight / 2, contentStream.getPage());
		contentStream.moveTo(position.getX(), invertedY);
		contentStream.lineTo(position.getX() + width, invertedY);
		contentStream.stroke();

		contentStream.endMarkedContent();

		if (hasGraphicStateChanges) {
			contentStream.restoreGraphicsState();
		}

		if (preflightResult.remainingLineThickness != null) {
			return new ComponentResult(Optional.of(
				this.toBuilder().thickness(preflightResult.remainingLineThickness).build()
			), resultLineHeight);
		}

		return new ComponentResult(Optional.empty(), resultLineHeight);
	}
	@Override
	public boolean isLocatedOnPageBreak(@NonNull RegionCursor regionCursor) {
		return isLocatedOnPageBreak(getLineHeight(), regionCursor.getRemainingRegionSpace());
	}

	private boolean isLocatedOnPageBreak(long lineHeight, long remainingSpace) {
		return lineHeight > remainingSpace;
	}

	private long getLineHeight() {
		return Optional.ofNullable(thickness).orElse(100L);
	}

}

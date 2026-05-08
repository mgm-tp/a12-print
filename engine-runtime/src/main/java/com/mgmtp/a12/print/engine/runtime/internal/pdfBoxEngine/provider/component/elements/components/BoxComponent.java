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
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.BoxRenderer;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.BoxStyleParameters;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Size;
import com.mgmtp.a12.print.model.api.model.element.ElementType;
import com.mgmtp.a12.print.model.api.model.element.properties.BorderProperties;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NonNull;
import lombok.Value;
import lombok.experimental.SuperBuilder;

import java.util.Optional;

@Value
@EqualsAndHashCode(callSuper = true)
@SuperBuilder(toBuilder = true)
public class BoxComponent extends BaseComponent {
	@NonNull
	Size size;
	BorderProperties borderProperties;
	@NonNull
	ElementType elementType;
	boolean ongoingRendering;

	public BoxComponent(String id, @NonNull Size size, BorderProperties borderProperties, ElementType elementType) {
		super(id);
		this.size = size;
		this.borderProperties = borderProperties;
		this.elementType = elementType;
		this.ongoingRendering = false;
	}

	@Override
	public ComponentResult render(@NonNull RegionCursor regionCursor, boolean preventPageBreak) {
		final var borderRenderResult = renderBorder(
			regionCursor,
			size,
			borderProperties,
			ongoingRendering,
			preventPageBreak
		);

		return getFinalComponentResult(borderRenderResult);
	}

	@Override
	public PreflightedComponent preflight(@NonNull RegionCursor regionCursor, boolean preventPageBreak) {
		final var borderPreflightResult = preflightBorder(
			regionCursor,
			size,
			ongoingRendering,
			preventPageBreak
		);
		return new PreflightedComponent() {
			@Override
			public PreflightedComponentResult renderPreflightedComponent() {
				return new PreflightedComponentResult(
					getFinalComponentResult(renderBorder(borderPreflightResult, regionCursor, size, borderProperties)),
					regionCursor
				);
			}

			@Override
			public ComponentResult getPreflightedComponentResult() {
				return getFinalComponentResult(borderPreflightResult);
			}
		};
	}

	@Override
	public boolean isLocatedOnPageBreak(@NonNull RegionCursor regionCursor) {
		return isLocatedOnPageBreak(size, regionCursor.getRemainingRegionSpace());
	}

	private static boolean isLocatedOnPageBreak(Size size, long remainingRegionSpace) {
		return size.getHeight() > remainingRegionSpace;
	}

	private ComponentResult getFinalComponentResult(BorderRenderResult borderRenderResult) {
		if (borderRenderResult.heightToRender != null) {
			return new ComponentResult(
				Optional.of(this.toBuilder()
					.ongoingRendering(!borderRenderResult.completelyOnNextPage)
					.size(new Size(
						size.getWidth(),
						borderRenderResult.completelyOnNextPage
							? size.getHeight()
							: size.getHeight() - borderRenderResult.heightToRender
					)).build()),
				borderRenderResult.heightToRender
			);
		}

		return new ComponentResult(Optional.empty(), size.getHeight());
	}

	public static BorderRenderResult renderBorder(
		@NonNull final RegionCursor regionCursor,
		@NonNull final Size originSize,
		final BorderProperties borderProperties,
		boolean ongoingRendering,
		boolean preventPageBreak
	) {
		final var preflightResult = preflightBorder(
			regionCursor,
			originSize,
			ongoingRendering,
			preventPageBreak
		);
		return renderBorder(preflightResult, regionCursor, originSize, borderProperties);
	}

	private static BorderRenderResult renderBorder(
		@NonNull final BorderPreflightResult preflightResult,
		@NonNull final RegionCursor regionCursor,
		@NonNull final Size originSize,
		final BorderProperties borderProperties
	) {
		if (preflightResult.isCompletelyOnNextPage()) {
			return preflightResult;
		}

		final var heightToRender = preflightResult.getHeightToRender();
		final var borderRenderMode = preflightResult.getBorderRenderMode();
		final var contentStream = regionCursor.getContentStream();
		final var position = regionCursor.getPosition();

		final var sizeToRender = heightToRender != null ? new Size(originSize.getWidth(), heightToRender) : originSize;
		BoxStyleParameters boxStyle = BoxStyleParameters.fromBorderPropertiesBuilder(borderProperties)
			.borderRenderMode(borderRenderMode)
			.build()
			.setInset(true);
		BoxRenderer.renderBorder(contentStream, position, sizeToRender, boxStyle);
		return new BorderPreflightResult(heightToRender, false, null);
	}

	private static BorderPreflightResult preflightBorder(
		@NonNull final RegionCursor regionCursor,
		@NonNull final Size originSize,
		boolean ongoingRendering,
		boolean preventPageBreak
	) {
		final var remainingRegionSpace = regionCursor.getRemainingRegionSpace();
		final var regionSpace = regionCursor.getRegionSpace();

		Long heightToRender = null;
		var borderRenderMode = BoxStyleParameters.BorderRenderMode.FULL;
		if (ongoingRendering) {
			if (isLocatedOnPageBreak(originSize, remainingRegionSpace)) {
				heightToRender = remainingRegionSpace;
				borderRenderMode = BoxStyleParameters.BorderRenderMode.BETWEEN;
			} else {
				borderRenderMode = BoxStyleParameters.BorderRenderMode.END;
			}
		} else if (isLocatedOnPageBreak(originSize, remainingRegionSpace)) {
			if (preventPageBreak && originSize.getHeight() <= regionSpace) {
				return new BorderPreflightResult(remainingRegionSpace, true, null);
			} else {
				borderRenderMode = BoxStyleParameters.BorderRenderMode.START;
				heightToRender = remainingRegionSpace;
			}
		}

		return new BorderPreflightResult(heightToRender, false, borderRenderMode);
	}

	@Data
	public static class BorderRenderResult {
		private final Long heightToRender;
		private final boolean completelyOnNextPage;
	}

	@Value
	@EqualsAndHashCode(callSuper = true)
	private static class BorderPreflightResult extends BorderRenderResult {
		BoxStyleParameters.BorderRenderMode borderRenderMode;

		public BorderPreflightResult(
			Long heightToRender,
			boolean completelyOnNextPage,
			BoxStyleParameters.BorderRenderMode borderRenderMode
		) {
			super(heightToRender, completelyOnNextPage);
			this.borderRenderMode = borderRenderMode;
		}
	}
}

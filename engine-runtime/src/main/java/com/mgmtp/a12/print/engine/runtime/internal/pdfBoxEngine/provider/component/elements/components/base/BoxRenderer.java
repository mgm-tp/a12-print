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

import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Position;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Size;
import lombok.NonNull;

import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.AccessibilityData.EMPTY_ACCESSIBILITY_DATA;
import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.RenderUtils.*;

public class BoxRenderer {
	private BoxRenderer() {}

	public static AccessibilityData renderBackground(
		@NonNull final ContentStreamAdapter contentStream,
		@NonNull final Position position,
		@NonNull final Size size,
		final BoxStyleParameters boxStyle
	) {
		return renderBackground(contentStream, position, size, boxStyle, true);
	}

	public static AccessibilityData renderBorder(
		@NonNull final ContentStreamAdapter contentStream,
		@NonNull final Position position,
		@NonNull final Size size,
		final BoxStyleParameters boxStyle
	) {
		return renderBorder(contentStream, position, size, boxStyle, true);
	}

	public static AccessibilityData renderBackground(
		@NonNull final ContentStreamAdapter contentStream,
		@NonNull final Position position,
		@NonNull final Size size,
		final BoxStyleParameters boxStyle,
		final boolean handleStyleState
	) {
		if (boxStyle == null || !boxStyle.hasBackground()) {
			return EMPTY_ACCESSIBILITY_DATA;
		}

		if (handleStyleState) {
			contentStream.saveGraphicsState();
		}

		contentStream.beginArtifactMarkedContent();

		if (handleStyleState) {
			setNonStrokingColor(contentStream, boxStyle.backgroundColor);
		}

		addFilledRect(contentStream, position, size, 0);

		contentStream.endMarkedContent();

		if (handleStyleState) {
			contentStream.restoreGraphicsState();
		}

		return EMPTY_ACCESSIBILITY_DATA;
	}

	public static AccessibilityData renderBorder(
		@NonNull final ContentStreamAdapter contentStream,
		@NonNull final Position position,
		@NonNull final Size size,
		final BoxStyleParameters boxStyle,
		final boolean handleStyleState
	) {
		if (boxStyle == null || !boxStyle.hasBorder()) {
			return EMPTY_ACCESSIBILITY_DATA;
		}

		if (handleStyleState) {
			contentStream.saveGraphicsState();
		}

		contentStream.beginArtifactMarkedContent();

		if (handleStyleState) {
			setLineWidth(contentStream, boxStyle);
			setStrokingColor(contentStream, boxStyle.borderColor);
			setBorderStyle(contentStream, boxStyle.borderStyle, boxStyle.borderWidth);
		}

		addOutlineRect(contentStream, position, size, boxStyle);

		contentStream.endMarkedContent();

		if (handleStyleState) {
			contentStream.restoreGraphicsState();
		}

		return EMPTY_ACCESSIBILITY_DATA;
	}

	public static void addFilledRect(
		@NonNull final ContentStreamAdapter contentStream,
		@NonNull final Position position,
		@NonNull final Size size,
		final long offset
	) {
		final long width = size.getWidth();
		final long height = size.getHeight();

		final long yPosInverted = PDFUnitUtil.invertYPos(position.getY(), height, contentStream.getPage());

		contentStream.addRect(
			position.getX() + offset,
			yPosInverted + offset,
			width - 2 * offset,
			height - 2 * offset
		);
		contentStream.fill();
	}

	public static void addOutlineRect(
		@NonNull final ContentStreamAdapter contentStream,
		@NonNull final Position position,
		@NonNull final Size size,
		@NonNull final BoxStyleParameters boxStyleParameters
	) {
		final var offset = boxStyleParameters.getBorderDrawOffset();
		final long yPosInverted = PDFUnitUtil.invertYPos(position.getY(), size.getHeight(), contentStream.getPage());
		final var y = yPosInverted + offset;
		final var x = position.getX() + offset;

		final long width = size.getWidth() - 2 * offset;
		final long height = size.getHeight() - 2 * offset;
		final var renderMode = boxStyleParameters.borderRenderMode;

		if (renderMode.equals(BoxStyleParameters.BorderRenderMode.FULL)) {
			contentStream.addRect(x, y, width, height);
			contentStream.stroke();
		} else {
			contentStream.moveTo(x + width, y);
			contentStream.lineTo(x + width, y + height);
			contentStream.stroke();

			contentStream.moveTo(x, y);
			contentStream.lineTo(x, y + height);
			contentStream.stroke();

			if (renderMode.equals(BoxStyleParameters.BorderRenderMode.END)) {
				contentStream.moveTo(position.getX(), y);
				contentStream.lineTo(position.getX() + size.getWidth(), y);
				contentStream.stroke();
			}

			if (renderMode.equals(BoxStyleParameters.BorderRenderMode.START)) {
				contentStream.moveTo(position.getX(), y + height);
				contentStream.lineTo(position.getX() + size.getWidth(), y + height);
				contentStream.stroke();
			}
		}
	}


	public static void setLineWidth(
		@NonNull final ContentStreamAdapter contentStream,
		@NonNull final BoxStyleParameters boxStyle
	) {
		if (boxStyle.borderWidth == null || boxStyle.borderWidth == 0L || boxStyle.borderWidth == 100L) {
			return;
		}
		contentStream.setLineWidth(boxStyle.borderWidth);
	}
}

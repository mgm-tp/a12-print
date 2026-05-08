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

import com.mgmtp.a12.print.model.api.model.element.properties.BorderProperties;
import lombok.NonNull;

import java.awt.*;

import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil.longPtToFloat;

public class RenderUtils {

	private RenderUtils() {}

	public static void setStrokingColor(
		@NonNull final ContentStreamAdapter contentStream,
		final Integer color
	) {
		setColor(contentStream, color, true);
	}

	public static void setNonStrokingColor(
		@NonNull final ContentStreamAdapter contentStream,
		final Integer color
	) {
		setColor(contentStream, color, false);
	}

	private static void setColor(
		@NonNull final ContentStreamAdapter contentStream,
		final Integer colorInt,
		final boolean stroke
	) {
		if (colorInt == null) {
			return;
		}
		Color color = new Color(colorInt);
		if (color.getRed() == 0 && color.getGreen() == 0 && color.getBlue() == 0) {
			return;
		}
		float r = color.getRed() / 255f;
		float g = color.getGreen() / 255f;
		float b = color.getBlue() / 255f;

		if (stroke) {
			contentStream.setStrokingColor(r, g, b);
		} else {
			contentStream.setNonStrokingColor(r, g, b);
		}
	}

	public static void setBorderStyle(
		@NonNull final ContentStreamAdapter contentStream,
		final BorderProperties.BorderStyle style,
		final Long borderWidth
	) {
		final var floatBorderWidth = longPtToFloat(borderWidth);
		if (style.equals(BorderProperties.BorderStyle.DASHED)) {
			contentStream.setLineDashPattern(new float[]{2 * floatBorderWidth, floatBorderWidth}, 0);
		} else if (style.equals(BorderProperties.BorderStyle.DOTTED)) {
			contentStream.setLineDashPattern(new float[]{floatBorderWidth, floatBorderWidth}, 0);
		}
	}
}

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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils;

import lombok.NonNull;
import org.apache.pdfbox.pdmodel.PDPage;

public class PDFUnitUtil {
	public static final float MM_PER_INCH = 25.4F;
	public static final float PDF_POINT_PER_INCH = 72.0F;

	public static long mmToLongPt(final float mm) {
		return floatToLongPt(mm * PDF_POINT_PER_INCH / MM_PER_INCH);
	}

	public static long floatToLongPt(float value) {
		return Math.round(value * 100);
	}

	public static float longPtToFloat(long value) {
		return value / 100f;
	}

	public static long invertYPos(final long yPos, final long elementHeight, @NonNull final PDPage page) {
		return invertYPos(yPos, elementHeight, page.getMediaBox().getHeight());
	}

	public static long invertYPos(final long yPos, final long elementHeight, final float pageHeight) {
		return floatToLongPt(pageHeight) - yPos - elementHeight;
	}

	public static long invertYPos(final long yPos, @NonNull final PDPage page) {
		return invertYPos(yPos, page.getMediaBox().getHeight());
	}

	public static long invertYPos(final long yPos, final float pageHeight) {
		return floatToLongPt(pageHeight) - yPos;
	}

	public static long getFontSizeRelatedMetrics(final float originMetric, final long fontSize) {
		return floatToLongPt(originMetric) * fontSize / 100000;
	}
}

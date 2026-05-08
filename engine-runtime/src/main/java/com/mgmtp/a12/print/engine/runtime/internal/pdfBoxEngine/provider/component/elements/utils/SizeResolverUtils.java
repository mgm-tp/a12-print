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

import com.mgmtp.a12.print.model.api.model.element.base.inputSource.StringInputSource;
import com.mgmtp.a12.print.model.api.model.element.properties.BorderProperties;
import com.mgmtp.a12.print.model.api.model.element.properties.TextProperties;

import java.util.Optional;

public class SizeResolverUtils {

	private SizeResolverUtils() {}

	public static long getBorderWidth(final BorderProperties borderProperties) {
		return getOptBorderWidth(borderProperties).orElse(0L);
	}

	public static Optional<Long> getOptBorderWidth(final BorderProperties borderProperties) {
		return Optional.ofNullable(borderProperties)
			.flatMap(props ->
				props.getBorderStyle().isPresent() ? props.getBorderWidth().map(PDFUnitUtil::floatToLongPt) : Optional.empty()
			);
	}

	public static Optional<StringInputSource> getOptTextStyleId(final TextProperties textProperties) {
		return Optional.ofNullable(textProperties)
			.flatMap(props ->
				props.getTextStyleId().isPresent() ? props.getTextStyleId() : Optional.empty()
			);
	}

	public static long calculateWidth(final long containerWidth, final float percentWidth, final int totalPercent) {
		return Math.round(containerWidth * percentWidth / totalPercent);
	}

}

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
package com.mgmtp.a12.print.engine.runtime.pdf;

import com.mgmtp.a12.print.engine.runtime.internal.engine.rendering.MarkupCollector;
import com.mgmtp.a12.print.engine.runtime.internal.engine.rendering.MarkupCollectorKey;
import lombok.NonNull;

import java.util.Arrays;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.regex.Pattern;

/**
 * @deprecated since version 3.1.0
 * Will be removed in 4.0.0 (2026.06)
 */
@Deprecated(since = "3.1.0")
public class MarkupCombiner {
	private static final Pattern HTML_COMMENT_PATTERN = Pattern.compile("<!-- (.*?) -->");
	private final ConcurrentMap<MarkupCollectorKey, String> markups;

	public MarkupCombiner(final MarkupCollector markupCollector) {
		this.markups = markupCollector != null ? markupCollector.getMarkups() : new ConcurrentHashMap<>();
	}

	public String combineMarkupForSegment(@NonNull MarkupCollectorKey markupCollectorKey) {
		if (!markups.containsKey(markupCollectorKey)) {
			throw new RuntimeException("There is no markup for the segment: " + markupCollectorKey.getElementId());
		}
		final var segmentMarkup = markups.get(markupCollectorKey);

		return replaceElements(segmentMarkup);
	}

	private String replaceElements(String markup) {
		final var matcher = HTML_COMMENT_PATTERN.matcher(markup);
		while (matcher.find()) {
			final var markupElementKey = matcher.group(1);

			final var parameters = markupElementKey.split(" ");
			final var elementComment = matcher.group();

			final var markupCollectorKey = new MarkupCollectorKey(
				parameters[0],
				parameters.length > 1 ? getRepetitions(parameters[1]) : new int[0][0]
			);

			if (!markups.containsKey(markupCollectorKey)) {
				throw new RuntimeException("There is no markup for the element: " + markupCollectorKey.getElementId());
			}

			final var elementMarkup = markups.get(markupCollectorKey);

			if (elementMarkup != null) {
				markup = markup.replace(elementComment, replaceElements(elementMarkup));
			}
		}

		return markup;
	}

	private int[][] getRepetitions(String parameter) {
		return Arrays.stream(parameter.split(";"))
			.map(rep ->
				Arrays.stream(rep.split(","))
					.map(Integer::parseInt)
					.mapToInt(i -> i)
					.toArray()
			).toArray(int[][]::new);
	}
}

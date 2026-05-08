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

import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.InnerTextToken;
import com.mgmtp.a12.print.model.api.model.element.properties.TextProperties;
import lombok.Getter;
import lombok.NonNull;

import java.util.List;
import java.util.Objects;

import static com.mgmtp.a12.print.model.api.model.element.properties.TextProperties.Alignment.JUSTIFY;
import static com.mgmtp.a12.print.model.api.model.element.properties.TextProperties.Alignment.LEFT;


public class TextRenderAlignment {
	private final TextProperties.Alignment alignment;
	@Getter
	private final long alignmentPosition;

	// only needed for justify
	private final boolean isLastLine;
	private final long extraWidthPerSpace;

	public TextRenderAlignment(List<InnerTextToken> innerTextTokens, boolean isLastLine, long initialXPosition, long maxWidth) {
		this.alignment = getAppliedAlignment(innerTextTokens);
		this.alignmentPosition = getAlignmentPosition(innerTextTokens, alignment, initialXPosition, maxWidth);
		this.isLastLine = isLastLine;
		if (alignment == JUSTIFY) {
			this.extraWidthPerSpace = TextRenderAlignment.determineWidthPerSpace(innerTextTokens, maxWidth);
		} else {
			this.extraWidthPerSpace = 0L;
		}
	}

	public boolean isJustifyApplied() {
		return alignment == JUSTIFY && !isLastLine;
	}

	public long getExtraWidth(InnerTextToken innerTextToken) {
		final int spaceCount = innerTextToken.getTrailingSpaceCount();
		return extraWidthPerSpace * spaceCount;
	}

	private static long determineWidthPerSpace(List<InnerTextToken> innerTextTokens, long maxWidth) {
		long contentWidth = getLineWidth(innerTextTokens);
		final long extraWidth = Math.max(0L, maxWidth - contentWidth);
		int totalSpaces = 0;
		for (final var token : innerTextTokens) {
			totalSpaces += token.getTrailingSpaceCount();
		}
		return totalSpaces == 0 ? 0L : extraWidth / totalSpaces;
	}

	private static TextProperties.Alignment getAppliedAlignment(
		@NonNull final java.util.List<InnerTextToken> innerTextTokens
	) {
		final var tokenAlignments = innerTextTokens.stream()
			.map(token -> token.getStyle().getAlignment())
			.filter(Objects::nonNull)
			.distinct()
			.toList();

		if (tokenAlignments.size() > 1) {
			throw new PrintRenderingException("More than one alignment for one line was found and could not be rendered");
		}

		if (tokenAlignments.size() == 1) {
			return tokenAlignments.getFirst();
		}

		return LEFT;
	}

	private static long getAlignmentPosition(
		@NonNull final java.util.List<InnerTextToken> innerTextTokens,
		final TextProperties.Alignment appliedAlignment,
		final long initialXPosition,
		final long maxWidth
	) {
		if (appliedAlignment == LEFT || appliedAlignment == JUSTIFY) {
			return initialXPosition;
		}

		final var contentWidth = getLineWidth(innerTextTokens);

		return switch (appliedAlignment) {
			case CENTER -> initialXPosition + ((maxWidth - contentWidth) / 2);
			case RIGHT -> initialXPosition + (maxWidth - contentWidth);
			default -> throw new PrintRenderingException("Unexpected alignment " + appliedAlignment);
		};
	}

	private static long getLineWidth(List<InnerTextToken> innerTextTokens) {
		return innerTextTokens.stream().map(InnerTextToken::getWidthOrThrow).reduce(0L, Long::sum);
	}
}

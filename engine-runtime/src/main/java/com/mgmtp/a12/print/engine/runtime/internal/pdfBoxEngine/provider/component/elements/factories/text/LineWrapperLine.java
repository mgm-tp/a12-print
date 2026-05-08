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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.text;

import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.InnerTextToken;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.LineWrapperSubSequence;
import lombok.Getter;
import lombok.NonNull;
import org.apache.pdfbox.pdmodel.font.PDFont;

import java.util.List;
import java.util.Stack;

public class LineWrapperLine {
	private final List<LineWrapperSubSequence> lineItems;
	@Getter
	private long leftCapacityWidth;

	public LineWrapperLine(long maxWidth) {
		this.leftCapacityWidth = maxWidth;
		this.lineItems = new Stack();
	}

	public boolean isEmpty() {
		return lineItems.isEmpty();
	}

	public List<InnerTextToken> getLine() {
		return lineItems.stream()
			.flatMap(ss -> ss.getLineSubSequence().getTokens().stream())
			.toList();
	}

	public static LineWrapperLine emptyLine(final long maxWidth) {
		return new LineWrapperLine(maxWidth);
	}

	public boolean fitsRestOfLine(final LineWrapperWindow window) {
		return window.getWidth() <= leftCapacityWidth;
	}

	public void addSubsequence(final LineWrapperSubSequence subSequence) {
		lineItems.add(subSequence);
		leftCapacityWidth -= subSequence.getWidth();
	}

	public void trimLastToken(
		@NonNull final TextWidthResolver textWidthResolver,
		@NonNull final PDFont font,
		@NonNull final PDFont fallbackFont,
		final long fontSize
	) {
		if (lineItems.isEmpty()) return;

		LineWrapperSubSequence lastSubSeq = lineItems.getLast();
		if (lastSubSeq == null) return;

		List<InnerTextToken> tokens = lastSubSeq.getLineSubSequence().getTokens();
		if (tokens.isEmpty()) return;

		int lastTokenIndex = tokens.size() - 1;
		InnerTextToken lastToken = tokens.get(lastTokenIndex);

		// Update last token
		final var trimmedTokens = lastToken.getSubSequenceWithTrimmedTrailingSpace(textWidthResolver, font, fallbackFont, fontSize);
		tokens.removeLast();
		tokens.addAll(trimmedTokens);
	}

	@Override
	public String toString() {
		return getLine().toString();
	}
}

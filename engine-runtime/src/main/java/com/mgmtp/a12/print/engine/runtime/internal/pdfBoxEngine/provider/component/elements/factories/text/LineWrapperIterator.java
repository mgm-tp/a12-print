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

import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.LineSubSequence;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.LineWrapperSubSequence;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.TextTokenizer;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.TokenLine;
import lombok.NonNull;
import org.apache.pdfbox.pdmodel.font.PDFont;

import java.util.Iterator;
import java.util.List;

/*
This iterator gives the next token from a text token iterator while always keeping track of the next n tokens;
 */
final class LineWrapperIterator implements Iterator{
	protected final LineWrapperWindow window;
	private final TokenLine tokenLine;
	private final Iterator<TextTokenizer.TextToken> it;
	private final TextWidthResolver resolver;
	private final PDFont font;
	private final PDFont fallbackFont;
	private final long fontSize;

	LineWrapperIterator(
		@NonNull final LineWrapperWindow window,
		@NonNull final TokenLine tokenLine,
		@NonNull final TextWidthResolver resolver,
		@NonNull final PDFont font,
		@NonNull final PDFont fallbackFont,
		final long fontSize
	) {
		this.window = window;
		this.tokenLine = tokenLine;

		final TextTokenizer textTokenizer = new TextTokenizer();
		this.it = textTokenizer.tokenize(tokenLine).iterator();

		this.resolver = resolver;
		this.font = font;
		this.fallbackFont = fallbackFont;
		this.fontSize = fontSize;
		fillWindow();
	}

	public void addLookAhead() {
		while (!window.isFullLookAhead() && it.hasNext()) {
			final TextTokenizer.TextToken textToken = it.next();
			final LineSubSequence subSequence = tokenLine.subSequence(textToken.start(), textToken.end());
			final LineWrapperSubSequence next = new LineWrapperSubSequence(subSequence, resolver, font, fallbackFont, fontSize);
			window.addLookAhead(next);
		}
	}

	public void fillWindow() {
		while (!window.isFull() && it.hasNext()) {
			final TextTokenizer.TextToken textToken = it.next();
			final LineSubSequence subSequence = tokenLine.subSequence(textToken.start(), textToken.end());
			final LineWrapperSubSequence next = new LineWrapperSubSequence(subSequence, resolver, font, fallbackFont, fontSize);
			window.add(next);
		}
	}

	@Override
	public boolean hasNext() {
		return !window.isEmpty();
	}

	@Override
	public LineWrapperSubSequence next() {
		final var next = window.popFirst();
		fillWindow();
		return next;
	}

	public List<LineWrapperSubSequence> split(final long maxWidth) {
		addLookAhead(); // Important Add Lookahead before splitting, in case there is a line break prevent on the border of the window
		var result = window.split(maxWidth);
		fillWindow();

		return result;
	}
	public List<LineWrapperSubSequence> splitFallback(final long maxWidth) {
		var result = window.splitFallback(maxWidth);
		fillWindow();

		return result;
	}
}

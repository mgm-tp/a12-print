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

import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.HtmlStyle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.HtmlTokenizer;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.InnerTextToken;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.TokenLine;
import lombok.NonNull;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.jsoup.nodes.Entities;

import java.util.List;

import static com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants.EMPTY_STRING;
import static com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants.NEW_LINE;

public class LineWrapper {

	private final TextWidthResolver textWidthResolver;
	private final HtmlTokenizer htmlTokenizer;

	public LineWrapper(
		@NonNull final TextWidthResolver textWidthResolver,
		@NonNull final HtmlTokenizer htmlTokenizer
	) {
		this.textWidthResolver = textWidthResolver;
		this.htmlTokenizer = htmlTokenizer;
	}

	/***
	 * This methode is calculating the lines an HTML text or plain text needed.
	 * For this it needs to HTML tokenize and text tokenize the input.
	 * If a Text-Token does not fit in the maxWidth it is split in fitting parts.
	 *
	 * @param content, sanitized and escaped HTML text or plain text
	 * @param maxWidth, pt, max line width
	 * @param font, PDFont, which is needed for text tokenizing and text width calculations,
	 * @param fallbackFont, PDFont
	 * @param fontSize, pt, long, which is needed for text tokenizing and text width calculations
	 * @param isHtml, defines if the content is html or plain text
	 * @return list of lines
	 */
	public ParagraphList getLines(
		@NonNull final String content,
		final long maxWidth,
		@NonNull final PDFont font,
		@NonNull final PDFont fallbackFont,
		final long fontSize,
		@NonNull
		final HtmlStyle initialStyle,
		@NonNull final LineWrapperTypeSetting lineWrapperTypeSetting,
		final boolean isHtml
	) {
		final List<TokenLine> tokenLines = getTokenLines(content, initialStyle, isHtml);

		final ParagraphList paragraphs = new ParagraphList();

		for (final var tokenLine : tokenLines) {
			final var window = new LineWrapperWindow(lineWrapperTypeSetting, textWidthResolver, font, fallbackFont, fontSize);
			paragraphs.add(
				iterateTokenLine(font, fallbackFont, fontSize, maxWidth, tokenLine, window),
				false
			);
		}
		return paragraphs;
	}

	private List<List<InnerTextToken>> iterateTokenLine(
		PDFont font,
		PDFont fallbackFont,
		long fontSize,
		long maxWidth,
		TokenLine tokenLine,
		LineWrapperWindow window
	) {
		final LineCollector lc = new LineCollector(maxWidth, textWidthResolver, font, fallbackFont, fontSize);
		final var iterator = new LineWrapperIterator(window, tokenLine, textWidthResolver, font, fallbackFont, fontSize);

		while (iterator.hasNext()) {
			if (lc.currentLine.fitsRestOfLine(iterator.window)) {
				// whole window fits in line, but only add first subsequence in case there should be linebreak preventing
				final var subSequence = iterator.next();
				lc.addToCurrentLine(subSequence);
			} else {
				// whole window does not fit so try to do a optimal split of the window
				final var subSequence = iterator.split(lc.currentLine.getLeftCapacityWidth());

				if (!subSequence.isEmpty()) {
					// split success
					lc.addToCurrentLine(subSequence);
					lc.startNextLine();
				} else {
					// split failed
					if (lc.currentLine.isEmpty()) {
						// split failed on empty line so do fallback split
						var fb = iterator.splitFallback(lc.currentLine.getLeftCapacityWidth());
						lc.addToCurrentLine(fb);
						lc.startNextLine();
					} else {
						// split failed on filled line so start next line
						lc.startNextLine();
					}
				}
			}
		}
		lc.finish();

		return lc.getLines();
	}

	private List<TokenLine> getTokenLines(String content, HtmlStyle initialStyle, boolean isHtml) {
		final List<TokenLine> tokenLines;
		final var preprocessedContent = stripNewLines(content);
		if (isHtml) {
			tokenLines = htmlTokenizer.tokenize(preprocessedContent, initialStyle);
		} else {
			tokenLines = List.of(new TokenLine(List.of(new InnerTextToken(
				preprocessedContent, 0, preprocessedContent.length(), initialStyle
			))));
		}
		return tokenLines;
	}

	private String stripNewLines(String initialContent) {
		return initialContent.indexOf('\n') >= 0 || initialContent.indexOf('\r') >= 0
			? initialContent.replaceAll(NEW_LINE, EMPTY_STRING)
			: initialContent;
	}
}

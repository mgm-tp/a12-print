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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing;

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import lombok.Getter;
import lombok.NonNull;

import javax.swing.text.MutableAttributeSet;
import javax.swing.text.html.HTML;
import javax.swing.text.html.HTMLEditorKit;
import javax.swing.text.html.parser.ParserDelegator;
import java.io.StringReader;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Getter
public class HtmlTokenizer {

	public static final HtmlStyle EMPTY_STYLE = HtmlStyle.builder().build();

	private final ConcurrentMap<HtmlStyle, HtmlStyle> cachedStyleMap = new ConcurrentHashMap<>();

	/***
	 * This method takes the HTML input and split it into lines and HTML-Tokens.
	 * In addition, it is collecting the inner HTML text of the input.
	 * The input HTML should already be escaped and sanitized if necessary.
	 *
	 * @param html escaped and sanitized HTML
	 * @param initialStyle initial HTML Style, commonly out of text properties
	 * @return A list of HTML lines which contain a list of HTML-Tokens
	 */
	public synchronized List<TokenLine> tokenize(@NonNull final String html, @NonNull final HtmlStyle initialStyle) {
		final var parser = new ParserDelegator();

		final var reader = new StringReader(html);

		final var callback = new TokenizerParserCallback(cachedStyleMap, initialStyle);

		try {
			parser.parse(reader, callback, true);
		} catch (Exception e) {
			throw new HtmlTokenizerException("HTML not parseable", e);
		}

		return callback.getResult();
	}

	/**
	 * The Parser needs to handle only the following tags: "span", "p", "u", "strong", "em", "br", "a"
	 */
	private static class TokenizerParserCallback extends HTMLEditorKit.ParserCallback {
		private static final Set<HTML.Tag> IGNORED_TAGS = Set.of(
			HTML.Tag.HTML, HTML.Tag.HEAD, HTML.Tag.BODY
		);

		private final Map<HtmlStyle, HtmlStyle> cachedStyleMap;
		private final List<HtmlStyle> styleStack = new ArrayList<>();

		private List<InnerTextToken> tokens = new ArrayList<>();
		private final List<TokenLine> lines = new ArrayList<>();

		private int tagsStarted = 0;
		private int tagsClosed = 0;

		public TokenizerParserCallback(
			Map<HtmlStyle, HtmlStyle> cachedStyleMap,
			HtmlStyle initialStyle
		) {
			this.styleStack.add(initialStyle);
			this.cachedStyleMap = cachedStyleMap;
			this.cachedStyleMap.putIfAbsent(initialStyle, initialStyle);
		}

		@Override
		public void handleStartTag(HTML.Tag tag, MutableAttributeSet attrs, int pos) {
			if (IGNORED_TAGS.contains(tag)) {
				return;
			}
			if (tag.equals(HTML.Tag.P) || tag.equals(HTML.Tag.SPAN) || tag.equals(HTML.Tag.A)) {
				handleAttributes(attrs);
			} else if (tag.equals(HTML.Tag.EM)) {
				addStyle(styleStack.getLast().toBuilder().italic(true).build());
			} else if (tag.equals(HTML.Tag.STRONG)) {
				addStyle(styleStack.getLast().toBuilder().bold(true).build());
			} else if (tag.equals(HTML.Tag.U)) {
				addStyle(styleStack.getLast().toBuilder().underline(true).build());
			} else {
				addStyle(styleStack.getLast().toBuilder().build());
			}
			tagsStarted++;
		}

		@Override
		public void handleEndTag(HTML.Tag tag, int pos) {
			if (IGNORED_TAGS.contains(tag)) {
				return;
			}
			styleStack.removeLast();
			if (tag.equals(HTML.Tag.P) && !tokens.isEmpty()) {
				finishLine();
			}
			tagsClosed++;
		}

		@Override
		public void handleText(char[] data, int pos) {
			final var decodedText = new String(data);
			tokens.add(new InnerTextToken(decodedText, 0, decodedText.length(), styleStack.getLast()));
		}

		@Override
		public void handleSimpleTag(HTML.Tag tag, MutableAttributeSet attrs, int pos) {
			if (tag.equals(HTML.Tag.BR)) {
				finishLine();
			}
		}

		public List<TokenLine> getResult() {
			if (tagsStarted != tagsClosed) {
				throw new HtmlTokenizerException("The input value isn't well formed HTML");
			}
			if (!tokens.isEmpty()) {
				finishLine();
			}
			return lines;
		}

		private void handleAttributes(MutableAttributeSet attrs) {
			final var usedAttributes = HtmlAttributesUtils.getUsedAttributes(attrs);
			if (usedAttributes != null) {
				final var lastStyleBuilder = styleStack.getLast().toBuilder();
				if (usedAttributes.color() != null) {
					lastStyleBuilder.color(usedAttributes.color());
				}
				if (usedAttributes.backgroundColor() != null) {
					lastStyleBuilder.backgroundColor(usedAttributes.backgroundColor());
				}
				if (usedAttributes.alignment() != null) {
					lastStyleBuilder.alignment(usedAttributes.alignment());
				}
				if (usedAttributes.attachmentId() != null) {
					lastStyleBuilder.attachmentId(usedAttributes.attachmentId());
				}
				addStyle(lastStyleBuilder.build());
			} else {
				addStyle(styleStack.getLast().toBuilder().build());
			}
		}

		private void addStyle(final HtmlStyle style) {
			styleStack.add(cachedStyleMap.computeIfAbsent(style, k -> style));
		}

		private void finishLine() {
			lines.add(new TokenLine(tokens));
			tokens = new ArrayList<>();
		}
	}
}

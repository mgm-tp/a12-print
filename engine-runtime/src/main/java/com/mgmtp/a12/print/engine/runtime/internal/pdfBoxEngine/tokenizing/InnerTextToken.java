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

import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.text.LineWrapperException;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.text.TextWidthResolver;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NonNull;
import org.apache.pdfbox.pdmodel.font.PDFont;

import java.util.List;
import java.util.Optional;

@AllArgsConstructor
@EqualsAndHashCode
public class InnerTextToken implements CharSequence {
	@Getter
	private final String html;
	@Getter
	private final int start;
	@Getter
	private final int end;
	@Getter
	private final HtmlStyle style;
	@Getter
	private final boolean fallbackFont;
	private Long width;

	public InnerTextToken(
		@NonNull final String content,
		final int start,
		final int end,
		@NonNull HtmlStyle style,
		boolean fallbackFont
	) {
		this.html = content;
		this.start = start;
		this.end = end;
		this.style = style;
		this.fallbackFont = fallbackFont;
		this.width = null;
	}

	public InnerTextToken(
		@NonNull final String content,
		final int start,
		final int end,
		@NonNull HtmlStyle style
	) {
		this(content, start, end, style, false);
	}

	public Optional<Long> getWidth() {
		return Optional.ofNullable(width);
	}

	public long getWidthOrThrow() {
		return getWidth().orElseThrow(() -> new LineWrapperException("At this stage the token width needs to be set"));
	}

	public void setWidth(Long width) {
		if (this.width != null) {
			throw new LineWrapperException("The width of the InnerTextToken should be set only once");
		}
		this.width = width;
	}

	@Override
	public int length() {
		return end - start;
	}

	@Override
	public char charAt(int index) {
		if (index < 0 || index >= length())
			throw new IndexOutOfBoundsException();
		return html.charAt(start + index);
	}

	@Override
	@NonNull
	public InnerTextToken subSequence(int subStart, int subEnd) {
		if (subStart < 0 || subEnd > length() || subStart >= subEnd)
			throw new IndexOutOfBoundsException();
		return new InnerTextToken(html, start + subStart, start + subEnd, style, fallbackFont);
	}

	@NonNull
	public InnerTextToken subSequence(int subStart, int subEnd, boolean fallbackFont) {
		if (subStart < 0 || subEnd > length() || subStart >= subEnd)
			throw new IndexOutOfBoundsException();
		return new InnerTextToken(html, start + subStart, start + subEnd, style, fallbackFont);
	}

	public List<InnerTextToken> getSubSequenceWithTrimmedTrailingSpace(
		@NonNull final TextWidthResolver textWidthResolver,
		@NonNull final PDFont font,
		@NonNull final PDFont fallbackFont,
		final long fontSize
	) {
		int cut = getLastTrailingSpaceIndex();
		if (cut < 0) return List.of(this);

		InnerTextToken trimmedToken = new InnerTextToken(html, start, start + cut, style, this.fallbackFont);
		final var widthResult = textWidthResolver.resolve(trimmedToken, font, fallbackFont, fontSize);
		return widthResult.getSubTokens(trimmedToken);
	}

	@Override
	@NonNull
	public String toString() {
		return new String(html.toCharArray(), start, length());
	}

	public int getLastTrailingSpaceIndex() {
		int index = this.length() - 1;
		while (index >= 0 && Character.isWhitespace(this.charAt(index))) {
			index--;
		}
		return (index == this.length() - 1)
			? -1
			: index + 1;
	}

	public int getTrailingSpaceCount() {
		final int index = this.getLastTrailingSpaceIndex();
		return (index < 0) ? 0 : (this.length() - index);
	}
}

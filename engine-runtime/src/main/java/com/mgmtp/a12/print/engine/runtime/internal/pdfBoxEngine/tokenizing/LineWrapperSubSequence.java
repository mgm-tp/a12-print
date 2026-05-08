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

import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.text.LineWrapperTypeSetting;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.text.TextWidthResolver;
import lombok.Getter;
import lombok.NonNull;
import org.apache.pdfbox.pdmodel.font.PDFont;

import java.util.TreeSet;

public class LineWrapperSubSequence {
	@Getter
	private final LineSubSequence lineSubSequence;
	@Getter
	private final long width;
	private TreeSet<Integer> hyphenationIndexes;

	public LineWrapperSubSequence(
		@NonNull LineSubSequence lineSubSequence,
		@NonNull final TextWidthResolver textWidthResolver,
		@NonNull final PDFont font,
		@NonNull final PDFont fallbackFont,
		final long fontSize
	) {
		this.lineSubSequence = lineSubSequence;
		this.width = getAndSetSubsequenceWidth(this.lineSubSequence, font, fallbackFont, fontSize, textWidthResolver);
	}

	private long getAndSetSubsequenceWidth(
		@NonNull final LineSubSequence lineSubSequence,
		@NonNull final PDFont font,
		@NonNull final PDFont fallbackFont,
		final long fontSize,
		final TextWidthResolver textWidthResolver
	) {
		var subSequenceWidth = 0L;
		final var iterator = lineSubSequence.getTokens().listIterator();
		while (iterator.hasNext()) {
			long tokenWidth;
			final var token = iterator.next();
			final var alreadySetTokenWidth = token.getWidth();
			if (alreadySetTokenWidth.isEmpty()) {
				final var widthResult = textWidthResolver.resolve(
					token,
					font,
					fallbackFont,
					fontSize
				);
				final var resolvedTokens = widthResult.getSubTokens(token);
				final var firstToken = resolvedTokens.getFirst();
				tokenWidth = firstToken.getWidthOrThrow();

				if (resolvedTokens.size() != 1 || firstToken.isFallbackFont()) {
					iterator.set(firstToken);
					for (var i = 1; i < resolvedTokens.size(); i++) {
						iterator.add(resolvedTokens.get(i));
					}
				}
			} else {
				tokenWidth = alreadySetTokenWidth.get();
			}
			subSequenceWidth += tokenWidth;
		}

		return subSequenceWidth;
	}

	public TreeSet<Integer> getAndSetHyphenationPositions(LineWrapperTypeSetting lineWrapperTypeSetting) {
		if (this.hyphenationIndexes == null) {
			String word = this.lineSubSequence.toString();
			var hyphResult = lineWrapperTypeSetting.getHyphenationPositions(word);
			TreeSet<Integer> hyphenPositions = new TreeSet<>();
			for (int pos : hyphResult.getIndices()) {
				if (pos == 0) continue;
				hyphenPositions.add(pos);
			}
			this.hyphenationIndexes = hyphenPositions;
		}
		return this.hyphenationIndexes;
	}

	@Override
	public String toString() {
		return lineSubSequence.toString();
	}
}

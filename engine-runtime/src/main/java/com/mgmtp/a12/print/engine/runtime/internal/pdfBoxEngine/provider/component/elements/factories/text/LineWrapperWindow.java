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
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.InnerTextToken;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.LineSubSequence;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.LineWrapperSubSequence;
import lombok.AllArgsConstructor;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.jspecify.annotations.Nullable;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

@RequiredArgsConstructor
public class LineWrapperWindow {
	// this can be increased to allow break prevent rules spanning more token
	public static final int LINE_BREAK_PREVENT_WINDOW_SIZE = 3;

	private final LineWrapperTypeSetting lineWrapperTypeSetting;
	private final TextWidthResolver textWidthResolver;
	private final PDFont font;
	private final PDFont fallbackFont;
	private final long fontSize;
	private final int windowLookAheadSize;
	private final int windowSize;

	private Deque<LineWrapperSubSequence> elements = new ArrayDeque<>();

	public LineWrapperWindow(
		@NonNull final LineWrapperTypeSetting lineWrapperTypeSetting,
		@NonNull final TextWidthResolver textWidthResolver,
		@NonNull final PDFont font,
		@NonNull final PDFont fallbackFont,
		long fontSize
	) {
		this.lineWrapperTypeSetting = lineWrapperTypeSetting;
		this.textWidthResolver = textWidthResolver;
		this.font = font;
		this.fallbackFont = fallbackFont;
		this.fontSize = fontSize;
		this.windowSize = lineWrapperTypeSetting.hasLineBreakPreventRules() ? LINE_BREAK_PREVENT_WINDOW_SIZE : 1;
		this.windowLookAheadSize = 2 * windowSize - 1;
	}


	public boolean isFull() {
		return elements.size() >= windowSize;
	}

	public boolean isFullLookAhead() {
		return elements.size() >= windowLookAheadSize;
	}

	public boolean isEmpty() {
		return elements.isEmpty();
	}

	public void add(final LineWrapperSubSequence next) {
		if (!isFull()) {
			elements.add(next);
		}
	}

	public void addLookAhead(final LineWrapperSubSequence next) {
		if (!isFullLookAhead()) {
			elements.add(next);
		}
	}

	public long getWidth() {
		int index = 0;
		long total = 0L;
		for (final LineWrapperSubSequence subSeq : elements) {
			if (index >= windowSize) {
				// Important: Skip Lookahead
				break;
			}
			total += subSeq.getWidth();
			index++;
		}
		return total;
	}

	public LineWrapperSubSequence popFirst() {
		return elements.removeFirst();
	}

	public List<LineWrapperSubSequence> split(final long maxWidth) {
		SplitPosition splitPosition = getSplitPosition(maxWidth);
		List<LineWrapperSubSequence> fitting = new ArrayList<>();

		if (splitPosition.isNone()) {
			return fitting;
		}

		// add all complete fitting subSequences from window
		for (int i = 0; i < splitPosition.getSubSequenceIndex(); i++) {
			LineWrapperSubSequence sub = elements.removeFirst();
			fitting.add(sub);
		}

		if (!elements.isEmpty()) {
			LineWrapperSubSequence sub = elements.removeFirst();
			if (splitPosition.isBoundary()) {
				// split between subSequences -> add complete subSequence
				fitting.add(sub);
			} else {
				// split subSequence
				LineSubSequence full  = sub.getLineSubSequence();
				LineSubSequence first = full.subSequence(0, splitPosition.getCharIndex());
				if (splitPosition.isSplitWithHyphen()) {
					first = LineSubSequence.withHyphen(first);
				}
				fitting.add(new LineWrapperSubSequence(first, textWidthResolver, font, fallbackFont, fontSize));

				// put rest back to window
				if (!splitPosition.isSplitAtTrailingSpace()) {
					LineSubSequence rest = full.subSequence(splitPosition.getCharIndex(), full.length());
					elements.addFirst(new LineWrapperSubSequence(rest, textWidthResolver, font, fallbackFont, fontSize));
				}
			}
		}

		return fitting;
	}

	public List<LineWrapperSubSequence> splitFallback(long lineRestWidth) {
		List<LineWrapperSubSequence> fitting = new ArrayList<>();

		while (!elements.isEmpty() && lineRestWidth >= 0f) {
			LineWrapperSubSequence subSeq = elements.removeFirst();

			// whole subSeq does not fit -> split with minimal rest
			if (subSeq.getWidth() > lineRestWidth) {
				var split = getRemainingResult(subSeq.getLineSubSequence(), lineRestWidth);

				if (split.fitting != null) {
					fitting.add(new LineWrapperSubSequence(split.fitting, textWidthResolver, font, fallbackFont, fontSize));
				}
				if (split.remaining != null) {
					elements.addFirst(new LineWrapperSubSequence(split.remaining, textWidthResolver, font, fallbackFont, fontSize));
				}

				break;
			}
			// whole subSeq fits in line
			fitting.add(subSeq);
			lineRestWidth -= subSeq.getWidth();
		}
		return fitting;
	}

	@AllArgsConstructor
	public class SplitPosition {

		private final int subSequenceIndex;
		private final int charIndex;
		private final SplitType splitType;

		public int getSubSequenceIndex() {
			return subSequenceIndex;
		}

		public int getCharIndex() {
			return charIndex;
		}

		public boolean isSplitWithHyphen() {
			return this.splitType == SplitType.HYPHEN;
		}

		public boolean isSplitAtTrailingSpace() {
			return this.splitType == SplitType.TRAILING_SPACE;
		}

		public boolean isNone()                 { return subSequenceIndex < 0; }

		public boolean isBoundary()             { return charIndex < 0; }

		enum SplitType {
			HYPHEN,
			TRAILING_SPACE,
			TOKEN
		}
	}


	private SplitPosition getSplitPosition(final long maxWidth) {
		final LineWrapperTypeSetting.MatchResult matches = lineWrapperTypeSetting.getBreakPositions(elements);

		int bestSubSeqIndex = -1;
		int bestCharIndex = -1;
		SplitPosition.SplitType bestType = null;

		long consumedWidth = 0L;  // already used width
		int offset = 0;            // absolute Character Offset in the window
		int subSequenceIndex = 0;  // Index of the subSequence in the window

		for (LineWrapperSubSequence sub : elements) {
			final LineSubSequence subSequence = sub.getLineSubSequence();

			// Try split with Hyphenation
			var hyph = sub.getAndSetHyphenationPositions(lineWrapperTypeSetting);
			for (int pos : hyph) {
				if (matches.intersects(offset + pos)) {
					continue;
				}

				final LineSubSequence first = subSequence.subSequence(0, pos);
				final long width = measure(first);

				HtmlStyle styleOfBreak = first.getTokens().getLast().getStyle();
				final var hyphenWidth = textWidthResolver.resolve(
					new InnerTextToken("-", 0, 1, styleOfBreak),
					font,
					fallbackFont,
					fontSize
				).getWidth();

				if (consumedWidth + width + hyphenWidth <= maxWidth) {
					// split would fit -> memorize it
					bestSubSeqIndex  = subSequenceIndex;
					bestCharIndex = pos;
					bestType = SplitPosition.SplitType.HYPHEN;
				} else {
					// split doesn't fit anymore
					break;
				}
			}

			// Try split by dropping trailing space at the end of the line
			final int trailingSpaceIndex = subSequence.getLastTrailingSpaceIndex();
			if (trailingSpaceIndex > 0 && !matches.intersects(offset + trailingSpaceIndex)) {
				final LineSubSequence firstNoSpace = subSequence.subSequence(0, trailingSpaceIndex);
				final long width = measure(firstNoSpace);
				if (consumedWidth + width <= maxWidth) {
					// split would fit -> memorize it
					bestSubSeqIndex  = subSequenceIndex;
					bestCharIndex = trailingSpaceIndex;
					bestType = SplitPosition.SplitType.TRAILING_SPACE;
				}
			}

			// Try split window the end of at the subSequence
			final boolean boundarySplitAllowed = !matches.intersects(offset + subSequence.length());
			if (boundarySplitAllowed) {
				if (consumedWidth + sub.getWidth() <= maxWidth) {
					// split would fit -> memorize it
					bestSubSeqIndex  = subSequenceIndex;
					bestCharIndex = -1;
					bestType = SplitPosition.SplitType.TOKEN;
				} else {
					// split doesn't fit anymore
					break;
				}
			}
			consumedWidth += sub.getWidth();
			offset += subSequence.length();
			subSequenceIndex++;

			if (consumedWidth > maxWidth) {
				break;
			}
		}

		return new SplitPosition(bestSubSeqIndex, bestCharIndex, bestType);
	}

	private long measure(LineSubSequence seq) {
		return textWidthResolver.resolve(
			new InnerTextToken(seq.toString(), 0, seq.length(), HtmlStyle.builder().build()), font, fallbackFont, fontSize
		).getWidth();
	}

	private record RemainingResult(@NonNull LineSubSequence fitting, @Nullable LineSubSequence remaining) {}

	private RemainingResult getRemainingResult(@NonNull final LineSubSequence textTokenSubsequence,	final long maxWidth) {
		long combinedTokenWidth = 0L;
		int combinedTokenLength = 0;

		final var innerTextTokens = textTokenSubsequence.getTokens();
		for (var i = 0; i < innerTextTokens.size(); i++) {
			final var token = innerTextTokens.get(i);
			final var innerTextTokenWidth = token.getWidthOrThrow();

			if (combinedTokenWidth + innerTextTokenWidth > maxWidth) {
				final var remainingResult = getRemainingResult(
					textTokenSubsequence,
					maxWidth,
					token,
					combinedTokenWidth,
					i == 0,
					combinedTokenLength
				);
				if (remainingResult != null) return remainingResult;
			}

			combinedTokenWidth += innerTextTokenWidth;
			combinedTokenLength += token.length();
		}

		throw new LineWrapperException("In this case the token is fitting in the line and the function should not be called");
	}

	private RemainingResult getRemainingResult(
		final LineSubSequence textTokenSubsequence,
		final long maxWidth,
		final InnerTextToken token,
		final long combinedTokenWidth,
		final boolean isFirstToken,
		final int combinedTokenLength
	) {
		int offset = 0;
		int combinedLineLength = 0;

		final var tokenText = token.toString();
		// surrogates
		final var combinedLine = new char[tokenText.length() * 2];

		while (offset < tokenText.length()) {
			final int cp = tokenText.codePointAt(offset);
			final var chars = Character.toChars(cp);

			System.arraycopy(chars, 0, combinedLine, combinedLineLength, chars.length);
			combinedLineLength += chars.length;

			// Here an InnerTextToken is not really needed
			final var combinedText = new String(combinedLine, 0, combinedLineLength);
			final var currentTextWidth = textWidthResolver.resolve(
				new InnerTextToken(
					combinedText,
					0,
					combinedText.length(),
					HtmlStyle.builder().build()
				),
				font,
				fallbackFont,
				fontSize
			).getWidth();

			// The combinedTokenWidth could directly be used as width of fitting tokens
			if (combinedTokenWidth + currentTextWidth > maxWidth) {
				if (isFirstToken && offset == 0) {
					// If not even one character is fitting, the first one will be taken anyway
					offset += Character.charCount(cp);
				}

				final var remainingStart = combinedTokenLength + offset;

				if (remainingStart == textTokenSubsequence.length()) {
					return new RemainingResult(
						textTokenSubsequence,
						null
					);
				}

				final var fittingSubsequence = textTokenSubsequence.subSequence(
					0,
					remainingStart
				);

				final var remainingSubsequence = textTokenSubsequence.subSequence(
					remainingStart,
					textTokenSubsequence.length()
				);

				return new RemainingResult(
					fittingSubsequence,
					remainingSubsequence
				);
			}

			offset += Character.charCount(cp);
		}
		return null;
	}
}

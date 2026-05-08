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

import lombok.NonNull;
import lombok.Value;

import java.util.ArrayList;
import java.util.List;

@Value
public class TokenLine implements CharSequence {
	List<InnerTextToken> innerTextTokens;

	@Override
	public int length() {
		return innerTextTokens.stream().map(CharSequence::length).reduce(0, Integer::sum);
	}

	@Override
	public char charAt(int index) {
		if (index < 0 || index >= length())
			throw new IndexOutOfBoundsException();

		return charAt(index, innerTextTokens);
	}

	public static char charAt(int index, List<InnerTextToken> tokens) {
		int tokenLengths = 0;
		for (final var token : tokens) {
			final var currentTokenLength = tokenLengths + token.length();
			if (index < currentTokenLength) {
				return token.charAt(index - tokenLengths);
			}
			tokenLengths += token.length();
		}

		throw new IndexOutOfBoundsException();
	}

	@Override
	@NonNull
	public LineSubSequence subSequence(int subStart, int subEnd) {
		if (subStart < 0 || subEnd > length() || subStart >= subEnd)
			throw new IndexOutOfBoundsException();

		return getSubsequence(subStart, subEnd, innerTextTokens);
	}

	public static LineSubSequence getSubsequence(int subStart, int subEnd, List<InnerTextToken> innerTextTokens) {
		final var subTokens = new ArrayList<InnerTextToken>();
		int tokenLengths = 0;
		int totalLen = 0;
		int firstStart = 0;

		for (final var token : innerTextTokens) {
			final int currentTokenLength = tokenLengths + token.length();

			if (subStart < currentTokenLength && subEnd > tokenLengths) {
				if (subTokens.isEmpty()) {
					final int newStart = subStart - tokenLengths;
					final int newEnd = Math.min(subEnd - tokenLengths, token.length());
					subTokens.add(token.subSequence(newStart, newEnd));
					totalLen += (newEnd - newStart);
					firstStart = newStart;
				} else if (currentTokenLength > subEnd) {
					final int newEnd = subEnd - tokenLengths;
					subTokens.add(token.subSequence(0, newEnd));
					totalLen += newEnd;
				} else {
					subTokens.add(token);
					totalLen += token.length();
				}
			}
			tokenLengths += token.length();
		}

		if (subTokens.isEmpty()) {
			throw new HtmlTokenizerException("Subsequent token lengths mismatch");
		}

		return new LineSubSequence(firstStart, firstStart + totalLen, subTokens);
	}


	@Override
	@NonNull
	public String toString() {
		return getString(innerTextTokens);
	}

	public static String getString(List<InnerTextToken> tokens) {
		final var builder = new StringBuilder();
		for (final var token : tokens) {
			builder.append(token.toString());
		}
		return builder.toString();
	}
}

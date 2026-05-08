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

import com.ibm.icu.text.BreakIterator;
import lombok.NonNull;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

public class TextTokenizer {
	/***
	 * This method is splitting the input text (should not be HTML) into Text-Tokens.
	 * A Text-Token contains information about the start and the end.
	 * It is also possible to define patterns, where the text should not be breakable
	 *
	 * @param text, simple text, which should not contain HTML
	 * @return Stream of Text-Token
	 */
	public Stream<TextToken> tokenize(@NonNull final CharSequence text) {
			return tokenize(text, Locale.US);
	}

	public Stream<TextToken> tokenize(@NonNull final CharSequence text, @NonNull Locale locale) {
		final BreakIterator iterator = BreakIterator.getLineInstance(locale);
		iterator.setText(text);

		List<TextToken> tokens = new ArrayList<>();

		int start = iterator.first();
		int end = iterator.next();

		while (end != BreakIterator.DONE) {
			tokens.add(new TextToken(start, end));

			start = end;
			end = iterator.next();
		}

		return tokens.stream();
	}

	public record TextToken(int start, int end) {}
}

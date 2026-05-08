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
package com.mgmtp.a12.print.engine.runtime.internal.engine.tokenizing;

import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.TextTokenizer;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;

record TokenizingCase(Locale locale, String input, List<String> expected) {
	static TokenizingCase of(Locale locale, String input, String... expectedTokens) {
		return new TokenizingCase(locale, input, List.copyOf(Arrays.asList(expectedTokens)));
	}
}

class TextTokenizerTest {

	private List<String> extractTokenStrings(String text, List<TextTokenizer.TextToken> tokens) {
		return tokens.stream()
			.map(tok -> text.substring(tok.start(), tok.end()))
			.toList();
	}

	static Stream<TokenizingCase> cases() {
		return Stream.of(
			TokenizingCase.of(Locale.US,"Hallo  z.b. Welt!","Hallo  ", "z.b. ", "Welt!"),
			TokenizingCase.of(Locale.US,"Hallo, Welt. ","Hallo, ", "Welt. "),
			TokenizingCase.of(Locale.US,"219(1)(a)","219(1)", "(a)"), // line break prevent needed
			TokenizingCase.of(Locale.US,"(340.000,00 €)","(340.000,00 ", "€)"), // line break prevent needed
			TokenizingCase.of(Locale.US,"T-Shirt","T-", "Shirt"), // line break prevent needed
			TokenizingCase.of(Locale.US,"até 26.07.2029, ","até ", "26.07.2029, "),
			TokenizingCase.of(Locale.US,"n.º","n.º"),
			TokenizingCase.of(Locale.US,"Test \uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66 Test!","Test ", "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66 " , "Test!"),
			// Test Different Locales
			TokenizingCase.of(Locale.US,"Don't ","Don't "),
			TokenizingCase.of(Locale.US,"Don’t ","Don’t "),
			TokenizingCase.of(Locale.FRENCH,"jusqu'à ","jusqu'à "),
			TokenizingCase.of(Locale.FRENCH,"jusqu’à ","jusqu’à "),
			TokenizingCase.of(Locale.US,"por “Trabalhador”. ","por ", "“Trabalhador”. "),
			TokenizingCase.of(Locale.FRENCH,"por “Trabalhador”. ","por ", "“Trabalhador”. "),
			TokenizingCase.of(Locale.US,"Hallo : Welt. ","Hallo : ", "Welt. "),
			TokenizingCase.of(Locale.GERMAN,"Hallo : Welt. ","Hallo : ", "Welt. "),
			TokenizingCase.of(Locale.FRENCH,"Hallo : Welt. ","Hallo : ", "Welt. ")
		);
	}

	@ParameterizedTest()
	@MethodSource("cases")
	void testTokenizing(TokenizingCase c) {
		var result = new TextTokenizer()
			.tokenize(c.input(), c.locale())
			.toList();

		List<String> tokenStrings = extractTokenStrings(c.input(), result);

		assertEquals(c.expected(), tokenStrings);
		assertEquals(c.expected().size(), result.size());
	}
}

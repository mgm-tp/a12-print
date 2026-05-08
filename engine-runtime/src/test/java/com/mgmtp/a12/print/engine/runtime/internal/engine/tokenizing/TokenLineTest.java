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

import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.HtmlStyle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.InnerTextToken;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.LineSubSequence;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.TokenLine;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TokenLineTest {
	private static final String HTML = "<span>Hallo<span>Welt</span><span>Test</span></span>";
	private static final HtmlStyle STYLE = HtmlStyle.builder().build();
	private static final InnerTextToken TEXT_TOKEN_1 = new InnerTextToken(HTML, 6, 11, STYLE);   // "Hallo"
	private static final InnerTextToken TEXT_TOKEN_2 = new InnerTextToken(HTML, 17, 21, STYLE);  // "Welt"
	private static final InnerTextToken TEXT_TOKEN_3 = new InnerTextToken(HTML, 34, 38, STYLE);  // "Test"

	@Test
	void testBasicTokenLineProperties() {
		var tokenLine = new TokenLine(List.of(TEXT_TOKEN_1, TEXT_TOKEN_2, TEXT_TOKEN_3));

		assertEquals(13, tokenLine.length());
		assertEquals('W', tokenLine.charAt(5));
		assertThrows(IndexOutOfBoundsException.class, () -> tokenLine.subSequence(0, 20));
	}

	@Test
	void testSubsequenceInsideToken1() {
		var tokenLine = new TokenLine(List.of(TEXT_TOKEN_1, TEXT_TOKEN_2, TEXT_TOKEN_3));

		var sequence = tokenLine.subSequence(1, 3); // "al"
		assertEquals(new LineSubSequence(1, 3, List.of(
			new InnerTextToken(HTML, 7, 9, STYLE)
		)), sequence);
		assertEquals(2, sequence.length());
		assertEquals('a', sequence.charAt(0));
		assertEquals("al", sequence.toString());
	}

	@Test
	void testSubsequenceInsideToken2() {
		var tokenLine = new TokenLine(List.of(TEXT_TOKEN_1, TEXT_TOKEN_2, TEXT_TOKEN_3));

		var sequence = tokenLine.subSequence(6, 9); // "elt"
		assertEquals(new LineSubSequence(1, 4, List.of(
			new InnerTextToken(HTML, 18, 21, STYLE)
		)), sequence);
		assertEquals(3, sequence.length());
		assertEquals('l', sequence.charAt(1));
		assertEquals("elt", sequence.toString());
	}

	@Test
	void testSubSubsequenceFromSubSequence() {
		var tokenLine = new TokenLine(List.of(TEXT_TOKEN_1, TEXT_TOKEN_2, TEXT_TOKEN_3));

		var sequence = tokenLine.subSequence(6, 9).subSequence(1, 2); // "elt" -> "l"
		assertEquals(new LineSubSequence(1, 2, List.of(
			new InnerTextToken(HTML, 19, 20, STYLE)
		)), sequence);
		assertEquals(1, sequence.length());
		assertEquals('l', sequence.charAt(0));
		assertEquals("l", sequence.toString());
	}

	@Test
	void testSubsequenceAtTokenStart() {
		var tokenLine = new TokenLine(List.of(TEXT_TOKEN_1, TEXT_TOKEN_2, TEXT_TOKEN_3));

		var sequence = tokenLine.subSequence(5, 6); // "W"
		assertEquals(new LineSubSequence(0, 1, List.of(
			new InnerTextToken(HTML, 17, 18, STYLE)
		)), sequence);
		assertEquals(1, sequence.length());
		assertEquals('W', sequence.charAt(0));
		assertEquals("W", sequence.toString());
	}

	@Test
	void testSubsequenceAtTokenEnd() {
		var tokenLine = new TokenLine(List.of(TEXT_TOKEN_1, TEXT_TOKEN_2, TEXT_TOKEN_3));

		var sequence = tokenLine.subSequence(8, 9); // "t"
		assertEquals(new LineSubSequence(3, 4, List.of(
			new InnerTextToken(HTML, 20, 21, STYLE)
		)), sequence);
		assertEquals(1, sequence.length());
		assertEquals('t', sequence.charAt(0));
		assertEquals("t", sequence.toString());
	}

	@Test
	void testSubsequenceAcrossTwoTokens() {
		var tokenLine = new TokenLine(List.of(TEXT_TOKEN_1, TEXT_TOKEN_2, TEXT_TOKEN_3));

		var sequence = tokenLine.subSequence(8, 10); // "tT"
		assertEquals(new LineSubSequence(3, 5, List.of(
			new InnerTextToken(HTML, 20, 21, STYLE),
			new InnerTextToken(HTML, 34, 35, STYLE)
		)), sequence);
		assertEquals(2, sequence.length());
		assertEquals('T', sequence.charAt(1));
		assertEquals("tT", sequence.toString());
	}

	@Test
	void testSubsequenceAcrossThreeTokens() {
		var tokenLine = new TokenLine(List.of(TEXT_TOKEN_1, TEXT_TOKEN_2, TEXT_TOKEN_3));

		var sequence = tokenLine.subSequence(4, 10); // "oWeltT"
		assertEquals(new LineSubSequence(4, 10, List.of(
			new InnerTextToken(HTML, 10, 11, STYLE),   // "o"
			new InnerTextToken(HTML, 17, 21, STYLE),   // "Welt"
			new InnerTextToken(HTML, 34, 35, STYLE)    // "T"
		)), sequence);
		assertEquals(6, sequence.length());
		assertEquals('W', sequence.charAt(1));
		assertEquals("oWeltT", sequence.toString());
	}

	@Test
	void testSubsequenceExactlyFirstToken() {
		var tokenLine = new TokenLine(List.of(TEXT_TOKEN_1, TEXT_TOKEN_2, TEXT_TOKEN_3));

		var sequence = tokenLine.subSequence(0, 5); // "Hallo"
		var s = new LineSubSequence(0, 5, List.of(TEXT_TOKEN_1));
		assertEquals(s, sequence);
		assertEquals(5, sequence.length());
		assertEquals('a', sequence.charAt(1));
		assertEquals("Hallo", sequence.toString());
	}

	@Test
	void testSubsequenceExactlyMiddleToken() {
		var tokenLine = new TokenLine(List.of(TEXT_TOKEN_1, TEXT_TOKEN_2, TEXT_TOKEN_3));

		var sequence = tokenLine.subSequence(5, 9); // "Welt"
		var s = new LineSubSequence(0, 4, List.of(TEXT_TOKEN_2));
		assertEquals(s, sequence);
		assertEquals(4, sequence.length());
		assertEquals('e', sequence.charAt(1));
		assertEquals("Welt", sequence.toString());
	}

	@Test
	void testSubsequenceExactlyLastToken() {
		var tokenLine = new TokenLine(List.of(TEXT_TOKEN_1, TEXT_TOKEN_2, TEXT_TOKEN_3));

		var sequence = tokenLine.subSequence(9, 13); // "Test"
		assertEquals(new LineSubSequence(0, 4, List.of(TEXT_TOKEN_3)), sequence);
		assertEquals(4, sequence.length());
		assertEquals('e', sequence.charAt(1));
		assertEquals("Test", sequence.toString());
	}

}

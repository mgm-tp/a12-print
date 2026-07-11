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

import com.mgmtp.a12.print.engine.runtime.internal.engine.rendering.HTMLCleanUpUtil;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.HtmlStyle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.HtmlTokenizer;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.InnerTextToken;
import org.junit.jupiter.api.Test;

import java.util.List;

import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.HtmlTokenizer.EMPTY_STYLE;
import static org.junit.jupiter.api.Assertions.assertEquals;

class HtmlTokenizerTest {

	private final HTMLCleanUpUtil cleanUpUtil = new HTMLCleanUpUtil();
	private final HtmlTokenizer tokenizer = new HtmlTokenizer();

	private String cleanupHtml(String input) {
		return cleanUpUtil.sanitize(input);
	}

	@Test
	void testFormattedHtmlTokenizing() {
		final var inputHtml = cleanupHtml(
			"<p><span style=\"\">T</span><span style=\"\"><strong>e</strong></span><span style=\"background-color: #4706e0\"><em><strong>st Text</strong></em></span><span style=\"background-color: #4706e0\"><strong> </strong></span><span style=\"\"><strong>F</strong></span><span style=\"color: #4cdb0f\"><strong>or</strong></span><span style=\"\"><strong>m</strong></span><span style=\"\">atting</span></p>"
		);

		final var expectedTokens = List.of(
			new InnerTextToken(inputHtml, 3, 4, HtmlStyle.builder().build()),
			new InnerTextToken(inputHtml, 12, 13, HtmlStyle.builder().bold(true).build()),
			new InnerTextToken(inputHtml, 73, 80, HtmlStyle.builder().bold(true).italic(true).backgroundColor(4654816).build()),
			new InnerTextToken(inputHtml, 148, 149, HtmlStyle.builder().bold(true).backgroundColor(4654816).build()),
			new InnerTextToken(inputHtml, 173, 174, HtmlStyle.builder().bold(true).build()),
			new InnerTextToken(inputHtml, 219, 221, HtmlStyle.builder().bold(true).color(5036815).build()),
			new InnerTextToken(inputHtml, 245, 246, HtmlStyle.builder().bold(true).build()),
			new InnerTextToken(inputHtml, 255, 261, HtmlStyle.builder().build())
		);

		final var htmlTokenLines = tokenizer.tokenize(inputHtml, EMPTY_STYLE);
		assertEquals(1, htmlTokenLines.size());
		final var line = htmlTokenLines.getFirst();
		assertEquals("Test Text Formatting", line.toString());

		final var tokens = line.getInnerTextTokens();
		assertEquals(8, tokens.size());

		for (int i = 0; i < tokens.size(); i++) {
			final var token = tokens.get(i);
			final var expectedToken = expectedTokens.get(i);

			assertEquals(expectedToken.toString(), token.toString());
			assertEquals(expectedToken.getStyle(), token.getStyle());
		}
	}

	@Test
	void testWhitespacesTokenizing() {
		final var inputHtml = cleanupHtml(
			"<p><span style=\"\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;djdjdjdj d &nbsp;&nbsp;&nbsp;d d d &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></p>"
		);
		final var htmlTokenLines = tokenizer.tokenize(inputHtml, EMPTY_STYLE);
		assertEquals(1, htmlTokenLines.size());
		final var line = htmlTokenLines.getFirst();
		assertEquals("     djdjdjdj d    d d d        ", line.toString());

		final var tokens = line.getInnerTextTokens();
		assertEquals(1, tokens.size());
		assertEquals(new InnerTextToken(inputHtml, 3, 35, HtmlStyle.builder().build()).toString(), tokens.getFirst().toString());
		assertEquals(HtmlStyle.builder().build(), tokens.getFirst().getStyle());
	}

	@Test
	void testSimpleLineBreakTokenizing() {
		var input = cleanupHtml("<p>Test<br>Test2</p>");
		var lines = tokenizer.tokenize(input, EMPTY_STYLE);
		assertEquals(2, lines.size());
		input = cleanupHtml("<p>Test<br><br>Test2</p>");
		lines = tokenizer.tokenize(input, EMPTY_STYLE);
		assertEquals(3, lines.size());
	}

	@Test
	void testLineBreakTokenizing() {
		final var expectedLines = List.of("Test", "", "Mehr", "", "zeilig", "", "sd");
		final var htmlTokenLines = tokenizer.tokenize(cleanupHtml(
			"<p><span style=\"\">Test</span></p>\n<p><br></p>\n<p><span style=\"\">M</span><span style=\"color: #d40c0c\">ehr</span></p>\n<p><br></p>\n<p><span style=\"color: #d40c0c\">ze</span><span style=\"\">ilig</span></p>\n<p><br></p>\n<p><span style=\"\">sd</span></p>"
		), EMPTY_STYLE);
		assertEquals(7, htmlTokenLines.size());
		for (int i = 0; i < htmlTokenLines.size(); i++) {
			final var line = htmlTokenLines.get(i);
			final var expectedLine = expectedLines.get(i);
			assertEquals(expectedLine, line.toString());
		}
	}

	@Test
	void testZeroHeightLineTokenizing() {
		final var htmlTokenLines = tokenizer.tokenize(cleanupHtml(
			"<p>Test</p><p><br></p><p></p>"
		), EMPTY_STYLE);
		assertEquals(2, htmlTokenLines.size());
	}

	@Test
	void testHtmlTokenizingWithVariousStyles() {
		final var input = cleanupHtml("<p class=\"editor-paragraph\" dir=\"ltr\"><span>aergaerg</span></p><p class=\"editor-paragraph\" dir=\"ltr\" style=\"text-align: left;\"><b><strong class=\"editor-text-bold\">regsretg</strong></b></p><p class=\"editor-paragraph\" dir=\"ltr\" style=\"text-align: left;\"><i><b class=\"editor-text-italic\"><strong class=\"editor-text-italic editor-text-bold\">aergergregaerg</strong></b></i></p><p class=\"editor-paragraph\" dir=\"ltr\" style=\"text-align: left;\"><u><i class=\"editor-text-underline\"><b class=\"editor-text-italic\"><strong class=\"editor-text-underline editor-text-italic editor-text-bold\">aegaergaerg</strong></b></i></u></p><p class=\"editor-paragraph\" dir=\"ltr\" style=\"text-align: left;\"><br></p><p class=\"editor-paragraph\" dir=\"ltr\" style=\"text-align: right;\"><span>aergergaegegr</span></p><p class=\"editor-paragraph\" dir=\"ltr\" style=\"text-align: right;\"><u><span class=\"editor-text-underline\">rthtrh</span></u></p>");
		final var lines = tokenizer.tokenize(input, EMPTY_STYLE);
		assertEquals(7, lines.size());
	}

	@Test
	void testTextTokenizing() {
		final var lines = tokenizer.tokenize("Test\n\n Text", EMPTY_STYLE);
		assertEquals(1, lines.size());
	}

	@Test
	void testLessThanGreaterThanInContent() {
		final var input = "<p>2 &lt; 3 &gt; 1</p>";
		final var lines = tokenizer.tokenize(input, EMPTY_STYLE);
		assertEquals(1, lines.size());
		assertEquals("2 < 3 > 1", lines.getFirst().toString());
	}

	@Test
	void testNoRealTagsInContent() {
		final var input = "<p><span>&lt;hello&gt; x &lt;world&gt;</span></p>";
		final var lines = tokenizer.tokenize(input, EMPTY_STYLE);
		assertEquals(1, lines.size());
		assertEquals("<hello> x <world>", lines.getFirst().toString());
	}

	@Test
	void testIgnoreUnknownTags() {
		final var input = "<hello> x <world>";
		final var lines = tokenizer.tokenize(input, EMPTY_STYLE);
		assertEquals(1, lines.size());
		assertEquals("x ", lines.getFirst().toString());
	}

	@Test
	void testSingleWhiteSpace() {
		final var input = "<p><span style=\"\"><strong>Hallo</strong></span><span style=\"\"> </span><span style=\"\"><u>Welt</u></span></p>";
		final var lines = tokenizer.tokenize(input, EMPTY_STYLE);
		assertEquals(1, lines.size());
		assertEquals(List.of("Hallo", " ", "Welt"), lines.getFirst().getInnerTextTokens().stream().map(Object::toString).toList());
	}
}

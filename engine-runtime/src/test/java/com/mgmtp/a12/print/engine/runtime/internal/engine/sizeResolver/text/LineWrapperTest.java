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
package com.mgmtp.a12.print.engine.runtime.internal.engine.sizeResolver.text;


import com.mgmtp.a12.print.engine.runtime.internal.engine.rendering.HTMLCleanUpUtil;
import com.mgmtp.a12.print.engine.runtime.internal.engine.sizeResolver.utils.TestTypesettingBuilder;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.text.CachedTextWidthResolver;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.text.LineWrapper;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.text.LineWrapperTypeSetting;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.HtmlStyle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.HtmlTokenizer;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.InnerTextToken;
import com.mgmtp.a12.print.model.api.model.textStyle.TextStyle;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static com.mgmtp.a12.print.engine.runtime.internal.engine.sizeResolver.utils.FontUtils.DEFAULT_FONT_NAME;
import static com.mgmtp.a12.print.engine.runtime.internal.engine.sizeResolver.utils.FontUtils.FONTS;
import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil.mmToLongPt;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.fail;

class LineWrapperTest {
	private static final HTMLCleanUpUtil cleanUpUtil = new HTMLCleanUpUtil();

	private final FontLoader fontLoader = new FontLoader(new PDDocument());

	private static final String HTML = cleanUpUtil.sanitize("<p><span>This is a <b>bold</b> test with <i>italic</i> words. Another paragraph with some longerwordforhyphenation testing. Final line with numbers 12345 and symbols.</span></p>");
	private static final String HTML_2 = cleanUpUtil.sanitize("<p><span>Wort §1 Abs. 1 wort §22 Abs. 22 wort §333 Abs. 333 wort</span></p>");

	private static Stream<Arguments> provideLineWrapperTestArguments() {
		return Stream.of(
			// Base test Cases
			Arguments.of("<span>Hello Hallo Hollo</span>", 44, TextStyle.StaticHyphenator.DE_1996, List.of(), List.of(
				List.of("Hello ", "Hallo ", "Hollo")
			)),
			Arguments.of("<span>Hello Hallo Hollo</span>", 43, TextStyle.StaticHyphenator.DE_1996, List.of(), List.of(
				List.of("Hello ", "Hallo ", "Hol", "-"),
				List.of("lo")
			)),
			Arguments.of("<span>Hello Hallo Hollo</span>", 43, TextStyle.StaticHyphenator.DE_1996, List.of("ll"), List.of(
				List.of("Hello ", "Hallo"),
				List.of("Hollo")
			)),
			Arguments.of("<span>Hello Hallo Hollo</span>", 31, TextStyle.StaticHyphenator.DE_1996, List.of(), List.of(
				List.of("Hello ", "Hallo"),
				List.of("Hollo")
			)),
			Arguments.of("<span>Hello Hallo Hollo</span>", 30, TextStyle.StaticHyphenator.DE_1996, List.of(), List.of(
				List.of("Hello ", "Hallo"),
				List.of("Hollo")
			)),
			Arguments.of("<span>Hello Hallo Hollo</span>", 30, TextStyle.StaticHyphenator.DE_1996, List.of("o H"), List.of(
				List.of("Hello ", "Hal", "-"),
				List.of("lo ", "Hollo")
			)),
			Arguments.of("<span>Hallo Hallo</span>", 12, TextStyle.StaticHyphenator.DE_1996, List.of("ll"), List.of(
				List.of("Hall"),
				List.of("o"),
				List.of("Hall"),
				List.of("o")
			)),
			Arguments.of("<span>Hallo Hallo</span>", 26, TextStyle.StaticHyphenator.DE_1996, List.of(), List.of(
				List.of("Hallo ", "Hal", "-"),
				List.of("lo")
			)),
			Arguments.of("<span>Hallo Hallo</span>", 26, TextStyle.StaticHyphenator.DE_1996, List.of("ll"), List.of(
				List.of("Hallo"),
				List.of("Hallo")
			)),
			Arguments.of("<span>Hallo Hallo</span>", 26, TextStyle.StaticHyphenator.DE_1996, List.of("ll", "o H"), List.of(
				List.of("Hallo ", "Hall"),
				List.of("o")
			)),
			Arguments.of("<span>Hallo Hallo</span>", 16, TextStyle.StaticHyphenator.DE_1996, List.of(), List.of(
				List.of("Hallo"),
				List.of("Hallo")
			)),
			Arguments.of("<span>Hallo Hallo</span>", 14, TextStyle.StaticHyphenator.DE_1996, List.of(), List.of(
				List.of("Hallo"),
				List.of("Hallo")
			)),
			Arguments.of("<span>Hallo Hallo</span>", 12, TextStyle.StaticHyphenator.DE_1996, List.of(), List.of(
				List.of("Hal", "-"),
				List.of("lo"),
				List.of("Hal", "-"),
				List.of("lo")
			)),
			Arguments.of("<span>Hallo </span>", 1, TextStyle.StaticHyphenator.DE_1996, List.of(), List.of(
				List.of("H"),
				List.of("a"),
				List.of("l"),
				List.of("l"),
				List.of("o"),
				List.of("")
			)),
			Arguments.of("<span>Hallo 20 km weiter</span>", 26, TextStyle.StaticHyphenator.DE_1996, List.of(), List.of(
				List.of("Hallo ", "20"),
				List.of("km ", "weiter")
			)),
			Arguments.of("<span>Hallo 20 km weiter</span>", 26, TextStyle.StaticHyphenator.DE_1996, List.of("\\d+ km"), List.of(
				List.of("Hallo"),
				List.of("20 ", "km ", "wei", "-"),
				List.of("ter")
			)),
			Arguments.of("<span>Hallo 20 km weiter</span>", 26, null, List.of("\\d+ km"), List.of(
				List.of("Hallo"),
				List.of("20 ", "km"),
				List.of("weiter")
			)),
			Arguments.of("<span>Rechtschreibungsregel</span>", 18, TextStyle.StaticHyphenator.DE_1996, List.of(), List.of(
				List.of("Recht", "-"),
				List.of("schrei", "-"),
				List.of("bungs", "-"),
				List.of("regel")
			)),
			Arguments.of("<span>Rechtschreibungsregel</span>", 18, null, List.of(), List.of(
				List.of("Rechtsc"),
				List.of("hreibun"),
				List.of("gsregel")
			)),
			Arguments.of("<span>1 2222 333334444455</span>", 13, null, List.of(), List.of( // regular line break
				List.of("1"),
				List.of("2222"),
				List.of("33333"),
				List.of("44444"),
				List.of("55")
			)),
			Arguments.of("<span>1 22222 333334444455</span>", 13, null, List.of(), List.of( // regular line break
				List.of("1"),
				List.of("22222"),
				List.of("33333"),
				List.of("44444"),
				List.of("55")
			)),
			Arguments.of("<span>1 222 333334444455</span>", 13, null, List.of(), List.of( // regular line break with a space
				List.of("1 ", "222"),
				List.of("33333"),
				List.of("44444"),
				List.of("55")
			)),
			Arguments.of("<span>1 1112 2223333344</span>", 13, null, List.of("1 1", "2 2"), List.of(
				List.of("1 ", "111"),
				List.of("2 ", "222"),
				List.of("33333"),
				List.of("44")
			)),
			Arguments.of("<span>111112222233</span>", 13, null, List.of("1111122"), List.of(
				List.of("11111"),
				List.of("22222"),
				List.of("33")
			)),
			Arguments.of("<span>111112222233</span>", 13, null, List.of(), List.of(
				List.of("11111"),
				List.of("22222"),
				List.of("33")
			)),
			Arguments.of("<span>123</span>", 1, null, List.of(), List.of(
				List.of("1"),
				List.of("2"),
				List.of("3")
			)),
			Arguments.of("<span>123</span>", 1, null, List.of("123"), List.of(
				List.of("1"),
				List.of("2"),
				List.of("3")
			)),
			Arguments.of("<span>123</span>", 0, null, List.of("123"), List.of(
				List.of("1"),
				List.of("2"),
				List.of("3")
			)),
			// Window + Lookahead Edge Cases
			Arguments.of("<span>Final line with numbers 12345 and symbols</span>", 45, null, List.of("and symb"), List.of(
				List.of("Final ", "line ", "with"),
				List.of("numbers ", "12345"),
				List.of("and ", "symbols")
			)),
			Arguments.of("<span>Final line with numbers 12345 and symbols</span>", 35, null, List.of("and symb"), List.of(
				List.of("Final ", "line"),
				List.of("with ", "numbers"),
				List.of("12345"),
				List.of("and ", "symbols")
			)),
			Arguments.of("<span>Final line with numbers 12345 and symbols</span>", 45, TextStyle.StaticHyphenator.DE_1996, List.of("and symb"), List.of(
				List.of("Final ", "line ", "with"),
				List.of("numbers ", "12345"),
				List.of("and ", "symbols")
			)),
			Arguments.of("<span>Final line with numbers 12345 and symbols</span>", 35, TextStyle.StaticHyphenator.DE_1996, List.of("and symb"), List.of(
				List.of("Final ", "line"),
				List.of("with ", "numbers"),
				List.of("12345"),
				List.of("and ", "symbols")
			)),
			Arguments.of(HTML, 36, TextStyle.StaticHyphenator.EN_US, List.of("ine wit", "and symb", "numbers 12345"), List.of(
				List.of("This ", "is ", "a ", "bold"),
				List.of("test ", "with"),
				List.of("italic ", "words."),
				List.of("Another ", "para", "-"),
				List.of("graph ", "with"),
				List.of("some ", "longer", "-"),
				List.of("wordforhyphen", "-"),
				List.of("ation ", "testing."),
				List.of("Final"),
				List.of("line ", "with"),
				List.of("numbers ", "12345"),
				List.of("and ", "symbols.")
			)),
			Arguments.of(HTML, 47, null, List.of("numbers 12345", "and symb"), List.of(
				List.of("This ", "is ", "a ", "bold"),
				List.of("test ", "with ", "italic"),
				List.of("words. ", "Another"),
				List.of("paragraph ", "with"),
				List.of("some"),
				List.of("longerwordforhyphe"),
				List.of("nation ", "testing."),
				List.of("Final ", "line ", "with"),
				List.of("numbers ", "12345"),
				List.of("and ", "symbols.")
			)),
			Arguments.of(HTML, 57, TextStyle.StaticHyphenator.EN_US, List.of("numbers 12345", "and symb"), List.of(
				List.of("This ", "is ", "a ", "bold ", "test"),
				List.of("with ", "italic ", "words. ", "An", "-"),
				List.of("other ", "paragraph ", "with"),
				List.of("some ", "longerwordforhy", "-"),
				List.of("phenation ", "testing. ", "Fi", "-"),
				List.of("nal ", "line ", "with"),
				List.of("numbers ", "12345"),
				List.of("and ", "symbols.")
			)),
			Arguments.of(HTML, 51, null, List.of("numbers 12345", "and symb"), List.of(
				List.of("This ", "is ", "a ", "bold ", "test"),
				List.of("with ", "italic ", "words."),
				List.of("Another ", "paragraph"),
				List.of("with ", "some"),
				List.of("longerwordforhyphena"),
				List.of("tion ", "testing. ", "Final"),
				List.of("line ", "with"),
				List.of("numbers ", "12345"),
				List.of("and ", "symbols.")
			)),
			Arguments.of("<p><span>Final line with numbers 12345 and symbols.</span></p>", 38, TextStyle.StaticHyphenator.EN_US, List.of("with nu", "bers 12345 a"), List.of(
				List.of("Final ", "line"),
				List.of("with ", "num" , "-"),
				List.of("bers ", "12345 ", "and"),
				List.of("symbols.")
			)),
			Arguments.of("<p><span>Wort §1 Abs. 1 wort §22 Abs. 22 wort §333 Abs. 333 wort</span></p>", 54, null, List.of("§\\d+ Abs. \\d+"), List.of(
				List.of("Wort ", "§1 ", "Abs. ", "1 ", "wort"),
				List.of("§22 ", "Abs. ", "22 ", "wort"),
				List.of("§333 ", "Abs. ", "333 ", "wort")
			)),
			// Paragraph Cases
			Arguments.of("<p>Test</p><p><br></p><p></p>", 100, null, List.of(), List.of(
				List.of("Test"),
				List.of()
			)),
			Arguments.of("<p>Test</p><p>Langer Text</p>", 100, null, List.of(), List.of(
				List.of("Test"),
				List.of("Langer ", "Text")
			)),
			Arguments.of("<p>Test</p><p><br></p><p>Langer Text</p>", 16, null, List.of(), List.of(
				List.of("Test"),
				List.of(),
				List.of("Langer"),
				List.of("Text")
			))
		);
	}


	@ParameterizedTest(name = "Case {index}: HTML [{0}], Max width [{1}]")
	@MethodSource("provideLineWrapperTestArguments")
	void testTextLineWrapper(String html, int maxWidth, TextStyle.StaticHyphenator staticHyphenatorKey, List<String> pattern, List<List<String>> expectedTokenStrings) {
		final LineWrapper lineWrapper = new LineWrapper(
			new CachedTextWidthResolver(),
			new HtmlTokenizer()
		);
		final var lines = lineWrapper.getLines(
			html,
			mmToLongPt(maxWidth),
			fontLoader.load(FONTS.get("NotoSans")),
			fontLoader.load(FONTS.get(DEFAULT_FONT_NAME)),
			1200,
			HtmlStyle.EMPTY_STYLE,
			new LineWrapperTypeSetting(staticHyphenatorKey, TestTypesettingBuilder.build(pattern)),
			true
		);

		List<List<String>> actual =
			lines.getParagraphs().stream()
				.flatMap(p -> p.getLines().isEmpty()
					? Stream.of(Collections.<InnerTextToken>emptyList())
					: p.getLines().stream())
				.map(tokens -> tokens.stream().map(InnerTextToken::toString).toList())
				.toList();

		assertEquals(expectedTokenStrings, actual);
		assertEquals(expectedTokenStrings.size(), lines.totalLinesCount());
	}

	private static Stream<Arguments> provideBruteTestArguments() {
		return Stream.of(
			Arguments.of(1, HTML, null, List.of()),
			Arguments.of(2, HTML, TextStyle.StaticHyphenator.EN_US, List.of()),
			Arguments.of(3, HTML, null, List.of("and symb", "numbers 12345")),
			Arguments.of(4, HTML, TextStyle.StaticHyphenator.EN_US, List.of("and symb", "numbers 12345")),
			Arguments.of(5, HTML, TextStyle.StaticHyphenator.EN_US, List.of("ine wit", "and symb", "numbers 12345")),
			Arguments.of(6, HTML, TextStyle.StaticHyphenator.EN_US, List.of("with nu", "bers 12345 a",  "d symb")),
			Arguments.of(7, HTML_2, null, List.of("§\\d+ Abs. \\d+"))
		);
	}

	@ParameterizedTest(name = "Case {index}: hyphenator={1}, patterns={2}")
	@MethodSource("provideBruteTestArguments")
	void testTextLineWrapper2(int index, String testHtml, TextStyle.StaticHyphenator staticHyphenatorKey, List<String> pattern) throws IOException {
		final LineWrapper lineWrapper = new LineWrapper(
			new CachedTextWidthResolver(),
			new HtmlTokenizer()
		);

		Map<Integer, List<List<String>>> allResults = new LinkedHashMap<>();

		for (int maxWidth = 20; maxWidth <= 100; maxWidth += 2) {
			final var lines = lineWrapper.getLines(
				testHtml,
				mmToLongPt(maxWidth),
				fontLoader.load(FONTS.get("NotoSans")),
				fontLoader.load(FONTS.get(DEFAULT_FONT_NAME)),
				1200,
				HtmlStyle.EMPTY_STYLE,
				new LineWrapperTypeSetting(staticHyphenatorKey, TestTypesettingBuilder.build(pattern)),
				true
			);

			List<List<String>> flattenedLines = lines.getParagraphs().stream()
				.flatMap(p -> p.getLines().stream())
				.map(line -> line.stream()
					.map(InnerTextToken::toString)
					.toList()
				)
				.toList();
			allResults.put(maxWidth, flattenedLines);
		}

		assertMatchesSnapshot("LineWrapper_case" + index, allResults);
	}

	private static void assertMatchesSnapshot(String snapshotName, Map<Integer, List<List<String>>> allResults) throws IOException {
		Path snapshotPath = Paths.get("src/test/snapshots", snapshotName + ".snap");
		Files.createDirectories(snapshotPath.getParent());

		String newSnapshot = formatSnapshot(allResults);

		if (Files.exists(snapshotPath)) {
			String oldSnapshot = Files.readString(snapshotPath);

			if (!oldSnapshot.equals(newSnapshot)) {
				Files.writeString(snapshotPath, newSnapshot);
				fail("Snapshot mismatch for " + snapshotName + ", Snapshot updated. Please Check changes in Git-Diff.");
			}
		} else {
			Files.writeString(snapshotPath, newSnapshot);
		}
	}

	private static String formatSnapshot(Map<Integer, List<List<String>>> allResults) {
		StringBuilder sb = new StringBuilder();
		for (var entry : allResults.entrySet()) {
			int width = entry.getKey();
			sb.append("Width: ").append(width).append("\n");
			int lineNo = 1;
			for (List<String> line : entry.getValue()) {
				sb.append("Line").append(lineNo++).append(": ");
				sb.append(String.join("", line));
				sb.append("\n");
			}
			sb.append("\n");
		}
		return sb.toString();
	}
}

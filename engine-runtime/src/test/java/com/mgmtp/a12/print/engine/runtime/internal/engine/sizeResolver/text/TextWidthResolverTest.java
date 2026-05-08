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

import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.text.CachedTextWidthResolver;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.text.TextWidthResolver;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.HtmlStyle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.InnerTextToken;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.stream.Stream;

import static com.mgmtp.a12.print.engine.runtime.internal.engine.sizeResolver.utils.FontUtils.DEFAULT_FONT_NAME;
import static com.mgmtp.a12.print.engine.runtime.internal.engine.sizeResolver.utils.FontUtils.SYMBOL_FONT_NAME;
import static com.mgmtp.a12.print.engine.runtime.internal.engine.sizeResolver.utils.FontUtils.FONTS;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TextWidthResolverTest {
	private final TextWidthResolver textWidthResolver;
	private final FontLoader fontLoader = new FontLoader(new PDDocument());

	public TextWidthResolverTest() {
		this.textWidthResolver = new CachedTextWidthResolver();
	}

	private static Stream<Arguments> provideTextWidthTestArguments() {
		return Stream.of(
			Arguments.of("Langer Text", DEFAULT_FONT_NAME, 1200, 6548L),
			Arguments.of("Langer Text", DEFAULT_FONT_NAME, 1400, 7639L),
			Arguments.of("☑", SYMBOL_FONT_NAME, 1200, 985L),
			Arguments.of("☑", DEFAULT_FONT_NAME, 1200, null), // throw exception
			Arguments.of("☑☑", DEFAULT_FONT_NAME, 1200, null), // throw exception
			Arguments.of("Te☑st", SYMBOL_FONT_NAME, 1200, 3319L),
			Arguments.of("Te☑st", DEFAULT_FONT_NAME, 12, null), // throw exception
			Arguments.of("☑Test", SYMBOL_FONT_NAME, 1200, 3320L),
			Arguments.of("Test☑", SYMBOL_FONT_NAME, 1200, 3320L)
		);
	}

	@ParameterizedTest(name = "Case {index}: Text [{0}], Font [{1}], Font size [{2}]")
	@MethodSource("provideTextWidthTestArguments")
	void testTextWidthResolver(String text, String fontName, long fontSize, Long expectedWidth) {
		if (expectedWidth != null) {
			final long widthResult = resolveTextWidth(text, fontName, fontSize);
			assertEquals(expectedWidth, widthResult);
		} else {
			assertThrows(Exception.class, () -> resolveTextWidth(text, fontName, fontSize));
		}
	}

	private long resolveTextWidth(final String text, final String fontName, final long fontSize) {
		return this.textWidthResolver.resolve(
			new InnerTextToken(text, 0, text.length(), HtmlStyle.builder().build()),
			fontLoader.load(FONTS.get(fontName)),
			fontLoader.load(FONTS.get(DEFAULT_FONT_NAME)),
			fontSize
		).getWidth();
	}
}

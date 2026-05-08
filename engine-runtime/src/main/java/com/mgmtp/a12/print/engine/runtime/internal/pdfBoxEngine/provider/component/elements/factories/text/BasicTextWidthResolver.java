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

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.InnerTextToken;
import lombok.NonNull;
import org.apache.pdfbox.pdmodel.font.PDFont;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil.getFontSizeRelatedMetrics;

public abstract class BasicTextWidthResolver implements TextWidthResolver {

	/**
	 * This methode is calculation the width of a innerTextToken, which should not be HTML.
	 * If parts or the whole text could not be rendered with the desired font, the methode is trying
	 * a specified fallback font. If the rendering of a specific character is not possible at all, the replacement
	 * character # is used.
	 *
	 * @param innerTextToken, should not contain HTML anymore
	 * @param font, PDFont to define text width
	 * @param fallbackFont, PDFont for fallback
	 * @param fontSize, to define text width
	 * @return text width
	 */
	public TextWidthResolverResult resolve(@NonNull final InnerTextToken innerTextToken, @NonNull final PDFont font, @NonNull final PDFont fallbackFont, final long fontSize) {
		var width = getStringWidth(innerTextToken.toString(), font);

		if (width == null) {
			return getSupportedTextPartsWidth(innerTextToken, font, fallbackFont, fontSize);
		}

		final var fontSizeRelatedWidth = getFontSizeRelatedMetrics(width , fontSize);
		return new TextWidthResolverResult(List.of(
			new TextWidthResolverPart(innerTextToken.getStart(), innerTextToken.getEnd(), false, fontSizeRelatedWidth)
		), fontSizeRelatedWidth);
	}

	private TextWidthResolverResult getSupportedTextPartsWidth(
		@NonNull final InnerTextToken innerTextToken,
		@NonNull final PDFont font,
		@NonNull final PDFont fallbackFont,
		final long fontSize
	) {
		final var parts = getSupportedTextParts(innerTextToken, font, fallbackFont);

		long width = 0;

		for (final var part: parts) {
			try {
				final var subToken = innerTextToken.subSequence(part.getStart(), part.getEnd());
				final var appliedFont = part.isFallback() ? fallbackFont : font;
				final var subWidth = getFontSizeRelatedMetrics(appliedFont.getStringWidth(subToken.toString()) , fontSize);
				part.setWidth(subWidth);
				width += subWidth;
			} catch (IOException e) {
				throw new StringWidthMeasurementException(e);
			}
		}

		return new TextWidthResolverResult(parts, width);
	}

	private List<TextWidthResolverPart> getSupportedTextParts(
		@NonNull final InnerTextToken innerTextToken,
		@NonNull final PDFont font,
		@NonNull final PDFont fallbackFont
	) {
		final var text = innerTextToken.toString();
		final var parts = new ArrayList<TextWidthResolverPart>();

		int runStart = 0;
		boolean currentIsFallback = false;

		int codePoint;
		for (int offset = 0; offset < text.length(); offset += Character.charCount(codePoint)) {
			codePoint = text.codePointAt(offset);
			final var character = String.valueOf(Character.toChars(codePoint));
			boolean canUseMain = getStringWidth(character, font) != null;
			boolean canUseFallback = !canUseMain && getStringWidth(character, fallbackFont) != null;

			boolean isFallback;
			if (canUseMain) {
				isFallback = false;
			} else if (canUseFallback) {
				isFallback = true;
			} else {
				throw new PrintException(
					String.format("The char %s is not printable with the selected font and fallback font.", character)
				);
			}

			// If font type changes, create a token for the previous run
			if (offset > 0 && isFallback != currentIsFallback) {
				parts.add(new TextWidthResolverPart(runStart, offset, currentIsFallback));
				runStart = offset;
			}
			currentIsFallback = isFallback;
		}

		// Add the last token
		if (runStart < text.length()) {
			parts.add(new TextWidthResolverPart(runStart, text.length(), currentIsFallback));
		}

		return parts;
	}

	private static Float getStringWidth(@NonNull final String text, @NonNull final PDFont font) {
		try {
			return font.getStringWidth(text);
		} catch (IllegalArgumentException | IOException e) {
			return null;
		}
	}
}

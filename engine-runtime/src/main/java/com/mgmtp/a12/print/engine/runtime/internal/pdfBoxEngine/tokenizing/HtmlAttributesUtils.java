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

import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.AttachmentToAppend;
import com.mgmtp.a12.print.model.api.validation.internal.html.CssConstants;
import com.mgmtp.a12.print.model.api.model.element.properties.TextProperties;
import com.mgmtp.a12.print.model.api.validation.internal.html.HtmlValidationConfig;
import com.mgmtp.a12.print.model.api.validation.internal.html.HexColorValidator;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;

import javax.swing.text.MutableAttributeSet;

@Slf4j
public class HtmlAttributesUtils {

	public static UsedAttributes getUsedAttributes(
		@NonNull final MutableAttributeSet attrs
	) {
		UsedStyleAttributes usedStyleAttributes = null;
		String attachmentId = null;

		final var names = attrs.getAttributeNames();
		while (names.hasMoreElements()) {
			final var name = names.nextElement();
			final var value = attrs.getAttribute(name);

			if (value != null && !value.toString().isEmpty()) {
				if (name.toString().equals(HtmlValidationConfig.HTML_ATTR_STYLE)) {
					usedStyleAttributes = parseStyle(value);
				} else if (name.toString().equals("href")) {
					attachmentId = AttachmentToAppend.getAttachmentIdByHref(value.toString());
				}
			}
		}

		if (usedStyleAttributes == null && attachmentId == null) {
			return null;
		}

		if (usedStyleAttributes == null) {
			return new UsedAttributes(null, null, null, attachmentId);
		}

		return new UsedAttributes(
			usedStyleAttributes.color,
			usedStyleAttributes.backgroundColor,
			usedStyleAttributes.alignment,
			attachmentId
		);
	}

	public record UsedAttributes(
		Integer color,
		Integer backgroundColor,
		TextProperties.Alignment alignment,
		String attachmentId
	) {}

	public record UsedStyleAttributes(
		Integer color,
		Integer backgroundColor,
		TextProperties.Alignment alignment
	) {}

	private static UsedStyleAttributes parseStyle(Object value) {
		Integer color = null;
		Integer backgroundColor = null;
		TextProperties.Alignment alignment = null;

		final var styles = value.toString().split(";");

		for (final var style : styles) {
			final var styleParts = style.split(":");
			if (styleParts.length == 2) {
				final var styleKey = styleParts[0].trim();
				final var styleValue = styleParts[1].trim();

				switch (styleKey) {
					case CssConstants.COLOR: {
						color = parseColor(styleValue);
						break;
					}
					case CssConstants.BACKGROUND_COLOR: {
						backgroundColor = parseColor(styleValue);
						break;
					}
					case CssConstants.TEXT_ALIGN: {
						final var alignmentString = StringUtils.capitalize(styleValue);
						alignment = TextProperties.Alignment.fromString(alignmentString);

						if (alignment == null) {
							throw new HtmlTokenizerException("Invalid alignment: " + alignmentString);
						}
						break;
					}
					default: {
						log.debug("Unknown CSS style key: {}", styleKey);
					}
				}
			}
		}

		return new UsedStyleAttributes(color, backgroundColor, alignment);
	}

	public static int parseColor(@NonNull final String value) {
		if (HexColorValidator.isValid(value)) {
			if (value.length() == 4) {
				int r = Character.digit(value.charAt(1), 16);
				int g = Character.digit(value.charAt(2), 16);
				int b = Character.digit(value.charAt(3), 16);
				return ((r << 4 | r) << 16) | ((g << 4 | g) << 8) | (b << 4 | b);
			}
			return Integer.parseUnsignedInt(value.substring(1), 16);
		}

		throw new HtmlTokenizerException("Unknown color: " + value + ". Currently only hex colors are supported.");
	}
}

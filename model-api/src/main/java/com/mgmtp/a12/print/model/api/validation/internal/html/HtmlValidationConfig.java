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
package com.mgmtp.a12.print.model.api.validation.internal.html;

import java.util.Map;
import java.util.Set;

/**
 * Central configuration for HTML validation settings.
 * <p>
 * This class serves as the single source of truth for all HTML validation configuration
 * used by both Java and TypeScript HTML validators.
 * <p>
 * This class is the single source of truth. The TypeScript equivalent is {@code html-validation-config.ts}.
 */
public final class HtmlValidationConfig {

	private HtmlValidationConfig() {
		// Utility class
	}

	/**
	 * HTML tags allowed in Print Models.
	 */
	public static final Set<String> ALLOWED_HTML_TAGS = Set.of("span", "p", "u", "strong", "em", "br");

	/**
	 * Attributes allowed per HTML tag.
	 */
	public static final Map<String, Set<String>> ALLOWED_ATTRIBUTES = Map.of(
		"span", Set.of("style", "class", "entity-id", "entity-type"),
		"p", Set.of("style", "class")
	);

	/**
	 * CSS properties allowed in style attributes.
	 */
	public static final Set<String> ALLOWED_STYLES = Set.of(
		CssConstants.TEXT_ALIGN, CssConstants.COLOR, CssConstants.BACKGROUND_COLOR
	);

	/**
	 * CSS value patterns that are not allowed in style attributes.
	 */
	public static final Set<String> DISALLOWED_CSS_VALUE_PATTERNS = Set.of("url(");

	/**
	 * Valid values for the text-align CSS property.
	 */
	public static final Set<String> VALID_TEXT_ALIGN_VALUES = Set.of("left", "right", "center", "justify");

	/**
	 * HTML void elements that never require a closing tag.
	 */
	public static final Set<String> VOID_ELEMENTS = Set.of("br", "hr", "img", "input", "area", "base",
		"col", "embed", "link", "meta", "param", "source", "track", "wbr");

	/**
	 * HTML tags that are implicitly added by lenient parsers and should be ignored during validation.
	 */
	public static final Set<String> IGNORED_TAGS = Set.of("html", "head", "body");

	// HTML attribute names
	public static final String HTML_ATTR_STYLE = "style";

}

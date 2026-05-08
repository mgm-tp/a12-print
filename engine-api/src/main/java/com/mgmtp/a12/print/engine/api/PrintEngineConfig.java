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
package com.mgmtp.a12.print.engine.api;

// tag::Import[]

import com.mgmtp.a12.print.engine.api.constant.CssConstants;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
// end::Import[]

/**
 * Configures the behavior of the PrintEngine.
 * Allows integrating custom fonts, setting a default font and configuring the HTML-element and CSS-style whitelists.
 * @deprecated since version 3.1.0
 * Will be replaced with {@link PdfBoxPrintEngineConfig} in 4.0.0 (2026.06)
 */
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
@Deprecated(since = "3.1.0")
public class PrintEngineConfig {
	// tag::DefaultValue[]
	public static final String CONFIG_FILE_NAME_PATTERN = "print-config.(yml|yaml)$";
	public static final String TEMPLATE_DIR = "classpath:/ftl/";
	public static final String HTML_TEMPLATE_FILE = "template.ftlx";

	public static final String DEFAULT_FONT_KEY = "default";
	public static final String DEFAULT_TEXT_STYLE_FONT_KEY = "Open Sans";
	private static final String DEFAULT_FONT = "classpath:fonts/OpenSans-Regular.ttf";

	public static final Map<String, String> DEFAULT_FONTS = Map.of(
		DEFAULT_FONT_KEY, DEFAULT_FONT,
		DEFAULT_TEXT_STYLE_FONT_KEY, DEFAULT_FONT,
		"Noto Sans Mono", "classpath:fonts/NotoSansMono-Regular.ttf",
		"Noto Sans Symbols", "classpath:fonts/NotoSansSymbols2-Regular.ttf"
	);

	public static final List<String> DEFAULT_ALLOWED_HTML_TAGS = List.of("span", "p", "u", "strong", "em", "br");
	public static final List<String> DEFAULT_ALLOWED_STYLES = List.of(
		CssConstants.WHITE_SPACE, CssConstants.DISPLAY, CssConstants.FONT_FAMILY, CssConstants.FONT_SIZE,
		CssConstants.LINE_HEIGHT, CssConstants.HEIGHT, CssConstants.VERTICAL_ALIGN, CssConstants.WIDTH,
		CssConstants.BORDER_COLOR, CssConstants.BORDER_STYLE, CssConstants.BORDER_WIDTH, CssConstants.OVERFLOW,
		CssConstants.MIN_HEIGHT, CssConstants.BORDER, CssConstants.FONT_WEIGHT, CssConstants.FONT_STYLE,
		CssConstants.TEXT_DECORATION, CssConstants.TEXT_ALIGN, CssConstants.COLOR, CssConstants.BACKGROUND_COLOR,
		CssConstants.LEFT, CssConstants.MARGIN, CssConstants.CONTENT, CssConstants.TABLE_LAYOUT,
		CssConstants.BORDER_COLLAPSE, CssConstants.BORDER_SPACING, CssConstants.WORD_WRAP, CssConstants.POSITION,
		CssConstants.PADDING, CssConstants.TOP
	);

	public static final PrintEngineConfig DEFAULT = new PrintEngineConfig(
		HTML_TEMPLATE_FILE,
		TEMPLATE_DIR,
		DEFAULT_FONTS,
		DEFAULT_ALLOWED_HTML_TAGS,
		DEFAULT_ALLOWED_STYLES
	);
	// end::DefaultValue[]

	/**
	 * The HTML template file. e.g template.ftlx
	 */
	protected String segmentEntryTemplateName;

	/**
	 * Template directory where template is located. e.g /ftl/
	 */
	protected String templateDirectory;

	/**
	 * Map of available fonts. Each font is registered with a key which can be used in the print model. As value a valid
	 * classpath ('classpath:/') resource of external resource ('file:/') has to be set (e.g.
	 * <code>classpath:/fonts/arial.ttf</code>)
	 */
	protected Map<String, String> availableFonts;

	/**
	 * List of allowed HTML tags (e.g. li,ul). These tags can than be used to render HTML from a field or an expression.
	 * Tags which can lead to security concerns will be filtered and an exception will be thrown (script, iframe, object, embed, style).
	 */
	protected List<String> allowedHtmlTags;
	/**
	 * List of allowed css styles (e.g. display, position, font-size). These styles can be used to apply css styles for
	 * HTML tags. Styles which can lead to security concerns (are not mentioned in this list) will be filtered out.
	 */
	protected List<String> allowedStyles;

}

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
// tag::PdfBoxPrintEngineConfigClass[]
package com.mgmtp.a12.print.engine.api;

// tag::Import[]

import lombok.*;

import java.util.Map;
import com.mgmtp.a12.model.utils.OnlyForUsage;
// end::Import[]

/**
 * Configures the behavior of the PrintEngine.
 * Allows integrating custom fonts and setting a default font.
 */
@OnlyForUsage
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class PdfBoxPrintEngineConfig {
	public static final String DEFAULT_FONT_KEY = "default";
	public static final String DEFAULT_TEXT_STYLE_FONT_KEY = "Open Sans";
	private static final String DEFAULT_FONT = "classpath:fonts/OpenSans-Regular.ttf";

	public static final Map<String, String> DEFAULT_FONTS = Map.of(
		DEFAULT_FONT_KEY, DEFAULT_FONT,
		DEFAULT_TEXT_STYLE_FONT_KEY, DEFAULT_FONT,
		"Noto Sans Mono", "classpath:fonts/NotoSansMono-Regular.ttf",
		"Noto Sans Symbols", "classpath:fonts/NotoSansSymbols2-Regular.ttf"
	);

	public static final PdfBoxPrintEngineConfig DEFAULT = new PdfBoxPrintEngineConfig(DEFAULT_FONTS);

	/**
	 * Map of available fonts. Each font is registered with a key which can be used in the print model. As value a valid
	 * classpath ('classpath:/') resource of external resource ('file:/') has to be set (e.g.
	 * <code>classpath:/fonts/arial.ttf</code>)
	 */
	protected Map<String, String> availableFonts;
}
// end::PdfBoxPrintEngineConfigClass[]

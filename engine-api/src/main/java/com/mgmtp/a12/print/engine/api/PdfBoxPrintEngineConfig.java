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

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Map;
// end::Import[]

/**
 * Configures the behavior of the PrintEngine.
 * Allows integrating custom fonts and setting a default font.
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class PdfBoxPrintEngineConfig extends PrintEngineConfig {
	public PdfBoxPrintEngineConfig(Map<String, String> availableFonts) {
		super(
			PrintEngineConfig.HTML_TEMPLATE_FILE,
			PrintEngineConfig.TEMPLATE_DIR,
			availableFonts,
			PrintEngineConfig.DEFAULT_ALLOWED_HTML_TAGS,
			PrintEngineConfig.DEFAULT_ALLOWED_STYLES
		);
	}

	public static final PdfBoxPrintEngineConfig DEFAULT = new PdfBoxPrintEngineConfig(DEFAULT_FONTS);

	public static PdfBoxPrintEngineConfigBuilder builder() {
		return new PdfBoxPrintEngineConfigBuilder();
	}

	@Override
	public PdfBoxPrintEngineConfigBuilder toBuilder() {
		return new PdfBoxPrintEngineConfigBuilder().availableFonts(this.availableFonts);
	}
}

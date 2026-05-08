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


import java.util.List;
import java.util.Map;

public class PdfBoxPrintEngineConfigBuilder extends PrintEngineConfig.PrintEngineConfigBuilder  {
	private Map<String, String> availableFonts;

	PdfBoxPrintEngineConfigBuilder() {
	}

	@Override
	@Deprecated(forRemoval = true)
	public PdfBoxPrintEngineConfigBuilder segmentEntryTemplateName(String segmentEntryTemplateName) {
		throw new UnsupportedOperationException("In the PdfBoxPrintEngineConfigBuilder it is not supported to set the segment entry template name");
	}

	@Override
	@Deprecated(forRemoval = true)
	public PdfBoxPrintEngineConfigBuilder templateDirectory(String templateDirectory) {
		throw new UnsupportedOperationException("In the PdfBoxPrintEngineConfigBuilder it is not supported to set the template directory");
	}

	@Override
	@Deprecated(forRemoval = true)
	public PdfBoxPrintEngineConfigBuilder allowedHtmlTags(List<String> allowedHtmlTags) {
		throw new UnsupportedOperationException("In the PdfBoxPrintEngineConfigBuilder it is not supported to set the allowed html tags");
	}

	@Override
	@Deprecated(forRemoval = true)
	public PdfBoxPrintEngineConfigBuilder allowedStyles(List<String> allowedStyles) {
		throw new UnsupportedOperationException("In the PdfBoxPrintEngineConfigBuilder it is not supported to set the allowed styles");
	}

	@Override
	public PdfBoxPrintEngineConfigBuilder availableFonts(final Map<String, String> availableFonts) {
		this.availableFonts = availableFonts;
		return this;
	}

	@Override
	public PdfBoxPrintEngineConfig build() {
		return new PdfBoxPrintEngineConfig(this.availableFonts);
	}

	@Override
	public String toString() {
		return "PrintEngineConfig.PrintEngineConfigBuilder(availableFonts=" + this.availableFonts + ")";
	}
}

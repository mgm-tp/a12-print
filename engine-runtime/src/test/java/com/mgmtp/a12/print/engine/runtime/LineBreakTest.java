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
package com.mgmtp.a12.print.engine.runtime;

import com.mgmtp.a12.print.engine.runtime.pdf.PdfPrintEngine;
import com.mgmtp.a12.print.engine.runtime.test.internal.PrintTestUtil;
import com.mgmtp.a12.print.engine.runtime.utils.PdfRuntimeTestUtil;
import com.mgmtp.a12.print.engine.runtime.utils.PrintEngineTest;
import com.mgmtp.a12.print.engine.runtime.utils.PrintPdfGenerationTest;

import static com.mgmtp.a12.print.engine.runtime.utils.PrintEngineTestExecutor.DEFAULT_EXECUTOR;
import static org.assertj.core.api.Assertions.assertThat;

public class LineBreakTest extends PrintPdfGenerationTest {
	private static final String RESULT_PDF_FILE = "lineBreaks";

	@PrintEngineTest(pdfFileName = RESULT_PDF_FILE)
	public void testLineBreaks(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources(
			"/data/lineBreak/LineBreakPM.json"
		);
		final String documentModel = PrintTestUtil.loadFromResources(
			"/data/lineBreak/LineBreakDM.json"
		);
		final String document = PrintTestUtil.loadFromResources(
			"/data/lineBreak/LineBreakDM-1.json"
		);

		final var result  = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "LineBreakDM", documentModel, document);

		PdfRuntimeTestUtil.writeResultFiles(result, RESULT_PDF_FILE);

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final String breakPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(0);
		final String breakHTMLPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(1);
		final String noBreakPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(2);
		final String noBreakHTMLPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(3);
		// Line breaks are replaced correctly
		assertThat(breakHTMLPageMarkup).contains("<br />");
		assertThat(breakHTMLPageMarkup).doesNotContain("\\n");
		assertThat(breakHTMLPageMarkup).doesNotContain("<del>");
		assertThat(breakHTMLPageMarkup).contains("<strong>");

		// HTML is sanitized correctly
		assertThat(breakPageMarkup).contains("<br />");
		assertThat(breakPageMarkup).doesNotContain("\\n");
		assertThat(breakPageMarkup).contains("&lt;del&gt");
		assertThat(breakPageMarkup).contains("&lt;strong&gt");

		// Line breaks are not replaced when lineBreaksPermitted is not set
		assertThat(noBreakHTMLPageMarkup).doesNotContain("<br />");
		assertThat(noBreakHTMLPageMarkup).doesNotContain("\\n");
		assertThat(noBreakHTMLPageMarkup).doesNotContain("<del>");
		assertThat(noBreakHTMLPageMarkup).contains("<strong>");

		// HTML is sanitized correctly, even if lineBreaksPermitted is not set
		assertThat(noBreakPageMarkup).doesNotContain("<br />");
		assertThat(noBreakPageMarkup).doesNotContain("\\n");
		assertThat(noBreakPageMarkup).contains("&lt;del&gt");
		assertThat(noBreakPageMarkup).contains("&lt;strong&gt");
	}
}

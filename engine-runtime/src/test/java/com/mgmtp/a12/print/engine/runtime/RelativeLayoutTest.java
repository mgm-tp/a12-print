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

class RelativeLayoutTest extends PrintPdfGenerationTest {
	private static final String RESULT_PDF_FILE = "relative-layout";

	@PrintEngineTest(pdfFileName = RESULT_PDF_FILE)
	public void givenImplicitMargins_whenPrint_thenCorrect(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/relativeLayout/RelativeLayoutPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/relativeLayout/RelativeLayoutDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/relativeLayout/RelativeLayoutDM-1.json");

		final var result  = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "RelativeLayoutDM", documentModel, document);

		PdfRuntimeTestUtil.writeResultFiles(result, RESULT_PDF_FILE);

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final var firstSegmentMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(0);
		assertThat(firstSegmentMarkup).contains("top: 10mm;", "<p>A</p>");
		assertThat(firstSegmentMarkup).contains("top: 26mm;", "<p>B</p>");
		assertThat(firstSegmentMarkup).contains("top: 31mm;", "<p>C</p>");

		final var secondSegmentMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(1);
		assertThat(secondSegmentMarkup).contains("top: 10mm;", "<p>A</p>");
		assertThat(secondSegmentMarkup).contains("top: 25mm;", "<p>B</p>");
		assertThat(secondSegmentMarkup).contains("top: 30mm;", "<p>C</p>");

		final var thirdSegmentMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(2);
		assertThat(thirdSegmentMarkup).contains("top: 10mm;", "<p>A</p>");
		assertThat(thirdSegmentMarkup).contains("top: 26mm;", "<p>B</p>");
		assertThat(thirdSegmentMarkup).contains("top: 30mm;", "<p>C</p>");

		final var forthSegmentMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(3);
		assertThat(forthSegmentMarkup).contains("top: 10mm;", "Test String");
		assertThat(forthSegmentMarkup).contains("top: 33mm;", "Test String");
		assertThat(forthSegmentMarkup).contains("top: 33mm;", "Test String");

		final var fifthSegmentMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(4);
		assertThat(fifthSegmentMarkup).contains("top: 10mm;", "Test String");
		assertThat(fifthSegmentMarkup).contains("top: 15mm;", "Test String");
		assertThat(fifthSegmentMarkup).contains("top: 33mm;", "Test String");
		assertThat(fifthSegmentMarkup).contains("top: 44mm;", "Test String");
	}
}

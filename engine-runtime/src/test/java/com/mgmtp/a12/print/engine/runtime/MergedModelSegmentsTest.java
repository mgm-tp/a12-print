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

public class MergedModelSegmentsTest extends PrintPdfGenerationTest {
	private static final String RESULT_PDF_FILE = "mergedModelSegments";

	@PrintEngineTest(pdfFileName = RESULT_PDF_FILE)
	public void testMergedModelSegmentsWithStaticTableElement(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/tableLayout/MergedSegmentsPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/tableLayout/TableLayoutDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/tableLayout/TableLayoutDM-1.json");

		final var result  = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "TableLayoutDM", documentModel, document);

		PdfRuntimeTestUtil.writeResultFiles(result, RESULT_PDF_FILE);

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		assertThat(resultWithMarkups.getSegmentHtmlMarkup().size()).isEqualTo(2);

		// each markup has the same table
		for (String markup : resultWithMarkups.getSegmentHtmlMarkup()) {
			// all cell contents are generated
			assertThat(markup).contains("Test1");
			assertThat(markup).contains("Test2");
			assertThat(markup).contains("Test3");

			// styles are set correctly
			assertThat(markup).contains("<table class=\"table_layout element");
			assertThat(markup).contains("left: 25mm;");
			assertThat(markup).contains("top: 25mm;");
			assertThat(markup).contains("width: 87mm;");
			assertThat(markup).contains("border-width: 0.75pt;");
			assertThat(markup).contains("border-color: #000000;");
			assertThat(markup).contains("border-style: solid");
			assertThat(markup).contains("width: 70%;");
			assertThat(markup).contains("width: 30%;");
		}
	}
}

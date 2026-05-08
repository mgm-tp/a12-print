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

public class HideConditionTest extends PrintPdfGenerationTest {
	private static final String RESULT_PDF_FILE = "hideConditions";

	@PrintEngineTest(pdfFileName = RESULT_PDF_FILE)
	public void testHideConditions(boolean usePdfBoxPrintProcess, String usedEngine) {
		final var printModel = PrintTestUtil.loadFromResources("/data/hideConditions/HideConditionsPM.json");
		final var documentModel = PrintTestUtil.loadFromResources("/data/hideConditions/HideConditionsDM.json");
		final var document = PrintTestUtil.loadFromResources("/data/hideConditions/HideConditionsDM-1.json");

		final var result  = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "HideConditionsDM", documentModel, document);

		PdfRuntimeTestUtil.writeResultFiles(result, RESULT_PDF_FILE);

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final var firstPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(0);
		// HideConditions on first page sections
		assertThat(firstPageMarkup).contains("First Section Text Visible");
		assertThat(firstPageMarkup).doesNotContain("First Section Text Not Visible");

		// HideConditions on remaining page sections
		assertThat(firstPageMarkup).contains("Remaining Section Text Visible");
		assertThat(firstPageMarkup).doesNotContain("Remaining Section Text Not Visible");

		// HideConditions on text elements
		assertThat(firstPageMarkup).contains("Segment Text Visible");
		assertThat(firstPageMarkup).doesNotContain("Segment Text Not Visible");

		// HideConditions on line elements
		assertThat(firstPageMarkup).contains("solid");
		assertThat(firstPageMarkup).doesNotContain("dashed");

		// HideConditions on table elements
		assertThat(firstPageMarkup).contains("Table Visible");
		assertThat(firstPageMarkup).doesNotContain("Table Not Visible");

		// HideConditions on image elements
		assertThat(firstPageMarkup).contains("Image Visible");
		assertThat(firstPageMarkup).doesNotContain("Image Not Visible");

		// HideConditions on expression elements
		assertThat(firstPageMarkup).contains("Expression Visible");
		assertThat(firstPageMarkup).doesNotContain("Expression Not Visible");

		// HideConditions on table layout elements
		assertThat(firstPageMarkup).contains("Table Layout Visible");
		assertThat(firstPageMarkup).doesNotContain("Table Layout Not Visible");

		// HideConditions on listing elements
		assertThat(firstPageMarkup).contains("Listing Visible");
		assertThat(firstPageMarkup).doesNotContain("Listing Not Visible");

		// HideConditions on chart elements
		assertThat(firstPageMarkup).containsOnlyOnce("line_chart");
		assertThat(firstPageMarkup).containsOnlyOnce("bar_chart");
		assertThat(firstPageMarkup).containsOnlyOnce("pie_chart");

		// HideConditions on bounding box elements
		assertThat(firstPageMarkup).doesNotContain("Bounding Box Not Visible");

		// HideConditions on elements nested inside a bounding box
		assertThat(firstPageMarkup).contains("Bounding Box Text Visible");
		assertThat(firstPageMarkup).doesNotContain("Bounding Box Text Not Visible");

		final var elementPos = PdfRuntimeTestUtil.getElementYPosition("MovedToTop", firstPageMarkup);
		assertThat(elementPos).isPresent();
		assertThat(elementPos).contains(7);
	}
}

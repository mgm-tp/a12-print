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

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.mgmtp.a12.print.engine.runtime.utils.PrintEngineTestExecutor.DEFAULT_EXECUTOR;
import static org.assertj.core.api.Assertions.assertThat;

public class SectionOffsetTest extends PrintPdfGenerationTest {

	private static final String RESULT_PDF_FILE = "sectionOffset";

	@PrintEngineTest(pdfFileName = RESULT_PDF_FILE)
	public void testSectionOffset(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/sectionOffset/SectionOffsetPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/sectionOffset/SectionOffsetDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/sectionOffset/SectionOffsetDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "SectionOffsetDM", documentModel, document);

		PdfRuntimeTestUtil.writeResultFiles(result, "sectionOffset");

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final int[] elementPositions = new int[] {0, 240, 248, 426, 434};
		final String firstPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(0);
		// The correct elements are rendered
		assertThat(firstPageMarkup).contains("Element 1", "Element 2", "Element 3", "Element 4", "Element 5");
		assertThat(firstPageMarkup).doesNotContain("Hidden Element");

 		for (int i = 0; i < elementPositions.length; i++) {
			Pattern pattern = Pattern.compile(String.format("<div[^>]*top: ([\\d]+)mm[^>]*>[^d]*Element %s", i + 1));
			Matcher matcher = pattern.matcher(firstPageMarkup);
			assertThat(matcher.find()).isTrue().withFailMessage(String.format("Could not find position of 'Element %s'", i+1));
			assertThat(matcher.group(1)).contains(String.format("%s", elementPositions[i]));
		}
	}
}

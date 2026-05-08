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

import com.ibm.icu.impl.Pair;
import com.mgmtp.a12.print.engine.runtime.pdf.PdfPrintEngine;
import com.mgmtp.a12.print.engine.runtime.test.internal.PrintTestUtil;
import com.mgmtp.a12.print.engine.runtime.utils.PdfRuntimeTestUtil;
import com.mgmtp.a12.print.engine.runtime.utils.PrintEngineTest;
import com.mgmtp.a12.print.engine.runtime.utils.PrintPdfGenerationTest;

import java.io.IOException;
import java.util.List;

import static com.mgmtp.a12.print.engine.runtime.utils.PrintEngineTestExecutor.DEFAULT_EXECUTOR;
import static org.assertj.core.api.Assertions.assertThat;

class RepeatableSegmentTest extends PrintPdfGenerationTest {
	@PrintEngineTest(pdfFileName = "repeatableSegment")
	public void testRepeatableSegment(boolean usePdfBoxPrintProcess, String usedEngine) throws IOException {
		final String printModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "RepeatableSegmentDM", documentModel, document);

		final var pdfBaseName = "repeatableSegment";
		PdfRuntimeTestUtil.writeResultFiles(result, pdfBaseName);

		// PDF is generated
		assertThat(result).isNotNull();

		final var parsedText = PdfRuntimeTestUtil.getTextOfPdf(pdfBaseName).replaceAll(
			System.lineSeparator(), ""
		);

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }
		final var markups = resultWithMarkups.getSegmentHtmlMarkup();

		assert markups.size() == 7;

		final var expectedResults = List.of(
			Pair.of("A.1", "5"),
			Pair.of("B.1", "7"),
			Pair.of("C.1", "9"),
			Pair.of("D.1", "63"),
			Pair.of("Z.1", "99.999")
		);

		var pageCount = 1;
		for (var i = 0; i < markups.size(); i++) {
			final var markup = markups.get(i);

			if (i == 0 || i == markups.size() - 1) {
				assert PdfRuntimeTestUtil.containsNumberOfTimes(markup, "<td", 5);
				for (final var expectedResult: expectedResults) {
					assert markup.contains(i == 0 ? expectedResult.first : expectedResult.second);
				}
				assert parsedText.contains(String.format("%d / 12", pageCount++));
			} else {
				final var expectedResult = expectedResults.get(i - 1);
				assert markup.contains(expectedResult.first);
				assert markup.contains(expectedResult.second);
				assert parsedText.contains(String.format("%d / 12", pageCount++));
				pageCount++;
			}
		}
	}

	@PrintEngineTest(pdfFileName = "repeatableSegmentWithSections")
	public void testRepeatableSegmentWithSections(boolean usePdfBoxPrintProcess, String usedEngine) throws IOException {
		final String printModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentWithSectionsPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "RepeatableSegmentDM", documentModel, document);

		final var pdfBaseName = "repeatableSegmentWithSections";
		PdfRuntimeTestUtil.writeResultFiles(result, pdfBaseName);

		// PDF is generated
		assertThat(result).isNotNull();

		final var parsedText = PdfRuntimeTestUtil.getTextOfPdf(pdfBaseName).replaceAll(
			System.lineSeparator(), ""
		);

		assert parsedText.contains("FirstPageSection");
		assert PdfRuntimeTestUtil.containsNumberOfTimes(parsedText, "SecondPageSection", 4);
	}
}

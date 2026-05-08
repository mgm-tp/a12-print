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

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.mgmtp.a12.print.engine.runtime.utils.PrintEngineTestExecutor.DEFAULT_EXECUTOR;
import static org.assertj.core.api.Assertions.assertThat;


class ElementSortingTest extends PrintPdfGenerationTest {
	@PrintEngineTest(pdfFileName = "screenReadingOrder")
	void testScreenReadingOrder(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/screenReadingOrderSorting/ScreenReadingOrderPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/screenReadingOrderSorting/ScreenReadingOrderSortingDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/screenReadingOrderSorting/ScreenReadingOrderSortingDM-1.json");

		final var result  = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "ScreenReadingOrderSortingDM", documentModel, document);

		PdfRuntimeTestUtil.writeResultFiles(result, "screenReadingOrder");

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final String firstPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(0);
		Pattern pattern = Pattern.compile("<hr [\\s\\w\"=]* id=\"(\\w*)\"");
		Matcher matcher = pattern.matcher(firstPageMarkup);
		for (String expectedKey : List.of("firstElement", "secondElement", "thirdElement")) {
			assertThat(matcher.find()).isTrue();
			assertThat(matcher.group(1)).isEqualTo(expectedKey);
		}
	}

	@PrintEngineTest(pdfFileName = "positionSorting")
	void testPositionSorting(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/positionSorting/PositionSortingPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/positionSorting/PositionSortingDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/positionSorting/PositionSortingDM-1.json");

		final var result  = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "PositionSortingDM", documentModel, document);

		PdfRuntimeTestUtil.writeResultFiles(result, "positionSorting");

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final String firstPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(0);
		Pattern pattern = Pattern.compile("<div [\\w=\"\\s-]* id=\"(\\w*)\" style=\"[\\w-:;\\s#.]* top: (\\w*);");
		Matcher matcher = pattern.matcher(firstPageMarkup);
		Map<String, String> expectedValues = Map.of(
			"longElement1Text", "100px",
			"shortElement1Text", "100px",
			"shortElement2Text", "192px",
			"shortElement3Text", "4270px"
		);

		assertThat(matcher.results().count()).isEqualTo(4);

		while (matcher.find()) {
			assertThat(expectedValues).containsKey(matcher.group(1));
			assertThat(expectedValues.get(matcher.group(1))).isEqualTo(matcher.group(2));
		}
	}
}

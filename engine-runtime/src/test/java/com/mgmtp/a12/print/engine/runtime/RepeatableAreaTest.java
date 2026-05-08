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

class RepeatableAreaTest extends PrintPdfGenerationTest {
	@PrintEngineTest(pdfFileName = "repeatableArea")
	public void testRepeatableArea(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableAreaPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableAreaDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableAreaDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "RepeatableAreaDM", documentModel, document);

		PdfRuntimeTestUtil.writeResultFiles(result, "repeatableArea");

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final String firstPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(0);
		// assert that areas are printed at correct position
		Map<String, List<String>> areaPositions = Map.of(
			"REPEATABLE_FIRST_AREA", List.of("0", "359"),
			"mezsmBLnd_UtvrSZ3teJq", List.of("0", "103", "206", "110", "213")
		);

		for (Map.Entry<String, List<String>> areaPos : areaPositions.entrySet()) {
			String pattern = String.format(
				"<div [\\w=\"\\s]* id=\"%s\"[\\w=\"\\s]*style=\"[^\"]*top: ([\\d]*)mm;",
				areaPos.getKey()
			);
			Matcher areaMatcher = Pattern.compile(pattern).matcher(firstPageMarkup);

			while (areaMatcher.find()) {
				assertThat(areaPos.getValue().contains(areaMatcher.group(1))).isTrue();
			}
		}

		assertThat(firstPageMarkup).contains("StringField1");

		assertThat(firstPageMarkup).contains("StringField1-1");
		assertThat(firstPageMarkup).contains("StringField1-2");
		assertThat(firstPageMarkup).contains("StringField1-3");

		assertThat(firstPageMarkup).contains("StringField2");

		assertThat(firstPageMarkup).contains("StringField2-1");
		assertThat(firstPageMarkup).contains("StringField2-2");
		assertThat(firstPageMarkup).contains("StringField2-3");

		final String secondPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(1);
		assertThat(secondPageMarkup).contains("StringField1");

		// not visible because max repetition is 1
		assertThat(secondPageMarkup).doesNotContain("StringField2");
	}

	@PrintEngineTest(pdfFileName = "migratedRepeatableSegment")
	public void testMigratedRepeatableSegment(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentMigratedPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "RepeatableSegmentDM", documentModel, document);

		PdfRuntimeTestUtil.writeResultFiles(result, "migratedRepeatableSegment");

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final String firstPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(0);
		// assert that tables are printed at correct position
		Map<String, String> tablePositions = Map.of(
			"area1", "25",
			"table2", "217",
			"area3", "261"
		);

		for (Map.Entry<String, String> tablePos : tablePositions.entrySet()) {
			String pattern = String.format(
				"<[\\w=\"\\s]* id=\"%s\"[\\w=\"\\s]*style=\"[^\"]*top: ([\\d]*)mm;",
				tablePos.getKey()
			);
			Matcher tableMatcher = Pattern.compile(pattern).matcher(firstPageMarkup);
			assertThat(tableMatcher.find()).isTrue();
			assertThat(tableMatcher.group(1)).isEqualTo(tablePos.getValue());
		}

		// assert that all repeatable segment elements are printed
		for (String id : List.of("text1", "text2")) {
			Matcher textElementMatcher = Pattern.compile(String.format("id=\"%s\"", id)).matcher(firstPageMarkup);
			assertThat(textElementMatcher.results().count()).isEqualTo(8);
		}
	}

	@PrintEngineTest(pdfFileName = "migratedRepeatableBoundingBox")
	public void testMigratedRepeatableBoundingBox(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableBoundingBoxMigratedPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM-2.json");

		final var result = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "RepeatableSegmentDM", documentModel, document);

		PdfRuntimeTestUtil.writeResultFiles(result, "migratedRepeatableBoundingBox");

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final String firstPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(0);
		assertThat(firstPageMarkup).contains("RESULT 1");
		assertThat(firstPageMarkup).contains("RESULT 2");
	}


	@PrintEngineTest(pdfFileName = "migratedRepeatableListing")
	public void testMigratedRepeatableListing(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableListingMigratedPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/repeatableArea/RepeatableSegmentDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "RepeatableSegmentDM", documentModel, document);

		PdfRuntimeTestUtil.writeResultFiles(result, "migratedRepeatableListing");

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final String firstPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(0);
		assertThat(firstPageMarkup).contains("kleine Katzen");
	}
}

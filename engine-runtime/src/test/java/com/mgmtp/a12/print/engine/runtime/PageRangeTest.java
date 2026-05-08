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

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.test.internal.PrintTestUtil;
import com.mgmtp.a12.print.engine.runtime.utils.PdfRuntimeTestUtil;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.List;

import static com.mgmtp.a12.print.engine.runtime.utils.PrintEngineTestExecutor.DEFAULT_EXECUTOR;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PageRangeTest {
	private final String[] EXPECTED_PAGE_TEXTS = {
		"Text 0",
		"Text 1",
		"Text 2",
		"Text 3",
		"Text 4",
		"Repeatable Segment - Text 5",
		"Repeatable Segment - Text 6",
		"Repeatable Segment - Text 7",
		"Repeatable Segment - Text 8",
		"Repeatable Segment - Text 9",
		"Attached PDF - Page 1",
		"Attached PDF - Page 2",
		"",
	};
	private final int MAX_PAGE_COUNT = EXPECTED_PAGE_TEXTS.length;

	@ParameterizedTest(name = "{2} ({0}-{1})")
	@CsvSource(value = {
		"0:12:Exact Entire Document",
		"0:0:Exact First Page",
		"9:9:Exact Last page",
		"10:10:Exact Pdf Attachment Page 1",
		"11:11:Exact Pdf Attachment Page 2",
		"10:11:Entire Pdf Attachment",
		"12:12:Exact Img Attachment",
		"10:12:All Attachments",
		"0:1:Entire Segment 1",
		"2:4:Entire Segment 2",
		"1:3:Part of Segment 1 and 2",
		"6:8:Part of Repeatable Segment",
		"4:8:Part of Segment 2 and Repeatable Segment",
		"8:10:Part of Repeatable Segment and Pdf Attachment",
		"8:12:Part of Repeatable Segment and All Attachments",
		"20:20:Not existing Page",
		"40:60:Not existing Page Range",
		"0:20:Entire Document",
		"-2:12:Entire Document",
		"-2:20:Entire Document",
		"10:20:All Attachments",
		"11:20:Partial Attachment",
		"12:20:Partial Attachment",
		"13:20:Not existing Page Range",
	}, delimiter = ':')
	public void testPageRange(int firstIndex, int lastIndex) {
		final String printModel = PrintTestUtil.loadFromResources("/data/pageRange/PageRangePM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/pageRange/PageRangeDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/pageRange/PageRangeDM-1.json");

		if (firstIndex > MAX_PAGE_COUNT) {
			assertThrows(PrintException.class, () -> DEFAULT_EXECUTOR
				.toBuilder().startIndex(firstIndex).endIndex(lastIndex + 1).build()
				.execute(printModel, "PageRangeDM", documentModel, document),
				"Expected PrintException for first index out of bounds"
			);
			return;
		}

		final var result = DEFAULT_EXECUTOR
			.toBuilder().startIndex(firstIndex).endIndex(lastIndex + 1).build()
			.execute(printModel, "PageRangeDM", documentModel, document);
		// PDF is generated
		assertThat(result).isNotNull();

		final var pdfFile = PdfRuntimeTestUtil.writeResultFiles(result, "PageRangePM_" + firstIndex + "_" + lastIndex);
		final List<String> contentPerPage = PdfRuntimeTestUtil.getFileContentPerPage(pdfFile);

		final int EXPECTED_PAGE_COUNT = Math.min(lastIndex, MAX_PAGE_COUNT - 1) - Math.max(firstIndex, 0) + 1;
		assertThat(contentPerPage.size()).isEqualTo(EXPECTED_PAGE_COUNT);

		for (int i = 0; i < EXPECTED_PAGE_COUNT; i++) {
			final int pageIndex = Math.max(firstIndex, 0) + i;
			final String firstLineOnPage = PdfRuntimeTestUtil.getFirstLine(contentPerPage.get(i));
			final String expectedFirstLineOnPage = EXPECTED_PAGE_TEXTS[pageIndex];

			assertThat(firstLineOnPage).isEqualTo(expectedFirstLineOnPage);
		}
	}

	@ParameterizedTest(name = "{2} ({0}-{1})")
	@CsvSource(value = {
		"0:9:13:Exact Entire Document",
		"0:0:3:Exact First Page",
		"9:9:1:Exact Last page",
		"0:1:4:Entire Segment 1",
		"2:4:4:Entire Segment 2",
		"1:3:4:Part of Segment 1 and 2",
		"6:8:3:Part of Repeatable Segment",
		"4:8:5:Part of Segment 2 and Repeatable Segment",
		"8:9:2:Part of Repeatable Segment",
		"20:20:1:Not existing Page",
		"40:60:21:Not existing Page Range",
		"0:20:13:Entire Document",
		"-2:12:13:Entire Document",
		"-2:20:13:Entire Document",
		"13:20:8:Not existing Page Range",
	}, delimiter = ':')
	public void testPageRangePdfBox(int firstIndex, int lastIndex, int expectedPageCount) {
		final String printModel = PrintTestUtil.loadFromResources("/data/pageRange/PageRangePM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/pageRange/PageRangeDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/pageRange/PageRangeDM-1.json");

		if (firstIndex > 10) {
			assertThrows(PrintException.class, () -> DEFAULT_EXECUTOR
					.toBuilder().usePdfBoxPrintProcess(true).startIndex(firstIndex).endIndex(lastIndex + 1).build()
					.execute(printModel, "PageRangeDM", documentModel, document),
				"Expected PrintException for first index out of bounds"
			);
			return;
		}

		final var result = DEFAULT_EXECUTOR
			.toBuilder().usePdfBoxPrintProcess(true).startIndex(firstIndex).endIndex(lastIndex + 1).build()
			.execute(printModel, "PageRangeDM", documentModel, document);
		// PDF is generated
		assertThat(result).isNotNull();

		final var pdfFile = PdfRuntimeTestUtil.writeResultFiles(result, "PageRangePM_" + firstIndex + "_" + lastIndex);
		final List<String> contentPerPage = PdfRuntimeTestUtil.getFileContentPerPage(pdfFile);

		assertThat(contentPerPage.size()).isEqualTo(expectedPageCount);
	}

}

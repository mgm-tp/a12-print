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

import com.mgmtp.a12.print.engine.runtime.test.internal.PrintTestUtil;
import com.mgmtp.a12.print.engine.runtime.utils.PdfRuntimeTestUtil;
import com.mgmtp.a12.print.engine.runtime.utils.PrintEngineTest;
import com.mgmtp.a12.print.engine.runtime.utils.PrintPdfGenerationTest;
import org.apache.commons.lang3.StringUtils;

import java.io.IOException;

import static com.mgmtp.a12.print.engine.runtime.utils.PrintEngineTestExecutor.DEFAULT_EXECUTOR;
import static org.assertj.core.api.Assertions.assertThat;

class WatermarkTest extends PrintPdfGenerationTest {

	@PrintEngineTest(pdfFileName = "watermarks-1")
	public void testWatermark(boolean usePdfBoxPrintProcess, String usedEngine) throws IOException {
		final String printModel = PrintTestUtil.loadFromResources("/data/watermark/WatermarkPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/watermark/WatermarkDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/watermark/WatermarkDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "WatermarkDM", documentModel, document);

		final var pdfBasName = "watermarks-1";
		PdfRuntimeTestUtil.writeResultFiles(result, pdfBasName);

		// PDF is generated
		assertThat(result).isNotNull();

		final var parsedText = PdfRuntimeTestUtil.getTextOfPdf(pdfBasName).replaceAll(
			System.getProperty("line.separator"), ""
		);

		final var completeWatermarkPortraitContent = "WatermarkPortraitContent";
		final var completeWatermarkLandscapeContent = "WatermarkLandscapeContent";

		// show the watermarks twice
		assert StringUtils.countMatches(parsedText, "WatermarkPort") == 2;
		assert StringUtils.countMatches(parsedText, "WatermarkLand") == 2;

		// show only part of the watermark texts because, they are over a page break
		assert StringUtils.countMatches(parsedText, completeWatermarkPortraitContent) == 0;
		assert StringUtils.countMatches(parsedText, completeWatermarkLandscapeContent) == 0;
	}

	@PrintEngineTest(pdfFileName = "watermarks-2")
	public void testWatermarkDisplay(boolean usePdfBoxPrintProcess, String usedEngine) throws IOException {
		final String printModel = PrintTestUtil.loadFromResources("/data/watermark/WatermarkPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/watermark/WatermarkDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/watermark/WatermarkDM-2.json");

		final var result = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "WatermarkDM", documentModel, document);

		final var pdfBasName = "watermarks-2";
		PdfRuntimeTestUtil.writeResultFiles(result, pdfBasName);

		// PDF is generated
		assertThat(result).isNotNull();

		final var parsedText = PdfRuntimeTestUtil.getTextOfPdf(pdfBasName).replaceAll(
			System.getProperty("line.separator"), ""
		);

		// do not show watermarks if the flag is set to false
		assert StringUtils.countMatches(parsedText, "WatermarkPort") == 0;
		assert StringUtils.countMatches(parsedText, "WatermarkLand") == 0;
	}
}

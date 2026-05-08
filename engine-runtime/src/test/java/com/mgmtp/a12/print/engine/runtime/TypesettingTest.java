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

import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.test.internal.PrintTestUtil;
import com.mgmtp.a12.print.engine.runtime.utils.PdfRuntimeTestUtil;
import com.mgmtp.a12.print.engine.runtime.utils.PrintEngineTest;
import com.mgmtp.a12.print.engine.runtime.utils.PrintPdfGenerationTest;
import org.apache.commons.lang3.StringUtils;

import java.util.List;

import static com.mgmtp.a12.print.engine.runtime.utils.PrintEngineTestExecutor.DEFAULT_EXECUTOR;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class TypesettingTest extends PrintPdfGenerationTest {

	private static final String RESULT_PDF_FILE = "orphans-widows";

	@PrintEngineTest(pdfFileName = RESULT_PDF_FILE)
	void testOrphansWidows(boolean usePdfBoxPrintProcess, String usedEngine) {
		final String printModel = PrintTestUtil.loadFromResources("/data/widowsOrphans/WidowsOrphansPM.json");
		final String typesettingModel = PrintTestUtil.loadFromResources("/data/widowsOrphans/CustomTypesettingTSM.json");

		final var result = DEFAULT_EXECUTOR.toBuilder()
			.usePdfBoxPrintProcess(usePdfBoxPrintProcess)
			.typesettingModel(typesettingModel)
			.build()
			.execute(printModel, Constants.NO_SELECTED_DOCUMENT_ID, null, null);

		final var pdfFile = PdfRuntimeTestUtil.writeResultFiles(result, RESULT_PDF_FILE);
		// PDF is generated
		assertThat(result).isNotNull();

		final List<String> contentPerPage = PdfRuntimeTestUtil.getFileContentPerPage(pdfFile);

		final var newLineCountFirst = StringUtils.countMatches(contentPerPage.getFirst(), "\n");
		final var newLineCountSecond = StringUtils.countMatches(contentPerPage.get(1), "\n");
		final var newLineCountThird = StringUtils.countMatches(contentPerPage.get(2), "\n");
		final var newLineCountFourth = StringUtils.countMatches(contentPerPage.get(3), "\n");
		assertEquals(usePdfBoxPrintProcess ? 36 : 52, newLineCountFirst);
		assertEquals(usePdfBoxPrintProcess ? 55 : 42, newLineCountSecond);
		assertEquals(usePdfBoxPrintProcess ? 68 : 84, newLineCountThird);
		assertEquals(usePdfBoxPrintProcess ? 76 : 68, newLineCountFourth);

	}
}

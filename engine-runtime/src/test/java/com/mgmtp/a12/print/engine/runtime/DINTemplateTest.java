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

class DINTemplateTest extends PrintPdfGenerationTest {
	private static final String RESULT_PDF_FILE = "dinTemplate";

	@PrintEngineTest(pdfFileName = RESULT_PDF_FILE)
	void testDINTemplate(boolean usePdfBoxPrintProcess, String usedEngine) {
		final var printModel = PrintTestUtil.loadFromResources(
			"/data/dinTemplates/DINTemplateReferencePM.json"
		);
		final var documentModel = PrintTestUtil.loadFromResources(
			"/data/dinTemplates/DINTemplateDM.json"
		);
		final var document = PrintTestUtil.loadFromResources(
			"/data/dinTemplates/DINTemplateDM-1.json"
		);

		final var result  = DEFAULT_EXECUTOR.toBuilder().usePdfBoxPrintProcess(usePdfBoxPrintProcess).build()
			.execute(printModel, "DINTemplateDM", documentModel, document);

		PdfRuntimeTestUtil.writeResultFiles(result, RESULT_PDF_FILE);

		// PDF is generated
		assertThat(result).isNotNull();

		if (!(result instanceof PdfPrintEngine.ResultWithMarkups resultWithMarkups)) { return; }

		final var firstPageMarkup = resultWithMarkups.getSegmentHtmlMarkup().get(0);
		// only one segment is rendered
		assertThat(resultWithMarkups.getSegmentHtmlMarkup().size()).isEqualTo(1);

		// all bounding boxes are rendered
		assertThat(firstPageMarkup).contains("BlueBox"); 	// from template, top-level
		assertThat(firstPageMarkup).contains("YellowBox"); 	// from template, top-level
		assertThat(firstPageMarkup).contains("GreenBox"); 	// from template, inside BlueBox
		assertThat(firstPageMarkup).contains("RedBox"); 	// from override, inside GreenBox

		// all text elements are rendered
		assertThat(firstPageMarkup).contains("RESULT 1");	// inside YellowBox, field
		assertThat(firstPageMarkup).contains("RESULT 2");	// inside GreenBox, field
		assertThat(firstPageMarkup).contains("RESULT 3");	// inside RedBox, static text
		assertThat(firstPageMarkup).contains("Lorem");		// inside BlueBox, field

		// top-level bounding box positions are static
		final var blueBoxPos = PdfRuntimeTestUtil.getElementYPosition("BlueBox", firstPageMarkup);
		assertThat(blueBoxPos.isPresent()).isTrue();
		assertThat(blueBoxPos.get()).isEqualTo(25);

		final var yellowBoxPos = PdfRuntimeTestUtil.getElementYPosition("YellowBox", firstPageMarkup);
		assertThat(yellowBoxPos.isPresent()).isTrue();
		assertThat(yellowBoxPos.get()).isEqualTo(81);
	}
}

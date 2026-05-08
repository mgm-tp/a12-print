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
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.io.IOException;

import static com.mgmtp.a12.print.engine.runtime.utils.PrintEngineTestExecutor.DEFAULT_EXECUTOR;
import static org.assertj.core.api.Assertions.assertThat;

class MetadataComputationTest extends PrintPdfGenerationTest {

	@Test
	void testMetadataComputation_shouldUseComputedValues() throws IOException {
		final String printModel = PrintTestUtil.loadFromResources("/data/metadata/MetadataPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/metadata/MetadataDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/metadata/MetadataDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder()
			.usePdfBoxPrintProcess(true) // Only PdfBoxPrintEngine supports computed metadata
			.build()
			.execute(printModel, "MetadataDM", documentModel, document);

		final File pdfFile = PdfRuntimeTestUtil.writeResultFiles(result, "metadata-computed-filled");

		// PDF is generated
		assertThat(result).isNotNull();
		assertThat(pdfFile).exists();

		// Verify PDF metadata uses computed values
		try (PDDocument doc = PDDocument.load(pdfFile)) {
			PDDocumentInformation info = doc.getDocumentInformation();

			assertThat(info.getTitle()).isEqualTo("Computed Title Value");
			assertThat(info.getAuthor()).isEqualTo("Computed Author Value");
			assertThat(info.getSubject()).isEqualTo("Computed Description Value");
			String language = doc.getDocumentCatalog().getLanguage();
			assertThat(language).isEqualTo("en-US");
		}
	}

	@Test
	void testMetadataComputation_shouldUseComputedFallbackValues() throws IOException {
		final String printModel = PrintTestUtil.loadFromResources("/data/metadata/MetadataPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/metadata/MetadataDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/metadata/MetadataDM-2.json");

		final var result = DEFAULT_EXECUTOR.toBuilder()
			.usePdfBoxPrintProcess(true) // Only PdfBoxPrintEngine supports computed metadata
			.build()
			.execute(printModel, "MetadataDM", documentModel, document);

		final File pdfFile = PdfRuntimeTestUtil.writeResultFiles(result, "metadata-computed-fallback");

		// PDF is generated
		assertThat(result).isNotNull();
		assertThat(pdfFile).exists();

		// Verify PDF metadata uses computed fallback values
		try (PDDocument doc = PDDocument.load(pdfFile)) {
			PDDocumentInformation info = doc.getDocumentInformation();

			assertThat(info.getTitle()).isEqualTo("Fallback Title");
			assertThat(info.getAuthor()).isEqualTo("Fallback Author");
			assertThat(info.getSubject()).isEqualTo("Fallback Description");
			String language = doc.getDocumentCatalog().getLanguage();
			assertThat(language).isEqualTo("de-DE");
		}
	}

	@Test
	void testMetadataComputation_shouldFallbackToEmptyString() throws IOException {
		final String printModel = PrintTestUtil.loadFromResources("/data/metadata/MetadataEmptyPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/metadata/MetadataDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/metadata/MetadataDM-2.json");

		final var result = DEFAULT_EXECUTOR.toBuilder()
			.usePdfBoxPrintProcess(true) // Only PdfBoxPrintEngine supports computed metadata
			.build()
			.execute(printModel, "MetadataDM", documentModel, document);

		final File pdfFile = PdfRuntimeTestUtil.writeResultFiles(result, "metadata-empty");

		// PDF is generated
		assertThat(result).isNotNull();
		assertThat(pdfFile).exists();

		// Verify PDF metadata uses empty strings
		try (PDDocument doc = PDDocument.load(pdfFile)) {
			PDDocumentInformation info = doc.getDocumentInformation();

			assertThat(info.getTitle()).isEmpty();
			assertThat(info.getAuthor()).isEmpty();
			assertThat(info.getSubject()).isEmpty();
			String language = doc.getDocumentCatalog().getLanguage();
			assertThat(language).isEmpty();
		}
	}

	@PrintEngineTest(pdfFileName = "metadata-literal")
	public void testMetadataComputation_shouldUseLiteralValues(boolean usePdfBoxPrintProcess, String usedEngine) throws IOException {
		final String printModel = PrintTestUtil.loadFromResources("/data/test/TestPM.json");
		final String documentModel = PrintTestUtil.loadFromResources("/data/test/TestFieldDM.json");
		final String document = PrintTestUtil.loadFromResources("/data/test/TestFieldDM-1.json");

		final var result = DEFAULT_EXECUTOR.toBuilder()
			.usePdfBoxPrintProcess(usePdfBoxPrintProcess)
			.build()
			.execute(printModel, "TestFieldDM", documentModel, document);

		final File pdfFile = PdfRuntimeTestUtil.writeResultFiles(result, "metadata-literal");

		// PDF is generated
		assertThat(result).isNotNull();
		assertThat(pdfFile).exists();

		// Verify PDF metadata uses literal values (stripped quotes from the operation strings)
		try (PDDocument doc = PDDocument.load(pdfFile)) {
			PDDocumentInformation info = doc.getDocumentInformation();

			assertThat(info.getTitle()).isEqualTo("Field");
			assertThat(info.getAuthor()).isEqualTo("Rudi Wagner");
			assertThat(info.getSubject()).isEqualTo("Field");
			String language = doc.getDocumentCatalog().getLanguage();
			assertThat(language).isEqualTo("DE");
		}
	}
}

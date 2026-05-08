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
package com.mgmtp.a12.print.engine.runtime.utils;

import com.mgmtp.a12.print.engine.runtime.test.internal.PrintTestUtil;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.extension.AfterTestExecutionCallback;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.verapdf.pdfa.Foundries;
import org.verapdf.pdfa.flavours.PDFAFlavour;
import org.verapdf.pdfa.results.TestAssertion;
import org.verapdf.pdfa.results.ValidationResult;

import java.io.File;
import java.util.Arrays;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.mgmtp.a12.print.engine.runtime.utils.PdfRuntimeTestUtil.PDFBOX_SUFFIX;
import static com.mgmtp.a12.print.engine.runtime.utils.PdfRuntimeTestUtil.PDF_PRINT_ENGINE_KEY;

@Slf4j
public class PdfConformanceCheckExtension implements AfterTestExecutionCallback {
	public static final PDFAFlavour[] PDFA_FLAVOURS = {PDFAFlavour.PDFA_3_A, PDFAFlavour.PDFUA_1};

	@Override
	public void afterTestExecution(ExtensionContext context) {
		final var testMethod = context.getTestMethod().orElse(null);
		final var failedResult = context.getExecutionException().isPresent();

		if (testMethod != null && testMethod.isAnnotationPresent(PrintEngineTest.class) && !failedResult) {
			final var anno = testMethod.getAnnotation(PrintEngineTest.class);

			assert anno.pdfFileName() != null;
			final var pdfFile = PrintTestUtil.resolveFile(
				String.format("%s%s.pdf", anno.pdfFileName(), context.getDisplayName().contains(PDF_PRINT_ENGINE_KEY) ? "" : PDFBOX_SUFFIX)
			);
			assert pdfFile.exists();

			checkPdfConformance(
				pdfFile,
				Arrays.stream(PDFA_FLAVOURS),
				anno.flavours(),
				anno.expectMissingFlavour(),
				testMethod.getName()
			);
		}
	}

	public static void checkPdfConformance(
		File pdfFile,
		Stream<PDFAFlavour> flavoursToCheck,
		PDFAFlavour[] configuredFlavours,
		boolean expectMissingFlavour,
		String testMethodName
	) {
		final var conformanceReport = new StringBuilder();
		conformanceReport.append(String.format("Method: %s, ", testMethodName));

		final var isConform = flavoursToCheck.map(flavour ->
			checkPdfConformance(pdfFile, flavour)
		).allMatch(validationResult -> {
			final var currentFlavour = validationResult.getPDFAFlavour();
			final var isConfiguredFlavour = Arrays.stream(configuredFlavours).anyMatch(configuredFlavour -> configuredFlavour == currentFlavour);
			final var asserts = validationResult.getTestAssertions().stream()
				.filter(ta -> ta.getStatus() == TestAssertion.Status.FAILED)
				.toList();

			final var errors = asserts.stream()
				.map(ta -> String.format("%s\n    %s", ta.getMessage().replaceAll("\\s+", " "), ta.getLocation().getContext()))
				.collect(Collectors.joining("\n    ", "[\n    ", "\n]"));

			if (!asserts.isEmpty() && (isConfiguredFlavour || expectMissingFlavour)) {
				log.error("\nCONFORMANCE ERRORS({}) ({}): {}\n", currentFlavour, asserts.size(), errors);
			}

			final boolean conformance;
			if (isConfiguredFlavour) {
				conformance = asserts.isEmpty() && validationResult.isCompliant();
				conformanceReport.append(String.format("Conformance %s: %s, ", currentFlavour, conformance ? "☑" : "☐"));
			} else {
				if (expectMissingFlavour) {
					log.warn("The flavour {} is missing for the test: {}", currentFlavour, testMethodName);
				}
				conformanceReport.append(String.format("Conformance %s: ☐, ", currentFlavour));
				conformance = true;
			}

			return conformance;
		});

		conformanceReport.append(String.format("File Size: %d", pdfFile.length()));

		log.info(conformanceReport.toString());

		assert isConform;
	}

	private static ValidationResult checkPdfConformance(File pdfFile, PDFAFlavour flavour) {
		try (final var foundries = Foundries.defaultInstance();
			 final var parser = foundries.createParser(pdfFile, flavour);
			 final var validator = foundries.createValidator(flavour, false)
		) {
			return validator.validate(parser);
		} catch (Exception exception) {
			throw new RuntimeException(exception);
		}
	}
}

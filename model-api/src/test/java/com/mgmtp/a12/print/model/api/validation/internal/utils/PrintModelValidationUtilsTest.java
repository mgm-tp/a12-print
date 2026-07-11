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
package com.mgmtp.a12.print.model.api.validation.internal.utils;

import com.mgmtp.a12.print.model.api.validation.IPrintModelIntegrityMessage;
import com.mgmtp.a12.print.model.api.validation.IPrintModelIntegrityReport;
import com.mgmtp.a12.print.model.api.validation.IPrintModelValidator;
import com.mgmtp.a12.print.model.api.validation.PrintModelValidator;
import com.mgmtp.a12.print.model.api.validation.PrintModelValidatorOptions;

import java.util.List;
import java.util.Locale;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PrintModelValidationUtilsTest {

	private static final String PRINT_MODEL_PATH = "/print-models/PrintModel-with-text.json";

	@Test
	void testPrintModelValidation() {
		IPrintModelValidator printModelValidator = new PrintModelValidator();

		String printModel = ResourceFile.loadFileFromResources(PRINT_MODEL_PATH);
		IPrintModelIntegrityReport report = printModelValidator.validate(printModel, Locale.GERMAN);
		assert report.noErrorOccurred();

		// Create invalid print model dto
		printModel = printModel.replaceFirst("\"value\": 50", "\"value\": \"INVALID_POSITION_VALUE\"");
		report = printModelValidator.validate(printModel, Locale.GERMAN);
		assert !report.noErrorOccurred();

		// Filter to only ERROR messages (ignore INFO messages from metadata validation)
		List<IPrintModelIntegrityMessage> errorMessages = report.getMessages().stream()
			.filter(msg -> msg.getSeverityType().equals(IPrintModelIntegrityMessage.SeverityType.ERROR))
			.toList();

		assert errorMessages.size() == 1;
		assert errorMessages.get(0).getText().contains("zahlHatUngueltigeZeichen");
		assert errorMessages.get(0).getSeverityType().equals(IPrintModelIntegrityMessage.SeverityType.ERROR);
	}

	@Test
	void validateWithOptionsHtmlFalseNoHtmlMessagesReported() {
		IPrintModelValidator validator = new PrintModelValidator();
		String printModel = ResourceFile.loadFileFromResources(PRINT_MODEL_PATH);

		IPrintModelIntegrityReport report = validator.validate(printModel, new PrintModelValidatorOptions(Locale.GERMAN, false));

		assertTrue(report.noErrorOccurred());
		boolean hasHtmlMessage = report.getMessages().stream()
			.anyMatch(m -> m.getText().startsWith("content.elementDefinitions"));
		assertFalse(hasHtmlMessage, "html=false must not produce HTML messages");
	}

	@Test
	void validateWithOptionsHtmlTrueCleanHtmlNoErrorOccurred() {
		IPrintModelValidator validator = new PrintModelValidator();
		// Replace the <div> (unsupported tag) with a clean allowed tag so no warnings arise
		String printModel = ResourceFile.loadFileFromResources(PRINT_MODEL_PATH)
			.replace("<div><p>TEST</p></div>", "<p>clean</p>");

		IPrintModelIntegrityReport report = validator.validate(printModel, new PrintModelValidatorOptions(Locale.GERMAN, true));

		assertTrue(report.noErrorOccurred());
		boolean hasHtmlError = report.getMessages().stream()
			.anyMatch(m -> m.getSeverityType() == IPrintModelIntegrityMessage.SeverityType.ERROR
				&& m.getText().startsWith("content.elementDefinitions"));
		assertFalse(hasHtmlError);
	}

	@Test
	void validateWithOptionsHtmlTrueMalformedHtmlErrorOccurred() {
		IPrintModelValidator validator = new PrintModelValidator();
		// Inject an unclosed tag to trigger malformed-HTML ERROR
		String printModel = ResourceFile.loadFileFromResources(PRINT_MODEL_PATH)
			.replace("<div><p>TEST</p></div>", "<b>unclosed");

		IPrintModelIntegrityReport report = validator.validate(printModel, new PrintModelValidatorOptions(Locale.GERMAN, true));

		assertFalse(report.noErrorOccurred());
		boolean hasHtmlError = report.getMessages().stream()
			.anyMatch(m -> m.getSeverityType() == IPrintModelIntegrityMessage.SeverityType.ERROR
				&& m.getText().startsWith("content.elementDefinitions"));
		assertTrue(hasHtmlError, "Malformed HTML must produce an ERROR message");
	}

	@Test
	void validateWithOptionsHtmlTrueUnusedTagWarningPresentButNoError() {
		IPrintModelValidator validator = new PrintModelValidator();
		// The fixture contains <div> which is not in ALLOWED_HTML_TAGS → WARNING
		String printModel = ResourceFile.loadFileFromResources(PRINT_MODEL_PATH);

		IPrintModelIntegrityReport report = validator.validate(printModel, new PrintModelValidatorOptions(Locale.GERMAN, true));

		assertTrue(report.noErrorOccurred(), "Warnings must not fail validation");
		boolean hasHtmlWarning = report.getMessages().stream()
			.anyMatch(m -> m.getSeverityType() == IPrintModelIntegrityMessage.SeverityType.WARNING
				&& m.getText().startsWith("content.elementDefinitions"));
		assertTrue(hasHtmlWarning, "Unsupported <div> tag must produce a WARNING");
	}

	@Test
	void validateWithNullLocaleThrowsNullPointerException() {
		assertThrows(NullPointerException.class, () -> new PrintModelValidatorOptions(null));
	}
}

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
package com.mgmtp.a12.print.model.api.validation;

import com.mgmtp.a12.print.model.api.validation.internal.utils.ResourceFile;
import org.apache.commons.lang3.StringUtils;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Locale;

public class PrintValidationTest {

	@ParameterizedTest(name = "Case {index}: Test Print custom DateTimeFormat field type with format [{0}]")
	@CsvSource(value = {
		"yyyy.MM.dd G 'at' HH:mm:ss z;''",
		"yyyyy.MMMMM.dd GGG hh:mm aaa;Ung\u00fcltiges Datum: 'a' zu oft wiederholt.",
		"yyMMddHHmmssZ;''",
		"'';''",
		"eEE, d MMM yyyy HH:mm:ss Z;''",
		"YYYY-MM-dd'a;Ung\u00fcltiges Datum: Unterminiertes Zitat.",
		"YYYY-MM-dd];Ung\u00fcltiges Datum: Erwartetes '[' vor ']'."
	}, delimiter = ';')
	public void testPrintModelValidationWithCustomType(String format, String errorText) {
		IPrintModelValidator printModelValidator = new PrintModelValidator();
		String path = "/print-models/PrintModel-with-custom-type.json";
		String printModel = ResourceFile.loadFileFromResources(path);
		IPrintModelIntegrityReport report = printModelValidator.validate(printModel.replace("<dateFormat>", format),
			Locale.GERMAN);

		assertValidationResultError(report, errorText, 1, IPrintModelIntegrityMessage.SeverityType.ERROR);
	}

	@Test
	public void testICustomConditionIsOnlyOneIsSortingIndex() {
		IPrintModelValidator printModelValidator = new PrintModelValidator();

		String path = "/print-models/Listing-with-one-sorting-column.json";
		String printModel = ResourceFile.loadFileFromResources(path);
		IPrintModelIntegrityReport report = printModelValidator.validate(printModel, Locale.GERMAN);

		assertValidationResultError(report, "", 0, IPrintModelIntegrityMessage.SeverityType.ERROR);

		path = "/print-models/Listing-with-multiple-sorting-columns.json";
		printModel = ResourceFile.loadFileFromResources(path);
		report = printModelValidator.validate(printModel, Locale.GERMAN);

		assertValidationResultError(
			report,
			"Nur eine Spalte darf als Sortierindex gewählt werden.",
			2,
			IPrintModelIntegrityMessage.SeverityType.ERROR
		);
	}

	@Test
	public void testICustomConditionIsElementReferenceOverlapped() {
		IPrintModelValidator printModelValidator = new PrintModelValidator();

		String path = "/print-models/Print-model-without-overlap.json";
		String printModel = ResourceFile.loadFileFromResources(path);
		IPrintModelIntegrityReport report = printModelValidator.validate(printModel, Locale.GERMAN);

		assertValidationResultError(report, "", 0, IPrintModelIntegrityMessage.SeverityType.WARNING);

		path = "/print-models/Print-model-with-overlap.json";
		printModel = ResourceFile.loadFileFromResources(path);
		report = printModelValidator.validate(printModel, Locale.GERMAN);

		assertValidationResultError(
			report,
			"Das Element überschneidet sich mit anderen",
			2,
			IPrintModelIntegrityMessage.SeverityType.WARNING
		);
	}

	private void assertValidationResultError(
		IPrintModelIntegrityReport report,
		String errorText,
		int errorAmount,
		IPrintModelIntegrityMessage.SeverityType severity
	) {
		// Filter messages to only include the expected severity level (ignore INFO messages for validation tests)
		List<IPrintModelIntegrityMessage> relevantMessages = report.getMessages().stream()
			.filter(msg -> msg.getSeverityType().equals(severity))
			.toList();

		if (!StringUtils.isEmpty(errorText)) {
			assert !severity.equals(IPrintModelIntegrityMessage.SeverityType.ERROR) || !report.noErrorOccurred();
			assert relevantMessages.size() == errorAmount;
			assert relevantMessages.getFirst().getSeverityType().equals(severity);
			assert relevantMessages.getFirst().getErrorText().equals(errorText);
		} else {
			assert report.noErrorOccurred();
			assert relevantMessages.isEmpty();
		}
	}
}


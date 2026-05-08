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

import java.util.List;
import java.util.Locale;

import org.junit.jupiter.api.Test;

public class PrintModelValidationUtilsTest {

	@Test
	public void testPrintModelValidation() {
		IPrintModelValidator printModelValidator = new PrintModelValidator();

		String path = "/print-models/PrintModel-with-text.json";
		String printModel = ResourceFile.loadFileFromResources(path);
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
}

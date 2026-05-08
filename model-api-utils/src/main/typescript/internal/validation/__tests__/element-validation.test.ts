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
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/lib/errors/deep-partial-error-map.js";

import validElementJson from "../../../../../test/resources/print-models/print-element-definition.json" with { type: "json" };
import invalidElementJson from "../../../../../test/resources/print-models/print-element-definition-invalid.json" with { type: "json" };

import { PrintElementValidator } from "../print-element-validator.js";

describe("PrintElementDefinition Validation", () => {
	it("validate test element without error", () => {
		const report = PrintElementValidator.getInstance().validate(validElementJson);

		expect(report.noErrorOccurred).toBe(true);
		expect(report.errorMap[ErrorSeverity.ERROR]).toHaveLength(0);
	});

	it("validate test print element with errors", () => {
		const report = PrintElementValidator.getInstance().validate(invalidElementJson);

		expect(report.noErrorOccurred).toBe(false);
		expect(report.errorMap[ErrorSeverity.ERROR]).toHaveLength(1);
		expect(report.errorMap[ErrorSeverity.ERROR][0].errorCode).toBe("Error rule_6b82a");
	});

	it("validate test print element with parse errors", () => {
		const report = PrintElementValidator.getInstance().validate("INVALID_STRING");

		expect(report.noErrorOccurred).toBe(false);
		expect(report.errorMap[ErrorSeverity.ERROR]).toHaveLength(1);
		expect(report.errorMap[ErrorSeverity.ERROR][0].errorCode).toBe("jsonParse");
	});
});

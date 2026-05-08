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
import cloneDeep from "lodash/cloneDeep.js";

import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/lib/errors/deep-partial-error-map.js";
import { deepCloneObject } from "@com.mgmtp.a12.print/print-model-api/lib/utils/print-model/base.js";

import validPrintModelJson from "../../../../../test/resources/print-models/print-model.json" with { type: "json" };
import printModelWithCustomTypeJson from "../../../../../test/resources/print-models/print-model-with-custom-type.json" with { type: "json" };
import { PrintDateTimeFormatErrorEnum } from "../../../internal/validation/print-date-time-format-type/error/error-enum.js";

import { PrintModelValidator } from "../print-model-validator.js";
import { PrintValidator } from "../print-validator.js";

describe("PrintMetaModel Validation", () => {
	it("validate test print model without error", () => {
		const report = PrintModelValidator.getInstance().validate(validPrintModelJson);
		assertReportResult(report);
	});

	it("validate test print model with errors", () => {
		const invalidPrintModelJson = cloneDeep(validPrintModelJson);
		invalidPrintModelJson.content.segments.definitions[0].id = undefined as never;
		const report = PrintModelValidator.getInstance().validate(invalidPrintModelJson);

		assertReportResult(report, true, "mandatoryField");
	});

	it("validate test print model with parse errors", () => {
		const report = PrintModelValidator.getInstance().validate("INVALID_STRING");

		assertReportResult(report, true, "jsonParse");
	});

	describe("Custom DateTimeFormat field type", () => {
		const tests: {
			dateFormat: string;
			hasError: boolean;
			errorEnum?: PrintDateTimeFormatErrorEnum;
			note?: string;
		}[] = [
			{ dateFormat: "yyyy.MM.dd G 'at' HH:mm:ss z", hasError: false },
			{ dateFormat: "EEE, MMM d, ''yy", hasError: false },
			{ dateFormat: "h:mm a", hasError: false },
			{ dateFormat: "hh 'o''clock' a, zzzz", hasError: false },
			{ dateFormat: "K:mm a, z", hasError: false },
			{ dateFormat: "yyyyy.MMMMM.dd GGG hh:mm a", hasError: false },
			{ dateFormat: "EEE, d MMM yyyy HH:mm:ss Z", hasError: false },
			{ dateFormat: "yyMMddHHmmssZ", hasError: false },
			{ dateFormat: "yyyy-MM-dd'T'HH:mm:ss.SSSZ", hasError: false },
			{ dateFormat: "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", hasError: false },
			{ dateFormat: "YYYY-'W'ww-u", hasError: false },
			{ dateFormat: "", hasError: false },
			{ dateFormat: "%Y-%m-d", hasError: false },
			{ dateFormat: "[yyyy.MM.dd]", hasError: false },
			{
				dateFormat: "eEE, d MMM yyyy HH:mm:ss Ztt dfg",
				hasError: true,
				errorEnum: PrintDateTimeFormatErrorEnum.PATTERN_CHARACTER_INVALID,
				note: "contains invalid pattern character (e)",
			},
			{
				dateFormat: "YYYY-MM-dd'q",
				hasError: true,
				errorEnum: PrintDateTimeFormatErrorEnum.UNTERMINATED_QUOTE,
			},
			{
				dateFormat: "YYYY-MM-dd]q",
				hasError: true,
				errorEnum: PrintDateTimeFormatErrorEnum.OPTIONAL_SECTION_CLOSED_UNOPENED,
			},
			{
				dateFormat: "YYYY-MM-dd{}#q",
				hasError: true,
				errorEnum: PrintDateTimeFormatErrorEnum.RESERVED_CHARACTER_USED,
			},
			{
				dateFormat: "YYYY-MM-ddd",
				hasError: true,
				note: "'d' used 3 times",
				errorEnum: PrintDateTimeFormatErrorEnum.CHARACTER_MAX_REPETITION_EXCEEDED,
			},
		];

		tests.forEach(({ dateFormat, hasError, errorEnum }) => {
			it(`validate test print model with format ${dateFormat} ${hasError ? "with" : "without"} error`, () => {
				const printModel = JSON.stringify(printModelWithCustomTypeJson).replace("<dateFormat>", dateFormat);
				const report = PrintModelValidator.getInstance().validate(printModel);

				if (hasError) {
					expect(report.noErrorOccurred).toBe(false);
					expect(report.errorMap[ErrorSeverity.ERROR]).toHaveLength(1);
					expect(report.errorMap[ErrorSeverity.ERROR][0].errorCode).toBe(
						PrintDateTimeFormatErrorEnum.DATE_INVALID
					);
					if (errorEnum) {
						expect(
							report.errorMap[ErrorSeverity.ERROR][0].errorMessage[0].key.includes(errorEnum)
						).toBeTruthy();
					}
				} else {
					expect(report.noErrorOccurred).toBe(true);
					expect(report.errorMap[ErrorSeverity.ERROR]).toHaveLength(0);
				}
			});
		});
	});

	describe("Repeatable Segment Errors", () => {
		it("should trigger validation rule RequireDataContextForRepeatableSegment", () => {
			const model = deepCloneObject({ target: validPrintModelJson });
			model.content.segments.definitions[0].type = "Repeatable";

			const report = PrintModelValidator.getInstance().validate(model);

			assertReportResult(report, true, "Error rule_22114");
		});

		it("should trigger validation rule onlyOneRepeatable", () => {
			const model = deepCloneObject({ target: validPrintModelJson });
			model.content.segments.definitions[0].type = "Repeatable";
			model.content.segments.definitions[0].dataContexts = [
				{ id: "dataContextId1", isRepetition: true, model: "SomeModel1", path: "SomePath1" },
				{ id: "dataContextId2", isRepetition: true, model: "SomeModel2", path: "SomePath2" },
			];

			const report = PrintModelValidator.getInstance().validate(model);

			assertReportResult(report, true, "Error rule_13ee6");
		});
	});

	function assertReportResult<T>(
		report: PrintValidator.IntegrityReport<T>,
		hasError = false,
		expectedCode = ""
	): void {
		if (hasError) {
			expect(report.noErrorOccurred).toBe(false);
			expect(report.errorMap[ErrorSeverity.ERROR]).toHaveLength(1);
			expect(report.errorMap[ErrorSeverity.ERROR][0].errorCode).toBe(expectedCode);
		} else {
			expect(report.noErrorOccurred).toBe(true);
			expect(report.errorMap[ErrorSeverity.ERROR]).toHaveLength(0);
		}
	}
});

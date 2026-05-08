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
import { DateFormatTest } from "../../../../../test/typescript/test-utils/date-time-format-validation/dateFormatTest.js";
import { allInvalidLetterCases } from "../../../../../test/typescript/test-utils/date-time-format-validation/invalidLetters.js";
import {
	allMaxRepitionCases,
	allMaxRepitionErrorCases,
	allRepetitionCases,
	specificRepetitionCases,
	specificRepetitionErrorCases,
} from "../../../../../test/typescript/test-utils/date-time-format-validation/repetitions.js";
import {
	allSpecialCharacterCases,
	allSpecialRuleCharacterCases,
	allUnicodeCases,
} from "../../../../../test/typescript/test-utils/date-time-format-validation/specialCharacter.js";

import { DateTimeFormatValidator, DateTimeFormatErrorEnum } from "../date-time-format-validation/index.js";

const testCases: DateFormatTest[] = [
	{
		pattern: "yyyy-MM-dd",
		description: "Correct pattern",
	},
	{
		pattern: "yyyy-MM-dd[XXX]]]'",
		description: "Unmatched closing bracket",
		errorCode: DateTimeFormatErrorEnum.OPTIONAL_SECTION_CLOSED_UNOPENED,
	},
	{
		pattern: "yyyy-MM-dd'T",
		description: "Unclosed quote",
		errorCode: DateTimeFormatErrorEnum.UNTERMINATED_QUOTE,
	},
	{
		pattern: "yyyy-MM-dd'",
		description: "Unclosed quote",
		errorCode: DateTimeFormatErrorEnum.UNTERMINATED_QUOTE,
	},
	{
		pattern: "yyyy-I-dd",
		description: "Invalid pattern character I",
		errorCode: DateTimeFormatErrorEnum.PATTERN_CHARACTER_INVALID,
	},
	{
		pattern: "yyyy#MM-dd",
		description: "Reserved character '#'",
		errorCode: DateTimeFormatErrorEnum.RESERVED_CHARACTER_USED,
	},
	{
		pattern: "yyyy-MM-ddd",
		description: "'d' repeated more than 2 times",
		errorCode: DateTimeFormatErrorEnum.CHARACTER_MAX_REPETITION_EXCEEDED,
	},
	{
		pattern: "V",
		description: "Single V is invalid",
		errorCode: DateTimeFormatErrorEnum.CHARACTER_REPETITION_INVALID,
	},
	{
		pattern: "OO",
		description: "Double O is invalid",
		errorCode: DateTimeFormatErrorEnum.CHARACTER_REPETITION_INVALID,
	},
	{
		pattern: "OOO",
		description: "Triple O is invalid",
		errorCode: DateTimeFormatErrorEnum.CHARACTER_REPETITION_INVALID,
	},
	{
		pattern: "O OOOO",
		description: "Single O and quadruple O are valid",
	},
];

const repetitionTestCases: DateFormatTest[] = allRepetitionCases()
	.concat(allMaxRepitionCases())
	.concat(allMaxRepitionErrorCases())
	.concat(specificRepetitionCases())
	.concat(specificRepetitionErrorCases());

const invalidLetterCases: DateFormatTest[] = allInvalidLetterCases();

const specialCharacterCases: DateFormatTest[] = allSpecialCharacterCases();

const unicodeCases: DateFormatTest[] = allUnicodeCases();

const specialRuleCases: DateFormatTest[] = allSpecialRuleCharacterCases();

describe("DateTimeFormatValidator", () => {
	test.each(testCases)("$description", (testCase: { pattern: string; errorCode?: DateTimeFormatErrorEnum }) => {
		const validator = new DateTimeFormatValidator();
		const result = validator.getValidationError(testCase.pattern);

		if (!testCase.errorCode) {
			expect(result).toBeUndefined();
			return;
		}
		expect(result?.code).toBe(testCase.errorCode);
	});

	describe("Generated test cases", () => {
		describe("Characters have correct repetition settings", () => {
			test.each(repetitionTestCases)("$description", (testCase: DateFormatTest) => {
				const validator = new DateTimeFormatValidator();
				const result = validator.getValidationError(testCase.pattern);
				if (testCase.hasError) {
					expect(result).toBeDefined();
					expect(result?.code).toBe(testCase.errorCode);
				} else {
					expect(result).toBeUndefined();
				}
			});
		});

		describe("Invalid characters create errors", () => {
			test.each(invalidLetterCases)("$description", (testCase: DateFormatTest) => {
				const validator = new DateTimeFormatValidator();
				const result = validator.getValidationError(testCase.pattern);

				expect(result?.code).toBe(testCase.errorCode);
			});
		});

		describe("Validates special characters correctly", () => {
			test.each(specialCharacterCases)("$description", (testCase: DateFormatTest) => {
				const validator = new DateTimeFormatValidator();
				const result = validator.getValidationError(testCase.pattern);

				if (testCase.hasError) {
					expect(result).toBeDefined();
					expect(result?.code).toBe(DateTimeFormatErrorEnum.RESERVED_CHARACTER_USED);
					return;
				}
				expect(result).toBeUndefined();
			});

			test.each(unicodeCases)("$description", (testCase: DateFormatTest) => {
				const validator = new DateTimeFormatValidator();
				const result = validator.getValidationError(testCase.pattern);

				expect(result).toBeUndefined();
			});
		});

		describe("Follows the rule for special characters", () => {
			test.each(specialRuleCases)("$description", (testCase: DateFormatTest) => {
				const validator = new DateTimeFormatValidator();
				const result = validator.getValidationError(testCase.pattern);

				if (testCase.hasError) {
					expect(result).toBeDefined();
					expect(result?.code).toBe(testCase.errorCode);
				}
			});
		});
	});
});

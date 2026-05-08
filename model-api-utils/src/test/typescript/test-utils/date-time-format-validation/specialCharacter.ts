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
import { DateTimeFormatErrorEnum } from "../../../../main/typescript/internal/validation/date-time-format-validation/index.js";

import { DateFormatTest } from "./dateFormatTest.js";

const specialCharacters: { letter: string; throwsError: boolean }[] = [
	{ letter: "@", throwsError: false },
	{ letter: "^", throwsError: false },
	{ letter: "_", throwsError: false },
	{ letter: "`", throwsError: false },
	{ letter: '"', throwsError: false },
	{ letter: "!", throwsError: false },
	{ letter: "$", throwsError: false },
	{ letter: "%", throwsError: false },
	{ letter: "&", throwsError: false },
	{ letter: "(", throwsError: false },
	{ letter: ")", throwsError: false },
	{ letter: "*", throwsError: false },
	{ letter: "+", throwsError: false },
	{ letter: "-", throwsError: false },
	{ letter: ",", throwsError: false },
	{ letter: ".", throwsError: false },
	{ letter: "/", throwsError: false },
	{ letter: ":", throwsError: false },
	{ letter: ";", throwsError: false },
	{ letter: "|", throwsError: false },
	{ letter: "<", throwsError: false },
	{ letter: "=", throwsError: false },
	{ letter: ">", throwsError: false },
	{ letter: "~", throwsError: false },
	{ letter: "?", throwsError: false },
	{ letter: " ", throwsError: false },
	{ letter: "ä", throwsError: false },
	{ letter: "Ä", throwsError: false },
	{ letter: "ö", throwsError: false },
	{ letter: "Ö", throwsError: false },
	{ letter: "ü", throwsError: false },
	{ letter: "Ü", throwsError: false },
	{ letter: "§", throwsError: false },
	{ letter: "€", throwsError: false },
	{ letter: "#", throwsError: true },
	{ letter: "{", throwsError: true },
	{ letter: "}", throwsError: true },
];

const unicodeCharacters = ["🕑", "⌛", "📆", "😊"];

const specialRuleCharacters: {
	letter: string;
	pattern: string;
	violatesRules: boolean;
	throwsError?: DateTimeFormatErrorEnum;
}[] = [
	{
		letter: "p",
		pattern: "pp ",
		violatesRules: true,
		throwsError: DateTimeFormatErrorEnum.PATTERN_CHARACTER_INVALID,
	},
	{
		letter: "p",
		pattern: "yyyy-ppppR",
		violatesRules: true,
		throwsError: DateTimeFormatErrorEnum.PATTERN_CHARACTER_INVALID,
	},
	{ letter: "p", pattern: "ppyy", violatesRules: false },
	{
		letter: "'",
		pattern: "yyyy.MM.dd 'at HH:mm:ss",
		violatesRules: true,
		throwsError: DateTimeFormatErrorEnum.UNTERMINATED_QUOTE,
	},
	{ letter: "'", pattern: "yyyy.MM.dd 'at' HH:mm:ss", violatesRules: false },
	{ letter: "'", pattern: "HH 'o''clock'", violatesRules: false },
	{ letter: "[", pattern: "yyyy.MM.dd-[z", violatesRules: false },
	{
		letter: "]",
		pattern: "yyyy.MM.dd-z]",
		violatesRules: true,
		throwsError: DateTimeFormatErrorEnum.OPTIONAL_SECTION_CLOSED_UNOPENED,
	},
	{ letter: "]", pattern: "yyyy.MM.dd-[z]", violatesRules: false },
];

const basePattern = "YYYY-MM-dd";

const generateSpecialCharacterCase = (letter: string, error: boolean = false): DateFormatTest => {
	return {
		pattern: `${basePattern}-${letter}`,
		description: `'${letter}' is ${error ? "invalid" : "valid"} in ${basePattern}-${letter}`,
		hasError: error,
	};
};

const generateSpecialRuleCharacterCase = (
	letter: string,
	errorString: string,
	throwsError: boolean,
	error?: DateTimeFormatErrorEnum
): DateFormatTest => {
	return {
		pattern: errorString,
		description: `${throwsError ? "Invalid" : "Valid"} use of "${letter}"  in ${errorString}`,
		hasError: throwsError,
		errorCode: error,
	};
};

export const allSpecialRuleCharacterCases = (): DateFormatTest[] => {
	return specialRuleCharacters.map(value =>
		generateSpecialRuleCharacterCase(value.letter, value.pattern, value.violatesRules, value.throwsError)
	);
};

export const allSpecialCharacterCases = (): DateFormatTest[] => {
	return specialCharacters.map(value => generateSpecialCharacterCase(value.letter, value.throwsError));
};

export const allUnicodeCases = (): DateFormatTest[] => {
	return unicodeCharacters.map(value => generateSpecialCharacterCase(value));
};

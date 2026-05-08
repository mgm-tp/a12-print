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
import {
	DateTimeFormatErrorEnum,
	MaxRepetition,
	UNLIMITED_REPETITION,
} from "../../../../main/typescript/internal/validation/date-time-format-validation/index.js";

import { DateFormatLetters } from "./dateFormatLetters.js";
import { DateFormatTest } from "./dateFormatTest.js";

const linearDateRepetitionCases: { letter: DateFormatLetters; maxRepetitions: number }[] = [
	{ letter: "G", maxRepetitions: MaxRepetition.ERA },
	{ letter: "u", maxRepetitions: MaxRepetition.YEAR },
	{ letter: "y", maxRepetitions: MaxRepetition.YEAR_OF_ERA },
	{ letter: "D", maxRepetitions: MaxRepetition.DAY_OF_YEAR },
	{ letter: "M", maxRepetitions: MaxRepetition.MONTH_OF_YEAR },
	{ letter: "L", maxRepetitions: MaxRepetition.MONTH_OF_YEAR_STANDALONE },
	{ letter: "w", maxRepetitions: MaxRepetition.WEEK_OF_WEEK_BASED_YEAR },
	{ letter: "W", maxRepetitions: MaxRepetition.WEEK_OF_MONTH },
	{ letter: "d", maxRepetitions: MaxRepetition.DAY_OF_MONTH },
	{ letter: "Q", maxRepetitions: MaxRepetition.QUARTER_OF_YEAR },
	{ letter: "q", maxRepetitions: MaxRepetition.QUARTER_OF_YEAR_STANDALONE },
	{ letter: "Y", maxRepetitions: MaxRepetition.WEEK_BASED_YEAR },
	{ letter: "E", maxRepetitions: MaxRepetition.DAY_OF_WEEK },
	{ letter: "e", maxRepetitions: MaxRepetition.DAY_OF_WEEK_LOCALIZED },
	{ letter: "F", maxRepetitions: MaxRepetition.DAY_OF_WEEK_IN_MONTH },
	{ letter: "a", maxRepetitions: MaxRepetition.AM_PM_OF_DAY },
	{ letter: "h", maxRepetitions: MaxRepetition.CLOCK_HOUR_OF_AM_PM },
	{ letter: "K", maxRepetitions: MaxRepetition.HOUR_OF_AM_PM },
	{ letter: "k", maxRepetitions: MaxRepetition.CLOCK_HOUR_OF_DAY },
	{ letter: "H", maxRepetitions: MaxRepetition.HOUR_OF_DAY },
	{ letter: "m", maxRepetitions: MaxRepetition.MINUTE_OF_HOUR },
	{ letter: "s", maxRepetitions: MaxRepetition.SECOND_OF_MINUTE },
	{ letter: "S", maxRepetitions: MaxRepetition.FRACTION_OF_SECOND },
	{ letter: "A", maxRepetitions: MaxRepetition.MILLI_OF_DAY },
	{ letter: "z", maxRepetitions: MaxRepetition.TIME_ZONE_NAME },
	{ letter: "X", maxRepetitions: MaxRepetition.ZONE_OFFSET_Z_FOR_ZERO },
	{ letter: "x", maxRepetitions: MaxRepetition.ZONE_OFFSET_X },
	{ letter: "Z", maxRepetitions: MaxRepetition.ZONE_OFFSET_Z },
	{ letter: "c", maxRepetitions: MaxRepetition.DAY_OF_WEEK_LOCALIZED_STANDALONE },
	// these have specific legal repetitions but it still makes sense to test for their maximum
	{ letter: "V", maxRepetitions: MaxRepetition.TIME_ZONE_ID },
	{ letter: "O", maxRepetitions: MaxRepetition.ZONE_OFFSET_LOCALIZED },
];

const specificLegalRepetitionDateCases: { letter: DateFormatLetters; legalRepetitions: number[] }[] = [
	{ letter: "V", legalRepetitions: [MaxRepetition.TIME_ZONE_ID] },
	{ letter: "O", legalRepetitions: [1, MaxRepetition.ZONE_OFFSET_LOCALIZED] },
];

interface GeneratedTestProps {
	letter: DateFormatLetters;
	repetition: number;
	exceeds: boolean;
	error?: DateTimeFormatErrorEnum;
}

const generateRepititionTestCase = ({
	letter,
	repetition,
	exceeds,
	error = DateTimeFormatErrorEnum.CHARACTER_MAX_REPETITION_EXCEEDED,
}: GeneratedTestProps): DateFormatTest => {
	const repetitionString = letter.repeat(repetition);

	return {
		pattern: `${repetitionString}`,
		description: `'${repetitionString}' is ${exceeds ? "invalid" : "valid"}`,
		hasError: exceeds,
		errorCode: error,
	};
};

export const specificRepetitionCases = (): DateFormatTest[] => {
	return specificLegalRepetitionDateCases.flatMap(value =>
		value.legalRepetitions.map(repetition =>
			generateRepititionTestCase({ letter: value.letter, repetition: repetition, exceeds: false })
		)
	);
};

export const specificRepetitionErrorCases = (): DateFormatTest[] => {
	return specificLegalRepetitionDateCases.flatMap(value => {
		// create an Array that is filled with a natural numbers up to the maximum of legal Repetitions
		const naturalNumbersToMax = Array.from({ length: value.legalRepetitions.at(-1)! }, (e, i) => i);
		// remove 0
		naturalNumbersToMax.shift();

		// filter out any that overlap with legal Repetitions
		const illegalRepetitions = naturalNumbersToMax.filter(x => !value.legalRepetitions.includes(x));

		return illegalRepetitions.map(repetition =>
			generateRepititionTestCase({
				letter: value.letter,
				repetition: repetition,
				exceeds: true,
				error: DateTimeFormatErrorEnum.CHARACTER_REPETITION_INVALID,
			})
		);
	});
};

const unlimitedRepetitionCase = (letter: DateFormatLetters): DateFormatTest => {
	return {
		pattern: letter.repeat(8),
		description: `'${letter}' can be repeated without limit.`,
		hasError: false,
	};
};

const iterativeRepetitionCase = (letter: DateFormatLetters, repetition: number): DateFormatTest[] => {
	const testCases: DateFormatTest[] = [];
	for (let i = 1; i < repetition; i++) {
		testCases.push(generateRepititionTestCase({ letter: letter, repetition: i, exceeds: false, error: undefined }));
	}
	return testCases;
};

export const allRepetitionCases = (): DateFormatTest[] => {
	return linearDateRepetitionCases.flatMap(value => {
		// already covered by specific repetition cases
		if (value.letter === "c" || value.letter === "V" || value.letter === "O") {
			return [];
		}
		return iterativeRepetitionCase(value.letter, value.maxRepetitions);
	});
};

export const allMaxRepitionCases = (): DateFormatTest[] => {
	return linearDateRepetitionCases.map(value => {
		if (value.maxRepetitions === UNLIMITED_REPETITION) {
			return unlimitedRepetitionCase(value.letter);
		}
		return generateRepititionTestCase({
			letter: value.letter,
			repetition: value.maxRepetitions,
			exceeds: false,
		});
	});
};

export const allMaxRepitionErrorCases = (): DateFormatTest[] => {
	return linearDateRepetitionCases.flatMap(value => {
		if (value.maxRepetitions === UNLIMITED_REPETITION) {
			return [];
		}
		return generateRepititionTestCase({
			letter: value.letter,
			repetition: value.maxRepetitions + 1,
			exceeds: true,
		});
	});
};

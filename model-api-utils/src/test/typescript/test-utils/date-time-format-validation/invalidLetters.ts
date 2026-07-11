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

import type { DateFormatTest } from "./dateFormatTest.js";

const invalidLetters = ["b", "C", "I", "i", "J", "j", "l", "o", "P", "R", "r", "T", "t", "U"];

const base_pattern = "YYYY-MM-dd";

const generateInvalidLetterCase = (letter: string): DateFormatTest => {
	return {
		pattern: `${base_pattern}-${letter}`,
		description: `'${letter}' is invalid in pattern: ${base_pattern}-${letter}`,
		errorCode: DateTimeFormatErrorEnum.PATTERN_CHARACTER_INVALID,
	};
};

export const allInvalidLetterCases = (): DateFormatTest[] => {
	return invalidLetters.map(value => generateInvalidLetterCase(value));
};

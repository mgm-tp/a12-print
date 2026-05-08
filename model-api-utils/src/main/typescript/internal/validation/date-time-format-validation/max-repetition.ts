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
export const UNLIMITED_REPETITION = -1;

export namespace MaxRepetition {
	export const ERA = 5;
	export const YEAR = UNLIMITED_REPETITION;
	export const YEAR_OF_ERA = UNLIMITED_REPETITION;
	export const DAY_OF_YEAR = 3;
	export const MONTH_OF_YEAR = 5;
	export const MONTH_OF_YEAR_STANDALONE = 5;
	export const DAY_OF_MONTH = 2;
	export const QUARTER_OF_YEAR = 5;
	export const QUARTER_OF_YEAR_STANDALONE = 5;
	export const WEEK_BASED_YEAR = UNLIMITED_REPETITION;
	export const WEEK_OF_WEEK_BASED_YEAR = 2;
	export const WEEK_OF_MONTH = 1;
	export const DAY_OF_WEEK = 5;
	export const DAY_OF_WEEK_LOCALIZED = 5;
	export const DAY_OF_WEEK_LOCALIZED_STANDALONE = 5;
	export const DAY_OF_WEEK_IN_MONTH = 1;
	export const AM_PM_OF_DAY = 1;
	export const CLOCK_HOUR_OF_AM_PM = 2;
	export const HOUR_OF_AM_PM = 2;
	export const CLOCK_HOUR_OF_DAY = 2;
	export const HOUR_OF_DAY = 2;
	export const MINUTE_OF_HOUR = 2;
	export const SECOND_OF_MINUTE = 2;
	export const FRACTION_OF_SECOND = UNLIMITED_REPETITION;
	export const MILLI_OF_DAY = UNLIMITED_REPETITION;
	export const NANO_OF_SECOND = UNLIMITED_REPETITION;
	export const NANO_OF_DAY = UNLIMITED_REPETITION;
	export const TIME_ZONE_ID = 2;
	export const TIME_ZONE_NAME = 4;
	export const ZONE_OFFSET_LOCALIZED = 4;
	export const ZONE_OFFSET_Z_FOR_ZERO = 5;
	export const ZONE_OFFSET_X = 5;
	export const ZONE_OFFSET_Z = 5;
}

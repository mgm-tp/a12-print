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
grammar DateTimeFormat;

entrypoint
    : pattern EOF
    ;

pattern
    : (padding? element | ESCAPED_TEXT | LITERAL | optionalSection)*
    ;

padding
    : PAD_NEXT+
    ;

optionalSection
	: OPTIONAL_SECTION_START pattern OPTIONAL_SECTION_END?
	;

ESCAPED_TEXT:  ESCAPE_FOR_TEXT (NOT_SINGLE_QUOTE | ESCAPED_SINGLE_QUOTE)* ESCAPE_FOR_TEXT;

element
    : era
    | year
    | yearOfEra
    | dayOfYear
    | monthOfYear
    | monthOfYearStandalone
    | dayOfMonth
    | quarterOfYear
    | quarterOfYearStandalone
    | weekBasedYear
    | weekOfWeekBasedYear
    | weekOfMonth
    | dayOfWeek
    | dayOfWeekLocalized
    | dayOfWeekLocalizedStandalone
    | dayOfWeekInMonth
    | amPmOfDay
    | clockHourOfAmPm
    | hourOfAmPm
    | clockHourOfDay
    | hourOfDay
    | minuteOfHour
    | secondOfMinute
    | fractionOfSecond
    | milliOfDay
    | nanoOfSecond
    | nanoOfDay
    | timeZoneId
    | timeZoneName
    | zoneOffsetLocalized
    | zoneOffsetZForZero
    | zoneOffsetX
    | zoneOffsetZ
    ;

ERA: 'G';
era: ERA+;

YEAR: 'u';
year: YEAR+;

YEAR_OF_ERA: 'y';
yearOfEra: YEAR_OF_ERA+;

DAY_OF_YEAR : 'D';
dayOfYear: DAY_OF_YEAR+;

MONTH_OF_YEAR: 'M';
monthOfYear: MONTH_OF_YEAR+;

MONTH_OF_YEAR_STANDALONE: 'L';
monthOfYearStandalone: MONTH_OF_YEAR_STANDALONE+;

DAY_OF_MONTH: 'd';
dayOfMonth: DAY_OF_MONTH+;

QUARTER_OF_YEAR: 'Q';
quarterOfYear: QUARTER_OF_YEAR+;

QUARTER_OF_YEAR_STANDALONE: 'q';
quarterOfYearStandalone: QUARTER_OF_YEAR_STANDALONE+;

WEEK_BASED_YEAR: 'Y';
weekBasedYear: WEEK_BASED_YEAR+;

WEEK_OF_WEEK_BASED_YEAR: 'w';
weekOfWeekBasedYear: WEEK_OF_WEEK_BASED_YEAR+;

WEEK_OF_MONTH: 'W';
weekOfMonth: WEEK_OF_MONTH+;

DAY_OF_WEEK: 'E';
dayOfWeek: DAY_OF_WEEK+;

DAY_OF_WEEK_LOCALIZED: 'e';
dayOfWeekLocalized: DAY_OF_WEEK_LOCALIZED+;

DAY_OF_WEEK_LOCALIZED_STANDALONE: 'c';
dayOfWeekLocalizedStandalone: DAY_OF_WEEK_LOCALIZED_STANDALONE+;

DAY_OF_WEEK_IN_MONTH: 'F';
dayOfWeekInMonth: DAY_OF_WEEK_IN_MONTH+;

AM_PM_OF_DAY: 'a';
amPmOfDay: AM_PM_OF_DAY+;

CLOCK_HOUR_OF_AM_PM: 'h';
clockHourOfAmPm: CLOCK_HOUR_OF_AM_PM+;

HOUR_OF_AM_PM: 'K';
hourOfAmPm: HOUR_OF_AM_PM+;

CLOCK_HOUR_OF_DAY: 'k';
clockHourOfDay: CLOCK_HOUR_OF_DAY+;

HOUR_OF_DAY: 'H';
hourOfDay: HOUR_OF_DAY+;

MINUTE_OF_HOUR: 'm';
minuteOfHour: MINUTE_OF_HOUR+;

SECOND_OF_MINUTE: 's';
secondOfMinute: SECOND_OF_MINUTE+;

FRACTION_OF_SECOND: 'S';
fractionOfSecond: FRACTION_OF_SECOND+;

MILLI_OF_DAY: 'A';
milliOfDay: MILLI_OF_DAY+;

NANO_OF_SECOND: 'n';
nanoOfSecond: NANO_OF_SECOND+;

NANO_OF_DAY: 'N';
nanoOfDay: NANO_OF_DAY+;

TIME_ZONE_ID: 'V';
timeZoneId: TIME_ZONE_ID+;

TIME_ZONE_NAME: 'z';
timeZoneName: TIME_ZONE_NAME+;

LOCALIZED_ZONE_OFFSET: 'O';
zoneOffsetLocalized: LOCALIZED_ZONE_OFFSET+;

ZONE_OFFSET_Z_FOR_ZERO: 'X';
zoneOffsetZForZero: ZONE_OFFSET_Z_FOR_ZERO+;

ZONE_OFFSET_X: 'x';
zoneOffsetX: ZONE_OFFSET_X+;

ZONE_OFFSET_Z: 'Z';
zoneOffsetZ: ZONE_OFFSET_Z+;

PAD_NEXT: 'p';
ESCAPE_FOR_TEXT: '\'';
ESCAPED_SINGLE_QUOTE: '\'\'';
OPTIONAL_SECTION_START: '[';
OPTIONAL_SECTION_END: ']';
RESERVED_CHARACTER: '#' | '{' | '}';

LITERAL
    : ~('a'..'z' | 'A'..'Z' | '#' | '{' | '}' | '[' | ']' | '\'')
    ;

NOT_SINGLE_QUOTE: ~('\'');

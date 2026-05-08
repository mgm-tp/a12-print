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
import { ParserRuleContext } from "antlr4";

import DateTimeFormatListener from "@com.mgmtp.a12.print/print-model-api/lib/generated/internal/antlr/datetimeformat/DateTimeFormatListener.js";
import {
	AmPmOfDayContext,
	ClockHourOfAmPmContext,
	ClockHourOfDayContext,
	DayOfMonthContext,
	DayOfWeekContext,
	DayOfWeekInMonthContext,
	DayOfWeekLocalizedContext,
	DayOfWeekLocalizedStandaloneContext,
	DayOfYearContext,
	EraContext,
	FractionOfSecondContext,
	HourOfAmPmContext,
	HourOfDayContext,
	MilliOfDayContext,
	MinuteOfHourContext,
	MonthOfYearContext,
	MonthOfYearStandaloneContext,
	NanoOfDayContext,
	NanoOfSecondContext,
	QuarterOfYearContext,
	QuarterOfYearStandaloneContext,
	SecondOfMinuteContext,
	TimeZoneIdContext,
	TimeZoneNameContext,
	WeekBasedYearContext,
	WeekOfMonthContext,
	WeekOfWeekBasedYearContext,
	YearContext,
	YearOfEraContext,
	ZoneOffsetLocalizedContext,
	ZoneOffsetXContext,
	ZoneOffsetZContext,
	ZoneOffsetZForZeroContext,
} from "@com.mgmtp.a12.print/print-model-api/lib/generated/internal/antlr/datetimeformat/DateTimeFormatParser.js";

import { DateTimeFormatValidationError } from "./date-time-format-validation-error.js";
import { DateTimeFormatErrorEnum } from "./date-time-format-error-enum.js";
import { MaxRepetition, UNLIMITED_REPETITION } from "./max-repetition.js";

export class DateTimeFormatRepetitionListener extends DateTimeFormatListener {
	private _errors: DateTimeFormatValidationError[] = [];

	get errors(): DateTimeFormatValidationError[] {
		return this._errors;
	}

	getError(): DateTimeFormatValidationError | undefined {
		if (this.errors.length > 0) {
			return this.errors[0];
		}
		return undefined;
	}

	enterEra = (ctx: EraContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.ERA);
	};

	enterYear = (ctx: YearContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.YEAR);
	};

	enterYearOfEra = (ctx: YearOfEraContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.YEAR_OF_ERA);
	};

	enterDayOfYear = (ctx: DayOfYearContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.DAY_OF_YEAR);
	};

	enterMonthOfYear = (ctx: MonthOfYearContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.MONTH_OF_YEAR);
	};

	enterMonthOfYearStandalone = (ctx: MonthOfYearStandaloneContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.MONTH_OF_YEAR_STANDALONE);
	};

	enterDayOfMonth = (ctx: DayOfMonthContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.DAY_OF_MONTH);
	};

	enterQuarterOfYear = (ctx: QuarterOfYearContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.QUARTER_OF_YEAR);
	};

	enterQuarterOfYearStandalone = (ctx: QuarterOfYearStandaloneContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.QUARTER_OF_YEAR_STANDALONE);
	};

	enterWeekBasedYear = (ctx: WeekBasedYearContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.WEEK_BASED_YEAR);
	};

	enterWeekOfWeekBasedYear = (ctx: WeekOfWeekBasedYearContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.WEEK_OF_WEEK_BASED_YEAR);
	};

	enterWeekOfMonth = (ctx: WeekOfMonthContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.WEEK_OF_MONTH);
	};

	enterDayOfWeek = (ctx: DayOfWeekContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.DAY_OF_WEEK);
	};

	enterDayOfWeekLocalized = (ctx: DayOfWeekLocalizedContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.DAY_OF_WEEK_LOCALIZED);
	};

	enterDayOfWeekLocalizedStandalone = (ctx: DayOfWeekLocalizedStandaloneContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.DAY_OF_WEEK_LOCALIZED_STANDALONE);
	};

	enterDayOfWeekInMonth = (ctx: DayOfWeekInMonthContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.DAY_OF_WEEK_IN_MONTH);
	};

	enterAmPmOfDay = (ctx: AmPmOfDayContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.AM_PM_OF_DAY);
	};

	enterClockHourOfAmPm = (ctx: ClockHourOfAmPmContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.CLOCK_HOUR_OF_AM_PM);
	};

	enterHourOfAmPm = (ctx: HourOfAmPmContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.HOUR_OF_AM_PM);
	};

	enterClockHourOfDay = (ctx: ClockHourOfDayContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.CLOCK_HOUR_OF_DAY);
	};

	enterHourOfDay = (ctx: HourOfDayContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.HOUR_OF_DAY);
	};

	enterMinuteOfHour = (ctx: MinuteOfHourContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.MINUTE_OF_HOUR);
	};

	enterSecondOfMinute = (ctx: SecondOfMinuteContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.SECOND_OF_MINUTE);
	};

	enterFractionOfSecond = (ctx: FractionOfSecondContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.FRACTION_OF_SECOND);
	};

	enterMilliOfDay = (ctx: MilliOfDayContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.MILLI_OF_DAY);
	};

	enterNanoOfSecond = (ctx: NanoOfSecondContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.NANO_OF_SECOND);
	};

	enterNanoOfDay = (ctx: NanoOfDayContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.NANO_OF_DAY);
	};

	enterTimeZoneId = (ctx: TimeZoneIdContext): void => {
		if (this.countCharacters(ctx) === 1) {
			this.addError(ctx, DateTimeFormatErrorEnum.CHARACTER_REPETITION_INVALID);
			return;
		}
		this.validateMaxRepetition(ctx, MaxRepetition.TIME_ZONE_ID);
	};

	enterTimeZoneName = (ctx: TimeZoneNameContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.TIME_ZONE_NAME);
	};

	enterZoneOffsetLocalized = (ctx: ZoneOffsetLocalizedContext): void => {
		if (this.countCharacters(ctx) === 2 || this.countCharacters(ctx) === 3) {
			this.addError(ctx, DateTimeFormatErrorEnum.CHARACTER_REPETITION_INVALID);
			return;
		}
		this.validateMaxRepetition(ctx, MaxRepetition.ZONE_OFFSET_LOCALIZED);
	};

	enterZoneOffsetZForZero = (ctx: ZoneOffsetZForZeroContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.ZONE_OFFSET_Z_FOR_ZERO);
	};

	enterZoneOffsetX = (ctx: ZoneOffsetXContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.ZONE_OFFSET_X);
	};

	enterZoneOffsetZ = (ctx: ZoneOffsetZContext): void => {
		this.validateMaxRepetition(ctx, MaxRepetition.ZONE_OFFSET_Z);
	};

	private exceedsMaxRepetition(ctx: ParserRuleContext, maxRepetition: number): boolean {
		if (maxRepetition === UNLIMITED_REPETITION) {
			return false;
		}
		return ctx.children !== null && ctx.children.length > maxRepetition;
	}

	private addMaxRepetitionError(ctx: ParserRuleContext, maxRepetition: number): void {
		this.errors.push({
			code: DateTimeFormatErrorEnum.CHARACTER_MAX_REPETITION_EXCEEDED,
			position: ctx.start.tokenIndex + maxRepetition,
		});
	}

	private addError(ctx: ParserRuleContext, errorCode: DateTimeFormatErrorEnum) {
		this.errors.push({
			code: errorCode,
			position: ctx.start.tokenIndex,
		});
	}

	private validateMaxRepetition(ctx: ParserRuleContext, maxRepetition: number): void {
		if (this.exceedsMaxRepetition(ctx, maxRepetition)) {
			this.addMaxRepetitionError(ctx, maxRepetition);
		}
	}

	private countCharacters(ctx: ParserRuleContext): number {
		if (!ctx.children) {
			return 0;
		}
		return ctx.children.length;
	}
}

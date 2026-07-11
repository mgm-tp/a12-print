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
import type {
	ICustomFieldTypeConversionResult,
	ICustomFieldTypeValidationParam,
	ICustomFieldTypeCheckError,
	ICustomFieldValidator,
} from "@com.mgmtp.a12.kernel/kernel-core-runtime-api-ts";
import type { LocalizableArgs } from "@com.mgmtp.a12.utils/utils-localization";

import type { DateTimeFormatValidationError } from "../date-time-format-validation/index.js";
import { DateTimeFormatErrorEnum, DateTimeFormatValidator } from "../date-time-format-validation/index.js";

import { PrintDateTimeFormatErrorEnum } from "./error/error-enum.js";
import { PrintDateTimeFormatErrorUtil } from "./error/error-util.js";
import { PrintDateTimeFormatConversionResultImpl } from "./convention-result-impl.js";

export class PrintDateTimeFormatFt implements ICustomFieldValidator {
	static readonly NAME = "PrintDateTimeFormat";
	private static readonly instance: PrintDateTimeFormatFt = new PrintDateTimeFormatFt();
	private readonly validator: DateTimeFormatValidator = new DateTimeFormatValidator();

	public static getInstance(): PrintDateTimeFormatFt {
		return PrintDateTimeFormatFt.instance;
	}

	// Unused args are retained to align with interface ICustomFieldType method signatures.
	validate(
		format: string,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		valParam: ICustomFieldTypeValidationParam,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		isDisplayValue: boolean
	): ICustomFieldTypeCheckError | undefined {
		const error = this.validator.getValidationError(format);
		if (error) {
			const printErrorCode = this.getPrintError(error);
			const invalidChar = format.charAt(error.position);
			const args: LocalizableArgs = {
				characters: PrintDateTimeFormatErrorUtil.createPlainPlaceholder(invalidChar.toString()),
			};
			switch (printErrorCode) {
				case PrintDateTimeFormatErrorEnum.RESERVED_CHARACTER_USED:
				case PrintDateTimeFormatErrorEnum.CHARACTER_REPETITION_INVALID:
				case PrintDateTimeFormatErrorEnum.CHARACTER_MAX_REPETITION_EXCEEDED:
				case PrintDateTimeFormatErrorEnum.PATTERN_CHARACTER_INVALID:
					return PrintDateTimeFormatErrorUtil.getResult(
						printErrorCode,
						PrintDateTimeFormatErrorEnum.DATE_INVALID,
						args
					);
				default:
					return PrintDateTimeFormatErrorUtil.getResult(
						printErrorCode,
						PrintDateTimeFormatErrorEnum.DATE_INVALID
					);
			}
		}

		return PrintDateTimeFormatErrorUtil.getResult(
			PrintDateTimeFormatErrorEnum.NO_MISTAKE,
			PrintDateTimeFormatErrorEnum.NO_MISTAKE
		);
	}

	private getPrintError(error: DateTimeFormatValidationError): PrintDateTimeFormatErrorEnum {
		switch (error.code) {
			case DateTimeFormatErrorEnum.PATTERN_CHARACTER_INVALID:
				return PrintDateTimeFormatErrorEnum.PATTERN_CHARACTER_INVALID;
			case DateTimeFormatErrorEnum.CHARACTER_MAX_REPETITION_EXCEEDED:
				return PrintDateTimeFormatErrorEnum.CHARACTER_MAX_REPETITION_EXCEEDED;
			case DateTimeFormatErrorEnum.RESERVED_CHARACTER_USED:
				return PrintDateTimeFormatErrorEnum.RESERVED_CHARACTER_USED;
			case DateTimeFormatErrorEnum.UNTERMINATED_QUOTE:
				return PrintDateTimeFormatErrorEnum.UNTERMINATED_QUOTE;
			case DateTimeFormatErrorEnum.OPTIONAL_SECTION_CLOSED_UNOPENED:
				return PrintDateTimeFormatErrorEnum.OPTIONAL_SECTION_CLOSED_UNOPENED;
			case DateTimeFormatErrorEnum.CHARACTER_REPETITION_INVALID:
				return PrintDateTimeFormatErrorEnum.CHARACTER_REPETITION_INVALID;
			default:
				throw Error("Unmatched error code");
		}
	}

	convertDisplay2Internal(displayValue: string): ICustomFieldTypeConversionResult {
		return new PrintDateTimeFormatConversionResultImpl(displayValue, "error");
	}

	convertInternal2Display(internalValue: string): ICustomFieldTypeConversionResult {
		return new PrintDateTimeFormatConversionResultImpl(internalValue, "error");
	}
}

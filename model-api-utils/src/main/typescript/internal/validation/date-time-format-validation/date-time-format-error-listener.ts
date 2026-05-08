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
import { ErrorListener, Recognizer, Token } from "antlr4";

import { DateTimeFormatErrorEnum } from "./date-time-format-error-enum.js";
import { DateTimeFormatValidationError } from "./date-time-format-validation-error.js";

export class DateTimeFormatErrorListener extends ErrorListener<Token> {
	private error?: DateTimeFormatValidationError;

	constructor() {
		super();
	}

	syntaxError(
		recognizer: Recognizer<Token>,
		offendingSymbol: Token | null,
		line: number,
		column: number,
		msg: string
	): void {
		this.error = {
			position: column,
			code: this.translateError(msg, offendingSymbol?.text),
		};
	}

	private translateError(message: string, symbol: string | undefined): DateTimeFormatErrorEnum {
		switch (symbol) {
			case "#":
			case "{":
			case "}":
				return DateTimeFormatErrorEnum.RESERVED_CHARACTER_USED;
			case "]":
				return DateTimeFormatErrorEnum.OPTIONAL_SECTION_CLOSED_UNOPENED;
		}
		if (message.includes("mismatched input")) {
			const match = /mismatched input (.*?) /.exec(message);
			if (!match) {
				throw Error("Could not get matched symbol");
			}
			switch (match[1]) {
				case "'''":
					return DateTimeFormatErrorEnum.UNTERMINATED_QUOTE;
				default:
					return DateTimeFormatErrorEnum.PATTERN_CHARACTER_INVALID;
			}
		}
		if (message.includes("extraneous input")) {
			const match = /extraneous input (.*?) /.exec(message);
			if (!match) {
				throw Error("Could not get matched symbol");
			}
			switch (match[1]) {
				case "'''":
					return DateTimeFormatErrorEnum.UNTERMINATED_QUOTE;
				default:
					return DateTimeFormatErrorEnum.PATTERN_CHARACTER_INVALID;
			}
		}
		throw Error("Unhandled error: " + message);
	}

	getError(): DateTimeFormatValidationError | undefined {
		return this.error;
	}
}

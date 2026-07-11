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
	TransactionLogEntryObjectId,
	TransactionLogEntryValue,
} from "../../../a12internal/transaction-log/transaction-log.js";

import { StringEscapeUtils } from "./string-escape-utils.js";

export enum LogValueType {
	STRING = "string",
	NUMBER = "number",
	BOOLEAN = "boolean",
}

export namespace LogValueType {
	export function detectValueType(
		value?: TransactionLogEntryObjectId | TransactionLogEntryValue
	): LogValueType | undefined {
		if (value !== undefined && value !== null) {
			if (typeof value === "string") {
				return LogValueType.STRING;
			} else if (typeof value === "boolean") {
				return LogValueType.BOOLEAN;
			} else if (typeof value === "number") {
				return LogValueType.NUMBER;
			} else {
				throw new Error(`Expected string, boolean or number, got ${value}.`);
			}
		}

		return undefined;
	}

	export function escapeValue(
		value?: TransactionLogEntryObjectId | TransactionLogEntryValue,
		logValueType?: LogValueType
	): string | undefined {
		if (logValueType) {
			if (value === null || value === undefined) {
				throw new Error("If the value type is set the value needs to be set too");
			}

			if (logValueType === LogValueType.STRING) {
				if (typeof value === "string") {
					return StringEscapeUtils.escape(value);
				} else {
					throw new Error("The type is string but the value is of a different type");
				}
			} else {
				return value.toString();
			}
		}

		return undefined;
	}

	export function getValueWithTypeString(
		valueTypeString?: string,
		valueString?: string
	): TransactionLogEntryObjectId | TransactionLogEntryValue | null {
		if (!valueTypeString) {
			if (valueString) {
				throw new Error(
					`Expect the value to be undefined if the value type is not set, but the value is ${valueString}`
				);
			}
			return null;
		}

		if (
			valueTypeString === LogValueType.STRING ||
			valueTypeString === LogValueType.BOOLEAN ||
			valueTypeString === LogValueType.NUMBER
		) {
			// The string type allows an undefined value since empty strings are serialized and deserialized as undefined
			if (valueTypeString === LogValueType.STRING) {
				return valueString ? StringEscapeUtils.unescape(valueString) : null;
			}

			if (valueString === undefined) {
				throw new Error("When the value type is boolean or number, a value string is expected");
			}

			if (valueTypeString === LogValueType.BOOLEAN) {
				return valueString.toLocaleLowerCase() === "true";
			}
			if (valueTypeString === LogValueType.NUMBER) {
				return Number(valueString);
			}
		}

		throw new Error(`Expected string, boolean or number, got ${valueTypeString}.`);
	}
}

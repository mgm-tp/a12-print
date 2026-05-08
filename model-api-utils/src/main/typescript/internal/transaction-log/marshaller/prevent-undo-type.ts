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
import { PreventUndo, USED_TEXT_STYLE } from "../../transaction-log/index.js";

export enum PreventUndoType {
	STRING = "string",
	BOOLEAN = "boolean",
}

export namespace PreventUndoType {
	export function detectValueType(preventUndo?: PreventUndo): PreventUndoType | undefined {
		if (preventUndo) {
			if (preventUndo === USED_TEXT_STYLE) {
				return PreventUndoType.STRING;
			} else if (typeof preventUndo === "boolean") {
				return PreventUndoType.BOOLEAN;
			} else {
				throw new Error(`Expected string or boolean, got ${preventUndo}.`);
			}
		}

		return undefined;
	}

	export function getValueWithTypeString(valueTypeString?: string, valueString?: string): PreventUndo | undefined {
		if (!valueTypeString) {
			if (valueString) {
				throw new Error(
					`Expect the value to be undefined if the value type is not set, but the value is ${valueString}`
				);
			}
			return undefined;
		}

		if (valueTypeString === PreventUndoType.STRING || valueTypeString === PreventUndoType.BOOLEAN) {
			if (valueString === undefined) {
				throw new Error("When the value type is set, a value string is expected");
			}
			if (valueTypeString === PreventUndoType.BOOLEAN) {
				return valueString.toLocaleLowerCase() === "true";
			}
			if (valueTypeString === PreventUndoType.STRING) {
				if (valueString === USED_TEXT_STYLE) {
					return valueString;
				} else {
					throw new Error(
						`When the value type is string, the value needs to be 'USED_TEXT_STYLE' and not ${valueString}`
					);
				}
			}
		}

		throw new Error(`Expected string or boolean, got ${valueTypeString}.`);
	}
}

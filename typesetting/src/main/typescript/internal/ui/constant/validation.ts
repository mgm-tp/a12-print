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
import type { PrintError } from "@com.mgmtp.a12.print/print-model-api/errors";
import { ErrorOrigin } from "@com.mgmtp.a12.print/print-model-api/errors";

export const VALIDATOR_VALUE = {
	maxLength: 20,
};
export const noMatchError: PrintError = {
	errorCode: "noMatchRule",
	errorMessage: [
		{
			key: "rule.noMatch.error",
			args: {},
			defaults: {
				en: "The rule does not match the rule type pattern",
				de: "Die Regel entspricht nicht dem Regeltyp-Muster",
			},
		},
	],
	jsonPath: [],
	severity: "ERROR",
	origin: ErrorOrigin.VALIDATOR,
};

export const requiredRuleError: PrintError = {
	errorCode: "requiredRuleError",
	errorMessage: [
		{
			key: "rule.required.error",
			args: {},
			defaults: {
				en: "The rule has to be specified.",
				de: "Die Regel muss angegeben werden.",
			},
		},
	],
	jsonPath: [],
	severity: "ERROR",
	origin: ErrorOrigin.VALIDATOR,
};

export const characterRuleError: PrintError = {
	errorCode: "characterSequence",
	errorMessage: [
		{
			key: "rule.characterSequence.error",
			args: {},
			defaults: {
				en: "The rule may only contain letters (a-z, A-Z) and hyphens (-).",
				de: "Die Regel darf nur Buchstaben (a-z, A-Z) und Bindestriche (-) enthalten.",
			},
		},
	],
	jsonPath: [],
	severity: "ERROR",
	origin: ErrorOrigin.VALIDATOR,
};

export const numberUnitRuleError: PrintError = {
	errorCode: "numberUnitRule",
	errorMessage: [
		{
			key: "rule.numberUnit.error",
			args: {},
			defaults: {
				en: `Only letters and unit symbols (e.g. % $) are allowed. Numbers, spaces, and other special characters are not permitted.`,
				de: `Nur Buchstaben und Einheitensymbole (z.B. % $) sind erlaubt. Zahlen, Leerzeichen und andere Sonderzeichen sind nicht erlaubt.`,
			},
		},
	],
	jsonPath: [],
	severity: "ERROR",
	origin: ErrorOrigin.VALIDATOR,
};

export const maxLengthRuleError: PrintError = {
	errorCode: "maxLengthRule",
	errorMessage: [
		{
			key: "rule.maxLength",
			args: {},
			defaults: {
				en: "The rule must be less than 20 characters long.",
				de: "Die Regel darf maximal 20 Zeichen lang sein.",
			},
		},
	],
	jsonPath: [],
	severity: "ERROR",
	origin: ErrorOrigin.VALIDATOR,
};

export const duplicatedRuleError: PrintError = {
	errorCode: "duplicatedRuleError",
	errorMessage: [
		{
			key: "rule.duplicated",
			args: {},
			defaults: {
				en: "The rule must be unique.",
				de: "Die Regel muss eindeutig sein.",
			},
		},
	],
	jsonPath: [],
	severity: "ERROR",
	origin: ErrorOrigin.VALIDATOR,
};

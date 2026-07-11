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
export interface PrintMessageReport<T> {
	result?: T;
	messages: PrintMessage[];
}

export interface PrintMessage {
	description: string;
	severity: PrintMessageSeverity;
}

export enum PrintMessageSeverity {
	WARNING = "WARNING",
	ERROR = "ERROR",
}

export interface PrintErrorMessage extends PrintMessage {
	severity: PrintMessageSeverity.ERROR;
	stackTrace?: string;
}

export interface PrintWarningMessage extends PrintMessage {
	severity: PrintMessageSeverity.WARNING;
}

export function isPrintMessage(value: unknown): value is PrintMessage {
	return (
		typeof value === "object" &&
		value !== null &&
		"description" in value &&
		typeof (value as PrintMessage).description === "string" &&
		"severity" in value &&
		Object.values(PrintMessageSeverity).includes((value as PrintMessage).severity)
	);
}

export function isPrintErrorMessage(value: unknown): value is PrintErrorMessage {
	return (
		isPrintMessage(value) &&
		value.severity === PrintMessageSeverity.ERROR &&
		(!("stackTrace" in value) || typeof (value as PrintErrorMessage).stackTrace === "string")
	);
}

export function isPrintWarningMessage(value: unknown): value is PrintWarningMessage {
	return isPrintMessage(value) && value.severity === PrintMessageSeverity.WARNING;
}

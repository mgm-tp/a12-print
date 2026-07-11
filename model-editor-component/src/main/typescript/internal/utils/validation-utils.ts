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
import get from "lodash/get.js";
import { useSelector } from "react-redux";

import type { DeepPartialErrorMap, PrintError } from "@com.mgmtp.a12.print/print-model-api/errors";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";
import type { BorderProperties, TextProperties } from "@com.mgmtp.a12.print/print-model-api/model";

import type { PrintEngineState } from "../../a12internal/api/PrintEngineState.js";

import { ValidationSelectors } from "../redux/validation/selectors.js";
import type { PrintModelErrorMap } from "../types/index.js";
import { PrintLocalizer } from "../localization/index.js";

export function joinErrorPath(path: string = "", severity: ErrorSeverity = ErrorSeverity.ERROR) {
	return path ? `${path}.${severity}` : severity;
}

export function getErrors(
	errorMap?: PrintModelErrorMap,
	path = ""
): { errors: PrintError[]; warnings: PrintError[]; info: PrintError[] } {
	const errors = get(errorMap, joinErrorPath(path, ErrorSeverity.ERROR));
	const warnings = get(errorMap, joinErrorPath(path, ErrorSeverity.WARNING));
	const info = get(errorMap, joinErrorPath(path, ErrorSeverity.INFO));
	return { errors, warnings, info };
}

export function useTextPropertiesErrorMessage<T extends keyof Omit<TextProperties, "id" | "type">>(id: string = "") {
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.styleableElement(state, id));

	return (property: T) =>
		error ? errorMessageLocalizer(error.textProperties?.[property]?.[ErrorSeverity.ERROR]) : undefined;
}

export function useBorderPropertiesErrorMessage<T extends keyof Omit<BorderProperties, "id" | "type">>(
	id: string = ""
) {
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.styleableElement(state, id));

	return (property: T) =>
		error ? errorMessageLocalizer(error.borderProperties?.[property]?.[ErrorSeverity.ERROR]) : undefined;
}

export function collectAggregatedMessages<T>(errorMapArray: DeepPartialErrorMap<T>[] | undefined): {
	errors: PrintError[];
	warnings: PrintError[];
	info: PrintError[];
} {
	const result = { errors: [] as PrintError[], warnings: [] as PrintError[], info: [] as PrintError[] };

	if (!errorMapArray || !Array.isArray(errorMapArray)) {
		return result;
	}

	for (const item of errorMapArray) {
		if (item[ErrorSeverity.ERROR]?.length) {
			result.errors.push(...item[ErrorSeverity.ERROR]);
		}
		if (item[ErrorSeverity.WARNING]?.length) {
			result.warnings.push(...item[ErrorSeverity.WARNING]);
		}
		if (item[ErrorSeverity.INFO]?.length) {
			result.info.push(...item[ErrorSeverity.INFO]);
		}
	}

	return result;
}

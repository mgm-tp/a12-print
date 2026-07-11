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
import type { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/errors";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";

export type InteractionType = "descriptive" | "compact";
export type ValidationSeverity = "error" | "warning";

export type ValidationCounter = Record<ValidationSeverity, number>;

export namespace ValidationCounter {
	export const EMPTY_VALIDATION_COUNTER: ValidationCounter = {
		error: 0,
		warning: 0,
	};

	export const add = (counter: ValidationCounter, targetCounter: ValidationCounter): ValidationCounter => {
		return {
			error: counter.error + targetCounter.error,
			warning: counter.warning + targetCounter.warning,
		};
	};

	export const defaultCounterGetter = (error: DeepPartialErrorMap<unknown>): ValidationCounter => {
		return {
			error: error[ErrorSeverity.ERROR].length,
			warning: error[ErrorSeverity.WARNING].length,
		};
	};

	export const from = (
		errorMap?: DeepPartialErrorMap<unknown> | DeepPartialErrorMap<unknown>[],
		counterGetter: (error: DeepPartialErrorMap<unknown>) => ValidationCounter = defaultCounterGetter
	): ValidationCounter => {
		if (!errorMap) {
			return EMPTY_VALIDATION_COUNTER;
		}

		return Array.isArray(errorMap)
			? errorMap.reduce((result, currentErrorMap) => add(result, from(currentErrorMap)), EMPTY_VALIDATION_COUNTER)
			: counterGetter(errorMap);
	};
}

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
import { actionCreatorFactory } from "typescript-fsa";

import { AffectedItem } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/interaction-log.js";

import { PrintModelErrorMap } from "../../types/index.js";

const factory = actionCreatorFactory("Print/Validation");

export namespace ValidationActions {
	export const toggleInteractionType = factory<"error" | "warning">("TOGGLE_INTERACTION_TYPE");

	export const setErrorMap = factory<PrintModelErrorMap>("SET_ERROR_MAP");

	export const appendErrors = factory<{ errorMap: PrintModelErrorMap }>("APPEND_ERRORS");

	export const mergeErrors = factory<{ errorMap: PrintModelErrorMap }>("MERGE_ERRORS");

	export const removeErrors = factory<{ affectedItems: AffectedItem[] }>("REMOVE_ERRORS");

	export const validateTextStyles = factory<void>("VALIDATE_TEXT_STYLES");
}

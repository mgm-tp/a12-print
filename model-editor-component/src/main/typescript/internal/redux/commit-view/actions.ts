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

import { PrintModel } from "@com.mgmtp.a12.print/print-model-api/lib/model/print-model.js";
import { LogPersistentEntry } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/log.js";

import { PrintModelErrorMap, CommitInteractionRow } from "../../types/index.js";
import { NavigationTarget } from "../../types/error-tree.js";

const factory = actionCreatorFactory("Print/CommitView");

export namespace CommitViewActions {
	export const setCommitViewErrorMap = factory<PrintModelErrorMap>("SET_COMMIT_VIEW_ERROR_MAP");
	export const setLoadingPrintModelResponse = factory<{
		printModel: PrintModel;
		logPersistentEntries?: LogPersistentEntry[];
	}>("SET_LOADING_PRINT_MODEL_RESPONSE");
	export const setCommitInteractionRows = factory<CommitInteractionRow[]>("SET_COMMIT_INTERACTION_ROWS");
	export const initialCommitView = factory("INITIAL_COMMIT_VIEW");
	export const validateChanges = factory("VALIDATE_CHANGES");
	export const commitChanges = factory<CommitInteractionRow[]>("COMMIT_CHANGES");
	export const discardChanges = factory<void>("DISCARD_CHANGES");
	export const navigateIntoView = factory<NavigationTarget>("NAVIGATE_INTO_VIEW");
}

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
import type { Selector } from "reselect";
import { createSelector } from "reselect";

import type { InteractionLogEntry, TransactionLogEntry } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { TransactionLog } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";
import type { TransactionLogGroup } from "../../../store/selectors.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { interactionGraph } from "../../../constant/interaction-graph.js";

/**
 * Improved version of {@link PrintEngineSelectors.transactionGroupsForCommit}.
 */
export const selectTransactionGroupsForCommit: Selector<PrintEngineState, TransactionLogGroup[], never> =
	createSelector(
		[PrintEngineSelectors.allInteractions, PrintEngineSelectors.transactionLogState, selectInteractionsToFilter],
		(allInteractions, transactionLogState, interactionsToFilter): TransactionLogGroup[] => {
			function getTransactions(interaction: InteractionLogEntry): TransactionLogEntry[] {
				return TransactionLog.getTransactionLogEntriesByInteraction(interaction, transactionLogState);
			}

			return allInteractions
				.filter(it => it.type === "SET")
				.filter(it => !interactionsToFilter.has(it.interactionId))
				.sort((a, b) => b.timestamp - a.timestamp)
				.map(interaction => ({
					interaction,
					transactions: getTransactions(interaction),
				}));
		}
	);

/**
 * IMPORTANT: This selector is not allowed to be memorized due to non-trackable
 * changes in interactionGraph. Therefore, the selector is manually memorized.
 */
function selectInteractionsToFilter(state: PrintEngineState): Set<string> {
	const filteredUndoByRedo: string[] = [];

	for (const interaction of PrintEngineSelectors.allInteractions(state)) {
		if (interaction.type === "UNDO") {
			filteredUndoByRedo.push(interaction.interactionId);
		} else if (interaction.type === "REDO") {
			const id = interaction.affectedItems[0].id;
			const index = filteredUndoByRedo.findIndex(interactionId => interactionId === id);
			if (index >= 0) {
				filteredUndoByRedo.splice(index, 1);
			}
		}
	}

	const result = new Set<string>();

	for (const interactionId of filteredUndoByRedo) {
		interactionGraph.getUndoDependencies(interactionId).forEach(it => result.add(it));
	}

	if (result.size !== interactionsToFilterCache.size || [...result].some(x => !interactionsToFilterCache.has(x))) {
		interactionsToFilterCache = result;
	}

	return interactionsToFilterCache;
}

let interactionsToFilterCache: Set<string> = new Set();

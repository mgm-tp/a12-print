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
import type { InteractionGraph, InteractionLogEntry, InteractionLogStore } from "../transaction-log/index.js";

export function getAllInteractionsFromLogStore(interactionState: InteractionLogStore) {
	return Object.values(interactionState).reduce<InteractionLogEntry[]>((res, regionMap) => {
		res.push(...Object.values(regionMap).flat());
		return res;
	}, []);
}

export function filterVisibleSetInteractions(
	allInteractions: InteractionLogEntry[],
	interactionGraph: InteractionGraph
) {
	const filteredSetInteractions: InteractionLogEntry[] = [];
	const filteredUndoByRedo: InteractionLogEntry[] = [];
	allInteractions.forEach(el => {
		if (el.type === "SET") {
			filteredSetInteractions.push(el);
		} else if (el.type === "UNDO") {
			filteredUndoByRedo.push(el);
		} else if (el.type === "REDO") {
			const index = filteredUndoByRedo.findIndex(undo => undo.interactionId === el.affectedItems[0].id);
			if (index !== -1) {
				filteredUndoByRedo.splice(index, 1);
			}
		}
	});

	const interactionsToFilter = filteredUndoByRedo.reduce<Set<string>>((res, next) => {
		for (const item of interactionGraph.getUndoDependencies(next.interactionId)) {
			res.add(item);
		}
		return res;
	}, new Set<string>());

	return filteredSetInteractions.filter(el => !interactionsToFilter.has(el.interactionId));
}

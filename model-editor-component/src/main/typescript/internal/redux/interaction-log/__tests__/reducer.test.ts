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
import type { InteractionLogEntry, InteractionLogStore } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import {
	createNewInteractionLogStore,
	GlobalRegion,
	SidebarItem,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { InteractionLogActions } from "../actions.js";
import { InteractionLogReducer } from "../reducer.js";

function logEntry(interactionId: string, overrides: Partial<InteractionLogEntry> = {}): InteractionLogEntry {
	return {
		interactionId,
		timestamp: 0,
		affectedItems: [],
		type: "SET",
		...overrides,
	};
}

function stateWithEntries(
	base: InteractionLogStore,
	region: GlobalRegion.RegionKeys | SidebarItem,
	regionId: string,
	entries: InteractionLogEntry[]
): InteractionLogStore {
	return {
		...base,
		[region]: {
			...base[region as keyof InteractionLogStore],
			[regionId]: entries,
		},
	};
}

describe("InteractionLogReducer - markPreventUndo", () => {
	test("sets preventUndo=true on every entry matching one of the given interactionIds, regardless of region", () => {
		let state = createNewInteractionLogStore();
		state = stateWithEntries(state, SidebarItem.SECTION, SidebarItem.SECTION, [
			logEntry("interaction-1"),
			logEntry("interaction-2"),
		]);
		state = stateWithEntries(state, GlobalRegion.STAGE, "container-1", [logEntry("interaction-2")]);

		const result = InteractionLogReducer(
			state,
			InteractionLogActions.markPreventUndo({ interactionIds: ["interaction-2"] })
		);

		expect(result[SidebarItem.SECTION][SidebarItem.SECTION]).toEqual([
			logEntry("interaction-1"),
			logEntry("interaction-2", { preventUndo: true }),
		]);
		expect(result[GlobalRegion.STAGE]["container-1"]).toEqual([logEntry("interaction-2", { preventUndo: true })]);
	});

	test("leaves non-matching entries untouched", () => {
		let state = createNewInteractionLogStore();
		state = stateWithEntries(state, SidebarItem.SECTION, SidebarItem.SECTION, [logEntry("interaction-1")]);

		const result = InteractionLogReducer(
			state,
			InteractionLogActions.markPreventUndo({ interactionIds: ["some-other-interaction"] })
		);

		expect(result[SidebarItem.SECTION][SidebarItem.SECTION]).toEqual([logEntry("interaction-1")]);
	});

	test("returns the same state reference when interactionIds is empty", () => {
		const state = createNewInteractionLogStore();

		const result = InteractionLogReducer(state, InteractionLogActions.markPreventUndo({ interactionIds: [] }));

		expect(result).toBe(state);
	});
});

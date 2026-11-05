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
import { SidebarItem, type TransactionLogStore } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import {
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	PRINT_MODEL_HEADER_LOG_ID,
	SegmentType,
	type PartialPrintModelContent,
} from "@com.mgmtp.a12.print/print-model-api/model";

import { TransactionLogStateActions } from "../../../../redux/index.js";
import type { ValidAnyTransactionLogAction } from "../../../../redux/transaction-log-state/actions.js";

import { RedoUndoTransactionLogHandler } from "../redo-undo-handler.js";

const FRAGMENT_MODEL_ID = "fragment-model-1";
const SEGMENT_REF_ID = "segment-ref-1";
const FRAG_SEGMENT_ID = "frag-segment-1";

function makeSegmentReference() {
	return { id: SEGMENT_REF_ID, model: FRAGMENT_MODEL_ID, refId: FRAG_SEGMENT_ID };
}

function makeFragmentContent(): PartialPrintModelContent {
	return {
		id: "fragment-content",
		segments: {
			id: "fragment-segments",
			definitions: [
				{
					id: FRAG_SEGMENT_ID,
					title: "FragmentSegment",
					type: SegmentType.Default,
					elementReferences: [{ id: "el-ref-a", refId: "el-a" }],
				},
			],
		},
	} as unknown as PartialPrintModelContent;
}

/**
 * A segment fragment reference that has never been locally edited: it exists purely as an entry
 * in `fragmentReferencesEntry`, with no `segments.map[id]` entry at all - exactly the state a
 * reference is in as soon as it's added and opened, before any local override is ever made.
 */
function makeState(): TransactionLogStore {
	return {
		[PRINT_MODEL_HEADER_LOG_ID]: {
			id: "header",
			log: [
				{
					interactionId: "header-edit-1",
					parentId: "header",
					propertyKey: "title",
					objectId: null,
					value: "old",
					command: "SET",
				},
			],
			memoizedObject: { id: "header", title: "new" },
		},
		[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: {
			id: "general",
			log: [],
			memoizedObject: { id: "general", structure: [SEGMENT_REF_ID] },
		},
		segments: {
			id: "segments-store",
			map: {},
			fragmentReferencesEntry: {
				id: "segments-fragment-references",
				log: [],
				memoizedObject: { id: "segments-fragment-references", references: [makeSegmentReference()] },
			},
		},
		printModelElements: {},
	} as unknown as TransactionLogStore;
}

/**
 * Drives `RedoUndoTransactionLogHandler.handle` for an `undo` action that is entirely unrelated to
 * the segment (it undoes a header edit), while the given segment fragment reference is the
 * currently open/active entity. `resolveUiAfterUndoRedo` runs after every undo/redo based on
 * whatever is currently active - not on what the undone interaction actually touched - so it must
 * cope with the active entity never having been locally materialized.
 */
function driveUndoOfUnrelatedInteraction(state: TransactionLogStore, printModelData: unknown) {
	const action = TransactionLogStateActions.undo({
		data: {
			interactionToUndo: {
				interactionId: "header-edit-1",
				timestamp: 0,
				type: "SET",
				affectedItems: [{ type: "printModelHeader", id: "header" }],
			},
		},
		interactionId: "undo-1",
	}) as ValidAnyTransactionLogAction;

	const gen = RedoUndoTransactionLogHandler.handle({ state, action, persistentEntries: [] });
	gen.next(); // select(NavigationSelectors.activeEntities)
	const resolveUiCall = gen.next({ currentRefType: SidebarItem.SEGMENT, segmentId: SEGMENT_REF_ID });

	const { fn, args } = (
		resolveUiCall.value as { payload: { fn: (...fnArgs: unknown[]) => Generator; args: unknown[] } }
	).payload;
	const innerGen = fn(...args);

	const removedRefsCall = innerGen.next();
	const { fn: removedFn, args: removedArgs } = (
		removedRefsCall.value as { payload: { fn: (...fnArgs: unknown[]) => Generator; args: unknown[] } }
	).payload;
	const removedResult = removedFn(...removedArgs).next(); // no yields for a still-present reference

	let step = innerGen.next(removedResult.value); // wrappers select
	for (const value of [[], undefined, undefined, undefined]) {
		step = innerGen.next(value);
	}
	step = innerGen.next(printModelData); // printModelData select (the fix's fallback lookup)

	return gen.next(step.value);
}

describe("RedoUndoTransactionLogHandler - undo while a never-materialized fragment reference is open", () => {
	test("does not crash resolving the UI for the currently open segment fragment reference", () => {
		const printModelData = { [FRAGMENT_MODEL_ID]: { content: makeFragmentContent() } };

		expect(() => driveUndoOfUnrelatedInteraction(makeState(), printModelData)).not.toThrow();
	});
});

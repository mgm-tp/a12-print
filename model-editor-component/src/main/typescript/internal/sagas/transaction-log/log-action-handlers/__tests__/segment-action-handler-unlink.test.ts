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
import {
	GlobalRegion,
	SidebarItem,
	type TransactionLogStore,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import {
	type PartialPrintModelContent,
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
} from "@com.mgmtp.a12.print/print-model-api/model";

import { TransactionLogStateActions } from "../../../../redux/index.js";
import type { ValidAnyTransactionLogAction } from "../../../../redux/transaction-log-state/actions.js";

import { SegmentTransactionLogHandler } from "../segment-action-handler.js";

const FRAGMENT_MODEL_ID = "fragment-model-1";
const SEGMENT_REFERENCE_ID = "segment-ref-1";
const FRAGMENT_SEGMENT_ID = "fragment-segment-1";
const BOUND_ELEMENT_ID = "fragment-expr-bound";
const DOCUMENT_MODEL_ID = "ExampleDM";

function makeFragmentContent(): PartialPrintModelContent {
	return {
		id: "fragment-content",
		elementDefinitions: [
			{
				id: BOUND_ELEMENT_ID,
				name: "BoundExpression",
				type: "Expression",
				expression: { id: "expr-1", model: DOCUMENT_MODEL_ID, basePath: "/", text: "1" },
			},
		],
		segments: {
			id: "fragment-segments",
			definitions: [
				{
					id: FRAGMENT_SEGMENT_ID,
					title: "FragmentSegment",
					type: "Default",
					elementReferences: [{ id: "el-ref-1", refId: BOUND_ELEMENT_ID }],
				},
			],
		},
		textStyles: { id: "fragment-text-styles", definitions: [] },
	} as unknown as PartialPrintModelContent;
}

function makeState(overrides: Partial<TransactionLogStore> = {}): TransactionLogStore {
	return {
		printModelHeader: { id: "header", log: [], memoizedObject: {} },
		[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: {
			id: "general",
			log: [],
			memoizedObject: { id: "general", structure: ["local-segment-a", SEGMENT_REFERENCE_ID, "local-segment-b"] },
		},
		printModelElements: {},
		segments: {
			id: "segments",
			map: {},
			references: {},
			fragmentReferencesEntry: {
				id: "segments-fragment-references",
				log: [],
				memoizedObject: {
					id: "segments-fragment-references",
					references: [{ id: SEGMENT_REFERENCE_ID, refId: FRAGMENT_SEGMENT_ID, model: FRAGMENT_MODEL_ID }],
				},
			},
		},
		...overrides,
	} as unknown as TransactionLogStore;
}

function makeAction(referenceId: string, fragmentContent: PartialPrintModelContent): ValidAnyTransactionLogAction {
	return TransactionLogStateActions.unlinkSegmentFragmentReference({
		data: { referenceId, fragmentContent },
		interactionId: "interaction-1",
		region: GlobalRegion.SIDEBAR,
		regionId: "sidebar",
	}) as ValidAnyTransactionLogAction;
}

describe("unlinkSegmentFragmentReference", () => {
	test("replaces the reference with a local segment, keeping its position in structure interleaved with local ids", () => {
		const state = makeState();
		const fragmentContent = makeFragmentContent();
		const action = makeAction(SEGMENT_REFERENCE_ID, fragmentContent);

		const gen = SegmentTransactionLogHandler.handle({ state, action, persistentEntries: [] });
		const putStep = gen.next();

		expect(putStep.done).toBe(false);
		expect(putStep.value).toMatchObject({ type: "PUT" });

		const newState = (putStep.value as { payload: { action: { payload: TransactionLogStore } } }).payload.action
			.payload;

		const segmentEntries = Object.values(newState.segments?.map ?? {});
		expect(segmentEntries).toHaveLength(1);
		const [newSegmentEntry] = segmentEntries;
		expect(newSegmentEntry.memoizedObject.id).not.toBe(FRAGMENT_SEGMENT_ID);

		expect(newState.segments?.fragmentReferencesEntry?.memoizedObject.references).toEqual([]);

		const newContentGeneral = (newState as unknown as Record<string, { memoizedObject: Record<string, unknown> }>)[
			PRINT_MODEL_CONTENT_GENERAL_LOG_ID
		];
		expect(newContentGeneral.memoizedObject.structure).toEqual([
			"local-segment-a",
			newSegmentEntry.id,
			"local-segment-b",
		]);

		const selectStep = gen.next();
		expect(selectStep.done).toBe(false);
		expect(selectStep.value).toMatchObject({ type: "SELECT" });

		const done = gen.next({ segmentId: "unrelated-id" });
		expect(done.done).toBe(true);
	});

	test("collects a document-model binding from a nested Expression element (verified by a successful, unblocked clone)", () => {
		const state = makeState();
		const fragmentContent = makeFragmentContent();
		const action = makeAction(SEGMENT_REFERENCE_ID, fragmentContent);

		const gen = SegmentTransactionLogHandler.handle({ state, action, persistentEntries: [] });
		const putStep = gen.next();
		const newState = (putStep.value as { payload: { action: { payload: TransactionLogStore } } }).payload.action
			.payload;
		const [newSegmentEntry] = Object.values(newState.segments?.map ?? {});

		expect(newSegmentEntry.memoizedObject.elementReferences).toHaveLength(1);
		expect(Object.keys(newState.printModelElements)).toHaveLength(1);
	});

	test("re-points the active entity to the new local id when the unlinked reference was selected", () => {
		const state = makeState();
		const fragmentContent = makeFragmentContent();
		const action = makeAction(SEGMENT_REFERENCE_ID, fragmentContent);

		const gen = SegmentTransactionLogHandler.handle({ state, action, persistentEntries: [] });
		const putStep = gen.next();
		const newState = (putStep.value as { payload: { action: { payload: TransactionLogStore } } }).payload.action
			.payload;
		const [newSegmentEntry] = Object.values(newState.segments?.map ?? {});

		const selectStep = gen.next();
		expect(selectStep.value).toMatchObject({ type: "SELECT" });

		const setActiveStep = gen.next({ segmentId: SEGMENT_REFERENCE_ID });
		expect(setActiveStep.done).toBe(false);
		expect(setActiveStep.value).toMatchObject({
			type: "PUT",
			payload: { action: { payload: { tab: SidebarItem.SEGMENT, entityId: newSegmentEntry.id } } },
		});

		const done = gen.next();
		expect(done.done).toBe(true);
	});

	test("aborts when the reference cannot be found", () => {
		const state = makeState();
		const fragmentContent = makeFragmentContent();
		const action = makeAction("does-not-exist", fragmentContent);

		const gen = SegmentTransactionLogHandler.handle({ state, action, persistentEntries: [] });
		const result = gen.next();

		expect(result.done).toBe(true);
		expect(result.value).toEqual([]);
	});
});

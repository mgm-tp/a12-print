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
	PageOrientation,
	type PartialPrintModelContent,
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
} from "@com.mgmtp.a12.print/print-model-api/model";

import { TransactionLogStateActions } from "../../../../redux/index.js";
import type { ValidAnyTransactionLogAction } from "../../../../redux/transaction-log-state/actions.js";

import { WatermarkTransactionLogHandler } from "../watermark-action-handler.js";

const FRAGMENT_MODEL_ID = "fragment-model-1";
const WATERMARK_REFERENCE_ID = "watermark-ref-1";
const FRAGMENT_WATERMARK_ID = "fragment-watermark-1";
const STYLED_ELEMENT_ID = "fragment-text-styled";
const STYLE_ID = "fragment-style-1";

function makeFragmentContent(): PartialPrintModelContent {
	return {
		id: "fragment-content",
		elementDefinitions: [
			{
				id: STYLED_ELEMENT_ID,
				name: "StyledText",
				type: "Text",
				text: { id: "text-body", text: "Hello", entities: [] },
				textProperties: {
					id: "tp-1",
					textStyleId: { id: "tsi-1", source: "INPUT", value: STYLE_ID },
				},
			},
		],
		watermarks: {
			id: "fragment-watermarks",
			definitions: [
				{
					id: FRAGMENT_WATERMARK_ID,
					title: "FragmentWatermark",
					pageOrientation: PageOrientation.Landscape,
					elementReferences: [{ id: "el-ref-1", refId: STYLED_ELEMENT_ID }],
				},
			],
		},
		textStyles: {
			id: "fragment-text-styles",
			definitions: [{ id: STYLE_ID, name: "FragmentStyle" }],
		},
	} as unknown as PartialPrintModelContent;
}

function makeState(overrides: Partial<TransactionLogStore> = {}): TransactionLogStore {
	return {
		printModelHeader: { id: "header", log: [], memoizedObject: {} },
		[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: {
			id: "general",
			log: [],
			memoizedObject: { id: "general", watermarks: [WATERMARK_REFERENCE_ID] },
		},
		segments: { id: "segments", map: {}, references: {} },
		printModelElements: {},
		watermarks: {
			id: "watermarks",
			map: {},
			referencesEntry: {
				id: "watermarks-references",
				log: [],
				memoizedObject: {
					id: "watermarks-references",
					references: [
						{ id: WATERMARK_REFERENCE_ID, refId: FRAGMENT_WATERMARK_ID, model: FRAGMENT_MODEL_ID },
					],
				},
			},
		},
		...overrides,
	} as unknown as TransactionLogStore;
}

function makeAction(referenceId: string, fragmentContent: PartialPrintModelContent): ValidAnyTransactionLogAction {
	return TransactionLogStateActions.unlinkWatermarkReference({
		data: { referenceId, fragmentContent },
		interactionId: "interaction-1",
		region: GlobalRegion.SIDEBAR,
		regionId: "sidebar",
	}) as ValidAnyTransactionLogAction;
}

describe("unlinkWatermarkReference", () => {
	test("replaces the reference with a local watermark, in place, without opening a confirmation dialog", () => {
		const state = makeState();
		const fragmentContent = makeFragmentContent();
		const action = makeAction(WATERMARK_REFERENCE_ID, fragmentContent);

		const gen = WatermarkTransactionLogHandler.handle({ state, action, persistentEntries: [] });
		const putStep = gen.next();

		expect(putStep.done).toBe(false);
		expect(putStep.value).toMatchObject({ type: "PUT" });

		const newState = (putStep.value as { payload: { action: { payload: TransactionLogStore } } }).payload.action
			.payload;

		const watermarkEntries = Object.values(newState.watermarks?.map ?? {});
		expect(watermarkEntries).toHaveLength(1);
		const [newWatermarkEntry] = watermarkEntries;
		expect(newWatermarkEntry.memoizedObject.id).not.toBe(FRAGMENT_WATERMARK_ID);

		expect(newState.watermarks?.referencesEntry?.memoizedObject.references).toEqual([]);

		const textStyleRefs = newState.textStyles?.referencesEntry?.memoizedObject.references ?? [];
		expect(textStyleRefs).toHaveLength(1);
		expect(textStyleRefs[0]).toMatchObject({ refId: STYLE_ID, model: FRAGMENT_MODEL_ID });

		const newContentGeneral = (newState as unknown as Record<string, { memoizedObject: Record<string, unknown> }>)[
			PRINT_MODEL_CONTENT_GENERAL_LOG_ID
		];
		expect(newContentGeneral.memoizedObject.watermarks).toEqual([newWatermarkEntry.id]);

		const selectStep = gen.next();
		expect(selectStep.done).toBe(false);
		expect(selectStep.value).toMatchObject({ type: "SELECT" });

		const done = gen.next({ watermarkId: "unrelated-id" });
		expect(done.done).toBe(true);
	});

	test("re-points the active entity to the new local id when the unlinked reference was selected", () => {
		const state = makeState();
		const fragmentContent = makeFragmentContent();
		const action = makeAction(WATERMARK_REFERENCE_ID, fragmentContent);

		const gen = WatermarkTransactionLogHandler.handle({ state, action, persistentEntries: [] });
		const putStep = gen.next();
		const newState = (putStep.value as { payload: { action: { payload: TransactionLogStore } } }).payload.action
			.payload;
		const [newWatermarkEntry] = Object.values(newState.watermarks?.map ?? {});

		const selectStep = gen.next();
		expect(selectStep.value).toMatchObject({ type: "SELECT" });

		const setActiveStep = gen.next({ watermarkId: WATERMARK_REFERENCE_ID });
		expect(setActiveStep.done).toBe(false);
		expect(setActiveStep.value).toMatchObject({
			type: "PUT",
			payload: { action: { payload: { tab: SidebarItem.WATERMARK, entityId: newWatermarkEntry.id } } },
		});

		const done = gen.next();
		expect(done.done).toBe(true);
	});

	test("aborts when the reference cannot be found", () => {
		const state = makeState();
		const fragmentContent = makeFragmentContent();
		const action = makeAction("does-not-exist", fragmentContent);

		const gen = WatermarkTransactionLogHandler.handle({ state, action, persistentEntries: [] });
		const result = gen.next();

		expect(result.done).toBe(true);
		expect(result.value).toEqual([]);
	});

	test("aborts when another local watermark already occupies the same orientation slot", () => {
		const state = makeState({
			[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: {
				id: "general",
				log: [],
				memoizedObject: { id: "general", watermarks: ["existing-watermark", WATERMARK_REFERENCE_ID] },
			},
			watermarks: {
				id: "watermarks",
				map: {
					"existing-watermark": {
						id: "existing-watermark",
						log: [],
						memoizedObject: { id: "existing-watermark", pageOrientation: PageOrientation.Landscape },
					},
				},
				referencesEntry: {
					id: "watermarks-references",
					log: [],
					memoizedObject: {
						id: "watermarks-references",
						references: [
							{ id: WATERMARK_REFERENCE_ID, refId: FRAGMENT_WATERMARK_ID, model: FRAGMENT_MODEL_ID },
						],
					},
				},
			},
		} as never);
		const fragmentContent = makeFragmentContent();
		const action = makeAction(WATERMARK_REFERENCE_ID, fragmentContent);

		const gen = WatermarkTransactionLogHandler.handle({ state, action, persistentEntries: [] });
		const result = gen.next();

		expect(result.done).toBe(true);
		expect(result.value).toEqual([]);
	});

	describe("after a local watermark was deleted in the same session", () => {
		const makeDeletedWatermarkEntry = (id: string, pageOrientation: PageOrientation) => ({
			id,
			log: [],
			memoizedObject: { id, pageOrientation },
		});

		const makeReferenceState = (map: Record<string, unknown>) =>
			makeState({
				watermarks: {
					id: "watermarks",
					map,
					referencesEntry: {
						id: "watermarks-references",
						log: [],
						memoizedObject: {
							id: "watermarks-references",
							references: [
								{ id: WATERMARK_REFERENCE_ID, refId: FRAGMENT_WATERMARK_ID, model: FRAGMENT_MODEL_ID },
							],
						},
					},
				},
			} as never);

		const expectUnlinked = (state: TransactionLogStore) => {
			const gen = WatermarkTransactionLogHandler.handle({
				state,
				action: makeAction(WATERMARK_REFERENCE_ID, makeFragmentContent()),
				persistentEntries: [],
			});
			const putStep = gen.next();

			expect(putStep.done).toBe(false);
			const newState = (putStep.value as { payload: { action: { payload: TransactionLogStore } } }).payload.action
				.payload;
			expect(newState.watermarks?.referencesEntry?.memoizedObject.references).toEqual([]);
			const newContentGeneral = (
				newState as unknown as Record<string, { memoizedObject: { watermarks: string[] } }>
			)[PRINT_MODEL_CONTENT_GENERAL_LOG_ID];
			const [newWatermarkId] = newContentGeneral.memoizedObject.watermarks;
			expect(newState.watermarks?.map?.[newWatermarkId]?.memoizedObject.pageOrientation).toBe(
				PageOrientation.Landscape
			);
		};

		test("unlinks although a deleted local watermark of the same orientation is still in watermarks.map", () => {
			expectUnlinked(
				makeReferenceState({
					"deleted-watermark": makeDeletedWatermarkEntry("deleted-watermark", PageOrientation.Landscape),
				})
			);
		});

		test("unlinks although watermarks.map holds as many deleted watermarks as the cardinality limit", () => {
			expectUnlinked(
				makeReferenceState({
					"deleted-1": makeDeletedWatermarkEntry("deleted-1", PageOrientation.Portrait),
					"deleted-2": makeDeletedWatermarkEntry("deleted-2", PageOrientation.Portrait),
				})
			);
		});
	});
});

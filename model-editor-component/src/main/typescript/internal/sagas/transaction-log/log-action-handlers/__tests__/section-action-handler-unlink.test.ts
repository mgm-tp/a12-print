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
	SectionUsage,
} from "@com.mgmtp.a12.print/print-model-api/model";

import { TransactionLogStateActions } from "../../../../redux/index.js";
import type { ValidAnyTransactionLogAction } from "../../../../redux/transaction-log-state/actions.js";

import { SectionTransactionLogHandler } from "../section-action-handler.js";

const FRAGMENT_MODEL_ID = "fragment-model-1";
const SECTION_REFERENCE_ID = "section-ref-1";
const FRAGMENT_SECTION_ID = "fragment-section-1";
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
		sections: {
			id: "fragment-sections",
			definitions: [
				{
					id: FRAGMENT_SECTION_ID,
					name: "FragmentSection",
					pageOrientation: PageOrientation.Landscape,
					headerHeight: undefined,
					sectionUsage: SectionUsage.First,
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
			memoizedObject: { id: "general", sections: [SECTION_REFERENCE_ID] },
		},
		segments: { id: "segments", map: {}, references: {} },
		printModelElements: {},
		sections: {
			id: "sections",
			map: {},
			referencesEntry: {
				id: "sections-references",
				log: [],
				memoizedObject: {
					id: "sections-references",
					references: [
						{
							id: SECTION_REFERENCE_ID,
							refId: FRAGMENT_SECTION_ID,
							model: FRAGMENT_MODEL_ID,
							sectionUsage: SectionUsage.First,
						},
					],
				},
			},
		},
		...overrides,
	} as unknown as TransactionLogStore;
}

function makeAction(referenceId: string, fragmentContent: PartialPrintModelContent): ValidAnyTransactionLogAction {
	return TransactionLogStateActions.unlinkSectionReference({
		data: { referenceId, fragmentContent },
		interactionId: "interaction-1",
		region: GlobalRegion.SIDEBAR,
		regionId: "sidebar",
	}) as ValidAnyTransactionLogAction;
}

describe("unlinkSectionReference", () => {
	test("replaces the reference with a local section, in place, and adds a TextStyleReference", () => {
		const state = makeState({
			sections: {
				id: "sections",
				map: {},
				referencesEntry: {
					id: "sections-references",
					log: [],
					memoizedObject: {
						id: "sections-references",
						references: [
							{
								id: SECTION_REFERENCE_ID,
								refId: FRAGMENT_SECTION_ID,
								model: FRAGMENT_MODEL_ID,
								sectionUsage: SectionUsage.First,
							},
						],
					},
				},
			},
		} as never);
		const fragmentContent = makeFragmentContent();
		const action = makeAction(SECTION_REFERENCE_ID, fragmentContent);

		const gen = SectionTransactionLogHandler.handle({ state, action, persistentEntries: [] });
		const putStep = gen.next();

		expect(putStep.done).toBe(false);
		expect(putStep.value).toMatchObject({ type: "PUT" });

		const newState = (putStep.value as { payload: { action: { payload: TransactionLogStore } } }).payload.action
			.payload;

		const sectionEntries = Object.values(newState.sections?.map ?? {});
		expect(sectionEntries).toHaveLength(1);
		const [newSectionEntry] = sectionEntries;
		expect(newSectionEntry.memoizedObject.sectionUsage).toBe(SectionUsage.First);
		expect(newSectionEntry.memoizedObject.id).not.toBe(FRAGMENT_SECTION_ID);

		// reference removed
		expect(newState.sections?.referencesEntry?.memoizedObject.references).toEqual([]);

		// text style referenced, not cloned as a local definition
		const textStyleRefs = newState.textStyles?.referencesEntry?.memoizedObject.references ?? [];
		expect(textStyleRefs).toHaveLength(1);
		expect(textStyleRefs[0]).toMatchObject({ refId: STYLE_ID, model: FRAGMENT_MODEL_ID });
		expect(newState.textStyles?.map ?? {}).toEqual({});

		// order list swapped in place, not appended
		const newContentGeneral = (newState as unknown as Record<string, { memoizedObject: Record<string, unknown> }>)[
			PRINT_MODEL_CONTENT_GENERAL_LOG_ID
		];
		expect(newContentGeneral.memoizedObject.sections).toEqual([newSectionEntry.id]);
		expect(newContentGeneral.memoizedObject.textStyles).toEqual([textStyleRefs[0].id]);

		const selectStep = gen.next();
		expect(selectStep.done).toBe(false);
		expect(selectStep.value).toMatchObject({ type: "SELECT" });

		const done = gen.next({ sectionId: "unrelated-id" });
		expect(done.done).toBe(true);
		expect(done.value).toEqual(
			expect.arrayContaining([
				{ type: "section", id: newSectionEntry.id },
				{ type: "sectionReferences", id: "sections-references" },
			])
		);
	});

	test("re-points the active entity to the new local id when the unlinked reference was selected", () => {
		const state = makeState({
			sections: {
				id: "sections",
				map: {},
				referencesEntry: {
					id: "sections-references",
					log: [],
					memoizedObject: {
						id: "sections-references",
						references: [
							{
								id: SECTION_REFERENCE_ID,
								refId: FRAGMENT_SECTION_ID,
								model: FRAGMENT_MODEL_ID,
								sectionUsage: SectionUsage.First,
							},
						],
					},
				},
			},
		} as never);
		const fragmentContent = makeFragmentContent();
		const action = makeAction(SECTION_REFERENCE_ID, fragmentContent);

		const gen = SectionTransactionLogHandler.handle({ state, action, persistentEntries: [] });
		const putStep = gen.next();
		const newState = (putStep.value as { payload: { action: { payload: TransactionLogStore } } }).payload.action
			.payload;
		const [newSectionEntry] = Object.values(newState.sections?.map ?? {});

		const selectStep = gen.next();
		expect(selectStep.value).toMatchObject({ type: "SELECT" });

		const setActiveStep = gen.next({ sectionId: SECTION_REFERENCE_ID });
		expect(setActiveStep.done).toBe(false);
		expect(setActiveStep.value).toMatchObject({
			type: "PUT",
			payload: { action: { payload: { tab: SidebarItem.SECTION, entityId: newSectionEntry.id } } },
		});

		const done = gen.next();
		expect(done.done).toBe(true);
	});

	test("aborts (no dispatch) when the reference cannot be found", () => {
		const state = makeState();
		const fragmentContent = makeFragmentContent();
		const action = makeAction("does-not-exist", fragmentContent);

		const gen = SectionTransactionLogHandler.handle({ state, action, persistentEntries: [] });
		const result = gen.next();

		expect(result.done).toBe(true);
		expect(result.value).toEqual([]);
	});

	test("aborts when the reference has no sectionUsage (no concrete slot)", () => {
		const state = makeState({
			sections: {
				id: "sections",
				map: {},
				referencesEntry: {
					id: "sections-references",
					log: [],
					memoizedObject: {
						id: "sections-references",
						references: [
							{
								id: SECTION_REFERENCE_ID,
								refId: FRAGMENT_SECTION_ID,
								model: FRAGMENT_MODEL_ID,
								sectionUsage: undefined,
							},
						],
					},
				},
			},
		} as never);
		const fragmentContent = makeFragmentContent();
		const action = makeAction(SECTION_REFERENCE_ID, fragmentContent);

		const gen = SectionTransactionLogHandler.handle({ state, action, persistentEntries: [] });
		const result = gen.next();

		expect(result.done).toBe(true);
		expect(result.value).toEqual([]);
	});

	test("aborts when another local section already occupies the same (usage, orientation) slot", () => {
		const state = makeState({
			[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: {
				id: "general",
				log: [],
				memoizedObject: { id: "general", sections: ["existing-section", SECTION_REFERENCE_ID] },
			},
			sections: {
				id: "sections",
				map: {
					"existing-section": {
						id: "existing-section",
						log: [],
						memoizedObject: {
							id: "existing-section",
							sectionUsage: SectionUsage.First,
							pageOrientation: PageOrientation.Landscape,
						},
					},
				},
				referencesEntry: {
					id: "sections-references",
					log: [],
					memoizedObject: {
						id: "sections-references",
						references: [
							{
								id: SECTION_REFERENCE_ID,
								refId: FRAGMENT_SECTION_ID,
								model: FRAGMENT_MODEL_ID,
								sectionUsage: SectionUsage.First,
							},
						],
					},
				},
			},
		} as never);
		const fragmentContent = makeFragmentContent();
		const action = makeAction(SECTION_REFERENCE_ID, fragmentContent);

		const gen = SectionTransactionLogHandler.handle({ state, action, persistentEntries: [] });
		const result = gen.next();

		expect(result.done).toBe(true);
		expect(result.value).toEqual([]);
	});

	describe("after a local section was deleted in the same session", () => {
		const makeDeletedSectionEntry = (id: string, sectionUsage: SectionUsage, pageOrientation: PageOrientation) => ({
			id,
			log: [],
			memoizedObject: { id, sectionUsage, pageOrientation },
		});

		const makeReferenceState = (sectionUsage: SectionUsage, map: Record<string, unknown>) =>
			makeState({
				sections: {
					id: "sections",
					map,
					referencesEntry: {
						id: "sections-references",
						log: [],
						memoizedObject: {
							id: "sections-references",
							references: [
								{
									id: SECTION_REFERENCE_ID,
									refId: FRAGMENT_SECTION_ID,
									model: FRAGMENT_MODEL_ID,
									sectionUsage,
								},
							],
						},
					},
				},
			} as never);

		const expectUnlinked = (state: TransactionLogStore, sectionUsage: SectionUsage) => {
			const gen = SectionTransactionLogHandler.handle({
				state,
				action: makeAction(SECTION_REFERENCE_ID, makeFragmentContent()),
				persistentEntries: [],
			});
			const putStep = gen.next();

			expect(putStep.done).toBe(false);
			const newState = (putStep.value as { payload: { action: { payload: TransactionLogStore } } }).payload.action
				.payload;
			expect(newState.sections?.referencesEntry?.memoizedObject.references).toEqual([]);
			const newContentGeneral = (
				newState as unknown as Record<string, { memoizedObject: { sections: string[] } }>
			)[PRINT_MODEL_CONTENT_GENERAL_LOG_ID];
			const [newSectionId] = newContentGeneral.memoizedObject.sections;
			expect(newState.sections?.map?.[newSectionId]?.memoizedObject.sectionUsage).toBe(sectionUsage);
		};

		test.each([SectionUsage.First, SectionUsage.Remaining])(
			"unlinks a %s section reference although a deleted local section of the same slot is still in sections.map",
			sectionUsage => {
				const state = makeReferenceState(sectionUsage, {
					"deleted-section": makeDeletedSectionEntry(
						"deleted-section",
						sectionUsage,
						PageOrientation.Landscape
					),
				});
				expectUnlinked(state, sectionUsage);
			}
		);

		test.each([SectionUsage.First, SectionUsage.Remaining])(
			"unlinks a %s section reference although sections.map holds as many deleted sections as the cardinality limit",
			sectionUsage => {
				const state = makeReferenceState(sectionUsage, {
					"deleted-1": makeDeletedSectionEntry("deleted-1", SectionUsage.First, PageOrientation.Portrait),
					"deleted-2": makeDeletedSectionEntry("deleted-2", SectionUsage.Remaining, PageOrientation.Portrait),
					"deleted-3": makeDeletedSectionEntry("deleted-3", SectionUsage.First, PageOrientation.Portrait),
					"deleted-4": makeDeletedSectionEntry("deleted-4", SectionUsage.Remaining, PageOrientation.Portrait),
				});
				expectUnlinked(state, sectionUsage);
			}
		);
	});
});

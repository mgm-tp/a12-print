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
import { GlobalRegion, type TransactionLogStore } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import {
	type PartialPrintModelContent,
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
} from "@com.mgmtp.a12.print/print-model-api/model";

import { TransactionLogStateActions } from "../../../../redux/index.js";
import type { ValidAnyTransactionLogAction } from "../../../../redux/transaction-log-state/actions.js";

import { TextstyleTransactionLogHandler } from "../textstyle-action-handler.js";

const FRAGMENT_MODEL_ID = "fragment-model-1";
const TEXT_STYLE_REFERENCE_ID = "text-style-ref-1";
const FRAGMENT_TEXT_STYLE_ID = "fragment-text-style-1";

function makeFragmentContent(): PartialPrintModelContent {
	return {
		id: "fragment-content",
		textStyles: {
			id: "fragment-text-styles",
			definitions: [{ id: FRAGMENT_TEXT_STYLE_ID, name: "FragmentTextStyle", font: "Arial", fontSize: 12 }],
		},
	} as unknown as PartialPrintModelContent;
}

function makeState(overrides: Partial<TransactionLogStore> = {}): TransactionLogStore {
	return {
		printModelHeader: { id: "header", log: [], memoizedObject: {} },
		[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: {
			id: "general",
			log: [],
			memoizedObject: { id: "general", textStyles: ["local-style-a", TEXT_STYLE_REFERENCE_ID] },
		},
		segments: { id: "segments", map: {}, references: {} },
		printModelElements: {},
		textStyles: {
			id: "text-styles",
			map: {},
			referencesEntry: {
				id: "text-styles-references",
				log: [],
				memoizedObject: {
					id: "text-styles-references",
					references: [
						{ id: TEXT_STYLE_REFERENCE_ID, refId: FRAGMENT_TEXT_STYLE_ID, model: FRAGMENT_MODEL_ID },
					],
				},
			},
		},
		...overrides,
	} as unknown as TransactionLogStore;
}

function makeAction(referenceId: string, fragmentContent: PartialPrintModelContent): ValidAnyTransactionLogAction {
	return TransactionLogStateActions.unlinkTextStyleReference({
		data: { referenceId, fragmentContent },
		interactionId: "interaction-1",
		region: GlobalRegion.SIDEBAR,
		regionId: "sidebar",
	}) as ValidAnyTransactionLogAction;
}

describe("unlinkTextStyleReference", () => {
	test("clones a full local TextStyle definition under a fresh id and removes the reference", () => {
		const state = makeState();
		const fragmentContent = makeFragmentContent();
		const action = makeAction(TEXT_STYLE_REFERENCE_ID, fragmentContent);

		const gen = TextstyleTransactionLogHandler.handle({ state, action, persistentEntries: [] });
		const putStep = gen.next();

		expect(putStep.done).toBe(false);
		expect(putStep.value).toMatchObject({ type: "PUT" });

		const newState = (putStep.value as { payload: { action: { payload: TransactionLogStore } } }).payload.action
			.payload;

		const textStyleEntries = Object.values(newState.textStyles?.map ?? {});
		expect(textStyleEntries).toHaveLength(1);
		const [newTextStyleEntry] = textStyleEntries;
		expect(newTextStyleEntry.memoizedObject.id).not.toBe(FRAGMENT_TEXT_STYLE_ID);
		expect(newTextStyleEntry.memoizedObject.id).not.toBe(TEXT_STYLE_REFERENCE_ID);
		expect(newTextStyleEntry.memoizedObject.name).toBe("FragmentTextStyle");

		expect(newState.textStyles?.referencesEntry?.memoizedObject.references).toEqual([]);

		const newContentGeneral = (newState as unknown as Record<string, { memoizedObject: Record<string, unknown> }>)[
			PRINT_MODEL_CONTENT_GENERAL_LOG_ID
		];
		expect(newContentGeneral.memoizedObject.textStyles).toEqual(["local-style-a", newTextStyleEntry.id]);

		const done = gen.next();
		expect(done.done).toBe(true);
	});

	test("two references to the same fragment style each produce their own independent local clone", () => {
		const secondReferenceId = "text-style-ref-2";
		const state = makeState({
			[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: {
				id: "general",
				log: [],
				memoizedObject: { id: "general", textStyles: [TEXT_STYLE_REFERENCE_ID, secondReferenceId] },
			},
			textStyles: {
				id: "text-styles",
				map: {},
				referencesEntry: {
					id: "text-styles-references",
					log: [],
					memoizedObject: {
						id: "text-styles-references",
						references: [
							{ id: TEXT_STYLE_REFERENCE_ID, refId: FRAGMENT_TEXT_STYLE_ID, model: FRAGMENT_MODEL_ID },
							{ id: secondReferenceId, refId: FRAGMENT_TEXT_STYLE_ID, model: FRAGMENT_MODEL_ID },
						],
					},
				},
			},
		} as never);
		const fragmentContent = makeFragmentContent();

		const firstGen = TextstyleTransactionLogHandler.handle({
			state,
			action: makeAction(TEXT_STYLE_REFERENCE_ID, fragmentContent),
			persistentEntries: [],
		});
		const firstPut = firstGen.next();
		const firstNewState = (firstPut.value as { payload: { action: { payload: TransactionLogStore } } }).payload
			.action.payload;
		const [firstClone] = Object.values(firstNewState.textStyles?.map ?? {});

		const secondGen = TextstyleTransactionLogHandler.handle({
			state,
			action: makeAction(secondReferenceId, fragmentContent),
			persistentEntries: [],
		});
		const secondPut = secondGen.next();
		const secondNewState = (secondPut.value as { payload: { action: { payload: TransactionLogStore } } }).payload
			.action.payload;
		const [secondClone] = Object.values(secondNewState.textStyles?.map ?? {});

		expect(firstClone.id).not.toBe(secondClone.id);
	});

	test("aborts when the reference cannot be found", () => {
		const state = makeState();
		const fragmentContent = makeFragmentContent();
		const action = makeAction("does-not-exist", fragmentContent);

		const gen = TextstyleTransactionLogHandler.handle({ state, action, persistentEntries: [] });
		const result = gen.next();

		expect(result.done).toBe(true);
		expect(result.value).toEqual([]);
	});
});

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
import type { TransactionLogStore } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { PartialPrintModelContent } from "@com.mgmtp.a12.print/print-model-api/model";

import { appendTextStyleReferences, referenceFragmentTextStyles, replaceIdInPlace } from "../unlink-utils.js";

describe("replaceIdInPlace", () => {
	test("replaces the id in place, preserving position", () => {
		expect(replaceIdInPlace(["a", "b", "c"], "b", "x")).toEqual(["a", "x", "c"]);
	});

	test("throws when the old id is absent", () => {
		expect(() => replaceIdInPlace(["a", "b"], "z", "x")).toThrow(/not present in the order list/);
	});

	test("treats an undefined order list as empty and still throws", () => {
		expect(() => replaceIdInPlace(undefined, "a", "b")).toThrow(/not present in the order list/);
	});
});

function makeState(overrides: Partial<TransactionLogStore> = {}): TransactionLogStore {
	return {
		printModelHeader: { id: "header", log: [], memoizedObject: {} },
		printModelContentGeneral: { id: "general", log: [], memoizedObject: {} },
		segments: { id: "segments", map: {}, references: {} },
		printModelElements: {},
		...overrides,
	} as unknown as TransactionLogStore;
}

function makeFragmentContent(overrides: Partial<PartialPrintModelContent> = {}): PartialPrintModelContent {
	return {
		id: "fragment-content",
		textStyles: {
			id: "fragment-text-styles",
			definitions: [
				{ id: "fragment-style-1", name: "Style1" },
				{ id: "fragment-style-2", name: "Style2" },
			],
		},
		...overrides,
	};
}

describe("referenceFragmentTextStyles", () => {
	test("creates a FragmentModelReference for a used fragment text style not yet referenced by the host", () => {
		const state = makeState();
		const fragmentContent = makeFragmentContent();
		const result = referenceFragmentTextStyles(
			state,
			fragmentContent,
			"fragment-model-1",
			new Set(["fragment-style-1"])
		);

		expect(result.newReferences).toEqual([
			{ id: expect.any(String), refId: "fragment-style-1", model: "fragment-model-1" },
		]);
		expect(result.newOrderIds).toEqual([result.newReferences[0].id]);
		expect(result.textStyleIdMap.get("fragment-style-1")).toBe(result.newReferences[0].id);
	});

	test("reuses an existing reference's id when the host already references the same {model, refId}", () => {
		const existingRef = { id: "existing-ref-id", refId: "fragment-style-1", model: "fragment-model-1" };
		const state = makeState({
			textStyles: {
				id: "text-styles",
				map: {},
				referencesEntry: {
					id: "text-styles-references",
					log: [],
					memoizedObject: { id: "x", references: [existingRef] },
				},
			},
		} as never);
		const fragmentContent = makeFragmentContent();

		const result = referenceFragmentTextStyles(
			state,
			fragmentContent,
			"fragment-model-1",
			new Set(["fragment-style-1"])
		);

		expect(result.newReferences).toEqual([]);
		expect(result.newOrderIds).toEqual([]);
		expect(result.textStyleIdMap.get("fragment-style-1")).toBe("existing-ref-id");
	});

	test("disambiguates two fragment models that define a text style with the same refId", () => {
		const existingRef = { id: "existing-ref-id", refId: "fragment-style-1", model: "other-fragment-model" };
		const state = makeState({
			textStyles: {
				id: "text-styles",
				map: {},
				referencesEntry: {
					id: "text-styles-references",
					log: [],
					memoizedObject: { id: "x", references: [existingRef] },
				},
			},
		} as never);
		const fragmentContent = makeFragmentContent();

		const result = referenceFragmentTextStyles(
			state,
			fragmentContent,
			"fragment-model-1",
			new Set(["fragment-style-1"])
		);

		expect(result.newReferences).toHaveLength(1);
		expect(result.newReferences[0].model).toBe("fragment-model-1");
		expect(result.textStyleIdMap.get("fragment-style-1")).not.toBe("existing-ref-id");
	});

	test("skips (and reports) an id not present in the fragment's text style definitions", () => {
		const state = makeState();
		const fragmentContent = makeFragmentContent();
		const reported: Array<[string, string]> = [];

		const result = referenceFragmentTextStyles(
			state,
			fragmentContent,
			"fragment-model-1",
			new Set(["does-not-exist"]),
			(kind, id) => reported.push([kind, id])
		);

		expect(result.newReferences).toEqual([]);
		expect(result.textStyleIdMap.size).toBe(0);
		expect(reported).toEqual([["textStyle", "does-not-exist"]]);
	});

	test("produces exactly one reference for two ids that both resolve to the same {model, refId}", () => {
		const state = makeState();
		const fragmentContent = makeFragmentContent();

		const result = referenceFragmentTextStyles(
			state,
			fragmentContent,
			"fragment-model-1",
			new Set(["fragment-style-1", "fragment-style-2"])
		);

		expect(result.newReferences).toHaveLength(2);
		expect(new Set(result.newReferences.map(ref => ref.id)).size).toBe(2);
	});
});

describe("appendTextStyleReferences", () => {
	const NEW_REF = { id: "new-ref-id", refId: "fragment-style-1", model: "fragment-model-1" };

	test("returns the state's text styles unchanged and writes nothing when there are no new references", () => {
		const state = makeState({ textStyles: undefined });

		const result = appendTextStyleReferences(state, [], "interaction-1");

		expect(result.textStyles).toBeUndefined();
		expect(result.persistentEntries).toEqual([]);
		expect(result.affectedItems).toEqual([]);
	});

	test("creates the text styles store and references entry when the host has none yet", () => {
		const state = makeState({ textStyles: undefined });

		const result = appendTextStyleReferences(state, [NEW_REF], "interaction-1");

		expect(result.textStyles?.map).toEqual({});
		expect(result.textStyles?.referencesEntry?.memoizedObject?.references).toEqual([NEW_REF]);
		expect(result.persistentEntries.length).toBeGreaterThan(0);
		expect(result.affectedItems).toEqual([
			{ type: "textStyleReferences", id: result.textStyles?.referencesEntry?.id },
		]);
	});

	test("appends to the host's existing references, preserving the rest of the text styles store", () => {
		const existingRef = { id: "existing-ref-id", refId: "other-style", model: "fragment-model-1" };
		const state = makeState({
			textStyles: {
				id: "text-styles",
				map: { "local-style": { id: "local-style" } },
				referencesEntry: {
					id: "text-styles-references",
					log: [],
					memoizedObject: { id: "text-styles-references", references: [existingRef] },
				},
			},
		} as never);

		const result = appendTextStyleReferences(state, [NEW_REF], "interaction-1");

		expect(result.textStyles?.id).toBe("text-styles");
		expect(result.textStyles?.map).toEqual(state.textStyles?.map);
		expect(result.textStyles?.referencesEntry?.memoizedObject?.references).toEqual([existingRef, NEW_REF]);
		expect(result.affectedItems).toEqual([{ type: "textStyleReferences", id: "text-styles-references" }]);
	});
});

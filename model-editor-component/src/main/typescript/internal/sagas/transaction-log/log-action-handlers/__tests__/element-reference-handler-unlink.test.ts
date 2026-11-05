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
	type AffectedItem,
	GlobalRegion,
	type PartialTransactionLogPersistentEntry,
	type TransactionLogStore,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import {
	ElementType,
	type PartialPrintModelContent,
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	SegmentType,
} from "@com.mgmtp.a12.print/print-model-api/model";

import { DetailViewActions, TransactionLogStateActions } from "../../../../redux/index.js";
import type { ValidAnyTransactionLogAction } from "../../../../redux/transaction-log-state/actions.js";

import { ElementReferenceTransactionLogHandler } from "../element-reference-handler.js";

const FRAGMENT_MODEL_ID = "fragment-model-1";
const STYLE_ID = "fragment-style-1";
const LEAF_ELEMENT_ID = "fragment-leaf-1";
const CHILD_ELEMENT_ID = "fragment-child-1";
const WRAPPER_ELEMENT_ID = "fragment-wrapper-1";
const EL_REF_ID = "el-ref-1";
const CONTAINER_ID = "segment-1";
const WRAPPER_CONTAINER_ID = "wrapper-1";

const MEASURE = { id: "measure-1", value: 10, unit: "mm" };
const POSITION = { id: "position-1", x: MEASURE, y: MEASURE };
const DIMENSIONS = { id: "dimensions-1", minWidth: MEASURE, minHeight: MEASURE };

function makeFragmentContent(): PartialPrintModelContent {
	return {
		id: "fragment-content",
		elementDefinitions: [
			{
				id: LEAF_ELEMENT_ID,
				name: "FragmentLeaf",
				type: ElementType.Text,
				isFragment: true,
				fragmentDimensions: { id: "fd-1", width: MEASURE, height: MEASURE },
				text: { id: "leaf-text-body", text: "Leaf", entities: [] },
				textProperties: { id: "leaf-tp", textStyleId: { id: "leaf-tsi", source: "INPUT", value: STYLE_ID } },
			},
			{
				id: CHILD_ELEMENT_ID,
				name: "FragmentChild",
				type: ElementType.Text,
				text: { id: "child-text-body", text: "Child", entities: [] },
				textProperties: { id: "child-tp", textStyleId: { id: "child-tsi", source: "INPUT", value: STYLE_ID } },
			},
			{
				id: WRAPPER_ELEMENT_ID,
				name: "FragmentWrapper",
				type: ElementType.Area,
				isFragment: true,
				fragmentDimensions: { id: "fd-2", width: MEASURE, height: MEASURE },
				area: {
					id: "wrapper-area",
					elementReferences: [
						{ id: "inner-ref-1", refId: CHILD_ELEMENT_ID, position: POSITION, dimensions: DIMENSIONS },
					],
				},
			},
		],
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
			memoizedObject: { id: "general", textStyles: [] },
		},
		segments: { id: "segments", map: {} },
		printModelElements: {},
		textStyles: { id: "text-styles", map: {} },
		...overrides,
	} as unknown as TransactionLogStore;
}

function makeSegmentContainer(elementReferences: unknown[]) {
	return {
		id: CONTAINER_ID,
		type: SegmentType.Default,
		elementReferences,
	};
}

function makeWrapperContainer(elementReferences: unknown[]) {
	return {
		id: WRAPPER_CONTAINER_ID,
		name: "HostArea",
		type: ElementType.Area,
		area: { id: "host-area", elementReferences },
	};
}

/**
 * `updateReferenceElements`/`updateReferenceElement` dispatch their `setLogStore` from inside a
 * nested `yield* call(updateReferences, ...)`, not from the top-level generator directly - so the
 * step after the container-elements CALL is itself another CALL (for `updateReferences`), not a
 * PUT. Drives that inner generator to completion and feeds its return value back into the outer
 * one, returning the PUT effect it issued along the way.
 */
function stepThroughNestedUpdateReferencesCall(nestedCallEffect: unknown, outerGen: Generator) {
	const { fn, args } = (nestedCallEffect as { payload: { fn: (...fnArgs: unknown[]) => Generator; args: unknown[] } })
		.payload;
	const innerGen = fn(...args);
	const putStep = innerGen.next();
	const innerDone = innerGen.next();
	const outerDone = outerGen.next(innerDone.value);
	return { putStep, outerDone };
}

function makeUnlinkAction(
	referenceId: string,
	fragmentContent: PartialPrintModelContent
): ValidAnyTransactionLogAction {
	return TransactionLogStateActions.unlinkElementReference({
		data: { referenceId, fragmentContent },
		interactionId: "interaction-1",
		region: GlobalRegion.SIDEBAR,
		regionId: "sidebar",
	}) as ValidAnyTransactionLogAction;
}

function driveUnlink(state: TransactionLogStore, action: ValidAnyTransactionLogAction, containerElements: unknown) {
	const gen = ElementReferenceTransactionLogHandler.handle({ state, action, persistentEntries: [] });
	const callStep = gen.next();
	return { gen, callStep, putStep: gen.next(containerElements) };
}

describe("unlinkElementReference", () => {
	test("replaces the reference in place, strips isFragment/fragmentDimensions, and dispatches exactly once", () => {
		const state = makeState();
		const fragmentContent = makeFragmentContent();
		const ref = {
			id: EL_REF_ID,
			refId: LEAF_ELEMENT_ID,
			model: FRAGMENT_MODEL_ID,
			position: POSITION,
			dimensions: DIMENSIONS,
		};
		const container = makeSegmentContainer([ref]);
		const action = makeUnlinkAction(EL_REF_ID, fragmentContent);

		const { callStep, putStep, gen } = driveUnlink(state, action, {
			currentContainerElement: container,
			wrapperElement: undefined,
		});

		expect(callStep.value).toMatchObject({ type: "CALL" });
		expect(putStep.done).toBe(false);
		expect(putStep.value).toMatchObject({ type: "PUT" });

		const newState = (putStep.value as { payload: { action: { payload: TransactionLogStore } } }).payload.action
			.payload;

		const newSegment = newState.segments?.map?.[CONTAINER_ID]?.memoizedObject as {
			elementReferences: Array<{ id: string; refId: string; model?: string }>;
		};
		expect(newSegment.elementReferences).toHaveLength(1);
		const [newRef] = newSegment.elementReferences;
		expect(newRef.id).toBe(EL_REF_ID);
		expect(newRef.model).toBeUndefined();
		expect(newRef.refId).not.toBe(LEAF_ELEMENT_ID);

		const clonedElement = newState.printModelElements[newRef.refId]?.memoizedObject as {
			isFragment?: boolean;
			fragmentDimensions?: unknown;
		};
		expect(clonedElement).toBeDefined();
		expect(clonedElement.isFragment).toBeUndefined();
		expect(clonedElement.fragmentDimensions).toBeUndefined();

		const textStyleRefs = newState.textStyles?.referencesEntry?.memoizedObject?.references ?? [];
		expect(textStyleRefs).toHaveLength(1);
		expect(textStyleRefs[0]).toMatchObject({ refId: STYLE_ID, model: FRAGMENT_MODEL_ID });

		expect(gen.next().value).toMatchObject({ type: "SELECT" });
		const done = gen.next(undefined);
		expect(done.done).toBe(true);
	});

	describe("an open form of the unlinked fragment element", () => {
		function unlinkWithOpenForm(openFormId: string) {
			const ref = {
				id: EL_REF_ID,
				refId: LEAF_ELEMENT_ID,
				model: FRAGMENT_MODEL_ID,
				position: POSITION,
				dimensions: DIMENSIONS,
			};
			const { gen, putStep } = driveUnlink(makeState(), makeUnlinkAction(EL_REF_ID, makeFragmentContent()), {
				currentContainerElement: makeSegmentContainer([ref]),
				wrapperElement: undefined,
			});
			const newState = (putStep.value as { payload: { action: { payload: TransactionLogStore } } }).payload.action
				.payload;
			const newSegment = newState.segments?.map?.[CONTAINER_ID]?.memoizedObject as unknown as {
				elementReferences: Array<{ refId: string }>;
			};
			gen.next();
			return { afterSelect: gen.next({ id: openFormId, type: ElementType.Text }), gen, newSegment };
		}

		test("is switched to the editable copy", () => {
			const { afterSelect, gen, newSegment } = unlinkWithOpenForm(LEAF_ELEMENT_ID);

			expect(afterSelect.value).toMatchObject({
				type: "PUT",
				payload: { action: DetailViewActions.openElementForm(newSegment.elementReferences[0].refId) },
			});
			expect(gen.next().done).toBe(true);
		});

		test("is left alone when the form shows another element", () => {
			const { afterSelect } = unlinkWithOpenForm("other-element");

			expect(afterSelect.done).toBe(true);
		});
	});

	test("does not write text-style references when the unlinked element uses no fragment text style", () => {
		// A fresh host has no text-style references entry - writing the unchanged entry anyway would
		// persist a bare marker that the WAL replay drops while still listing it as affected.
		const state = makeState({ textStyles: undefined });
		const fragmentContent = makeFragmentContent();
		const leaf = fragmentContent.elementDefinitions?.find(element => element.id === LEAF_ELEMENT_ID);
		delete (leaf as { textProperties?: unknown }).textProperties;
		const ref = {
			id: EL_REF_ID,
			refId: LEAF_ELEMENT_ID,
			model: FRAGMENT_MODEL_ID,
			position: POSITION,
			dimensions: DIMENSIONS,
		};
		const container = makeSegmentContainer([ref]);
		const action = makeUnlinkAction(EL_REF_ID, fragmentContent);
		const persistentEntries: PartialTransactionLogPersistentEntry[] = [];

		const gen = ElementReferenceTransactionLogHandler.handle({ state, action, persistentEntries });
		gen.next();
		const putStep = gen.next({ currentContainerElement: container, wrapperElement: undefined });
		const newState = (putStep.value as { payload: { action: { payload: TransactionLogStore } } }).payload.action
			.payload;
		gen.next();
		const done = gen.next();

		expect(newState.textStyles).toBeUndefined();
		expect(persistentEntries.filter(entry => entry.entryType === "textStyleReferences")).toEqual([]);
		expect((done.value as AffectedItem[]).filter(item => item.type === "textStyleReferences")).toEqual([]);
	});

	test("clones nested descendants of a wrapper fragment root with fresh ids", () => {
		const state = makeState();
		const fragmentContent = makeFragmentContent();
		const ref = {
			id: EL_REF_ID,
			refId: WRAPPER_ELEMENT_ID,
			model: FRAGMENT_MODEL_ID,
			position: POSITION,
			dimensions: DIMENSIONS,
		};
		const container = makeSegmentContainer([ref]);
		const action = makeUnlinkAction(EL_REF_ID, fragmentContent);

		const { putStep } = driveUnlink(state, action, {
			currentContainerElement: container,
			wrapperElement: undefined,
		});
		const newState = (putStep.value as { payload: { action: { payload: TransactionLogStore } } }).payload.action
			.payload;

		const newSegment = newState.segments?.map?.[CONTAINER_ID]?.memoizedObject as {
			elementReferences: Array<{ refId: string }>;
		};
		const [newRef] = newSegment.elementReferences;

		const clonedElementIds = Object.keys(newState.printModelElements);
		expect(clonedElementIds).toHaveLength(2);
		expect(clonedElementIds).toContain(newRef.refId);

		const descendantId = clonedElementIds.find(id => id !== newRef.refId) as string;
		expect(descendantId).not.toBe(CHILD_ELEMENT_ID);
	});

	test("wrapper container: merges the updated elementReferences entry and cloned elements into one printModelElements write", () => {
		const state = makeState();
		const fragmentContent = makeFragmentContent();
		const ref = {
			id: EL_REF_ID,
			refId: LEAF_ELEMENT_ID,
			model: FRAGMENT_MODEL_ID,
			position: POSITION,
			dimensions: DIMENSIONS,
		};
		const wrapper = makeWrapperContainer([ref]);
		const action = makeUnlinkAction(EL_REF_ID, fragmentContent);

		const { putStep } = driveUnlink(state, action, {
			currentContainerElement: makeSegmentContainer([]),
			wrapperElement: wrapper,
		});

		const newState = (putStep.value as { payload: { action: { payload: TransactionLogStore } } }).payload.action
			.payload;

		// the wrapper's own updated entry ...
		const wrapperEntry = newState.printModelElements[WRAPPER_CONTAINER_ID]?.memoizedObject as {
			area: { elementReferences: Array<{ refId: string }> };
		};
		expect(wrapperEntry).toBeDefined();
		const [newRef] = wrapperEntry.area.elementReferences;

		// ... AND the cloned element must both be present in the same single store write
		expect(newState.printModelElements[newRef.refId]).toBeDefined();

		// nothing in state.segments was touched
		expect(Object.keys(newState.segments?.map ?? {})).toHaveLength(0);
	});

	test("dedupes the text-style reference against an existing one for the same {model, refId}", () => {
		const existingTextStyleRefId = "existing-text-style-ref";
		const state = makeState({
			textStyles: {
				id: "text-styles",
				map: {},
				referencesEntry: {
					id: "text-styles-references",
					log: [],
					memoizedObject: {
						id: "text-styles-references",
						references: [{ id: existingTextStyleRefId, refId: STYLE_ID, model: FRAGMENT_MODEL_ID }],
					},
				},
			},
		} as never);
		const fragmentContent = makeFragmentContent();
		const ref = {
			id: EL_REF_ID,
			refId: LEAF_ELEMENT_ID,
			model: FRAGMENT_MODEL_ID,
			position: POSITION,
			dimensions: DIMENSIONS,
		};
		const container = makeSegmentContainer([ref]);
		const action = makeUnlinkAction(EL_REF_ID, fragmentContent);

		const { putStep } = driveUnlink(state, action, {
			currentContainerElement: container,
			wrapperElement: undefined,
		});
		const newState = (putStep.value as { payload: { action: { payload: TransactionLogStore } } }).payload.action
			.payload;

		const textStyleRefs = newState.textStyles?.referencesEntry?.memoizedObject?.references ?? [];
		expect(textStyleRefs).toHaveLength(1);
		expect(textStyleRefs[0].id).toBe(existingTextStyleRefId);
	});

	test("aborts (no dispatch) when the reference cannot be found", () => {
		const state = makeState();
		const fragmentContent = makeFragmentContent();
		const container = makeSegmentContainer([]);
		const action = makeUnlinkAction("does-not-exist", fragmentContent);

		const { putStep: result } = driveUnlink(state, action, {
			currentContainerElement: container,
			wrapperElement: undefined,
		});

		expect(result.done).toBe(true);
		expect(result.value).toEqual([]);
	});

	test("aborts when the reference has no model (already local, not a fragment reference)", () => {
		const state = makeState();
		const fragmentContent = makeFragmentContent();
		const localRef = { id: EL_REF_ID, refId: "some-local-element", position: POSITION, dimensions: DIMENSIONS };
		const container = makeSegmentContainer([localRef]);
		const action = makeUnlinkAction(EL_REF_ID, fragmentContent);

		const { putStep: result } = driveUnlink(state, action, {
			currentContainerElement: container,
			wrapperElement: undefined,
		});

		expect(result.done).toBe(true);
		expect(result.value).toEqual([]);
	});

	test("aborts when the fragment definition cannot be resolved", () => {
		const state = makeState();
		const fragmentContent = makeFragmentContent();
		const ref = {
			id: EL_REF_ID,
			refId: "unknown-fragment-element",
			model: FRAGMENT_MODEL_ID,
			position: POSITION,
			dimensions: DIMENSIONS,
		};
		const container = makeSegmentContainer([ref]);
		const action = makeUnlinkAction(EL_REF_ID, fragmentContent);

		const { putStep: result } = driveUnlink(state, action, {
			currentContainerElement: container,
			wrapperElement: undefined,
		});

		expect(result.done).toBe(true);
		expect(result.value).toEqual([]);
	});
});

describe("updateReferenceElements / updateReferenceElement (pre-existing behavior, protected against the buildReferenceStoreUpdate refactor)", () => {
	test("updateReferenceElements writes the full elementReferences array for a top-level container", () => {
		const state = makeState();
		const newReferences = [
			{ id: "ref-a", refId: "el-a", position: POSITION, dimensions: DIMENSIONS },
			{ id: "ref-b", refId: "el-b", position: POSITION, dimensions: DIMENSIONS },
		];
		const container = makeSegmentContainer([]);
		const action = TransactionLogStateActions.updateReferenceElements({
			data: newReferences,
			interactionId: "interaction-1",
			region: GlobalRegion.SIDEBAR,
			regionId: "sidebar",
		}) as ValidAnyTransactionLogAction;

		const gen = ElementReferenceTransactionLogHandler.handle({ state, action, persistentEntries: [] });
		gen.next();
		const nestedCallStep = gen.next({ currentContainerElement: container, wrapperElement: undefined });
		expect(nestedCallStep.value).toMatchObject({ type: "CALL" });
		const { putStep, outerDone } = stepThroughNestedUpdateReferencesCall(nestedCallStep.value, gen);

		const newState = (putStep.value as { payload: { action: { payload: TransactionLogStore } } }).payload.action
			.payload;
		const newSegment = newState.segments?.map?.[CONTAINER_ID]?.memoizedObject as {
			elementReferences: unknown[];
		};
		expect(newSegment.elementReferences).toEqual(newReferences);

		expect(outerDone.done).toBe(true);
	});

	test("updateReferenceElements writes into the wrapper's own entry, not the top-level container", () => {
		const state = makeState();
		const newReferences = [{ id: "ref-a", refId: "el-a", position: POSITION, dimensions: DIMENSIONS }];
		const wrapper = makeWrapperContainer([]);
		const action = TransactionLogStateActions.updateReferenceElements({
			data: newReferences,
			interactionId: "interaction-1",
			region: GlobalRegion.SIDEBAR,
			regionId: "sidebar",
		}) as ValidAnyTransactionLogAction;

		const gen = ElementReferenceTransactionLogHandler.handle({ state, action, persistentEntries: [] });
		gen.next();
		const nestedCallStep = gen.next({ currentContainerElement: makeSegmentContainer([]), wrapperElement: wrapper });
		const { putStep } = stepThroughNestedUpdateReferencesCall(nestedCallStep.value, gen);

		const newState = (putStep.value as { payload: { action: { payload: TransactionLogStore } } }).payload.action
			.payload;
		const wrapperEntry = newState.printModelElements[WRAPPER_CONTAINER_ID]?.memoizedObject as {
			area: { elementReferences: unknown[] };
		};
		expect(wrapperEntry.area.elementReferences).toEqual(newReferences);
		expect(Object.keys(newState.segments?.map ?? {})).toHaveLength(0);
	});

	test("updateReferenceElement replaces a single reference by id, preserving the others", () => {
		const existing = [
			{ id: "ref-a", refId: "el-a", position: POSITION, dimensions: DIMENSIONS },
			{ id: "ref-b", refId: "el-b", position: POSITION, dimensions: DIMENSIONS },
		];
		const state = makeState();
		const container = makeSegmentContainer(existing);
		const updatedRef = { id: "ref-b", refId: "el-b-moved", position: POSITION, dimensions: DIMENSIONS };
		const action = TransactionLogStateActions.updateReferenceElement({
			data: updatedRef,
			interactionId: "interaction-1",
			region: GlobalRegion.SIDEBAR,
			regionId: "sidebar",
		}) as ValidAnyTransactionLogAction;

		const gen = ElementReferenceTransactionLogHandler.handle({ state, action, persistentEntries: [] });
		gen.next();
		const nestedCallStep = gen.next({ currentContainerElement: container, wrapperElement: undefined });
		const { putStep } = stepThroughNestedUpdateReferencesCall(nestedCallStep.value, gen);

		const newState = (putStep.value as { payload: { action: { payload: TransactionLogStore } } }).payload.action
			.payload;
		const newSegment = newState.segments?.map?.[CONTAINER_ID]?.memoizedObject as {
			elementReferences: Array<{ id: string; refId: string }>;
		};
		expect(newSegment.elementReferences).toEqual([existing[0], updatedRef]);
	});

	test("aborts (no dispatch) when there is no current container element", () => {
		const state = makeState();
		const action = TransactionLogStateActions.updateReferenceElements({
			data: [],
			interactionId: "interaction-1",
			region: GlobalRegion.SIDEBAR,
			regionId: "sidebar",
		}) as ValidAnyTransactionLogAction;

		const gen = ElementReferenceTransactionLogHandler.handle({ state, action, persistentEntries: [] });
		gen.next();
		const result = gen.next({ currentContainerElement: undefined, wrapperElement: undefined });

		expect(result.done).toBe(true);
		expect(result.value).toEqual([]);
	});
});

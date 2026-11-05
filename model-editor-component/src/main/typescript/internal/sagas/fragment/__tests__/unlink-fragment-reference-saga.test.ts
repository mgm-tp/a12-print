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
import { GlobalRegion, StageRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { PartialPrintModelContent } from "@com.mgmtp.a12.print/print-model-api/model";

import { RESOURCE_KEYS } from "../../../localization/index.js";
import { FragmentActions, InteractionLogActions } from "../../../redux/index.js";

import { handleUnlinkFragmentReference } from "../unlink-fragment-reference-saga.js";

const REFERENCE_ID = "reference-1";
const FRAGMENT_MODEL_ID = "fragment-model-1";
const ELEMENT_REF_ID = "frag-element-1";

function segmentFragmentContent(elementDefinitions: unknown[] = []): PartialPrintModelContent {
	return {
		id: "fragment-content",
		elementDefinitions,
		segments: {
			id: "fragment-segments",
			definitions: [
				{
					id: "frag-segment-1",
					title: "FragmentSegment",
					type: "Default",
					elementReferences: elementDefinitions.map((element, index) => ({
						id: `el-ref-${index}`,
						refId: (element as { id: string }).id,
					})),
				},
			],
		},
		textStyles: { id: "fragment-text-styles", definitions: [] },
	} as unknown as PartialPrintModelContent;
}

function textStyleFragmentContent(typesettingModelName?: string): PartialPrintModelContent {
	return {
		id: "fragment-content",
		textStyles: {
			id: "fragment-text-styles",
			definitions: [{ id: "frag-style-1", name: "FragmentStyle", typesettingModelName }],
		},
	} as unknown as PartialPrintModelContent;
}

function elementFragmentContent(withTypesettingDependency: boolean): PartialPrintModelContent {
	return {
		id: "fragment-content",
		elementDefinitions: [
			{
				id: ELEMENT_REF_ID,
				type: "Text",
				name: "FragmentElement",
				isFragment: true,
				text: { id: "frag-text-body", text: "Fragment text", entities: [] },
				...(withTypesettingDependency
					? {
							textProperties: {
								id: "frag-text-props",
								textStyleId: { id: "frag-tsi", source: "INPUT", value: "frag-style-1" },
							},
						}
					: {}),
			},
		],
		textStyles: {
			id: "fragment-text-styles",
			definitions: [{ id: "frag-style-1", name: "FragmentStyle", typesettingModelName: "Typesetting1" }],
		},
	} as unknown as PartialPrintModelContent;
}

describe("handleUnlinkFragmentReference", () => {
	test("returns silently when the reference cannot be found", () => {
		const gen = handleUnlinkFragmentReference(
			FragmentActions.unlinkReference({ referenceId: REFERENCE_ID, entityType: "segment" })
		);
		gen.next();
		const result = gen.next(undefined);
		expect(result.done).toBe(true);
	});

	test("notifies an error when the fragment model is not loaded", () => {
		const gen = handleUnlinkFragmentReference(
			FragmentActions.unlinkReference({ referenceId: REFERENCE_ID, entityType: "segment" })
		);
		gen.next();
		gen.next({ id: REFERENCE_ID, refId: "frag-segment-1", model: FRAGMENT_MODEL_ID });
		const step = gen.next({});
		expect(step.done).toBe(false);
		expect(step.value).toMatchObject({
			payload: { args: [RESOURCE_KEYS.fragmentUnlink.error.fragmentNotLoaded] },
		});
		expect(gen.next().done).toBe(true);
	});

	test("happy path (no dependencies, no prior interactions): dispatches exactly one InteractionLogActions.start with a single transaction-log action", () => {
		const fragmentContent = segmentFragmentContent();
		const gen = handleUnlinkFragmentReference(
			FragmentActions.unlinkReference({ referenceId: REFERENCE_ID, entityType: "segment" })
		);
		gen.next();
		gen.next({ id: REFERENCE_ID, refId: "frag-segment-1", model: FRAGMENT_MODEL_ID });
		gen.next({ [FRAGMENT_MODEL_ID]: { content: fragmentContent } });
		gen.next([]); // documentModelReferences
		gen.next([]); // typesettingModelReferences
		gen.next({}); // printHeader
		gen.next(true); // confirmed FRAGMENT_UNLINK
		const step = gen.next({}); // transactionLogState, empty -> no prior interactions
		expect(step.done).toBe(false);
		expect(step.value).toMatchObject({ type: "PUT" });
		const startPayload = (step.value as { payload: { action: { payload: unknown } } }).payload.action.payload as {
			transactionLogActions: unknown[];
			preventUndo: boolean;
		};
		expect(startPayload.transactionLogActions).toHaveLength(1);
		expect(startPayload.preventUndo).toBe(true);
		expect(gen.next().done).toBe(true);
	});

	test("with prior interactions related to the reference: marks them preventUndo before starting the unlink interaction", () => {
		const fragmentContent = segmentFragmentContent();
		const gen = handleUnlinkFragmentReference(
			FragmentActions.unlinkReference({ referenceId: REFERENCE_ID, entityType: "segment" })
		);
		gen.next();
		gen.next({ id: REFERENCE_ID, refId: "frag-segment-1", model: FRAGMENT_MODEL_ID });
		gen.next({ [FRAGMENT_MODEL_ID]: { content: fragmentContent } });
		gen.next([]); // documentModelReferences
		gen.next([]); // typesettingModelReferences
		gen.next({}); // printHeader
		gen.next(true); // confirmed FRAGMENT_UNLINK
		const markStep = gen.next({
			segments: {
				id: "segments-store",
				map: {},
				fragmentReferencesEntry: {
					id: "segments-fragment-references",
					memoizedObject: { id: "segments-fragment-references", references: [] },
					log: [
						{
							interactionId: "prior-1",
							parentId: "x",
							propertyKey: "references",
							objectId: REFERENCE_ID,
							value: null,
							command: "PUSH",
						},
						{
							interactionId: "prior-1",
							parentId: "x",
							propertyKey: "sectionUsage",
							objectId: REFERENCE_ID,
							value: "First",
							command: "SET",
						},
						{
							interactionId: "prior-2",
							parentId: "x",
							propertyKey: "sectionUsage",
							objectId: REFERENCE_ID,
							value: "Remaining",
							command: "SET",
						},
						{
							interactionId: "unrelated",
							parentId: "x",
							propertyKey: "sectionUsage",
							objectId: "other-ref",
							value: "First",
							command: "SET",
						},
					],
				},
			},
		}); // transactionLogState with matching prior log entries
		expect(markStep.done).toBe(false);
		expect(markStep.value).toMatchObject({
			type: "PUT",
			payload: { action: { type: InteractionLogActions.markPreventUndo.toString() } },
		});
		const markPayload = (markStep.value as { payload: { action: { payload: unknown } } }).payload.action
			.payload as { interactionIds: string[] };
		expect(markPayload.interactionIds.sort()).toEqual(["prior-1", "prior-2"]);

		const startStep = gen.next();
		expect(startStep.value).toMatchObject({
			type: "PUT",
			payload: { action: { type: InteractionLogActions.start.toString() } },
		});
		expect(gen.next().done).toBe(true);
	});

	test("with a missing typesetting dependency: opens the dialog, and on confirm the interaction contains [updatePrintHeader, unlink...] in that order", () => {
		const fragmentContent = textStyleFragmentContent("Typesetting1");
		const gen = handleUnlinkFragmentReference(
			FragmentActions.unlinkReference({ referenceId: REFERENCE_ID, entityType: "textStyle" })
		);
		gen.next();
		gen.next({ id: REFERENCE_ID, refId: "frag-style-1", model: FRAGMENT_MODEL_ID });
		gen.next({ [FRAGMENT_MODEL_ID]: { content: fragmentContent } });
		gen.next([]); // documentModelReferences
		const dialogStep = gen.next([]); // typesettingModelReferences -> triggers dialog call
		expect(dialogStep.done).toBe(false);
		expect(dialogStep.value).toMatchObject({ type: "CALL" });
		gen.next(true); // dependencies dialog confirmed -> printHeader select comes next
		gen.next({ modelReferences: [] }); // printHeader -> confirm FRAGMENT_UNLINK
		gen.next(true); // confirmed FRAGMENT_UNLINK -> transactionLogState select
		const putStep = gen.next({}); // transactionLogState, empty -> no prior interactions
		expect(putStep.value).toMatchObject({ type: "PUT" });
		const startPayload = (putStep.value as { payload: { action: { payload: unknown } } }).payload.action
			.payload as { transactionLogActions: Array<{ type: string }> };
		expect(startPayload.transactionLogActions).toHaveLength(2);
		expect(startPayload.transactionLogActions[0].type).toContain("UPDATE_PRINT_HEADER");
		expect(startPayload.transactionLogActions[1].type).toContain("UNLINK_TEXT_STYLE_REFERENCE");
		expect(gen.next().done).toBe(true);
	});

	test("on dialog cancel: nothing is dispatched", () => {
		const fragmentContent = textStyleFragmentContent("Typesetting1");
		const gen = handleUnlinkFragmentReference(
			FragmentActions.unlinkReference({ referenceId: REFERENCE_ID, entityType: "textStyle" })
		);
		gen.next();
		gen.next({ id: REFERENCE_ID, refId: "frag-style-1", model: FRAGMENT_MODEL_ID });
		gen.next({ [FRAGMENT_MODEL_ID]: { content: fragmentContent } });
		gen.next([]);
		gen.next([]);
		const result = gen.next(false);
		expect(result.done).toBe(true);
	});

	test("document-model conflict: host references a different Document Model -> notification, no dialog, no transaction-log action", () => {
		const fragmentContent = segmentFragmentContent([
			{ id: "field-1", name: "Field1", type: "Field", field: { id: "fp1", model: "ExampleDM", path: "/x" } },
		]);
		const gen = handleUnlinkFragmentReference(
			FragmentActions.unlinkReference({ referenceId: REFERENCE_ID, entityType: "segment" })
		);
		gen.next();
		gen.next({ id: REFERENCE_ID, refId: "frag-segment-1", model: FRAGMENT_MODEL_ID });
		gen.next({ [FRAGMENT_MODEL_ID]: { content: fragmentContent } });
		gen.next([{ id: "r1", modelType: "document", reference: "OtherDM" }]); // documentModelReferences
		const step = gen.next([]); // typesettingModelReferences -> triggers conflict notification
		expect(step.done).toBe(false);
		expect(step.value).toMatchObject({
			payload: {
				args: [
					RESOURCE_KEYS.fragmentUnlink.error.documentModelConflict,
					{ required: "ExampleDM", existing: "OtherDM" },
				],
			},
		});
		expect(gen.next().done).toBe(true);
	});

	test("host has no Document Model and content needs one: dialog offered, auto-add proceeds", () => {
		const fragmentContent = segmentFragmentContent([
			{ id: "field-1", name: "Field1", type: "Field", field: { id: "fp1", model: "ExampleDM", path: "/x" } },
		]);
		const gen = handleUnlinkFragmentReference(
			FragmentActions.unlinkReference({ referenceId: REFERENCE_ID, entityType: "segment" })
		);
		gen.next();
		gen.next({ id: REFERENCE_ID, refId: "frag-segment-1", model: FRAGMENT_MODEL_ID });
		gen.next({ [FRAGMENT_MODEL_ID]: { content: fragmentContent } });
		gen.next([]); // no host document models
		const dialogStep = gen.next([]); // no host typesetting models -> triggers dialog
		expect(dialogStep.value).toMatchObject({ type: "CALL" });
		gen.next(true); // dependencies dialog confirmed -> printHeader select comes next
		gen.next({ modelReferences: [] }); // printHeader -> confirm FRAGMENT_UNLINK
		gen.next(true); // confirmed FRAGMENT_UNLINK -> transactionLogState select
		const putStep = gen.next({}); // transactionLogState, empty -> no prior interactions
		const startPayload = (putStep.value as { payload: { action: { payload: unknown } } }).payload.action
			.payload as {
			transactionLogActions: Array<{ payload: { data: { modelReferences: { reference: string }[] } } }>;
		};
		expect(startPayload.transactionLogActions).toHaveLength(2);
		expect(startPayload.transactionLogActions[0].payload.data.modelReferences[0].reference).toBe("ExampleDM");
		expect(gen.next().done).toBe(true);
	});

	test("host already references the needed Document Model: no dialog, unlink proceeds", () => {
		const fragmentContent = segmentFragmentContent([
			{ id: "field-1", name: "Field1", type: "Field", field: { id: "fp1", model: "ExampleDM", path: "/x" } },
		]);
		const gen = handleUnlinkFragmentReference(
			FragmentActions.unlinkReference({ referenceId: REFERENCE_ID, entityType: "segment" })
		);
		gen.next();
		gen.next({ id: REFERENCE_ID, refId: "frag-segment-1", model: FRAGMENT_MODEL_ID });
		gen.next({ [FRAGMENT_MODEL_ID]: { content: fragmentContent } });
		gen.next([{ id: "r1", modelType: "document", reference: "ExampleDM" }]);
		const step = gen.next([]); // no typesetting models missing -> no dialog, straight to printHeader select
		expect(step.value).toMatchObject({ type: "SELECT" });
		gen.next({}); // printHeader -> confirm FRAGMENT_UNLINK
		gen.next(true); // confirmed FRAGMENT_UNLINK -> transactionLogState select
		const putStep = gen.next({}); // transactionLogState, empty -> no prior interactions
		expect(putStep.value).toMatchObject({ type: "PUT" });
		const startPayload = (putStep.value as { payload: { action: { payload: unknown } } }).payload.action
			.payload as { transactionLogActions: unknown[] };
		expect(startPayload.transactionLogActions).toHaveLength(1);
		expect(gen.next().done).toBe(true);
	});
});

describe("handleUnlinkFragmentReference - entityType 'element'", () => {
	test("aborts immediately (no effect at all) when the payload carries no fragmentReference", () => {
		const gen = handleUnlinkFragmentReference(
			FragmentActions.unlinkReference({ referenceId: REFERENCE_ID, entityType: "element" })
		);
		const result = gen.next();
		expect(result.done).toBe(true);
	});

	test("resolves the ref from payload.fragmentReference (no store lookup) and dispatches unlinkElementReference in the StageRegion", () => {
		const fragmentContent = elementFragmentContent(false);
		const gen = handleUnlinkFragmentReference(
			FragmentActions.unlinkReference({
				referenceId: REFERENCE_ID,
				entityType: "element",
				fragmentReference: { model: FRAGMENT_MODEL_ID, refId: ELEMENT_REF_ID },
			})
		);
		// No ref-selection step for "element" - the first effect is the printModelData select.
		const printModelDataStep = gen.next();
		expect(printModelDataStep.value).toMatchObject({ type: "SELECT" });
		gen.next({ [FRAGMENT_MODEL_ID]: { content: fragmentContent } });
		gen.next([]); // documentModelReferences
		gen.next([]); // typesettingModelReferences
		gen.next({}); // printHeader
		gen.next(true); // confirmed FRAGMENT_UNLINK -> transactionLogState select
		const containerStep = gen.next({}); // transactionLogState -> element case resolves the current container next
		expect(containerStep.value).toMatchObject({ type: "CALL" });
		const step = gen.next({ currentContainerElement: undefined, wrapperElement: undefined }); // no container found -> no prior interactions
		expect(step.done).toBe(false);
		expect(step.value).toMatchObject({ type: "PUT" });
		const startPayload = (step.value as { payload: { action: { payload: unknown } } }).payload.action.payload as {
			region: string;
			transactionLogActions: Array<{ type: string }>;
		};
		expect(startPayload.region).toBe(StageRegion.DEFAULT);
		expect(startPayload.region).not.toBe(GlobalRegion.SIDEBAR);
		expect(startPayload.transactionLogActions).toHaveLength(1);
		expect(startPayload.transactionLogActions[0].type).toContain("UNLINK_ELEMENT_REFERENCE");
		expect(gen.next().done).toBe(true);
	});

	test("with a missing typesetting dependency: opens the dialog, and on confirm the interaction contains [updatePrintHeader, unlinkElementReference]", () => {
		const fragmentContent = elementFragmentContent(true);
		const gen = handleUnlinkFragmentReference(
			FragmentActions.unlinkReference({
				referenceId: REFERENCE_ID,
				entityType: "element",
				fragmentReference: { model: FRAGMENT_MODEL_ID, refId: ELEMENT_REF_ID },
			})
		);
		gen.next();
		gen.next({ [FRAGMENT_MODEL_ID]: { content: fragmentContent } });
		gen.next([]); // documentModelReferences
		const dialogStep = gen.next([]); // typesettingModelReferences -> triggers dialog call
		expect(dialogStep.value).toMatchObject({ type: "CALL" });
		gen.next(true); // dependencies dialog confirmed -> printHeader select comes next
		gen.next({ modelReferences: [] }); // printHeader -> confirm FRAGMENT_UNLINK
		gen.next(true); // confirmed FRAGMENT_UNLINK -> transactionLogState select
		const containerStep = gen.next({}); // transactionLogState -> element case resolves the current container next
		expect(containerStep.value).toMatchObject({ type: "CALL" });
		const putStep = gen.next({ currentContainerElement: undefined, wrapperElement: undefined }); // no container found -> no prior interactions
		expect(putStep.value).toMatchObject({ type: "PUT" });
		const startPayload = (putStep.value as { payload: { action: { payload: unknown } } }).payload.action
			.payload as { transactionLogActions: Array<{ type: string }> };
		expect(startPayload.transactionLogActions).toHaveLength(2);
		expect(startPayload.transactionLogActions[0].type).toContain("UPDATE_PRINT_HEADER");
		expect(startPayload.transactionLogActions[1].type).toContain("UNLINK_ELEMENT_REFERENCE");
		expect(gen.next().done).toBe(true);
	});

	test("document-model conflict for an element: host references a different Document Model -> notification, no dialog, no transaction-log action", () => {
		const fragmentContent = {
			id: "fragment-content",
			elementDefinitions: [
				{
					id: ELEMENT_REF_ID,
					type: "Image",
					name: "FragmentImage",
					isFragment: true,
					image: {
						id: "frag-image-props",
						imageSrcType: "Dynamic",
						alternativeText: "alt",
						fieldSource: { id: "frag-image-field-source", model: "ExampleDM", path: "/image" },
					},
				},
			],
			textStyles: { id: "fragment-text-styles", definitions: [] },
		} as unknown as PartialPrintModelContent;
		const gen = handleUnlinkFragmentReference(
			FragmentActions.unlinkReference({
				referenceId: REFERENCE_ID,
				entityType: "element",
				fragmentReference: { model: FRAGMENT_MODEL_ID, refId: ELEMENT_REF_ID },
			})
		);
		gen.next();
		gen.next({ [FRAGMENT_MODEL_ID]: { content: fragmentContent } });
		gen.next([{ id: "r1", modelType: "document", reference: "OtherDM" }]); // documentModelReferences
		const step = gen.next([]); // typesettingModelReferences -> triggers conflict notification
		expect(step.done).toBe(false);
		expect(step.value).toMatchObject({
			payload: {
				args: [
					RESOURCE_KEYS.fragmentUnlink.error.documentModelConflict,
					{ required: "ExampleDM", existing: "OtherDM" },
				],
			},
		});
		expect(gen.next().done).toBe(true);
	});

	test("with prior interactions recorded against the container holding the reference: marks them preventUndo", () => {
		const fragmentContent = elementFragmentContent(false);
		const gen = handleUnlinkFragmentReference(
			FragmentActions.unlinkReference({
				referenceId: REFERENCE_ID,
				entityType: "element",
				fragmentReference: { model: FRAGMENT_MODEL_ID, refId: ELEMENT_REF_ID },
			})
		);
		gen.next();
		gen.next({ [FRAGMENT_MODEL_ID]: { content: fragmentContent } });
		gen.next([]); // documentModelReferences
		gen.next([]); // typesettingModelReferences
		gen.next({}); // printHeader
		gen.next(true); // confirmed FRAGMENT_UNLINK -> transactionLogState select
		const containerStep = gen.next({
			segments: {
				id: "segments-store",
				map: {
					"container-1": {
						id: "container-1",
						memoizedObject: { id: "container-1" },
						log: [
							{
								interactionId: "prior-element-1",
								parentId: "container-1",
								propertyKey: "elementReferences",
								objectId: REFERENCE_ID,
								value: null,
								command: "SET",
							},
						],
					},
				},
			},
		}); // transactionLogState -> element case resolves the current container next
		expect(containerStep.value).toMatchObject({ type: "CALL" });
		const markStep = gen.next({
			currentContainerElement: { id: "container-1" },
			wrapperElement: undefined,
		});
		expect(markStep.value).toMatchObject({
			type: "PUT",
			payload: { action: { type: InteractionLogActions.markPreventUndo.toString() } },
		});
		const markPayload = (markStep.value as { payload: { action: { payload: unknown } } }).payload.action
			.payload as { interactionIds: string[] };
		expect(markPayload.interactionIds).toEqual(["prior-element-1"]);
		expect(gen.next().done).toBe(false);
	});
});

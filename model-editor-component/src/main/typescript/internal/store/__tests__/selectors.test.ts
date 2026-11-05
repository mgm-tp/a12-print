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
import { configureStore } from "@reduxjs/toolkit";

import type { PrintModel, PrintModelElement } from "@com.mgmtp.a12.print/print-model-api/model";
import { ElementType, MeasureUnit, SegmentType } from "@com.mgmtp.a12.print/print-model-api/model";
import {
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	PRINT_MODEL_HEADER_LOG_ID,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	SEGMENTS_FRAGMENT_REFERENCES_ENTRY_ID,
	SidebarItem,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import {
	EditorStateReducer,
	InteractionLogReducer,
	NavigationReducer,
	RequestApiActions,
	RequestApiReducer,
	TransactionLogStateActions,
	TransactionLogStateReducer,
	ValidationReducer,
} from "../../redux/index.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import { createNavigationStateWithForm } from "../../../../../test/typescript/test-utils/index.js";

import { PrintEngineSelectors } from "../selectors.js";

const FRAGMENT_MODEL_ID = "fragment-model-1";
const OTHER_FRAGMENT_MODEL_ID = "fragment-model-2";

function measure(value: number) {
	return { id: `measure-${value}`, value, unit: MeasureUnit.Millimeter };
}

function fragmentDimensions(width: number, height: number) {
	return { id: "fd", width: measure(width), height: measure(height) };
}

function createTestStore() {
	return configureStore({
		reducer: {
			PrintEditorState: EditorStateReducer,
			Navigation: NavigationReducer,
			TransactionLogState: TransactionLogStateReducer,
			InteractionLogState: InteractionLogReducer,
			ValidationState: ValidationReducer,
			RequestApi: RequestApiReducer,
		},
	});
}

function buildFragmentModel(modelId: string, elementDefinitions: PrintModelElement[]): PrintModel {
	return {
		header: { id: modelId, modelType: "print", modelVersion: "4.0", description: "", annotations: [] },
		content: { id: `${modelId}-content`, elementDefinitions },
	} as unknown as PrintModel;
}

/** Seeds the local transaction log store with the given element definitions of the currently edited print model. */
function setLocalElements(store: ReturnType<typeof createTestStore>, elements: PrintModelElement[]): void {
	store.dispatch(
		TransactionLogStateActions.setLogStore({
			[PRINT_MODEL_HEADER_LOG_ID]: {
				id: PRINT_MODEL_HEADER_LOG_ID,
				log: [],
				memoizedObject: { id: PRINT_MODEL_HEADER_LOG_ID },
			},
			[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: {
				id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
				log: [],
				memoizedObject: { id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID },
			},
			segments: { id: "segments-id", map: {}, references: {} },
			watermarks: { id: "watermarks-id", map: {} },
			printModelElements: Object.fromEntries(
				elements.map(element => [element.id, { id: element.id, log: [], memoizedObject: element }])
			),
		} as never)
	);
}

describe("PrintEngineSelectors.isCurrentSegmentReferenced", () => {
	// A referenced segment is resolved under its reference id, so writing to it would create a local definition.
	// This is what keeps the height correction off a fragment segment (see HeightCalculationContainer).
	const SEGMENT_REFERENCE_ID = "seg-reference-1";

	function selectFor({ localSegmentIds = [], fragmentReferences = [] as { id: string; refId: string }[] }) {
		const store = createTestStore();
		store.dispatch(
			TransactionLogStateActions.setLogStore({
				[PRINT_MODEL_HEADER_LOG_ID]: {
					id: PRINT_MODEL_HEADER_LOG_ID,
					log: [],
					memoizedObject: { id: PRINT_MODEL_HEADER_LOG_ID },
				},
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: {
					id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
					log: [],
					memoizedObject: { id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID },
				},
				segments: {
					id: "segments-id",
					references: {},
					map: Object.fromEntries(
						(localSegmentIds as string[]).map(id => [
							id,
							{ id, log: [], memoizedObject: { id, elementReferences: [] } },
						])
					),
					fragmentReferencesEntry: {
						id: SEGMENTS_FRAGMENT_REFERENCES_ENTRY_ID,
						log: [],
						memoizedObject: {
							id: SEGMENTS_FRAGMENT_REFERENCES_ENTRY_ID,
							references: fragmentReferences.map(r => ({ ...r, model: FRAGMENT_MODEL_ID })),
						},
					},
				},
				watermarks: { id: "watermarks-id", map: {} },
				printModelElements: {},
			} as never)
		);
		const state = store.getState() as unknown as PrintEngineState;
		return PrintEngineSelectors.isCurrentSegmentReferenced({
			...state,
			Navigation: createNavigationStateWithForm(SidebarItem.SEGMENT, SEGMENT_REFERENCE_ID, []),
		} as unknown as PrintEngineState);
	}

	it("is true while a referenced segment is on the stage", () => {
		expect(selectFor({ fragmentReferences: [{ id: SEGMENT_REFERENCE_ID, refId: "frag-seg-1" }] })).toBe(true);
	});

	it("is false for a local segment of the same id", () => {
		expect(selectFor({ localSegmentIds: [SEGMENT_REFERENCE_ID] })).toBe(false);
	});

	it("is false when the segment on the stage is neither local nor a known reference", () => {
		expect(selectFor({})).toBe(false);
	});
});

describe("PrintEngineSelectors.textStyleEntries", () => {
	it("lists local text styles first and resolves referenced ones from the fragment model under their reference id", () => {
		const store = createTestStore();
		const fragmentModel = buildFragmentModel(FRAGMENT_MODEL_ID, []);
		store.dispatch(
			RequestApiActions.setFragmentModel({
				...fragmentModel,
				content: {
					...fragmentModel.content,
					textStyles: { id: "fragment-text-styles", definitions: [{ id: "fragment-ts", name: "Fragment" }] },
				},
			} as unknown as PrintModel)
		);
		store.dispatch(
			TransactionLogStateActions.setLogStore({
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: {
					id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
					log: [],
					memoizedObject: { id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID, textStyles: ["ref-ts", "local-ts"] },
				},
				textStyles: {
					id: "text-styles",
					map: { "local-ts": { id: "local-ts", log: [], memoizedObject: { id: "local-ts", name: "Local" } } },
					referencesEntry: {
						id: "text-style-references",
						log: [],
						memoizedObject: {
							id: "text-style-references",
							references: [
								{ id: "ref-ts", refId: "fragment-ts", model: FRAGMENT_MODEL_ID },
								{ id: "unresolved-ref-ts", refId: "missing-ts", model: FRAGMENT_MODEL_ID },
							],
						},
					},
				},
			} as never)
		);

		expect(PrintEngineSelectors.textStyleEntries(store.getState() as unknown as PrintEngineState)).toEqual([
			{ textStyle: { id: "local-ts", name: "Local" }, isFragment: false },
			{ textStyle: { id: "ref-ts", name: "Fragment" }, isFragment: true },
		]);
	});
});

describe("PrintEngineSelectors.isTextStyleUsedByPrintModel", () => {
	const TEXT_STYLE_ID = "text-style-1";
	const SEGMENT_ID = "segment-1";

	function textElement(id: string, textStyleId: string) {
		return {
			id,
			type: ElementType.Text,
			name: id,
			textProperties: { id: `${id}-tp`, textStyleId: { id: `${id}-ts`, value: textStyleId } },
		} as unknown as PrintModelElement;
	}

	function selectFor({
		printModelElements = [] as PrintModelElement[],
		fragmentModelElements = [] as PrintModelElement[],
	}) {
		const store = createTestStore();
		store.dispatch(
			RequestApiActions.setFragmentModel(buildFragmentModel(FRAGMENT_MODEL_ID, fragmentModelElements))
		);
		// Every element is placed in one segment; fragment model elements as element fragment references.
		const elementReferences = [
			...printModelElements.map(element => ({ id: `${element.id}-ref`, refId: element.id })),
			...fragmentModelElements.map(element => ({
				id: `${element.id}-ref`,
				refId: element.id,
				model: FRAGMENT_MODEL_ID,
			})),
		];
		store.dispatch(
			TransactionLogStateActions.setLogStore({
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: {
					id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
					log: [],
					memoizedObject: { id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID, structure: [SEGMENT_ID] },
				},
				segments: {
					id: "segments-id",
					references: {},
					map: {
						[SEGMENT_ID]: {
							id: SEGMENT_ID,
							log: [],
							memoizedObject: { id: SEGMENT_ID, type: SegmentType.Default, elementReferences },
						},
					},
				},
				printModelElements: Object.fromEntries(
					printModelElements.map(element => [
						element.id,
						{ id: element.id, log: [], memoizedObject: element },
					])
				),
			} as never)
		);
		return PrintEngineSelectors.isTextStyleUsedByPrintModel(
			store.getState() as unknown as PrintEngineState,
			TEXT_STYLE_ID
		);
	}

	it("is true when an element of the print model uses the text style", () => {
		expect(selectFor({ printModelElements: [textElement("local-el", TEXT_STYLE_ID)] })).toBe(true);
	});

	it("is false when only a referenced element fragment uses the text style", () => {
		expect(selectFor({ fragmentModelElements: [textElement("frag-el", TEXT_STYLE_ID)] })).toBe(false);
	});

	it("is true when a table header of the print model uses the text style", () => {
		const table = {
			id: "table",
			type: ElementType.Table,
			name: "table",
			table: {
				id: "table-content",
				headerTextProperties: { id: "htp", textStyleId: { id: "ts", value: TEXT_STYLE_ID } },
			},
		} as unknown as PrintModelElement;
		expect(selectFor({ printModelElements: [table] })).toBe(true);
	});

	it("is false when no element of the print model uses the text style", () => {
		expect(selectFor({ printModelElements: [textElement("local-el", "other-style")] })).toBe(false);
	});
});

describe("PrintEngineSelectors.selectableFragmentElements", () => {
	function selectFrom(...models: PrintModel[]) {
		const store = createTestStore();
		setLocalElements(store, []);
		models.forEach(model => store.dispatch(RequestApiActions.setFragmentModel(model)));
		return PrintEngineSelectors.selectableFragmentElements(store.getState() as unknown as PrintEngineState);
	}

	it("returns fragment elements of a loaded fragment model together with their owning model id", () => {
		const result = selectFrom(
			buildFragmentModel(FRAGMENT_MODEL_ID, [
				{
					id: "frag-el-1",
					type: ElementType.Text,
					name: "Fragment text",
					isFragment: true,
					fragmentDimensions: fragmentDimensions(40, 20),
				} as unknown as PrintModelElement,
			])
		);

		expect(result).toEqual([
			expect.objectContaining({
				model: FRAGMENT_MODEL_ID,
				element: expect.objectContaining({ id: "frag-el-1" }),
			}),
		]);
	});

	it("collects fragment elements across every loaded fragment model", () => {
		const result = selectFrom(
			buildFragmentModel(FRAGMENT_MODEL_ID, [
				{
					id: "frag-el-1",
					type: ElementType.Text,
					name: "a",
					isFragment: true,
					fragmentDimensions: fragmentDimensions(40, 20),
				} as unknown as PrintModelElement,
			]),
			buildFragmentModel(OTHER_FRAGMENT_MODEL_ID, [
				{
					id: "frag-el-2",
					type: ElementType.Text,
					name: "b",
					isFragment: true,
					fragmentDimensions: fragmentDimensions(10, 5),
				} as unknown as PrintModelElement,
			])
		);

		expect(result.map(entry => [entry.model, entry.element.id])).toEqual([
			[FRAGMENT_MODEL_ID, "frag-el-1"],
			[OTHER_FRAGMENT_MODEL_ID, "frag-el-2"],
		]);
	});

	it("ignores element definitions that are not marked as a fragment", () => {
		const result = selectFrom(
			buildFragmentModel(FRAGMENT_MODEL_ID, [
				{ id: "plain-el", type: ElementType.Text, name: "plain" } as unknown as PrintModelElement,
			])
		);

		expect(result).toEqual([]);
	});

	it("ignores a fragment element without fragmentDimensions, since it cannot be placed", () => {
		const result = selectFrom(
			buildFragmentModel(FRAGMENT_MODEL_ID, [
				{
					id: "frag-el-no-dimensions",
					type: ElementType.Text,
					name: "incomplete",
					isFragment: true,
				} as unknown as PrintModelElement,
			])
		);

		expect(result).toEqual([]);
	});

	it("returns nothing when no fragment model is loaded", () => {
		expect(selectFrom()).toEqual([]);
	});

	function fragmentElement(id: string, type: ElementType): PrintModelElement {
		return {
			id,
			type,
			name: id,
			isFragment: true,
			fragmentDimensions: fragmentDimensions(40, 20),
		} as unknown as PrintModelElement;
	}

	it("offers the fragments in the same order as the Element Library toolbox", () => {
		const result = selectFrom(
			buildFragmentModel(FRAGMENT_MODEL_ID, [
				fragmentElement("boundingBox", ElementType.BoundingBox),
				fragmentElement("table", ElementType.Table),
				fragmentElement("text", ElementType.Text),
			]),
			buildFragmentModel(OTHER_FRAGMENT_MODEL_ID, [fragmentElement("image", ElementType.Image)])
		);

		expect(result.map(entry => entry.element.id)).toEqual(["text", "image", "table", "boundingBox"]);
	});

	it("sorts element types the toolbox does not offer last, in model order", () => {
		const result = selectFrom(
			buildFragmentModel(FRAGMENT_MODEL_ID, [
				fragmentElement("pageNumber", ElementType.PageNumber),
				fragmentElement("override", ElementType.Override),
				fragmentElement("text", ElementType.Text),
			])
		);

		expect(result.map(entry => entry.element.id)).toEqual(["text", "pageNumber", "override"]);
	});

	it("keeps fragments of the same type in model order", () => {
		const result = selectFrom(
			buildFragmentModel(FRAGMENT_MODEL_ID, [
				fragmentElement("text-c", ElementType.Text),
				fragmentElement("text-a", ElementType.Text),
				fragmentElement("text-b", ElementType.Text),
			])
		);

		expect(result.map(entry => entry.element.id)).toEqual(["text-c", "text-a", "text-b"]);
	});
});

describe("PrintEngineSelectors.elementIdsWithoutOverrides", () => {
	// Guards the exception keeping Override placements out of arrow-key moves and Ctrl+C in BasicDefaultEditor.
	function selectFor(selectedIds: string[]) {
		const store = createTestStore();
		setLocalElements(store, [
			{ id: "text-el", type: ElementType.Text, name: "text" } as unknown as PrintModelElement,
			{ id: "override-el", type: ElementType.Override, name: "override" } as unknown as PrintModelElement,
			{ id: "area-el", type: ElementType.Area, name: "area" } as unknown as PrintModelElement,
		]);
		return PrintEngineSelectors.elementIdsWithoutOverrides(
			store.getState() as unknown as PrintEngineState,
			selectedIds
		);
	}

	it("drops Override elements from the selection", () => {
		expect(selectFor(["text-el", "override-el", "area-el"])).toEqual(["text-el", "area-el"]);
	});

	it("returns an empty list when only an Override is selected", () => {
		expect(selectFor(["override-el"])).toEqual([]);
	});

	it("keeps a selection that contains no Override untouched", () => {
		expect(selectFor(["text-el", "area-el"])).toEqual(["text-el", "area-el"]);
	});

	it("returns an empty list for an empty selection", () => {
		expect(selectFor([])).toEqual([]);
	});
});

describe("PrintEngineSelectors.currentViewInteractionList", () => {
	// The Element Library owns no interactions, so the undo/redo list must skip its
	// form region instead of rejecting an unknown form state.
	it("does not throw while the element library form is open", () => {
		const store = createTestStore();
		const state = store.getState() as unknown as PrintEngineState;
		const stateWithLibraryForm = {
			...state,
			Navigation: createNavigationStateWithForm(SidebarItem.SEGMENT, "segment-1", [{ type: "ElementLibrary" }]),
		} as unknown as PrintEngineState;

		expect(() => PrintEngineSelectors.currentViewInteractionList(stateWithLibraryForm)).not.toThrow();
		expect(PrintEngineSelectors.currentViewInteractionList(stateWithLibraryForm)).toEqual([]);
	});
});

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

import type { PrintModel } from "@com.mgmtp.a12.print/print-model-api/model";
import {
	PageOrientation,
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	PRINT_MODEL_HEADER_LOG_ID,
	SectionUsage,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	SECTIONS_REFERENCES_ENTRY_ID,
	SEGMENTS_FRAGMENT_REFERENCES_ENTRY_ID,
	TEXT_STYLES_REFERENCES_ENTRY_ID,
	WATERMARKS_REFERENCES_ENTRY_ID,
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
} from "../../index.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";

import { RequestApiSelectors } from "../selectors.js";

const FRAGMENT_MODEL_ID = "fragment-model-1";
const WATERMARK_PORTRAIT_ID = "wm-portrait-1";
const WATERMARK_LANDSCAPE_ID = "wm-landscape-1";
const REFERENCE_ID = "ref-1";

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

function buildFragmentModel(watermarks: { id: string; pageOrientation: PageOrientation }[]): PrintModel {
	return {
		header: { id: FRAGMENT_MODEL_ID, modelType: "print", modelVersion: "4.0", description: "", annotations: [] },
		content: {
			id: "c1",
			general: { id: "g1", segmentDefaults: { id: "sd1", fontSize: 12 } },
			elementDefinitions: [],
			watermarks: {
				id: "wc1",
				definitions: watermarks.map(wm => ({ ...wm, elementReferences: [] })),
				references: [],
			},
		},
	} as unknown as PrintModel;
}

interface TestStateOptions {
	headerModelReferences?: { id: string; reference: string; modelType: string; purpose: string }[];
	watermarkReferences?: { id: string; refId: string; model: string }[];
	fragmentWatermarks?: { id: string; pageOrientation: PageOrientation }[];
}

function setupTestState(options: TestStateOptions = {}): PrintEngineState {
	const store = createTestStore();

	store.dispatch(
		TransactionLogStateActions.setLogStore({
			[PRINT_MODEL_HEADER_LOG_ID]: {
				id: PRINT_MODEL_HEADER_LOG_ID,
				log: [],
				memoizedObject: {
					id: PRINT_MODEL_HEADER_LOG_ID,
					...(options.headerModelReferences && { modelReferences: options.headerModelReferences }),
				},
			},
			[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: {
				id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
				log: [],
				memoizedObject: { id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID },
			},
			segments: { id: "segments-id", map: {}, references: {} },
			watermarks: {
				id: "watermarks-id",
				map: {},
				...(options.watermarkReferences && {
					referencesEntry: {
						id: WATERMARKS_REFERENCES_ENTRY_ID,
						log: [],
						memoizedObject: {
							id: WATERMARKS_REFERENCES_ENTRY_ID,
							references: options.watermarkReferences,
						},
					},
				}),
			},
			printModelElements: {},
		})
	);

	if (options.fragmentWatermarks) {
		store.dispatch(RequestApiActions.setFragmentModel(buildFragmentModel(options.fragmentWatermarks)));
	}

	return store.getState() as unknown as PrintEngineState;
}

const FRAGMENT_MODEL_REFERENCE = {
	id: "model-ref-1",
	reference: FRAGMENT_MODEL_ID,
	modelType: "print",
	purpose: "print-fragment",
};
const BOTH_ORIENTATIONS = [
	{ id: WATERMARK_PORTRAIT_ID, pageOrientation: PageOrientation.Portrait },
	{ id: WATERMARK_LANDSCAPE_ID, pageOrientation: PageOrientation.Landscape },
];

const SECTION_PORTRAIT_FIRST_ID = "sec-portrait-first-1";
const SECTION_PORTRAIT_REMAINING_ID = "sec-portrait-remaining-1";
const SECTION_REFERENCE_ID = "sec-ref-1";

interface SectionTestStateOptions {
	headerModelReferences?: { id: string; reference: string; modelType: string; purpose: string }[];
	sectionReferences?: { id: string; refId: string; model: string; sectionUsage: SectionUsage }[];
	fragmentSections?: { id: string; pageOrientation: PageOrientation; sectionUsage?: SectionUsage }[];
}

function buildFragmentModelWithSections(
	sections: { id: string; pageOrientation: PageOrientation; sectionUsage?: SectionUsage }[]
): PrintModel {
	return {
		header: { id: FRAGMENT_MODEL_ID, modelType: "print", modelVersion: "4.0", description: "", annotations: [] },
		content: {
			id: "c1",
			general: { id: "g1", segmentDefaults: { id: "sd1", fontSize: 12 } },
			elementDefinitions: [],
			sections: {
				id: "sc1",
				definitions: sections.map(s => ({ ...s, elementReferences: [] })),
				references: [],
			},
		},
	} as unknown as PrintModel;
}

function setupSectionTestState(options: SectionTestStateOptions = {}): PrintEngineState {
	const store = createTestStore();
	store.dispatch(
		TransactionLogStateActions.setLogStore({
			[PRINT_MODEL_HEADER_LOG_ID]: {
				id: PRINT_MODEL_HEADER_LOG_ID,
				log: [],
				memoizedObject: {
					id: PRINT_MODEL_HEADER_LOG_ID,
					...(options.headerModelReferences && { modelReferences: options.headerModelReferences }),
				},
			},
			[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: {
				id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
				log: [],
				memoizedObject: { id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID },
			},
			segments: { id: "segments-id", map: {}, references: {} },
			sections: {
				id: "sections-id",
				map: {},
				...(options.sectionReferences && {
					referencesEntry: {
						id: SECTIONS_REFERENCES_ENTRY_ID,
						log: [],
						memoizedObject: {
							id: SECTIONS_REFERENCES_ENTRY_ID,
							references: options.sectionReferences,
						},
					},
				}),
			},
			printModelElements: {},
		})
	);
	if (options.fragmentSections) {
		store.dispatch(RequestApiActions.setFragmentModel(buildFragmentModelWithSections(options.fragmentSections)));
	}
	return store.getState() as unknown as PrintEngineState;
}

describe("RequestApiSelectors — fragment section resolution", () => {
	describe("resolvedSectionReferences", () => {
		it("maps every reference to its resolved section", () => {
			const state = setupSectionTestState({
				sectionReferences: [
					{
						id: SECTION_REFERENCE_ID,
						refId: SECTION_PORTRAIT_FIRST_ID,
						model: FRAGMENT_MODEL_ID,
						sectionUsage: SectionUsage.First,
					},
					{
						id: "sec-ref-2",
						refId: SECTION_PORTRAIT_REMAINING_ID,
						model: FRAGMENT_MODEL_ID,
						sectionUsage: SectionUsage.First,
					},
				],
				fragmentSections: [
					{
						id: SECTION_PORTRAIT_FIRST_ID,
						pageOrientation: PageOrientation.Portrait,
						sectionUsage: SectionUsage.First,
					},
					{
						id: SECTION_PORTRAIT_REMAINING_ID,
						pageOrientation: PageOrientation.Portrait,
						sectionUsage: SectionUsage.Remaining,
					},
				],
			});

			const result = RequestApiSelectors.resolvedSectionReferences(state);

			expect(result).toHaveLength(2);
			expect(result[0].reference.id).toBe(SECTION_REFERENCE_ID);
			expect(result[0].section?.id).toBe(SECTION_PORTRAIT_FIRST_ID);
			expect(result[1].reference.id).toBe("sec-ref-2");
			expect(result[1].section?.id).toBe(SECTION_PORTRAIT_REMAINING_ID);
		});

		it("resolves section as undefined when the fragment model is not loaded", () => {
			const state = setupSectionTestState({
				sectionReferences: [
					{
						id: SECTION_REFERENCE_ID,
						refId: SECTION_PORTRAIT_FIRST_ID,
						model: FRAGMENT_MODEL_ID,
						sectionUsage: SectionUsage.First,
					},
				],
			});

			const result = RequestApiSelectors.resolvedSectionReferences(state);

			expect(result).toHaveLength(1);
			expect(result[0].reference.id).toBe(SECTION_REFERENCE_ID);
			expect(result[0].section).toBeUndefined();
		});

		it("returns an empty array when no references exist", () => {
			const state = setupSectionTestState();

			const result = RequestApiSelectors.resolvedSectionReferences(state);

			expect(result).toHaveLength(0);
		});
	});

	describe("makeResolvedSectionForSlot", () => {
		it("returns the matching reference+section for the given slot via section sectionUsage", () => {
			const state = setupSectionTestState({
				headerModelReferences: [FRAGMENT_MODEL_REFERENCE],
				sectionReferences: [
					{
						id: SECTION_REFERENCE_ID,
						refId: SECTION_PORTRAIT_FIRST_ID,
						model: FRAGMENT_MODEL_ID,
						sectionUsage: SectionUsage.First,
					},
				],
				fragmentSections: [
					{
						id: SECTION_PORTRAIT_FIRST_ID,
						pageOrientation: PageOrientation.Portrait,
						sectionUsage: SectionUsage.First,
					},
				],
			});

			const result = RequestApiSelectors.makeResolvedSectionForSlot()(
				state,
				PageOrientation.Portrait,
				SectionUsage.First
			);

			expect(result).not.toBeUndefined();
			expect(result?.reference.id).toBe(SECTION_REFERENCE_ID);
			expect(result?.section.id).toBe(SECTION_PORTRAIT_FIRST_ID);
		});

		it("returns the matching reference+section for the given slot via sectionUsage", () => {
			const state = setupSectionTestState({
				headerModelReferences: [FRAGMENT_MODEL_REFERENCE],
				sectionReferences: [
					{
						id: SECTION_REFERENCE_ID,
						refId: SECTION_PORTRAIT_FIRST_ID,
						model: FRAGMENT_MODEL_ID,
						sectionUsage: SectionUsage.First,
					},
				],
				fragmentSections: [{ id: SECTION_PORTRAIT_FIRST_ID, pageOrientation: PageOrientation.Portrait }],
			});

			const result = RequestApiSelectors.makeResolvedSectionForSlot()(
				state,
				PageOrientation.Portrait,
				SectionUsage.First
			);

			expect(result).not.toBeUndefined();
			expect(result?.reference.id).toBe(SECTION_REFERENCE_ID);
		});

		it("returns undefined when there is no reference for the given slot", () => {
			const state = setupSectionTestState({
				sectionReferences: [
					{
						id: SECTION_REFERENCE_ID,
						refId: SECTION_PORTRAIT_FIRST_ID,
						model: FRAGMENT_MODEL_ID,
						sectionUsage: SectionUsage.First,
					},
				],
				fragmentSections: [
					{
						id: SECTION_PORTRAIT_FIRST_ID,
						pageOrientation: PageOrientation.Portrait,
						sectionUsage: SectionUsage.First,
					},
				],
			});

			const result = RequestApiSelectors.makeResolvedSectionForSlot()(
				state,
				PageOrientation.Portrait,
				SectionUsage.Remaining
			);

			expect(result).toBeUndefined();
		});

		it("returns undefined when no section references exist", () => {
			const state = setupSectionTestState();

			const result = RequestApiSelectors.makeResolvedSectionForSlot()(
				state,
				PageOrientation.Portrait,
				SectionUsage.First
			);

			expect(result).toBeUndefined();
		});
	});

	describe("makeAvailableFragmentSections", () => {
		it("returns every section matching the orientation, whatever its own sectionUsage is", () => {
			const state = setupSectionTestState({
				headerModelReferences: [FRAGMENT_MODEL_REFERENCE],
				fragmentSections: [
					{
						id: SECTION_PORTRAIT_FIRST_ID,
						pageOrientation: PageOrientation.Portrait,
						sectionUsage: SectionUsage.First,
					},
					{
						id: SECTION_PORTRAIT_REMAINING_ID,
						pageOrientation: PageOrientation.Portrait,
						sectionUsage: SectionUsage.Remaining,
					},
					{
						id: "sec-landscape-1",
						pageOrientation: PageOrientation.Landscape,
						sectionUsage: SectionUsage.First,
					},
				],
			});

			const items = RequestApiSelectors.makeAvailableFragmentSections()(state, PageOrientation.Portrait);

			expect(items.map(item => item.section.id)).toEqual([
				SECTION_PORTRAIT_FIRST_ID,
				SECTION_PORTRAIT_REMAINING_ID,
			]);
			expect(items[0].modelId).toBe(FRAGMENT_MODEL_ID);
		});

		it("returns empty array when no fragment models are loaded", () => {
			const state = setupSectionTestState({
				headerModelReferences: [FRAGMENT_MODEL_REFERENCE],
			});

			const items = RequestApiSelectors.makeAvailableFragmentSections()(state, PageOrientation.Portrait);

			expect(items).toHaveLength(0);
		});
	});
});

describe("RequestApiSelectors — fragment watermark resolution", () => {
	describe("resolvedWatermarkReferences", () => {
		it("maps every reference to its resolved watermark", () => {
			const state = setupTestState({
				watermarkReferences: [
					{ id: REFERENCE_ID, refId: WATERMARK_PORTRAIT_ID, model: FRAGMENT_MODEL_ID },
					{ id: "ref-2", refId: WATERMARK_LANDSCAPE_ID, model: FRAGMENT_MODEL_ID },
				],
				fragmentWatermarks: BOTH_ORIENTATIONS,
			});

			const result = RequestApiSelectors.resolvedWatermarkReferences(state);

			expect(result).toHaveLength(2);
			expect(result[0].reference.id).toBe(REFERENCE_ID);
			expect(result[0].watermark?.id).toBe(WATERMARK_PORTRAIT_ID);
			expect(result[1].reference.id).toBe("ref-2");
			expect(result[1].watermark?.id).toBe(WATERMARK_LANDSCAPE_ID);
		});

		it("resolves watermark as undefined when the fragment model is not loaded", () => {
			const state = setupTestState({
				watermarkReferences: [{ id: REFERENCE_ID, refId: WATERMARK_PORTRAIT_ID, model: FRAGMENT_MODEL_ID }],
			});

			const result = RequestApiSelectors.resolvedWatermarkReferences(state);

			expect(result).toHaveLength(1);
			expect(result[0].reference.id).toBe(REFERENCE_ID);
			expect(result[0].watermark).toBeUndefined();
		});

		it("returns an empty array when no references exist", () => {
			const state = setupTestState();

			const result = RequestApiSelectors.resolvedWatermarkReferences(state);

			expect(result).toHaveLength(0);
		});
	});

	describe("resolvedWatermarkForOrientation", () => {
		it("returns the matching reference+watermark for the given orientation", () => {
			const state = setupTestState({
				headerModelReferences: [FRAGMENT_MODEL_REFERENCE],
				watermarkReferences: [{ id: REFERENCE_ID, refId: WATERMARK_PORTRAIT_ID, model: FRAGMENT_MODEL_ID }],
				fragmentWatermarks: BOTH_ORIENTATIONS,
			});

			const result = RequestApiSelectors.makeResolvedWatermarkForOrientation()(state, PageOrientation.Portrait);

			expect(result).not.toBeUndefined();
			expect(result?.reference.id).toBe(REFERENCE_ID);
			expect(result?.watermark.id).toBe(WATERMARK_PORTRAIT_ID);
			expect(result?.watermark.pageOrientation).toBe(PageOrientation.Portrait);
		});

		it("returns undefined when there is no reference for the given orientation", () => {
			const state = setupTestState({
				watermarkReferences: [{ id: REFERENCE_ID, refId: WATERMARK_PORTRAIT_ID, model: FRAGMENT_MODEL_ID }],
				fragmentWatermarks: [{ id: WATERMARK_PORTRAIT_ID, pageOrientation: PageOrientation.Portrait }],
			});

			const result = RequestApiSelectors.makeResolvedWatermarkForOrientation()(state, PageOrientation.Landscape);

			expect(result).toBeUndefined();
		});

		it("returns undefined when no watermark references exist", () => {
			const state = setupTestState();

			const result = RequestApiSelectors.makeResolvedWatermarkForOrientation()(state, PageOrientation.Portrait);

			expect(result).toBeUndefined();
		});
	});

	describe("availableFragmentWatermarksForOrientation", () => {
		it("returns only matching-orientation watermarks from referenced fragment models", () => {
			const state = setupTestState({
				headerModelReferences: [FRAGMENT_MODEL_REFERENCE],
				fragmentWatermarks: BOTH_ORIENTATIONS,
			});

			const portraitItems = RequestApiSelectors.makeAvailableFragmentWatermarksForOrientation()(
				state,
				PageOrientation.Portrait
			);

			expect(portraitItems).toHaveLength(1);
			expect(portraitItems[0].watermark.id).toBe(WATERMARK_PORTRAIT_ID);
			expect(portraitItems[0].modelId).toBe(FRAGMENT_MODEL_ID);
		});

		it("returns empty array when no fragment models are loaded", () => {
			const state = setupTestState({
				headerModelReferences: [FRAGMENT_MODEL_REFERENCE],
			});

			const items = RequestApiSelectors.makeAvailableFragmentWatermarksForOrientation()(
				state,
				PageOrientation.Portrait
			);

			expect(items).toHaveLength(0);
		});
	});
});

const TEXT_STYLE_1_ID = "ts-frag-1";
const TEXT_STYLE_2_ID = "ts-frag-2";

function buildFragmentModelWithTextStyles(textStyles: { id: string }[]): PrintModel {
	return {
		header: { id: FRAGMENT_MODEL_ID, modelType: "print", modelVersion: "4.0", description: "", annotations: [] },
		content: {
			id: "c1",
			general: { id: "g1", segmentDefaults: { id: "sd1", fontSize: 12 } },
			elementDefinitions: [],
			textStyles: {
				id: "tsc1",
				definitions: textStyles,
				references: [],
			},
		},
	} as unknown as PrintModel;
}

function setupTextStyleTestState(options: {
	headerModelReferences?: { id: string; reference: string; modelType: string; purpose: string }[];
	textStyleReferences?: { id: string; refId: string; model: string }[];
	fragmentTextStyles?: { id: string }[];
}): PrintEngineState {
	const store = createTestStore();
	store.dispatch(
		TransactionLogStateActions.setLogStore({
			[PRINT_MODEL_HEADER_LOG_ID]: {
				id: PRINT_MODEL_HEADER_LOG_ID,
				log: [],
				memoizedObject: {
					id: PRINT_MODEL_HEADER_LOG_ID,
					...(options.headerModelReferences && { modelReferences: options.headerModelReferences }),
				},
			},
			[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: {
				id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
				log: [],
				memoizedObject: { id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID },
			},
			segments: { id: "segments-id", map: {}, references: {} },
			textStyles: {
				id: "text-styles-id",
				map: {},
				...(options.textStyleReferences && {
					referencesEntry: {
						id: TEXT_STYLES_REFERENCES_ENTRY_ID,
						log: [],
						memoizedObject: {
							id: TEXT_STYLES_REFERENCES_ENTRY_ID,
							references: options.textStyleReferences,
						},
					},
				}),
			},
			printModelElements: {},
		})
	);
	if (options.fragmentTextStyles) {
		store.dispatch(
			RequestApiActions.setFragmentModel(buildFragmentModelWithTextStyles(options.fragmentTextStyles))
		);
	}
	return store.getState() as unknown as PrintEngineState;
}

describe("RequestApiSelectors — fragment text style resolution", () => {
	describe("resolvedTextStyleReferences", () => {
		it("maps every reference to its resolved text style", () => {
			const state = setupTextStyleTestState({
				textStyleReferences: [
					{ id: "ts-ref-1", refId: TEXT_STYLE_1_ID, model: FRAGMENT_MODEL_ID },
					{ id: "ts-ref-2", refId: TEXT_STYLE_2_ID, model: FRAGMENT_MODEL_ID },
				],
				fragmentTextStyles: [{ id: TEXT_STYLE_1_ID }, { id: TEXT_STYLE_2_ID }],
			});

			const result = RequestApiSelectors.resolvedTextStyleReferences(state);

			expect(result).toHaveLength(2);
			expect(result[0].reference.id).toBe("ts-ref-1");
			expect(result[0].textStyle?.id).toBe(TEXT_STYLE_1_ID);
			expect(result[1].textStyle?.id).toBe(TEXT_STYLE_2_ID);
		});

		it("resolves text style as undefined when the fragment model is not loaded", () => {
			const state = setupTextStyleTestState({
				textStyleReferences: [{ id: "ts-ref-1", refId: TEXT_STYLE_1_ID, model: FRAGMENT_MODEL_ID }],
			});

			const result = RequestApiSelectors.resolvedTextStyleReferences(state);

			expect(result).toHaveLength(1);
			expect(result[0].textStyle).toBeUndefined();
		});

		it("returns an empty array when no references exist", () => {
			const state = setupTextStyleTestState({});

			expect(RequestApiSelectors.resolvedTextStyleReferences(state)).toHaveLength(0);
		});
	});

	describe("availableFragmentTextStyles", () => {
		it("returns fragment text styles that are not already referenced", () => {
			const state = setupTextStyleTestState({
				headerModelReferences: [FRAGMENT_MODEL_REFERENCE],
				textStyleReferences: [{ id: "ts-ref-1", refId: TEXT_STYLE_1_ID, model: FRAGMENT_MODEL_ID }],
				fragmentTextStyles: [{ id: TEXT_STYLE_1_ID }, { id: TEXT_STYLE_2_ID }],
			});

			const items = RequestApiSelectors.availableFragmentTextStyles(state);

			expect(items).toHaveLength(1);
			expect(items[0].textStyle.id).toBe(TEXT_STYLE_2_ID);
			expect(items[0].modelId).toBe(FRAGMENT_MODEL_ID);
		});

		it("returns an empty array when no fragment models are loaded", () => {
			const state = setupTextStyleTestState({ headerModelReferences: [FRAGMENT_MODEL_REFERENCE] });

			expect(RequestApiSelectors.availableFragmentTextStyles(state)).toHaveLength(0);
		});
	});
});

const SEGMENT_1_ID = "seg-frag-1";
const SEGMENT_2_ID = "seg-frag-2";

function buildFragmentModelWithSegments(segments: { id: string }[]): PrintModel {
	return {
		header: { id: FRAGMENT_MODEL_ID, modelType: "print", modelVersion: "4.0", description: "", annotations: [] },
		content: {
			id: "c1",
			general: { id: "g1", segmentDefaults: { id: "sd1", fontSize: 12 } },
			elementDefinitions: [],
			segments: {
				id: "sgc1",
				definitions: segments.map(s => ({ ...s, type: "Default", elementReferences: [] })),
				references: [],
			},
		},
	} as unknown as PrintModel;
}

function setupSegmentTestState(options: {
	headerModelReferences?: { id: string; reference: string; modelType: string; purpose: string }[];
	segmentFragmentReferences?: { id: string; refId: string; model: string }[];
	fragmentSegments?: { id: string }[];
}): PrintEngineState {
	const store = createTestStore();
	store.dispatch(
		TransactionLogStateActions.setLogStore({
			[PRINT_MODEL_HEADER_LOG_ID]: {
				id: PRINT_MODEL_HEADER_LOG_ID,
				log: [],
				memoizedObject: {
					id: PRINT_MODEL_HEADER_LOG_ID,
					...(options.headerModelReferences && { modelReferences: options.headerModelReferences }),
				},
			},
			[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: {
				id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
				log: [],
				memoizedObject: { id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID },
			},
			segments: {
				id: "segments-id",
				map: {},
				references: {},
				...(options.segmentFragmentReferences && {
					fragmentReferencesEntry: {
						id: SEGMENTS_FRAGMENT_REFERENCES_ENTRY_ID,
						log: [],
						memoizedObject: {
							id: SEGMENTS_FRAGMENT_REFERENCES_ENTRY_ID,
							references: options.segmentFragmentReferences,
						},
					},
				}),
			},
			printModelElements: {},
		})
	);
	if (options.fragmentSegments) {
		store.dispatch(RequestApiActions.setFragmentModel(buildFragmentModelWithSegments(options.fragmentSegments)));
	}
	return store.getState() as unknown as PrintEngineState;
}

describe("RequestApiSelectors — fragment segment resolution", () => {
	describe("resolvedSegmentFragmentReferences", () => {
		it("maps every reference to its resolved segment", () => {
			const state = setupSegmentTestState({
				segmentFragmentReferences: [
					{ id: "seg-ref-1", refId: SEGMENT_1_ID, model: FRAGMENT_MODEL_ID },
					{ id: "seg-ref-2", refId: SEGMENT_2_ID, model: FRAGMENT_MODEL_ID },
				],
				fragmentSegments: [{ id: SEGMENT_1_ID }, { id: SEGMENT_2_ID }],
			});

			const result = RequestApiSelectors.resolvedSegmentFragmentReferences(state);

			expect(result).toHaveLength(2);
			expect(result[0].reference.id).toBe("seg-ref-1");
			expect(result[0].segment?.id).toBe(SEGMENT_1_ID);
			expect(result[1].segment?.id).toBe(SEGMENT_2_ID);
		});

		it("resolves segment as undefined when the fragment model is not loaded", () => {
			const state = setupSegmentTestState({
				segmentFragmentReferences: [{ id: "seg-ref-1", refId: SEGMENT_1_ID, model: FRAGMENT_MODEL_ID }],
			});

			const result = RequestApiSelectors.resolvedSegmentFragmentReferences(state);

			expect(result).toHaveLength(1);
			expect(result[0].segment).toBeUndefined();
		});

		it("returns an empty array when no references exist", () => {
			const state = setupSegmentTestState({});

			expect(RequestApiSelectors.resolvedSegmentFragmentReferences(state)).toHaveLength(0);
		});
	});

	describe("availableFragmentSegments", () => {
		it("returns all fragment segments (multiple references of the same segment are allowed)", () => {
			const state = setupSegmentTestState({
				headerModelReferences: [FRAGMENT_MODEL_REFERENCE],
				segmentFragmentReferences: [{ id: "seg-ref-1", refId: SEGMENT_1_ID, model: FRAGMENT_MODEL_ID }],
				fragmentSegments: [{ id: SEGMENT_1_ID }, { id: SEGMENT_2_ID }],
			});

			const items = RequestApiSelectors.availableFragmentSegments(state);

			expect(items).toHaveLength(2);
			expect(items.map(item => item.segment.id)).toEqual([SEGMENT_1_ID, SEGMENT_2_ID]);
			expect(items[0].modelId).toBe(FRAGMENT_MODEL_ID);
		});

		it("returns an empty array when no fragment models are loaded", () => {
			const state = setupSegmentTestState({ headerModelReferences: [FRAGMENT_MODEL_REFERENCE] });

			expect(RequestApiSelectors.availableFragmentSegments(state)).toHaveLength(0);
		});
	});
});

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

import { DeepPartialErrorMap, ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";
import {
	ElementType,
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	PRINT_MODEL_HEADER_LOG_ID,
	SegmentType,
} from "@com.mgmtp.a12.print/print-model-api/model";
import type { TransactionLogStore } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import {
	EditorStateReducer,
	InteractionLogReducer,
	NavigationReducer,
	RequestApiReducer,
	TransactionLogStateReducer,
	ValidationReducer,
} from "../../index.js";
import { TransactionLogStateActions } from "../../transaction-log-state/actions.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";
import type { PrintModelErrorMap } from "../../../types/index.js";
import { createNavigationStateWithForm } from "../../../../../../test/typescript/test-utils/index.js";

import { ValidationActions } from "../actions.js";
import { ValidationSelectors } from "../selectors.js";

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

function createTransactionLogStoreWithFragmentElement(
	elementId: string,
	elementType: ElementType = ElementType.Text,
	options?: {
		sectionId?: string;
		segmentId?: string;
		watermarkId?: string;
	}
): TransactionLogStore {
	const store: TransactionLogStore = {
		[PRINT_MODEL_HEADER_LOG_ID]: {
			id: PRINT_MODEL_HEADER_LOG_ID,
			log: [],
			memoizedObject: { id: PRINT_MODEL_HEADER_LOG_ID },
		},
		[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: {
			id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
			log: [],
			memoizedObject: {
				id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
				structure: options?.segmentId ? [options.segmentId] : [],
				sections: options?.sectionId ? [options.sectionId] : undefined,
				watermarks: options?.watermarkId ? [options.watermarkId] : undefined,
			},
		},
		segments: {
			id: "segments-id",
			map: options?.segmentId
				? {
						[options.segmentId]: {
							id: options.segmentId,
							log: [],
							memoizedObject: {
								id: options.segmentId,
								type: SegmentType.Default,
								elementReferences: [],
								dataContexts: [],
								title: "Test Segment",
							},
						},
					}
				: {},
			references: {},
		},
		sections: options?.sectionId
			? {
					id: "sections-id",
					map: {
						[options.sectionId]: {
							id: options.sectionId,
							log: [],
							memoizedObject: {
								id: options.sectionId,
								elementReferences: [],
								title: "Test Section",
							},
						},
					},
				}
			: undefined,
		watermarks: options?.watermarkId
			? {
					id: "watermarks-id",
					map: {
						[options.watermarkId]: {
							id: options.watermarkId,
							log: [],
							memoizedObject: {
								id: options.watermarkId,
								elementReferences: [],
								title: "Test Watermark",
							},
						},
					},
				}
			: undefined,
		printModelElements: {
			[elementId]: {
				id: elementId,
				log: [],
				memoizedObject: {
					id: elementId,
					type: elementType,
					name: "fragment_text_element",
					isFragment: true,
				},
			},
		},
	};
	return store;
}

function createErrorMapWithElementErrors(elementId: string, errorCount: number): PrintModelErrorMap {
	const errors = Array.from({ length: errorCount }, (_, i) => ({
		errorCode: `required_field_${i}`,
		parameters: { rulePath: `elementDefinitions/${elementId}/requiredField` },
		errorMessage: [{ key: `field.required.${i}`, args: {} }],
	}));

	return {
		[ErrorSeverity.ERROR]: [],
		[ErrorSeverity.WARNING]: [],
		[ErrorSeverity.INFO]: [],
		content: {
			[ErrorSeverity.ERROR]: [],
			[ErrorSeverity.WARNING]: [],
			[ErrorSeverity.INFO]: [],
			elementDefinitions: [
				{
					"@id": elementId,
					"@type": ElementType.Text,
					[ErrorSeverity.ERROR]: errors,
					[ErrorSeverity.WARNING]: [],
					[ErrorSeverity.INFO]: [],
				},
			],
		},
	} as unknown as PrintModelErrorMap;
}

function createErrorMapWithFragmentTabErrors(options: {
	elementId?: string;
	elementErrors?: number;
	sectionId?: string;
	sectionErrors?: number;
	segmentId?: string;
	segmentErrors?: number;
	watermarkId?: string;
	watermarkErrors?: number;
}): PrintModelErrorMap {
	const makeErrors = (count: number, prefix: string) =>
		Array.from({ length: count }, (_, i) => ({
			errorCode: `${prefix}_${i}`,
			parameters: { rulePath: `${prefix}/requiredField` },
			errorMessage: [{ key: `${prefix}.required.${i}`, args: {} }],
		}));

	return {
		[ErrorSeverity.ERROR]: [],
		[ErrorSeverity.WARNING]: [],
		[ErrorSeverity.INFO]: [],
		content: {
			[ErrorSeverity.ERROR]: [],
			[ErrorSeverity.WARNING]: [],
			[ErrorSeverity.INFO]: [],
			elementDefinitions: options.elementId
				? [
						{
							"@id": options.elementId,
							"@type": ElementType.Text,
							[ErrorSeverity.ERROR]: makeErrors(options.elementErrors ?? 0, "element"),
							[ErrorSeverity.WARNING]: [],
							[ErrorSeverity.INFO]: [],
						},
					]
				: [],
			sections: options.sectionId
				? {
						[ErrorSeverity.ERROR]: [],
						[ErrorSeverity.WARNING]: [],
						[ErrorSeverity.INFO]: [],
						definitions: [
							{
								"@id": options.sectionId,
								[ErrorSeverity.ERROR]: makeErrors(options.sectionErrors ?? 0, "section"),
								[ErrorSeverity.WARNING]: [],
								[ErrorSeverity.INFO]: [],
							},
						],
					}
				: undefined,
			segments: options.segmentId
				? {
						[ErrorSeverity.ERROR]: [],
						[ErrorSeverity.WARNING]: [],
						[ErrorSeverity.INFO]: [],
						definitions: [
							{
								"@id": options.segmentId,
								[ErrorSeverity.ERROR]: makeErrors(options.segmentErrors ?? 0, "segment"),
								[ErrorSeverity.WARNING]: [],
								[ErrorSeverity.INFO]: [],
							},
						],
					}
				: undefined,
			watermarks: options.watermarkId
				? {
						[ErrorSeverity.ERROR]: [],
						[ErrorSeverity.WARNING]: [],
						[ErrorSeverity.INFO]: [],
						definitions: [
							{
								"@id": options.watermarkId,
								[ErrorSeverity.ERROR]: makeErrors(options.watermarkErrors ?? 0, "watermark"),
								[ErrorSeverity.WARNING]: [],
								[ErrorSeverity.INFO]: [],
							},
						],
					}
				: undefined,
		},
	} as unknown as PrintModelErrorMap;
}

describe("ValidationSelectors — Fragment Element Validation", () => {
	describe("sidebarValidationCounter", () => {
		it("8.1 — should report validation errors for fragment elements with empty required fields", () => {
			const elementId = "fragment-text-1";
			const store = createTestStore();

			store.dispatch(
				TransactionLogStateActions.setLogStore(
					createTransactionLogStoreWithFragmentElement(elementId, ElementType.Text)
				)
			);

			store.dispatch(ValidationActions.setErrorMap(createErrorMapWithElementErrors(elementId, 2)));

			const state = store.getState() as unknown as PrintEngineState;
			const result = ValidationSelectors.sidebarValidationCounter(state);

			expect(result[SidebarItem.FRAGMENT].error).toBe(2);
			expect(result[SidebarItem.FRAGMENT].warning).toBe(0);
		});

		it("8.2 — should report no validation errors when all required fields are filled", () => {
			const elementId = "fragment-text-1";
			const store = createTestStore();

			store.dispatch(
				TransactionLogStateActions.setLogStore(
					createTransactionLogStoreWithFragmentElement(elementId, ElementType.Text)
				)
			);

			store.dispatch(ValidationActions.setErrorMap(DeepPartialErrorMap.getEmptyMap()));

			const state = store.getState() as unknown as PrintEngineState;
			const result = ValidationSelectors.sidebarValidationCounter(state);

			expect(result[SidebarItem.FRAGMENT].error).toBe(0);
			expect(result[SidebarItem.FRAGMENT].warning).toBe(0);
		});

		it("should aggregate errors from fragment elements, segments, sections and watermarks", () => {
			const elementId = "fragment-text-1";
			const sectionId = "section-1";
			const segmentId = "segment-1";
			const watermarkId = "watermark-1";
			const store = createTestStore();

			store.dispatch(
				TransactionLogStateActions.setLogStore(
					createTransactionLogStoreWithFragmentElement(elementId, ElementType.Text, {
						sectionId,
						segmentId,
						watermarkId,
					})
				)
			);

			store.dispatch(
				ValidationActions.setErrorMap(
					createErrorMapWithFragmentTabErrors({
						elementId,
						elementErrors: 1,
						sectionId,
						sectionErrors: 2,
						segmentId,
						segmentErrors: 1,
						watermarkId,
						watermarkErrors: 1,
					})
				)
			);

			const state = store.getState() as unknown as PrintEngineState;
			const result = ValidationSelectors.sidebarValidationCounter(state);

			// 1 (element) + 2 (section) + 1 (segment) + 1 (watermark) = 5
			expect(result[SidebarItem.FRAGMENT].error).toBe(5);
			expect(result[SidebarItem.FRAGMENT].warning).toBe(0);
		});
	});

	describe("elementValidationCounterById", () => {
		it("should count errors for a fragment element by ID", () => {
			const elementId = "fragment-text-1";
			const store = createTestStore();

			store.dispatch(
				TransactionLogStateActions.setLogStore(
					createTransactionLogStoreWithFragmentElement(elementId, ElementType.Text)
				)
			);

			store.dispatch(ValidationActions.setErrorMap(createErrorMapWithElementErrors(elementId, 3)));

			const state = store.getState() as unknown as PrintEngineState;
			const result = ValidationSelectors.elementValidationCounterById(state, elementId);

			expect(result.error).toBe(3);
			expect(result.warning).toBe(0);
		});

		it("should return empty counter for a fragment element without errors", () => {
			const elementId = "fragment-text-1";
			const store = createTestStore();

			store.dispatch(
				TransactionLogStateActions.setLogStore(
					createTransactionLogStoreWithFragmentElement(elementId, ElementType.Text)
				)
			);

			store.dispatch(ValidationActions.setErrorMap(DeepPartialErrorMap.getEmptyMap()));

			const state = store.getState() as unknown as PrintEngineState;
			const result = ValidationSelectors.elementValidationCounterById(state, elementId);

			expect(result.error).toBe(0);
			expect(result.warning).toBe(0);
		});
	});
});

/** The list a container keeps its fragment references in. */
const REFERENCE_LIST = {
	segments: "fragmentReferences",
	sections: "references",
	watermarks: "references",
	textStyles: "references",
} as const;

/**
 * An error map as the validator produces it for a fragment reference: the reference itself being unresolvable, or
 * something inside the entity it refers to, which is reported at the reference as well.
 */
function createErrorMapWithReferenceErrors(
	container: keyof typeof REFERENCE_LIST,
	referenceId: string,
	fragmentTypes: ReadonlyArray<string>
): PrintModelErrorMap {
	const emptyMap = () => ({
		[ErrorSeverity.ERROR]: [],
		[ErrorSeverity.WARNING]: [],
		[ErrorSeverity.INFO]: [],
	});

	return {
		...emptyMap(),
		content: {
			...emptyMap(),
			[container]: {
				...emptyMap(),
				[REFERENCE_LIST[container]]: [
					{
						...emptyMap(),
						"@id": referenceId,
						[ErrorSeverity.ERROR]: fragmentTypes.map(fragmentType => ({
							errorCode: "print.validation.error",
							parameters: { fragmentType },
							errorMessage: [{ key: "print.validation.error", args: {} }],
						})),
					},
				],
			},
		},
	} as unknown as PrintModelErrorMap;
}

const REFERENCE_ID = "ref-1";

describe.each([
	["sectionReferenceValidationCounter", "sections", "section", ValidationSelectors.sectionReferenceValidationCounter],
	[
		"textStyleReferenceValidationCounter",
		"textStyles",
		"textStyle",
		ValidationSelectors.textStyleReferenceValidationCounter,
	],
	[
		"segmentFragmentReferenceValidationCounter",
		"segments",
		"segment",
		ValidationSelectors.segmentFragmentReferenceValidationCounter,
	],
	[
		"watermarkReferenceValidationCounter",
		"watermarks",
		"watermark",
		ValidationSelectors.watermarkReferenceValidationCounter,
	],
] as const)("ValidationSelectors — %s", (_name, container, fragmentType, counter) => {
	/*
	 * Everything about a fragment reference comes from the validator, which reports it at the reference - the entity it
	 * refers to has no definition in this print model to report anything at.
	 */
	it("counts the error of a reference that cannot be resolved", () => {
		const store = createTestStore();
		store.dispatch(
			ValidationActions.setErrorMap(createErrorMapWithReferenceErrors(container, REFERENCE_ID, [fragmentType]))
		);

		const state = store.getState() as unknown as PrintEngineState;

		expect(counter(state, REFERENCE_ID).error).toBe(1);
	});

	it("counts the errors of elements missing inside the referenced entity as well", () => {
		const store = createTestStore();
		store.dispatch(
			ValidationActions.setErrorMap(
				createErrorMapWithReferenceErrors(container, REFERENCE_ID, ["element", "element"])
			)
		);

		const state = store.getState() as unknown as PrintEngineState;

		expect(counter(state, REFERENCE_ID).error).toBe(2);
	});

	it("returns 0 errors for a reference the error map knows nothing about", () => {
		const store = createTestStore();
		store.dispatch(
			ValidationActions.setErrorMap(createErrorMapWithReferenceErrors(container, REFERENCE_ID, [fragmentType]))
		);

		const state = store.getState() as unknown as PrintEngineState;

		expect(counter(state, "unknown-reference-id").error).toBe(0);
	});

	it("returns 0 errors while the validation has not run with the fragment models at hand", () => {
		const store = createTestStore();
		store.dispatch(ValidationActions.setErrorMap(DeepPartialErrorMap.getEmptyMap()));

		const state = store.getState() as unknown as PrintEngineState;

		expect(counter(state, REFERENCE_ID).error).toBe(0);
	});
});

interface ModelReferenceFixture {
	id: string;
	reference: string;
	modelType: string;
	purpose?: string;
}

function createTransactionLogStoreWithModelReferences(
	modelReferences: ReadonlyArray<ModelReferenceFixture>
): TransactionLogStore {
	return {
		[PRINT_MODEL_HEADER_LOG_ID]: {
			id: PRINT_MODEL_HEADER_LOG_ID,
			log: [],
			memoizedObject: { id: PRINT_MODEL_HEADER_LOG_ID, modelReferences },
		},
		[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: {
			id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
			log: [],
			memoizedObject: { id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID, structure: [] },
		},
		segments: { id: "segments-id", map: {}, references: {} },
		printModelElements: {},
	};
}

/** An error map as `ReferenceDeclarationValidation` produces it: the broken declaration reported at its own id. */
function createErrorMapWithModelReferenceErrors(referenceId: string): PrintModelErrorMap {
	return {
		[ErrorSeverity.ERROR]: [],
		[ErrorSeverity.WARNING]: [],
		[ErrorSeverity.INFO]: [],
		header: {
			[ErrorSeverity.ERROR]: [],
			[ErrorSeverity.WARNING]: [],
			[ErrorSeverity.INFO]: [],
			modelReferences: [
				{
					"@id": referenceId,
					[ErrorSeverity.ERROR]: [
						{
							errorCode: "print.validation.error",
							errorMessage: [{ key: "print.validation.error", args: {} }],
						},
					],
					[ErrorSeverity.WARNING]: [],
					[ErrorSeverity.INFO]: [],
				},
			],
		},
	} as unknown as PrintModelErrorMap;
}

/** As `validateTypesettingUsages` reports it for a text style of a fragment model: at its reference, naming the field. */
function createErrorMapWithTextStyleReferenceWarning(referenceId: string, textStyleId: string): PrintModelErrorMap {
	return {
		[ErrorSeverity.ERROR]: [],
		[ErrorSeverity.WARNING]: [],
		[ErrorSeverity.INFO]: [],
		content: {
			[ErrorSeverity.ERROR]: [],
			[ErrorSeverity.WARNING]: [],
			[ErrorSeverity.INFO]: [],
			textStyles: {
				[ErrorSeverity.ERROR]: [],
				[ErrorSeverity.WARNING]: [],
				[ErrorSeverity.INFO]: [],
				references: [
					{
						"@id": referenceId,
						[ErrorSeverity.ERROR]: [],
						[ErrorSeverity.WARNING]: [
							{
								errorCode: "print.validation.error",
								parameters: { field: "typesettingModelName" },
								errorMessage: [{ key: "print.validation.error", args: {} }],
								refId: textStyleId,
							},
						],
						[ErrorSeverity.INFO]: [],
					},
				],
			},
		},
	} as unknown as PrintModelErrorMap;
}

describe("ValidationSelectors — Model Reference Declaration Validation", () => {
	it("counts a broken Document Model Reference in its panel counter and the Schema tab badge", () => {
		const referenceId = "doc-ref-1";
		const store = createTestStore();

		store.dispatch(
			TransactionLogStateActions.setLogStore(
				createTransactionLogStoreWithModelReferences([
					{ id: referenceId, reference: "MissingDocumentModel", modelType: "document" },
				])
			)
		);
		store.dispatch(ValidationActions.setErrorMap(createErrorMapWithModelReferenceErrors(referenceId)));

		const state = store.getState() as unknown as PrintEngineState;

		expect(ValidationSelectors.documentModelReferencesValidationCounter(state).error).toBe(1);
		expect(ValidationSelectors.fragmentModelReferencesValidationCounter(state).error).toBe(0);
		expect(ValidationSelectors.sidebarValidationCounter(state)[SidebarItem.SCHEMA].error).toBe(1);
	});

	it("counts a broken Fragment Model Reference in its panel counter and the Schema tab badge", () => {
		const referenceId = "fragment-ref-1";
		const store = createTestStore();

		store.dispatch(
			TransactionLogStateActions.setLogStore(
				createTransactionLogStoreWithModelReferences([
					{
						id: referenceId,
						reference: "MissingFragmentModel",
						modelType: "print",
						purpose: "print-fragment",
					},
				])
			)
		);
		store.dispatch(ValidationActions.setErrorMap(createErrorMapWithModelReferenceErrors(referenceId)));

		const state = store.getState() as unknown as PrintEngineState;

		expect(ValidationSelectors.fragmentModelReferencesValidationCounter(state).error).toBe(1);
		expect(ValidationSelectors.documentModelReferencesValidationCounter(state).error).toBe(0);
		expect(ValidationSelectors.sidebarValidationCounter(state)[SidebarItem.SCHEMA].error).toBe(1);
	});

	it("counts a broken Typesetting Model Reference in its panel counter and the Schema tab badge", () => {
		const referenceId = "typesetting-ref-1";
		const store = createTestStore();

		store.dispatch(
			TransactionLogStateActions.setLogStore(
				createTransactionLogStoreWithModelReferences([
					{ id: referenceId, reference: "MissingTypesettingModel", modelType: "typesetting" },
				])
			)
		);
		store.dispatch(ValidationActions.setErrorMap(createErrorMapWithModelReferenceErrors(referenceId)));

		const state = store.getState() as unknown as PrintEngineState;

		expect(ValidationSelectors.typesettingModelReferencesValidationCounter(state).error).toBe(1);
		expect(ValidationSelectors.documentModelReferencesValidationCounter(state).error).toBe(0);
		expect(ValidationSelectors.fragmentModelReferencesValidationCounter(state).error).toBe(0);
		expect(ValidationSelectors.sidebarValidationCounter(state)[SidebarItem.SCHEMA].error).toBe(1);
	});

	/*
	 * What is wrong with a field of a text style of a fragment model is reported at the reference that pulled it in,
	 * since that text style has no definition in this print model to report it at.
	 */
	it("finds the errors of a referenced text style through the id of the text style itself", () => {
		const referenceId = "text-style-ref-1";
		const textStyleId = "fragment-text-style-1";
		const store = createTestStore();

		store.dispatch(
			TransactionLogStateActions.setLogStore({
				...createTransactionLogStoreWithModelReferences([]),
				textStyles: {
					referencesEntry: {
						id: "text-styles-references",
						log: [],
						memoizedObject: {
							id: "text-styles-references",
							references: [{ id: referenceId, refId: textStyleId, model: "printFragment" }],
						},
					},
				},
			} as unknown as TransactionLogStore)
		);
		store.dispatch(
			ValidationActions.setErrorMap(createErrorMapWithTextStyleReferenceWarning(referenceId, textStyleId))
		);

		const state = store.getState() as unknown as PrintEngineState;

		const referenceError = ValidationSelectors.textStyleReferenceErrorByTextStyleId(state, textStyleId);
		expect(referenceError?.[ErrorSeverity.WARNING]).toHaveLength(1);
		expect(referenceError?.[ErrorSeverity.WARNING][0].parameters?.field).toBe("typesettingModelName");
	});

	it("reports no errors on the Schema tab badge when every declared reference resolves", () => {
		const store = createTestStore();

		store.dispatch(
			TransactionLogStateActions.setLogStore(
				createTransactionLogStoreWithModelReferences([
					{ id: "doc-ref-1", reference: "ExistingDocumentModel", modelType: "document" },
				])
			)
		);
		store.dispatch(ValidationActions.setErrorMap(DeepPartialErrorMap.getEmptyMap()));

		const state = store.getState() as unknown as PrintEngineState;

		expect(ValidationSelectors.sidebarValidationCounter(state)[SidebarItem.SCHEMA].error).toBe(0);
	});
});

describe("ValidationSelectors.formHeaderValidationCounter", () => {
	// The Element Library occupies the detail form panel but edits no model entity,
	// so the selector must stay silent instead of rejecting an unknown form state.
	it("returns no counter for the element library form", () => {
		const store = createTestStore();
		const state = store.getState() as unknown as PrintEngineState;

		const counter = ValidationSelectors.formHeaderValidationCounter({
			...state,
			Navigation: createNavigationStateWithForm(SidebarItem.SEGMENT, "segment-1", [{ type: "ElementLibrary" }]),
		} as unknown as PrintEngineState);

		expect(counter).toBeUndefined();
	});
});

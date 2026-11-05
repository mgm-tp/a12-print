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

import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";
import {
	ElementType,
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	PRINT_MODEL_HEADER_LOG_ID,
	SegmentType,
} from "@com.mgmtp.a12.print/print-model-api/model";
import type { PartialAnyPrintModelElement } from "@com.mgmtp.a12.print/print-model-api/model";
import type {
	TransactionLogStore,
	TransactionLogStoreEntryMap,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";
import { RESOURCE_KEYS } from "../../../localization/index.js";
import type { ErrorTreeNode, PrintModelErrorMap } from "../../../types/index.js";
import {
	CommitViewReducer,
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

import { CommitViewActions } from "../actions.js";
import { CommitViewSelectors } from "../selectors.js";

function createTestStore() {
	return configureStore({
		reducer: {
			PrintEditorState: EditorStateReducer,
			Navigation: NavigationReducer,
			TransactionLogState: TransactionLogStateReducer,
			InteractionLogState: InteractionLogReducer,
			ValidationState: ValidationReducer,
			RequestApi: RequestApiReducer,
			CommitViewState: CommitViewReducer,
		},
		middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false }),
	});
}

function createTransactionLogStore(options: {
	headerId?: string;
	fragmentElementId?: string;
	fragmentElementType?: ElementType;
	nonFragmentElementId?: string;
	nonFragmentElementType?: ElementType;
	segmentId?: string;
}): TransactionLogStore {
	const {
		headerId = "print-model-1",
		fragmentElementId,
		fragmentElementType = ElementType.Text,
		nonFragmentElementId,
		nonFragmentElementType = ElementType.Text,
		segmentId,
	} = options;

	const printModelElements: TransactionLogStoreEntryMap<PartialAnyPrintModelElement> = {};

	if (fragmentElementId) {
		printModelElements[fragmentElementId] = {
			id: fragmentElementId,
			log: [],
			memoizedObject: {
				id: fragmentElementId,
				type: fragmentElementType,
				name: "fragment_text_element",
				isFragment: true,
			},
		};
	}

	if (nonFragmentElementId) {
		printModelElements[nonFragmentElementId] = {
			id: nonFragmentElementId,
			log: [],
			memoizedObject: {
				id: nonFragmentElementId,
				type: nonFragmentElementType,
				name: "segment_text_element",
				isFragment: false,
			},
		};
	}

	const store: TransactionLogStore = {
		[PRINT_MODEL_HEADER_LOG_ID]: {
			id: PRINT_MODEL_HEADER_LOG_ID,
			log: [],
			memoizedObject: { id: headerId },
		},
		[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: {
			id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
			log: [],
			memoizedObject: {
				id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
				structure: segmentId ? [segmentId] : [],
			},
		},
		segments: {
			id: "segments-id",
			map: segmentId
				? {
						[segmentId]: {
							id: segmentId,
							log: [],
							memoizedObject: {
								id: segmentId,
								type: SegmentType.Default,
								elementReferences: nonFragmentElementId
									? [{ id: "ref-1", refId: nonFragmentElementId }]
									: [],
								dataContexts: [],
								title: "Test Segment",
							},
						},
					}
				: {},
			references: {},
		},
		printModelElements,
	};
	return store;
}

function createJsonPath(fieldName: string) {
	return [
		{ elementName: "content", index: 1, isRepeatable: false },
		{ elementName: "elementDefinitions", index: 1, isRepeatable: true },
		{ elementName: fieldName, index: 1, isRepeatable: false },
	];
}

function createErrorMapWithErrors(options: {
	elementId: string;
	errorCount: number;
	elementType?: ElementType;
}): PrintModelErrorMap {
	const { elementId, errorCount, elementType = ElementType.Text } = options;
	const errors = Array.from({ length: errorCount }, (_, i) => ({
		errorCode: `required_field_${i}`,
		parameters: { rulePath: `elementDefinitions/${elementId}/requiredField` },
		errorMessage: [{ key: `field.required.${i}`, args: {} }],
		jsonPath: createJsonPath(`requiredField_${i}`),
	}));

	return {
		[ErrorSeverity.ERROR]: errors,
		[ErrorSeverity.WARNING]: [],
		[ErrorSeverity.INFO]: [],
		content: {
			[ErrorSeverity.ERROR]: [],
			[ErrorSeverity.WARNING]: [],
			[ErrorSeverity.INFO]: [],
			elementDefinitions: [
				{
					"@id": elementId,
					"@type": elementType,
					[ErrorSeverity.ERROR]: errors,
					[ErrorSeverity.WARNING]: [],
					[ErrorSeverity.INFO]: [],
				},
			],
		},
	} as unknown as PrintModelErrorMap;
}

function createErrorMapWithMultipleElements(
	elements: Array<{ elementId: string; errorCount: number; elementType?: ElementType }>
): PrintModelErrorMap {
	const allErrors = elements.flatMap(({ elementId, errorCount }) =>
		Array.from({ length: errorCount }, (_, i) => ({
			errorCode: `required_field_${i}`,
			parameters: { rulePath: `elementDefinitions/${elementId}/requiredField` },
			errorMessage: [{ key: `field.required.${i}`, args: {} }],
			jsonPath: createJsonPath(`requiredField_${i}`),
		}))
	);

	const elementDefinitions = elements.map(({ elementId, errorCount, elementType = ElementType.Text }) => ({
		"@id": elementId,
		"@type": elementType,
		[ErrorSeverity.ERROR]: Array.from({ length: errorCount }, (_, i) => ({
			errorCode: `required_field_${i}`,
			parameters: { rulePath: `elementDefinitions/${elementId}/requiredField` },
			errorMessage: [{ key: `field.required.${i}`, args: {} }],
			jsonPath: createJsonPath(`requiredField_${i}`),
		})),
		[ErrorSeverity.WARNING]: [],
		[ErrorSeverity.INFO]: [],
	}));

	return {
		[ErrorSeverity.ERROR]: allErrors,
		[ErrorSeverity.WARNING]: [],
		[ErrorSeverity.INFO]: [],
		content: {
			[ErrorSeverity.ERROR]: [],
			[ErrorSeverity.WARNING]: [],
			[ErrorSeverity.INFO]: [],
			elementDefinitions,
		},
	} as unknown as PrintModelErrorMap;
}

interface TreeNode {
	id?: string;
	children?: TreeNode[];
}

function findTreeNodeById(children: TreeNode[] | undefined, idSuffix: string) {
	return children?.find(child => child.id?.endsWith(`.${idSuffix}`));
}

function countErrorLeaves(node: TreeNode | undefined): number {
	if (!node?.children || node.children.length === 0) {
		return 0;
	}
	let count = 0;
	for (const child of node.children) {
		if (child.children?.length) {
			count += countErrorLeaves(child);
		} else {
			count++;
		}
	}
	return count;
}

describe("CommitViewSelectors — Fragment Element Commit View", () => {
	describe("errorTreeState", () => {
		it("7.1 — should reflect validation errors for a fragment element in the commit view under the Fragment section", () => {
			const fragmentElementId = "fragment-text-1";
			const store = createTestStore();

			store.dispatch(TransactionLogStateActions.setLogStore(createTransactionLogStore({ fragmentElementId })));

			store.dispatch(
				CommitViewActions.setCommitViewErrorMap(
					createErrorMapWithErrors({ elementId: fragmentElementId, errorCount: 2 })
				)
			);

			const state = store.getState() as unknown as PrintEngineState;
			const errorTree = CommitViewSelectors.errorTreeState(state);

			expect(errorTree).not.toBeNull();
			expect(errorTree?.children?.length).toBeGreaterThan(0);

			// Find the Fragment section node in the error tree
			const fragmentNode = findTreeNodeById(errorTree?.children, SidebarItem.FRAGMENT);

			// Fragment node should exist and have children (element errors)
			expect(fragmentNode).toBeDefined();
			expect(fragmentNode?.children?.length).toBeGreaterThan(0);
		});

		it("7.2 — should not double-count errors between fragment and segment sections", () => {
			const fragmentElementId = "fragment-text-1";
			const nonFragmentElementId = "segment-text-1";
			const segmentId = "segment-1";
			const store = createTestStore();

			store.dispatch(
				TransactionLogStateActions.setLogStore(
					createTransactionLogStore({
						fragmentElementId,
						nonFragmentElementId,
						segmentId,
					})
				)
			);

			store.dispatch(
				CommitViewActions.setCommitViewErrorMap(
					createErrorMapWithMultipleElements([
						{ elementId: fragmentElementId, errorCount: 2 },
						{ elementId: nonFragmentElementId, errorCount: 3 },
					])
				)
			);

			const state = store.getState() as unknown as PrintEngineState;
			const errorTree = CommitViewSelectors.errorTreeState(state);

			expect(errorTree).not.toBeNull();

			// Find Fragment and Segment sections
			const fragmentNode = findTreeNodeById(errorTree?.children, SidebarItem.FRAGMENT);
			const segmentNode = findTreeNodeById(errorTree?.children, SidebarItem.SEGMENT);

			// Fragment section should only contain the fragment element errors
			expect(fragmentNode).toBeDefined();
			const fragmentErrorCount = countErrorLeaves(fragmentNode);
			expect(fragmentErrorCount).toBe(2);

			// Segment section should only contain the non-fragment element errors
			expect(segmentNode).toBeDefined();
			const segmentErrorCount = countErrorLeaves(segmentNode);
			expect(segmentErrorCount).toBe(3);
		});
	});

	describe("commit errors for fragments", () => {
		it("should return errors for a fragment element by ID", () => {
			const fragmentElementId = "fragment-text-1";
			const store = createTestStore();

			store.dispatch(TransactionLogStateActions.setLogStore(createTransactionLogStore({ fragmentElementId })));

			store.dispatch(
				CommitViewActions.setCommitViewErrorMap(
					createErrorMapWithErrors({ elementId: fragmentElementId, errorCount: 3 })
				)
			);

			const state = store.getState() as unknown as PrintEngineState;
			const result = CommitViewSelectors.elementCommitErrors(state, fragmentElementId);

			expect(result).toBeDefined();
			expect(result?.["@error"].length).toBe(3);
		});

		it("should return undefined for a non-existent element ID", () => {
			const store = createTestStore();

			store.dispatch(TransactionLogStateActions.setLogStore(createTransactionLogStore({})));

			store.dispatch(
				CommitViewActions.setCommitViewErrorMap(
					createErrorMapWithErrors({ elementId: "some-other-id", errorCount: 1 })
				)
			);

			const state = store.getState() as unknown as PrintEngineState;
			const result = CommitViewSelectors.elementCommitErrors(state, "non-existent-id");

			expect(result).toBeUndefined();
		});
	});
});

describe("CommitViewSelectors — Model Reference errors", () => {
	const documentReference = {
		id: "ref-document",
		modelType: "document",
		reference: "DomainText",
		purpose: "data binding",
	};
	const fragmentReference = {
		id: "ref-fragment",
		modelType: "print",
		reference: "Fragment",
		purpose: "print-fragment",
	};

	const emptyErrors = () => ({
		[ErrorSeverity.ERROR]: [],
		[ErrorSeverity.WARNING]: [],
		[ErrorSeverity.INFO]: [],
	});

	function createModelReferenceError(referenceIndex: number) {
		return {
			errorCode: "missing_fragment_model",
			severity: "ERROR",
			errorMessage: [{ key: "missing.fragment.model", args: {} }],
			jsonPath: [
				{ elementName: "header", index: 1, isRepeatable: false },
				{ elementName: "modelReferences", index: referenceIndex + 1, isRepeatable: true },
			],
		};
	}

	function createState(errorReferenceId: string) {
		const store = createTestStore();
		const logStore: TransactionLogStore = {
			...createTransactionLogStore({}),
			[PRINT_MODEL_HEADER_LOG_ID]: {
				id: PRINT_MODEL_HEADER_LOG_ID,
				log: [],
				memoizedObject: { id: "print-model-1", modelReferences: [documentReference, fragmentReference] },
			},
		};
		store.dispatch(TransactionLogStateActions.setLogStore(logStore));

		const error = createModelReferenceError(1);
		store.dispatch(
			CommitViewActions.setCommitViewErrorMap({
				...emptyErrors(),
				[ErrorSeverity.ERROR]: [error],
				header: {
					...emptyErrors(),
					[ErrorSeverity.ERROR]: [error],
					modelReferences: [
						{ "@id": documentReference.id, ...emptyErrors() },
						{ "@id": errorReferenceId, ...emptyErrors(), [ErrorSeverity.ERROR]: [error] },
					],
				},
			} as unknown as PrintModelErrorMap)
		);
		return store.getState() as unknown as PrintEngineState;
	}

	it("lists the error of a Model Reference under its Schema section and reference", () => {
		const errorTree = CommitViewSelectors.errorTreeState(createState(fragmentReference.id));

		const schemaNode = findTreeNodeById(errorTree?.children, SidebarItem.SCHEMA) as ErrorTreeNode | undefined;
		const [sectionNode] = schemaNode?.children ?? [];
		const [referenceNode] = sectionNode?.children ?? [];

		expect(schemaNode?.children).toHaveLength(1);
		expect(sectionNode?.path).toBe(RESOURCE_KEYS.sidebar.schema.tab.fragmentModelReferenced);
		expect(referenceNode?.label).toBe(fragmentReference.reference);
		expect(referenceNode?.children?.map(node => node.errorData?.errorCode)).toEqual(["missing_fragment_model"]);
	});

	it("does not list the error of a Model Reference under General", () => {
		const errorTree = CommitViewSelectors.errorTreeState(createState(fragmentReference.id));

		expect(findTreeNodeById(errorTree?.children, SidebarItem.GENERAL)).toBeUndefined();
	});

	it("lists the error of a Model Reference the Schema tab does not show directly under Schema", () => {
		const errorTree = CommitViewSelectors.errorTreeState(createState("ref-unknown"));

		const schemaNode = findTreeNodeById(errorTree?.children, SidebarItem.SCHEMA) as ErrorTreeNode | undefined;

		expect(schemaNode?.children?.map(node => node.errorData?.errorCode)).toEqual(["missing_fragment_model"]);
	});
});

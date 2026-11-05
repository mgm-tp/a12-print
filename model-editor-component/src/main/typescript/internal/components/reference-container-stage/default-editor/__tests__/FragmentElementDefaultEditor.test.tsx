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
import { fireEvent } from "@testing-library/react";
import React, { useContext, useState } from "react";
import type { Reducer } from "redux";

import {
	SidebarItem,
	TransactionLog,
	type TransactionLogStore,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { PartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/model";
import { ElementType, MeasureUnit } from "@com.mgmtp.a12.print/print-model-api/model";

import {
	createNavigationStateWithForm,
	initialStateLogStoreMock,
	mockElementLayoutMetrics,
	renderWithProviders,
	setupIgnoreTestWarning,
	TestWarningIdentifier,
} from "../../../../../../../test/typescript/test-utils/index.js";
import { initialStateLogStore, TransactionLogStateReducer } from "../../../../redux/index.js";
import { assertExists } from "../../../../utils/type-utils.js";
import { EDITOR_CONTEXT_DEFAULT_VALUE, EditorContext } from "../../../editor-stage/editor-context.js";

import { DefaultEditorRenderer } from "../DefaultEditorRenderer.js";

setupIgnoreTestWarning([TestWarningIdentifier.PRINT_UNKNOWN_ELEMENT, TestWarningIdentifier.ACT_WARNING]);
mockElementLayoutMetrics(800, 600);

const fragmentElementId = "fragment-text-element-123";
const fragmentElementMock = {
	id: fragmentElementId,
	type: ElementType.Text,
	isFragment: true,
	fragmentDimensions: {
		id: "fragment-dimensions-id",
		width: { id: "fragment-width-id", value: 40, unit: MeasureUnit.Millimeter },
		height: { id: "fragment-height-id", value: 20, unit: MeasureUnit.Millimeter },
	},
	name: "text_abc123",
	text: { id: "text-content-id", text: "Fragment text content" },
};

const transactionStateMock: TransactionLogStore = {
	...initialStateLogStoreMock,
	printModelElements: {
		[fragmentElementId]: TransactionLog.createStoreEntryPrintModelElement(
			initialStateLogStore.printModelElements,
			fragmentElementMock,
			"interaction-fragment-1"
		).storeEntry,
	},
};

const TransactionLogStateMock: Reducer = (state: TransactionLogStore = transactionStateMock, action) =>
	TransactionLogStateReducer(state, action);

const EditorContextProviderMock = ({ children }: { children: React.ReactNode }) => {
	const [elementReferences, setElementReferences] = useState<ReadonlyArray<PartialValidPlaceableReference>>([]);
	const prop = React.useMemo(
		() => ({ ...EDITOR_CONTEXT_DEFAULT_VALUE, elementReferences, setElementReferences }),
		[elementReferences, setElementReferences]
	);
	return <EditorContext.Provider value={prop}>{children}</EditorContext.Provider>;
};

describe("FragmentElementDefaultEditor", () => {
	describe("Fragment element renders FragmentElementDefaultEditor", () => {
		it("should render the editor stage when navigation is set to fragment tab with a fragment element", () => {
			const { getByTestId } = renderWithProviders(<DefaultEditorRenderer />, {
				Navigation: () => createNavigationStateWithForm(SidebarItem.FRAGMENT, fragmentElementId, []),
				TransactionLogState: TransactionLogStateMock,
			});

			expect(getByTestId("editor-stage")).toBeInTheDocument();
		});

		it("should not render editor stage when no fragment element is active", () => {
			const noElementStateMock: TransactionLogStore = {
				...initialStateLogStoreMock,
				printModelElements: {},
			};
			const NoElementTransactionLogStateMock: Reducer = (
				state: TransactionLogStore = noElementStateMock,
				action
			) => TransactionLogStateReducer(state, action);

			const { getByTestId } = renderWithProviders(<DefaultEditorRenderer />, {
				Navigation: () => createNavigationStateWithForm(SidebarItem.FRAGMENT, "", []),
				TransactionLogState: NoElementTransactionLogStateMock,
			});

			expect(getByTestId("editor-stage")).toBeInTheDocument();
		});
	});

	describe("fragment element sets element references in EditorContext", () => {
		const EditorContextProbe = () => {
			const { elementReferences } = useContext(EditorContext);
			return (
				<div data-testid="context-probe">
					{elementReferences.map(ref => (
						<span key={ref.refId} data-testid={`ref-${ref.refId}`}>
							{ref.refId}
						</span>
					))}
				</div>
			);
		};

		it("should set a synthetic reference with the fragment element's refId when a fragment element is active", () => {
			const { getByTestId } = renderWithProviders(
				<EditorContextProviderMock>
					<DefaultEditorRenderer />
					<EditorContextProbe />
				</EditorContextProviderMock>,
				{
					Navigation: () => createNavigationStateWithForm(SidebarItem.FRAGMENT, fragmentElementId, []),
					TransactionLogState: TransactionLogStateMock,
				}
			);

			expect(getByTestId(`ref-${fragmentElementId}`)).toBeInTheDocument();
			expect(getByTestId(`ref-${fragmentElementId}`)).toHaveTextContent(fragmentElementId);
		});

		it("should not set element references when no fragment element exists", () => {
			const noElementStateMock: TransactionLogStore = {
				...initialStateLogStoreMock,
				printModelElements: {},
			};
			const NoElementTransactionLogStateMock: Reducer = (
				state: TransactionLogStore = noElementStateMock,
				action
			) => TransactionLogStateReducer(state, action);

			const { getByTestId, queryByTestId } = renderWithProviders(
				<EditorContextProviderMock>
					<DefaultEditorRenderer />
					<EditorContextProbe />
				</EditorContextProviderMock>,
				{
					Navigation: () => createNavigationStateWithForm(SidebarItem.FRAGMENT, "", []),
					TransactionLogState: NoElementTransactionLogStateMock,
				}
			);

			expect(getByTestId("context-probe")).toBeInTheDocument();
			expect(queryByTestId(`ref-${fragmentElementId}`)).not.toBeInTheDocument();
		});
	});

	describe("dragging on the fragment stage", () => {
		it("should not start dragging the fragment element", () => {
			const { container } = renderWithProviders(
				<EditorContextProviderMock>
					<DefaultEditorRenderer />
				</EditorContextProviderMock>,
				{
					Navigation: () => createNavigationStateWithForm(SidebarItem.FRAGMENT, fragmentElementId, []),
					TransactionLogState: TransactionLogStateMock,
				}
			);

			const dragSource = container.querySelector<HTMLElement>("[draggable='true']");
			assertExists(dragSource, "Fragment element must be rendered as drag source");

			fireEvent.dragStart(dragSource, {
				dataTransfer: { setData: () => {}, setDragImage: () => {}, types: [] },
			});

			expect(dragSource).toHaveStyle({ opacity: "1" });
		});
	});
});

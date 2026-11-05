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
import type { Reducer } from "redux";
import { act, fireEvent, within } from "@testing-library/react";

import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { TransactionLogStore } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import {
	DIN_TEMPLATE_SEGMENT_ID,
	FRAGMENT_MODEL_ID,
	buildFragmentElement,
	buildPrintModel,
	createNavigationStateWithForm,
	createTransactionLogState,
	defaultPrintEditorState,
	initialStateLogStoreMock,
	logStoreWithDinTemplateSegment,
	logStoreWithIncomingDinTemplateReference,
	mockSegment,
	renderWithProviders,
} from "../../../../../../test/typescript/test-utils/index.js";
import {
	EditorStateReducer,
	NavigationReducer,
	NavigationSelectors,
	RequestApiActions,
	type PrintEditorState,
} from "../../../redux/index.js";
import type { NavigationState } from "../../../redux/index.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";

import { ElementLibraryFormContainer } from "../element-library-form/ElementLibraryFormContainer.js";

function renderForm({
	entityId = mockSegment.id,
	logStore = initialStateLogStoreMock,
	isDinEditable = false,
}: {
	entityId?: string;
	logStore?: TransactionLogStore;
	isDinEditable?: boolean;
} = {}) {
	const initialNavigationState = createNavigationStateWithForm(SidebarItem.SEGMENT, entityId, [
		{ type: "ElementLibrary" },
	]);
	const navigationReducer: Reducer = (state: NavigationState = initialNavigationState, action) =>
		NavigationReducer(state, action);
	const editorStateReducer: Reducer = (
		state: PrintEditorState = { ...defaultPrintEditorState, isDinEditable },
		action
	) => EditorStateReducer(state, action);

	return renderWithProviders(<ElementLibraryFormContainer />, {
		Navigation: navigationReducer,
		TransactionLogState: createTransactionLogState(logStore),
		PrintEditorState: editorStateReducer,
	});
}

const warningTitle = (container: HTMLElement) =>
	container.querySelector('[data-role="plasma-icon"][title]')?.getAttribute("title");

const panelTitles = (container: HTMLElement) =>
	Array.from(container.querySelectorAll('[data-role="collapsible-panel-title"]'), title => title.textContent);

describe("ElementLibraryFormContainer", () => {
	it("renders the element library headline", () => {
		const { getByRole } = renderForm();

		expect(getByRole("heading", { name: "Element Library" })).toBeInTheDocument();
	});

	it("hides the fragment library while no fragment elements are loaded", () => {
		const { container } = renderForm();

		expect(panelTitles(container)).toEqual(["Elements"]);
	});

	it("shows the fragment library once fragment elements are loaded", () => {
		const { container, store } = renderForm();

		act(() => {
			store.dispatch(
				RequestApiActions.setFragmentModel(
					buildPrintModel(
						{ elementDefinitions: [buildFragmentElement("frag-el-1", 40, 20)] },
						FRAGMENT_MODEL_ID
					)
				)
			);
		});

		expect(panelTitles(container)).toEqual(["Elements", "Element Fragment Library"]);
	});

	it("separates the form headline from the element panel title", () => {
		const { container, getByRole } = renderForm();

		expect(getByRole("heading", { name: "Element Library" })).toBeInTheDocument();
		expect(panelTitles(container)).toEqual(["Elements"]);
	});

	it("shows no DIN warning for an ordinary segment", () => {
		const { container } = renderForm();

		expect(warningTitle(container)).toBeUndefined();
	});

	it("warns that only a Bounding Box is addable while the model is an incoming DIN template", () => {
		const { container } = renderForm({ logStore: logStoreWithIncomingDinTemplateReference });

		expect(warningTitle(container)).toBe(
			"This model is currently being used as a DINTemplate, therefore only BoundingBox is addable."
		);
	});

	it("warns that no elements may be added in a locked DIN template segment editor", () => {
		const { container } = renderForm({
			entityId: DIN_TEMPLATE_SEGMENT_ID,
			logStore: logStoreWithDinTemplateSegment,
			isDinEditable: false,
		});

		expect(warningTitle(container)).toBe(
			"This is a DINTemplate Segment, therefore no elements are allowed to add."
		);
	});

	it("drops the DIN template segment warning once DIN editing is allowed", () => {
		const { container } = renderForm({
			entityId: DIN_TEMPLATE_SEGMENT_ID,
			logStore: logStoreWithDinTemplateSegment,
			isDinEditable: true,
		});

		expect(warningTitle(container)).toBeUndefined();
	});

	it("closes the panel through the shared form header", () => {
		const { container, store } = renderForm();

		fireEvent.click(within(container).getByTitle("Close"));

		expect(NavigationSelectors.currentForm(store.getState() as unknown as PrintEngineState)).toBeUndefined();
	});
});

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
import { fireEvent, within } from "@testing-library/react";

import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";

import {
	createNavigationStateWithForm,
	createTransactionLogState,
	defaultPrintEditorState,
	mockSegment,
	renderWithProviders,
} from "../../../../../../test/typescript/test-utils/index.js";
import {
	EditorStateReducer,
	NavigationReducer,
	NavigationSelectors,
	type PrintEditorState,
} from "../../../redux/index.js";
import type { AnyFormState, NavigationState } from "../../../redux/index.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";
import { EditorContext, EDITOR_CONTEXT_DEFAULT_VALUE } from "../../editor-stage/editor-context.js";

import { ElementLibraryButton } from "../ElementLibraryButton.js";

const PrintEditorStateMock: Reducer = (state: PrintEditorState = defaultPrintEditorState, action) =>
	EditorStateReducer(state, action);

function renderButton(formStack: AnyFormState[] = [], isReadonly = false) {
	const initialNavigationState = createNavigationStateWithForm(SidebarItem.SEGMENT, mockSegment.id, formStack);
	// A real reducer seeded with the segment on the stage, so the toggle saga can actually run.
	const navigationReducer: Reducer = (state: NavigationState = initialNavigationState, action) =>
		NavigationReducer(state, action);

	return renderWithProviders(
		<EditorContext.Provider value={{ ...EDITOR_CONTEXT_DEFAULT_VALUE, isReadonly }}>
			<ElementLibraryButton />
		</EditorContext.Provider>,
		{
			Navigation: navigationReducer,
			TransactionLogState: createTransactionLogState(),
			PrintEditorState: PrintEditorStateMock,
		}
	);
}

function currentFormOf(store: { getState: () => unknown }) {
	return NavigationSelectors.currentForm(store.getState() as PrintEngineState);
}

describe("ElementLibraryButton", () => {
	it("opens the element library form when clicked", () => {
		const { container, store } = renderButton();

		fireEvent.click(within(container).getByRole("button"));

		expect(currentFormOf(store)).toEqual({ type: "ElementLibrary" });
	});

	it("closes the element library form when clicked again", () => {
		const { container, store } = renderButton([{ type: "ElementLibrary" }]);

		fireEvent.click(within(container).getByRole("button"));

		expect(currentFormOf(store)).toBeUndefined();
	});

	it("replaces an open element form with the element library", () => {
		const { container, store } = renderButton([{ type: ElementType.Text, id: "element-1" }]);

		fireEvent.click(within(container).getByRole("button"));

		expect(currentFormOf(store)).toEqual({ type: "ElementLibrary" });
	});

	it("is highlighted while the element library form is the current form", () => {
		const { container: closedContainer } = renderButton([{ type: ElementType.Text, id: "element-1" }]);
		const closedClasses = within(closedContainer).getByRole("button").className;

		const { container: openContainer } = renderButton([{ type: "ElementLibrary" }]);

		expect(within(openContainer).getByRole("button").className).not.toEqual(closedClasses);
	});

	it("is disabled in a readonly editor", () => {
		const { container } = renderButton([], true);

		expect(within(container).getByRole("button")).toBeDisabled();
	});

	it("is disabled while no entity is on the stage", () => {
		const { container } = renderWithProviders(<ElementLibraryButton />, { Navigation: NavigationReducer });

		expect(within(container).getByRole("button")).toBeDisabled();
	});
});

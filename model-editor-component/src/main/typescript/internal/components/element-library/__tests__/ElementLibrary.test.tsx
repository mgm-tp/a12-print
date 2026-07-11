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
import { fireEvent, screen } from "@testing-library/react";

import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import {
	createNavigationStateWithForm,
	createTransactionLogState,
	defaultPrintEditorState,
	mockElementLayoutMetrics,
	mockSegment,
	renderWithProviders,
} from "../../../../../../test/typescript/test-utils/index.js";
import { EditorStateReducer, NavigationReducer, type PrintEditorState } from "../../../redux/index.js";

import { ElementLibrary } from "../ElementLibrary.js";

describe("ElementLibrary with selected segment", () => {
	// Mock element dimensions to prevent infinite resizing loops
	mockElementLayoutMetrics(100, 300);

	const PrintEditorStateMock: Reducer = (state: PrintEditorState = defaultPrintEditorState, action) =>
		EditorStateReducer(state, action);

	it("renders correctly", () => {
		const { container, getByRole } = renderWithProviders(<ElementLibrary />, {
			Navigation: () => createNavigationStateWithForm(SidebarItem.SEGMENT, mockSegment.id, []),
			TransactionLogState: createTransactionLogState(),
			PrintEditorState: PrintEditorStateMock,
		});

		expect(container.getElementsByClassName("plasma-icon")).toHaveLength(1);

		fireEvent.click(getByRole("button"));

		expect(screen.getByText(/add element/i)).toBeInTheDocument();
		expect(document.body).toMatchSnapshot();
	});
});

describe("ElementLibrary without segment selected", () => {
	it("should not show CommentContainer when clicking elementLibraryButton", () => {
		const { getByRole } = renderWithProviders(<ElementLibrary />, {
			Navigation: NavigationReducer,
		});

		fireEvent.click(getByRole("button"));
		expect(screen.queryByText(/add element/i)).not.toBeInTheDocument();
	});
});

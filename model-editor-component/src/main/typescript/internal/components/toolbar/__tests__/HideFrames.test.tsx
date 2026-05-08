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
import { useSelector } from "react-redux";
import { fireEvent } from "@testing-library/react";
import { Reducer } from "redux";

import { PrintEngineSelectors } from "../../../store/selectors.js";
import {
	createTransactionLogState,
	defaultPrintEditorState,
	renderWithProviders,
} from "../../../../../../test/typescript/test-utils/index.js";
import { EditorStateReducer, PrintEditorState } from "../../../redux/index.js";

import { HideFrames } from "../toolbar-item/HideFrames.js";

describe("toggleShowFramesButton", () => {
	const MockComponent = () => {
		const showBorders = useSelector(PrintEngineSelectors.showBordersEditor);

		return <div style={{ borderWidth: showBorders ? 1 : 0 }}>Mock</div>;
	};

	const PrintEditorStateMock: Reducer = (state: PrintEditorState = defaultPrintEditorState, action) =>
		EditorStateReducer(state, action);

	it("should toggle border visibility", () => {
		const { getByText, queryByText } = renderWithProviders(
			<>
				<MockComponent />
				<HideFrames />
			</>,
			{
				TransactionLogState: createTransactionLogState(),
				PrintEditorState: PrintEditorStateMock,
			}
		);

		expect(getByText("Hide Frames")).toBeInTheDocument();
		expect(getByText("Mock")).toHaveStyle({ "border-width": "1px" });

		fireEvent.click(getByText("Hide Frames"));

		expect(getByText("Show Frames")).toBeInTheDocument();
		expect(queryByText("Hide Frames")).not.toBeInTheDocument();
		expect(getByText("Mock")).toHaveStyle({ "border-width": "0px" });
	});
});

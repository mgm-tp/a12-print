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
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import type { Reducer } from "redux";

import {
	createTransactionLogState,
	defaultPrintEditorState,
	renderWithProviders,
} from "../../../../../../test/typescript/test-utils/index.js";
import type { PrintEditorState } from "../../../redux/index.js";
import { EditorStateReducer } from "../../../redux/index.js";

import { TextStyles } from "../TextStyles.js";

describe("TextStyles", () => {
	const PrintEditorStateMock: Reducer = (state: PrintEditorState = defaultPrintEditorState, action) =>
		EditorStateReducer(state, action);
	const setupTest = () =>
		renderWithProviders(<TextStyles />, {
			TransactionLogState: createTransactionLogState(),
			PrintEditorState: PrintEditorStateMock,
		});

	it("render correctly", () => {
		const { container, queryByText } = setupTest();

		expect(container).toMatchSnapshot();
		expect(queryByText(/^lorem ipsum dolor sit amet/i)).toBeInTheDocument();
		expect(queryByText(/add new text style/i)).toBeInTheDocument();
		expect(queryByText(/default text style/i)).toBeInTheDocument();
	});

	it("should add new text style", () => {
		const { queryByText, getByText } = setupTest();

		expect(queryByText(/^new text style/i)).not.toBeInTheDocument();

		fireEvent.click(getByText(/add new text style/i));

		expect(queryByText(/^new text style/i)).toBeInTheDocument();
	});

	it("should duplicate text style", () => {
		const { queryByText, queryAllByText, getByText, getAllByLabelText } = setupTest();

		expect(queryByText(/^new text style/i)).not.toBeInTheDocument();

		fireEvent.click(getByText(/add new text style/i));

		expect(queryAllByText(/^new text style/i)).toHaveLength(1);

		const menuButtons = getAllByLabelText("Open Menu");

		expect(menuButtons).toHaveLength(2);

		fireEvent.click(menuButtons[1]);
		fireEvent.click(screen.getByLabelText("Duplicate"));

		expect(queryAllByText(/^new text style/i)).toHaveLength(2);
	});

	it("should show confirm dialog to delete text style", async () => {
		const { getAllByLabelText, getByText, queryAllByText } = renderWithProviders(<TextStyles />, {
			TransactionLogState: createTransactionLogState(),
		});

		fireEvent.click(getByText(/add new text style/i));
		expect(queryAllByText(/^new text style/i)).toHaveLength(1);

		const menuButtons = getAllByLabelText("Open Menu");
		expect(menuButtons).toHaveLength(2);
		expect(screen.queryByText(/confirm to delete/i)).not.toBeInTheDocument();

		fireEvent.click(menuButtons[1]);
		fireEvent.click(screen.getByLabelText("Delete"));

		expect(screen.queryByText(/confirm to delete/i)).toBeInTheDocument();
	});

	describe("Text Style Editor", () => {
		it("should update text style name", () => {
			const { getAllByTestId, getByText, getByDisplayValue } = setupTest();
			fireEvent.click(getByText(/add new text style/i));

			const textStyleCards = getAllByTestId("text-style-card-name");
			expect(textStyleCards).toHaveLength(2);

			const { queryByText: queryByCardText } = within(textStyleCards[1]);
			expect(queryByCardText("New Text Style")).toBeInTheDocument();
			fireEvent.click(textStyleCards[1]);

			const nameInput = getByDisplayValue("New Text Style");
			expect(nameInput).toBeInTheDocument();

			fireEvent.change(nameInput, { target: { value: "Updated Text Style" } });
			expect(getByDisplayValue("Updated Text Style")).toBeInTheDocument();

			fireEvent.blur(nameInput);
			expect(queryByCardText("New Text Style")).not.toBeInTheDocument();
			expect(queryByCardText("Updated Text Style")).toBeInTheDocument();
		});

		it("should update text style semantic", () => {
			const { getAllByTestId, getByText, getByDisplayValue } = setupTest();
			fireEvent.click(getByText(/add new text style/i));

			const textStyleCards = getAllByTestId("text-style-card-name");
			expect(textStyleCards).toHaveLength(2);

			const { queryByText: queryByCardText } = within(textStyleCards[1]);
			expect(queryByCardText("Paragraph")).toBeInTheDocument();
			fireEvent.click(textStyleCards[1]);

			fireEvent.change(getByDisplayValue("Paragraph"), { target: { value: "H3" } });
			expect(queryByCardText("Paragraph")).not.toBeInTheDocument();
			expect(queryByCardText("Headline 3")).toBeInTheDocument();
		});

		it("should update font styles", async () => {
			const { getAllByTestId, getByText, getByDisplayValue } = setupTest();

			fireEvent.click(getByText(/add new text style/i));

			const textStyleCards = getAllByTestId("text-style-card-name");
			expect(textStyleCards).toHaveLength(2);

			expect(getByText(/^lorem ipsum dolor sit amet/i)).toHaveStyle({
				"font-size": "12pt",
				"line-height": "18pt",
				"font-family": "print_font_Open Sans",
			});

			fireEvent.click(textStyleCards[1]);

			const fontSelect = getByDisplayValue("Open Sans");
			fireEvent.click(fontSelect);

			await waitFor(() => {
				fireEvent.click(getByText("Noto Sans Mono"));
			});

			const fontSizeInput = getByDisplayValue("12");
			fireEvent.change(fontSizeInput, { target: { value: "16" } });
			fireEvent.blur(fontSizeInput);

			const lineHeightInput = getByDisplayValue("18");
			fireEvent.change(lineHeightInput, { target: { value: "22" } });
			fireEvent.blur(lineHeightInput);

			expect(getByText(/^lorem ipsum dolor sit amet/i)).toHaveStyle({
				"font-size": "16pt",
				"line-height": "22pt",
				"font-family": "print_font_Noto Sans Mono",
			});
		});
	});
});

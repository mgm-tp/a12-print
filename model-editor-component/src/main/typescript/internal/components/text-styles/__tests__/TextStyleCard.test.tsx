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
import { jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react";

import { TransactionLog } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { ElementType, PRINT_MODEL_CONTENT_GENERAL_LOG_ID } from "@com.mgmtp.a12.print/print-model-api/model";

import {
	createTransactionLogState,
	initialStateLogStoreMock,
	mockPrintModelContentGeneral,
	mockSegment,
	renderWithProviders,
	testTextStyle,
	textStylesMock,
} from "../../../../../../test/typescript/test-utils/index.js";
import { DEFAULT_TEXT_STYLE_ID } from "../../../constant/textstyle.js";
import { initialStateLogStore, RequestApiActions } from "../../../redux/index.js";

import { TextStyleCard } from "../TextStyleCard.js";

describe("TextStyleCard", () => {
	const setupTest = (isReadonly = false) =>
		renderWithProviders(<TextStyleCard textStyle={testTextStyle} isReadonly={isReadonly} />, {
			TransactionLogState: createTransactionLogState({
				...initialStateLogStoreMock,
				textStyles: textStylesMock,
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: TransactionLog.createStoreEntryPrintModelContentGeneral(
					initialStateLogStore[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
					{ ...mockPrintModelContentGeneral, textStyles: [...Object.keys(textStylesMock)] },
					"interaction1"
				).storeEntry,
			}),
		});

	it("render TextStyleCard without TextStyleEditor as a default state", () => {
		const { queryByText, getByLabelText } = setupTest();

		expect(queryByText("" + testTextStyle.name)).toBeInTheDocument();
		expect(queryByText("Paragraph")).toBeInTheDocument();
		expect(queryByText("Duplicate")).not.toBeInTheDocument();

		fireEvent.click(getByLabelText("Open Menu"));

		expect(screen.queryByText("Duplicate")).toBeInTheDocument();
		expect(screen.queryByText("Delete")).toBeInTheDocument();
	});

	describe("The default text style", () => {
		it("should render the delete button with disabled property", () => {
			const { getByLabelText } = renderWithProviders(
				<TextStyleCard textStyle={{ ...testTextStyle, id: DEFAULT_TEXT_STYLE_ID }} isDefaultTextStyle={true} />
			);

			fireEvent.click(getByLabelText("Open Menu"));

			expect(screen.getByLabelText("Duplicate")).toBeEnabled();
			expect(screen.getByLabelText("Delete")).toBeDisabled();
		});
	});

	it("removes a reference whose text style is only used by a referenced element fragment", () => {
		const fragmentElement = {
			id: "fragment-el",
			type: ElementType.Text,
			textProperties: { id: "tp", textStyleId: { id: "ts", value: testTextStyle.id } },
		};
		const segment = {
			...mockSegment,
			elementReferences: [{ id: "placeable", refId: fragmentElement.id, model: "fragment-model" }],
		};
		const onRemoveReference = jest.fn();
		const { getByLabelText, store } = renderWithProviders(
			<TextStyleCard textStyle={testTextStyle} isReadonly={true} onRemoveReference={onRemoveReference} />,
			{
				TransactionLogState: createTransactionLogState({
					...initialStateLogStoreMock,
					segments: {
						...initialStateLogStoreMock.segments,
						map: {
							[segment.id]: TransactionLog.createStoreEntrySegment(
								initialStateLogStore.segments,
								segment as never,
								"interaction1"
							).storeEntry,
						},
					},
				}),
			}
		);
		store.dispatch(
			RequestApiActions.setFragmentModel({
				header: { id: "fragment-model" },
				content: { elementDefinitions: [fragmentElement] },
			} as never)
		);

		fireEvent.click(getByLabelText("Open Menu"));
		fireEvent.click(screen.getByLabelText("Delete"));

		expect(onRemoveReference).toHaveBeenCalledTimes(1);
	});

	it("keeps a reference whose text style is used by an element of the print model", () => {
		const reference = { id: "text-style-reference", refId: testTextStyle.id, model: "fragment-model" };
		const element = {
			id: "local-el",
			type: ElementType.Text,
			textProperties: { id: "tp", textStyleId: { id: "ts", value: reference.id } },
		};
		const onRemoveReference = jest.fn();
		renderWithProviders(
			<TextStyleCard
				textStyle={testTextStyle}
				reference={reference}
				isReadonly={true}
				onRemoveReference={onRemoveReference}
			/>,
			{
				TransactionLogState: createTransactionLogState({
					...initialStateLogStoreMock,
					printModelElements: {
						[element.id]: TransactionLog.createStoreEntryPrintModelElement(
							initialStateLogStore.printModelElements,
							element as never,
							"interaction1"
						).storeEntry,
					},
				}),
			}
		);

		fireEvent.click(screen.getByLabelText("Open Menu"));
		fireEvent.click(screen.getByLabelText("Delete"));

		expect(onRemoveReference).not.toHaveBeenCalled();
	});

	describe("readonly mode", () => {
		afterEach(() => {
			jest.restoreAllMocks();
		});

		it("hides drag icon when isReadonly is true", () => {
			setupTest(true);

			expect(screen.queryByTestId("drag-icon")).not.toBeInTheDocument();
		});

		it("hides Duplicate button in menu when isReadonly is true", () => {
			const { getByLabelText } = setupTest(true);

			fireEvent.click(getByLabelText("Open Menu"));

			expect(screen.queryByText("Duplicate")).not.toBeInTheDocument();
		});

		it("still shows Delete button when isReadonly is true", () => {
			const { getByLabelText } = setupTest(true);

			fireEvent.click(getByLabelText("Open Menu"));

			expect(screen.getByLabelText("Delete")).toBeInTheDocument();
			expect(screen.getByLabelText("Delete")).toBeEnabled();
		});
	});
});

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
import { act, fireEvent, waitFor, within } from "@testing-library/react";

import { TransactionLog } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { PartialTable, PartialTextStyle } from "@com.mgmtp.a12.print/print-model-api/model";
import { ElementType, PRINT_MODEL_CONTENT_GENERAL_LOG_ID } from "@com.mgmtp.a12.print/print-model-api/model";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";

import {
	createTransactionLogState,
	initialStateLogStoreMock,
	mockPrintModelContentGeneral,
	renderWithProviders,
	testTextStyle,
	textStylesMock,
} from "../../../../../../../test/typescript/test-utils/index.js";
import { TEXT_PROPERTIES_PATH } from "../../../../constant/element-property-path.js";
import { DEFAULT_TEXT_STYLE_NAME } from "../../../../constant/textstyle.js";
import { initialStateLogStore, RequestApiActions } from "../../../../redux/index.js";

import { TextPropertiesInput } from "../TextPropertiesInput.js";

describe("TextPropertiesInput", () => {
	const mockOnSetTextProperties = jest.fn();
	const mockElement: PartialTable = {
		id: "tableId",
		type: ElementType.Table,
		name: "mockTable",
		textProperties: {
			id: "k0FFvYRpIj2vM_3z-UAYd",
			textStyleId: {
				id: "nz0ZXHR730XA_ajw5afbT",
				path: "/content/elementDefinitions/table/textProperties/textStyleId/value/",
				source: PossibleInputSource.INPUT,
			},
			color: {
				id: "nz0ZXHR730XA_ajw5afbT",
				path: "/content/elementDefinitions/textProperties/color/value/",
				source: PossibleInputSource.INPUT,
			},
			backgroundColor: {
				id: "Y9uyNsluzTZwOt9Ub0iF4",
				path: "/content/elementDefinitions/textProperties/backgroundColor/value/",
				source: PossibleInputSource.INPUT,
			},
			alignment: {
				id: "m_BlwcJI7C41oXzIaK9tI",
				path: "/content/elementDefinitions/textProperties/alignment/value/",
				source: PossibleInputSource.INPUT,
			},
			bold: {
				id: "oJTiaBnpuIPk6WjYeaSlw",
				path: "/content/elementDefinitions/textProperties/bold/value/",
				source: PossibleInputSource.INPUT,
			},
			italic: {
				id: "O0Q6bW6RgVy0AJYg5bPxb",
				path: "/content/elementDefinitions/textProperties/italic/value/",
				source: PossibleInputSource.INPUT,
			},
			underlined: {
				id: "pzKKjFPHYQTA4moxL8Uif",
				path: "/content/elementDefinitions/textProperties/underlined/value/",
				source: PossibleInputSource.INPUT,
			},
		},
	};

	const setupTest = () =>
		renderWithProviders(
			<TextPropertiesInput
				setTextProperties={mockOnSetTextProperties}
				showColor
				showBackgroundColor
				showUnderline
				showItalic
				showBold
				element={mockElement}
				textProperties={mockElement.textProperties}
				propertiesPath={TEXT_PROPERTIES_PATH}
			/>,
			{
				TransactionLogState: createTransactionLogState({
					...initialStateLogStoreMock,
					textStyles: textStylesMock,
					[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: TransactionLog.createStoreEntryPrintModelContentGeneral(
						initialStateLogStore[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
						{ ...mockPrintModelContentGeneral, textStyles: Object.keys(textStylesMock.map || {}) },
						"interaction2"
					).storeEntry,
				}),
			}
		);

	it("should renders correctly without TextPropertiesProps", async () => {
		const { queryByText, queryByRole, queryByLabelText } = setupTest();

		expect(queryByLabelText("Text Styles")).toBeInTheDocument();

		expect(queryByText("Bold")).toBeInTheDocument();
		expect(queryByText("Italic")).toBeInTheDocument();
		expect(queryByText("Underline")).toBeInTheDocument();
		expect(queryByText("Color")).toBeInTheDocument();
		expect(queryByText("Background Color")).toBeInTheDocument();
		expect(queryByText("Alignment")).toBeInTheDocument();

		const alignmentSelect = queryByText("Alignment");

		expect(alignmentSelect).toBeTruthy();

		fireEvent.click(alignmentSelect!);

		await waitFor(() => {
			expect(queryByRole("option", { name: "Left" })).toBeInTheDocument();
			expect(queryByRole("option", { name: "Center" })).toBeInTheDocument();
			expect(queryByRole("option", { name: "Right" })).toBeInTheDocument();
			expect(queryByRole("option", { name: "Justify" })).toBeInTheDocument();
		});
	});

	it("should call setTextProperties with correctly", async () => {
		const { getAllByRole, queryByRole, getByRole, container } = setupTest();

		const [textStyleSelect, alignmentSelect] = getAllByRole("combobox");
		fireEvent.click(textStyleSelect);

		await waitFor(() => {
			const selectOption = getByRole("option", { value: "testId" });
			fireEvent.click(selectOption);
		});

		const [boldCheckbox, italicCheckbox, underlineCheckbox] = Array.from(
			container.querySelectorAll('[data-role="checkbox-input"]')
		) as HTMLElement[];

		fireEvent.click(boldCheckbox);
		fireEvent.click(italicCheckbox);
		fireEvent.click(underlineCheckbox);

		fireEvent.click(alignmentSelect);

		await waitFor(() => {
			const optionLeft = queryByRole("option", { name: "Left" });
			expect(optionLeft).toBeTruthy();
			fireEvent.click(optionLeft!);
		});

		expect(mockOnSetTextProperties).toHaveBeenNthCalledWith(1, {
			...mockElement.textProperties,
			textStyleId: { ...mockElement.textProperties!.textStyleId, value: "testId" },
		});

		expect(mockOnSetTextProperties).toHaveBeenNthCalledWith(2, {
			...mockElement.textProperties,
			bold: { ...mockElement.textProperties!.bold!, value: true },
		});
		expect(mockOnSetTextProperties).toHaveBeenNthCalledWith(3, {
			...mockElement.textProperties,
			italic: { ...mockElement.textProperties!.italic!, value: true },
		});
		expect(mockOnSetTextProperties).toHaveBeenNthCalledWith(4, {
			...mockElement.textProperties,
			underlined: { ...mockElement.textProperties!.underlined!, value: true },
		});
		expect(mockOnSetTextProperties).toHaveBeenNthCalledWith(5, {
			...mockElement.textProperties,
			alignment: { ...mockElement.textProperties!.alignment!, value: "Left" },
		});
	});

	describe("a text style inherited from an element that has none of its own", () => {
		const inheritingElement: PartialTable = {
			...mockElement,
			textProperties: {
				id: "inheriting-text-properties",
				textStyleId: {
					id: "inherited-text-style-id",
					path: "/content/elementDefinitions/table/textProperties/textStyleId/value/",
					source: PossibleInputSource.INHERITED,
				},
			},
		};

		it("shows the default text style, which is what such an element prints in", async () => {
			const { findByText } = renderWithProviders(
				<TextPropertiesInput
					setTextProperties={mockOnSetTextProperties}
					element={inheritingElement}
					textProperties={inheritingElement.textProperties}
					propertiesPath={TEXT_PROPERTIES_PATH}
					// the element it inherits from leaves its own text style at DEFAULT, so it resolves to no id
					resolveTextStyleId={() => undefined}
				/>,
				{
					TransactionLogState: createTransactionLogState({
						...initialStateLogStoreMock,
						textStyles: textStylesMock,
						[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: TransactionLog.createStoreEntryPrintModelContentGeneral(
							initialStateLogStore[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
							{ ...mockPrintModelContentGeneral, textStyles: Object.keys(textStylesMock.map || {}) },
							"interaction2"
						).storeEntry,
					}),
				}
			);

			expect(await findByText(DEFAULT_TEXT_STYLE_NAME)).toBeInTheDocument();
		});
	});

	describe("a checkbox property that is inherited", () => {
		const inheritingElement: PartialTable = {
			...mockElement,
			textProperties: {
				id: "inheriting-text-properties",
				bold: {
					id: "inherited-bold",
					path: "/content/elementDefinitions/table/textProperties/bold/value/",
					source: PossibleInputSource.INHERITED,
				},
			},
		};

		it("shows the inherited value, not an empty checkbox", () => {
			const { container } = renderWithProviders(
				<TextPropertiesInput
					setTextProperties={mockOnSetTextProperties}
					element={inheritingElement}
					textProperties={inheritingElement.textProperties}
					propertiesPath={TEXT_PROPERTIES_PATH}
					showColor={false}
					showBackgroundColor={false}
					showItalic={false}
					showUnderline={false}
					// the element it inherits from has bold switched on
					resolveBold={() => true}
				/>,
				{ TransactionLogState: createTransactionLogState({ ...initialStateLogStoreMock }) }
			);

			const [boldCheckbox] = Array.from(
				container.querySelectorAll('[data-role="checkbox-input"]')
			) as HTMLInputElement[];

			expect(boldCheckbox).toBeDefined();
			expect(boldCheckbox.checked).toBe(true);
		});
	});

	describe("text style of a fragment model", () => {
		const fragmentTextStyle: PartialTextStyle = {
			...testTextStyle,
			id: "fragmentTextStyleId",
			name: "Fragment Text Style",
		};

		const textStyleReferenceId = "text-style-reference";

		const setupTestWithFragmentTextStyle = (element: PartialTable = mockElement) => {
			const result = renderWithProviders(
				<TextPropertiesInput
					setTextProperties={mockOnSetTextProperties}
					element={element}
					textProperties={element.textProperties}
					propertiesPath={TEXT_PROPERTIES_PATH}
				/>,
				{
					TransactionLogState: createTransactionLogState({
						...initialStateLogStoreMock,
						textStyles: {
							...textStylesMock,
							referencesEntry: {
								id: "text-style-references",
								log: [],
								memoizedObject: {
									id: "text-style-references",
									references: [
										{
											id: textStyleReferenceId,
											refId: fragmentTextStyle.id,
											model: "printFragment",
										},
									],
								},
							},
						},
						// Only the local text style is listed here; the other one is reached through its reference.
						[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: TransactionLog.createStoreEntryPrintModelContentGeneral(
							initialStateLogStore[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
							{ ...mockPrintModelContentGeneral, textStyles: [testTextStyle.id] },
							"interaction2"
						).storeEntry,
					}),
				}
			);
			act(() => {
				result.store.dispatch(
					RequestApiActions.setFragmentModel({
						header: { id: "printFragment" },
						content: { textStyles: { id: "fragment-text-styles", definitions: [fragmentTextStyle] } },
					} as never)
				);
			});
			return result;
		};

		it("shows the referenced text style as selected when the element uses it", async () => {
			const { findByText } = setupTestWithFragmentTextStyle({
				...mockElement,
				textProperties: {
					...mockElement.textProperties!,
					textStyleId: { ...mockElement.textProperties!.textStyleId!, value: textStyleReferenceId },
				},
			});

			expect(await findByText(fragmentTextStyle.name!)).toBeInTheDocument();
		});

		it("shows the referenced text style as selected for an element of the fragment model", async () => {
			const { findByText } = setupTestWithFragmentTextStyle({
				...mockElement,
				textProperties: {
					...mockElement.textProperties!,
					textStyleId: { ...mockElement.textProperties!.textStyleId!, value: fragmentTextStyle.id },
				},
			});

			expect(await findByText(fragmentTextStyle.name!)).toBeInTheDocument();
		});

		it("marks the referenced text style in the selection, and only that one", async () => {
			const { getAllByRole, findByText, queryAllByTitle } = setupTestWithFragmentTextStyle();

			fireEvent.click(getAllByRole("combobox")[0]);

			// Both text styles are offered, and the marker sits on the one a fragment model owns.
			await waitFor(() => expect(getAllByRole("option")).toHaveLength(2));
			const fragmentOption = (await findByText(fragmentTextStyle.name!)).closest('[role="option"]');
			expect(
				within(fragmentOption as HTMLElement).getByTitle("Referenced text style fragment")
			).toBeInTheDocument();
			expect(queryAllByTitle("Referenced text style fragment")).toHaveLength(1);
		});
	});
});

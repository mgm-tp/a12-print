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
import { fireEvent, waitFor } from "@testing-library/react";

import { TransactionLog } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { PartialTable } from "@com.mgmtp.a12.print/print-model-api/model";
import { ElementType, PRINT_MODEL_CONTENT_GENERAL_LOG_ID } from "@com.mgmtp.a12.print/print-model-api/model";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";

import {
	createTransactionLogState,
	initialStateLogStoreMock,
	mockPrintModelContentGeneral,
	renderWithProviders,
	textStylesMock,
} from "../../../../../../../test/typescript/test-utils/index.js";
import { initialStateLogStore } from "../../../../redux/index.js";
import { TEXT_PROPERTIES_PATH } from "../../../../constant/element-property-path.js";

import { TextPropertiesInput } from "../TextPropertiesInput.js";

describe("TextPropertiesInput", () => {
	const mockOnSetTextProperties = jest.fn();
	const mockElement: PartialTable = {
		id: "tableId",
		type: ElementType.Table,
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
						{ ...mockPrintModelContentGeneral, textStyles: [...Object.keys(textStylesMock.map || {})] },
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
});

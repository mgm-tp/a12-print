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
import { fireEvent, screen } from "@testing-library/react";

import { TransactionLog } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import { PRINT_MODEL_CONTENT_GENERAL_LOG_ID } from "@com.mgmtp.a12.print/print-model-api/lib/model/constant.js";

import { initialStateLogStore } from "../../../redux/index.js";
import {
	createTransactionLogState,
	initialStateLogStoreMock,
	mockPrintModelContentGeneral,
	renderWithProviders,
	testTextStyle,
	textStylesMock,
} from "../../../../../../test/typescript/test-utils/index.js";
import { DEFAULT_TEXT_STYLE_ID } from "../../../constant/textstyle.js";

import { TextStyleCard } from "../TextStyleCard.js";

describe("TextStyleCard", () => {
	const setupTest = () =>
		renderWithProviders(<TextStyleCard textStyle={testTextStyle} />, {
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
});

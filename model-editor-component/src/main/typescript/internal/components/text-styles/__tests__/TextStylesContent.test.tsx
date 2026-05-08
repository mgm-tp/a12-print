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
import {
	StoreEntryMapWithId,
	TransactionLog,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import { PartialTextStyle } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { PRINT_MODEL_CONTENT_GENERAL_LOG_ID } from "@com.mgmtp.a12.print/print-model-api/lib/model/constant.js";

import { initialStateLogStore } from "../../../redux/index.js";
import {
	createTransactionLogState,
	renderWithProviders,
	initialStateLogStoreMock,
	mockPrintModelContentGeneral,
	textStylesMock,
	testTextStyle,
} from "../../../../../../test/typescript/test-utils/index.js";

import { TextStylesContent } from "../TextStylesContent.js";

describe("TextStylesContent", () => {
	const setupTest = (textStyles?: StoreEntryMapWithId<PartialTextStyle>) =>
		renderWithProviders(<TextStylesContent />, {
			TransactionLogState: createTransactionLogState({
				...initialStateLogStoreMock,
				textStyles,
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: TransactionLog.createStoreEntryPrintModelContentGeneral(
					initialStateLogStore[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
					{ ...mockPrintModelContentGeneral, textStyles: [...Object.keys(textStyles?.map || {})] },
					"interaction2"
				).storeEntry,
			}),
		});

	describe("Have no text styles", () => {
		it("should render the default TextStyleCard and have no draggable card", () => {
			const { queryByTestId } = setupTest();

			expect(queryByTestId("drag-icon")).not.toBeInTheDocument();
		});
	});

	describe("Text styles are provided", () => {
		it("should render the TextStyleCard as well as the default TextStyleCard", () => {
			const { queryByText } = setupTest(textStylesMock);

			expect(queryByText("Default Text Style")).toBeInTheDocument();
			expect(queryByText("" + testTextStyle.name)).toBeInTheDocument();
		});

		it("should render drag list TextStyleCard according to textStyles", () => {
			const { queryAllByTestId } = setupTest(textStylesMock);

			expect(queryAllByTestId("drag-icon")).toHaveLength(1);
		});
	});
});

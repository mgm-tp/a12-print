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

import type { TransactionLogStore } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { TransactionLog } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { PartialText } from "@com.mgmtp.a12.print/print-model-api/model";
import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";

import { createMmMeasure, createMmMeasureFromPx } from "../../../utils/index.js";
import {
	initialStateLogStoreMock,
	renderWithProviders,
	setupIgnoreTestWarning,
	TestWarningIdentifier,
} from "../../../../../../test/typescript/test-utils/index.js";
import { TransactionLogStateReducer, initialStateLogStore } from "../../../redux/index.js";

import { DefaultElementContainer } from "../DefaultElementContainer.js";

setupIgnoreTestWarning([TestWarningIdentifier.PRINT_UNKNOWN_ELEMENT]);

describe("DefaultElementContainer", () => {
	it("should render null when element type is not defined", () => {
		const nonElementMock = {
			id: "non-element-id",
			type: undefined,
			text: { text: "Hello World" },
		} as unknown as PartialText;

		const elementRefMock = {
			id: "keo,gqeog",
			refId: nonElementMock.id,
			position: { id: "plqgpeqg", x: createMmMeasure(0), y: createMmMeasure(0) },
			dimensions: { id: "oqjgoeqkgeq", minWidth: createMmMeasureFromPx(1), minHeight: createMmMeasureFromPx(1) },
		};

		const stateMock = {
			...initialStateLogStoreMock,
			printModelElements: {
				[nonElementMock.id]: TransactionLog.createStoreEntryPrintModelElement(
					initialStateLogStore.printModelElements,
					nonElementMock,
					"interaction1"
				).storeEntry,
			},
		};

		const TransactionLogStateMock: Reducer = (state: TransactionLogStore = stateMock, action) =>
			TransactionLogStateReducer(state, action);

		const { queryByText } = renderWithProviders(
			<DefaultElementContainer reference={elementRefMock} isLayoutElement={true} />,
			{
				TransactionLogState: TransactionLogStateMock,
			}
		);

		expect(queryByText("Hello World")).not.toBeInTheDocument();
	});

	it("should render ElementComponent with appropriate props", () => {
		const textElementMock: PartialText = {
			id: "textElId123",
			type: ElementType.Text,
			text: { id: "mqgoekhopr", text: "Hello World" },
		};
		const elementRefMock = {
			id: "oqkpogkepwqh",
			refId: textElementMock.id,
			position: { id: "plqgpeqg", x: createMmMeasure(0), y: createMmMeasure(0) },
			dimensions: { id: "oqjgoeqkgeq", minWidth: createMmMeasureFromPx(1), minHeight: createMmMeasureFromPx(1) },
		};

		const stateMock = {
			...initialStateLogStoreMock,
			printModelElements: {
				[textElementMock.id]: TransactionLog.createStoreEntryPrintModelElement(
					initialStateLogStore.printModelElements,
					textElementMock,
					"interaction1"
				).storeEntry,
			},
		};

		const TransactionLogStateMock: Reducer = (state: TransactionLogStore = stateMock, action) =>
			TransactionLogStateReducer(state, action);

		const { queryByText } = renderWithProviders(<DefaultElementContainer reference={elementRefMock} />, {
			TransactionLogState: TransactionLogStateMock,
		});

		expect(queryByText("Hello World")).toBeInTheDocument();
	});
});

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
import type { ReactElement } from "react";
import { jest } from "@jest/globals";

import type { PartialWatermark } from "@com.mgmtp.a12.print/print-model-api/model";
import { PageOrientation, PRINT_MODEL_CONTENT_GENERAL_LOG_ID } from "@com.mgmtp.a12.print/print-model-api/model";
import { TransactionLog } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { initialStateLogStore } from "../../../redux/index.js";
import {
	createTransactionLogState,
	initialStateLogStoreMock,
	mockPrintModelContentGeneral,
	renderWithProviders,
} from "../../../../../../test/typescript/test-utils/index.js";

import { WatermarkCard } from "../WatermarkCard.js";

const mockWatermark: PartialWatermark = {
	id: "watermarkId1",
	title: "Test Watermark",
	pageOrientation: PageOrientation.Portrait,
	elementReferences: [],
	opacity: 0.5,
};

describe("WatermarkCard", () => {
	const setupTest = (component: ReactElement, includeWatermark = false) =>
		renderWithProviders(component, {
			TransactionLogState: createTransactionLogState({
				...initialStateLogStoreMock,
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: TransactionLog.createStoreEntryPrintModelContentGeneral(
					initialStateLogStore[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
					{
						...mockPrintModelContentGeneral,
						watermarks: includeWatermark ? [mockWatermark.id] : [],
					},
					"watermark-card-test"
				).storeEntry,
				...(includeWatermark
					? {
							watermarks: {
								id: "watermarksMapId",
								map: {
									[mockWatermark.id]: TransactionLog.createStoreEntryWatermark(
										initialStateLogStore.watermarks,
										mockWatermark,
										"watermark-card-test"
									).storeEntry,
								},
							},
						}
					: {}),
			}),
		});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("renders watermark card with watermark", () => {
		const { getByDisplayValue, getByLabelText } = setupTest(
			<WatermarkCard watermark={mockWatermark} pageOrientation={PageOrientation.Portrait} />,
			true
		);

		expect(getByDisplayValue("Test Watermark")).toBeInTheDocument();
		expect(getByLabelText(/open setting/i)).toBeInTheDocument();
		expect(getByLabelText("Open Editor")).toBeInTheDocument();
		expect(getByLabelText("Delete")).toBeInTheDocument();
	});

	it("renders Add button when no watermark exists", () => {
		const { getByText } = setupTest(<WatermarkCard pageOrientation={PageOrientation.Portrait} />);

		expect(getByText("Add")).toBeInTheDocument();
	});

	it("renders reference watermark with disabled title", () => {
		const { getByDisplayValue } = setupTest(
			<WatermarkCard
				watermark={mockWatermark}
				pageOrientation={PageOrientation.Portrait}
				reference={{ id: "refId" }}
			/>,
			true
		);

		expect(getByDisplayValue("Test Watermark")).toBeDisabled();
	});

	it("shows reference link icon for referenced watermark", () => {
		const { getByTitle } = setupTest(
			<WatermarkCard
				watermark={mockWatermark}
				pageOrientation={PageOrientation.Portrait}
				reference={{ id: "refId" }}
			/>,
			true
		);

		expect(getByTitle(/Referenced/i)).toBeInTheDocument();
	});
});

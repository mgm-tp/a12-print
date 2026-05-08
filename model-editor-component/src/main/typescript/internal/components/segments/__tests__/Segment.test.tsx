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
import { fireEvent, screen, within } from "@testing-library/react";

import { SegmentsStoreEntryMapWithId } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import { PartialSegment } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import {
	createTransactionLogState,
	renderWithProviders,
	initialStateLogStoreMock,
} from "../../../../../../test/typescript/test-utils/index.js";

import { Segments } from "../Segment.js";

describe("SegmentCard", () => {
	const setupTest = (segments: SegmentsStoreEntryMapWithId<PartialSegment> = initialStateLogStoreMock.segments) =>
		renderWithProviders(
			<Segments />,
			{
				TransactionLogState: createTransactionLogState({
					...initialStateLogStoreMock,
					segments,
				}),
			},
			["startInteractionSaga", "loadDocumentModelDataSaga"]
		);

	it("should render correctly", () => {
		const { queryAllByTestId } = setupTest();

		expect(queryAllByTestId("segment-card")).toHaveLength(2);
	});

	it("should render name input correctly", () => {
		const { queryByDisplayValue, queryByText, getAllByLabelText } = setupTest();

		expect(queryByText("my first segment")).toBeInTheDocument();
		expect(queryByDisplayValue("my first segment")).not.toBeInTheDocument();

		fireEvent.click(getAllByLabelText(/open setting/i)[0]);

		expect(queryByDisplayValue("my first segment")).toBeInTheDocument();
	});

	it("should render repeatability settings", () => {
		const { queryByDisplayValue, queryByText, getAllByLabelText } = setupTest();

		expect(queryByText("my second segment")).toBeInTheDocument();
		expect(queryByDisplayValue("my second segment")).not.toBeInTheDocument();

		fireEvent.click(getAllByLabelText(/open setting/i)[1]);

		expect(queryByText("Repeatability Settings")).toBeInTheDocument();
		expect(queryByDisplayValue("TestDocument")).toBeInTheDocument();
		expect(queryByDisplayValue("/RepeatableGroup")).toBeInTheDocument();
	});

	it("should render popup menu correctly", () => {
		const { getAllByLabelText } = setupTest();

		expect(screen.queryByText("Duplicate")).not.toBeInTheDocument();
		expect(screen.queryByText("Delete")).not.toBeInTheDocument();

		fireEvent.click(getAllByLabelText(/open menu/i)[0]);

		expect(screen.queryByText("Duplicate")).toBeInTheDocument();
		expect(screen.queryByText("Delete")).toBeInTheDocument();
	});

	it("should update segment name", () => {
		const { getByDisplayValue, queryByText, getAllByLabelText } = setupTest();

		expect(queryByText("my first segment")).toBeInTheDocument();

		fireEvent.click(getAllByLabelText(/open setting/i)[0]);

		const nameInput = getByDisplayValue("my first segment");
		fireEvent.change(nameInput, { target: { value: "updated segment" } });
		fireEvent.blur(nameInput);

		expect(queryByText("my first segment")).not.toBeInTheDocument();
		expect(queryByText("updated segment")).toBeInTheDocument();
	});

	it("should update repeatability settings", () => {
		const { queryByText, queryByDisplayValue, getAllByLabelText, getByRole } = setupTest();

		expect(queryByText("my first segment")).toBeInTheDocument();

		fireEvent.click(getAllByLabelText(/open setting/i)[0]);
		expect(queryByDisplayValue("TestDocument")).not.toBeInTheDocument();

		const modelSelect = getByRole("combobox");
		fireEvent.select(modelSelect, { target: { value: "TestDocument" } });

		expect(queryByDisplayValue("TestDocument")).toBeInTheDocument();
	});

	it("should add new segment", () => {
		const { getByText, queryByText, queryAllByTestId, getByPlaceholderText } = setupTest();

		expect(queryByText("Segment X")).not.toBeInTheDocument();
		expect(queryAllByTestId("segment-card")).toHaveLength(2);

		fireEvent.change(getByPlaceholderText(/new segmentation/i), { target: { value: "Segment X" } });
		fireEvent.click(getByText("Add"));

		const segmentCards = queryAllByTestId("segment-card");

		expect(segmentCards).toHaveLength(3);

		const { queryByText: queryByCardText } = within(segmentCards[2]);

		expect(queryByCardText("Segment X")).toBeInTheDocument();
	});

	it("should duplicate segment", () => {
		const { queryAllByText, getAllByLabelText } = setupTest();

		expect(queryAllByText("my first segment")).toHaveLength(1);

		fireEvent.click(getAllByLabelText(/open menu/i)[0]);
		fireEvent.click(screen.getByText("Duplicate"));

		expect(queryAllByText("my first segment")).toHaveLength(2);
	});

	it("should show delete confirm dialog", () => {
		const { queryAllByText, getAllByLabelText } = setupTest();

		expect(queryAllByText("my first segment")).toHaveLength(1);
		expect(screen.queryByText(/confirm to delete/i)).not.toBeInTheDocument();

		fireEvent.click(getAllByLabelText(/open menu/i)[0]);
		fireEvent.click(screen.getByText("Delete"));

		expect(screen.queryByText(/confirm to delete/i)).toBeInTheDocument();
	});
});

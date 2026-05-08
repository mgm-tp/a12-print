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
import { Reducer } from "redux";
import { fireEvent, screen, within } from "@testing-library/react";
import { useSelector } from "react-redux";

import {
	TransactionLog,
	TransactionLogStore,
	TransactionLogStoreEntryMap,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import {
	Language,
	PageOrientation,
	SectionUsage,
	PartialPrintModelContentGeneral,
	PartialSection,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import {
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	PRINT_MODEL_HEADER_LOG_ID,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/constant.js";

import { renderWithProviders } from "../../../../../../test/typescript/test-utils/index.js";
import { createMmMeasureFromPx } from "../../../utils/index.js";
import { TransactionLogStateReducer, initialStateLogStore } from "../../../redux/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";

import { SectionContent } from "../index.js";

const mockSections: PartialSection[] = [
	{
		id: "sectionId1",
		title: "First Portrait Section",
		sectionUsage: SectionUsage.First,
		pageOrientation: PageOrientation.Portrait,
		headerHeight: createMmMeasureFromPx(80),
		footerHeight: createMmMeasureFromPx(120),
		elementReferences: [],
	},
	{
		id: "sectionId2",
		title: "Remaining Portrait Section",
		sectionUsage: SectionUsage.Remaining,
		pageOrientation: PageOrientation.Portrait,
		headerHeight: createMmMeasureFromPx(50),
		footerHeight: createMmMeasureFromPx(80),
		elementReferences: [],
	},
	{
		id: "sectionId3",
		title: "First Landscape Section",
		sectionUsage: SectionUsage.First,
		pageOrientation: PageOrientation.Landscape,
		headerHeight: createMmMeasureFromPx(90),
		footerHeight: createMmMeasureFromPx(80),
		elementReferences: [],
	},
	{
		id: "sectionId4",
		title: "Remaining Landscape Section",
		sectionUsage: SectionUsage.Remaining,
		pageOrientation: PageOrientation.Landscape,
		headerHeight: createMmMeasureFromPx(150),
		footerHeight: createMmMeasureFromPx(200),
		elementReferences: [],
	},
];

const mockPrintContentGeneral: PartialPrintModelContentGeneral = {
	id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	structure: [],
	details: { id: "j1g301jg30wqheq", author: "tony", language: Language.DE },
	metadata: {
		id: "ifnqjignqeg",
		authorComputation: [{ id: "authComp123", operation: "tony" }],
		languageComputation: [{ id: "langComp123", operation: "DE" }],
		titleComputation: [{ id: "titleComp123", operation: "a title" }],
		descriptionComputation: [{ id: "titleComp123", operation: "descr" }],
	},
	segmentDefaults: { id: "mgopeq2mh402h4", fontSize: 12 },
	title: "a title",
	sections: mockSections.map(el => el.id),
};

const initialStateMock: TransactionLogStore = {
	[PRINT_MODEL_HEADER_LOG_ID]: {
		id: PRINT_MODEL_HEADER_LOG_ID,
		log: [],
		memoizedObject: { id: PRINT_MODEL_HEADER_LOG_ID },
	},
	[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: TransactionLog.createStoreEntryPrintModelContentGeneral(
		initialStateLogStore[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
		mockPrintContentGeneral,
		"geq2g12"
	).storeEntry,
	segments: { id: "gm3oghn429h4", map: {}, references: {} },
	sections: {
		id: "mgz30hm42h0o354h",
		map: mockSections.reduce((sections: TransactionLogStoreEntryMap<PartialSection>, section) => {
			sections[section.id] = TransactionLog.createStoreEntrySection(
				initialStateLogStore.sections,
				section,
				"qwq"
			).storeEntry;
			return sections;
		}, {}),
	},
	printModelElements: {},
};

const TransactionLogStateMock: Reducer = (state: TransactionLogStore = initialStateMock, action) =>
	TransactionLogStateReducer(state, action);

const MockEditor = () => {
	const printModelRefs = useSelector(PrintEngineSelectors.printModelRefs);

	if (!printModelRefs?.currentRefType) {
		return null;
	}

	return <div>{printModelRefs.currentRefType} editor</div>;
};

describe("SectionContent", () => {
	const setupTest = (withSections = false, withEditor = false) =>
		renderWithProviders(
			<>
				<SectionContent />
				{withEditor && <MockEditor />}
			</>,
			withSections ? { TransactionLogState: TransactionLogStateMock } : undefined
		);

	describe("with no initial sections", () => {
		it("should render correctly", () => {
			const { container } = setupTest();

			expect(container).toMatchSnapshot();
		});
	});

	describe("with initial sections", () => {
		it("should render correctly", () => {
			const { container } = setupTest(true);

			expect(container).toMatchSnapshot();
		});
	});

	it("should show section title input on clicking Add", () => {
		const { getAllByTestId } = setupTest();

		const firstSectionCard = getAllByTestId("section-card")[0];

		const { getByText, queryByPlaceholderText } = within(firstSectionCard);

		expect(queryByPlaceholderText("Section title")).not.toBeInTheDocument();

		fireEvent.click(getByText("Add"));

		expect(queryByPlaceholderText("Section title")).toBeInTheDocument();
	});

	it("should update title", () => {
		const { getAllByTestId } = setupTest(true);

		const firstSectionCard = getAllByTestId("section-card")[0];

		const { getByDisplayValue, queryByDisplayValue } = within(firstSectionCard);

		const nameInput = getByDisplayValue("First Portrait Section");

		fireEvent.change(nameInput, { target: { value: "Updated Portait Section" } });

		expect(queryByDisplayValue("First Portrait Section")).not.toBeInTheDocument();
		expect(queryByDisplayValue("Updated Portait Section")).toBeInTheDocument();
	});

	it("should show confirm dialog on clicking Delete", () => {
		const { getAllByTestId } = setupTest(true);

		const firstSectionCard = getAllByTestId("section-card")[0];

		const { getByLabelText, queryByDisplayValue } = within(firstSectionCard);

		expect(queryByDisplayValue("First Portrait Section")).toBeInTheDocument();
		expect(screen.queryByText(/confirm to delete/i)).not.toBeInTheDocument();

		fireEvent.click(getByLabelText("Delete"));

		expect(screen.queryByText(/confirm to delete/i)).toBeInTheDocument();
	});

	it("should open editor", () => {
		const { getAllByTestId } = setupTest(true, true);

		const firstSectionCard = getAllByTestId("section-card")[0];

		const { getByLabelText, queryByDisplayValue } = within(firstSectionCard);

		expect(queryByDisplayValue("First Portrait Section")).toBeInTheDocument();
		expect(screen.queryByText(/section editor/i)).not.toBeInTheDocument();

		fireEvent.click(getByLabelText("Open Editor"));

		expect(screen.queryByText(/section editor/i)).toBeInTheDocument();
	});
});

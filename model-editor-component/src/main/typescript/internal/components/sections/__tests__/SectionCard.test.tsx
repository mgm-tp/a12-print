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

import type { Section, PartialSection } from "@com.mgmtp.a12.print/print-model-api/model";
import { SectionUsage, PageOrientation } from "@com.mgmtp.a12.print/print-model-api/model";
import type { TransactionLogStoreEntryMap } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { TransactionLog } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { initialStateLogStore } from "../../../redux/index.js";
import { createMmMeasure } from "../../../utils/index.js";
import {
	createTransactionLogState,
	renderWithProviders,
	initialStateLogStoreMock,
} from "../../../../../../test/typescript/test-utils/index.js";

import { SectionCard } from "../SectionCard.js";

const mockSection: Section = {
	id: "sectionId1",
	title: "First Portrait Section",
	sectionUsage: SectionUsage.First,
	pageOrientation: PageOrientation.Portrait,
	elementReferences: [],
	footerHeight: createMmMeasure(0),
	headerHeight: createMmMeasure(0),
};

export const initialStateMock: TransactionLogStoreEntryMap<PartialSection> = {
	[mockSection.id]: TransactionLog.createStoreEntrySection(
		initialStateLogStore.sections,
		mockSection,
		"j91thg391th39"
	).storeEntry,
};

describe("SectionCard", () => {
	const setupTest = (component: ReactElement) =>
		renderWithProviders(component, {
			TransactionLogState: createTransactionLogState({
				...initialStateLogStoreMock,
				sections: {
					id: "omf2iomg234",
					map: {
						...initialStateMock,
					},
				},
			}),
		});

	it("should render empty portrait-first section card correctly", () => {
		const { queryByText, queryByTitle } = setupTest(
			<SectionCard pageOrientation={PageOrientation.Portrait} sectionUsage={SectionUsage.First} />
		);

		expect(queryByText("Add")).toBeInTheDocument();

		const icon = queryByTitle("Portrait");
		expect(icon).toBeInTheDocument();

		if (!icon) {
			throw new Error();
		}

		expect(icon.classList.contains("plasma-icon")).toBeTruthy();
		expect(queryByTitle("Remaining")).not.toBeInTheDocument();
	});

	it("should render empty portrait-remaining section card correctly", () => {
		const { queryByText, getByTitle } = setupTest(
			<SectionCard pageOrientation={PageOrientation.Portrait} sectionUsage={SectionUsage.Remaining} />
		);

		expect(queryByText("Add")).toBeInTheDocument();
		expect(getByTitle("Portrait").classList.contains("plasma-icon")).toBeTruthy();
		expect(getByTitle("Remaining").classList.contains("plasma-icon")).toBeTruthy();
	});

	it("should render empty landscape-first section card correctly", () => {
		const { queryByText, queryByTitle } = setupTest(
			<SectionCard pageOrientation={PageOrientation.Landscape} sectionUsage={SectionUsage.First} />
		);

		expect(queryByText("Add")).toBeInTheDocument();

		const icon = queryByTitle("Landscape");
		expect(icon).toBeInTheDocument();

		if (!icon) {
			throw new Error();
		}

		expect(icon.classList.contains("plasma-icon")).toBeTruthy();
		expect(queryByTitle("Remaining")).not.toBeInTheDocument();
	});

	it("should render empty landscape-remaining section card correctly", () => {
		const { queryByText, getByTitle } = setupTest(
			<SectionCard pageOrientation={PageOrientation.Landscape} sectionUsage={SectionUsage.Remaining} />
		);

		expect(queryByText("Add")).toBeInTheDocument();
		expect(getByTitle("Landscape").classList.contains("plasma-icon")).toBeTruthy();
		expect(getByTitle("Remaining").classList.contains("plasma-icon")).toBeTruthy();
	});

	describe("With provdided data", () => {
		it("should render correctly", () => {
			const { queryByText, queryByDisplayValue, getByLabelText } = setupTest(
				<SectionCard
					section={mockSection}
					pageOrientation={mockSection.pageOrientation}
					sectionUsage={mockSection.sectionUsage}
				/>
			);

			expect(queryByText("Add")).not.toBeInTheDocument();
			expect(queryByDisplayValue("First Portrait Section")).toBeInTheDocument();

			const openMenuIcon = getByLabelText("Open Editor");
			const deleteIcon = getByLabelText("Delete");

			expect(openMenuIcon).toBeInTheDocument();
			expect(deleteIcon).toBeInTheDocument();

			if (!openMenuIcon || !deleteIcon) {
				throw new Error();
			}

			expect(openMenuIcon.getElementsByClassName("plasma-icon")).toHaveLength(1);
			expect(deleteIcon.getElementsByClassName("plasma-icon")).toHaveLength(1);
		});
	});
});

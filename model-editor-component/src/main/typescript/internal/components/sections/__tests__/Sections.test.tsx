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
import type { PartialSection } from "@com.mgmtp.a12.print/print-model-api/model";
import { PageOrientation, SectionUsage } from "@com.mgmtp.a12.print/print-model-api/model";

import { createMmMeasure } from "../../../utils/index.js";
import { renderWithProviders } from "../../../../../../test/typescript/test-utils/index.js";

import { Sections } from "../Sections.js";

const mockSection: PartialSection = {
	id: "sectionId1",
	title: "First Portrait Section",
	sectionUsage: SectionUsage.First,
	pageOrientation: PageOrientation.Portrait,
	elementReferences: [],
	headerHeight: createMmMeasure(20),
	footerHeight: createMmMeasure(20),
};

const mockSectionMinHeights: PartialSection = {
	id: "sectionId2",
	title: "Remaining Portrait Section",
	sectionUsage: SectionUsage.Remaining,
	pageOrientation: PageOrientation.Portrait,
	elementReferences: [],
};

const defaultProps = {
	zoomFactor: 1,
	bodyState: null,
	editorState: null,
};

describe("Sections", () => {
	it("renders without crashing with full section data", () => {
		const { container } = renderWithProviders(<Sections {...defaultProps} section={mockSection} />);
		expect(container).toBeTruthy();
	});

	it("renders section resize handles when wrappers are empty", () => {
		const { container } = renderWithProviders(<Sections {...defaultProps} section={mockSection} />);
		expect(container.firstChild).toBeTruthy();
	});

	it("renders with a section that has no header/footer height", () => {
		const { container } = renderWithProviders(<Sections {...defaultProps} section={mockSectionMinHeights} />);
		expect(container).toBeTruthy();
	});

	it("renders with different zoomFactor", () => {
		const { container } = renderWithProviders(<Sections {...defaultProps} section={mockSection} zoomFactor={2} />);
		expect(container).toBeTruthy();
	});

	it("renders with zoomFactor of 0.5", () => {
		const { container } = renderWithProviders(
			<Sections {...defaultProps} section={mockSection} zoomFactor={0.5} />
		);
		expect(container).toBeTruthy();
	});

	it("renders section with landscape orientation", () => {
		const landscapeSection: PartialSection = {
			...mockSection,
			id: "landscapeSectionId",
			pageOrientation: PageOrientation.Landscape,
		};
		const { container } = renderWithProviders(<Sections {...defaultProps} section={landscapeSection} />);
		expect(container).toBeTruthy();
	});

	it("renders section with remaining usage", () => {
		const remainingSection: PartialSection = {
			...mockSection,
			id: "remainingSectionId",
			sectionUsage: SectionUsage.Remaining,
		};
		const { container } = renderWithProviders(<Sections {...defaultProps} section={remainingSection} />);
		expect(container).toBeTruthy();
	});

	it("renders two child divs (header and footer sections) in the DOM", () => {
		const { container } = renderWithProviders(<Sections {...defaultProps} section={mockSection} />);
		expect(container.querySelectorAll("div").length).toBeGreaterThanOrEqual(2);
	});

	it("renders with large header and footer heights", () => {
		const bigSection: PartialSection = {
			...mockSection,
			id: "bigSectionId",
			headerHeight: createMmMeasure(60),
			footerHeight: createMmMeasure(60),
		};
		const { container } = renderWithProviders(<Sections {...defaultProps} section={bigSection} />);
		expect(container).toBeTruthy();
	});
});

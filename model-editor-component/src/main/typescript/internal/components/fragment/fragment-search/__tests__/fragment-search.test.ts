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
	ElementType,
	MeasureUnit,
	PageOrientation,
	SectionUsage,
	SegmentType,
} from "@com.mgmtp.a12.print/print-model-api/model";
import type {
	FragmentEntity,
	FragmentType,
	PartialSection,
	PartialSegment,
	PartialText,
	PartialWatermark,
} from "@com.mgmtp.a12.print/print-model-api/model";

import type { FragmentNode } from "../../nodes/FragmentNode.js";
import type { FragmentTypeNode } from "../../nodes/FragmentTypeNode.js";

import { filterFragmentTypeNodeBySearchString } from "../fragment-search.js";

const mockSection: PartialSection = {
	id: "sectionId1",
	title: "Invoice Header",
	sectionUsage: SectionUsage.First,
	pageOrientation: PageOrientation.Portrait,
	headerHeight: { id: "headerHeightId1", value: 20, unit: MeasureUnit.Millimeter },
	footerHeight: { id: "footerHeightId1", value: 10, unit: MeasureUnit.Millimeter },
	elementReferences: [],
};

const mockWatermark: PartialWatermark = {
	id: "watermarkId1",
	title: "Draft Notice",
	pageOrientation: PageOrientation.Portrait,
	elementReferences: [],
};

const mockSegment: PartialSegment = {
	id: "segmentId1",
	title: "Address Block",
	type: SegmentType.Default,
	elementReferences: [],
};

const mockElement: PartialText = {
	id: "elementId1",
	type: ElementType.Text,
	isFragment: true,
	name: "text_invoice_total",
};

const mockElementWithoutName: PartialText = {
	id: "elementId2",
	type: ElementType.Text,
	isFragment: true,
};

/**
 * Mirrors the shape produced by {@link FragmentNode.createFragmentNode} without pulling in the React/Redux
 * dependencies of the real factory — the filter only ever reads `fragment`.
 */
const createNode = (fragmentType: FragmentType, label: string, fragment: unknown): FragmentNode => ({
	id: (fragment as { id: string }).id,
	label,
	icon: null,
	fragmentType,
	fragment: fragment as FragmentEntity,
});

const createTypeNode = (
	type: FragmentType,
	label: FragmentTypeNode["label"],
	children?: FragmentNode[]
): FragmentTypeNode => ({
	id: `${type}s`,
	label,
	type,
	initiallyExpanded: true,
	children,
});

const sectionNode = createNode("section", "Invoice Header", mockSection);
const watermarkNode = createNode("watermark", "Draft Notice", mockWatermark);
const segmentNode = createNode("segment", "Address Block", mockSegment);
const elementNode = createNode("element", "text_invoice_total", mockElement);
const unnamedElementNode = createNode("element", "New Text", mockElementWithoutName);

describe("fragment search — matching", () => {
	it("should keep a section whose title contains the search string", () => {
		const typeNode = createTypeNode("section", "Sections", [sectionNode]);

		const result = filterFragmentTypeNodeBySearchString(typeNode, "Invoice");

		expect(result.children).toEqual([sectionNode]);
	});

	it("should keep a watermark whose title contains the search string", () => {
		const typeNode = createTypeNode("watermark", "Watermarks", [watermarkNode]);

		const result = filterFragmentTypeNodeBySearchString(typeNode, "Notice");

		expect(result.children).toEqual([watermarkNode]);
	});

	it("should keep a segment whose title contains the search string", () => {
		const typeNode = createTypeNode("segment", "Segments", [segmentNode]);

		const result = filterFragmentTypeNodeBySearchString(typeNode, "Address");

		expect(result.children).toEqual([segmentNode]);
	});

	it("should keep a fragment element whose name contains the search string", () => {
		const typeNode = createTypeNode("element", "Elements", [elementNode]);

		const result = filterFragmentTypeNodeBySearchString(typeNode, "total");

		expect(result.children).toEqual([elementNode]);
	});

	it("should match on a partial title, not only on the full title", () => {
		const typeNode = createTypeNode("section", "Sections", [sectionNode]);

		const result = filterFragmentTypeNodeBySearchString(typeNode, "voice Hea");

		expect(result.children).toEqual([sectionNode]);
	});

	it.each(["invoice", "INVOICE", "InVoIcE"])("should match case-insensitively for '%s'", searchString => {
		const typeNode = createTypeNode("section", "Sections", [sectionNode]);

		const result = filterFragmentTypeNodeBySearchString(typeNode, searchString);

		expect(result.children).toEqual([sectionNode]);
	});

	it("should drop fragments that do not match and keep the ones that do", () => {
		const otherSectionNode = createNode("section", "Cover Page", {
			...mockSection,
			id: "sectionId2",
			title: "Cover Page",
		});
		const typeNode = createTypeNode("section", "Sections", [sectionNode, otherSectionNode]);

		const result = filterFragmentTypeNodeBySearchString(typeNode, "Cover");

		expect(result.children).toEqual([otherSectionNode]);
	});

	it("should drop a fragment element without a name", () => {
		const typeNode = createTypeNode("element", "Elements", [elementNode, unnamedElementNode]);

		const result = filterFragmentTypeNodeBySearchString(typeNode, "text");

		expect(result.children).toEqual([elementNode]);
	});
});

describe("fragment search — type node handling", () => {
	it("should expand the type node when it has hits", () => {
		const typeNode = createTypeNode("section", "Sections", [sectionNode]);

		const result = filterFragmentTypeNodeBySearchString(typeNode, "Invoice");

		expect(result.initiallyExpanded).toBe(true);
	});

	it("should collapse the type node when nothing matches", () => {
		const typeNode = createTypeNode("section", "Sections", [sectionNode]);

		const result = filterFragmentTypeNodeBySearchString(typeNode, "no-such-fragment");

		expect(result.children).toEqual([]);
		expect(result.initiallyExpanded).toBe(false);
	});

	it("should keep the type node itself so the grouping stays visible while filtering", () => {
		const typeNode = createTypeNode("section", "Sections", [sectionNode]);

		const result = filterFragmentTypeNodeBySearchString(typeNode, "no-such-fragment");

		expect(result.id).toBe(typeNode.id);
		expect(result.label).toBe("Sections");
		expect(result.type).toBe("section");
	});

	it("should handle a type node without any children", () => {
		const typeNode = createTypeNode("element", "Elements");

		const result = filterFragmentTypeNodeBySearchString(typeNode, "anything");

		expect(result.children).toBeUndefined();
		expect(result.initiallyExpanded).toBe(false);
	});

	it("should not mutate the given type node", () => {
		const typeNode = createTypeNode("section", "Sections", [sectionNode]);

		filterFragmentTypeNodeBySearchString(typeNode, "no-such-fragment");

		expect(typeNode.children).toEqual([sectionNode]);
		expect(typeNode.initiallyExpanded).toBe(true);
	});

	it("should keep the children of a matched fragment node untouched", () => {
		const settingsNode = { id: "sectionId1-settings", label: "Settings" };
		const nodeWithSettings: FragmentNode = { ...sectionNode, children: [settingsNode] };
		const typeNode = createTypeNode("section", "Sections", [nodeWithSettings]);

		const result = filterFragmentTypeNodeBySearchString(typeNode, "Invoice");

		expect(result.children?.[0].children).toEqual([settingsNode]);
	});
});

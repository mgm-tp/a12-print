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
	type PartialPrintModelContent,
	type PartialSection,
	type PartialSegment,
	type PartialWatermark,
	PageOrientation,
	SegmentType,
} from "../../../model/index.js";
import { PossibleInputSource } from "../../../input-source/index.js";

import { clonePrintModelEntity } from "../base.js";
import { clonePrintModelElement } from "../print-model-element.js";
import { cloneSection } from "../section.js";
import type { CloneContext } from "../type.js";
import { collectRequiredModelReferences, collectUsedTextStyleIds, createFragmentElementGetter } from "../fragment.js";

const styledTextElement = {
	id: "text-styled",
	name: "TextStyled",
	type: ElementType.Text,
	text: { id: "text-styled-body", text: "Styled", entities: [] },
	textProperties: {
		id: "tp-styled",
		textStyleId: {
			id: "tsi-1",
			source: PossibleInputSource.INPUT,
			value: "style-1",
			path: "textProperties.textStyleId",
		},
	},
};

const plainTextElement = {
	id: "text-plain",
	name: "TextPlain",
	type: ElementType.Text,
	text: { id: "text-plain-body", text: "Plain", entities: [] },
	textProperties: {
		id: "tp-plain",
		textStyleId: { id: "tsi-plain", source: PossibleInputSource.DEFAULT, path: "textProperties.textStyleId" },
	},
};

const nestedStyledTextElement = {
	id: "text-nested",
	name: "TextNested",
	type: ElementType.Text,
	text: { id: "text-nested-body", text: "Nested", entities: [] },
	textProperties: {
		id: "tp-nested",
		textStyleId: {
			id: "tsi-2",
			source: PossibleInputSource.INPUT,
			value: "style-2",
			path: "textProperties.textStyleId",
		},
	},
};

const areaElement = {
	id: "area-1",
	name: "Area1",
	type: ElementType.Area,
	area: {
		id: "area-inner-1",
		elementReferences: [{ id: "area-ref-1", refId: "text-nested" }],
	},
};

const fieldElement = {
	id: "field-1",
	name: "Field1",
	type: ElementType.Field,
	field: { id: "field-props-1", model: "DocModel1", path: "/foo" },
};

const expressionElement = {
	id: "expr-1",
	name: "Expression1",
	type: ElementType.Expression,
	expression: { id: "expr-props-1", model: "DocModel2", basePath: "/", text: "1" },
};

const dynamicImageElement = {
	id: "image-1",
	name: "Image1",
	type: ElementType.Image,
	image: {
		id: "image-props-1",
		imageSrcType: "Dynamic",
		alternativeText: "alt",
		fieldSource: { id: "image-field-source-1", model: "DocModel4", path: "/image" },
	},
};

const elementDefinitions = [
	styledTextElement,
	plainTextElement,
	nestedStyledTextElement,
	areaElement,
	fieldElement,
	expressionElement,
	dynamicImageElement,
];

function makeFragmentContent(overrides: Partial<PartialPrintModelContent> = {}): PartialPrintModelContent {
	return {
		id: "fragment-content",
		elementDefinitions,
		textStyles: {
			id: "fragment-text-styles",
			definitions: [
				{ id: "style-1", name: "Style1" },
				{ id: "style-2", name: "Style2WithTypesetting", typesettingModelName: "Typesetting1" },
			],
		},
		...overrides,
	};
}

describe("createFragmentElementGetter", () => {
	test("resolves an id present in the fragment's elementDefinitions", () => {
		const getter = createFragmentElementGetter(makeFragmentContent());
		expect(getter("text-styled")).toBe(styledTextElement);
	});

	test("returns undefined for an unknown id", () => {
		const getter = createFragmentElementGetter(makeFragmentContent());
		expect(getter("does-not-exist")).toBeUndefined();
	});

	test("returns undefined when the fragment has no elementDefinitions", () => {
		const getter = createFragmentElementGetter({ id: "empty" });
		expect(getter("text-styled")).toBeUndefined();
	});
});

function makeContext(overrides: Partial<CloneContext> = {}): CloneContext {
	const fragmentContent = makeFragmentContent();
	return {
		getElement: createFragmentElementGetter(fragmentContent),
		cloneObject: clonePrintModelEntity,
		elementIdMap: new Map(),
		...overrides,
	};
}

describe("cloneSection with a fragment-sourced getter", () => {
	const section: PartialSection = {
		id: "fragment-section-1",
		pageOrientation: PageOrientation.Portrait,
		headerHeight: undefined,
		elementReferences: [
			{ id: "ref-styled", refId: "text-styled" },
			{ id: "ref-plain", refId: "text-plain" },
			{ id: "ref-missing", refId: "does-not-exist" },
		],
	};

	test("produces a section whose elementReferences.refId all point at cloned elements", () => {
		const { clonedSection, clonedSectionElements } = cloneSection(section, makeContext());
		const clonedIds = new Set(clonedSectionElements.map(element => element.id));
		expect(clonedSection.elementReferences?.length).toBe(2);
		clonedSection.elementReferences?.forEach(reference => {
			expect(clonedIds.has(reference.refId as string)).toBe(true);
		});
	});

	test("every cloned id differs from the original, and elementIdMap maps old to new", () => {
		const context = makeContext();
		const { clonedSection, clonedSectionElements } = cloneSection(section, context);
		expect(clonedSection.id).not.toBe(section.id);
		clonedSectionElements.forEach((element, index) => {
			expect(element.id).not.toBe([styledTextElement, plainTextElement][index]?.id);
		});
		expect(context.elementIdMap.get("ref-styled")).toBeDefined();
		expect(context.elementIdMap.get("ref-styled")).not.toBe("ref-styled");
	});

	test("does not mutate the original fragment content object", () => {
		const fragmentContent = makeFragmentContent();
		const pristine = JSON.parse(JSON.stringify(fragmentContent));
		cloneSection(section, {
			getElement: createFragmentElementGetter(fragmentContent),
			cloneObject: clonePrintModelEntity,
			elementIdMap: new Map(),
		});
		expect(fragmentContent).toEqual(pristine);
	});

	test("onUnresolved fires once per unresolvable elementReference, and cloning still returns", () => {
		const calls: Array<[string, string]> = [];
		const onUnresolved = (kind: "element" | "textStyle", id: string) => calls.push([kind, id]);
		const { clonedSection } = cloneSection(section, makeContext({ onUnresolved }));
		expect(calls).toEqual([["element", "does-not-exist"]]);
		expect(clonedSection.elementReferences?.length).toBe(2);
	});

	test("onUnresolved reports the reference's own id when refId is missing", () => {
		const calls: Array<[string, string]> = [];
		const onUnresolved = (kind: "element" | "textStyle", id: string) => calls.push([kind, id]);
		const sectionWithNoRefId: PartialSection = {
			id: "fragment-section-2",
			pageOrientation: PageOrientation.Portrait,
			headerHeight: undefined,
			elementReferences: [{ id: "ref-no-target" }],
		};
		cloneSection(sectionWithNoRefId, makeContext({ onUnresolved }));
		expect(calls).toEqual([["element", "ref-no-target"]]);
	});
});

describe("collectUsedTextStyleIds", () => {
	const fragmentContent = makeFragmentContent();

	test("returns the text style id used directly by an element in a section", () => {
		const section: PartialSection = {
			id: "section-1",
			pageOrientation: PageOrientation.Portrait,
			headerHeight: undefined,
			elementReferences: [{ id: "ref-styled", refId: "text-styled" }],
		};
		expect(collectUsedTextStyleIds(section, fragmentContent)).toEqual(new Set(["style-1"]));
	});

	test("returns an empty set when no element in the section uses a text style", () => {
		const section: PartialSection = {
			id: "section-2",
			pageOrientation: PageOrientation.Landscape,
			headerHeight: undefined,
			elementReferences: [{ id: "ref-plain", refId: "text-plain" }],
		};
		expect(collectUsedTextStyleIds(section, fragmentContent)).toEqual(new Set());
	});

	test("finds a text style used by an element nested inside another element (e.g. an Area)", () => {
		const section: PartialSection = {
			id: "section-3",
			pageOrientation: PageOrientation.Portrait,
			headerHeight: undefined,
			elementReferences: [{ id: "ref-area", refId: "area-1" }],
		};
		expect(collectUsedTextStyleIds(section, fragmentContent)).toEqual(new Set(["style-2"]));
	});

	test("dispatches to walkSegment for a PartialSegment container", () => {
		const segment: PartialSegment = {
			id: "segment-1",
			type: SegmentType.Default,
			elementReferences: [{ id: "ref-styled", refId: "text-styled" }],
		};
		expect(collectUsedTextStyleIds(segment, fragmentContent)).toEqual(new Set(["style-1"]));
	});

	test("dispatches to walkWatermark for a PartialWatermark container", () => {
		const watermark: PartialWatermark = {
			id: "watermark-1",
			pageOrientation: PageOrientation.Portrait,
			elementReferences: [{ id: "ref-styled", refId: "text-styled" }],
		};
		expect(collectUsedTextStyleIds(watermark, fragmentContent)).toEqual(new Set(["style-1"]));
	});

	test("does not double-count when several elements use the same text style", () => {
		const section: PartialSection = {
			id: "section-4",
			pageOrientation: PageOrientation.Portrait,
			headerHeight: undefined,
			elementReferences: [
				{ id: "ref-styled-a", refId: "text-styled" },
				{ id: "ref-area", refId: "area-1" },
			],
		};
		expect(collectUsedTextStyleIds(section, fragmentContent)).toEqual(new Set(["style-1", "style-2"]));
	});

	test("accepts a leaf element as the root", () => {
		expect(collectUsedTextStyleIds(styledTextElement, fragmentContent)).toEqual(new Set(["style-1"]));
	});

	test("accepts a wrapper element as the root and descends into its children", () => {
		expect(collectUsedTextStyleIds(areaElement, fragmentContent)).toEqual(new Set(["style-2"]));
	});
});

describe("collectUsedTextStyleIds for tables and listings", () => {
	const styledTextProperties = (id: string, textStyleId: string) => ({
		id,
		textStyleId: {
			id: `${id}-tsi`,
			source: PossibleInputSource.INPUT,
			value: textStyleId,
			path: "textProperties.textStyleId",
		},
	});

	const tableWithStyledHeader = {
		id: "table-styled-header",
		name: "TableStyledHeader",
		type: ElementType.Table,
		table: {
			id: "table-inner",
			basePath: "/rows",
			headerTextProperties: styledTextProperties("tp-table-header", "style-1"),
			columns: [{ id: "table-col-ref", refId: "text-plain" }],
		},
	};

	const listingWithStyledHeader = {
		id: "listing-styled-header",
		name: "ListingStyledHeader",
		type: ElementType.Listing,
		listing: {
			id: "listing-inner-header",
			basePath: "/rows",
			headerTextProperties: styledTextProperties("tp-listing-header", "style-1"),
			columns: [],
		},
	};

	const listingWithStyledColumn = {
		id: "listing-styled-column",
		name: "ListingStyledColumn",
		type: ElementType.Listing,
		listing: {
			id: "listing-inner-column",
			basePath: "/rows",
			columns: [{ id: "listing-col-1", textProperties: styledTextProperties("tp-listing-col", "style-2") }],
		},
	};

	const fragmentContent = makeFragmentContent({
		elementDefinitions: [
			...elementDefinitions,
			tableWithStyledHeader,
			listingWithStyledHeader,
			listingWithStyledColumn,
		],
	});

	test.each([
		["a table header", tableWithStyledHeader, "style-1"],
		["a listing header", listingWithStyledHeader, "style-1"],
		["a listing column", listingWithStyledColumn, "style-2"],
	])("finds the text style used by %s", (_, element, expectedStyleId) => {
		expect(collectUsedTextStyleIds(element, fragmentContent)).toEqual(new Set([expectedStyleId]));
	});

	test.each([
		["a table with a styled header", tableWithStyledHeader],
		["a listing with a styled header", listingWithStyledHeader],
		["a listing with a styled column", listingWithStyledColumn],
	])("%s can be cloned with a text style id map built from the collected ids (unlink)", (_, element) => {
		const textStyleIdMap = new Map(
			[...collectUsedTextStyleIds(element, fragmentContent)].map(id => [id, `local-${id}`])
		);
		const context: CloneContext = {
			getElement: createFragmentElementGetter(fragmentContent),
			cloneObject: clonePrintModelEntity,
			elementIdMap: new Map(),
			textStyleIdMap,
		};
		expect(() => clonePrintModelElement(element, context)).not.toThrow();
	});
});

describe("collectRequiredModelReferences", () => {
	const fragmentContent = makeFragmentContent();

	test("collects document models from Field and Expression bindings", () => {
		const segment: PartialSegment = {
			id: "segment-1",
			type: SegmentType.Default,
			elementReferences: [
				{ id: "ref-field", refId: "field-1" },
				{ id: "ref-expr", refId: "expr-1" },
			],
		};
		const result = collectRequiredModelReferences(segment, fragmentContent, new Set());
		expect(result.documentModels).toEqual(new Set(["DocModel1", "DocModel2"]));
		expect(result.typesettingModels).toEqual(new Set());
	});

	test("collects a segment's own dataContexts model", () => {
		const segment: PartialSegment = {
			id: "segment-2",
			type: SegmentType.Repeatable,
			dataContexts: [{ id: "dc-1", model: "DocModel3", path: "/x", isRepetition: false }],
			elementReferences: [{ id: "ref-plain", refId: "text-plain" }],
		};
		const result = collectRequiredModelReferences(segment, fragmentContent, new Set());
		expect(result.documentModels).toEqual(new Set(["DocModel3"]));
	});

	test("resolves typesettingModelName for each id in usedTextStyleIds", () => {
		const section: PartialSection = {
			id: "section-1",
			pageOrientation: PageOrientation.Portrait,
			headerHeight: undefined,
			elementReferences: [],
		};
		const result = collectRequiredModelReferences(section, fragmentContent, new Set(["style-2"]));
		expect(result.typesettingModels).toEqual(new Set(["Typesetting1"]));
	});

	test("ignores usedTextStyleIds not present in the fragment's text style definitions", () => {
		const section: PartialSection = {
			id: "section-1",
			pageOrientation: PageOrientation.Portrait,
			headerHeight: undefined,
			elementReferences: [],
		};
		const result = collectRequiredModelReferences(section, fragmentContent, new Set(["does-not-exist"]));
		expect(result.typesettingModels).toEqual(new Set());
	});

	test("returns empty sets when nothing is bound", () => {
		const section: PartialSection = {
			id: "section-2",
			pageOrientation: PageOrientation.Landscape,
			headerHeight: undefined,
			elementReferences: [{ id: "ref-plain", refId: "text-plain" }],
		};
		const result = collectRequiredModelReferences(section, fragmentContent, new Set());
		expect(result.documentModels).toEqual(new Set());
		expect(result.typesettingModels).toEqual(new Set());
	});

	test("collects a document model from an Image's fieldSource binding", () => {
		const segment: PartialSegment = {
			id: "segment-3",
			type: SegmentType.Default,
			elementReferences: [{ id: "ref-image", refId: "image-1" }],
		};
		const result = collectRequiredModelReferences(segment, fragmentContent, new Set());
		expect(result.documentModels).toEqual(new Set(["DocModel4"]));
	});

	test("accepts an element as the root", () => {
		const result = collectRequiredModelReferences(fieldElement, fragmentContent, new Set());
		expect(result.documentModels).toEqual(new Set(["DocModel1"]));
	});
});

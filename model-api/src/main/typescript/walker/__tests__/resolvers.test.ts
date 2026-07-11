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
	type PrintModel,
	type PrintModelElement,
	type Reference,
	type Segment,
	type Section,
	type SegmentReference,
	type Watermark,
	type PartialPrintModel,
	type PartialPrintModelElement,
	type PartialReference,
	type PartialSegmentReferences,
	SegmentType,
	ElementType,
	PageOrientation,
	SectionUsage,
	MeasureUnit,
	SegmentReferencePurpose,
	SegmentReferenceDirection,
} from "../../model/index.js";

import { ReferenceListResolver, CachedReferenceResolver } from "../reference-resolver.js";
import { ReferenceElementListResolver, CachedReferenceElementListResolver } from "../reference-element-resolver.js";
import { DefaultSegmentIdResolver, CachedSegmentIdResolver } from "../segment-id-resolver.js";
import { DefaultSectionIdResolver, CachedSectionIdResolver } from "../section-id-resolver.js";
import { DefaultWatermarkIdResolver, CachedWatermarkIdResolver } from "../watermark-id-resolver.js";
import { PrintModelListResolver, CachedPrintModelListResolver } from "../print-model-resolver.js";
import { PartialReferenceListResolver, PartialCachedReferenceResolver } from "../partial/partial-reference-resolver.js";
import {
	PartialReferenceElementListResolver,
	CachedPartialReferenceElementListResolver,
} from "../partial/parital-reference-element-resolver.js";

function makeElement(id: string): PrintModelElement {
	return { id, type: ElementType.Field, field: { id: `f-${id}`, path: "/test" } } as PrintModelElement;
}

function makeReference(refId: string): Reference {
	return { id: `ref-${refId}`, refId };
}

function makeSegment(id: string): Segment {
	return { id, title: `Segment ${id}`, type: SegmentType.Default, elementReferences: [] };
}

function makeSection(id: string): Section {
	return {
		id,
		title: `Section ${id}`,
		pageOrientation: PageOrientation.Portrait,
		sectionUsage: SectionUsage.First,
		elementReferences: [],
		footerHeight: {
			id: "fh-1",
			value: 10,
			unit: MeasureUnit.Millimeter,
		},
		headerHeight: {
			id: "hh-1",
			value: 10,
			unit: MeasureUnit.Millimeter,
		},
	};
}

function makeWatermark(id: string): Watermark {
	return {
		id,
		title: `Watermark ${id}`,
		pageOrientation: PageOrientation.Portrait,
		elementReferences: [],
	};
}

function makeSegmentReference(id: string): SegmentReference {
	return {
		id,
		referenceModel: "some-model",
		purpose: SegmentReferencePurpose.DINTemplate,
		direction: SegmentReferenceDirection.IncomingReference,
	};
}

function makePrintModel(id: string): PrintModel {
	return {
		header: { id, modelType: "print", modelVersion: "4.0.0", description: "" },
		content: {
			id: "content-1",
			general: {
				id: "g-1",
				structure: [],
				metadata: {
					id: "m-1",
					titleComputation: [],
					descriptionComputation: [],
					authorComputation: [],
					languageComputation: [],
				},
				segmentDefaults: { id: "sd-1", fontSize: 10 },
			},
			segments: { id: "s-1", definitions: [], references: [] },
			elementDefinitions: [],
		},
	};
}

describe("ReferenceListResolver", () => {
	const el1 = makeElement("el-1");
	const el2 = makeElement("el-2");
	const resolver = new ReferenceListResolver([el1, el2]);

	it("resolves a reference by refId", () => {
		expect(resolver.resolveReference(makeReference("el-1"))).toBe(el1);
		expect(resolver.resolveReference(makeReference("el-2"))).toBe(el2);
	});

	it("returns undefined for unknown refId", () => {
		expect(resolver.resolveReference(makeReference("unknown"))).toBeUndefined();
	});

	it("finds a reference by filter", () => {
		expect(resolver.findReference(e => e.id === "el-2")).toBe(el2);
	});

	it("returns undefined when filter matches nothing", () => {
		expect(resolver.findReference(e => e.id === "no-match")).toBeUndefined();
	});

	it("creates from model", () => {
		const model = {
			header: { id: "m1" },
			content: { elementDefinitions: [el1, el2] },
		} as unknown as PrintModel;

		const fromModel = ReferenceListResolver.fromModel(model);
		expect(fromModel.resolveReference(makeReference("el-1"))).toBe(el1);
	});
});

describe("CachedReferenceResolver", () => {
	const el1 = makeElement("el-1");
	const el2 = makeElement("el-2");
	const listResolver = new ReferenceListResolver([el1, el2]);
	const cached = new CachedReferenceResolver(listResolver);

	it("resolves and caches a reference", () => {
		const ref = makeReference("el-1");
		expect(cached.resolveReference(ref)).toBe(el1);
		// Second call uses cache
		expect(cached.resolveReference(ref)).toBe(el1);
	});

	it("returns undefined for unknown refId and does not cache", () => {
		const ref = makeReference("unknown");
		expect(cached.resolveReference(ref)).toBeUndefined();
		expect(cached.resolveReference(ref)).toBeUndefined();
	});

	it("delegates findReference to inner resolver", () => {
		expect(cached.findReference(e => e.id === "el-2")).toBe(el2);
	});
});

describe("ReferenceElementListResolver", () => {
	const ref1 = makeSegmentReference("segref-1");
	const ref2 = makeSegmentReference("segref-2");
	const resolver = new ReferenceElementListResolver([ref1, ref2]);

	it("resolves a reference element by id", () => {
		expect(resolver.resolveReferenceElement("segref-1")).toBe(ref1);
		expect(resolver.resolveReferenceElement("segref-2")).toBe(ref2);
	});

	it("returns undefined for unknown id", () => {
		expect(resolver.resolveReferenceElement("unknown")).toBeUndefined();
	});

	it("creates from model", () => {
		const model = {
			header: { id: "m1" },
			content: { segments: { definitions: [], references: [ref1, ref2] } },
		} as unknown as PrintModel;

		const fromModel = ReferenceElementListResolver.fromModel(model);
		expect(fromModel.resolveReferenceElement("segref-1")).toBe(ref1);
	});
});

describe("CachedReferenceElementListResolver", () => {
	const ref1 = makeSegmentReference("segref-1");
	const ref2 = makeSegmentReference("segref-2");
	const listResolver = new ReferenceElementListResolver([ref1, ref2]);
	const cached = new CachedReferenceElementListResolver(listResolver);

	it("resolves and caches a reference element", () => {
		expect(cached.resolveReferenceElement("segref-1")).toBe(ref1);
		// Second call uses cache
		expect(cached.resolveReferenceElement("segref-1")).toBe(ref1);
	});

	it("returns undefined for unknown id and does not cache", () => {
		expect(cached.resolveReferenceElement("unknown")).toBeUndefined();
		expect(cached.resolveReferenceElement("unknown")).toBeUndefined();
	});
});

describe("DefaultSegmentIdResolver", () => {
	const seg1 = makeSegment("seg-1");
	const seg2 = makeSegment("seg-2");
	const resolver = new DefaultSegmentIdResolver([seg1, seg2]);

	it("resolves a segment by id", () => {
		expect(resolver.resolveSegmentId("seg-1")).toBe(seg1);
		expect(resolver.resolveSegmentId("seg-2")).toBe(seg2);
	});

	it("returns undefined for unknown id", () => {
		expect(resolver.resolveSegmentId("unknown")).toBeUndefined();
	});

	it("creates from model", () => {
		const model = {
			header: { id: "m1" },
			content: { segments: { definitions: [seg1, seg2], references: [] } },
		} as unknown as PrintModel;

		const fromModel = DefaultSegmentIdResolver.fromModel(model);
		expect(fromModel.resolveSegmentId("seg-1")).toBe(seg1);
	});
});

describe("CachedSegmentIdResolver", () => {
	const seg1 = makeSegment("seg-1");
	const seg2 = makeSegment("seg-2");
	const listResolver = new DefaultSegmentIdResolver([seg1, seg2]);
	const cached = new CachedSegmentIdResolver(listResolver);

	it("resolves and caches a segment", () => {
		expect(cached.resolveSegmentId("seg-1")).toBe(seg1);
		// Second call uses cache
		expect(cached.resolveSegmentId("seg-1")).toBe(seg1);
	});

	it("returns undefined for unknown id and does not cache", () => {
		expect(cached.resolveSegmentId("unknown")).toBeUndefined();
		expect(cached.resolveSegmentId("unknown")).toBeUndefined();
	});
});

describe("DefaultSectionIdResolver", () => {
	const sec1 = makeSection("sec-1");
	const sec2 = makeSection("sec-2");
	const resolver = new DefaultSectionIdResolver([sec1, sec2]);

	it("resolves a section by id", () => {
		expect(resolver.resolveSectionId("sec-1")).toBe(sec1);
		expect(resolver.resolveSectionId("sec-2")).toBe(sec2);
	});

	it("returns undefined for unknown id", () => {
		expect(resolver.resolveSectionId("unknown")).toBeUndefined();
	});

	it("creates from model with sections", () => {
		const model = {
			header: { id: "m1" },
			content: { sections: { definitions: [sec1, sec2] } },
		} as unknown as PrintModel;

		const fromModel = DefaultSectionIdResolver.fromModel(model);
		expect(fromModel.resolveSectionId("sec-1")).toBe(sec1);
	});

	it("creates from model without sections", () => {
		const model = {
			header: { id: "m1" },
			content: {},
		} as unknown as PrintModel;

		const fromModel = DefaultSectionIdResolver.fromModel(model);
		expect(fromModel.resolveSectionId("sec-1")).toBeUndefined();
	});
});

describe("CachedSectionIdResolver", () => {
	const sec1 = makeSection("sec-1");
	const sec2 = makeSection("sec-2");
	const listResolver = new DefaultSectionIdResolver([sec1, sec2]);
	const cached = new CachedSectionIdResolver(listResolver);

	it("resolves and caches a section", () => {
		expect(cached.resolveSectionId("sec-1")).toBe(sec1);
		// Second call uses cache
		expect(cached.resolveSectionId("sec-1")).toBe(sec1);
	});

	it("returns undefined for unknown id and does not cache", () => {
		expect(cached.resolveSectionId("unknown")).toBeUndefined();
		expect(cached.resolveSectionId("unknown")).toBeUndefined();
	});
});

describe("DefaultWatermarkIdResolver", () => {
	const wm1 = makeWatermark("wm-1");
	const wm2 = makeWatermark("wm-2");
	const resolver = new DefaultWatermarkIdResolver([wm1, wm2]);

	it("resolves a watermark by id", () => {
		expect(resolver.resolveWatermarkId("wm-1")).toBe(wm1);
		expect(resolver.resolveWatermarkId("wm-2")).toBe(wm2);
	});

	it("returns undefined for unknown id", () => {
		expect(resolver.resolveWatermarkId("unknown")).toBeUndefined();
	});

	it("creates from model with watermarks", () => {
		const model = {
			header: { id: "m1" },
			content: { watermarks: { definitions: [wm1, wm2] } },
		} as unknown as PrintModel;

		const fromModel = DefaultWatermarkIdResolver.fromModel(model);
		expect(fromModel.resolveWatermarkId("wm-1")).toBe(wm1);
	});

	it("creates from model without watermarks", () => {
		const model = {
			header: { id: "m1" },
			content: {},
		} as unknown as PrintModel;

		const fromModel = DefaultWatermarkIdResolver.fromModel(model);
		expect(fromModel.resolveWatermarkId("wm-1")).toBeUndefined();
	});
});

describe("CachedWatermarkIdResolver", () => {
	const wm1 = makeWatermark("wm-1");
	const wm2 = makeWatermark("wm-2");
	const listResolver = new DefaultWatermarkIdResolver([wm1, wm2]);
	const cached = new CachedWatermarkIdResolver(listResolver);

	it("resolves and caches a watermark", () => {
		expect(cached.resolveWatermarkId("wm-1")).toBe(wm1);
		// Second call uses cache
		expect(cached.resolveWatermarkId("wm-1")).toBe(wm1);
	});

	it("returns undefined for unknown id and does not cache", () => {
		expect(cached.resolveWatermarkId("unknown")).toBeUndefined();
		expect(cached.resolveWatermarkId("unknown")).toBeUndefined();
	});
});

describe("PrintModelListResolver", () => {
	const pm1 = makePrintModel("pm-1");
	const pm2 = makePrintModel("pm-2");
	const resolver = new PrintModelListResolver([pm1, pm2]);

	it("resolves a print model by header id", () => {
		expect(resolver.resolvePrintModel("pm-1")).toBe(pm1);
		expect(resolver.resolvePrintModel("pm-2")).toBe(pm2);
	});

	it("returns undefined for unknown id", () => {
		expect(resolver.resolvePrintModel("unknown")).toBeUndefined();
	});

	it("creates from model list", () => {
		const fromList = PrintModelListResolver.fromModelList([pm1, pm2]);
		expect(fromList.resolvePrintModel("pm-1")).toBe(pm1);
	});
});

describe("CachedPrintModelListResolver", () => {
	const pm1 = makePrintModel("pm-1");
	const pm2 = makePrintModel("pm-2");
	const listResolver = new PrintModelListResolver([pm1, pm2]);
	const cached = new CachedPrintModelListResolver(listResolver);

	it("resolves and caches a print model", () => {
		expect(cached.resolvePrintModel("pm-1")).toBe(pm1);
		// Second call uses cache
		expect(cached.resolvePrintModel("pm-1")).toBe(pm1);
	});

	it("returns undefined for unknown id and does not cache", () => {
		expect(cached.resolvePrintModel("unknown")).toBeUndefined();
		expect(cached.resolvePrintModel("unknown")).toBeUndefined();
	});
});

describe("PartialReferenceListResolver", () => {
	const el1 = { id: "pel-1", type: ElementType.Field } as PartialPrintModelElement;
	const el2 = { id: "pel-2", type: ElementType.Calculation } as PartialPrintModelElement;
	const resolver = new PartialReferenceListResolver([el1, el2]);

	it("resolves a reference by refId", () => {
		const ref = { id: "r1", refId: "pel-1" } as PartialReference;
		expect(resolver.resolveReference(ref)).toBe(el1);
	});

	it("returns undefined for unknown refId", () => {
		const ref = { id: "r1", refId: "unknown" } as PartialReference;
		expect(resolver.resolveReference(ref)).toBeUndefined();
	});

	it("resolves reference with index", () => {
		const ref = { id: "r1", refId: "pel-2" } as PartialReference;
		const result = resolver.resolveReferenceWithIndex(ref);
		expect(result).toEqual({ element: el2, index: 1 });
	});

	it("returns undefined for resolveReferenceWithIndex with unknown refId", () => {
		const ref = { id: "r1", refId: "unknown" } as PartialReference;
		expect(resolver.resolveReferenceWithIndex(ref)).toBeUndefined();
	});

	it("finds a reference by filter", () => {
		expect(resolver.findReference(e => e.id === "pel-2")).toBe(el2);
	});

	it("returns undefined when filter matches nothing", () => {
		expect(resolver.findReference(e => e.id === "no-match")).toBeUndefined();
	});

	it("creates from model", () => {
		const model = {
			content: { id: "content-1", elementDefinitions: [el1, el2] },
		} as PartialPrintModel;

		const fromModel = PartialReferenceListResolver.fromModel(model);
		expect(fromModel.resolveReference({ id: "r1", refId: "pel-1" })).toBe(el1);
	});

	it("creates from model without content", () => {
		const model = { content: {} } as PartialPrintModel;
		const fromModel = PartialReferenceListResolver.fromModel(model);
		expect(fromModel.resolveReference({ id: "r1", refId: "pel-1" })).toBeUndefined();
	});
});

describe("PartialCachedReferenceResolver", () => {
	const el1 = { id: "pel-1", type: ElementType.Field } as PartialPrintModelElement;
	const el2 = { id: "pel-2", type: ElementType.Calculation } as PartialPrintModelElement;
	const listResolver = new PartialReferenceListResolver([el1, el2]);
	const cached = new PartialCachedReferenceResolver(listResolver);

	it("resolves and caches a reference", () => {
		const ref = { id: "r1", refId: "pel-1" } as PartialReference;
		expect(cached.resolveReference(ref)).toBe(el1);
		// Second call uses cache
		expect(cached.resolveReference(ref)).toBe(el1);
	});

	it("returns undefined for unknown refId", () => {
		const ref = { id: "r1", refId: "unknown" } as PartialReference;
		expect(cached.resolveReference(ref)).toBeUndefined();
	});

	it("returns undefined when refId is missing", () => {
		const ref = { id: "r1" } as PartialReference;
		expect(cached.resolveReference(ref)).toBeUndefined();
	});

	it("resolves and caches reference with index", () => {
		const ref = { id: "r2", refId: "pel-2" } as PartialReference;
		const result = cached.resolveReferenceWithIndex(ref);
		expect(result).toEqual({ element: el2, index: 1 });
		// Second call uses cache
		expect(cached.resolveReferenceWithIndex(ref)).toEqual({ element: el2, index: 1 });
	});

	it("returns undefined for resolveReferenceWithIndex with unknown refId", () => {
		const ref = { id: "r1", refId: "no-exist" } as PartialReference;
		expect(cached.resolveReferenceWithIndex(ref)).toBeUndefined();
	});

	it("returns undefined for resolveReferenceWithIndex when refId is missing", () => {
		const ref = { id: "r1" } as PartialReference;
		expect(cached.resolveReferenceWithIndex(ref)).toBeUndefined();
	});

	it("delegates findReference to inner resolver", () => {
		expect(cached.findReference(e => e.id === "pel-2")).toBe(el2);
	});
});

describe("PartialReferenceElementListResolver", () => {
	const ref1 = { id: "psegref-1", referenceModel: "model-a" } as PartialSegmentReferences;
	const ref2 = { id: "psegref-2", referenceModel: "model-b" } as PartialSegmentReferences;
	const resolver = new PartialReferenceElementListResolver([ref1, ref2]);

	it("resolves a reference element by id", () => {
		expect(resolver.resolveReferenceElement("psegref-1")).toBe(ref1);
		expect(resolver.resolveReferenceElement("psegref-2")).toBe(ref2);
	});

	it("returns undefined for unknown id", () => {
		expect(resolver.resolveReferenceElement("unknown")).toBeUndefined();
	});

	it("creates from model", () => {
		const model = {
			content: { id: "content-1", segments: { id: "segments-1", references: [ref1, ref2] } },
		} as PartialPrintModel;

		const fromModel = PartialReferenceElementListResolver.fromModel(model);
		expect(fromModel.resolveReferenceElement("psegref-1")).toBe(ref1);
	});

	it("creates from model without segments", () => {
		const model = { content: {} } as PartialPrintModel;
		const fromModel = PartialReferenceElementListResolver.fromModel(model);
		expect(fromModel.resolveReferenceElement("psegref-1")).toBeUndefined();
	});
});

describe("CachedPartialReferenceElementListResolver", () => {
	const ref1 = { id: "psegref-1", referenceModel: "model-a" } as PartialSegmentReferences;
	const ref2 = { id: "psegref-2", referenceModel: "model-b" } as PartialSegmentReferences;
	const listResolver = new PartialReferenceElementListResolver([ref1, ref2]);
	const cached = new CachedPartialReferenceElementListResolver(listResolver);

	it("resolves and caches a reference element", () => {
		expect(cached.resolveReferenceElement("psegref-1")).toBe(ref1);
		// Second call uses cache
		expect(cached.resolveReferenceElement("psegref-1")).toBe(ref1);
	});

	it("returns undefined for unknown id and does not cache", () => {
		expect(cached.resolveReferenceElement("unknown")).toBeUndefined();
		expect(cached.resolveReferenceElement("unknown")).toBeUndefined();
	});
});

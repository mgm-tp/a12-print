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
	type Area,
	type BoundingBox,
	type Calculation,
	type Field,
	type Listing,
	type Text,
	type Table,
	type TableLayout,
	type Override,
	type Switch,
	type PartialText,
	type PartialImage,
	ElementType,
	type InputSource,
	type PartialSegment,
	type PartialTextStyle,
	type PartialTextProperties,
	type PrintModel,
	type PrintModelElement,
	Alignment,
	type PartialSection,
	type PartialWatermark,
	ImageSrcType,
} from "../../model/index.js";
import { TEXT_STYLE } from "../../model/constant.js";
import printModelFixtureRaw from "../../../../test/resources/print-models/PrintModel-with-text.json" with { type: "json" };

import type { DeepPartial } from "../type-utils.js";
import {
	clonePrintModel,
	clonePrintModelEntity,
	clonePrintModelElement,
	deepCloneObject,
	deepCloneArray,
	cloneInputSource,
	cloneTextProperties,
	cloneTextStyles,
	cloneSegment,
	cloneSegments,
	cloneSections,
	CloneTreeTrace,
	ERROR_FORBID_COPY_DIN_REFERENCE,
	type CloneContext,
} from "../print-model/index.js";
import { cloneWatermarks } from "../print-model/watermark.js";

function deserializeFixture(raw: unknown): PrintModel {
	const model = JSON.parse(JSON.stringify(raw));
	const general = model.content.general;
	if (general.structure) {
		general.structure = general.structure.map((s: string | { id: string }) => (typeof s === "string" ? s : s.id));
	}
	if (general.sections) {
		general.sections = general.sections.map((s: string | { id: string }) => (typeof s === "string" ? s : s.id));
	}
	if (general.watermarks) {
		general.watermarks = general.watermarks.map((s: string | { id: string }) => (typeof s === "string" ? s : s.id));
	}
	if (general.textStyles) {
		general.textStyles = general.textStyles.map((s: string | { id: string }) => (typeof s === "string" ? s : s.id));
	}
	return model;
}

const printModel = deserializeFixture(printModelFixtureRaw);

describe("clonePrintModel", () => {
	test("creates a copy with _copy suffix when no custom id is given", () => {
		const clone = clonePrintModel(printModel);
		expect(clone.header.id).toBe(`${printModel.header.id}_copy`);
	});

	test("uses the provided printModelId for the cloned model header", () => {
		const clone = clonePrintModel(printModel, "custom-id");
		expect(clone.header.id).toBe("custom-id");
	});

	test("regenerates all element definition ids", () => {
		const clone = clonePrintModel(printModel);
		const originalIds = printModel.content.elementDefinitions.map(e => e.id);
		const clonedIds = clone.content.elementDefinitions.map(e => e.id);
		expect(clonedIds).not.toEqual(originalIds);
		expect(new Set(clonedIds).size).toBe(clonedIds.length);
	});

	test("preserves the number of element definitions", () => {
		const clone = clonePrintModel(printModel);
		expect(clone.content.elementDefinitions.length).toBe(printModel.content.elementDefinitions.length);
	});

	test("throws when the model has a DINTemplate reference", () => {
		const dinModel: PrintModel = {
			...printModel,
			header: {
				...printModel.header,
				modelReferences: [
					{
						id: "printDINRef",
						modelType: "print",
						purpose: "DINTemplate",
						reference: "someRef",
					},
				],
			},
		};
		expect(() => clonePrintModel(dinModel)).toThrow(ERROR_FORBID_COPY_DIN_REFERENCE);
	});
});

describe("deepCloneObject", () => {
	test("creates a new object with identical primitive properties", () => {
		const original = { name: "test", value: 42 };
		const clone = deepCloneObject({ target: original });
		expect(clone).toEqual(original);
		expect(clone).not.toBe(original);
	});

	test("creates new instances for nested objects", () => {
		const original = { id: "1", nested: { id: "2", value: "x" } };
		const clone = deepCloneObject({ target: original });
		expect(clone.nested).toEqual(original.nested);
		expect(clone.nested).not.toBe(original.nested);
	});

	test("applies extraAssignFunc transformation to each property", () => {
		const original = { name: "test", count: 1 };
		const clone = deepCloneObject({
			target: original,
			extraAssignFunc: (key, value) => (key === "name" ? "modified" : value),
		});
		expect(clone.name).toBe("modified");
		expect(clone.count).toBe(1);
	});
});

describe("clonePrintModelEntity", () => {
	test("returns a new object with a different id", () => {
		const entity = { id: "original-id", name: "test" };
		const clone = clonePrintModelEntity(entity);
		expect(clone.id).not.toBe("original-id");
		expect(clone.name).toBe("test");
	});

	test("regenerates nested entity ids", () => {
		const entity = { id: "parent-id", child: { id: "child-id", value: "x" } };
		const clone = clonePrintModelEntity(entity);
		expect(clone.id).not.toBe("parent-id");
		expect(clone.child.id).not.toBe("child-id");
	});
});

describe("deepCloneArray", () => {
	test("clones an array of primitives", () => {
		const original = [1, "two", 3];
		const clone = deepCloneArray({ array: original });
		expect(clone).toEqual(original);
		expect(clone).not.toBe(original);
	});

	test("deeply clones nested objects in array", () => {
		const original = [
			{ id: "1", name: "a" },
			{ id: "2", name: "b" },
		];
		const clone = deepCloneArray({ array: original });
		expect(clone).toEqual(original);
		expect(clone[0]).not.toBe(original[0]);
	});

	test("deeply clones nested arrays", () => {
		const original = [
			[1, 2],
			[3, 4],
		];
		const clone = deepCloneArray({ array: original });
		expect(clone).toEqual(original);
		expect(clone[0]).not.toBe(original[0]);
	});

	test("applies extraAssignFunc to object properties", () => {
		const original = [{ id: "old", value: 1 }];
		const clone = deepCloneArray({
			array: original,
			extraAssignFunc: (key, value) => (key === "id" ? "new" : value),
		});
		expect(clone).toEqual([{ id: "new", value: 1 }]);
	});

	test("handles mixed array of primitives and objects", () => {
		const original = [1, "str", { key: "val" }];
		const clone = deepCloneArray({ array: original });
		expect(clone).toEqual(original);
		expect(clone[2]).not.toBe(original[2]);
	});
});

describe("CloneTreeTrace", () => {
	test("stores parents from constructor", () => {
		const parents = [
			{ id: "a", type: ElementType.Text },
			{ id: "b", type: ElementType.Image },
		] as PrintModelElement[];
		const trace = new CloneTreeTrace(parents);
		expect(trace.parents).toEqual(parents);
	});

	test("with() creates a new trace with additional parents", () => {
		const trace = new CloneTreeTrace([{ id: "a", type: ElementType.Text }] as PrintModelElement[]);
		const extended = trace.with({ id: "b", type: ElementType.Image } as PrintModelElement);
		expect(extended).not.toBe(trace);
		expect(extended.parents.length).toBe(2);
		expect(trace.parents.length).toBe(1);
	});

	test("findParent returns last matching parent", () => {
		const parents: PrintModelElement[] = [
			{ id: "a", type: ElementType.Text },
			{ id: "b", type: ElementType.Image },
			{ id: "c", type: ElementType.Text },
		];
		const trace = new CloneTreeTrace(parents);
		const found = trace.findParent(p => (p as PrintModelElement).type === ElementType.Text);
		expect(found?.id).toBe("c");
	});

	test("findParent returns undefined when no match", () => {
		const trace = new CloneTreeTrace([{ id: "a", type: ElementType.Text }] as PrintModelElement[]);
		const found = trace.findParent(p => (p as PrintModelElement).type === ElementType.Table);
		expect(found).toBeUndefined();
	});

	test("findParent on empty trace returns undefined", () => {
		const trace = new CloneTreeTrace([]);
		expect(trace.findParent(() => true)).toBeUndefined();
	});
});

describe("cloneTextStyles", () => {
	test("clones matching text styles and generates new ids", () => {
		const definitions = [
			{ id: "ts-1", name: "Bold" },
			{ id: "ts-2", name: "Italic" },
		] as PartialTextStyle[];
		const result = cloneTextStyles(["ts-1", "ts-2"], definitions);
		expect(result.clonedTextStyles.length).toBe(2);
		expect(result.newTextStyles.length).toBe(2);
		expect(result.textStyleIdMap.size).toBe(2);
		expect(result.textStyleIdMap.get("ts-1")).not.toBe("ts-1");
		expect(result.clonedTextStyles[0].name).toBe("Bold");
	});

	test("skips text style ids not found in definitions", () => {
		const definitions = [{ id: "ts-1", name: "Bold" }] as PartialTextStyle[];
		const result = cloneTextStyles(["ts-1", "ts-missing"], definitions);
		expect(result.clonedTextStyles.length).toBe(1);
		expect(result.textStyleIdMap.size).toBe(1);
	});

	test("returns empty results for empty input", () => {
		const result = cloneTextStyles([], []);
		expect(result.clonedTextStyles).toEqual([]);
		expect(result.newTextStyles).toEqual([]);
		expect(result.textStyleIdMap.size).toBe(0);
	});
});

function makeGenericCloneContext(overrides: Partial<CloneContext> = {}): CloneContext {
	return {
		getElement: () => undefined,
		cloneObject: <T extends object>(obj: T) => ({ ...obj }),
		elementIdMap: new Map(),
		...overrides,
	};
}

describe("cloneInputSource", () => {
	test("returns undefined for falsy input", () => {
		const result = cloneInputSource(makeGenericCloneContext());
		expect(result).toBeUndefined();
	});

	test("clones input without reference", () => {
		const input = { id: "is-1", value: "hello" } as DeepPartial<InputSource<string>>;
		const result = cloneInputSource(makeGenericCloneContext(), input);
		expect(result).toBeDefined();
		expect(result?.id).not.toBe("is-1");
		expect(result?.value).toBe("hello");
		expect(result?.reference).toBeUndefined();
	});

	test("resolves reference from elementIdMap", () => {
		const ctx = makeGenericCloneContext({ elementIdMap: new Map([["old-ref", "new-ref"]]) });
		const input = { id: "is-1", value: "x", reference: "old-ref" } as DeepPartial<InputSource<string>>;
		const result = cloneInputSource(ctx, input);
		expect(result?.reference).toBe("new-ref");
	});

	test("throws when reference cannot be resolved", () => {
		const ctx = makeGenericCloneContext();
		const input = { id: "is-1", value: "x", reference: "unresolvable" } as DeepPartial<InputSource<string>>;
		expect(() => cloneInputSource(ctx, input)).toThrow(/Could not get parent's placeable reference id/);
	});
});

describe("cloneTextProperties", () => {
	test("returns undefined for falsy input", () => {
		expect(cloneTextProperties(makeGenericCloneContext())).toBeUndefined();
	});

	test("clones text properties without textStyleId", () => {
		const props = { id: "tp-1", alignment: { id: "a1", value: Alignment.Left } } as PartialTextProperties;
		const result = cloneTextProperties(makeGenericCloneContext(), props);
		expect(result).toBeDefined();
		expect(result?.id).not.toBe("tp-1");
	});

	test("remaps textStyleId using textStyleIdMap", () => {
		const ctx = makeGenericCloneContext({ textStyleIdMap: new Map([["old-style", "new-style"]]) });
		const props = { id: "tp-1", textStyleId: { id: "tsi-1", value: "old-style" } } as PartialTextProperties;
		const result = cloneTextProperties(ctx, props);
		expect(result?.textStyleId?.value).toBe("new-style");
	});

	test("preserves fallback textStyleId value", () => {
		const ctx = makeGenericCloneContext({ textStyleIdMap: new Map() });
		const props = {
			id: "tp-1",
			textStyleId: { id: "tsi-1", value: TEXT_STYLE.NO_TEXT_STYLE_FALLBACK_ID },
		} as PartialTextProperties;
		const result = cloneTextProperties(ctx, props);
		expect(result?.textStyleId?.value).toBe(TEXT_STYLE.NO_TEXT_STYLE_FALLBACK_ID);
	});

	test("throws when textStyleId mapping is not found", () => {
		const ctx = makeGenericCloneContext({ textStyleIdMap: new Map() });
		const props = { id: "tp-1", textStyleId: { id: "tsi-1", value: "unmapped-id" } } as PartialTextProperties;
		expect(() => cloneTextProperties(ctx, props)).toThrow(/Cannot find a new id for text style id/);
	});
});

function makeGenericContext(elements: Record<string, PrintModelElement> = {}): CloneContext {
	return {
		getElement: (id: string) => elements[id],
		cloneObject: <T extends object>(obj: T) => clonePrintModelEntity(obj),
		elementIdMap: new Map(),
	};
}

describe("cloneSegment", () => {
	test("clones a segment with no element references", () => {
		const segment = { id: "seg-1", elementReferences: [] } as PartialSegment;
		const { clonedSegment, clonedSegmentElements } = cloneSegment(segment, makeGenericContext());
		expect(clonedSegment.id).not.toBe("seg-1");
		expect(clonedSegment.elementReferences).toEqual([]);
		expect(clonedSegmentElements).toEqual([]);
	});

	test("skips references whose target element is not found", () => {
		const segment = {
			id: "seg-1",
			elementReferences: [{ id: "ref-1", refId: "missing-elem" }],
		} as PartialSegment;
		const { clonedSegment, clonedSegmentElements } = cloneSegment(segment, makeGenericContext());
		expect(clonedSegment.elementReferences).toEqual([]);
		expect(clonedSegmentElements).toEqual([]);
	});

	test("skips segment ids not found in definitions", () => {
		const result = cloneSegments(["missing-id"], [], makeGenericContext());
		expect(result.clonedSegments).toEqual([]);
		expect(result.newStructure).toEqual([]);
	});

	test("clones matching segments from structure", () => {
		const segments = [
			{ id: "seg-1", elementReferences: [] },
			{ id: "seg-2", elementReferences: [] },
		] as PartialSegment[];
		const result = cloneSegments(["seg-1"], segments, makeGenericContext());
		expect(result.clonedSegments.length).toBe(1);
		expect(result.newStructure.length).toBe(1);
		expect(result.newStructure[0]).not.toBe("seg-1");
	});
});

describe("clonePrintModelElement", () => {
	describe("Text element", () => {
		test("clones a text element with new ids", () => {
			const textElement = {
				id: "text-1",
				type: ElementType.Text,
				text: { id: "txt-body-1", text: "Hello", entities: [] },
				textProperties: undefined,
			};
			const ctx = makeGenericContext();
			const result = clonePrintModelElement(textElement, ctx);
			expect(result.length).toBe(1);
			expect(result[0].id).not.toBe("text-1");
			expect(result[0].type).toBe(ElementType.Text);
			expect((result[0] as Text).text.text).toBe("Hello");
		});

		test("clones text element with inline entity references", () => {
			const inlineElement = {
				id: "inline-elem",
				type: ElementType.Calculation,
				calculation: { id: "calc-1", name: "myCalc" },
			};
			const textElement = {
				id: "text-2",
				type: ElementType.Text,
				text: {
					id: "txt-body-2",
					text: "Value is inline-elem here",
					entities: [{ id: "ent-1", refId: "inline-elem" }],
				},
				textProperties: undefined,
			};
			const ctx = makeGenericContext({ "inline-elem": inlineElement });
			const result = clonePrintModelElement(textElement, ctx);
			// Should produce the text element + the cloned inline element
			expect(result.length).toBe(2);
			const clonedText = result[0] as Text;
			expect(clonedText.text.entities.length).toBe(1);
			expect(clonedText.text.entities[0].refId).toBe(result[1].id);
			// Text content should have old refId replaced with new one
			expect(clonedText.text.text).toContain(result[1].id);
			expect(clonedText.text.text).not.toContain("inline-elem");
		});

		test("clones textProperties when present", () => {
			const textElement = {
				id: "text-3",
				type: ElementType.Text,
				text: { id: "txt-body-3", text: "", entities: [] },
				textProperties: { id: "tp-1", bold: { id: "b-1", value: true } },
			};
			const ctx = makeGenericContext();
			const result = clonePrintModelElement(textElement, ctx);
			const cloned = result[0] as Text;
			expect(cloned.textProperties).toBeDefined();
			expect(cloned.textProperties?.id).not.toBe("tp-1");
		});
	});

	describe("Calculation element", () => {
		test("clones a calculation element preserving fieldType typeDefinition id", () => {
			const calcElement = {
				id: "calc-1",
				type: ElementType.Calculation,
				calculation: {
					id: "c-inner",
					name: "myCalc",
					fieldType: { id: "ft-1", typeDefinition: { id: "td-1", name: "MyType" } },
				},
			};
			const ctx = makeGenericContext();
			const result = clonePrintModelElement(calcElement, ctx);
			expect(result.length).toBe(1);
			expect(result[0].id).not.toBe("calc-1");
			// The typeDefinition.id should be preserved (not regenerated)
			expect((result[0] as Calculation).calculation.fieldType?.typeDefinition?.id).toBe("td-1");
		});

		test("clones calculation element without fieldType", () => {
			const calcElement = {
				id: "calc-2",
				type: ElementType.Calculation,
				calculation: { id: "c-inner-2", name: "simpleCalc" },
			};
			const ctx = makeGenericContext();
			const result = clonePrintModelElement(calcElement, ctx);
			expect(result.length).toBe(1);
			expect(result[0].id).not.toBe("calc-2");
			expect((result[0] as Calculation).calculation.name).toBe("simpleCalc");
		});
	});

	describe("Table element", () => {
		test("clones a table element with no columns", () => {
			const tableElement = {
				id: "table-1",
				type: ElementType.Table,
				table: { id: "t-inner", basePath: "items", columns: [] },
				textProperties: undefined,
			};
			const ctx = makeGenericContext();
			const result = clonePrintModelElement(tableElement, ctx);
			expect(result.length).toBe(1);
			expect(result[0].id).not.toBe("table-1");
			expect(result[0].type).toBe(ElementType.Table);
			expect((result[0] as Table).table.columns).toEqual([]);
		});

		test("clones table element with column references", () => {
			const colElement = {
				id: "col-elem-1",
				type: ElementType.Text,
				text: { id: "col-text", text: "Col", entities: [] },
			};
			const tableElement = {
				id: "table-2",
				type: ElementType.Table,
				table: {
					id: "t-inner-2",
					basePath: "rows",
					columns: [{ id: "col-ref-1", refId: "col-elem-1" }],
				},
				textProperties: undefined,
			};
			const ctx = makeGenericContext({ "col-elem-1": colElement });
			const result = clonePrintModelElement(tableElement, ctx);
			expect(result.length).toBe(2);
			const clonedTable = result[0] as Table;
			expect(clonedTable.table.columns.length).toBe(1);
			expect(clonedTable.table.columns[0].refId).toBe(result[1].id);
		});
	});

	describe("TableLayout element", () => {
		test("clones a table layout element with no cells", () => {
			const tableLayoutElement = {
				id: "tl-1",
				type: ElementType.TableLayout,
				tableLayout: { id: "tl-inner", rowCount: 2, columnCount: 3, cells: [] },
			};
			const ctx = makeGenericContext();
			const result = clonePrintModelElement(tableLayoutElement, ctx);
			expect(result.length).toBe(1);
			expect(result[0].id).not.toBe("tl-1");
			expect((result[0] as TableLayout).tableLayout.cells).toEqual([]);
		});

		test("clones table layout element with cell references", () => {
			const cellElement = {
				id: "cell-elem-1",
				type: ElementType.Text,
				text: { id: "cell-text", text: "Cell", entities: [] },
			};
			const tableLayoutElement = {
				id: "tl-2",
				type: ElementType.TableLayout,
				tableLayout: {
					id: "tl-inner-2",
					rowCount: 1,
					columnCount: 1,
					cells: [{ id: "cell-ref-1", refId: "cell-elem-1" }],
				},
			};
			const ctx = makeGenericContext({ "cell-elem-1": cellElement });
			const result = clonePrintModelElement(tableLayoutElement, ctx);
			expect(result.length).toBe(2);
			expect((result[0] as TableLayout).tableLayout.cells.length).toBe(1);
			expect((result[0] as TableLayout).tableLayout.cells[0].refId).toBe(result[1].id);
		});
	});

	describe("BoundingBox element", () => {
		test("clones a bounding box element with no child references", () => {
			const bbElement = {
				id: "bb-1",
				type: ElementType.BoundingBox,
				boundingBox: { id: "bb-inner", elementReferences: [] },
			};
			const ctx = makeGenericContext();
			const result = clonePrintModelElement(bbElement, ctx);
			expect(result.length).toBe(1);
			expect(result[0].id).not.toBe("bb-1");
			expect((result[0] as BoundingBox).boundingBox.elementReferences).toEqual([]);
		});
	});

	describe("Override element", () => {
		test("clones an override element with empty bounding box", () => {
			const overrideElement = {
				id: "ovr-1",
				type: ElementType.Override,
				override: {
					id: "ovr-inner",
					boundingBox: { id: "ovr-bb", elementReferences: [] },
				},
			};
			const ctx = makeGenericContext();
			const result = clonePrintModelElement(overrideElement, ctx);
			expect(result.length).toBe(1);
			expect(result[0].id).not.toBe("ovr-1");
			expect((result[0] as Override).override.boundingBox?.elementReferences).toEqual([]);
		});
	});

	describe("Area element", () => {
		test("clones an area element with no child references", () => {
			const areaElement = {
				id: "area-1",
				type: ElementType.Area,
				area: { id: "area-inner", elementReferences: [] },
			};
			const ctx = makeGenericContext();
			const result = clonePrintModelElement(areaElement, ctx);
			expect(result.length).toBe(1);
			expect(result[0].id).not.toBe("area-1");
			expect((result[0] as Area).area.elementReferences).toEqual([]);
		});
	});

	describe("Switch element", () => {
		test("clones a switch element with no cases", () => {
			const switchElement = {
				id: "sw-1",
				type: ElementType.Switch,
				switch: { id: "sw-inner", cases: [] },
			};
			const ctx = makeGenericContext();
			const result = clonePrintModelElement(switchElement, ctx);
			expect(result.length).toBe(1);
			expect(result[0].id).not.toBe("sw-1");
			expect((result[0] as Switch).switch.cases).toEqual([]);
		});

		test("clones switch element with case references", () => {
			const caseElement = {
				id: "case-elem-1",
				type: ElementType.Text,
				text: { id: "case-text", text: "Case", entities: [] },
			};
			const switchElement = {
				id: "sw-2",
				type: ElementType.Switch,
				switch: {
					id: "sw-inner-2",
					cases: [{ id: "case-ref-1", refId: "case-elem-1" }],
				},
			};
			const ctx = makeGenericContext({ "case-elem-1": caseElement });
			const result = clonePrintModelElement(switchElement, ctx);
			expect(result.length).toBe(2);
			expect((result[0] as Switch).switch.cases.length).toBe(1);
			expect((result[0] as Switch).switch.cases[0].refId).toBe(result[1].id);
		});
	});

	describe("Listing element", () => {
		test("clones a listing element with no columns", () => {
			const listingElement = {
				id: "lst-1",
				type: ElementType.Listing,
				listing: { id: "lst-inner", basePath: "items", columns: [] },
				textProperties: undefined,
			};
			const ctx = makeGenericContext();
			const result = clonePrintModelElement(listingElement, ctx);
			expect(result.length).toBe(1);
			expect(result[0].id).not.toBe("lst-1");
			expect((result[0] as Listing).type).toBe(ElementType.Listing);
		});

		test("clones listing element with columns and textProperties", () => {
			const listingElement = {
				id: "lst-2",
				type: ElementType.Listing,
				listing: {
					id: "lst-inner-2",
					basePath: "rows",
					columns: [{ id: "col-1", name: "Name", textProperties: { id: "ctp-1" } }],
					headerTextProperties: { id: "htp-1" },
				},
				textProperties: { id: "tp-1" },
			};
			const ctx = makeGenericContext();
			const result = clonePrintModelElement(listingElement, ctx);
			expect(result.length).toBe(1);
			const cloned = result[0] as Listing;
			expect(cloned.listing.columns?.length).toBe(1);
			expect(cloned.listing.columns?.[0].id).not.toBe("col-1");
			expect(cloned.listing.headerTextProperties?.id).not.toBe("htp-1");
			expect(cloned.textProperties?.id).not.toBe("tp-1");
		});
	});

	describe("fallback (unknown/simple element type)", () => {
		test("clones an element with unhandled type via cloneElement", () => {
			const imageElement = {
				id: "img-1",
				type: ElementType.Image,
				image: { id: "img-inner", source: "test.png" },
			};
			const ctx = makeGenericContext();
			const result = clonePrintModelElement(imageElement, ctx);
			expect(result.length).toBe(1);
			expect(result[0].id).not.toBe("img-1");
			expect(result[0].type).toBe(ElementType.Image);
		});

		test("clones fallback element with textProperties", () => {
			const fieldElement = {
				id: "field-1",
				type: ElementType.Field,
				textProperties: { id: "ftp-1", bold: { id: "b-1", value: true } },
			};
			const ctx = makeGenericContext();
			const result = clonePrintModelElement(fieldElement, ctx);
			expect(result.length).toBe(1);
			expect(result[0].id).not.toBe("field-1");
			expect((result[0] as Field).textProperties?.id).not.toBe("ftp-1");
		});
	});
});

describe("cloneSegment (extended)", () => {
	test("clones segment with element references and updates refIds", () => {
		const targetElement = {
			id: "elem-1",
			type: ElementType.Text,
			text: { id: "t-1", text: "Hello", entities: [] },
		};
		const segment = {
			id: "seg-1",
			elementReferences: [{ id: "ref-1", refId: "elem-1" }],
		};
		const ctx = makeGenericContext({ "elem-1": targetElement });
		const { clonedSegment, clonedSegmentElements } = cloneSegment(segment, ctx);
		expect(clonedSegment.elementReferences.length).toBe(1);
		expect(clonedSegment.elementReferences[0].refId).toBe(clonedSegmentElements[0].id);
		expect(clonedSegmentElements.length).toBe(1);
		expect(clonedSegmentElements[0].id).not.toBe("elem-1");
	});

	test("populates elementIdMap for cloned references", () => {
		const targetElement = {
			id: "elem-1",
			type: ElementType.Image,
			image: { id: "img-1", source: "pic.png" },
		};
		const segment = {
			id: "seg-1",
			elementReferences: [{ id: "ref-1", refId: "elem-1" }],
		};
		const ctx = makeGenericContext({ "elem-1": targetElement });
		cloneSegment(segment, ctx);
		expect(ctx.elementIdMap.has("ref-1")).toBe(true);
		expect(ctx.elementIdMap.get("ref-1")).not.toBe("ref-1");
	});

	test("skips references with no refId", () => {
		const segment = {
			id: "seg-1",
			elementReferences: [{ id: "ref-1", refId: undefined }],
		};
		const ctx = makeGenericContext();
		const { clonedSegment, clonedSegmentElements } = cloneSegment(segment, ctx);
		expect(clonedSegment.elementReferences).toEqual([]);
		expect(clonedSegmentElements).toEqual([]);
	});

	test("cloneSegments handles multiple segments in order", () => {
		const segments: PartialSegment[] = [
			{ id: "seg-a", elementReferences: [] },
			{ id: "seg-b", elementReferences: [] },
			{ id: "seg-c", elementReferences: [] },
		];
		const ctx = makeGenericContext();
		const result = cloneSegments(["seg-a", "seg-c"], segments, ctx);
		expect(result.clonedSegments.length).toBe(2);
		expect(result.newStructure.length).toBe(2);
		expect(result.clonedElements).toEqual([]);
	});

	test("cloneSegments returns cloned elements from nested references", () => {
		const targetElement = {
			id: "elem-x",
			type: ElementType.Text,
			text: { id: "t-x", text: "content", entities: [] },
		};
		const segments: PartialSegment[] = [
			{
				id: "seg-1",
				elementReferences: [
					{
						id: "ref-1",
						refId: "elem-x",
						position: undefined,
						dimensions: undefined,
					},
				],
			},
		];
		const ctx = makeGenericContext({ "elem-x": targetElement });
		const result = cloneSegments(["seg-1"], segments, ctx);
		expect(result.clonedElements.length).toBe(1);
		expect(result.clonedElements[0].id).not.toBe("elem-x");
	});
});

describe("cloneSections", () => {
	test("returns empty results when no section ids match definitions", () => {
		const result = cloneSections(["missing"], [], makeGenericContext());
		expect(result.clonedSections).toEqual([]);
		expect(result.newSections).toEqual([]);
		expect(result.clonedElements).toEqual([]);
	});

	test("clones a section with no element references", () => {
		const sections: PartialSection[] = [{ id: "sec-1", elementReferences: [] }];
		const result = cloneSections(["sec-1"], sections, makeGenericContext());
		expect(result.clonedSections.length).toBe(1);
		expect(result.clonedSections[0].id).not.toBe("sec-1");
		expect(result.newSections.length).toBe(1);
		expect(result.newSections[0]).toBe(result.clonedSections[0].id);
	});

	test("clones a section with element references and resolves refIds", () => {
		const targetElement = {
			id: "elem-1",
			type: ElementType.Text,
			text: { id: "t-1", text: "Section content", entities: [] },
		};
		const sections: PartialSection[] = [{ id: "sec-1", elementReferences: [{ id: "ref-1", refId: "elem-1" }] }];
		const ctx = makeGenericContext({ "elem-1": targetElement });
		const result = cloneSections(["sec-1"], sections, ctx);
		expect(result.clonedSections[0]?.elementReferences?.length).toBe(1);
		expect(result.clonedElements.length).toBe(1);
		expect(result.clonedSections[0]?.elementReferences?.[0]?.refId).toBe(result.clonedElements[0].id);
	});

	test("skips references whose target element is not found", () => {
		const sections: PartialSection[] = [{ id: "sec-1", elementReferences: [{ id: "ref-1", refId: "missing" }] }];
		const result = cloneSections(["sec-1"], sections, makeGenericContext());
		expect(result.clonedSections[0].elementReferences).toEqual([]);
		expect(result.clonedElements).toEqual([]);
	});

	test("populates elementIdMap for cloned references", () => {
		const targetElement = {
			id: "elem-1",
			type: ElementType.Image,
			image: { id: "img-1", source: "pic.png" },
		};
		const sections: PartialSection[] = [{ id: "sec-1", elementReferences: [{ id: "ref-1", refId: "elem-1" }] }];
		const ctx = makeGenericContext({ "elem-1": targetElement });
		cloneSections(["sec-1"], sections, ctx);
		expect(ctx.elementIdMap.has("ref-1")).toBe(true);
		expect(ctx.elementIdMap.get("ref-1")).not.toBe("ref-1");
	});

	test("clones multiple sections preserving order", () => {
		const sections: PartialSection[] = [
			{ id: "sec-a", elementReferences: [] },
			{ id: "sec-b", elementReferences: [] },
			{ id: "sec-c", elementReferences: [] },
		];
		const result = cloneSections(["sec-b", "sec-a"], sections, makeGenericContext());
		expect(result.clonedSections.length).toBe(2);
		expect(result.newSections.length).toBe(2);
	});
});

describe("cloneWatermarks", () => {
	test("returns empty results when no watermark ids match definitions", () => {
		const result = cloneWatermarks(["missing"], [], makeGenericContext());
		expect(result.clonedWatermarks).toEqual([]);
		expect(result.newWatermarks).toEqual([]);
		expect(result.clonedElements).toEqual([]);
	});

	test("clones a watermark with no element references", () => {
		const watermarks: PartialWatermark[] = [{ id: "wm-1", elementReferences: [] }];
		const result = cloneWatermarks(["wm-1"], watermarks, makeGenericContext());
		expect(result.clonedWatermarks.length).toBe(1);
		expect(result.clonedWatermarks[0].id).not.toBe("wm-1");
		expect(result.newWatermarks.length).toBe(1);
		expect(result.newWatermarks[0]).toBe(result.clonedWatermarks[0].id);
	});

	test("clones a watermark with element references and resolves refIds", () => {
		const targetElement = {
			id: "elem-1",
			type: ElementType.Text,
			text: { id: "t-1", text: "Watermark text", entities: [] },
		};
		const watermarks: PartialWatermark[] = [{ id: "wm-1", elementReferences: [{ id: "ref-1", refId: "elem-1" }] }];
		const ctx = makeGenericContext({ "elem-1": targetElement });
		const result = cloneWatermarks(["wm-1"], watermarks, ctx);
		expect(result.clonedWatermarks[0]?.elementReferences?.length).toBe(1);
		expect(result.clonedElements.length).toBe(1);
		expect(result.clonedWatermarks[0]?.elementReferences?.[0]?.refId).toBe(result.clonedElements[0].id);
	});

	test("skips references whose target element is not found", () => {
		const watermarks: PartialWatermark[] = [{ id: "wm-1", elementReferences: [{ id: "ref-1", refId: "missing" }] }];
		const result = cloneWatermarks(["wm-1"], watermarks, makeGenericContext());
		expect(result.clonedWatermarks[0].elementReferences).toEqual([]);
		expect(result.clonedElements).toEqual([]);
	});

	test("skips references with no refId", () => {
		const watermarks: PartialWatermark[] = [{ id: "wm-1", elementReferences: [{ id: "ref-1", refId: undefined }] }];
		const result = cloneWatermarks(["wm-1"], watermarks, makeGenericContext());
		expect(result.clonedWatermarks[0].elementReferences).toEqual([]);
		expect(result.clonedElements).toEqual([]);
	});

	test("populates elementIdMap for cloned references", () => {
		const targetElement = {
			id: "elem-1",
			type: ElementType.Image,
			image: { id: "img-1", source: "logo.png" },
		};
		const watermarks: PartialWatermark[] = [{ id: "wm-1", elementReferences: [{ id: "ref-1", refId: "elem-1" }] }];
		const ctx = makeGenericContext({ "elem-1": targetElement });
		cloneWatermarks(["wm-1"], watermarks, ctx);
		expect(ctx.elementIdMap.has("ref-1")).toBe(true);
		expect(ctx.elementIdMap.get("ref-1")).not.toBe("ref-1");
	});

	test("clones multiple watermarks preserving order", () => {
		const watermarks: PartialWatermark[] = [
			{ id: "wm-a", elementReferences: [] },
			{ id: "wm-b", elementReferences: [] },
		];
		const result = cloneWatermarks(["wm-b", "wm-a"], watermarks, makeGenericContext());
		expect(result.clonedWatermarks.length).toBe(2);
		expect(result.newWatermarks.length).toBe(2);
	});

	test("accumulates cloned elements from multiple watermarks", () => {
		const elem1: PartialText = { id: "e1", type: ElementType.Text, text: { id: "t1", text: "A", entities: [] } };
		const elem2: PartialImage = {
			id: "e2",
			type: ElementType.Image,
			image: { id: "i1", imageSrcType: ImageSrcType.Dynamic },
		};
		const watermarks: PartialWatermark[] = [
			{ id: "wm-1", elementReferences: [{ id: "ref-1", refId: "e1" }] },
			{ id: "wm-2", elementReferences: [{ id: "ref-2", refId: "e2" }] },
		];
		const ctx = makeGenericContext({ e1: elem1, e2: elem2 });
		const result = cloneWatermarks(["wm-1", "wm-2"], watermarks, ctx);
		expect(result.clonedElements.length).toBe(2);
	});
});

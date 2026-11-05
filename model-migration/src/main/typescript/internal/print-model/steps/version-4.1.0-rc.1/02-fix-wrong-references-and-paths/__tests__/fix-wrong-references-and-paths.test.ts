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
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { PRINT_MODEL_METADATA_MAP } from "@com.mgmtp.a12.print/print-model-api/generated";

import type * as OldModel from "../../print-model.js";

import { transformWrongReferencesAndPaths as transform } from "../index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testModel = JSON.parse(
	readFileSync(path.join(__dirname, "__testdata__", "BrokenReferencesAndPaths.json"), "utf-8")
) as OldModel.PrintModelDTO;

const AREA_PB_PATH =
	PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.area.elementReferences.pageBreakBehavior.value.path;
const SEGMENT_PB_PATH =
	PRINT_MODEL_METADATA_MAP.RootGroup.content.segments.definitions.elementReferences.pageBreakBehavior.value.path;
const BOUNDING_BOX_PB_PATH =
	PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.boundingBox.elementReferences.pageBreakBehavior.value
		.path;
const OVERRIDE_PB_PATH =
	PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.override.boundingBox.elementReferences
		.pageBreakBehavior.value.path;

describe("transform: fix broken references and pageBreakBehavior paths", () => {
	const result = transform(testModel);

	describe("Fix: INHERITED textProperties references pointing to non-existent elements", () => {
		it("repairs non-existent references to point to the owning Table element ID", () => {
			const brokenExpr = result.content.elementDefinitions?.find(e => e.id === "expr-broken");
			expect(brokenExpr).toBeDefined();

			const tp = brokenExpr?.textProperties;
			const expectedTableId = "table-broken";

			expect(tp?.bold?.reference).toBe(expectedTableId);
			expect(tp?.italic?.reference).toBe(expectedTableId);
			expect(tp?.underlined?.reference).toBe(expectedTableId);
			expect(tp?.color?.reference).toBe(expectedTableId);
			expect(tp?.backgroundColor?.reference).toBe(expectedTableId);
			expect(tp?.alignment?.reference).toBe(expectedTableId);
		});

		it("does not modify already correct Expression references", () => {
			const correctExpr = result.content.elementDefinitions?.find(e => e.id === "expr-ok");
			expect(correctExpr).toBeDefined();

			const tp = correctExpr?.textProperties;
			expect(tp?.bold?.reference).toBe("table-ok");
			expect(tp?.italic?.reference).toBe("table-ok");
		});
	});

	describe("Fix: INHERITED textStyleId reference pointing to wrong (but existing) table", () => {
		it("repairs textStyleId reference that points to a different table than the owning one", () => {
			const brokenExpr = result.content.elementDefinitions?.find(e => e.id === "expr-broken");
			expect(brokenExpr).toBeDefined();

			expect(brokenExpr?.textProperties?.textStyleId?.reference).toBe("table-broken");
		});

		it("does not modify textStyleId that already points to the correct table", () => {
			const correctExpr = result.content.elementDefinitions?.find(e => e.id === "expr-ok");
			expect(correctExpr).toBeDefined();

			expect(correctExpr?.textProperties?.textStyleId?.reference).toBe("table-ok");
		});
	});

	describe("Fix: pageBreakBehavior paths inside wrapper elements", () => {
		it("fixes segment-level path to area-level path inside Area elementReferences", () => {
			const brokenArea = result.content.elementDefinitions?.find(e => e.id === "area-broken-path");
			expect(brokenArea).toBeDefined();

			const childRef = brokenArea?.area?.elementReferences?.[0];
			expect(childRef?.pageBreakBehavior?.source).toBe("INHERITED");
			expect(childRef?.pageBreakBehavior?.path).toBe(AREA_PB_PATH);
		});

		it("does not modify already correct area pageBreakBehavior paths", () => {
			const correctArea = result.content.elementDefinitions?.find(e => e.id === "area-ok-path");
			expect(correctArea).toBeDefined();

			const childRef = correctArea?.area?.elementReferences?.[0];
			expect(childRef?.pageBreakBehavior?.source).toBe("INHERITED");
			expect(childRef?.pageBreakBehavior?.path).toBe(AREA_PB_PATH);
		});

		it("points an inherited pageBreakBehavior at the element reference placing the wrapper", () => {
			// the child of "area-broken-path" inherited from the element reference of a different area
			const brokenArea = result.content.elementDefinitions?.find(e => e.id === "area-broken-path");
			expect(brokenArea).toBeDefined();

			const childRef = brokenArea?.area?.elementReferences?.[0];
			expect(childRef?.pageBreakBehavior?.reference).toBe("AREA_TEXT_WRONG_PB");
		});

		it("does not modify a pageBreakBehavior already pointing at the right element reference", () => {
			const correctArea = result.content.elementDefinitions?.find(e => e.id === "area-ok-path");
			expect(correctArea).toBeDefined();

			const childRef = correctArea?.area?.elementReferences?.[0];
			expect(childRef?.pageBreakBehavior?.reference).toBe("P33Zj9eo-2rTTddGceGxo");
		});

		it("does not modify segment-level pageBreakBehavior (top-level DEFAULT source)", () => {
			const segmentRefs = result.content.segments?.definitions?.[0]?.elementReferences;
			expect(segmentRefs).toBeDefined();

			for (const ref of segmentRefs ?? []) {
				if (ref.pageBreakBehavior?.source === "DEFAULT") {
					expect(ref.pageBreakBehavior.path).toBe(SEGMENT_PB_PATH);
				}
			}
		});
	});

	describe("Fix: borderProperties left without an id by the 4.0.0 line element migration", () => {
		it("gives borderProperties an id", () => {
			const line = result.content.elementDefinitions?.find(e => e.id === "line-missing-border-id");
			expect(line).toBeDefined();

			expect(line?.borderProperties?.id).toEqual(expect.any(String));
			expect(line?.borderProperties?.id).not.toBe("");
		});

		it("leaves the rest of the borderProperties alone", () => {
			const line = result.content.elementDefinitions?.find(e => e.id === "line-missing-border-id");
			const bp = line?.borderProperties;

			expect(bp?.borderWidth?.value).toBe(2);
			expect(bp?.borderColor?.value).toBe("#000000");
			expect(bp?.borderStyle?.value).toBe("Solid");
		});

		it("keeps an id that is already there", () => {
			const line = result.content.elementDefinitions?.find(e => e.id === "line-with-border-id");
			expect(line).toBeDefined();

			expect(line?.borderProperties?.id).toBe("border-props-kept");
		});
	});

	describe("Models the step has nothing to do on", () => {
		it("hands back a model without element definitions as it is", () => {
			const empty = {
				header: testModel.header,
				content: { id: "PRINT_MODEL_CONTENT" },
			} as OldModel.PrintModelDTO;

			expect(transform(empty)).toBe(empty);
		});
	});

	describe("Fix: INHERITED sources on Listing columns", () => {
		const columns = () => result.content.elementDefinitions?.find(e => e.id === "listing-broken")?.listing?.columns;

		it("points a column's textProperties at the listing it belongs to", () => {
			const tp = columns()?.find(column => column.id === "col-text-properties")?.textProperties;

			expect(tp?.bold?.reference).toBe("listing-broken");
		});

		it("adds the reference the listing column form used to leave out", () => {
			const tp = columns()?.find(column => column.id === "col-text-properties")?.textProperties;

			expect(tp?.italic?.reference).toBe("listing-broken");
		});

		it("leaves a column property alone that is not inherited", () => {
			const tp = columns()?.find(column => column.id === "col-text-properties")?.textProperties;

			expect(tp?.color).toEqual({
				id: "col-tp-color",
				source: "INPUT",
				path: "/content/elementDefinitions/listing/columns/textProperties/color/value/",
				value: "#ff0000",
			});
		});

		it("points a column's borderProperties at the listing it belongs to", () => {
			const bp = columns()?.find(column => column.id === "col-border-without-id")?.borderProperties;

			expect([bp?.borderWidth?.reference, bp?.borderColor?.reference, bp?.borderStyle?.reference]).toEqual([
				"listing-broken",
				"listing-broken",
				"listing-broken",
			]);
		});

		it("gives a column's borderProperties the id it is missing", () => {
			const bp = columns()?.find(column => column.id === "col-border-without-id")?.borderProperties;

			expect(bp?.id).toEqual(expect.any(String));
			expect(bp?.id).not.toBe("");
		});
	});

	describe("Fix: pageBreakBehavior paths in the other wrapper elements", () => {
		it("fixes the path inside BoundingBox elementReferences", () => {
			const boundingBox = result.content.elementDefinitions?.find(e => e.id === "bbox-broken-path");
			const reference = boundingBox?.boundingBox?.elementReferences?.find(r => r.id === "bbox-ref-inherited");

			expect(reference?.pageBreakBehavior?.path).toBe(BOUNDING_BOX_PB_PATH);
		});

		it("fixes the path of a pageBreakBehavior that does not inherit", () => {
			// the path says where the property sits, which is wrong for a wrapper whatever the source is
			const boundingBox = result.content.elementDefinitions?.find(e => e.id === "bbox-broken-path");
			const reference = boundingBox?.boundingBox?.elementReferences?.find(r => r.id === "bbox-ref-default");

			expect(reference?.pageBreakBehavior?.source).toBe("DEFAULT");
			expect(reference?.pageBreakBehavior?.path).toBe(BOUNDING_BOX_PB_PATH);
		});

		it("fixes the path inside the BoundingBox of an Override", () => {
			const override = result.content.elementDefinitions?.find(e => e.id === "override-broken-path");
			const reference = override?.override?.boundingBox?.elementReferences?.[0];

			expect(reference?.pageBreakBehavior?.path).toBe(OVERRIDE_PB_PATH);
		});
	});

	describe("Elements several owners share", () => {
		const borderReferences = (model: OldModel.PrintModelDTO, elementId: string) => {
			const bp = model.content.elementDefinitions?.find(e => e.id === elementId)?.borderProperties;
			return [bp?.borderWidth?.reference, bp?.borderColor?.reference, bp?.borderStyle?.reference];
		};

		it("keeps a reference that already names one of the owners", () => {
			// "cell-shared-kept" is a cell of both tl-a and tl-b, and inherits from tl-a
			expect(borderReferences(result, "cell-shared-kept")).toEqual(["tl-a", "tl-a", "tl-a"]);
		});

		it("repairs a reference that names none of the owners", () => {
			// "cell-shared-broken" points nowhere, so an owner has to be picked - the first one by id
			expect(borderReferences(result, "cell-shared-broken")).toEqual(["tl-a", "tl-a", "tl-a"]);
		});

		it("repairs a cell that has a single owner", () => {
			expect(borderReferences(result, "cell-single-broken")).toEqual(["tl-a", "tl-a", "tl-a"]);
		});

		it("keeps an expression's reference to the table it inherits from", () => {
			// "expr-shared" is a column of both table-shared-a and table-shared-b and inherits from the first
			const expression = result.content.elementDefinitions?.find(e => e.id === "expr-shared");

			expect(expression?.textProperties?.bold?.reference).toBe("table-shared-a");
		});

		it("migrates the same way however the element definitions are ordered", () => {
			const reordered = structuredClone(testModel);
			reordered.content.elementDefinitions = [...(reordered.content.elementDefinitions ?? [])].reverse();

			const reorderedResult = transform(reordered);

			for (const elementId of ["cell-shared-kept", "cell-shared-broken", "cell-single-broken"]) {
				expect(borderReferences(reorderedResult, elementId)).toEqual(borderReferences(result, elementId));
			}

			const expression = reorderedResult.content.elementDefinitions?.find(e => e.id === "expr-shared");
			expect(expression?.textProperties?.bold?.reference).toBe("table-shared-a");
		});
	});
});

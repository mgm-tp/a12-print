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
import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";

import {
	FRAGMENT_MODEL_ID,
	buildArea,
	buildBoundingBox,
	buildOverride,
	buildPlaceable,
	buildPrintModel,
	buildSection,
	buildSegment,
	buildWatermark,
} from "../../../../../../test/typescript/test-utils/index.js";

import { findElementFragmentPlacements } from "../find-element-fragment-placements.js";

describe("findElementFragmentPlacements", () => {
	it("finds a placement directly in a segment's elementReferences", () => {
		const printModel = buildPrintModel({
			segments: [buildSegment("seg-1", [buildPlaceable("ref-1", "frag-el-1", FRAGMENT_MODEL_ID)])],
		});

		const matches = findElementFragmentPlacements(printModel, FRAGMENT_MODEL_ID);

		expect(matches).toHaveLength(1);
		expect(matches[0].location).toMatchObject({ kind: "segment", containerIndex: 0 });
		expect(matches[0].reference.id).toBe("ref-1");
		expect(matches[0].referenceIndex).toBe(0);
	});

	it("finds placements in section and watermark containers", () => {
		const printModel = buildPrintModel({
			sections: [buildSection("sec-1", [buildPlaceable("ref-1", "frag-el-1", FRAGMENT_MODEL_ID)])],
			watermarks: [buildWatermark("wm-1", [buildPlaceable("ref-2", "frag-el-2", FRAGMENT_MODEL_ID)])],
		});

		const matches = findElementFragmentPlacements(printModel, FRAGMENT_MODEL_ID);

		expect(matches.map(match => match.location.kind)).toEqual(["section", "watermark"]);
		expect(matches.map(match => match.reference.refId)).toEqual(["frag-el-1", "frag-el-2"]);
	});

	it.each([
		["Area", buildArea, ElementType.Area],
		["BoundingBox", buildBoundingBox, ElementType.BoundingBox],
		["Override", buildOverride, ElementType.Override],
	])("finds a placement nested inside a %s wrapper element", (_name, buildWrapper, expectedType) => {
		const printModel = buildPrintModel({
			elementDefinitions: [buildWrapper("wrap-1", [buildPlaceable("ref-1", "frag-el-1", FRAGMENT_MODEL_ID)])],
		});

		const matches = findElementFragmentPlacements(printModel, FRAGMENT_MODEL_ID);

		expect(matches).toHaveLength(1);
		expect(matches[0].location.kind).toBe("wrapper");
		expect(matches[0].location.container.type).toBe(expectedType);
		expect(matches[0].location.containerIndex).toBe(0);
		expect(matches[0].reference.refId).toBe("frag-el-1");
	});

	it("reports the array index of each placement so several placements in one container stay distinguishable", () => {
		const printModel = buildPrintModel({
			segments: [
				buildSegment("seg-1", [
					buildPlaceable("ref-local", "local-el", undefined),
					buildPlaceable("ref-1", "frag-el-1", FRAGMENT_MODEL_ID),
					buildPlaceable("ref-2", "frag-el-1", FRAGMENT_MODEL_ID),
				]),
			],
		});

		const matches = findElementFragmentPlacements(printModel, FRAGMENT_MODEL_ID);

		expect(matches.map(match => [match.reference.id, match.referenceIndex])).toEqual([
			["ref-1", 1],
			["ref-2", 2],
		]);
	});

	it("ignores placements without a model and placements pointing at another fragment model", () => {
		const printModel = buildPrintModel({
			segments: [
				buildSegment("seg-1", [
					buildPlaceable("ref-local", "local-el", undefined),
					buildPlaceable("ref-other", "frag-el-1", "another-fragment-model"),
				]),
			],
			elementDefinitions: [buildArea("wrap-1", [buildPlaceable("ref-local-2", "local-el-2", undefined)])],
		});

		expect(findElementFragmentPlacements(printModel, FRAGMENT_MODEL_ID)).toEqual([]);
	});

	it("tolerates an Override whose boundingBox is not set", () => {
		const override = buildOverride("wrap-1", []);
		delete (override as { override?: unknown }).override;
		const printModel = buildPrintModel({ elementDefinitions: [override] });

		expect(findElementFragmentPlacements(printModel, FRAGMENT_MODEL_ID)).toEqual([]);
	});

	it("tolerates a print model without segments, sections or watermarks", () => {
		expect(findElementFragmentPlacements(buildPrintModel({}), FRAGMENT_MODEL_ID)).toEqual([]);
	});

	it("scans top level containers and wrapper elements in the same pass", () => {
		const printModel = buildPrintModel({
			segments: [buildSegment("seg-1", [buildPlaceable("ref-1", "frag-el-1", FRAGMENT_MODEL_ID)])],
			elementDefinitions: [
				buildArea("wrap-1", [buildPlaceable("ref-2", "frag-el-2", FRAGMENT_MODEL_ID)]),
				buildBoundingBox("wrap-2", [buildPlaceable("ref-3", "frag-el-3", FRAGMENT_MODEL_ID)]),
			],
		});

		const matches = findElementFragmentPlacements(printModel, FRAGMENT_MODEL_ID);

		expect(matches.map(match => [match.location.kind, match.location.containerIndex])).toEqual([
			["segment", 0],
			["wrapper", 0],
			["wrapper", 1],
		]);
	});
});

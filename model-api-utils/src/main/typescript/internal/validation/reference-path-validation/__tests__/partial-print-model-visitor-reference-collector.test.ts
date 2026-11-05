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
/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from "@jest/globals";

import type { FragmentType, PartialPrintModel, PrintModel } from "@com.mgmtp.a12.print/print-model-api/model";
import type { PartialPrintModelWalker } from "@com.mgmtp.a12.print/print-model-api/walker";
import { TraversalCommand, createPartialPrintModelWalker } from "@com.mgmtp.a12.print/print-model-api/walker";

import testPartialPrintModel from "../../../../../../test/resources/print-models/Print-model-with-path-references.json" with { type: "json" };
import type { CollectedPath } from "../../../types/reference-path.js";
import {
	createTestPrintModel,
	createTestPrintModelWithLog,
} from "../../../../../../test/typescript/test-utils/setup-test-model.js";

import { PartialPrintModelVisitorReferenceCollector } from "../partial-print-model-visitor-reference-collector.js";

import testPrintModelJson from "./__testdata__/useFragment.json" with { type: "json" };
import fragmentPrintModelJson from "./__testdata__/printFragment.json" with { type: "json" };

function filterFieldReferences(collected: CollectedPath) {
	return collected.usedIn === "fieldPath";
}
function filterCalculationReferences(collected: CollectedPath) {
	return collected.usedIn === "operation" || collected.usedIn === "precondition";
}

function getCalculationResult(visitor: PartialPrintModelVisitorReferenceCollector) {
	return [...new Set(visitor.collectedPaths.filter(filterCalculationReferences).map(colected => colected.id))];
}
function getFieldResult(visitor: PartialPrintModelVisitorReferenceCollector) {
	return visitor.collectedPaths.filter(filterFieldReferences).map(colected => colected.id);
}

describe("PartialPrintModelVisitorReference", () => {
	let testPrintModel: PartialPrintModel;
	let visitor: PartialPrintModelVisitorReferenceCollector;
	let walker: PartialPrintModelWalker;

	beforeEach(async () => {
		testPrintModel = createTestPrintModelWithLog(testPartialPrintModel);

		visitor = new PartialPrintModelVisitorReferenceCollector();
		walker = createPartialPrintModelWalker(testPrintModel, visitor);

		jest.spyOn(visitor, "visitUnresolvedDinTemplate" as any)
			.mockClear()
			.mockReturnValue(TraversalCommand.STOP);
	});

	it("Start at PrintModel", async () => {
		walker.walkPrintModel(testPrintModel);

		expect(getCalculationResult(visitor)).toEqual([
			// Element computations
			"HIDE_CONDITION_COMPUTATION_1",
			"CALCULATION_COMPUTATION_1",
			"HIDE_CONDITION_COMPUTATION_2",
			"HIDE_CONDITION_COMPUTATION_3",
			"LISTING_COLUMN_PROPERTY_COMPUTATION_1",
			"LISTING_COLUMN_VALUE_COMPUTATION_1",
			"LISTING_COLUMN_FIELD_PROPERTY_COMPUTATION_1",
			"LISTING_COLUMN_FIELD_VALUE_COMPUTATION_1",
			"LISTING_COLUMN_GROUP_PROPERTY_COMPUTATION_1",
			"LISTING_COLUMN_GROUP_VALUE_COMPUTATION_1",
			"LISTING_COLUMN_VALUE_COMPUTATION_2",
			"LISTING_COLUMN_VALUE_COMPUTATION_3",
			"LISTING_ROW_PROPERTY_COMPUTATION_1",
			"CALCULATION_COMPUTATION_2",
			"SWITCH_CASE_COMPUTATION_1",
			"SWITCH_CASE_COMPUTATION_2",
			"CALCULATION_COMPUTATION_5",
			"CALCULATION_COMPUTATION_3",
			"CALCULATION_COMPUTATION_4",
			"WATERMARK_COMPUTATION_1",
			"WATERMARK_PRECONDITION_2",
		]);

		expect(getFieldResult(visitor)).toEqual([
			"FIELD_2",
			"FIELD_3",
			"EXPRESSION_1",
			"TABLE_1",
			"IMAGE_SOURCE",
			"LISTING_1",
			"FIELD_1",
			"LINE_CHART_BASE_1",
			"PIE_CHART_BASE_1",
			"FIELD_6",
			"BAR_CHART_BASE_1",
			"FIELD_4",
			"REPEATABLE_AREA_1",
			"EXPRESSION_2",
			"FIELD_5",
			"REPEATABLE_SEGMENT_1",
		]);

		expect(
			visitor.collectedPaths.map(e => ({
				id: e.id,
				path: e.documentModelPath,
				entityPath: e.printModelPath?.toString(),
			}))
		).toMatchSnapshot();
	});
	it("Start at Watermark", async () => {
		walker.walkWatermark(testPrintModel.content?.watermarks?.definitions?.at(0) as any);

		expect(getCalculationResult(visitor)).toEqual(["WATERMARK_COMPUTATION_1"]);

		expect(getFieldResult(visitor)).toEqual([]);
	});
	it("Start at Segment", async () => {
		walker.walkSegment(testPrintModel.content?.segments?.definitions?.at(0) as any, 0);

		expect(getCalculationResult(visitor)).toEqual([
			"HIDE_CONDITION_COMPUTATION_1",
			"CALCULATION_COMPUTATION_1",
			"HIDE_CONDITION_COMPUTATION_2",
			"HIDE_CONDITION_COMPUTATION_3",
			"LISTING_COLUMN_PROPERTY_COMPUTATION_1",
			"LISTING_COLUMN_VALUE_COMPUTATION_1",
			"LISTING_COLUMN_FIELD_PROPERTY_COMPUTATION_1",
			"LISTING_COLUMN_FIELD_VALUE_COMPUTATION_1",
			"LISTING_COLUMN_GROUP_PROPERTY_COMPUTATION_1",
			"LISTING_COLUMN_GROUP_VALUE_COMPUTATION_1",
			"LISTING_COLUMN_VALUE_COMPUTATION_2",
			"LISTING_COLUMN_VALUE_COMPUTATION_3",
			"LISTING_ROW_PROPERTY_COMPUTATION_1",
			"CALCULATION_COMPUTATION_2",
			"SWITCH_CASE_COMPUTATION_1",
			"SWITCH_CASE_COMPUTATION_2",
			"CALCULATION_COMPUTATION_5",
			"CALCULATION_COMPUTATION_3",
		]);

		expect(getFieldResult(visitor)).toEqual([
			"FIELD_2",
			"FIELD_3",
			"EXPRESSION_1",
			"TABLE_1",
			"IMAGE_SOURCE",
			"LISTING_1",
			"FIELD_1",
			"LINE_CHART_BASE_1",
			"PIE_CHART_BASE_1",
			"FIELD_6",
			"BAR_CHART_BASE_1",
			"FIELD_4",
			"REPEATABLE_AREA_1",
			"EXPRESSION_2",
		]);

		expect(
			visitor.collectedPaths.map(e => ({
				id: e.id,
				path: e.documentModelPath,
				entityPath: e.printModelPath?.toString(),
			}))
		).toMatchSnapshot();
	});

	it("Start at Repeatable Segment", async () => {
		walker.walkSegment(testPrintModel.content?.segments?.definitions?.at(1) as any, 1);

		expect(getCalculationResult(visitor)).toEqual(["CALCULATION_COMPUTATION_4"]);

		expect(getFieldResult(visitor)).toEqual(["FIELD_5", "REPEATABLE_SEGMENT_1"]);

		expect(
			visitor.collectedPaths.map(e => ({
				id: e.id,
				path: e.documentModelPath,
				entityPath: e.printModelPath?.toString(),
			}))
		).toMatchSnapshot();
	});
});

function getFragmentReferencesResult(visitor: PartialPrintModelVisitorReferenceCollector, type: FragmentType) {
	return visitor.missingFragmentReferences
		.filter(collected => collected.type === type)
		.map(colected => colected.refId);
}

describe("PartialPrintModelVisitorReference - fragment references", () => {
	let testPrintModel: PartialPrintModel;
	let fragmentPrintModel: PrintModel;
	let visitor: PartialPrintModelVisitorReferenceCollector;
	let walker: PartialPrintModelWalker;

	beforeEach(async () => {
		testPrintModel = createTestPrintModel(testPrintModelJson);
		fragmentPrintModel = createTestPrintModel(fragmentPrintModelJson);

		visitor = new PartialPrintModelVisitorReferenceCollector(testPrintModel);
		walker = createPartialPrintModelWalker(testPrintModel, visitor);
	});

	it("Start at PrintModel - resolve all fragment references", async () => {
		walker = createPartialPrintModelWalker(testPrintModel, visitor, [fragmentPrintModel]);

		const result = walker.walkPrintModel(testPrintModel);
		expect(result).toBe(TraversalCommand.CONTINUE);

		expect(getFragmentReferencesResult(visitor, "element")).toHaveLength(0);
		expect(getFragmentReferencesResult(visitor, "watermark")).toHaveLength(0);
		expect(getFragmentReferencesResult(visitor, "section")).toHaveLength(0);
		expect(getFragmentReferencesResult(visitor, "segment")).toHaveLength(0);
		expect(getFragmentReferencesResult(visitor, "textStyle")).toHaveLength(0);

		expect(
			visitor.missingFragmentReferences.map(e => ({
				id: e.refId,
				model: e.model,
				entityPath: e.printModelPath?.toString(),
			}))
		).toMatchSnapshot();
	});

	it("Start at PrintModel - resolve no fragment references", async () => {
		walker = createPartialPrintModelWalker(testPrintModel, visitor);

		const result = walker.walkPrintModel(testPrintModel);
		expect(result).toBe(TraversalCommand.CONTINUE);

		expect(getFragmentReferencesResult(visitor, "element")).toMatchObject([
			"FbEm_JhTNLntrGYHhigVB",
			"zHue7T3DMCvwCX_jy1JdI",
			"PRmYjK6-S1CLn9yD9N2-c",
			"XQJlAVSmmP9fkoRMRSf3B",
			"oCB8IOQoayXCSyvBxLpmB",
			"zJ21L0Z-IDdTlHLL97wwZ",
			"2O1nY86Tb0X7kkKg6LWbQ",
			"RIInmvI4Pg3QEKvI60CQu",
			"STkFV2hpwaVKMKQfFlwN2",
			"jY83gVXzj4RuBBQcItlwF",
			"V0kMMxvCAWFmA--LxSJ1r",
			"IYKBGuGh906tdF6_eXAxd",
			"mAjRGuqxfr7mTlU9OvxLe",
			"SaVJhTNFWCRalGg0_YLqe",
			"STkFV2hpwaVKMKQfFlwN2",
			"STkFV2hpwaVKMKQfFlwN2",
		]);
		expect(getFragmentReferencesResult(visitor, "watermark")).toMatchObject([
			"Y-0d5mSisS5KR6E5A307L",
			"UdO0AkXGF0xINc0MJew9Q",
		]);
		expect(getFragmentReferencesResult(visitor, "section")).toMatchObject([
			"MK9xwezDmDvpRJKPNgh_c",
			"SIxRNb1lUuJRuSnbhinUO",
		]);
		expect(getFragmentReferencesResult(visitor, "segment")).toMatchObject(["IbAJW7rFCbe1-cFdmKvoW"]);
		expect(getFragmentReferencesResult(visitor, "textStyle")).toMatchObject([
			"AbpttoBg_E-qcIMw6thXH",
			"xYdWFiFBWC2uJDb9D4tvk",
		]);

		expect(
			visitor.missingFragmentReferences.map(e => ({
				id: e.refId,
				model: e.model,
				entityPath: e.printModelPath?.toString(),
			}))
		).toMatchSnapshot();
	});
});

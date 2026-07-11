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

import type { PartialPrintModel } from "@com.mgmtp.a12.print/print-model-api/model";
import type { PartialPrintModelWalker } from "@com.mgmtp.a12.print/print-model-api/walker";
import { TraversalCommand, createPartialPrintModelWalker } from "@com.mgmtp.a12.print/print-model-api/walker";

import { PrintModelMarshaller } from "../../../../marshaller/model-marshaller.js";
import testPartialPrintModel from "../../../../../../test/resources/print-models/Print-model-with-path-references.json" with { type: "json" };
import { Log } from "../../../../a12internal/transaction-log/log.js";
import { PrintModelCreator } from "../../../../a12internal/utils/print-model-creator.js";

import { PartialPrintModelVisitorReferenceCollector } from "../partial-print-model-visitor-reference-collector.js";

const printModelMarshaller = new PrintModelMarshaller();

describe("PartialPrintModelVisitorReference", () => {
	let testPrintModel: PartialPrintModel;
	let visitor: PartialPrintModelVisitorReferenceCollector;
	let walker: PartialPrintModelWalker;

	beforeEach(async () => {
		const deserializeResult = printModelMarshaller.deserialize(testPartialPrintModel);
		const printModel = deserializeResult.result;
		if (!printModel) {
			throw new Error("Cannot read test print model");
		}
		const { transactionLogStore } = Log.createStores([], printModel);
		testPrintModel = PrintModelCreator.createStoreModel(transactionLogStore);

		visitor = new PartialPrintModelVisitorReferenceCollector();
		walker = createPartialPrintModelWalker(testPrintModel, visitor);

		jest.spyOn(visitor, "visitUnresolvedDinTemplate" as any)
			.mockClear()
			.mockReturnValue(TraversalCommand.STOP);
	});

	it("Start at PrintModel", async () => {
		walker.walkPrintModel(testPrintModel);

		expect(visitor.computations.map(collected => collected.computation.id)).toEqual([
			"TITLE_COMPUTATION_1",
			"DESCRIPTION_COMPUTATION_1",
			"AUTHOR_COMPUTATION_1",
			"LANGUAGE_COMPUTATION_1",
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

		expect(visitor.fieldReferences.map(collected => collected.field.id)).toEqual([
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

		expect(visitor.computations.map(collected => collected.computation.id)).toEqual(["WATERMARK_COMPUTATION_1"]);

		expect(visitor.fieldReferences.map(collected => collected.field.id)).toEqual([]);
	});
	it("Start at Segment", async () => {
		walker.walkSegment(testPrintModel.content?.segments?.definitions?.at(0) as any, 0);

		expect(visitor.computations.map(collected => collected.computation.id)).toEqual([
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

		expect(visitor.fieldReferences.map(collected => collected.field.id)).toEqual([
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

		expect(visitor.computations.map(collected => collected.computation.id)).toEqual(["CALCULATION_COMPUTATION_4"]);

		expect(visitor.fieldReferences.map(collected => collected.field.id)).toEqual([
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
});

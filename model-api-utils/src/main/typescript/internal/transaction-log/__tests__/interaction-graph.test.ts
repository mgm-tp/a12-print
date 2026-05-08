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
import { MeasureUnit, PartialSegment } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import {
	calculationElement,
	calculationElementId,
	calculationPropertiesId,
	segmentMock,
	segmentMockId,
} from "../../../../../test/typescript/test-utils/transaction-log/log-store.js";

import { IGLabels, InteractionGraph } from "../interaction-graph.js";
import { StoreEntryMapWithId, TransactionLog } from "../transaction-log.js";

describe("Interaction graph", () => {
	const graph = InteractionGraph.createEmpty();

	beforeEach(() => {
		graph.resetToEmpty();
	});

	it("should add printModelElement", () => {
		const storeEntry = TransactionLog.createStoreEntryPrintModelElement(
			{},
			{ ...calculationElement, calculation: undefined },
			"AAAA"
		);
		graph.addTransactions(storeEntry.persistentEntries);
		graph.addTransactions(
			TransactionLog.createStoreEntryPrintModelElement(
				{ [calculationElementId]: storeEntry.storeEntry },
				calculationElement,
				"BBBB"
			).persistentEntries
		);
		expect(graph.has(calculationElementId)).toBe(true);
		expect(graph.hasConnected(IGLabels.isRequiredBy, "AAAA", calculationElementId)).toBe(true);
		expect(graph.hasConnected(IGLabels.isRequiredBy, "AAAA", calculationPropertiesId)).toBe(true);
		expect(graph.hasConnected(IGLabels.isRequiredBy, "BBBB", calculationElementId)).toBe(false);
		expect(graph.hasConnected(IGLabels.isRequiredBy, "BBBB", calculationPropertiesId)).toBe(true);
	});

	it("should create relation between segment and element creation", () => {
		const segmentMap: StoreEntryMapWithId<PartialSegment> = { id: "qweqweqwe", map: {} };
		const storeEntry = TransactionLog.createStoreEntrySegment(segmentMap, segmentMock, "AAAA");
		segmentMap.map[segmentMockId] = storeEntry.storeEntry;
		graph.addTransactions(storeEntry.persistentEntries);
		const entrySegment = TransactionLog.createStoreEntrySegment(
			segmentMap,
			{
				...segmentMock,
				elementReferences: [
					{
						id: "wqe221t",
						dimensions: {
							id: "f31f13",
							minHeight: {
								id: "usddui89",
								unit: MeasureUnit.Millimeter,
								value: 4,
							},
							minWidth: {
								id: "usdufo89",
								unit: MeasureUnit.Millimeter,
								value: 30,
							},
						},
						position: {
							id: "1t31t",
							x: {
								id: "sdhui89",
								unit: MeasureUnit.Millimeter,
								value: 2,
							},
							y: {
								id: "sddki89",
								unit: MeasureUnit.Millimeter,
								value: 4,
							},
						},
						screenReadingOrder: { id: "21r1tr31t", screenReadingOrderWeight: 0 },
						refId: calculationElementId,
					},
				],
			},
			"BBBB"
		);
		segmentMap.map[segmentMockId] = entrySegment.storeEntry;
		const entryElement = TransactionLog.createStoreEntryPrintModelElement(
			{},
			{ ...calculationElement, calculation: undefined },
			"BBBB"
		);
		graph.addTransactions(entrySegment.persistentEntries);
		graph.addTransactions(entryElement.persistentEntries);
		graph.addTransactions(
			TransactionLog.createStoreEntryPrintModelElement(
				{ [calculationElementId]: entryElement.storeEntry },
				calculationElement,
				"CCCC"
			).persistentEntries
		);

		expect(graph.hasConnected(IGLabels.isRequiredBy, "BBBB", calculationElementId)).toBe(true);
		expect(graph.hasConnected(IGLabels.isRequiredBy, "CCCC", calculationElementId)).toBe(false);
		expect(graph.hasConnected(IGLabels.isRequiredBy, "BBBB", calculationPropertiesId)).toBe(true);
		expect(graph.hasConnected(IGLabels.isRequiredBy, "CCCC", calculationPropertiesId)).toBe(true);
	});
});

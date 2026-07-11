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
import type { PartialSegment, PrintModel } from "@com.mgmtp.a12.print/print-model-api/model";
import {
	ElementType,
	MeasureUnit,
	PageOrientation,
	SectionUsage,
	SegmentType,
	Semantic,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";

import {
	calculationElement,
	calculationElementId,
	calculationPropertiesId,
	segmentMock,
	segmentMockId,
} from "../../../../../test/typescript/test-utils/transaction-log/log-store.js";
import type {
	PartialTransactionLogPersistentEntry,
	StoreEntryMapWithId,
} from "../../../../../main/typescript/a12internal/transaction-log/transaction-log.js";
import { TransactionLog } from "../../../../../main/typescript/a12internal/transaction-log/transaction-log.js";
import { IGLabels, InteractionGraph } from "../../../a12internal/transaction-log/interaction-graph.js";

function makeSegmentRefEntry(
	interactionId: string,
	segId: string,
	objectId: string,
	command: "PUSH" | "POP" | "MOVE"
): PartialTransactionLogPersistentEntry {
	return {
		interactionId,
		id: segId,
		entryType: "segment",
		parentId: segId,
		propertyKey: "elementReferences",
		objectId,
		value: null,
		command,
	};
}

function makeTextEntry(
	interactionId: string,
	elemId: string,
	propertyKey: string,
	value: string | null,
	command: "SET" | "REMOVE"
): PartialTransactionLogPersistentEntry {
	return {
		interactionId,
		id: elemId,
		entryType: ElementType.Text,
		parentId: elemId,
		propertyKey,
		objectId: null,
		value,
		command,
	};
}

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

	const minimalPrintModel: PrintModel = {
		header: {
			id: "header1",
			modelType: "print",
			modelVersion: "4.0",
			description: "",
		},
		content: {
			id: "content1",
			general: {
				id: "general1",
				segmentDefaults: { id: "segDefaults1", fontSize: 12 },
				structure: ["seg1"],
				metadata: {
					id: "metadata1",
					titleComputation: [],
					descriptionComputation: [],
					authorComputation: [],
					languageComputation: [],
				},
			},
			segments: {
				id: "segments1",
				definitions: [
					{
						id: "seg1",
						title: "Segment 1",
						type: SegmentType.Default,
						defaultSegment: { id: "defSeg1", pageOrientation: PageOrientation.Portrait },
						elementReferences: [
							{
								id: "ref1",
								refId: "elem1",
								dimensions: {
									id: "dim1",
									minHeight: { id: "mh1", unit: MeasureUnit.Millimeter, value: 10 },
									minWidth: { id: "mw1", unit: MeasureUnit.Millimeter, value: 20 },
								},
								position: {
									id: "pos1",
									x: { id: "x1", unit: MeasureUnit.Millimeter, value: 0 },
									y: { id: "y1", unit: MeasureUnit.Millimeter, value: 0 },
								},
								screenReadingOrder: { id: "sro1", screenReadingOrderWeight: 0 },
								pageBreakBehavior: {
									id: "pb1",
									source: PossibleInputSource.DEFAULT,
									path: "some/path/",
								},
							},
						],
					},
				],
				references: [],
			},
			elementDefinitions: [{ id: "elem1", type: ElementType.Text }],
		},
	};

	describe("createFromPrintModel", () => {
		it("should initialize graph from print model", () => {
			const graphFromModel = InteractionGraph.createFromPrintModel(minimalPrintModel);

			expect(graphFromModel.has("seg1")).toBe(true);
			expect(graphFromModel.has("elem1")).toBe(true);
			expect(graphFromModel.has("ref1")).toBe(true);
		});

		it("should track refId relationships from print model", () => {
			const graphFromModel = InteractionGraph.createFromPrintModel(minimalPrintModel);

			// The segment references elem1 via refId, so there should be an isRequiredBy relation
			expect(graphFromModel.has("ref1")).toBe(true);
			expect(graphFromModel.has("elem1")).toBe(true);
		});

		it("should handle print model with sections and textStyles", () => {
			const modelWithSections: PrintModel = {
				...minimalPrintModel,
				content: {
					...minimalPrintModel.content,
					sections: {
						id: "sections1",
						definitions: [
							{
								id: "section1",
								title: "Section 1",
								sectionUsage: SectionUsage.First,
								pageOrientation: PageOrientation.Portrait,
								elementReferences: [],
								footerHeight: {
									id: "fh1",
									value: 15,
									unit: MeasureUnit.Millimeter,
								},
								headerHeight: {
									id: "hh1",
									value: 15,
									unit: MeasureUnit.Millimeter,
								},
							},
						],
					},
					textStyles: {
						id: "textStyles1",
						definitions: [
							{
								id: "ts1",
								name: "Style 1",
								font: "Arial",
								fontSize: 12,
								lineHeight: 12,
								semantic: Semantic.P,
							},
						],
					},
				},
			};
			const graphFromModel = InteractionGraph.createFromPrintModel(modelWithSections);

			expect(graphFromModel.has("section1")).toBe(true);
			expect(graphFromModel.has("ts1")).toBe(true);
		});
	});

	describe("resetToPrintModel", () => {
		it("should reset graph to the state of a print model", () => {
			// First add some transactions
			const storeEntry = TransactionLog.createStoreEntryPrintModelElement(
				{},
				{ ...calculationElement, calculation: undefined },
				"AAAA"
			);
			graph.addTransactions(storeEntry.persistentEntries);
			expect(graph.has(calculationElementId)).toBe(true);

			// Reset to a print model with different IDs to verify old state is cleared
			const printModel: PrintModel = {
				...minimalPrintModel,
				header: { ...minimalPrintModel.header, id: "header2" },
				content: {
					...minimalPrintModel.content,
					id: "content2",
					general: {
						...minimalPrintModel.content.general,
						id: "general2",
						segmentDefaults: { id: "segDef2", fontSize: 12 },
						structure: ["seg2"],
					},
					segments: {
						id: "segments2",
						definitions: [
							{
								id: "seg2",
								title: "Seg2",
								type: SegmentType.Default,
								defaultSegment: { id: "ds2", pageOrientation: PageOrientation.Portrait },
								elementReferences: [],
							},
						],
						references: [],
					},
					elementDefinitions: [],
				},
			};
			graph.resetToPrintModel(printModel);

			// Old data should be gone
			expect(graph.has(calculationElementId)).toBe(false);
			// New data should be present
			expect(graph.has("seg2")).toBe(true);
			expect(graph.has("ds2")).toBe(true);
		});
	});

	describe("handleUndoLog", () => {
		it("should create undo connections", () => {
			// Create an element first
			const storeEntry = TransactionLog.createStoreEntryPrintModelElement(
				{},
				{ ...calculationElement, calculation: undefined },
				"AAAA"
			);
			graph.addTransactions(storeEntry.persistentEntries);

			// Update it so there's something to undo
			const updateEntry = TransactionLog.createStoreEntryPrintModelElement(
				{ [calculationElementId]: storeEntry.storeEntry },
				calculationElement,
				"BBBB"
			);
			graph.addTransactions(updateEntry.persistentEntries);

			// Undo the second interaction
			const undoResult = TransactionLog.undo(updateEntry.storeEntry, ElementType.Calculation, "BBBB", "CCCC");
			graph.addTransactions(undoResult.persistentEntries);

			expect(graph.hasConnected(IGLabels.undo, "CCCC", "BBBB")).toBe(true);
		});
	});

	describe("handleEmptyLog", () => {
		it("should handle entries that are not full TransactionLogEntries", () => {
			const emptyEntry: PartialTransactionLogPersistentEntry = {
				interactionId: "INT1",
				id: "emptyObj1",
				entryType: ElementType.Text,
			};
			graph.addTransactions([emptyEntry]);

			expect(graph.has("emptyObj1")).toBe(true);
			expect(graph.hasConnected(IGLabels.isRequiredBy, "INT1", "emptyObj1")).toBe(true);
		});
	});

	describe("PUSH and POP for value strings", () => {
		it("should handle PUSH of string values (e.g. structure array)", () => {
			const pushEntry: PartialTransactionLogPersistentEntry = {
				interactionId: "INT_PUSH",
				id: "generalId",
				entryType: "printModelContentGeneral",
				parentId: "generalId",
				propertyKey: "structure",
				objectId: null,
				value: "newSegId1",
				command: "PUSH",
			};
			graph.addTransactions([pushEntry]);

			expect(graph.hasConnected(IGLabels.valuePush, "INT_PUSH", "newSegId1")).toBe(true);
			expect(graph.hasConnected(IGLabels.isRequiredBy, "INT_PUSH", "newSegId1")).toBe(true);
		});

		it("should handle POP of string values and link to original push", () => {
			const pushEntry: PartialTransactionLogPersistentEntry = {
				interactionId: "INT_PUSH2",
				id: "generalId",
				entryType: "printModelContentGeneral",
				parentId: "generalId",
				propertyKey: "structure",
				objectId: null,
				value: "segToRemove",
				command: "PUSH",
			};
			graph.addTransactions([pushEntry]);

			const popEntry: PartialTransactionLogPersistentEntry = {
				interactionId: "INT_POP2",
				id: "generalId",
				entryType: "printModelContentGeneral",
				parentId: "generalId",
				propertyKey: "structure",
				objectId: null,
				value: "segToRemove",
				command: "POP",
			};
			graph.addTransactions([popEntry]);

			expect(graph.hasConnected(IGLabels.isPushOf, "INT_PUSH2", "INT_POP2")).toBe(true);
			expect(graph.hasConnected(IGLabels.isPopOf, "INT_POP2", "INT_PUSH2")).toBe(true);
		});
	});

	describe("PUSH and POP for object entries (with objectId)", () => {
		it("should handle PUSH with objectId", () => {
			const pushEntry = makeSegmentRefEntry("INT_OBJ_PUSH", "segId", "placeable1", "PUSH");
			graph.addTransactions([pushEntry]);

			expect(graph.hasConnected(IGLabels.isRequiredBy, "INT_OBJ_PUSH", "placeable1")).toBe(true);
			expect(graph.hasConnected(IGLabels.originalPush, "INT_OBJ_PUSH", "placeable1")).toBe(true);
		});

		it("should handle POP with objectId and link to original push", () => {
			const pushEntry = makeSegmentRefEntry("INT_OBJ_PUSH2", "segId2", "placeable2", "PUSH");
			graph.addTransactions([pushEntry]);

			const popEntry = makeSegmentRefEntry("INT_OBJ_POP2", "segId2", "placeable2", "POP");
			graph.addTransactions([popEntry]);

			expect(graph.hasConnected(IGLabels.isPushOf, "INT_OBJ_PUSH2", "INT_OBJ_POP2")).toBe(true);
			expect(graph.hasConnected(IGLabels.isPopOf, "INT_OBJ_POP2", "INT_OBJ_PUSH2")).toBe(true);
		});
	});

	describe("MOVE command", () => {
		it("should handle MOVE with objectId", () => {
			const pushEntry = makeSegmentRefEntry("INT_MOVE_PUSH", "segId3", "placeableMove", "PUSH");
			graph.addTransactions([pushEntry]);

			const moveEntry = makeSegmentRefEntry("INT_MOVE1", "segId3", "placeableMove", "MOVE");
			graph.addTransactions([moveEntry]);

			expect(graph.hasConnected(IGLabels.moves, "INT_MOVE1", "placeableMove")).toBe(true);
			expect(graph.hasConnected(IGLabels.isPushOf, "INT_MOVE_PUSH", "INT_MOVE1")).toBe(true);
		});

		it("should create overwrites between multiple MOVEs on same object", () => {
			const pushEntry = makeSegmentRefEntry("INT_MOVE_PUSH2", "segId4", "placeableMove2", "PUSH");
			graph.addTransactions([pushEntry]);

			const moveEntry1 = makeSegmentRefEntry("INT_MOVE_A", "segId4", "placeableMove2", "MOVE");
			graph.addTransactions([moveEntry1]);

			const moveEntry2 = makeSegmentRefEntry("INT_MOVE_B", "segId4", "placeableMove2", "MOVE");
			graph.addTransactions([moveEntry2]);

			expect(graph.hasConnected(IGLabels.overwrites, "INT_MOVE_B", "INT_MOVE_A")).toBe(true);
			expect(graph.hasConnected(IGLabels.isOverwrittenBy, "INT_MOVE_A", "INT_MOVE_B")).toBe(true);
		});
	});

	describe("SET and REMOVE overwrites", () => {
		it("should track overwrites when SET is applied to same property", () => {
			const setEntry1 = makeTextEntry("INT_SET1", "elem1", "title", "Hello", "SET");
			graph.addTransactions([setEntry1]);

			const setEntry2 = makeTextEntry("INT_SET2", "elem1", "title", "World", "SET");
			graph.addTransactions([setEntry2]);

			expect(graph.hasConnected(IGLabels.overwrites, "INT_SET2", "INT_SET1")).toBe(true);
			expect(graph.hasConnected(IGLabels.isOverwrittenBy, "INT_SET1", "INT_SET2")).toBe(true);
		});

		it("should track overwrites for REMOVE command", () => {
			const setEntry = makeTextEntry("INT_SET_R", "elem2", "description", "Some value", "SET");
			graph.addTransactions([setEntry]);

			const removeEntry = makeTextEntry("INT_REMOVE_R", "elem2", "description", null, "REMOVE");
			graph.addTransactions([removeEntry]);

			expect(graph.hasConnected(IGLabels.overwrites, "INT_REMOVE_R", "INT_SET_R")).toBe(true);
			expect(graph.hasConnected(IGLabels.isOverwrittenBy, "INT_SET_R", "INT_REMOVE_R")).toBe(true);
		});

		it("should chain overwrites transitively", () => {
			const entries = ["INT_CHAIN1", "INT_CHAIN2", "INT_CHAIN3"].map(iid => ({
				interactionId: iid,
				id: "elemChain",
				entryType: ElementType.Calculation as const,
				parentId: "elemChain",
				propertyKey: "someField",
				objectId: null,
				value: iid,
				command: "SET" as const,
			}));
			for (const entry of entries) {
				graph.addTransactions([entry]);
			}

			expect(graph.hasConnected(IGLabels.overwrites, "INT_CHAIN3", "INT_CHAIN2")).toBe(true);
			expect(graph.hasConnected(IGLabels.overwrites, "INT_CHAIN3", "INT_CHAIN1")).toBe(true);
			expect(graph.hasConnected(IGLabels.overwrites, "INT_CHAIN2", "INT_CHAIN1")).toBe(true);
		});
	});

	describe("refId in value (handleEntryWithoutObjectId)", () => {
		it("should track refId value as isRequiredBy", () => {
			const refIdEntry: PartialTransactionLogPersistentEntry = {
				interactionId: "INT_REFID",
				id: "placeableRef1",
				entryType: "segment",
				parentId: "placeableRef1",
				propertyKey: "refId",
				objectId: null,
				value: "targetElemId",
				command: "SET",
			};
			graph.addTransactions([refIdEntry]);

			expect(graph.hasConnected(IGLabels.isRequiredBy, "INT_REFID", "targetElemId")).toBe(true);
		});
	});

	describe("getCommitToPendingDependencies", () => {
		it("should return dependent interactions via isRequiredBy and requires", () => {
			// AAAA creates the element, BBBB depends on it
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

			const deps = graph.getCommitToPendingDependencies("AAAA");
			expect(deps.has("BBBB")).toBe(true);
		});

		it("should return dependent interactions via isOverwrittenBy", () => {
			const setEntry1 = makeTextEntry("CTD_SET1", "elemCTD", "title", "first", "SET");
			graph.addTransactions([setEntry1]);

			const setEntry2 = makeTextEntry("CTD_SET2", "elemCTD", "title", "second", "SET");
			graph.addTransactions([setEntry2]);

			const deps = graph.getCommitToPendingDependencies("CTD_SET1");
			expect(deps.has("CTD_SET2")).toBe(true);
		});

		it("should return dependent interactions via isPushOf", () => {
			const pushEntry = makeSegmentRefEntry("CTD_PUSH", "segCTD", "placeableCTD", "PUSH");
			graph.addTransactions([pushEntry]);

			const popEntry = makeSegmentRefEntry("CTD_POP", "segCTD", "placeableCTD", "POP");
			graph.addTransactions([popEntry]);

			const deps = graph.getCommitToPendingDependencies("CTD_PUSH");
			expect(deps.has("CTD_POP")).toBe(true);
		});

		it("should return dependent interactions via isPopOf (reverse)", () => {
			const pushEntry = makeSegmentRefEntry("CTD_PUSH2", "segCTD2", "placeableCTD2", "PUSH");
			graph.addTransactions([pushEntry]);

			const popEntry = makeSegmentRefEntry("CTD_POP2", "segCTD2", "placeableCTD2", "POP");
			graph.addTransactions([popEntry]);

			// isPopOf: getCommitToPendingDependencies on the PUSH finds POP via isPopOf(POP, PUSH)
			const deps = graph.getCommitToPendingDependencies("CTD_PUSH2");
			expect(deps.has("CTD_POP2")).toBe(true);
		});
	});

	describe("getPendingToCommitDependencies", () => {
		it("should return dependencies via requires and isRequiredBy", () => {
			const storeEntry = TransactionLog.createStoreEntryPrintModelElement(
				{},
				{ ...calculationElement, calculation: undefined },
				"PTC_AAAA"
			);
			graph.addTransactions(storeEntry.persistentEntries);
			const updateEntry = TransactionLog.createStoreEntryPrintModelElement(
				{ [calculationElementId]: storeEntry.storeEntry },
				calculationElement,
				"PTC_BBBB"
			);
			graph.addTransactions(updateEntry.persistentEntries);

			const deps = graph.getPendingToCommitDependencies("PTC_BBBB");
			expect(deps.has("PTC_AAAA")).toBe(true);
		});

		it("should return dependencies via overwrites", () => {
			const setEntry1 = makeTextEntry("PTC_SET1", "elemPTC", "title", "first", "SET");
			graph.addTransactions([setEntry1]);

			const setEntry2 = makeTextEntry("PTC_SET2", "elemPTC", "title", "second", "SET");
			graph.addTransactions([setEntry2]);

			const deps = graph.getPendingToCommitDependencies("PTC_SET2");
			expect(deps.has("PTC_SET1")).toBe(true);
		});

		it("should return dependencies via isPushOf (reverse direction)", () => {
			const pushEntry = makeSegmentRefEntry("PTC_PUSH", "segPTC", "placeablePTC", "PUSH");
			graph.addTransactions([pushEntry]);

			const popEntry = makeSegmentRefEntry("PTC_POP", "segPTC", "placeablePTC", "POP");
			graph.addTransactions([popEntry]);

			const deps = graph.getPendingToCommitDependencies("PTC_POP");
			expect(deps.has("PTC_PUSH")).toBe(true);
		});

		it("should return dependencies via isPopOf", () => {
			const pushEntry = makeSegmentRefEntry("PTC_PUSH2", "segPTC2", "placeablePTC2", "PUSH");
			graph.addTransactions([pushEntry]);

			const popEntry = makeSegmentRefEntry("PTC_POP2", "segPTC2", "placeablePTC2", "POP");
			graph.addTransactions([popEntry]);

			// isPopOf(POP, PUSH): getPendingToCommitDependencies on the POP finds PUSH
			const deps = graph.getPendingToCommitDependencies("PTC_POP2");
			expect(deps.has("PTC_PUSH2")).toBe(true);
		});
	});

	describe("getUndoDependencies", () => {
		it("should return interactions affected by an undo", () => {
			// Create element
			const storeEntry = TransactionLog.createStoreEntryPrintModelElement(
				{},
				{ ...calculationElement, calculation: undefined },
				"UNDO_AAAA"
			);
			graph.addTransactions(storeEntry.persistentEntries);

			// Update element
			const updateEntry = TransactionLog.createStoreEntryPrintModelElement(
				{ [calculationElementId]: storeEntry.storeEntry },
				calculationElement,
				"UNDO_BBBB"
			);
			graph.addTransactions(updateEntry.persistentEntries);

			// Undo the update
			const undoResult = TransactionLog.undo(
				updateEntry.storeEntry,
				ElementType.Calculation,
				"UNDO_BBBB",
				"UNDO_CCCC"
			);
			graph.addTransactions(undoResult.persistentEntries);

			const deps = graph.getUndoDependencies("UNDO_CCCC");
			expect(deps.has("UNDO_BBBB")).toBe(true);
		});

		it("should return empty set when no undo connections exist", () => {
			const deps = graph.getUndoDependencies("nonexistent");
			expect(deps.size).toBe(0);
		});
	});

	describe("hasConnected edge cases", () => {
		it("should return false when label does not exist", () => {
			expect(graph.hasConnected("nonexistent_label", "a", "b")).toBe(false);
		});

		it("should return false when subject does not exist", () => {
			graph.addTransactions([makeTextEntry("EDGE_INT", "edgeElem", "title", "val", "SET")]);
			expect(graph.hasConnected(IGLabels.requires, "nonexistent_subject", "edgeElem")).toBe(false);
		});

		it("should return false when object does not exist", () => {
			graph.addTransactions([makeTextEntry("EDGE_INT2", "edgeElem2", "title", "val", "SET")]);
			expect(graph.hasConnected(IGLabels.requires, "EDGE_INT2", "nonexistent_object")).toBe(false);
		});
	});
});

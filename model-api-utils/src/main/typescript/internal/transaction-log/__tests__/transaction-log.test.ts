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
import cloneDeep from "lodash/cloneDeep.js";
import { nanoid } from "nanoid";

import type {
	CalculationProperties,
	PartialAnyPrintModelElement,
	PrintModel,
	PrintModelContentGeneral,
	PrintModelHeader,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	DisplayType,
	ElementType,
	PartialCalculation,
	PartialText,
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	PRINT_MODEL_CONTENT_LOG_ID,
	PRINT_MODEL_HEADER_LOG_ID,
} from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";

import {
	calcStoreEntry,
	calculationElementId,
	emptyTextElementId,
	generalStoreEntry,
	headerStoreEntry,
	transactionLogStore,
} from "../../../../../test/typescript/test-utils/transaction-log/log-store.js";
import { PrintModelCreator } from "../../../../../main/typescript/a12internal/utils/print-model-creator.js";
import type {
	InteractionLogPersistentEntry,
	CreateStoreEntryObject,
	TransactionLogPersistentEntry,
	TransactionLogStoreEntryMap,
} from "../../../../../main/typescript/a12internal/transaction-log/index.js";
import {
	createNewInteractionLogStore,
	Log,
	TransactionLog,
} from "../../../../../main/typescript/a12internal/transaction-log/index.js";

describe("Transaction Log", () => {
	const initialInteractionLogStore = createNewInteractionLogStore();

	describe("create store entries", () => {
		it("should add new properties to empty text element", () => {
			const emptyTextElement = TransactionLog.selectPrintModelElement(
				transactionLogStore.printModelElements,
				emptyTextElementId
			);
			expect(PartialText.isInstance(emptyTextElement)).toBe(true);
			if (PartialText.isInstance(emptyTextElement)) {
				const updatedElement: PartialText = {
					...emptyTextElement,
					text: {
						id: "onmoihm53h",
						text: "hello new text",
						hideIfEmpty: true,
						entities: [{ id: "ojf4ogh43", refId: "qweasd" }],
					},
				};
				const payload = TransactionLog.createStoreEntryPrintModelElement(
					transactionLogStore.printModelElements,
					updatedElement,
					"ojmtonjgt2oq34gt"
				);
				const newTextElement = payload.storeEntry.memoizedObject;
				expect(newTextElement).not.toEqual(emptyTextElement);
				expect(Object.keys(newTextElement.text || {}).length).toBe(4);
				expect(newTextElement.text?.text).toBe("hello new text");

				const logAfter = payload.storeEntry.log;
				expect(logAfter.length).toBe(7);
			}
		});

		it("should remove some properties from calculation element", () => {
			const calculationElement = TransactionLog.selectPrintModelElement(
				transactionLogStore.printModelElements,
				calculationElementId
			);
			expect(PartialCalculation.isInstance(calculationElement)).toBe(true);
			if (PartialCalculation.isInstance(calculationElement)) {
				const updatedElement: PartialCalculation = {
					...calculationElement,
					calculation: {
						id: nanoid(),
						...calculationElement.calculation,
						computationAlternatives: undefined,
					},
				};
				const payload = TransactionLog.createStoreEntryPrintModelElement(
					transactionLogStore.printModelElements,
					updatedElement,
					"ohkj429t42z"
				);
				const newCalculationElement = payload.storeEntry.memoizedObject;
				expect(newCalculationElement).not.toEqual(calculationElement);
				expect(newCalculationElement.calculation?.computationAlternatives).toBeUndefined();
			}
		});

		it("should replace some properties from calculation element but prevent duplicate log entries", () => {
			const calculationElement = TransactionLog.selectPrintModelElement(
				transactionLogStore.printModelElements,
				calculationElementId
			);
			expect(PartialCalculation.isInstance(calculationElement)).toBe(true);
			if (PartialCalculation.isInstance(calculationElement)) {
				const updatedElement: PartialCalculation = {
					...calculationElement,
					calculation: {
						id: nanoid(),
						...calculationElement.calculation,
						displayOptions: {
							id: nanoid(),
							...calculationElement.calculation?.displayOptions,
							suffix: "NEW SUFFIX",
						},
					},
				};
				const payload = TransactionLog.createStoreEntryPrintModelElement(
					transactionLogStore.printModelElements,
					updatedElement,
					"qkmgoeqgj93"
				);
				const newCalculationElement = payload.storeEntry.memoizedObject;
				expect(newCalculationElement).not.toEqual(calculationElement);
				expect(newCalculationElement.calculation?.displayOptions?.suffix).not.toBe(
					calculationElement.calculation?.displayOptions?.suffix
				);

				const logBefore = calcStoreEntry.log;
				const logAfter = payload.storeEntry.log;
				expect(logAfter.length).toBe(logBefore.length + 1);
			}
		});

		it("should add new element to array and create from scratch", () => {
			const calculationElement = TransactionLog.selectPrintModelElement(
				transactionLogStore.printModelElements,
				calculationElementId
			);
			expect(PartialCalculation.isInstance(calculationElement)).toBe(true);
			if (PartialCalculation.isInstance(calculationElement)) {
				const updatedElement: PartialCalculation = {
					...calculationElement,
					calculation: {
						id: nanoid(),
						...calculationElement.calculation,
						computationAlternatives: [
							...(calculationElement.calculation?.computationAlternatives || []),
							{ id: nanoid(), operation: "NEW", precondition: "NEW" },
						],
					},
				};
				const payload = TransactionLog.createStoreEntryPrintModelElement(
					transactionLogStore.printModelElements,
					updatedElement,
					"koqkfw921q3rf"
				);
				const newCalculationElement = payload.storeEntry.memoizedObject;
				expect(newCalculationElement).not.toEqual(calculationElement);
				expect(newCalculationElement.calculation?.computationAlternatives?.length).toBe(4);

				const newComp = newCalculationElement.calculation?.computationAlternatives?.[3];
				expect(newComp).toBeDefined();
				if (newComp) {
					expect(calculationElement.calculation?.computationAlternatives?.includes(newComp)).toBe(false);
				}

				for (const comp of calculationElement.calculation?.computationAlternatives || []) {
					expect(newCalculationElement.calculation?.computationAlternatives?.includes(comp)).toBe(true);
				}

				const logBefore = calcStoreEntry.log;
				const logAfter = payload.storeEntry.log;
				expect(logAfter.length).toBe(logBefore.length + 4);
			}
		});

		it("should add duplicate element to array and create from scratch", () => {
			const calculationElement = TransactionLog.selectPrintModelElement(
				transactionLogStore.printModelElements,
				calculationElementId
			);
			expect(PartialCalculation.isInstance(calculationElement)).toBe(true);
			if (PartialCalculation.isInstance(calculationElement)) {
				const updatedElement: PartialCalculation = {
					...calculationElement,
					calculation: {
						id: nanoid(),
						...calculationElement.calculation,
						computationAlternatives: [
							...(calculationElement.calculation?.computationAlternatives || []),
							{ ...calculationElement.calculation?.computationAlternatives?.[1], id: nanoid() },
						],
					},
				};
				const payload = TransactionLog.createStoreEntryPrintModelElement(
					transactionLogStore.printModelElements,
					updatedElement,
					"ikqnjg93q2gjh9342"
				);
				const newCalculationElement = payload.storeEntry.memoizedObject;
				expect(newCalculationElement).not.toEqual(calculationElement);
				expect(newCalculationElement.calculation?.computationAlternatives?.length).toBe(4);

				const newComp = newCalculationElement.calculation?.computationAlternatives?.[3];
				expect(newComp).toBeDefined();
				if (newComp) {
					expect(calculationElement.calculation?.computationAlternatives?.[1].operation).toBe(
						newComp.operation
					);
					expect(calculationElement.calculation?.computationAlternatives?.[1].precondition).toBe(
						newComp.precondition
					);
				}

				for (const comp of calculationElement.calculation?.computationAlternatives || []) {
					expect(newCalculationElement.calculation?.computationAlternatives?.includes(comp)).toBe(true);
				}

				const logBefore = calcStoreEntry.log;
				const logAfter = payload.storeEntry.log;
				expect(logAfter.length).toBe(logBefore.length + 4);
			}
		});

		it("should change order of array but only add a single logEntry for each move reordering", () => {
			const calculationElement = TransactionLog.selectPrintModelElement(
				transactionLogStore.printModelElements,
				calculationElementId
			);
			expect(PartialCalculation.isInstance(calculationElement)).toBe(true);
			if (PartialCalculation.isInstance(calculationElement)) {
				const updatedElement: PartialCalculation = {
					...calculationElement,
					calculation: {
						id: nanoid(),
						...calculationElement.calculation,
						computationAlternatives: calculationElement.calculation?.computationAlternatives
							?.slice()
							.reverse(),
					},
				};
				const payload = TransactionLog.createStoreEntryPrintModelElement(
					transactionLogStore.printModelElements,
					updatedElement,
					"mnqgoegjq923t"
				);

				const newCalculationElement = payload.storeEntry.memoizedObject;

				expect(newCalculationElement.calculation?.computationAlternatives).toEqual(
					expect.arrayContaining(calculationElement.calculation?.computationAlternatives || [])
				);
				expect(newCalculationElement.calculation?.computationAlternatives?.length).toBe(3);
				for (const comp of calculationElement.calculation?.computationAlternatives || []) {
					expect(newCalculationElement.calculation?.computationAlternatives?.includes(comp)).toBe(true);
				}

				const logBefore = calcStoreEntry.log;
				const logAfter = payload.storeEntry.log;
				expect(logAfter.length).toBe(logBefore.length + 2);
			}
		});

		it("should modify one element of array and only create logEntries for diff and reuse objectId", () => {
			const calculationElement = TransactionLog.selectPrintModelElement(
				transactionLogStore.printModelElements,
				calculationElementId
			);
			expect(PartialCalculation.isInstance(calculationElement)).toBe(true);
			if (PartialCalculation.isInstance(calculationElement)) {
				const updatedElement: PartialCalculation = {
					...calculationElement,
					calculation: {
						id: nanoid(),
						...calculationElement.calculation,
						computationAlternatives: calculationElement.calculation?.computationAlternatives?.map(
							(el, idx) => {
								if (idx === 0) {
									return { ...el, operation: "popopo lololo coco" };
								}
								return el;
							}
						),
					},
				};
				const payload = TransactionLog.createStoreEntryPrintModelElement(
					transactionLogStore.printModelElements,
					updatedElement,
					"qgj3q9jg93qg"
				);
				const newCalculationElement = payload.storeEntry.memoizedObject;
				expect(newCalculationElement.calculation?.computationAlternatives?.[0]).not.toBe(
					calculationElement.calculation?.computationAlternatives?.[0]
				);
				expect(newCalculationElement.calculation?.computationAlternatives?.[0].operation).toBe(
					"popopo lololo coco"
				);
				expect(newCalculationElement.calculation?.computationAlternatives?.length).toBe(3);

				const logBefore = calcStoreEntry.log;
				const logAfter = payload.storeEntry.log;
				expect(logAfter.length).toBe(logBefore.length + 1);
			}
		});

		it("should modify one element of array and reorder at the same time and create from scratch for modified entry", () => {
			const calculationElement = TransactionLog.selectPrintModelElement(
				transactionLogStore.printModelElements,
				calculationElementId
			);
			expect(PartialCalculation.isInstance(calculationElement)).toBe(true);
			if (PartialCalculation.isInstance(calculationElement)) {
				const newOp = "popopo lololo coco";
				const updatedElement: PartialCalculation = {
					...calculationElement,
					calculation: {
						id: nanoid(),
						...calculationElement.calculation,
						computationAlternatives: calculationElement.calculation?.computationAlternatives
							?.map((el, idx) => {
								if (idx === 0) {
									return { ...el, operation: newOp };
								}
								return el;
							})
							.reverse(),
					},
				};
				const payload = TransactionLog.createStoreEntryPrintModelElement(
					transactionLogStore.printModelElements,
					updatedElement,
					"qgjeoqgj39"
				);
				const newCalculationElement = payload.storeEntry.memoizedObject;
				expect(newCalculationElement.calculation?.computationAlternatives?.[2].operation).toBe(newOp);

				const logBefore = calcStoreEntry.log;
				const logAfter = payload.storeEntry.log;
				expect(logAfter.length).toBe(logBefore.length + 3);
			}
		});
	});

	it("should create a partial print model", () => {
		const printModel = PrintModelCreator.createStoreModel(transactionLogStore);

		expect(printModel.header).toEqual(transactionLogStore[PRINT_MODEL_HEADER_LOG_ID].memoizedObject);
		expect(printModel.content?.general).toEqual(
			transactionLogStore[PRINT_MODEL_CONTENT_GENERAL_LOG_ID].memoizedObject
		);
		expect(printModel.content?.segments?.definitions?.length).toBe(0);
		expect(printModel.content?.sections).toBeUndefined();
		expect(printModel.content?.textStyles).toBeUndefined();

		for (const elemDef of printModel.content?.elementDefinitions || []) {
			expect(elemDef).toEqual(transactionLogStore.printModelElements[elemDef.id || ""].memoizedObject);
		}
	});

	describe("create log store", () => {
		it("should create store with input empty persistentEntries and valid printModel", () => {
			const printModel: PrintModel = {
				header: cloneDeep(headerStoreEntry.memoizedObject) as PrintModelHeader,
				content: {
					id: PRINT_MODEL_CONTENT_LOG_ID,
					general: cloneDeep(generalStoreEntry.memoizedObject) as PrintModelContentGeneral,
					segments: { id: "omgo42g4", definitions: [], references: [] },
					elementDefinitions: [cloneDeep(calcStoreEntry.memoizedObject)],
				},
			};
			const { transactionLogStore: store, interactionLogStore } = Log.createStores([], printModel);

			expect(interactionLogStore).toEqual(initialInteractionLogStore);

			expect(store[PRINT_MODEL_HEADER_LOG_ID].log.length).toBe(0);
			expect(store[PRINT_MODEL_CONTENT_GENERAL_LOG_ID].log.length).toBe(0);
			expect(Object.keys(store.segments.map).length).toBe(0);
			expect(store.sections).toBeFalsy();
			expect(Object.keys(store.printModelElements).length).toBe(1);
			expect(store.textStyles).toBeUndefined();

			expect(store.printModelElements[calculationElementId].log.length).toBe(0);
			expect(store.printModelElements[calculationElementId].memoizedObject).toEqual(
				calcStoreEntry.memoizedObject
			);
			expect(store.printModelElements[calculationElementId].memoizedObject).toEqual(
				store.printModelElements[calculationElementId].initialObject
			);
		});

		it("should create store with input filled persistentEntries and valid printModel", () => {
			const calculationLog = calcStoreEntry.log;
			const interactionLogPersistentEntry: InteractionLogPersistentEntry = {
				interactionId: "p0o2t04kg4",
				timestamp: 1.68329268232912,
				type: "SET",
				region: "form",
				regionId: calculationElementId,
			};
			const persistentEntries: TransactionLogPersistentEntry[] = [
				...calculationLog.slice(0, 3),
				...calculationLog.slice(4),
			].map(logEntry => {
				return {
					...logEntry,
					entryType: ElementType.Calculation,
					id: calculationElementId,
				};
			});
			const partlyFilledCalculation: PartialCalculation = {
				id: calculationElementId,
				type: ElementType.Calculation,
				calculation: {
					id: "ogm42og42",
					displayOptions: { id: "fm2qiogm42", displayType: DisplayType.Date, suffix: "hello suffix" },
					name: "comp: myName",
				},
			};
			const printModel: PrintModel = {
				header: cloneDeep(headerStoreEntry.memoizedObject) as PrintModelHeader,
				content: {
					id: PRINT_MODEL_CONTENT_LOG_ID,
					general: cloneDeep(generalStoreEntry.memoizedObject) as PrintModelContentGeneral,
					segments: { id: "omgo42g4", definitions: [], references: [] },
					elementDefinitions: [partlyFilledCalculation, { id: emptyTextElementId, type: ElementType.Text }],
				},
			};
			const { transactionLogStore: store, interactionLogStore } = Log.createStores(
				[
					{
						interactionLogPersistentEntry,
						transactionLogPersistentEntries: persistentEntries,
					},
				],
				printModel
			);
			expect(interactionLogStore.sidebar).toEqual(initialInteractionLogStore.sidebar);
			expect(interactionLogStore.stage).toEqual(initialInteractionLogStore.stage);
			expect(Object.keys(interactionLogStore.form)).toContain(calculationElementId);
			expect(interactionLogStore.form[calculationElementId].length).toBe(1);

			const interactionLogEntry = interactionLogStore.form[calculationElementId][0];

			expect(interactionLogEntry.affectedItems.length).toBe(1);
			expect(interactionLogEntry.affectedItems[0].id).toBe(calculationElementId);
			expect(interactionLogEntry.affectedItems[0].type).toBe("printModelElement");

			expect(store[PRINT_MODEL_HEADER_LOG_ID].log.length).toBe(0);
			expect(store[PRINT_MODEL_CONTENT_GENERAL_LOG_ID].log.length).toBe(0);
			expect(Object.keys(store.segments.map).length).toBe(0);
			expect(store.sections).toBeFalsy();
			expect(Object.keys(store.printModelElements).length).toBe(2);
			expect(store.textStyles).toBeUndefined();

			const newCalculationElement = store.printModelElements[calculationElementId].memoizedObject;

			expect(store[PRINT_MODEL_HEADER_LOG_ID].memoizedObject).toEqual(headerStoreEntry.memoizedObject);
			expect(store[PRINT_MODEL_CONTENT_GENERAL_LOG_ID].memoizedObject).toEqual(generalStoreEntry.memoizedObject);
			expect(newCalculationElement).not.toEqual(calcStoreEntry.memoizedObject);
			expect(store.printModelElements[calculationElementId].log.length).not.toBe(calculationLog.length);
			expect(store.printModelElements[calculationElementId].initialObject).toEqual(partlyFilledCalculation);

			expect(PartialCalculation.isInstance(newCalculationElement)).toBe(true);
			if (PartialCalculation.isInstance(newCalculationElement)) {
				expect(newCalculationElement.calculation?.displayOptions?.displayType).toBe(DisplayType.Html);
				expect(newCalculationElement.calculation?.displayOptions?.suffix).toBe("hello suffix");
				expect(newCalculationElement.calculation?.name).toBe("comp: myName");
				expect(newCalculationElement.calculation?.computationAlternatives?.length).toBe(3);
			}
		});

		it("should create element store entry with empty persistentEntry", () => {
			const emptyCalcStorePersistentEntries = TransactionLog.createStoreEntryPrintModelElement(
				{},
				{
					id: calculationElementId,
					type: ElementType.Calculation,
					calculation: undefined,
				},
				"p0o2t04kg4"
			).persistentEntries;
			const interactionLogPersistentEntry: InteractionLogPersistentEntry = {
				interactionId: "p0o2t04kg4",
				timestamp: 1.68329268232912,
				type: "SET",
				region: "form",
				regionId: calculationElementId,
			};
			const printModel: PrintModel = {
				header: cloneDeep(headerStoreEntry.memoizedObject) as PrintModelHeader,
				content: {
					id: PRINT_MODEL_CONTENT_LOG_ID,
					general: cloneDeep(generalStoreEntry.memoizedObject) as PrintModelContentGeneral,
					segments: { id: "omgo42g4", definitions: [], references: [] },
					elementDefinitions: [],
				},
			};
			const { transactionLogStore: store } = Log.createStores(
				[
					{
						interactionLogPersistentEntry,
						transactionLogPersistentEntries: emptyCalcStorePersistentEntries,
					},
				],
				printModel
			);

			expect(store[PRINT_MODEL_HEADER_LOG_ID].log.length).toBe(0);
			expect(store[PRINT_MODEL_CONTENT_GENERAL_LOG_ID].log.length).toBe(0);
			expect(Object.keys(store.segments.map).length).toBe(0);
			expect(store.sections).toBeFalsy();
			expect(Object.keys(store.printModelElements).length).toBe(1);
			expect(Object.keys(store.printModelElements)).toContain(calculationElementId);

			const newCalculationElement = store.printModelElements[calculationElementId];

			expect(newCalculationElement.initialObject).toBeUndefined();
			expect(newCalculationElement.log.length).toBe(0);
		});
	});

	describe("create store entries on empty log with valid memoizedObject", () => {
		it("should add log entries for diff only on object", () => {
			const partlyFilledCalculation: PartialCalculation = {
				id: calculationElementId,
				type: ElementType.Calculation,
				calculation: { id: "kfm243ogm42", name: "coolName123" },
			};
			const printModel: PrintModel = {
				header: cloneDeep(headerStoreEntry.memoizedObject) as PrintModelHeader,
				content: {
					id: PRINT_MODEL_CONTENT_LOG_ID,
					general: cloneDeep(generalStoreEntry.memoizedObject) as PrintModelContentGeneral,
					segments: { id: "omgo42g4", definitions: [], references: [] },
					elementDefinitions: [partlyFilledCalculation],
				},
			};
			const { transactionLogStore: store } = Log.createStores([], printModel);

			expect(store.printModelElements[calculationElementId].log.length).toBe(0);

			const partlyCalculationElement = TransactionLog.selectPrintModelElement(
				store.printModelElements,
				calculationElementId
			);
			expect(PartialCalculation.isInstance(partlyCalculationElement)).toBe(true);
			if (PartialCalculation.isInstance(partlyCalculationElement)) {
				const updatedElement: PartialCalculation = {
					...partlyCalculationElement,
					calculation: {
						id: "kfm243ogm42",
						...partlyCalculationElement.calculation,
						displayOptions: {
							id: "omfo42mg42",
							...partlyCalculationElement.calculation?.displayOptions,
							displayType: DisplayType.Checkbox,
						},
					},
				};
				const payload = TransactionLog.createStoreEntryPrintModelElement(
					store.printModelElements,
					updatedElement,
					"qmgoqjfg9231tr31"
				).storeEntry;

				expect(payload.log.length).toBe(4);
				expect(payload.memoizedObject.calculation?.displayOptions?.displayType).toBe(DisplayType.Checkbox);
				expect(payload.memoizedObject.calculation?.name).toBe("coolName123");
			}
		});
	});

	describe("undo redo", () => {
		let printModelElements: TransactionLogStoreEntryMap<PartialAnyPrintModelElement> = {};
		let update1: CreateStoreEntryObject<PartialCalculation>;
		let update2: CreateStoreEntryObject<PartialCalculation>;
		const originalCalcProps = {
			id: "gmo24mho5hj35",
			name: "myFirstName",
			displayOptions: { id: "ßohj60kj6pj", displayType: DisplayType.Html, suffix: "myFirstSuffix" },
			computationAlternatives: [{ id: "oemg2qohm4h", operation: "myFirstOp", precondition: "myFirstPreCon" }],
		};
		let newCalcProps: DeepPartial<CalculationProperties>;

		beforeEach(() => {
			printModelElements = {};
			const newCalcEl = TransactionLog.createStoreEntryPrintModelElement(
				printModelElements,
				{ id: "someUniqueCalcId987", type: ElementType.Calculation },
				"interaction0"
			);
			updatePrintModelElements(newCalcEl);
			update1 = TransactionLog.createStoreEntryPrintModelElement(
				printModelElements,
				{
					...newCalcEl.storeEntry.memoizedObject,
					calculation: originalCalcProps,
				},
				"interaction1"
			);
			updatePrintModelElements(update1);
			newCalcProps = {
				id: "003023goj23g",
				...update1.storeEntry.memoizedObject.calculation,
				displayOptions: {
					id: "omgh53ohm54jh",
					...update1.storeEntry.memoizedObject.calculation?.displayOptions,
					displayType: DisplayType.Html,
					suffix: "mySecondSuffix",
				},
				computationAlternatives: [{ id: "2fph34h", operation: "mySecondOp", precondition: "mySecondPreCon" }],
			};
			update2 = TransactionLog.createStoreEntryPrintModelElement(
				printModelElements,
				{
					...update1.storeEntry.memoizedObject,
					calculation: newCalcProps,
				},
				"interaction2"
			);
			updatePrintModelElements(update2);
		});

		function updatePrintModelElements(el: CreateStoreEntryObject<PartialAnyPrintModelElement>) {
			printModelElements[el.storeEntry.id] = el.storeEntry;
		}

		it("should undo all entries with matching interactionId and get old value", () => {
			const objectAfterUpdate1 = update1.storeEntry.memoizedObject.calculation;
			const objectAfterUpdate2 = update2.storeEntry.memoizedObject.calculation;

			expect(objectAfterUpdate2?.name).toBe(objectAfterUpdate1?.name);
			expect(objectAfterUpdate2).not.toEqual(objectAfterUpdate1);
			expect(objectAfterUpdate2).toEqual(newCalcProps);

			const update3 = TransactionLog.undo(
				update2.storeEntry,
				ElementType.Calculation,
				"interaction2",
				"interaction3"
			);
			updatePrintModelElements(update3);

			const objectAfterUndo = update3.storeEntry.memoizedObject.calculation;

			expect(objectAfterUndo).toEqual(objectAfterUpdate1);
			expect(objectAfterUndo).not.toEqual(objectAfterUpdate2);
			expect(objectAfterUndo).toEqual(originalCalcProps);
		});

		it("should redo all entries with matching interactionId and get old value", () => {
			const objectAfterUpdate1 = update1.storeEntry.memoizedObject.calculation;
			const objectAfterUpdate2 = update2.storeEntry.memoizedObject.calculation;

			const update3 = TransactionLog.undo(
				update2.storeEntry,
				ElementType.Calculation,
				"interaction2",
				"interaction3"
			);
			updatePrintModelElements(update3);
			const objectAfterUndo = update3.storeEntry.memoizedObject.calculation;

			const update4 = TransactionLog.undo(
				update3.storeEntry,
				ElementType.Calculation,
				"interaction3",
				"interaction4"
			);
			updatePrintModelElements(update4);
			const objectAfterRedo = update4.storeEntry.memoizedObject.calculation;

			expect(objectAfterRedo).not.toEqual(objectAfterUpdate1);
			expect(objectAfterRedo).toEqual(objectAfterUpdate2);
			expect(objectAfterRedo).not.toEqual(objectAfterUndo);
			expect(objectAfterRedo).toEqual(newCalcProps);
		});
	});
});

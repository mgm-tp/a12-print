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
import cloneDeep from "lodash/cloneDeep.js";
import isEmpty from "lodash/isEmpty.js";

import type {
	PartialAnyPrintModelElement,
	PartialPrintModelContentGeneral,
	PartialPrintModelHeader,
	PartialSection,
	PartialSegment,
	PartialSegmentReference,
	PartialTextStyle,
	PartialWatermark,
	PrintModel,
	PrintModelEntity,
	Reference,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	Area,
	BoundingBox,
	ElementType,
	isPrintModelHeader,
	PrintModelElement,
	Switch,
	Table,
	TableLayout,
	Text,
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	PRINT_MODEL_HEADER_LOG_ID,
} from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepMutable } from "@com.mgmtp.a12.print/print-model-api/utils";

import type { AffectedItem, InteractionLogEntry } from "./interaction-log.js";

/**
 * This corresponds to the id of the group in the print model. Null if it is not a group.
 */
export type TransactionLogEntryObjectId = string | null;

export namespace TransactionLogEntryObjectId {
	export function isInstance(objectId: unknown): objectId is TransactionLogEntryObjectId {
		return typeof objectId === "string" || objectId === null;
	}
}

/**
 * The value of a field
 */
export type TransactionLogEntryValue = string | number | boolean | null;

/**
 * SET and REMOVE are the standard commands used for changes. UNDO refers to an interactionId.
 * PUSH, MOVE and POP always refer to array entries (object or string).
 */
export type TransactionLogEntryCommand = "SET" | "REMOVE" | "UNDO" | "PUSH" | "MOVE" | "POP";

export namespace TransactionLogEntryCommand {
	export function isInstance(command: unknown): command is TransactionLogEntryCommand {
		const transactionLogEntryCommands: TransactionLogEntryCommand[] = [
			"SET",
			"REMOVE",
			"UNDO",
			"PUSH",
			"MOVE",
			"POP",
		];
		return transactionLogEntryCommands.includes(command as TransactionLogEntryCommand);
	}
}
/**
 * Defines a single transaction log entry. Note that often a collection of entries are needed to make sense out of a change.
 */
export interface TransactionLogEntry {
	readonly interactionId: string;
	readonly parentId: string;
	readonly propertyKey: string;
	readonly objectId: TransactionLogEntryObjectId;
	readonly value: TransactionLogEntryValue;
	readonly command: TransactionLogEntryCommand;
}

/**
 * Instance of parts of the print model after transaction log entries have been resolved. Partial state is needed because
 * is might be in an invalid state.
 */
export type TransactionLogObject =
	| PartialPrintModelHeader
	| PartialPrintModelContentGeneral
	| PartialSegment
	| PartialSegmentReference
	| PartialSection
	| PartialTextStyle
	| PartialAnyPrintModelElement;

/**
 * Store entry that holds transaction log object and its entries. Initial object should never be changed unless from a commit.
 */
export interface TransactionLogStoreEntry<
	T extends TransactionLogObject = TransactionLogObject,
> extends PrintModelEntity {
	readonly log: ReadonlyArray<TransactionLogEntry>;
	readonly memoizedObject: T;
	readonly initialObject?: T;
}

export interface TransactionLogStoreEntryMap<T extends TransactionLogObject = TransactionLogObject> {
	[id: string]: TransactionLogStoreEntry<T>;
}

export interface StoreEntryMapWithId<T extends TransactionLogObject = TransactionLogObject> extends PrintModelEntity {
	readonly map: TransactionLogStoreEntryMap<T>;
}

export interface SegmentsStoreEntryMapWithId<
	T extends TransactionLogObject = TransactionLogObject,
> extends StoreEntryMapWithId<T> {
	readonly references: TransactionLogStoreEntryMap<PartialSegmentReference>;
}

/**
 * Redux state for transaction log
 */
export interface TransactionLogStore {
	readonly [PRINT_MODEL_HEADER_LOG_ID]: TransactionLogStoreEntry<PartialPrintModelHeader>;
	readonly [PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: TransactionLogStoreEntry<PartialPrintModelContentGeneral>;
	readonly segments: SegmentsStoreEntryMapWithId<PartialSegment>;
	readonly sections?: StoreEntryMapWithId<PartialSection>;
	readonly watermarks?: StoreEntryMapWithId<PartialWatermark>;
	readonly printModelElements: TransactionLogStoreEntryMap<PartialAnyPrintModelElement>;
	readonly textStyles?: StoreEntryMapWithId<PartialTextStyle>;
}

export type AnyObject = Record<string, any>;

/**
 * Defines the type of the transaction log object. This is needed when assigning transaction log entries to transaction log objects
 * during initialization of the store
 */
export type EntryType =
	| "segment"
	| "segmentReference"
	| "section"
	| "watermark"
	| "printModelHeader"
	| "printModelContentGeneral"
	| "textStyle"
	| ElementType;

export namespace EntryType {
	export function isInstance(entryType: unknown): entryType is EntryType {
		const entryTypes: EntryType[] = [
			"segment",
			"segmentReference",
			"section",
			"watermark",
			"printModelHeader",
			"printModelContentGeneral",
			"textStyle",
			...(Object.values(ElementType) as ElementType[]),
		];
		return entryTypes.includes(entryType as EntryType);
	}
	export function isSegment(entryType: EntryType) {
		return entryType === "segment";
	}
	export function isSegmentReference(entryType: EntryType) {
		return entryType === "segmentReference";
	}
	export function isSection(entryType: EntryType) {
		return entryType === "section";
	}
	export function isWatermark(entryType: EntryType) {
		return entryType === "watermark";
	}
	export function isPrintModelHeader(entryType: EntryType) {
		return entryType === "printModelHeader";
	}
	export function isPrintModelContentGeneral(entryType: EntryType) {
		return entryType === "printModelContentGeneral";
	}
	export function isPrintModelElement(entryType: EntryType) {
		return Object.values(ElementType).includes(entryType as ElementType);
	}
	export function isTextStyle(entryType: EntryType) {
		return entryType === "textStyle";
	}
}

/**
 * Extended with additional information so that it can be assigned to the right object during store initialization (from WAL file).
 */
export interface PartialTransactionLogPersistentEntry extends Partial<TransactionLogEntry> {
	readonly interactionId: string;
	readonly id: string;
	readonly entryType: EntryType;
}

export type TransactionLogPersistentEntry = Required<PartialTransactionLogPersistentEntry>;

export namespace TransactionLogPersistentEntry {
	export function isTransactionLogEntry(
		logPersistentEntry: PartialTransactionLogPersistentEntry
	): logPersistentEntry is TransactionLogPersistentEntry {
		// Disabling the need for strict equality because the values could be either null or undefined
		/* eslint-disable eqeqeq */
		return !(
			logPersistentEntry.parentId == null &&
			logPersistentEntry.propertyKey == null &&
			logPersistentEntry.objectId == null &&
			logPersistentEntry.value == null &&
			logPersistentEntry.command == null
		);
		/* eslint-enable eqeqeq */
	}
}

export interface CreateStoreEntryObject<T extends TransactionLogObject = TransactionLogObject> {
	storeEntry: TransactionLogStoreEntry<T>;
	persistentEntries: PartialTransactionLogPersistentEntry[];
}

export namespace TransactionLog {
	export function selectPrintModelHeader(
		headerEntry: TransactionLogStoreEntry<PartialPrintModelHeader>
	): PartialPrintModelHeader {
		return headerEntry.memoizedObject;
	}

	export function selectPrintModelContentGeneral(
		generalEntry: TransactionLogStoreEntry<PartialPrintModelContentGeneral>
	): PartialPrintModelContentGeneral {
		return generalEntry.memoizedObject;
	}

	export function selectSegment(
		segmentEntries: TransactionLogStoreEntryMap<PartialSegment>,
		id: string
	): PartialSegment {
		const segment = segmentEntries[id]?.memoizedObject;
		if (!segment) {
			throw Error(`Segment with id ${id} does not exist in TransactionLogStore`);
		}
		return segment;
	}

	export function selectSegmentsByDINTemplateRefId(
		segmentEntries: TransactionLogStoreEntryMap<PartialSegment>,
		refId: string
	): PartialSegment[] {
		return Object.keys(segmentEntries)
			.map(id => selectSegment(segmentEntries, id))
			.filter(segment => segment.dinTemplate?.refId === refId);
	}

	export function selectSegmentReference(
		segmentReferenceEntries: TransactionLogStoreEntryMap<PartialSegmentReference>,
		id: string
	): PartialSegmentReference {
		const segmentReference = segmentReferenceEntries[id]?.memoizedObject;
		if (!segmentReference) {
			throw Error(`SegmentReference with id ${id} does not exist in TransactionLogStore`);
		}
		return segmentReference;
	}

	export function selectSection(
		sectionEntries: TransactionLogStoreEntryMap<PartialSection> | undefined,
		id: string
	): PartialSection {
		const section = sectionEntries?.[id]?.memoizedObject;
		if (!section) {
			throw Error(`Section with id ${id} does not exist in TransactionLogStore`);
		}
		return section;
	}

	export function selectWatermark(
		watermarkEntries: TransactionLogStoreEntryMap<PartialWatermark> | undefined,
		id: string
	): PartialWatermark {
		const watermark = watermarkEntries?.[id]?.memoizedObject;
		if (!watermark) {
			throw Error(`Watermark with id ${id} does not exist in TransactionLogStore`);
		}
		return watermark;
	}

	export function selectTextStyle(
		textStyleEntries: TransactionLogStoreEntryMap<PartialTextStyle> | undefined,
		id: string
	): PartialTextStyle {
		const textStyle = textStyleEntries?.[id]?.memoizedObject;
		if (!textStyle) {
			throw Error(`TextStyle with id ${id} does not exist in TransactionLogStore`);
		}
		return textStyle;
	}

	export function selectPrintModelElement(
		printModelElements: TransactionLogStoreEntryMap<PartialAnyPrintModelElement>,
		id: string
	): PartialAnyPrintModelElement {
		const element = printModelElements[id]?.memoizedObject;
		if (!element) {
			throw Error(`PrintModelElement with id ${id} does not exist in TransactionLogStore`);
		}
		return element;
	}

	export function selectEntityElementIds(
		printModelElements: TransactionLogStoreEntryMap<PartialAnyPrintModelElement>,
		id: string
	): string[] {
		const element = selectPrintModelElement(printModelElements, id);

		if (Text.isInstance(element)) {
			return selectElementRefIds(element.text.entities);
		}
		if (Table.isInstance(element)) {
			return selectElementRefIds(element.table?.columns);
		}
		const elementRefIds = BoundingBox.isInstance(element)
			? selectElementRefIds(element.boundingBox?.elementReferences)
			: Area.isInstance(element)
				? selectElementRefIds(element.area?.elementReferences)
				: Switch.isInstance(element)
					? selectElementRefIds(element.switch?.cases)
					: TableLayout.isInstance(element)
						? selectElementRefIds(element.tableLayout.cells)
						: undefined;
		if (elementRefIds) {
			return elementRefIds.reduce((entityElementIds: string[], refId: string) => {
				return entityElementIds.concat(selectEntityElementIds(printModelElements, refId));
			}, elementRefIds);
		}

		return [];
	}

	/**
	 * Entity elements refers to other print model elements by a refId string.
	 */
	export function selectEntityElements(
		printModelElements: TransactionLogStoreEntryMap<PartialAnyPrintModelElement>,
		id: string
	): PartialAnyPrintModelElement[] {
		return selectEntityElementIds(printModelElements, id).map(id =>
			selectPrintModelElement(printModelElements, id)
		);
	}

	/**
	 * Creates updated store entry and persistent logs for the print model header
	 */
	export function createStoreEntryPrintModelHeader(
		headerEntry: TransactionLogStoreEntry<PartialPrintModelHeader>,
		value: PartialPrintModelHeader,
		interactionId: string
	): CreateStoreEntryObject<PartialPrintModelHeader> {
		return createStoreEntryInternal(
			value,
			PRINT_MODEL_HEADER_LOG_ID,
			headerEntry,
			"printModelHeader",
			interactionId
		);
	}

	/**
	 * Creates updated store entry and persistent logs for the print model content general
	 */
	export function createStoreEntryPrintModelContentGeneral(
		generalEntry: TransactionLogStoreEntry<PartialPrintModelContentGeneral>,
		value: PartialPrintModelContentGeneral,
		interactionId: string
	): CreateStoreEntryObject<PartialPrintModelContentGeneral> {
		return createStoreEntryInternal(
			value,
			PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
			generalEntry,
			"printModelContentGeneral",
			interactionId
		);
	}

	/**
	 * Creates updated store entry and persistent logs for a segment
	 */
	export function createStoreEntrySegment(
		segmentMap: StoreEntryMapWithId<PartialSegment>,
		value: PartialSegment,
		interactionId: string
	): CreateStoreEntryObject<PartialSegment> {
		return createStoreEntryInternal(value, value.id, segmentMap.map[value.id], "segment", interactionId);
	}

	/**
	 * Creates updated store entry and persistent logs for a segment reference
	 */
	export function createStoreEntrySegmentReference(
		segmentReferenceMap: TransactionLogStoreEntryMap<PartialSegmentReference>,
		value: PartialSegmentReference,
		interactionId: string
	): CreateStoreEntryObject<PartialSegmentReference> {
		return createStoreEntryInternal(
			value,
			value.id,
			segmentReferenceMap[value.id],
			"segmentReference",
			interactionId
		);
	}

	/**
	 * Creates updated store entry and persistent logs for a section
	 */
	export function createStoreEntrySection(
		sectionMap: StoreEntryMapWithId<PartialSection> | undefined,
		value: PartialSection,
		interactionId: string
	): CreateStoreEntryObject<PartialSection> {
		return createStoreEntryInternal(value, value.id, sectionMap?.map[value.id], "section", interactionId);
	}

	/**
	 * Creates updated store entry and persistent logs for a watermark
	 */
	export function createStoreEntryWatermark(
		watermarkMap: StoreEntryMapWithId<PartialWatermark> | undefined,
		value: PartialWatermark,
		interactionId: string
	): CreateStoreEntryObject<PartialWatermark> {
		return createStoreEntryInternal(value, value.id, watermarkMap?.map[value.id], "watermark", interactionId);
	}

	/**
	 * Creates updated store entry and persistent logs for a text style
	 */
	export function createStoreEntryTextStyle(
		textStyleMap: StoreEntryMapWithId<PartialTextStyle> | undefined,
		value: PartialTextStyle,
		interactionId: string
	): CreateStoreEntryObject<PartialTextStyle> {
		return createStoreEntryInternal(value, value.id, textStyleMap?.map[value.id], "textStyle", interactionId);
	}

	/**
	 * Creates updated store entry and persistent logs for a print model element
	 */
	export function createStoreEntryPrintModelElement<
		T extends PartialAnyPrintModelElement = PartialAnyPrintModelElement,
	>(
		printModelElementEntryMap: TransactionLogStoreEntryMap<PartialAnyPrintModelElement>,
		value: T,
		interactionId: string
	): CreateStoreEntryObject<T> {
		return createStoreEntryInternal(
			value,
			value.id,
			printModelElementEntryMap[value.id] as TransactionLogStoreEntry<T>,
			value.type,
			interactionId
		);
	}

	/**
	 * Creates undo updates. Note that redo is just an undo of an undo.
	 */
	export function undo<T extends TransactionLogObject = TransactionLogObject>(
		storeEntry: TransactionLogStoreEntry<T>,
		entryType: EntryType,
		interactionIdToUndo: string,
		interactionId: string
	): CreateStoreEntryObject<T> {
		const id = storeEntry.id;
		const undoEntry: TransactionLogEntry = {
			interactionId,
			parentId: "",
			propertyKey: "",
			objectId: null,
			value: interactionIdToUndo,
			command: "UNDO",
		};
		const log: TransactionLogEntry[] = [...storeEntry.log, undoEntry];
		const newMemoizedObject = createMemoizedObject<T>(id, entryType, log, storeEntry.initialObject);
		return {
			storeEntry: { id, log, memoizedObject: newMemoizedObject, initialObject: storeEntry.initialObject },
			persistentEntries: [
				{
					...undoEntry,
					id,
					entryType,
				},
			],
		};
	}

	/**
	 * Creates a list of transactions grouped by interaction for the commit view.
	 */
	export function getTransactionLogEntriesByInteraction(
		interaction: InteractionLogEntry,
		store: TransactionLogStore
	): TransactionLogEntry[] {
		const res: TransactionLogEntry[] = [];
		const usedItems: string[] = [];
		for (const item of interaction.affectedItems) {
			if (usedItems.includes(item.id)) {
				continue;
			}
			const log = getLogByAffectedType(item, store);
			if (!log) {
				throw Error(`Expected log of type ${item.type} but got undefined`);
			}
			res.push(...findLogEntriesByInteraction(interaction.interactionId, log).reverse());
			usedItems.push(item.id);
		}
		return res;
	}
}

function selectElementRefIds<T extends Reference>(references?: ReadonlyArray<T>): string[] {
	return (references || []).map(({ refId }) => refId);
}

/**
 * Creates a transaction log store from print model. Note that at this stage memoizedObject and initialObject are equal because
 * no pending changes are applied yet.
 */
export function createNewTransactionLogStore(printModel: PrintModel): DeepMutable<TransactionLogStore> {
	const content = printModel.content;
	return {
		[PRINT_MODEL_HEADER_LOG_ID]: {
			id: PRINT_MODEL_HEADER_LOG_ID,
			log: [],
			memoizedObject: printModel.header,
			initialObject: printModel.header,
		},
		[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: {
			id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
			log: [],
			memoizedObject: content.general,
			initialObject: content.general,
		},
		segments: {
			id: content.segments.id,
			map: content.segments.definitions.reduce<TransactionLogStoreEntryMap<PartialSegment>>((res, next) => {
				res[next.id] = {
					id: next.id,
					log: [],
					memoizedObject: next,
					initialObject: next,
				};
				return res;
			}, {}),
			references: content.segments.references.reduce<TransactionLogStoreEntryMap<PartialSegmentReference>>(
				(res, next) => {
					res[next.id] = {
						id: next.id,
						log: [],
						memoizedObject: next,
						initialObject: next,
					};
					return res;
				},
				{}
			),
		},
		sections: content.sections
			? {
					id: content.sections.id,
					map: content.sections.definitions.reduce<TransactionLogStoreEntryMap<PartialSection>>(
						(res, next) => {
							res[next.id] = {
								id: next.id,
								log: [],
								memoizedObject: next,
								initialObject: next,
							};
							return res;
						},
						{}
					),
				}
			: undefined,
		watermarks: content.watermarks
			? {
					id: content.watermarks.id,
					map: content.watermarks.definitions.reduce<TransactionLogStoreEntryMap<PartialWatermark>>(
						(res, next) => {
							res[next.id] = {
								id: next.id,
								log: [],
								memoizedObject: next,
								initialObject: next,
							};
							return res;
						},
						{}
					),
				}
			: undefined,
		textStyles: content.textStyles
			? {
					id: content.textStyles.id,
					map: content.textStyles.definitions.reduce<TransactionLogStoreEntryMap<PartialTextStyle>>(
						(res, next) => {
							res[next.id] = {
								id: next.id,
								log: [],
								memoizedObject: next,
								initialObject: next,
							};
							return res;
						},
						{}
					),
				}
			: undefined,
		printModelElements: content.elementDefinitions.reduce<TransactionLogStoreEntryMap<PartialAnyPrintModelElement>>(
			(res, next) => {
				res[next.id] = {
					id: next.id,
					log: [],
					memoizedObject: next,
					initialObject: next,
				};
				return res;
			},
			{}
		),
	};
}

function findLogEntriesByInteraction(interactionId: string, log: ReadonlyArray<TransactionLogEntry>) {
	const res: TransactionLogEntry[] = [];
	let haveFound = false;
	for (const entry of log) {
		if (entry.interactionId === interactionId) {
			res.push(entry);
			haveFound = true;
			continue;
		}
		if (haveFound === true) {
			break;
		}
	}
	return res;
}

function getLogByAffectedType(item: AffectedItem, store: TransactionLogStore) {
	switch (item.type) {
		case "printModelContentGeneral":
			return store[PRINT_MODEL_CONTENT_GENERAL_LOG_ID].log;
		case "printModelHeader":
			return store[PRINT_MODEL_HEADER_LOG_ID].log;
		case "segment":
			return store.segments.map[item.id].log;
		case "segmentReference":
			return store.segments.references[item.id].log;
		case "section":
			return store.sections?.map[item.id].log;
		case "watermark":
			return store.watermarks?.map[item.id].log;
		case "textStyle":
			return store.textStyles?.map[item.id].log;
		case "printModelElement":
			return store.printModelElements[item.id].log;
		default:
			throw Error(`Got invalid type ${item.type}`);
	}
}

/**
 * This function takes in an initial object and applies transaction log entries onto the object one by one.
 * This results in an object with pending changes applied to it.
 */
export function createMemoizedObject<T extends TransactionLogObject = TransactionLogObject>(
	id: string,
	entryType: EntryType,
	log: TransactionLogEntry[],
	committedObject: AnyObject | undefined
): T {
	const undoInteractionIds: string[] = [];
	const parentIdsMap: Record<string, TransactionLogEntry[]> = {};
	const arrayIdsMap: Record<string, Record<string, TransactionLogEntry[]>> = {};
	for (let i = log.length - 1; i >= 0; i--) {
		const logEntry = log[i];
		const { interactionId, parentId, propertyKey, value, command } = logEntry;
		if (command === "UNDO") {
			if (!undoInteractionIds.includes(interactionId)) {
				undoInteractionIds.push(value as string);
			}
			continue;
		}
		if (command === "PUSH" || command === "POP" || command === "MOVE") {
			arrayIdsMap[parentId] = {
				...arrayIdsMap[parentId],
				[propertyKey]: [...(arrayIdsMap[parentId]?.[propertyKey] || []), logEntry],
			};
			continue;
		}
		if (parentId in parentIdsMap) {
			parentIdsMap[parentId].push(logEntry);
		} else {
			parentIdsMap[parentId] = [logEntry];
		}
	}
	const memoizedObject: AnyObject = createObjectFromIdsMap(
		id,
		parentIdsMap,
		undoInteractionIds,
		committedObject,
		arrayIdsMap
	);
	if (EntryType.isPrintModelElement(entryType)) {
		memoizedObject["type"] = entryType;
	}
	if (!EntryType.isPrintModelHeader(entryType)) {
		memoizedObject["id"] = id;
	}
	return memoizedObject as T;
}

function createObjectFromIdsMap(
	parentId: string,
	parentIdsMap: Record<string, TransactionLogEntry[]>,
	undoInteractionIds: string[],
	committedObject: AnyObject | undefined,
	arrayIdsMap: Record<string, Record<string, TransactionLogEntry[]>>
) {
	const resultObject: AnyObject = committedObject ? cloneDeep(committedObject) : {};
	const logEntries = parentIdsMap[parentId] || [];

	const usedPropertyKeys: string[] = [];
	const visitedObjects: string[] = [];
	for (const logEntry of logEntries) {
		const { interactionId, propertyKey, objectId, value, command } = logEntry;
		if (undoInteractionIds.includes(interactionId) || usedPropertyKeys.includes(propertyKey)) {
			continue;
		}
		usedPropertyKeys.push(propertyKey);
		if (command === "REMOVE" || value === "") {
			resultObject[propertyKey] = undefined;
		} else if (objectId !== null) {
			visitedObjects.push(objectId);
			resultObject[propertyKey] = createObjectFromIdsMap(
				objectId,
				parentIdsMap,
				undoInteractionIds,
				resultObject[propertyKey],
				arrayIdsMap
			);
		} else {
			resultObject[propertyKey] = value;
		}
	}

	const allObjects = Object.entries(resultObject).filter(([, value]) => typeof value === "object" && value !== null);
	resolveObjectEntries(allObjects, parentIdsMap, undoInteractionIds, arrayIdsMap, visitedObjects, resultObject);

	resolveArrayEntries(resultObject, parentId, parentIdsMap, undoInteractionIds, arrayIdsMap);

	return resultObject;
}

function resolveObjectEntries(
	allObjects: [string, AnyObject][],
	parentIdsMap: Record<string, TransactionLogEntry[]>,
	undoInteractionIds: string[],
	arrayIdsMap: Record<string, Record<string, TransactionLogEntry[]>>,
	visitedObjects: string[],
	resultObject: AnyObject
) {
	for (const [key, nestedObj] of allObjects) {
		if (Array.isArray(nestedObj)) {
			for (let i = 0; i < nestedObj.length; i++) {
				nestedObj[i] = createObjectFromIdsMap(
					nestedObj[i].id,
					parentIdsMap,
					undoInteractionIds,
					nestedObj[i],
					arrayIdsMap
				);
			}
			continue;
		}
		if (visitedObjects.includes(nestedObj.id)) {
			continue;
		}
		resultObject[key] = createObjectFromIdsMap(
			nestedObj.id,
			parentIdsMap,
			undoInteractionIds,
			resultObject[key],
			arrayIdsMap
		);
	}
}

function resolveArrayEntries(
	resultObject: AnyObject,
	parentId: string,
	parentIdsMap: Record<string, TransactionLogEntry[]>,
	undoInteractionIds: string[],
	arrayIdsMap: Record<string, Record<string, TransactionLogEntry[]>>
) {
	const arrayEntriesByKey = arrayIdsMap[parentId] || {};
	for (const [propertyKey, arrayLogEntries] of Object.entries(arrayEntriesByKey)) {
		for (let i = arrayLogEntries.length - 1; i >= 0; i--) {
			processArrayLogEntry(
				resultObject,
				propertyKey,
				arrayLogEntries[i],
				parentIdsMap,
				undoInteractionIds,
				arrayIdsMap
			);
		}
	}
}

function processArrayLogEntry(
	resultObject: AnyObject,
	propertyKey: string,
	arrayLogEntry: TransactionLogEntry,
	parentIdsMap: Record<string, TransactionLogEntry[]>,
	undoInteractionIds: string[],
	arrayIdsMap: Record<string, Record<string, TransactionLogEntry[]>>
) {
	const { interactionId, objectId, value, command } = arrayLogEntry;
	if (undoInteractionIds.includes(interactionId)) {
		return;
	}
	if (command === "MOVE") {
		handleCommandMove(resultObject, propertyKey, objectId, value);
		return;
	}
	if (command === "PUSH") {
		handleCommandPush(resultObject, propertyKey, objectId, parentIdsMap, undoInteractionIds, arrayIdsMap, value);
		return;
	}
	const indexToRemove = resultObject[propertyKey].findIndex(
		objectId !== null && objectId !== undefined
			? (el: PrintModelEntity) => el.id === objectId
			: (el: string) => el === value
	);
	if (indexToRemove !== -1) {
		resultObject[propertyKey].splice(indexToRemove, 1);
	}
}

function handleCommandMove(resultObject: AnyObject, propertyKey: string, objectId: string | null, value: any) {
	if ((Array.isArray(resultObject[propertyKey]) && resultObject[propertyKey].length === 0) || objectId === null) {
		return;
	}
	const findPredicate =
		typeof resultObject[propertyKey][0] === "string"
			? (id: string) => (el: string) => el === id
			: (id: string) => (el: PrintModelEntity) => el.id === id;
	const originalIndex = resultObject[propertyKey].findIndex(findPredicate(objectId));
	if (originalIndex > -1 && typeof value === "number" && resultObject[propertyKey].length > value) {
		const originalEl = resultObject[propertyKey].splice(originalIndex, 1)[0];
		resultObject[propertyKey].splice(value, 0, originalEl);
	}
}

function handleCommandPush(
	resultObject: AnyObject,
	propertyKey: string,
	objectId: TransactionLogEntryObjectId,
	parentIdsMap: Record<string, TransactionLogEntry[]>,
	undoInteractionIds: string[],
	arrayIdsMap: Record<string, Record<string, TransactionLogEntry[]>>,
	value: TransactionLogEntryValue
) {
	if (objectId !== null) {
		resultObject[propertyKey] = [
			...(resultObject[propertyKey] || []),
			createObjectFromIdsMap(objectId, parentIdsMap, undoInteractionIds, undefined, arrayIdsMap),
		];
	} else {
		resultObject[propertyKey] = [...(resultObject[propertyKey] || []), value];
	}
}

function createStoreEntryInternal<T extends TransactionLogObject = TransactionLogObject>(
	newObject: T,
	id: string,
	storeEntry: TransactionLogStoreEntry<T> | undefined,
	entryType: EntryType,
	interactionId: string
): CreateStoreEntryObject<T> {
	const logDiff = storeEntry
		? getDifferencesAsLogEntries(storeEntry.memoizedObject, newObject, id, [...storeEntry.log], interactionId)
		: createTransactionLogFromScratch(newObject, id, interactionId);
	const log = [...(storeEntry?.log || []), ...logDiff];
	const persistentEntries =
		log.length === 0
			? [{ id, entryType, interactionId }]
			: logDiff.map(logEntry => {
					return {
						...logEntry,
						id,
						entryType,
					};
				});
	return {
		storeEntry: { id, log, memoizedObject: newObject, initialObject: storeEntry?.initialObject },
		persistentEntries,
	};
}

function createTransactionLogFromScratch(obj: AnyObject, rootId: string, interactionId: string) {
	const log: TransactionLogEntry[] = [];
	const keys = Object.keys(obj).filter(
		key => !((key === "id" && !isPrintModelHeader(obj)) || (key === "type" && PrintModelElement.isInstance(obj)))
	);
	keys.forEach(key => log.push(...convertToTransactionLogEntries(key, rootId, obj[key], interactionId)));

	return log;
}

function getDifferencesAsLogEntries(
	memoizedObject: AnyObject,
	newObject: AnyObject,
	parentId: string,
	log: TransactionLogEntry[],
	interactionId: string
) {
	const newLogEntries: TransactionLogEntry[] = [];
	if (memoizedObject === newObject) {
		return newLogEntries;
	}

	const allPropertyKeys = new Set<string>([...Object.keys(memoizedObject), ...Object.keys(newObject)]);
	allPropertyKeys.forEach(propertyKey => {
		const oldValue = memoizedObject[propertyKey];
		const newValue = newObject[propertyKey];
		if (oldValue === newValue) {
			return;
		}
		if (newValue === undefined || newValue === null || newValue === "") {
			newLogEntries.push(...getDifferencesNewValueUndefined(oldValue, parentId, interactionId, propertyKey));
			return;
		}
		if (typeof newValue === "object") {
			if (oldValue === undefined || isEmpty(oldValue)) {
				newLogEntries.push(...convertToTransactionLogEntries(propertyKey, parentId, newValue, interactionId));
				return;
			}
			if (Array.isArray(newValue)) {
				newLogEntries.push(
					...getDifferencesNewValueArray(oldValue, newValue, parentId, log, interactionId, propertyKey)
				);
				return;
			}
			const oldObjectId = findLastLogEntry(log, parentId, propertyKey)?.objectId;
			if (oldObjectId === undefined) {
				const oldValueId = oldValue.id;
				newLogEntries.push({
					interactionId,
					parentId,
					propertyKey,
					objectId: oldValueId,
					value: null,
					command: "SET",
				});
				newLogEntries.push(...getDifferencesAsLogEntries(oldValue, newValue, oldValueId, log, interactionId));
				return;
			}
			if (oldObjectId === null) {
				throw Error("Expected objectId to be a string but null instead");
			}
			newLogEntries.push(...getDifferencesAsLogEntries(oldValue, newValue, oldObjectId, log, interactionId));
			return;
		}
		newLogEntries.push({ interactionId, parentId, propertyKey, objectId: null, value: newValue, command: "SET" });
	});

	return newLogEntries;
}

function getDifferencesNewValueUndefined(
	oldValue: any,
	parentId: string,
	interactionId: string,
	propertyKey: string
): TransactionLogEntry[] {
	if (oldValue === undefined) {
		return [];
	}
	if (typeof oldValue === "object") {
		if (Array.isArray(oldValue)) {
			if (oldValue.length === 0) {
				return [];
			}
			const isStringArray = oldValue.every(el => typeof el === "string");
			return [
				...oldValue.map<TransactionLogEntry>(el => ({
					interactionId,
					parentId,
					propertyKey,
					objectId: isStringArray ? null : el.id,
					value: isStringArray ? el : null,
					command: "POP",
				})),
			];
		}
		return [{ interactionId, parentId, propertyKey, objectId: oldValue.id, value: null, command: "REMOVE" }];
	}
	return [{ interactionId, parentId, propertyKey, objectId: null, value: oldValue, command: "REMOVE" }];
}

function getDifferencesNewValueArray(
	oldValue: any,
	newValue: any[],
	parentId: string,
	log: TransactionLogEntry[],
	interactionId: string,
	propertyKey: string
): TransactionLogEntry[] {
	if (!Array.isArray(oldValue)) {
		throw Error("Type mismatch: new value is of type array but old value is not of type array");
	}
	if (oldValue.length === 0) {
		return [...convertToTransactionLogEntries(propertyKey, parentId, newValue, interactionId)];
	}
	const newLogEntries: TransactionLogEntry[] = [];
	const isStringArray = oldValue.every(el => typeof el === "string");
	const findPredicate = isStringArray
		? (newEl: string) => (el: string) => el === newEl
		: (newEl: PrintModelEntity) => (el: PrintModelEntity) => el.id === newEl.id;
	let didPop = false;
	oldValue.forEach(oldEl => {
		if (!newValue.find(findPredicate(oldEl))) {
			didPop = true;
			newLogEntries.push({
				interactionId,
				parentId,
				propertyKey,
				objectId: isStringArray ? null : oldEl.id,
				value: isStringArray ? oldEl : null,
				command: "POP",
			});
		}
	});
	newValue.forEach((newEl, newValueIndex) => {
		const oldElIndex = oldValue.findIndex(findPredicate(newEl));
		if (oldElIndex > -1) {
			if (oldElIndex !== newValueIndex && !didPop) {
				newLogEntries.push({
					interactionId,
					parentId,
					propertyKey,
					objectId: isStringArray ? newEl : newEl.id,
					value: newValueIndex,
					command: "MOVE",
				});
			}
			const oldEl = oldValue[oldElIndex];
			if (oldEl !== newEl) {
				newLogEntries.push(...getDifferencesAsLogEntries(oldEl, newEl, newEl.id, log, interactionId));
			}
			return;
		}
		newLogEntries.push({
			interactionId,
			parentId,
			propertyKey,
			objectId: isStringArray ? null : newEl.id,
			value: isStringArray ? newEl : null,
			command: "PUSH",
		});
		if (!isStringArray) {
			for (const key of Object.keys(newEl)) {
				newLogEntries.push(...convertToTransactionLogEntries(key, newEl.id, newEl[key], interactionId));
			}
		}
	});

	return newLogEntries;
}

function findLastLogEntry(arr: TransactionLogEntry[], parentId: string, propertyKey: string) {
	const undoInteractionIds: string[] = [];
	for (let index = arr.length - 1; index >= 0; index--) {
		const curEl = arr[index];
		if (curEl.command === "UNDO" && !undoInteractionIds.includes(curEl.interactionId)) {
			undoInteractionIds.push(curEl.value as string);
			continue;
		}
		if (
			curEl.parentId === parentId &&
			curEl.propertyKey === propertyKey &&
			!undoInteractionIds.includes(curEl.interactionId)
		) {
			return curEl;
		}
	}
	return undefined;
}

function convertToTransactionLogEntries(propertyKey: string, parentId: string, value: any, interactionId: string) {
	const newLogEntries: Array<TransactionLogEntry> = [];
	if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
		return newLogEntries;
	}

	if (Array.isArray(value)) {
		if (value.every(el => typeof el === "string")) {
			newLogEntries.push(
				...value.map<TransactionLogEntry>(el => ({
					interactionId,
					parentId,
					propertyKey,
					objectId: null,
					value: el,
					command: "PUSH",
				}))
			);
			return newLogEntries;
		}
		value.forEach(el => {
			if (typeof el !== "object" || el === null) {
				throw Error("Tried to set value inside array which is not of type object or null");
			}
			const newObjectId = el.id;
			newLogEntries.push({
				interactionId,
				parentId,
				propertyKey,
				objectId: newObjectId,
				value: null,
				command: "PUSH",
			});
			for (const key of Object.keys(el)) {
				newLogEntries.push(...convertToTransactionLogEntries(key, newObjectId, el[key], interactionId));
			}
		});
	} else if (typeof value === "object") {
		const newObjectId = value.id;
		newLogEntries.push({
			interactionId,
			parentId,
			propertyKey,
			objectId: newObjectId,
			value: null,
			command: "SET",
		});
		for (const key of Object.keys(value)) {
			newLogEntries.push(...convertToTransactionLogEntries(key, newObjectId, value[key], interactionId));
		}
	} else {
		newLogEntries.push({ interactionId, parentId, propertyKey, objectId: null, value, command: "SET" });
	}
	return newLogEntries;
}

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
import type { SagaGenerator } from "typed-redux-saga";
import { call, put, select } from "typed-redux-saga";
import { nanoid } from "nanoid";

import type {
	EntryType,
	PartialTransactionLogPersistentEntry,
	TransactionLogStore,
	TransactionLogStoreEntry,
	AffectedItemType,
	WatermarkReferencesContainer,
	SectionReferencesContainer,
	TextStyleReferencesContainer,
	SegmentFragmentReferencesContainer,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { TransactionLog, SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type {
	PartialAnyPrintModelElement,
	PartialPlaceableReference,
	PartialPrintModelContentGeneral,
	PartialPrintModelHeader,
	PartialSection,
	PartialSegment,
	PartialSegmentReference,
	PartialTextStyle,
	PartialWatermark,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	PRINT_MODEL_HEADER_LOG_ID,
	PartialArea,
	PartialBoundingBox,
	PartialOverride,
} from "@com.mgmtp.a12.print/print-model-api/model";

import {
	type AnyTransactionLogAction,
	isBaseElementFormState,
	NavigationActions,
	NavigationSelectors,
	type PrintModelRefs,
	TransactionLogStateActions,
	type ValidAnyTransactionLogAction,
} from "../../../redux/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { RequestApiSelectors } from "../../../redux/request-api/selectors.js";

const REDO_UNDO_ACTIONS = [TransactionLogStateActions.undo, TransactionLogStateActions.redo];

export const RedoUndoTransactionLogHandler = {
	match: function (action: AnyTransactionLogAction) {
		return REDO_UNDO_ACTIONS.some(elementAction => elementAction.match(action));
	},
	handle: handleRedoUndoActions,
};

function* handleRedoUndoActions({
	state,
	action,
	persistentEntries,
}: {
	state: TransactionLogStore;
	action: ValidAnyTransactionLogAction;
	persistentEntries: PartialTransactionLogPersistentEntry[];
}): SagaGenerator<void> {
	const { interactionId } = action.payload;

	if (TransactionLogStateActions.undo.match(action)) {
		const printModelRefs = yield* select(NavigationSelectors.activeEntities);

		const interactionToUndo = action.payload.data.interactionToUndo;
		let copyTransactionLogState: TransactionLogStore = state;
		const usedItems: string[] = [];
		for (const item of interactionToUndo.affectedItems) {
			if (usedItems.includes(item.id)) {
				continue;
			}
			const { storeEntry, entryType } = getStoreEntryAndType(item.id, item.type, copyTransactionLogState);
			const undoResult = TransactionLog.undo(
				storeEntry,
				entryType,
				interactionToUndo.interactionId,
				interactionId
			);
			persistentEntries.push(...undoResult.persistentEntries);
			copyTransactionLogState = applyUpdateToTransactionLogState(
				copyTransactionLogState,
				undoResult.storeEntry,
				undoResult.persistentEntries[0].entryType
			);
			usedItems.push(item.id);
		}
		yield* call(resolveUiAfterUndoRedo, copyTransactionLogState, printModelRefs);
		yield* put(TransactionLogStateActions.setLogStore(copyTransactionLogState));
		return;
	}

	if (TransactionLogStateActions.redo.match(action)) {
		const printModelRefs = yield* select(NavigationSelectors.activeEntities);

		const { interactionToRedo, interactionToRestore } = action.payload.data;
		let copyTransactionLogState: TransactionLogStore = state;
		const usedItems: string[] = [];
		for (const item of interactionToRestore.affectedItems) {
			if (usedItems.includes(item.id)) {
				continue;
			}
			const { storeEntry, entryType } = getStoreEntryAndType(item.id, item.type, copyTransactionLogState);
			const redoResult = TransactionLog.undo(
				storeEntry,
				entryType,
				interactionToRedo.interactionId,
				interactionId
			);
			persistentEntries.push(...redoResult.persistentEntries);
			copyTransactionLogState = applyUpdateToTransactionLogState(
				copyTransactionLogState,
				redoResult.storeEntry,
				redoResult.persistentEntries[0].entryType
			);
			usedItems.push(item.id);
		}
		yield* call(resolveUiAfterUndoRedo, copyTransactionLogState, printModelRefs);
		yield* put(TransactionLogStateActions.setLogStore(copyTransactionLogState));
	}
}

function getStoreEntryAndType(
	id: string,
	affectedType: AffectedItemType,
	transactionStore: TransactionLogStore
): { storeEntry: TransactionLogStoreEntry; entryType: EntryType } {
	switch (affectedType) {
		case "printModelHeader":
			return { storeEntry: transactionStore[PRINT_MODEL_HEADER_LOG_ID], entryType: "printModelHeader" };
		case "printModelContentGeneral":
			return {
				storeEntry: transactionStore[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
				entryType: "printModelContentGeneral",
			};
		case "segment":
			if (!transactionStore.segments) {
				throw new Error(`No segments exist. Cannot undo segment with id ${id}`);
			}
			return { storeEntry: transactionStore.segments.map[id], entryType: "segment" };
		case "segmentReference":
			if (!transactionStore.segments?.references) {
				throw new Error(`No segment references exist. Cannot undo segment reference with id ${id}`);
			}
			return { storeEntry: transactionStore.segments.references[id], entryType: "segmentReference" };
		case "segmentFragmentReferences":
			if (!transactionStore.segments?.fragmentReferencesEntry) {
				throw new Error(`No segment fragment references exist. Cannot undo segment fragment references`);
			}
			return {
				storeEntry: transactionStore.segments.fragmentReferencesEntry,
				entryType: "segmentFragmentReferences",
			};
		case "section":
			if (!transactionStore.sections) {
				throw new Error(`No sections exist. Cannot undo section with id ${id}`);
			}
			return { storeEntry: transactionStore.sections.map[id], entryType: "section" };
		case "sectionReferences":
			if (!transactionStore.sections?.referencesEntry) {
				throw new Error(`No section references exist. Cannot undo section references`);
			}
			return { storeEntry: transactionStore.sections.referencesEntry, entryType: "sectionReferences" };
		case "watermark":
			if (!transactionStore.watermarks) {
				throw new Error(`No watermarks exist. Cannot undo watermark with id ${id}`);
			}
			return { storeEntry: transactionStore.watermarks.map[id], entryType: "watermark" };
		case "watermarkReferences":
			if (!transactionStore.watermarks?.referencesEntry) {
				throw new Error(`No watermark references exist. Cannot undo watermark references`);
			}
			return { storeEntry: transactionStore.watermarks.referencesEntry, entryType: "watermarkReferences" };
		case "textStyle":
			if (!transactionStore.textStyles) {
				throw new Error(`No textstyles exist. Cannot undo textstyle with id ${id}`);
			}
			return { storeEntry: transactionStore.textStyles.map[id], entryType: "textStyle" };
		case "textStyleReferences":
			if (!transactionStore.textStyles?.referencesEntry) {
				throw new Error(`No textstyle references exist. Cannot undo textstyle references`);
			}
			return { storeEntry: transactionStore.textStyles.referencesEntry, entryType: "textStyleReferences" };
		case "printModelElement": {
			const storeEntry = transactionStore.printModelElements[id];
			return { storeEntry, entryType: storeEntry.memoizedObject.type };
		}
		default:
			throw new Error("Got an interaction of type UNDO instead of an element type");
	}
}

function applyUpdateToTransactionLogState(
	transactionLogState: TransactionLogStore,
	storeEntry: TransactionLogStoreEntry,
	entryType: EntryType
): TransactionLogStore {
	if (entryType === "printModelHeader") {
		return {
			...transactionLogState,
			[PRINT_MODEL_HEADER_LOG_ID]: storeEntry as TransactionLogStoreEntry<PartialPrintModelHeader>,
		};
	}
	if (entryType === "printModelContentGeneral") {
		return {
			...transactionLogState,
			[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]:
				storeEntry as TransactionLogStoreEntry<PartialPrintModelContentGeneral>,
		};
	}
	if (entryType === "segment") {
		return {
			...transactionLogState,
			segments: {
				...transactionLogState.segments,
				id: transactionLogState.segments?.id || nanoid(),
				references: transactionLogState.segments?.references ?? {},
				map: {
					...transactionLogState.segments?.map,
					[storeEntry.id]: storeEntry as TransactionLogStoreEntry<PartialSegment>,
				},
			},
		};
	}
	if (entryType === "segmentReference") {
		return {
			...transactionLogState,
			segments: {
				...transactionLogState.segments,
				id: transactionLogState.segments?.id || nanoid(),
				map: transactionLogState.segments?.map ?? {},
				references: {
					...transactionLogState.segments?.references,
					[storeEntry.id]: storeEntry as TransactionLogStoreEntry<PartialSegmentReference>,
				},
			},
		};
	}
	if (entryType === "segmentFragmentReferences") {
		return {
			...transactionLogState,
			segments: {
				...transactionLogState.segments,
				id: transactionLogState.segments?.id || nanoid(),
				map: transactionLogState.segments?.map ?? {},
				references: transactionLogState.segments?.references ?? {},
				fragmentReferencesEntry: storeEntry as TransactionLogStoreEntry<SegmentFragmentReferencesContainer>,
			},
		};
	}
	if (entryType === "section") {
		return {
			...transactionLogState,
			sections: {
				...transactionLogState.sections,
				id: transactionLogState.sections?.id || nanoid(),
				map: {
					...transactionLogState.sections?.map,
					[storeEntry.id]: storeEntry as TransactionLogStoreEntry<PartialSection>,
				},
			},
		};
	}
	if (entryType === "sectionReferences") {
		return {
			...transactionLogState,
			sections: {
				...transactionLogState.sections,
				id: transactionLogState.sections?.id || nanoid(),
				map: transactionLogState.sections?.map ?? {},
				referencesEntry: storeEntry as TransactionLogStoreEntry<SectionReferencesContainer>,
			},
		};
	}
	if (entryType === "watermark") {
		return {
			...transactionLogState,
			watermarks: {
				...transactionLogState.watermarks,
				id: transactionLogState.watermarks?.id || nanoid(),
				map: {
					...transactionLogState.watermarks?.map,
					[storeEntry.id]: storeEntry as TransactionLogStoreEntry<PartialWatermark>,
				},
			},
		};
	}
	if (entryType === "watermarkReferences") {
		return {
			...transactionLogState,
			watermarks: {
				...transactionLogState.watermarks,
				id: transactionLogState.watermarks?.id || nanoid(),
				map: transactionLogState.watermarks?.map ?? {},
				referencesEntry: storeEntry as TransactionLogStoreEntry<WatermarkReferencesContainer>,
			},
		};
	}
	if (entryType === "textStyle") {
		return {
			...transactionLogState,
			textStyles: {
				...transactionLogState.textStyles,
				id: transactionLogState.textStyles?.id || nanoid(),
				map: {
					...transactionLogState.textStyles?.map,
					[storeEntry.id]: storeEntry as TransactionLogStoreEntry<PartialTextStyle>,
				},
			},
		};
	}
	if (entryType === "textStyleReferences") {
		return {
			...transactionLogState,
			textStyles: {
				...transactionLogState.textStyles,
				id: transactionLogState.textStyles?.id || nanoid(),
				map: transactionLogState.textStyles?.map ?? {},
				referencesEntry: storeEntry as TransactionLogStoreEntry<TextStyleReferencesContainer>,
			},
		};
	}
	return {
		...transactionLogState,
		printModelElements: {
			...transactionLogState.printModelElements,
			[storeEntry.id]: storeEntry as TransactionLogStoreEntry<PartialAnyPrintModelElement>,
		},
	};
}

function* resolveRemovedPrintModelRefs(
	newState: TransactionLogStore,
	printModelRefs: PrintModelRefs
): SagaGenerator<boolean> {
	const { currentRefType, sectionId, segmentId, watermarkId, fragmentId } = printModelRefs;
	const general = newState[PRINT_MODEL_CONTENT_GENERAL_LOG_ID].memoizedObject;

	if (currentRefType === SidebarItem.SEGMENT && segmentId && !general.structure?.includes(segmentId)) {
		yield* put(NavigationActions.clearActiveEntity({ tab: SidebarItem.SEGMENT }));
		return true;
	}
	if (currentRefType === SidebarItem.SECTION && sectionId && !general.sections?.includes(sectionId)) {
		yield* put(NavigationActions.clearActiveEntity({ tab: SidebarItem.SECTION }));
		return true;
	}
	if (currentRefType === SidebarItem.WATERMARK && watermarkId && !general.watermarks?.includes(watermarkId)) {
		yield* put(NavigationActions.clearActiveEntity({ tab: SidebarItem.WATERMARK }));
		return true;
	}
	// Element fragments live in printModelElements (flagged via isFragment). After undo-of-create or
	// redo-of-delete the element is no longer a fragment, so clear the FRAGMENT tab.
	if (
		currentRefType === SidebarItem.FRAGMENT &&
		fragmentId &&
		!newState.printModelElements[fragmentId]?.memoizedObject?.isFragment
	) {
		yield* put(NavigationActions.clearActiveEntity({ tab: SidebarItem.FRAGMENT }));
		return true;
	}
	return false;
}

function getContainerMapAndId(
	currentRefType: SidebarItem,
	segmentId: string | undefined,
	sectionId: string | undefined,
	watermarkId: string | undefined,
	newState: TransactionLogStore
): {
	id: string | undefined;
	containerMap:
		| TransactionLogStore["segments"]
		| TransactionLogStore["sections"]
		| TransactionLogStore["watermarks"]
		| undefined;
} {
	if (currentRefType === SidebarItem.SEGMENT) {
		return { id: segmentId, containerMap: newState.segments };
	} else if (currentRefType === SidebarItem.SECTION) {
		return { id: sectionId, containerMap: newState.sections };
	} else {
		return { id: watermarkId, containerMap: newState.watermarks };
	}
}

/**
 * A fragment reference (segment/section/watermark) only gets a `containerMap.map[id]` entry once
 * some local edit materializes it - e.g. reordering its elements while it's open in the editor.
 * Before that, or once undo removes its only materializing interaction, it still exists in the
 * print model purely as a reference, resolvable from the fragment's own content (mirrors
 * PrintEngineSelectors.orderedSegmentItems / orderedSectionItems and the watermark equivalent).
 */
function resolveContainer(
	currentRefType: SidebarItem,
	id: string,
	containerMap: TransactionLogStore["segments"] | TransactionLogStore["sections"] | TransactionLogStore["watermarks"],
	newState: TransactionLogStore,
	printModelData: ReturnType<typeof RequestApiSelectors.printModelData>
): PartialSegment | PartialSection | PartialWatermark | undefined {
	const localEntry = containerMap?.map[id];
	if (localEntry) {
		return localEntry.memoizedObject;
	}
	if (currentRefType === SidebarItem.SEGMENT) {
		const ref = TransactionLog.selectSegmentFragmentReferences(newState.segments?.fragmentReferencesEntry).find(
			reference => reference.id === id
		);
		return ref
			? printModelData?.[ref.model]?.content?.segments?.definitions?.find(segment => segment.id === ref.refId)
			: undefined;
	}
	if (currentRefType === SidebarItem.SECTION) {
		const ref = TransactionLog.selectSectionReferences(newState.sections?.referencesEntry).find(
			reference => reference.id === id
		);
		return ref
			? printModelData?.[ref.model]?.content?.sections?.definitions?.find(section => section.id === ref.refId)
			: undefined;
	}
	const ref = TransactionLog.selectWatermarkReferences(newState.watermarks?.referencesEntry).find(
		reference => reference.id === id
	);
	return ref
		? printModelData?.[ref.model]?.content?.watermarks?.definitions?.find(watermark => watermark.id === ref.refId)
		: undefined;
}

function getElementReferences(
	container: PartialSegment | PartialSection | PartialWatermark,
	wrapper: PartialAnyPrintModelElement | undefined
): readonly PartialPlaceableReference[] {
	if (wrapper && PartialBoundingBox.isInstance(wrapper)) {
		return wrapper.boundingBox?.elementReferences || [];
	} else if (wrapper && PartialArea.isInstance(wrapper)) {
		return wrapper.area?.elementReferences || [];
	} else if (wrapper && PartialOverride.isInstance(wrapper)) {
		return wrapper.override?.boundingBox?.elementReferences || [];
	}
	return container.elementReferences || [];
}

function* resolveUiAfterUndoRedo(newState: TransactionLogStore, printModelRefs: PrintModelRefs) {
	const { currentRefType, sectionId, segmentId, watermarkId } = printModelRefs;

	const shouldExit = yield* call(resolveRemovedPrintModelRefs, newState, printModelRefs);
	// The detail-form cleanup below is built for the top-level containers (segment/section/watermark).
	// For element fragments the removed-ref check above is sufficient, so bail out here.
	if (shouldExit || currentRefType === SidebarItem.FRAGMENT) {
		return;
	}

	const wrappers = yield* select(PrintEngineSelectors.wrappers);
	const currentDetailData = yield* select(NavigationSelectors.detailForm);
	const entityId = yield* select(PrintEngineSelectors.currentElementContainerId);
	const firstForm = yield* select(NavigationSelectors.firstForm);
	const editorMode = yield* select(NavigationSelectors.currentMode);
	const wrapperId = wrappers.length > 0 ? wrappers.at(-1)?.id : undefined;

	const { id, containerMap } = getContainerMapAndId(currentRefType, segmentId, sectionId, watermarkId, newState);

	if (!id || !containerMap) {
		return;
	}
	const printModelData = yield* select(RequestApiSelectors.printModelData);
	const container = resolveContainer(currentRefType, id, containerMap, newState, printModelData);
	if (!container) {
		return;
	}
	const wrapper = wrapperId ? newState.printModelElements[wrapperId]?.memoizedObject : undefined;

	const elementReferences = getElementReferences(container, wrapper);

	if (
		currentDetailData &&
		firstForm &&
		isBaseElementFormState(firstForm) &&
		elementReferences?.every(el => el.refId !== firstForm?.id)
	) {
		if (entityId) {
			yield* put(
				NavigationActions.setDetailForm({ tab: currentRefType, entityId, mode: editorMode, form: undefined })
			);
			yield* put(
				NavigationActions.setSelectedElement({
					tab: currentRefType,
					entityId,
					mode: editorMode,
					elementId: undefined,
				})
			);
		}
	}
}

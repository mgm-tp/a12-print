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

import {
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	type PartialAnyPrintModelElement,
	type PartialSection,
	type SectionFragmentReference,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	type PartialTransactionLogPersistentEntry,
	type TransactionLogStore,
	type AffectedItem,
	SidebarItem,
	type TransactionLogStoreEntryMap,
	SECTIONS_REFERENCES_ENTRY_ID,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { TransactionLog } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import {
	clonePrintModelEntity,
	cloneSection,
	collectUsedTextStyleIds,
	createFragmentElementGetter,
} from "@com.mgmtp.a12.print/print-model-api/utils";

import type { AnyTransactionLogAction, ValidAnyTransactionLogAction } from "../../../redux/index.js";
import {
	ConfirmationDialogType,
	NavigationActions,
	NavigationSelectors,
	TransactionLogStateActions,
} from "../../../redux/index.js";
import { FragmentUsageSelectors } from "../../../redux/fragment-usage/selectors.js";
import { openConfirmationDialogSaga } from "../../confirmation-dialog/open-confirmation-dialog-saga.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";

import { appendTextStyleReferences, referenceFragmentTextStyles, replaceIdInPlace } from "./unlink-utils.js";

const SECTION_ACTIONS = [
	TransactionLogStateActions.addSection,
	TransactionLogStateActions.updateSection,
	TransactionLogStateActions.duplicateSection,
	TransactionLogStateActions.removeSection,
	TransactionLogStateActions.addSectionReference,
	TransactionLogStateActions.removeSectionReference,
	TransactionLogStateActions.unlinkSectionReference,
];

const MAX_SECTION_DEFINITIONS = 4;

export const SectionTransactionLogHandler = {
	match: function (action: AnyTransactionLogAction) {
		return SECTION_ACTIONS.some(sectionAction => sectionAction.match(action));
	},
	handle: handleSectionActions,
};

function* handleSectionActions({
	state,
	action,
	persistentEntries,
}: {
	state: TransactionLogStore;
	action: ValidAnyTransactionLogAction;
	persistentEntries: PartialTransactionLogPersistentEntry[];
}): SagaGenerator<AffectedItem[]> {
	const { interactionId } = action.payload;

	const newAffectedItems: AffectedItem[] = [];

	if (TransactionLogStateActions.addSection.match(action)) {
		const updatedSection = TransactionLog.createStoreEntrySection(
			state.sections,
			action.payload.data,
			interactionId
		);
		const contentGeneral = TransactionLog.selectPrintModelContentGeneral(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]);
		const updatedGeneral = TransactionLog.createStoreEntryPrintModelContentGeneral(
			state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
			{
				...contentGeneral,
				sections: [...(contentGeneral.sections || []), action.payload.data.id],
			},
			interactionId
		);
		persistentEntries.push(...updatedSection.persistentEntries, ...updatedGeneral.persistentEntries);
		newAffectedItems.push(
			{ type: "section" as const, id: updatedSection.storeEntry.id },
			{ type: "printModelContentGeneral" as const, id: updatedGeneral.storeEntry.id }
		);
		const newSections = state.sections || { id: nanoid(), map: {} };
		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				sections: {
					...newSections,
					map: {
						...newSections.map,
						[action.payload.data.id]: updatedSection.storeEntry,
					},
				},
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: updatedGeneral.storeEntry,
			})
		);

		return newAffectedItems;
	}

	if (TransactionLogStateActions.updateSection.match(action)) {
		const createStoreEntry = TransactionLog.createStoreEntrySection(
			state.sections,
			action.payload.data,
			interactionId
		);
		persistentEntries.push(...createStoreEntry.persistentEntries);
		newAffectedItems.push({ type: "section", id: createStoreEntry.storeEntry.id });

		const newSections = state.sections || { id: nanoid(), map: {} };
		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				sections: {
					...newSections,
					map: {
						...newSections.map,
						[action.payload.data.id]: createStoreEntry.storeEntry,
					},
				},
			})
		);
		return newAffectedItems;
	}

	if (TransactionLogStateActions.duplicateSection.match(action)) {
		const { clonedSection, clonedSectionElements } = cloneSection(action.payload.data, {
			cloneObject: clonePrintModelEntity,
			getElement: function (elementId) {
				return TransactionLog.selectPrintModelElement(state.printModelElements, elementId);
			},
			elementIdMap: new Map(),
		});

		const creatStoreElementEntries = clonedSectionElements.map(element => {
			return TransactionLog.createStoreEntryPrintModelElement(state.printModelElements, element, interactionId);
		});
		const clonePersistentEntries = creatStoreElementEntries.map(entry => entry.persistentEntries);
		const cloneStoreEntries = creatStoreElementEntries.map(entry => entry.storeEntry);
		const updatedSection = TransactionLog.createStoreEntrySection(state.sections, clonedSection, interactionId);

		const contentGeneral = TransactionLog.selectPrintModelContentGeneral(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]);
		const updatedGeneral = TransactionLog.createStoreEntryPrintModelContentGeneral(
			state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
			{
				...contentGeneral,
				sections: [...(contentGeneral.sections || []), clonedSection.id],
			},
			interactionId
		);

		persistentEntries.push(
			...updatedSection.persistentEntries,
			...updatedGeneral.persistentEntries,
			...clonePersistentEntries.flat()
		);

		newAffectedItems.push(
			{ type: "section" as const, id: updatedSection.storeEntry.id },
			{ type: "printModelContentGeneral" as const, id: updatedGeneral.storeEntry.id },
			...cloneStoreEntries.map(storeEntry => ({
				type: "printModelElement" as const,
				id: storeEntry.id,
			}))
		);

		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				sections: {
					...state.sections,
					id: state.sections?.id || nanoid(),
					map: {
						...state.sections?.map,
						[updatedSection.storeEntry.id]: updatedSection.storeEntry,
					},
				},
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: updatedGeneral.storeEntry,
				printModelElements: {
					...state.printModelElements,
					...cloneStoreEntries.reduce(
						(newStoredEntries: TransactionLogStoreEntryMap<PartialAnyPrintModelElement>, storeEntry) => {
							newStoredEntries[storeEntry.id] = storeEntry;
							return newStoredEntries;
						},
						{}
					),
				},
			})
		);

		return newAffectedItems;
	}

	if (TransactionLogStateActions.removeSection.match(action)) {
		const usageMapLoading = yield* select(FragmentUsageSelectors.isUsageMapLoading);
		const usages = yield* select((printEngineState: PrintEngineState) =>
			FragmentUsageSelectors.usageForEntity(printEngineState, action.payload.data.id)
		);
		if (usageMapLoading || usages.length > 0) {
			yield* call(openConfirmationDialogSaga, ConfirmationDialogType.FRAGMENT_IN_USE, { usages });
			return newAffectedItems;
		}

		const isConfirmed = yield* call(openConfirmationDialogSaga, ConfirmationDialogType.DELETE);
		if (!isConfirmed) {
			return newAffectedItems;
		}

		const contentGeneral = TransactionLog.selectPrintModelContentGeneral(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]);
		const updatedContentGeneral = TransactionLog.createStoreEntryPrintModelContentGeneral(
			state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
			{
				...contentGeneral,
				sections: (contentGeneral.sections || []).filter(id => id !== action.payload.data.id),
			},
			interactionId
		);
		persistentEntries.push(...updatedContentGeneral.persistentEntries);
		newAffectedItems.push({ type: "printModelContentGeneral", id: updatedContentGeneral.storeEntry.id });
		yield* put(NavigationActions.clearActiveEntity({ tab: SidebarItem.SECTION }));
		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: updatedContentGeneral.storeEntry,
			})
		);
		return newAffectedItems;
	}

	if (TransactionLogStateActions.addSectionReference.match(action)) {
		const reference = action.payload.data;
		const existingRefs = TransactionLog.selectSectionReferences(state.sections?.referencesEntry);
		const newRefs = [...existingRefs.filter(r => r.id !== reference.id), reference];
		const contentGeneral = TransactionLog.selectPrintModelContentGeneral(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]);
		const newSectionsOrder = [...(contentGeneral.sections || []).filter(id => id !== reference.id), reference.id];
		yield* call(
			updateSectionReferences,
			state,
			newRefs,
			newSectionsOrder,
			interactionId,
			persistentEntries,
			newAffectedItems
		);
		return newAffectedItems;
	}

	if (TransactionLogStateActions.removeSectionReference.match(action)) {
		const { id } = action.payload.data;
		const existingRefs = TransactionLog.selectSectionReferences(state.sections?.referencesEntry);
		const newRefs = existingRefs.filter(r => r.id !== id);
		const contentGeneral = TransactionLog.selectPrintModelContentGeneral(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]);
		const newSectionsOrder = (contentGeneral.sections || []).filter(sectionId => sectionId !== id);
		yield* call(
			updateSectionReferences,
			state,
			newRefs,
			newSectionsOrder,
			interactionId,
			persistentEntries,
			newAffectedItems
		);
		return newAffectedItems;
	}

	if (TransactionLogStateActions.unlinkSectionReference.match(action)) {
		const { referenceId, fragmentContent } = action.payload.data;
		const ref = TransactionLog.selectSectionReferences(state.sections?.referencesEntry).find(
			r => r.id === referenceId
		);
		if (!ref) {
			return newAffectedItems;
		}

		const resolved = fragmentContent.sections?.definitions?.find(section => section.id === ref.refId);
		if (!resolved) {
			return newAffectedItems;
		}

		if (!ref.sectionUsage) {
			return newAffectedItems;
		}

		const contentGeneral = TransactionLog.selectPrintModelContentGeneral(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]);
		const existingSectionDefinitions = (contentGeneral.sections ?? []).flatMap(sectionId => {
			const entry = state.sections?.map?.[sectionId];
			return entry ? [entry.memoizedObject] : [];
		});
		const hasConflictingSlot = existingSectionDefinitions.some(
			section => section.sectionUsage === ref.sectionUsage && section.pageOrientation === resolved.pageOrientation
		);
		if (hasConflictingSlot || existingSectionDefinitions.length >= MAX_SECTION_DEFINITIONS) {
			return newAffectedItems;
		}

		let hasUnresolved = false;
		const onUnresolved = () => {
			hasUnresolved = true;
		};

		const usedTextStyleIds = collectUsedTextStyleIds(resolved, fragmentContent);
		const { newReferences, newOrderIds, textStyleIdMap } = referenceFragmentTextStyles(
			state,
			fragmentContent,
			ref.model,
			usedTextStyleIds,
			onUnresolved
		);

		const { clonedSection, clonedSectionElements } = cloneSection(resolved, {
			cloneObject: clonePrintModelEntity,
			getElement: createFragmentElementGetter(fragmentContent),
			elementIdMap: new Map(),
			textStyleIdMap,
			onUnresolved,
		});

		if (hasUnresolved) {
			return newAffectedItems;
		}

		const newSection: PartialSection = {
			...clonedSection,
			sectionUsage: ref.sectionUsage,
		};

		const createStoreElementEntries = clonedSectionElements.map(element =>
			TransactionLog.createStoreEntryPrintModelElement(state.printModelElements, element, interactionId)
		);
		const clonePersistentEntries = createStoreElementEntries.map(entry => entry.persistentEntries);
		const cloneStoreEntries = createStoreElementEntries.map(entry => entry.storeEntry);

		const updatedSection = TransactionLog.createStoreEntrySection(state.sections, newSection, interactionId);

		const existingSectionRefs = TransactionLog.selectSectionReferences(state.sections?.referencesEntry);
		const updatedSectionRefsEntry = TransactionLog.createStoreEntrySectionReferences(
			state.sections?.referencesEntry,
			{
				id: SECTIONS_REFERENCES_ENTRY_ID,
				references: existingSectionRefs.filter(r => r.id !== referenceId),
			},
			interactionId
		);

		const textStyleRefsUpdate = appendTextStyleReferences(state, newReferences, interactionId);

		const updatedGeneral = TransactionLog.createStoreEntryPrintModelContentGeneral(
			state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
			{
				...contentGeneral,
				sections: replaceIdInPlace(contentGeneral.sections, referenceId, newSection.id),
				textStyles: [...(contentGeneral.textStyles || []), ...newOrderIds],
			},
			interactionId
		);

		persistentEntries.push(
			...updatedSection.persistentEntries,
			...updatedSectionRefsEntry.persistentEntries,
			...textStyleRefsUpdate.persistentEntries,
			...updatedGeneral.persistentEntries,
			...clonePersistentEntries.flat()
		);
		newAffectedItems.push(
			{ type: "section" as const, id: updatedSection.storeEntry.id },
			{ type: "sectionReferences" as const, id: updatedSectionRefsEntry.storeEntry.id },
			...textStyleRefsUpdate.affectedItems,
			{ type: "printModelContentGeneral" as const, id: updatedGeneral.storeEntry.id },
			...cloneStoreEntries.map(storeEntry => ({ type: "printModelElement" as const, id: storeEntry.id }))
		);

		const newSections = state.sections || { id: nanoid(), map: {} };
		yield* put(
			TransactionLogStateActions.setLogStore({
				...state,
				sections: {
					...newSections,
					map: {
						...newSections.map,
						[updatedSection.storeEntry.id]: updatedSection.storeEntry,
					},
					referencesEntry: updatedSectionRefsEntry.storeEntry,
				},
				textStyles: textStyleRefsUpdate.textStyles,
				[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: updatedGeneral.storeEntry,
				printModelElements: {
					...state.printModelElements,
					...cloneStoreEntries.reduce(
						(newStoredEntries: TransactionLogStoreEntryMap<PartialAnyPrintModelElement>, storeEntry) => {
							newStoredEntries[storeEntry.id] = storeEntry;
							return newStoredEntries;
						},
						{}
					),
				},
			})
		);

		const activeEntitiesAfterUnlink = yield* select(NavigationSelectors.activeEntities);
		if (activeEntitiesAfterUnlink.sectionId === referenceId) {
			yield* put(NavigationActions.setActiveEntity({ tab: SidebarItem.SECTION, entityId: newSection.id }));
		}

		return newAffectedItems;
	}

	return newAffectedItems;
}

function* updateSectionReferences(
	state: TransactionLogStore,
	newRefs: SectionFragmentReference[],
	newSectionsOrder: ReadonlyArray<string>,
	interactionId: string,
	persistentEntries: PartialTransactionLogPersistentEntry[],
	newAffectedItems: AffectedItem[]
): SagaGenerator<void> {
	const updatedRefsEntry = TransactionLog.createStoreEntrySectionReferences(
		state.sections?.referencesEntry,
		{ id: SECTIONS_REFERENCES_ENTRY_ID, references: newRefs },
		interactionId
	);
	const contentGeneral = TransactionLog.selectPrintModelContentGeneral(state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]);
	const updatedGeneral = TransactionLog.createStoreEntryPrintModelContentGeneral(
		state[PRINT_MODEL_CONTENT_GENERAL_LOG_ID],
		{ ...contentGeneral, sections: newSectionsOrder },
		interactionId
	);
	persistentEntries.push(...updatedRefsEntry.persistentEntries, ...updatedGeneral.persistentEntries);
	newAffectedItems.push(
		{ type: "sectionReferences" as const, id: updatedRefsEntry.storeEntry.id },
		{ type: "printModelContentGeneral" as const, id: updatedGeneral.storeEntry.id }
	);
	const newSections = state.sections || { id: nanoid(), map: {} };
	yield* put(
		TransactionLogStateActions.setLogStore({
			...state,
			[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]: updatedGeneral.storeEntry,
			sections: {
				...newSections,
				referencesEntry: updatedRefsEntry.storeEntry,
			},
		})
	);
}

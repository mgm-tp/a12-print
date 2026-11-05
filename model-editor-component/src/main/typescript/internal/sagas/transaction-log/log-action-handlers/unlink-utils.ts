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
import { nanoid } from "nanoid";

import type {
	AffectedItem,
	PartialTransactionLogPersistentEntry,
	TransactionLogStore,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import {
	TEXT_STYLES_REFERENCES_ENTRY_ID,
	TransactionLog,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { FragmentModelReference, PartialPrintModelContent } from "@com.mgmtp.a12.print/print-model-api/model";

/**
 * Replaces `oldId` with `newId` in `order`, preserving position. Throws if `oldId` is absent -
 * an unlink whose reference is not in the order list indicates corrupt state and must not
 * silently append.
 */
export function replaceIdInPlace(order: ReadonlyArray<string> | undefined, oldId: string, newId: string): string[] {
	const list = order ?? [];
	const index = list.indexOf(oldId);
	if (index === -1) {
		throw new Error(`Cannot replace id "${oldId}" in place: it is not present in the order list`);
	}
	return list.map((id, i) => (i === index ? newId : id));
}

export interface ReferenceFragmentTextStylesResult {
	newReferences: FragmentModelReference[];
	newOrderIds: string[];
	textStyleIdMap: Map<string, string>;
}

/**
 * For each id in `usedTextStyleIds`, finds-or-creates a `FragmentModelReference` pointing at the
 * fragment text style (dedup by `{model, refId}` against the host's existing text-style
 * references) instead of cloning a local `TextStyle` definition - so the materialised
 * section/segment/watermark keeps its text styling live against the fragment until the modeler
 * separately unlinks that specific text-style reference.
 */
export function referenceFragmentTextStyles(
	state: TransactionLogStore,
	fragmentContent: PartialPrintModelContent,
	fragmentModelId: string,
	usedTextStyleIds: ReadonlySet<string>,
	onUnresolved?: (kind: "element" | "textStyle", id: string) => void
): ReferenceFragmentTextStylesResult {
	const newReferences: FragmentModelReference[] = [];
	const newOrderIds: string[] = [];
	const textStyleIdMap = new Map<string, string>();
	const existingRefs = TransactionLog.selectTextStyleReferences(state.textStyles?.referencesEntry);

	for (const originalId of usedTextStyleIds) {
		const fragmentTextStyle = fragmentContent.textStyles?.definitions?.find(
			textStyle => textStyle.id === originalId
		);
		if (!fragmentTextStyle) {
			onUnresolved?.("textStyle", originalId);
			continue;
		}

		const existing = existingRefs.find(ref => ref.model === fragmentModelId && ref.refId === originalId);
		if (existing) {
			textStyleIdMap.set(originalId, existing.id);
			continue;
		}

		const newId = nanoid();
		textStyleIdMap.set(originalId, newId);
		newReferences.push({ id: newId, refId: originalId, model: fragmentModelId });
		newOrderIds.push(newId);
	}

	return { newReferences, newOrderIds, textStyleIdMap };
}

export interface TextStyleReferencesUpdate {
	textStyles: TransactionLogStore["textStyles"];
	persistentEntries: PartialTransactionLogPersistentEntry[];
	affectedItems: AffectedItem[];
}

/**
 * Appends `newReferences` to the host's text-style references entry. If `newReferences` is empty, nothing is
 * written and the state's text styles are returned unchanged.
 */
export function appendTextStyleReferences(
	state: TransactionLogStore,
	newReferences: ReadonlyArray<FragmentModelReference>,
	interactionId: string
): TextStyleReferencesUpdate {
	if (newReferences.length === 0) {
		return { textStyles: state.textStyles, persistentEntries: [], affectedItems: [] };
	}
	const existingRefs = TransactionLog.selectTextStyleReferences(state.textStyles?.referencesEntry);
	const updatedEntry = TransactionLog.createStoreEntryTextStyleReferences(
		state.textStyles?.referencesEntry,
		{ id: TEXT_STYLES_REFERENCES_ENTRY_ID, references: [...existingRefs, ...newReferences] },
		interactionId
	);
	return {
		textStyles: { ...(state.textStyles || { id: nanoid(), map: {} }), referencesEntry: updatedEntry.storeEntry },
		persistentEntries: updatedEntry.persistentEntries,
		affectedItems: [{ type: "textStyleReferences", id: updatedEntry.storeEntry.id }],
	};
}

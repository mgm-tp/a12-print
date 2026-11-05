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
import type { TransactionLogStore } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { TransactionLog } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { ModelReferenceEntity, PartialPrintModelHeader } from "@com.mgmtp.a12.print/print-model-api/model";
import { PRINT_MODEL_HEADER_LOG_ID } from "@com.mgmtp.a12.print/print-model-api/model";

import { TransactionLogStateActions } from "../../../redux/index.js";
import { SchemaActions } from "../../../redux/schema/action.js";
import { initialStateLogStore } from "../../../redux/transaction-log-state/reducer.js";

import { handleAddFragmentModelReferenceSaga } from "../add-fragment-model-reference-saga.js";

const COMMITTED_HEADER: PartialPrintModelHeader = {
	id: "print-model",
	description: "committed description",
	modelReferences: [{ id: "doc-ref", modelType: "document", reference: "DocumentModel", purpose: "data binding" }],
};

const FRAGMENT_REFERENCE: ModelReferenceEntity = {
	id: "fragment-ref",
	modelType: "print",
	reference: "FragmentModel",
	purpose: "fragment",
} as ModelReferenceEntity;

function storeWithPendingDescriptionChange(): TransactionLogStore {
	const { storeEntry } = TransactionLog.createStoreEntryPrintModelHeader(
		{ id: PRINT_MODEL_HEADER_LOG_ID, log: [], memoizedObject: COMMITTED_HEADER, initialObject: COMMITTED_HEADER },
		{ ...COMMITTED_HEADER, description: "pending description" },
		"interaction-1"
	);
	return { ...initialStateLogStore, [PRINT_MODEL_HEADER_LOG_ID]: storeEntry };
}

function runUntilSetLogStore(store: TransactionLogStore): TransactionLogStore {
	const gen = handleAddFragmentModelReferenceSaga(SchemaActions.addFragmentModelReference(FRAGMENT_REFERENCE));
	gen.next(); // -> confirmation dialog
	gen.next(true as never); // confirmed -> requestApi context
	gen.next({} as never); // requestApi -> transactionLogState
	gen.next(store as never); // transactionLogState -> printHeader
	const step = gen.next(store[PRINT_MODEL_HEADER_LOG_ID].memoizedObject as never); // printHeader -> setLogStore
	const action = (step.value as { payload: { action: unknown } }).payload.action;
	expect(TransactionLogStateActions.setLogStore.match(action as never)).toBe(true);
	return (action as ReturnType<typeof TransactionLogStateActions.setLogStore>).payload;
}

describe("handleAddFragmentModelReferenceSaga", () => {
	test("adds the fragment reference to the committed header and keeps pending changes", () => {
		const headerEntry = runUntilSetLogStore(storeWithPendingDescriptionChange())[PRINT_MODEL_HEADER_LOG_ID];

		expect(headerEntry.initialObject?.description).toBe("committed description");
		expect(headerEntry.initialObject?.modelReferences).toEqual([
			...COMMITTED_HEADER.modelReferences!,
			FRAGMENT_REFERENCE,
		]);
		expect(headerEntry.memoizedObject.description).toBe("pending description");
		expect(headerEntry.memoizedObject.modelReferences).toEqual([
			...COMMITTED_HEADER.modelReferences!,
			FRAGMENT_REFERENCE,
		]);
		expect(headerEntry.log.length).toBeGreaterThan(0);
	});

	test("pending header changes can still be undone after adding the fragment reference", () => {
		const headerEntry = runUntilSetLogStore(storeWithPendingDescriptionChange())[PRINT_MODEL_HEADER_LOG_ID];

		const { storeEntry } = TransactionLog.undo(headerEntry, "printModelHeader", "interaction-1", "interaction-2");

		expect(storeEntry.memoizedObject.description).toBe("committed description");
		expect(storeEntry.memoizedObject.modelReferences).toEqual([
			...COMMITTED_HEADER.modelReferences!,
			FRAGMENT_REFERENCE,
		]);
	});
});

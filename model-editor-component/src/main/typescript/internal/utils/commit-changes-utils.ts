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
import type { TransactionLogEntry } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import type { TransactionLogGroup } from "../store/selectors.js";
import type { CommitInteractionRow, CommitState, CommitTransactionRow } from "../types/commit-view.js";

export function initialize(interactionGroup: TransactionLogGroup[]) {
	const latestEntryMap: Record<string, Record<string, true>> = {};
	const arrayLatestMoveMap: Record<string, Record<string, Record<string, boolean>>> = {};
	const arrayRemoveMap: Record<string, Record<string, Record<string, boolean>>> = {};
	return interactionGroup.reduce<CommitInteractionRow[]>((res, interactionWithTransactions) => {
		const { interaction, transactions } = interactionWithTransactions;

		const interactionStatus: CommitState = "commit";
		const transactionRows: CommitTransactionRow[] = [];

		transactions.forEach(transaction => {
			const { propertyKey, parentId, command } = transaction;
			let transactionStatus: CommitState = "commit";
			const arrayAction = getArrayAction(transaction);

			if (!arrayAction) {
				transactionRows.push(createObjectTransactionRow(latestEntryMap, transaction, transactionStatus));
				return;
			}

			const [arrayCommand, arrayId] = arrayAction;
			if (arrayCommand === "MOVE") {
				const isOverwritten = handleArrayMove(arrayLatestMoveMap, parentId, propertyKey, arrayId);
				transactionStatus = isOverwritten ? "overwritten" : transactionStatus;
			} else if (command === "REMOVE") {
				handleRemove(arrayRemoveMap, parentId, propertyKey, arrayId);
			} else if (arrayRemoveMap[parentId]?.[propertyKey]?.[arrayId]) {
				transactionStatus = "overwritten";
			}

			transactionRows.push({ ...transaction, state: transactionStatus });
		});

		res.push({
			interactionId: interaction.interactionId,
			transactions: transactionRows,
			description: interaction.description,
			timestamp: interaction.timestamp,
			state: interactionStatus,
		});
		return res;
	}, []);
}

function getArrayAction(transaction: TransactionLogEntry) {
	const { objectId, value } = transaction;
	if (Array.isArray(objectId)) {
		return objectId;
	}

	if (Array.isArray(value)) {
		return value;
	}

	return undefined;
}

function createObjectTransactionRow(
	latestEntryMap: Record<string, Record<string, true>>,
	transaction: TransactionLogEntry,
	transactionStatus: CommitState
): CommitTransactionRow {
	const { propertyKey, parentId } = transaction;

	let innterTransactionStatus = transactionStatus;
	if (latestEntryMap[parentId]?.[propertyKey]) {
		innterTransactionStatus = "overwritten";
	} else {
		latestEntryMap[parentId] = { ...latestEntryMap[parentId], [propertyKey]: true };
	}
	return { ...transaction, state: innterTransactionStatus };
}

function handleArrayMove(
	arrayLatestMoveMap: Record<string, Record<string, Record<string, boolean>>>,
	parentId: string,
	propertyKey: string,
	arrayId: string
): boolean {
	if (arrayLatestMoveMap[parentId]?.[propertyKey]?.[arrayId]) {
		return true; // Overwritten
	}
	arrayLatestMoveMap[parentId] = {
		...arrayLatestMoveMap[parentId],
		[propertyKey]: { ...arrayLatestMoveMap[parentId]?.[propertyKey], [arrayId]: true },
	};
	return false;
}

function handleRemove(
	arrayRemoveMap: Record<string, Record<string, Record<string, boolean>>>,
	parentId: string,
	propertyKey: string,
	arrayId: string
): void {
	arrayRemoveMap[parentId] = {
		...arrayRemoveMap[parentId],
		[propertyKey]: { ...arrayRemoveMap[parentId]?.[propertyKey], [arrayId]: true },
	};
}

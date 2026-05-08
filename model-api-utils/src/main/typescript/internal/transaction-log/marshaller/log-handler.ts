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
import {
	InteractionLogPersistentEntry,
	LogPersistentEntry,
	PartialTransactionLogPersistentEntry,
} from "../../transaction-log/index.js";

import { InteractionLogMarshaller } from "./interaction-log-marshaller.js";
import { TransactionLogMarshaller } from "./transaction-log-marshaller.js";
import { LogOutputHandler, OutputRow } from "./tsv-output.js";

export class LogHandler {
	public static generateInteractionLogOutput(entries: InteractionLogPersistentEntry[]): string {
		const rows: OutputRow[] = [];
		for (const entry of entries) {
			rows.push(InteractionLogMarshaller.serialize(entry));
		}

		return LogOutputHandler.generate(rows);
	}

	public static generateTransactionLogOutput(entries: PartialTransactionLogPersistentEntry[]): string {
		const rows: OutputRow[] = [];
		for (const entry of entries) {
			rows.push(TransactionLogMarshaller.serialize(entry));
		}

		return LogOutputHandler.generate(rows);
	}

	public static generateCombinedLogOutput(entries: LogPersistentEntry[]): string {
		const rows: OutputRow[] = [];
		for (const entry of entries) {
			rows.push(InteractionLogMarshaller.serialize(entry.interactionLogPersistentEntry));
			for (const transactionLogEntry of entry.transactionLogPersistentEntries) {
				rows.push(TransactionLogMarshaller.serialize(transactionLogEntry));
			}
		}

		return LogOutputHandler.generate(rows);
	}

	public static readLogInput(input: string): LogPersistentEntry[] {
		const rows = LogOutputHandler.read(input);

		const logPersistentEntriesMap: Map<string, Partial<LogPersistentEntry>> = new Map();

		for (const row of rows) {
			if (InteractionLogMarshaller.canHandleRow(row)) {
				const interactionLogEntry = InteractionLogMarshaller.deserialize(row);
				const { interactionId } = interactionLogEntry;
				const logPersistentEntry = logPersistentEntriesMap.get(interactionId);

				if (logPersistentEntry?.interactionLogPersistentEntry !== undefined) {
					throw new Error(`There is already an interaction row with the id ${interactionId}`);
				}

				logPersistentEntriesMap.set(interactionId, {
					...logPersistentEntry,
					interactionLogPersistentEntry: interactionLogEntry,
				});
			} else if (TransactionLogMarshaller.canHandleRow(row)) {
				const transactionLogEntry = TransactionLogMarshaller.deserialize(row);
				const { interactionId } = transactionLogEntry;
				const logPersistentEntry = logPersistentEntriesMap.get(interactionId);

				logPersistentEntriesMap.set(interactionId, {
					...logPersistentEntry,
					transactionLogPersistentEntries: [
						...(logPersistentEntry?.transactionLogPersistentEntries || []),
						transactionLogEntry,
					],
				});
			} else if (row.length !== 1 && row[0] !== undefined) {
				throw new Error("This row type is not supported");
			}
		}

		const logPersistentEntries: LogPersistentEntry[] = [];

		for (const [key, value] of logPersistentEntriesMap) {
			if (!value.interactionLogPersistentEntry) {
				throw new Error(`There are transactions for the interaction ${key}, but no interaction row itself`);
			}
			logPersistentEntries.push({
				interactionLogPersistentEntry: value.interactionLogPersistentEntry,
				transactionLogPersistentEntries: value.transactionLogPersistentEntries || [],
			});
		}

		return logPersistentEntries;
	}
}

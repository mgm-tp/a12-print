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
	EntryType,
	PartialTransactionLogPersistentEntry,
	TransactionLogEntryCommand,
	TransactionLogEntryObjectId,
} from "../../transaction-log/index.js";

import { LogIndexes, LogMarshaller } from "./log-marshaller.js";
import { LogValueType } from "./log-value-type.js";
import { OutputCell, OutputRow } from "./tsv-output.js";

export class TransactionLogMarshaller extends LogMarshaller {
	private static CELL_COUNT = 11;

	private static indexes: LogIndexes<PartialTransactionLogPersistentEntry> = {
		interactionId: { value: 1 },
		id: { value: 2 },
		entryType: { value: 3 },
		objectId: {
			value: 5,
			type: 4,
		},
		value: {
			value: 7,
			type: 6,
		},
		parentId: { value: 8 },
		propertyKey: { value: 9 },
		command: { value: 10 },
	};

	public static canHandleRow(row: OutputRow): boolean {
		return row[this.indexes.interactionId.value] !== undefined;
	}

	public static serialize(entry: PartialTransactionLogPersistentEntry): OutputRow {
		const cells = new Array<OutputCell>(this.CELL_COUNT);

		const objectIdType = LogValueType.detectValueType(entry.objectId);
		const escapedObjectId = LogValueType.escapeValue(entry.objectId, objectIdType);

		const valueType = LogValueType.detectValueType(entry.value);
		const escapedValue = LogValueType.escapeValue(entry.value, valueType);

		cells[this.indexes.interactionId.value] = entry.interactionId;
		cells[this.indexes.id.value] = entry.id;
		cells[this.indexes.entryType.value] = entry.entryType;

		cells[this.indexes.objectId.type!] = objectIdType;
		cells[this.indexes.objectId.value] = escapedObjectId;

		cells[this.indexes.value.type!] = valueType;
		cells[this.indexes.value.value] = escapedValue;

		cells[this.indexes.parentId.value] = entry.parentId;
		cells[this.indexes.propertyKey.value] = entry.propertyKey;
		cells[this.indexes.command.value] = entry.command;

		return cells;
	}

	public static deserialize(cells: OutputRow): PartialTransactionLogPersistentEntry {
		this.checkCellCount(cells.length, this.CELL_COUNT);

		const command = cells[this.indexes.command.value];
		const objectId = LogValueType.getValueWithTypeString(
			cells[this.indexes.objectId.type!],
			cells[this.indexes.objectId.value]
		);

		return {
			interactionId: this.getRequired(cells, this.indexes.interactionId.value),
			id: this.getRequired(cells, this.indexes.id.value),
			entryType: this.assertType(this.getRequired(cells, this.indexes.entryType.value), EntryType.isInstance),
			objectId: this.assertType(objectId, TransactionLogEntryObjectId.isInstance),
			value: LogValueType.getValueWithTypeString(
				cells[this.indexes.value.type!],
				cells[this.indexes.value.value]
			),
			parentId: cells[this.indexes.parentId.value],
			propertyKey: cells[this.indexes.propertyKey.value],
			command: command ? this.assertType(command, TransactionLogEntryCommand.isInstance) : undefined,
		};
	}
}

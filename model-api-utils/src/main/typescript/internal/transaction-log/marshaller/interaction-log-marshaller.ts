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
import type { InteractionLogPersistentEntry } from "../../../a12internal/transaction-log/interaction-log.js";
import {
	assertInteractionLogEntryType,
	assertInteractionRegion,
} from "../../../a12internal/transaction-log/interaction-log.js";

import type { LogIndexes } from "./log-marshaller.js";
import { LogMarshaller } from "./log-marshaller.js";
import { PreventUndoType } from "./prevent-undo-type.js";
import type { OutputCell, OutputRow } from "./tsv-output.js";

export class InteractionLogMarshaller extends LogMarshaller {
	private static CELL_COUNT = 10;

	private static indexes: LogIndexes<InteractionLogPersistentEntry> = {
		interactionId: { value: 0 },
		timestamp: { value: 2 },
		description: { value: 3 },
		preventUndo: {
			value: 5,
			type: 4,
		},
		type: { value: 6 },
		affectedInteractionId: { value: 7 },
		region: { value: 8 },
		regionId: { value: 9 },
	};

	public static canHandleRow(row: OutputCell[]): boolean {
		return row[this.indexes.interactionId.value] !== undefined;
	}

	public static serialize(entry: InteractionLogPersistentEntry): OutputRow {
		const cells = new Array<OutputCell>(this.CELL_COUNT);

		const preventUndoType = PreventUndoType.detectValueType(entry.preventUndo);

		cells[this.indexes.interactionId.value] = entry.interactionId;
		cells[this.indexes.timestamp.value] = entry.timestamp.toString();
		cells[this.indexes.description.value] = entry.description;

		cells[this.indexes.preventUndo.type!] = preventUndoType;
		cells[this.indexes.preventUndo.value] =
			entry.preventUndo !== undefined ? entry.preventUndo.toString() : undefined;

		cells[this.indexes.type.value] = entry.type;
		cells[this.indexes.affectedInteractionId.value] = entry.affectedInteractionId;
		cells[this.indexes.region.value] = entry.region;
		cells[this.indexes.regionId.value] = entry.regionId;

		return cells;
	}
	public static deserialize(cells: OutputRow): InteractionLogPersistentEntry {
		this.checkCellCount(cells.length, this.CELL_COUNT);

		const type = cells[this.indexes.type.value];
		assertInteractionLogEntryType(type);

		const region = cells[this.indexes.region.value];
		assertInteractionRegion(region);

		return {
			interactionId: this.getRequired(cells, this.indexes.interactionId.value),
			timestamp: Number.parseInt(this.getRequired(cells, this.indexes.timestamp.value)),
			description: cells[this.indexes.description.value],
			preventUndo: PreventUndoType.getValueWithTypeString(
				cells[this.indexes.preventUndo.type!],
				cells[this.indexes.preventUndo.value]
			),
			type,
			affectedInteractionId: cells[this.indexes.affectedInteractionId.value],
			region,
			regionId: this.getRequired(cells, this.indexes.regionId.value),
		};
	}
}

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

import type { TransactionLogGroup } from "../../store/selectors.js";

import { initialize } from "../commit-changes-utils.js";

function createTransaction(overrides: Partial<TransactionLogEntry>): TransactionLogEntry {
	return {
		parentId: "p1",
		propertyKey: "key1",
		command: "SET",
		objectId: undefined,
		value: undefined,
		...overrides,
	} as TransactionLogEntry;
}

function createGroup(
	interactionId: string,
	transactions: TransactionLogEntry[],
	description = "action"
): TransactionLogGroup {
	return {
		interaction: { interactionId, description, timestamp: 0 },
		transactions,
	} as TransactionLogGroup;
}

describe("initialize", () => {
	it("returns empty array for empty input", () => {
		expect(initialize([])).toEqual([]);
	});

	it("creates rows from simple SET transactions", () => {
		const tx = createTransaction({ parentId: "p1", propertyKey: "name", command: "SET" });
		const group = createGroup("i1", [tx]);
		const result = initialize([group]);
		expect(result).toHaveLength(1);
		expect(result[0].interactionId).toBe("i1");
		expect(result[0].transactions).toHaveLength(1);
		expect(result[0].transactions[0].state).toBe("commit");
	});

	it("marks duplicate SET on same parent+key as overwritten", () => {
		const tx1 = createTransaction({ parentId: "p1", propertyKey: "name", command: "SET" });
		const tx2 = createTransaction({ parentId: "p1", propertyKey: "name", command: "SET" });
		const group1 = createGroup("i1", [tx1]);
		const group2 = createGroup("i2", [tx2]);
		const result = initialize([group1, group2]);
		// First one gets "commit", second gets "overwritten"
		expect(result[0].transactions[0].state).toBe("commit");
		expect(result[1].transactions[0].state).toBe("overwritten");
	});

	it("handles array MOVE transactions", () => {
		const tx = createTransaction({
			parentId: "p1",
			propertyKey: "elements",
			command: "SET",
			objectId: ["MOVE", "el1"] as never,
		});
		const group = createGroup("i1", [tx]);
		const result = initialize([group]);
		expect(result[0].transactions[0].state).toBe("commit");
	});

	it("marks duplicate MOVE for same element as overwritten", () => {
		const tx1 = createTransaction({
			parentId: "p1",
			propertyKey: "elements",
			command: "SET",
			objectId: ["MOVE", "el1"] as never,
		});
		const tx2 = createTransaction({
			parentId: "p1",
			propertyKey: "elements",
			command: "SET",
			objectId: ["MOVE", "el1"] as never,
		});
		const group1 = createGroup("i1", [tx1]);
		const group2 = createGroup("i2", [tx2]);
		const result = initialize([group1, group2]);
		expect(result[0].transactions[0].state).toBe("commit");
		expect(result[1].transactions[0].state).toBe("overwritten");
	});

	it("marks transactions after REMOVE as overwritten", () => {
		const txRemove = createTransaction({
			parentId: "p1",
			propertyKey: "elements",
			command: "REMOVE",
			objectId: ["REMOVE", "el1"] as never,
		});
		const txAfter = createTransaction({
			parentId: "p1",
			propertyKey: "elements",
			command: "SET",
			objectId: ["ADD", "el1"] as never,
		});
		const group1 = createGroup("i1", [txRemove]);
		const group2 = createGroup("i2", [txAfter]);
		const result = initialize([group1, group2]);
		expect(result[1].transactions[0].state).toBe("overwritten");
	});

	it("handles array action from value field", () => {
		const tx = createTransaction({
			parentId: "p1",
			propertyKey: "elements",
			command: "SET",
			value: ["MOVE", "el1"] as never,
		});
		const group = createGroup("i1", [tx]);
		const result = initialize([group]);
		expect(result[0].transactions[0].state).toBe("commit");
	});
});

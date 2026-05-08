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
import fs from "node:fs";

import { ElementType } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import {
	createInteractionLogPersistentEntry,
	createTransactionLogPersistentEntry,
} from "../../../../../../test/typescript/test-utils/transaction-log/log-persist-entry.js";
import { LogPersistentEntry } from "../../log.js";

import { LogHandler } from "../log-handler.js";

const LOG_PATH = "src/test/resources/transaction-log/";

const STRING_WITH_TAB = '<p><span style="">Lorem\tI\'psum</span></p>';
const UNESCAPED_STRING =
	'<p><span style="">dhhdhdhd</span></p>\n<p><span style="">äää</span></p>\n<p><span style="">öö\'ö</span></p>\n<p><span style="">üüü</span></p>\n<p><span style="">?</span></p>\n<p><span style="">dkddj\\ndjd</span></p>';

describe("Write Log", () => {
	const pathToGeneratedFile = LOG_PATH + "persister_generated_escaped.wal";

	beforeAll(() => {
		if (fs.existsSync(pathToGeneratedFile)) {
			fs.unlinkSync(pathToGeneratedFile);
		}
	});

	afterAll(() => {
		if (fs.existsSync(pathToGeneratedFile)) {
			fs.unlinkSync(pathToGeneratedFile);
		}
	});

	it("should write and read log entries correctly", () => {
		const interactionEntry = createInteractionLogPersistentEntry(
			"INTERACTION_0",
			1683292682329,
			"Description",
			"SET",
			"sidebar",
			"general"
		);
		const transactionEntries = [
			createTransactionLogPersistentEntry(
				"INTERACTION_0",
				"id",
				ElementType.Table,
				"ID_PARENT",
				"KEY_STRING",
				"VALUE_STRING",
				"SET"
			),
			createTransactionLogPersistentEntry(
				"INTERACTION_0",
				"id",
				ElementType.Table,
				"ID_PARENT",
				"KEY_NUMBER",
				200,
				"SET"
			),
			createTransactionLogPersistentEntry(
				"INTERACTION_0",
				"id",
				ElementType.Table,
				"ID_PARENT",
				"KEY_BOOLEAN",
				false,
				"SET"
			),
			createTransactionLogPersistentEntry(
				"INTERACTION_0",
				"id",
				ElementType.Table,
				"ID_PARENT",
				"KEY_STRING",
				STRING_WITH_TAB,
				"SET"
			),
		];

		const logEntry: LogPersistentEntry = {
			interactionLogPersistentEntry: interactionEntry,
			transactionLogPersistentEntries: transactionEntries,
		};

		const logContent = LogHandler.generateCombinedLogOutput([logEntry]);
		fs.writeFileSync(pathToGeneratedFile, logContent);

		expect(fs.existsSync(pathToGeneratedFile)).toBe(true);

		const generatedContent = fs.readFileSync(pathToGeneratedFile, "utf-8");
		const generatedEntries = LogHandler.readLogInput(generatedContent);

		expect(generatedEntries).toHaveLength(1);

		const loadedInteractionEntry = generatedEntries[0].interactionLogPersistentEntry;
		expect(loadedInteractionEntry.interactionId).toBe("INTERACTION_0");

		const loadedTransactionEntries = generatedEntries[0].transactionLogPersistentEntries;
		expect(loadedTransactionEntries).toHaveLength(4);

		expect(typeof loadedTransactionEntries[0].value).toBe("string");
		expect(loadedTransactionEntries[0].value).toBe("VALUE_STRING");

		expect(typeof loadedTransactionEntries[1].value).toBe("number");
		expect(loadedTransactionEntries[1].value).toBe(200);

		expect(typeof loadedTransactionEntries[2].value).toBe("boolean");
		expect(loadedTransactionEntries[2].value).toBe(false);

		expect(typeof loadedTransactionEntries[3].value).toBe("string");
		expect(loadedTransactionEntries[3].value).toBe(STRING_WITH_TAB);
	});
});

describe("Read Log", () => {
	it("should read log content from WAL file", () => {
		const pathToReadFile = LOG_PATH + "persister.wal";
		const pathToGeneratedFile = LOG_PATH + "persister_new.wal";

		// read wal file
		const resultAfterRead = testReadingWalFile(pathToReadFile);

		// write content
		const logContent = LogHandler.generateCombinedLogOutput(resultAfterRead);
		fs.writeFileSync(pathToGeneratedFile, logContent);
		expect(fs.existsSync(pathToGeneratedFile)).toBe(true);

		// read written wal file
		const resultAfterWrite = testReadingWalFile(pathToGeneratedFile);

		// make sure content is the same for the read and written file
		expect(resultAfterRead).toEqual(resultAfterWrite);
	});
});

function testReadingWalFile(path: string): LogPersistentEntry[] {
	const walContentString = fs.readFileSync(path, "utf-8");

	const result = LogHandler.readLogInput(walContentString);
	expect(result).toHaveLength(2);

	// test grouping of transaction logs to interaction logs
	const segmentGeneratedPersistentEntries = result[0];
	const elementGeneratedPersistentEntries = result[1];

	expect(segmentGeneratedPersistentEntries.transactionLogPersistentEntries).toHaveLength(10);
	expect(elementGeneratedPersistentEntries.transactionLogPersistentEntries).toHaveLength(5);

	// Test the first segment entry
	expect(segmentGeneratedPersistentEntries.transactionLogPersistentEntries[0].entryType).toBe("segment");
	expect(segmentGeneratedPersistentEntries.transactionLogPersistentEntries[0].id).toBe("ID_segment");

	// Test reading of objectId and null values
	// ID_segment segment STRING_ARRAY NULL_VALUE ID_segment elementReferences
	// [ID_reference] NULL_VALUE SET
	expect(segmentGeneratedPersistentEntries.transactionLogPersistentEntries[0].propertyKey).toBe("elementReferences");
	expect(typeof segmentGeneratedPersistentEntries.transactionLogPersistentEntries[0].objectId).toBe("string");
	expect(segmentGeneratedPersistentEntries.transactionLogPersistentEntries[0].value).toBeNull();
	expect(segmentGeneratedPersistentEntries.transactionLogPersistentEntries[0].command).toBe("PUSH");

	// Test reading of string values
	// ID_segment segment NULL_VALUE STRING ID_reference refId NULL_VALUE ID_refID
	// SET
	expect(segmentGeneratedPersistentEntries.transactionLogPersistentEntries[1].propertyKey).toBe("refId");
	expect(typeof segmentGeneratedPersistentEntries.transactionLogPersistentEntries[1].value).toBe("string");
	expect(segmentGeneratedPersistentEntries.transactionLogPersistentEntries[1].value).toBe("ID_refID");
	expect(segmentGeneratedPersistentEntries.transactionLogPersistentEntries[1].command).toBe("SET");

	// Test reading of number values
	// ID_segment segment NULL_VALUE NUMBER ID_position x NULL_VALUE 580 SET
	expect(segmentGeneratedPersistentEntries.transactionLogPersistentEntries[6].propertyKey).toBe("x");
	expect(typeof segmentGeneratedPersistentEntries.transactionLogPersistentEntries[6].value).toBe("number");
	expect(segmentGeneratedPersistentEntries.transactionLogPersistentEntries[6].value).toBe(580);
	expect(segmentGeneratedPersistentEntries.transactionLogPersistentEntries[6].command).toBe("SET");

	// Test reading of boolean values
	// ID_segment segment NULL_VALUE BOOLEAN ID_position boolField NULL_VALUE false
	// SET
	expect(segmentGeneratedPersistentEntries.transactionLogPersistentEntries[7].propertyKey).toBe("boolField");
	expect(typeof segmentGeneratedPersistentEntries.transactionLogPersistentEntries[7].value).toBe("boolean");
	expect(segmentGeneratedPersistentEntries.transactionLogPersistentEntries[7].value).toBe(false);
	expect(segmentGeneratedPersistentEntries.transactionLogPersistentEntries[7].command).toBe("SET");

	// Test the first element entry
	//	ID_element	Text	NULL_VALUE	STRING	INTERACTION_0	ID_textElementProperties
	//	text	NULL_VALUE	<p><span style="">Lorem\tIpsum</span></p>	SET
	expect(elementGeneratedPersistentEntries.transactionLogPersistentEntries[0].entryType).toBe("Text");
	expect(elementGeneratedPersistentEntries.transactionLogPersistentEntries[0].id).toBe("ID_element");

	// Test reading of escaped tab in a string
	expect(elementGeneratedPersistentEntries.transactionLogPersistentEntries[2].value).toBe(STRING_WITH_TAB);

	// Test reading of escaped string with multiple strings to escape
	expect(elementGeneratedPersistentEntries.transactionLogPersistentEntries[3].value).toBe(UNESCAPED_STRING);

	return result;
}

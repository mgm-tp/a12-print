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
import fs from "node:fs/promises";

import type { PrintModel } from "@com.mgmtp.a12.print/print-model-api/model";
import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";

import { PrintModelCreator } from "../../a12internal/index.js";
import { PrintModelGarbageCollector, PrintModelMarshaller } from "../../index.js";
import testPartialPrintModel from "../../../../test/resources/print-models/Print-model-with-pending-changes.json" with { type: "json" };
import { LogHandler } from "../../a12internal/transaction-log/log-handler.js";
import { Log } from "../../a12internal/transaction-log/log.js";

const printModelMarshaller = new PrintModelMarshaller();

const content = await fs.readFile("src/test/resources/transaction-log/Print-model-with-pending-changes.wal", {
	encoding: "utf8",
});

const logEntries = LogHandler.readLogInput(content);

const deserializeResult = printModelMarshaller.deserialize(testPartialPrintModel);
const printModel = deserializeResult.result;

if (!printModel) {
	throw new Error("Cannot read test print model");
}
const { transactionLogStore } = Log.createStores(logEntries, printModel);
const testPrintModel = PrintModelCreator.createStoreModel(transactionLogStore);

describe("PrintModelGarbageCollector", () => {
	test("should clean print model", () => {
		const cleanedModel = PrintModelGarbageCollector.clean(testPrintModel as PrintModel);

		// cleaned model should have fewer or equal elements than the original
		expect(cleanedModel.content.elementDefinitions.length).toBeLessThanOrEqual(
			testPrintModel?.content?.elementDefinitions?.length || 0
		);

		// all segments in cleaned model must be referenced in general.structure
		for (const segment of cleanedModel.content.segments.definitions) {
			expect(cleanedModel.content.general.structure).toContain(segment.id);
		}

		// all sections in cleaned model must be referenced in general.sections
		if (cleanedModel.content.sections) {
			for (const section of cleanedModel.content.sections.definitions) {
				expect(cleanedModel.content.general.sections).toContain(section.id);
			}
		}

		// all watermarks in cleaned model must be referenced in general.watermarks
		if (cleanedModel.content.watermarks) {
			for (const watermark of cleanedModel.content.watermarks.definitions) {
				expect(cleanedModel.content.general.watermarks).toContain(watermark.id);
			}
		}

		// no segment elementReference should point to an Override element
		for (const segment of cleanedModel.content.segments.definitions) {
			for (const ref of segment.elementReferences || []) {
				const element = cleanedModel.content.elementDefinitions.find(el => el.id === ref.refId);
				if (element) {
					expect(element.type).not.toBe(ElementType.Override);
				}
			}
		}
	});

	test("should not clean print model when isClean is true", () => {
		const cleanedModel = PrintModelGarbageCollector.clean(testPrintModel as PrintModel, true);

		// with isClean=true, all Override elements should be preserved
		const originalOverrides =
			testPrintModel?.content?.elementDefinitions?.filter(el => el.type === ElementType.Override) || [];
		const cleanedOverrides = cleanedModel.content.elementDefinitions.filter(el => el.type === ElementType.Override);

		expect(cleanedOverrides.length).toBe(originalOverrides.length);

		// all original override IDs should still be present
		for (const override of originalOverrides) {
			expect(cleanedModel.content.elementDefinitions.find(el => el.id === override.id)).toBeDefined();
		}
	});
});

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
import { clonePrintModel } from "@com.mgmtp.a12.print/print-model-api/utils";
import { type PrintModel, SegmentReferencePurpose } from "@com.mgmtp.a12.print/print-model-api/model";

import { PrintModelMarshaller } from "../../../marshaller/model-marshaller.js";
import { sanitizeModel } from "../../../../../test/typescript/test-utils/print-model/sanitize-model-ids.js";
import { loadPrintModels } from "../../../../../test/typescript/test-utils/print-model/load-print-models.js";

const printModelMarshaller = new PrintModelMarshaller();

const printModels = loadPrintModels({ skipDirectories: ["model-migration"] }).filter(
	({ json }) =>
		!json.header.modelReferences?.some(reference => reference.purpose === SegmentReferencePurpose.DINTemplate)
);

describe.each(printModels)("clonePrintModel [$id] $path", ({ json }) => {
	let printModel: PrintModel;
	let expected: unknown;
	let copy: PrintModel;
	let copyOfCopy: PrintModel;

	it("reads the model without errors", () => {
		const deserializeResult = printModelMarshaller.deserialize(json);

		expect(deserializeResult.report.errorMap["@error"]).toEqual([]);
		expect(deserializeResult.report.noErrorOccurred).toBe(true);
		expect(deserializeResult.result).toBeDefined();
		printModel = deserializeResult.result!;
	});

	it("copies the model", () => {
		expected = sanitizeModel(printModel);
		copy = clonePrintModel(printModel);
		expect(sanitizeModel(copy)).toEqual(expected);
	});

	it("serializes the copy", () => {
		expectValidModel(copy);
	});

	it("copies the copy", () => {
		copyOfCopy = clonePrintModel(copy);
		expect(sanitizeModel(copyOfCopy)).toEqual(expected);
	});

	it("serializes the copy of the copy", () => {
		expectValidModel(copyOfCopy);
	});
});

function expectValidModel(printModel: PrintModel): void {
	const serializerReport = printModelMarshaller.serialize(printModel);
	expect(serializerReport.result).toBeDefined();

	expect(serializerReport.report.errorMap["@error"]).toEqual([]);
	expect(serializerReport.report.noErrorOccurred).toBe(true);
}

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
import { jest } from "@jest/globals";

import type { PartialPrintModel } from "@com.mgmtp.a12.print/print-model-api/model";
import { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/errors";
import { DocumentServiceFactory } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import testPartialPrintModelJson from "../../../../../../test/resources/print-models/Print-model-with-path-references.json" with { type: "json" };
import testDocumentModelJson from "../../../../../../test/resources/document-models/Person.json" with { type: "json" };
import { PrintModelMarshaller } from "../../../../marshaller/model-marshaller.js";
import { PrintModelCreator } from "../../../../a12internal/utils/print-model-creator.js";
import { Log } from "../../../../a12internal/transaction-log/index.js";

import { ReferencePathValidation } from "../reference-path-validation.js";
import { ReferencePathValidationService } from "../reference-path-validation-service.js";

const printModelMarshaller = new PrintModelMarshaller();

describe("validateDocumentModelReferences", () => {
	let testPrintModel: PartialPrintModel;
	const testDocumentModel = new DocumentServiceFactory()
		.getDocumentModelSerializer()
		.deserialize(JSON.stringify(testDocumentModelJson));

	beforeEach(async () => {
		const deserializeResult = printModelMarshaller.deserialize(testPartialPrintModelJson);
		const printModel = deserializeResult.result;
		if (!printModel) {
			throw new Error("Cannot read test print model");
		}
		const { transactionLogStore } = Log.createStores([], printModel);
		testPrintModel = PrintModelCreator.createStoreModel(transactionLogStore);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("should have no errors in all paths", async () => {
		const errorpMap = ReferencePathValidation.validateDocumentModelReferences(testPrintModel, [testDocumentModel]);
		expect(DeepPartialErrorMap.getReadableErrorMap(errorpMap)).toMatchSnapshot();
	});

	it("should have errors in all paths", async () => {
		jest.spyOn(ReferencePathValidationService, "createFactory")
			.mockClear()
			.mockReturnValue(() => ({
				isValidDocumentModelPath: () => false,
				isValidSyntheticPath: () => false,
				isValidEmptyPath: () => false,
				getRelevantDocumentModels: () => ["Person"],
				isPathRepeatable: () => false,
				isPathInListing: () => false,
			}));
		const errorpMap = ReferencePathValidation.validateDocumentModelReferences(testPrintModel, [testDocumentModel]);
		expect(DeepPartialErrorMap.getReadableErrorMap(errorpMap)).toMatchSnapshot();
	});
});

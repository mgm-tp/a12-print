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
import {
	createTestPrintModel,
	createTestPrintModelWithLog,
} from "../../../../../../test/typescript/test-utils/setup-test-model.js";

import { ReferencePathValidation } from "../reference-path-validation.js";
import { ReferencePathValidationService } from "../reference-path-validation-service.js";
import { getAllReferencedLocations } from "../partial-print-model-visitor-reference-collector.js";

import fragmentDocumentModelJson from "./__testdata__/ExampleDM.json" with { type: "json" };
import fragmentPrintModelJson from "./__testdata__/printFragment.json" with { type: "json" };

describe("validateDocumentModelReferences", () => {
	let testPrintModel: PartialPrintModel;
	const testDocumentModel = new DocumentServiceFactory()
		.getDocumentModelSerializer()
		.deserialize(JSON.stringify(testDocumentModelJson));

	beforeEach(async () => {
		testPrintModel = createTestPrintModelWithLog(testPartialPrintModelJson);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("should have no errors in all paths", async () => {
		const result = getAllReferencedLocations(testPrintModel);
		const errorpMap = ReferencePathValidation.validateDocumentModelReferences(
			testPrintModel,
			[testDocumentModel],
			result.collectedPaths
		);
		expect(DeepPartialErrorMap.getReadableErrorMap(errorpMap)).toMatchSnapshot();
	});

	it("should have errors in all paths", async () => {
		const result = getAllReferencedLocations(testPrintModel);
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
		const errorpMap = ReferencePathValidation.validateDocumentModelReferences(
			testPrintModel,
			[testDocumentModel],
			result.collectedPaths
		);
		expect(DeepPartialErrorMap.getReadableErrorMap(errorpMap)).toMatchSnapshot();
	});

	it("should have errors in the element fragments of a fragment model without its document model", async () => {
		const fragmentModel = createTestPrintModel(fragmentPrintModelJson);
		const result = getAllReferencedLocations(fragmentModel);
		const errorMap = ReferencePathValidation.validateDocumentModelReferences(
			fragmentModel,
			[],
			result.collectedPaths
		);
		expect(DeepPartialErrorMap.getReadableErrorMap(errorMap)).toMatchSnapshot();
	});

	it("should have no errors in the element fragments of a fragment model with its document model", async () => {
		const fragmentModel = createTestPrintModel(fragmentPrintModelJson);
		const result = getAllReferencedLocations(fragmentModel);
		const errorMap = ReferencePathValidation.validateDocumentModelReferences(
			fragmentModel,
			[deserializeDocumentModel(fragmentDocumentModelJson)],
			result.collectedPaths
		);
		expect(DeepPartialErrorMap.getReadableErrorMap(errorMap)).toMatchSnapshot();
	});

	it.each([
		[
			"renamed",
			(fields: { name: string }[], index: number) => {
				fields[index].name = "renamedStringField";
			},
		],
		[
			"deleted",
			(fields: { name: string }[], index: number) => {
				fields.splice(index, 1);
			},
		],
	])(
		"should have errors in the element fragments of a fragment model for a path %s in its document model",
		async (_, changeField) => {
			const fragmentModel = createTestPrintModel(fragmentPrintModelJson);
			const documentModelJson = structuredClone(fragmentDocumentModelJson);
			const repeatableFields = documentModelJson.content.modelRoot.rootGroups[0].Group.elements.find(
				element => element.name === "repeatable"
			)!.Group!.elements;
			changeField(
				repeatableFields,
				repeatableFields.findIndex(field => field.name === "stringField")
			);

			const result = getAllReferencedLocations(fragmentModel);
			const errorMap = ReferencePathValidation.validateDocumentModelReferences(
				fragmentModel,
				[deserializeDocumentModel(documentModelJson)],
				result.collectedPaths
			);
			expect(DeepPartialErrorMap.getReadableErrorMap(errorMap)).toMatchSnapshot();
		}
	);
});

function deserializeDocumentModel(documentModelJson: unknown) {
	return new DocumentServiceFactory().getDocumentModelSerializer().deserialize(JSON.stringify(documentModelJson));
}

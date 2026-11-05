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
import { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/errors";

import {
	createTestPrintModel,
	createTestPrintModelWithLog,
} from "../../../../../../test/typescript/test-utils/setup-test-model.js";

import { FragmentDocumentModelValidation } from "../fragment-document-model-validation.js";

import testFragmentPrintModelJson from "./__testdata__/printFragment.json" with { type: "json" };
import testPrintModelJson from "./__testdata__/useFragment.json" with { type: "json" };

type ModelJson = {
	header: { id: string; modelReferences: { modelType: string; reference: string; purpose: string }[] };
};

/** The given model with its document model references replaced by the given ones. */
function withDocumentModels<T>(modelJson: T, documentModels: string[]): ModelJson & T {
	const json = structuredClone(modelJson) as ModelJson & T;
	json.header.modelReferences = [
		...json.header.modelReferences.filter(modelReference => modelReference.modelType !== "document"),
		...documentModels.map(reference => ({ modelType: "document", reference, purpose: "data binding" })),
	];
	return json;
}

function createFragmentModel(json: ModelJson) {
	return createTestPrintModel(json as unknown as Parameters<typeof createTestPrintModel>[0]);
}

describe("validateDocumentModelCompatibility", () => {
	function validate(printModelDocumentModels: string[], fragmentModelDocumentModels: string[]) {
		const printModel = createTestPrintModelWithLog(
			withDocumentModels(testPrintModelJson, printModelDocumentModels)
		);
		const fragmentModel = createFragmentModel(
			withDocumentModels(testFragmentPrintModelJson, fragmentModelDocumentModels)
		);
		return DeepPartialErrorMap.getReadableErrorMap(
			FragmentDocumentModelValidation.validateDocumentModelCompatibility(printModel, [fragmentModel])
		);
	}

	it.each([
		["both use the same document model", ["ExampleDM"], ["ExampleDM"]],
		["neither uses a document model", [], []],
		["only the print model uses a document model", ["ExampleDM"], []],
	])("accepts the fragment model if %s", (_case, printModelDocumentModels, fragmentModelDocumentModels) => {
		expect(validate(printModelDocumentModels, fragmentModelDocumentModels)).toEqual({});
	});

	it.each([
		["they use different document models", ["ExampleDM"], ["OtherDM"]],
		["only the fragment model uses a document model", [], ["ExampleDM"]],
		["the print model uses more than one document model", ["ExampleDM", "OtherDM"], ["ExampleDM"]],
	])("reports the fragment model reference if %s", (_case, printModelDocumentModels, fragmentModelDocumentModels) => {
		expect(validate(printModelDocumentModels, fragmentModelDocumentModels)).toMatchSnapshot();
	});

	it("ignores a fragment model the print model does not reference", () => {
		const printModel = createTestPrintModelWithLog(testPrintModelJson);
		const otherFragmentModelJson = withDocumentModels(testFragmentPrintModelJson, ["OtherDM"]);
		otherFragmentModelJson.header.id = "otherFragment";
		const errorMap = FragmentDocumentModelValidation.validateDocumentModelCompatibility(printModel, [
			createFragmentModel(otherFragmentModelJson),
		]);
		expect(DeepPartialErrorMap.getReadableErrorMap(errorMap)).toEqual({});
	});
});

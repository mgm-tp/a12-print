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

import type { PartialPrintModel, PrintModel } from "@com.mgmtp.a12.print/print-model-api/model";
import { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/errors";

import {
	createTestPrintModel,
	createTestPrintModelWithLog,
} from "../../../../../../test/typescript/test-utils/setup-test-model.js";

import { getAllReferencedLocations } from "../partial-print-model-visitor-reference-collector.js";
import { ReferenceFragmentValidation } from "../reference-fragment-validation.js";

import testFragmentPrintModelJson from "./__testdata__/printFragment.json" with { type: "json" };
import testPrintModelJson from "./__testdata__/useFragment.json" with { type: "json" };

describe("validateDocumentModelReferences", () => {
	let testPrintModel: PartialPrintModel;
	let fragmentPrintModel: PrintModel;

	beforeEach(async () => {
		testPrintModel = createTestPrintModelWithLog(testPrintModelJson);
		fragmentPrintModel = createTestPrintModel(testFragmentPrintModelJson);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("should have errors in all paths", async () => {
		const result = getAllReferencedLocations(testPrintModel);
		const errorMap = ReferenceFragmentValidation.validateFragmentReferences(result);
		expect(DeepPartialErrorMap.getReadableErrorMap(errorMap)).toMatchSnapshot();

		const result2 = getAllReferencedLocations(testPrintModel, []);
		const errorMap2 = ReferenceFragmentValidation.validateFragmentReferences(result2);
		expect(errorMap).toMatchObject(errorMap2);
		expect(errorMap2).toMatchObject(errorMap);
	});

	it("should have no errors in all paths 2", async () => {
		const result = getAllReferencedLocations(testPrintModel, [fragmentPrintModel]);
		const errorpMap = ReferenceFragmentValidation.validateFragmentReferences(result, [fragmentPrintModel]);
		expect(DeepPartialErrorMap.getReadableErrorMap(errorpMap)).toMatchSnapshot();
	});
});

/** Only what is needed to take single definitions out of the fragment model again. */
interface FragmentModelJson {
	content: {
		elementDefinitions: { id: string }[];
		segments?: { definitions?: { id: string }[] };
		sections?: { definitions?: { id: string }[] };
		watermarks?: { definitions?: { id: string }[] };
		textStyles?: { definitions?: { id: string }[] };
	};
}

const CONTAINER_KEYS = ["segments", "sections", "watermarks", "textStyles"] as const;

/** The fragment model as if the given elements or container definitions had been deleted there. */
function fragmentModelWithout(removedId: string): PrintModel {
	const json: FragmentModelJson = structuredClone(testFragmentPrintModelJson);
	const { content } = json;
	content.elementDefinitions = content.elementDefinitions.filter(element => element.id !== removedId);
	for (const key of CONTAINER_KEYS) {
		const container = content[key];
		if (container?.definitions) {
			container.definitions = container.definitions.filter(definition => definition.id !== removedId);
		}
	}
	return createTestPrintModel(json as unknown as Parameters<typeof createTestPrintModel>[0]);
}

describe("validateFragmentReferences with something deleted in the fragment model", () => {
	let testPrintModel: PartialPrintModel;

	beforeEach(() => {
		testPrintModel = createTestPrintModelWithLog(testPrintModelJson);
	});

	/*
	 * Everything unresolvable inside a referenced fragment entity is reported at the reference that pulls it in, and
	 * everything inside a placed fragment element at that placement - neither has a definition in this print model.
	 */
	it.each([
		["an element placed in a referenced fragment segment", "OxZLfKLrTeMRE9t6JB2ry"],
		["an element placed in a referenced fragment section", "91FxDmC2cR7w7ErYPhJDL"],
		["an element placed in a referenced fragment watermark", "Pd2WIw6XtliFEKDaEbvUn"],
		["a referenced fragment segment itself", "IbAJW7rFCbe1-cFdmKvoW"],
		["a referenced fragment section itself", "MK9xwezDmDvpRJKPNgh_c"],
		["a referenced fragment watermark itself", "Y-0d5mSisS5KR6E5A307L"],
		["a referenced fragment text style itself", "AbpttoBg_E-qcIMw6thXH"],
		["an element placed in a fragment area", "ixlm-snVMgQYQElzCYsbX"],
		["an element used by a case of a fragment switch", "5Z-xc5WkcVCZYaWrUJDQk"],
		["an element placed in a fragment bounding box", "N71BAGKspBy8GwPMMvzyp"],
		["a fragment element placed in a local area", "STkFV2hpwaVKMKQfFlwN2"],
	])("reports %s as unresolvable", (_case, removedId) => {
		const fragmentModel = fragmentModelWithout(removedId);
		const result = getAllReferencedLocations(testPrintModel, [fragmentModel]);
		const errorMap = ReferenceFragmentValidation.validateFragmentReferences(result, [fragmentModel]);
		expect(DeepPartialErrorMap.getReadableErrorMap(errorMap)).toMatchSnapshot();
	});
});

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
import type { PartialPrintModel, PrintModel } from "@com.mgmtp.a12.print/print-model-api/model";
import { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/errors";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import {
	createTestPrintModel as createFragmentPrintModel,
	createTestPrintModelWithLog,
} from "../../../../../../test/typescript/test-utils/setup-test-model.js";
import plainPrintModelJson from "../../../../../../test/resources/print-models/PrintModel-with-text.json" with { type: "json" };

import { ReferenceDeclarationValidation } from "../reference-declaration-validation.js";
import { getAllReferencedLocations } from "../partial-print-model-visitor-reference-collector.js";

import testPrintModelJson from "./__testdata__/useFragment.json" with { type: "json" };
import testFragmentPrintModelJson from "./__testdata__/printFragment.json" with { type: "json" };

function documentModelWithId(id: string): DocumentModel {
	return { header: { id } } as DocumentModel;
}

function fragmentModelWithId(id: string): PrintModel {
	return { header: { id } } as PrintModel;
}

/** `useFragment.json`, which declares an unused Document and Fragment Model Reference, plus the given references. */
function createTestPrintModel(...addedReferences: ReadonlyArray<Record<string, string>>): PartialPrintModel {
	const json = structuredClone(testPrintModelJson) as typeof testPrintModelJson & {
		header: { modelReferences: unknown[] };
	};
	json.header.modelReferences.push(...addedReferences);
	return createTestPrintModelWithLog(json);
}

function createPlainTestPrintModel(...addedReferences: ReadonlyArray<Record<string, string>>): PartialPrintModel {
	const json = structuredClone(plainPrintModelJson) as typeof plainPrintModelJson & {
		header: { modelReferences: unknown[] };
	};
	json.header.modelReferences.push(...addedReferences);
	return createTestPrintModelWithLog(json);
}

describe("validateModelReferenceDeclarations", () => {
	let testPrintModel: PartialPrintModel;

	beforeEach(() => {
		testPrintModel = createTestPrintModel();
	});

	it("reports no errors when both referenced models exist", () => {
		const errorMap = ReferenceDeclarationValidation.validateModelReferenceDeclarations(testPrintModel, {
			documentModels: [documentModelWithId("ExampleDM")],
			fragmentModels: [fragmentModelWithId("printFragment")],
		});
		expect(DeepPartialErrorMap.getReadableErrorMap(errorMap)).toEqual({});
	});

	it("reports no errors when the models of a reference kind are not yet known", () => {
		const errorMap = ReferenceDeclarationValidation.validateModelReferenceDeclarations(testPrintModel);
		expect(DeepPartialErrorMap.getReadableErrorMap(errorMap)).toEqual({});
	});

	it("reports the Document Model reference as broken when it is missing from the workspace", () => {
		const errorMap = ReferenceDeclarationValidation.validateModelReferenceDeclarations(testPrintModel, {
			documentModels: [],
			fragmentModels: [fragmentModelWithId("printFragment")],
		});
		expect(DeepPartialErrorMap.getReadableErrorMap(errorMap)).toMatchSnapshot();
	});

	it("reports the Fragment Model reference as broken when it is missing from the workspace", () => {
		const errorMap = ReferenceDeclarationValidation.validateModelReferenceDeclarations(testPrintModel, {
			documentModels: [documentModelWithId("ExampleDM")],
			fragmentModels: [],
		});
		expect(DeepPartialErrorMap.getReadableErrorMap(errorMap)).toMatchSnapshot();
	});

	it("reports both references as broken when neither model exists in the workspace", () => {
		const errorMap = ReferenceDeclarationValidation.validateModelReferenceDeclarations(testPrintModel, {
			documentModels: [],
			fragmentModels: [],
		});
		expect(DeepPartialErrorMap.getReadableErrorMap(errorMap)).toMatchSnapshot();
	});
});

// The kinds no reference resolves into, and which are therefore validated against a plain list of ids.
describe.each([
	[
		"Typesetting Model",
		{ modelType: "typesetting", purpose: "data binding" },
		(ids: string[]) => ({ typesettingModelIds: ids }),
	],
	["Print Model", { modelType: "print", purpose: "DINTemplate" }, (ids: string[]) => ({ printModelIds: ids })],
] as const)("validateModelReferenceDeclarations - %s References", (_kind, declaration, catalogsWith) => {
	const REFERENCE = "ReferencedModel";
	const testPrintModel = () => createPlainTestPrintModel({ ...declaration, reference: REFERENCE });

	it("reports no errors when the referenced model exists", () => {
		const errorMap = ReferenceDeclarationValidation.validateModelReferenceDeclarations(
			testPrintModel(),
			catalogsWith([REFERENCE])
		);
		expect(DeepPartialErrorMap.getReadableErrorMap(errorMap)).toEqual({});
	});

	it("reports no errors while the ids are not yet known", () => {
		const errorMap = ReferenceDeclarationValidation.validateModelReferenceDeclarations(testPrintModel());
		expect(DeepPartialErrorMap.getReadableErrorMap(errorMap)).toEqual({});
	});

	it("reports the reference as broken when the model is missing from the workspace", () => {
		const errorMap = ReferenceDeclarationValidation.validateModelReferenceDeclarations(
			testPrintModel(),
			catalogsWith([])
		);
		expect(DeepPartialErrorMap.getReadableErrorMap(errorMap)).toMatchSnapshot();
	});
});

/*
 * A text style names its Typesetting Model instead of referencing it, and one of a fragment model names it without the
 * print model referencing that Typesetting Model at all - so both are only reachable through the text style.
 */
describe("validateTypesettingUsages", () => {
	const FRAGMENT_TYPESETTING = "Typesetting_for_fragment";
	const LOCAL_TYPESETTING = "Typesetting_for_local";

	/** `useFragment.json` references the fragment text style that names `Typesetting_for_fragment`. */
	function usagesOfFragmentTextStyle() {
		const printModel = createTestPrintModelWithLog(testPrintModelJson);
		const fragmentModel = createFragmentPrintModel(testFragmentPrintModelJson);
		return getAllReferencedLocations(printModel, [fragmentModel]).typesettingUsages;
	}

	function usagesOfLocalTextStyle() {
		const json = structuredClone(testPrintModelJson) as typeof testPrintModelJson & {
			content: { textStyles: { definitions: { typesettingModelName?: string }[] } };
		};
		json.content.textStyles.definitions[0].typesettingModelName = LOCAL_TYPESETTING;
		return getAllReferencedLocations(createTestPrintModelWithLog(json)).typesettingUsages;
	}

	it("collects the Typesetting Model of a fragment text style once", () => {
		const usages = usagesOfFragmentTextStyle().filter(usage => usage.typesettingModelName === FRAGMENT_TYPESETTING);
		expect(usages).toHaveLength(1);
	});

	it("warns about the Typesetting Model of a fragment text style that is missing from the workspace", () => {
		const errorMap = ReferenceDeclarationValidation.validateTypesettingUsages(usagesOfFragmentTextStyle(), []);
		expect(DeepPartialErrorMap.getReadableErrorMap(errorMap)).toMatchSnapshot();
	});

	it("warns about the Typesetting Model of a local text style that is missing from the workspace", () => {
		const errorMap = ReferenceDeclarationValidation.validateTypesettingUsages(usagesOfLocalTextStyle(), []);
		expect(DeepPartialErrorMap.getReadableErrorMap(errorMap)).toMatchSnapshot();
	});

	it("reports no warning when the Typesetting Model exists", () => {
		const errorMap = ReferenceDeclarationValidation.validateTypesettingUsages(usagesOfFragmentTextStyle(), [
			FRAGMENT_TYPESETTING,
		]);
		expect(DeepPartialErrorMap.getReadableErrorMap(errorMap)).toEqual({});
	});

	it("reports no warning while the ids are not yet known", () => {
		const errorMap = ReferenceDeclarationValidation.validateTypesettingUsages(usagesOfFragmentTextStyle());
		expect(DeepPartialErrorMap.getReadableErrorMap(errorMap)).toEqual({});
	});
});

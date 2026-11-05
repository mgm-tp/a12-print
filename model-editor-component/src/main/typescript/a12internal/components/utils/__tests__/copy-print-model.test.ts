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
import type { Header, Model, ModelReference } from "@com.mgmtp.a12.base/base-model-api";
import { PrintModelMarshaller } from "@com.mgmtp.a12.print/print-model-api-utils/marshaller";
import type { PrintModelDTO } from "@com.mgmtp.a12.print/print-model-api/generated/a12internal";

import { createPrintModel } from "../create-print-model.js";
import { canCopyAsFragmentModel, copyAsFragmentModel } from "../copy-print-model.js";

const marshaller = new PrintModelMarshaller();

const asModel = (printModel: PrintModelDTO): Model => printModel as unknown as Model;

const header = (...modelReferences: ModelReference[]): Header =>
	({
		id: "MyPrintModel",
		modelType: "print",
		modelVersion: "4.1.0",
		modelReferences,
	}) as Header;

const documentReference = (reference: string): ModelReference => ({
	modelType: "document",
	purpose: "data binding",
	reference,
});

describe("copyAsFragmentModel", () => {
	const sourceModel = () => asModel(createPrintModel("MyPrintModel", [{ roleName: "admin" }]));

	it("should use the given name as the id of the copy", () => {
		const fragmentModel = copyAsFragmentModel(sourceModel(), "MyFragment");

		expect(fragmentModel.header.id).toBe("MyFragment");
	});

	it("should annotate the copy as a fragment model without dropping existing annotations", () => {
		const fragmentModel = copyAsFragmentModel(sourceModel(), "MyFragment");

		expect(fragmentModel.header.annotations).toEqual([
			expect.objectContaining({ name: "roles", value: "admin" }),
			expect.objectContaining({ name: "modelSubType", value: "fragment" }),
		]);
	});

	it("should clear the metadata computations of the copy", () => {
		const fragmentModel = copyAsFragmentModel(sourceModel(), "MyFragment");
		const metadata = (fragmentModel as unknown as PrintModelDTO).content.general?.metadata;

		expect(metadata).toEqual(
			expect.objectContaining({
				titleComputation: [],
				descriptionComputation: [],
				languageComputation: [],
				authorComputation: [],
			})
		);
	});

	it("should leave the source model untouched", () => {
		const source = sourceModel();
		const sourceCopy = JSON.parse(JSON.stringify(source));

		copyAsFragmentModel(source, "MyFragment");

		expect(source).toEqual(sourceCopy);
	});

	it("should produce a model that can be deserialized without errors", () => {
		const fragmentModel = copyAsFragmentModel(sourceModel(), "MyFragment");

		const { result, report } = marshaller.deserialize(fragmentModel as unknown as PrintModelDTO, { html: false });

		expect(report.noErrorOccurred).toBe(true);
		expect(result).toBeDefined();
	});

	it("should throw the blocker error code when the source cannot become a fragment model", () => {
		const fragmentModel = copyAsFragmentModel(sourceModel(), "MyFragment");

		expect(() => copyAsFragmentModel(fragmentModel, "MyOtherFragment")).toThrow("FORBID_COPY_FRAGMENT_MODEL");
	});

	it("should throw when the model cannot be deserialized", () => {
		const brokenModel = { header: { id: "Broken", modelType: "print" } } as unknown as Model;

		expect(() => copyAsFragmentModel(brokenModel, "MyFragment")).toThrow("Model Broken cannot be deserialized");
	});
});

describe("canCopyAsFragmentModel", () => {
	it("should allow copying a model without model references", () => {
		expect(canCopyAsFragmentModel({ id: "MyPrintModel", modelType: "print" } as Header)).toBe(true);
		expect(canCopyAsFragmentModel(header())).toBe(true);
	});

	it("should allow copying a model with a single document model reference", () => {
		expect(canCopyAsFragmentModel(header(documentReference("DomainText")))).toBe(true);
	});

	it("should reject a model that is already a fragment model", () => {
		const fragmentHeader = {
			...header(),
			annotations: [{ name: "modelSubType", value: "fragment" }],
		} as Header;

		expect(canCopyAsFragmentModel(fragmentHeader)).toBe(false);
	});

	it("should reject a model that already references a fragment model", () => {
		const fragmentReference: ModelReference = {
			modelType: "print",
			purpose: "print-fragment",
			reference: "MyFragment",
		};

		expect(canCopyAsFragmentModel(header(fragmentReference))).toBe(false);
	});

	it("should reject a model that references a DIN template", () => {
		const dinReference: ModelReference = {
			modelType: "print",
			purpose: "DINTemplate",
			reference: "DinA4",
		};

		expect(canCopyAsFragmentModel(header(dinReference))).toBe(false);
	});

	it("should reject a model with a print model reference that is not a DIN template", () => {
		const printReference: ModelReference = {
			modelType: "print",
			purpose: "some-other-purpose",
			reference: "AnotherPrintModel",
		};

		expect(canCopyAsFragmentModel(header(printReference))).toBe(false);
	});

	it("should reject a model with more than one document model reference", () => {
		expect(canCopyAsFragmentModel(header(documentReference("DomainA"), documentReference("DomainB")))).toBe(false);
	});

	it("should not count non document model references towards the document model limit", () => {
		const typesettingReference: ModelReference = {
			modelType: "typesetting",
			purpose: "typesetting",
			reference: "MyTypesetting",
		};

		expect(canCopyAsFragmentModel(header(documentReference("DomainText"), typesettingReference))).toBe(true);
	});
});

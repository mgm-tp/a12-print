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
import cloneDeep from "lodash/cloneDeep.js";

import type { PrintError } from "@com.mgmtp.a12.print/print-model-api/errors";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";
import type { PrintModelDTO } from "@com.mgmtp.a12.print/print-model-api/generated/a12internal";

import printFragmentDTO from "../../../../test/resources/print-models/printFragment.json" with { type: "json" };
import printModelDTO from "../../../../test/resources/print-models/PrintModel-with-text.json" with { type: "json" };

import { PrintModelMarshaller } from "../model-marshaller.js";

const NO_PRINT_MODEL_REFERENCE = "Error rule_c3e71";
const ONLY_ONE_DOCUMENT_MODEL = "Error rule_9d4b2";

const marshaller = new PrintModelMarshaller();

interface ModelReference {
	modelType: string;
	reference: string;
	purpose?: string;
}

function withModelReferences(dto: object, modelReferences: ModelReference[]): PrintModelDTO {
	const copy = cloneDeep(dto) as { header: { modelReferences: ModelReference[] } };
	copy.header.modelReferences = modelReferences;
	return copy as unknown as PrintModelDTO;
}

function errorsWithCode(dto: PrintModelDTO, errorCode: string): PrintError[] {
	const { report } = marshaller.deserialize(dto);
	return report.errorMap[ErrorSeverity.ERROR].filter(error => error.errorCode === errorCode);
}

function toPathString(error: PrintError) {
	return error.jsonPath.map(entry => `${entry.elementName}[${entry.index}]`).join("/");
}

const documentModel: ModelReference = { modelType: "document", reference: "ExampleDM", purpose: "data binding" };
const otherDocumentModel: ModelReference = { modelType: "document", reference: "OtherDM", purpose: "data binding" };
const typesettingModel: ModelReference = {
	modelType: "typesetting",
	reference: "Typesetting",
	purpose: "data binding",
};
const fragmentModel: ModelReference = { modelType: "print", reference: "OtherFragment", purpose: "print-fragment" };
const selfReference: ModelReference = { modelType: "print", reference: "printFragment", purpose: "print-fragment" };

describe("model references of a fragment model", () => {
	it("accepts one document model and other non print model references", () => {
		const dto = withModelReferences(printFragmentDTO, [documentModel, typesettingModel]);

		expect(errorsWithCode(dto, NO_PRINT_MODEL_REFERENCE)).toEqual([]);
		expect(errorsWithCode(dto, ONLY_ONE_DOCUMENT_MODEL)).toEqual([]);
	});

	it("rejects a reference to another fragment model at that reference", () => {
		const dto = withModelReferences(printFragmentDTO, [documentModel, fragmentModel]);

		const errors = errorsWithCode(dto, NO_PRINT_MODEL_REFERENCE);

		expect(errors.map(toPathString)).toEqual(["header[1]/modelReferences[2]/modelType[1]"]);
	});

	it("rejects a reference to itself", () => {
		const dto = withModelReferences(printFragmentDTO, [selfReference]);

		expect(errorsWithCode(dto, NO_PRINT_MODEL_REFERENCE)).toHaveLength(1);
	});

	it("rejects a reference to a print model", () => {
		const dto = withModelReferences(printFragmentDTO, [{ modelType: "print", reference: "SomePrintModel" }]);

		expect(errorsWithCode(dto, NO_PRINT_MODEL_REFERENCE)).toHaveLength(1);
	});

	it("rejects more than one document model", () => {
		const dto = withModelReferences(printFragmentDTO, [documentModel, otherDocumentModel]);

		expect(errorsWithCode(dto, ONLY_ONE_DOCUMENT_MODEL).length).toBeGreaterThan(0);
	});
});

describe("model references of a print model", () => {
	it("accepts fragment model references and several document models", () => {
		const dto = withModelReferences(printModelDTO, [documentModel, otherDocumentModel, fragmentModel]);

		expect(errorsWithCode(dto, NO_PRINT_MODEL_REFERENCE)).toEqual([]);
		expect(errorsWithCode(dto, ONLY_ONE_DOCUMENT_MODEL)).toEqual([]);
	});
});

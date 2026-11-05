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

import validPrintModelDTO from "../../../../test/resources/print-models/PrintModel-with-text.json" with { type: "json" };

import { PrintModelMarshaller } from "../model-marshaller.js";

const marshaller = new PrintModelMarshaller();

describe("modelSubType deserialization via header deserializer", () => {
	it("surfaces modelSubType from annotations as a top-level header field", () => {
		const dto = cloneDeep(validPrintModelDTO) as Record<string, unknown>;
		const header = dto.header as Record<string, unknown>;
		header.annotations = [{ name: "modelSubType", value: "fragment" }];

		const result = marshaller.deserialize(dto);

		expect(result.result).toBeDefined();
		expect(result.result?.header.modelSubType).toBe("fragment");
	});

	it("returns undefined modelSubType for a model with no modelSubType annotation", () => {
		const dto = cloneDeep(validPrintModelDTO) as Record<string, unknown>;
		const header = dto.header as Record<string, unknown>;
		header.annotations = [];

		const result = marshaller.deserialize(dto);

		expect(result.result).toBeDefined();
		expect(result.result?.header.modelSubType).toBeUndefined();
	});

	it("returns undefined modelSubType when annotations are absent", () => {
		const dto = cloneDeep(validPrintModelDTO) as Record<string, unknown>;
		const header = dto.header as Record<string, unknown>;
		delete header.annotations;

		const result = marshaller.deserialize(dto);

		expect(result.result).toBeDefined();
		expect(result.result?.header.modelSubType).toBeUndefined();
	});

	it("still preserves the annotation in the annotations array alongside the top-level field", () => {
		const dto = cloneDeep(validPrintModelDTO) as Record<string, unknown>;
		const header = dto.header as Record<string, unknown>;
		header.annotations = [{ name: "modelSubType", value: "fragment" }];

		const result = marshaller.deserialize(dto);

		expect(result.result?.header.modelSubType).toBe("fragment");
		expect(result.result?.header.annotations).toEqual(
			expect.arrayContaining([expect.objectContaining({ name: "modelSubType", value: "fragment" })])
		);
	});
});

function deserializeWithThrow(model: Record<string, unknown>) {
	const result = marshaller.deserialize(model);
	if (!result.result) {
		throw new Error(`deserialize failed`);
	}
	return result.result;
}

describe("modelSubType serialization via model serializer", () => {
	it("writes modelSubType as an annotation when set on the header", () => {
		const dto = cloneDeep(validPrintModelDTO) as Record<string, unknown>;
		const model = deserializeWithThrow(dto);

		(model.header as unknown as Record<string, unknown>).modelSubType = "fragment";

		const serialized = marshaller.serialize(model);

		expect(serialized.result).toBeDefined();
		expect(serialized.result?.header.annotations).toEqual(
			expect.arrayContaining([expect.objectContaining({ name: "modelSubType", value: "fragment" })])
		);
	});

	it("does not write a modelSubType annotation when modelSubType is not set", () => {
		const dto = cloneDeep(validPrintModelDTO) as Record<string, unknown>;
		const model = deserializeWithThrow(dto);

		const serialized = marshaller.serialize(model);

		expect(serialized.result).toBeDefined();
		expect(serialized.result?.header.annotations?.some(a => a.name === "modelSubType")).toBe(false);
	});

	it("does not duplicate the modelSubType annotation on round-trip", () => {
		const dto = cloneDeep(validPrintModelDTO) as Record<string, unknown>;
		const header = dto.header as Record<string, unknown>;
		header.annotations = [...(header.annotations as unknown[]), { name: "modelSubType", value: "fragment" }];

		const model = deserializeWithThrow(dto);
		const serialized = marshaller.serialize(model);

		expect(serialized.result).toBeDefined();
		const subtypeAnnotations = serialized.result?.header.annotations?.filter(a => a.name === "modelSubType");
		expect(subtypeAnnotations).toHaveLength(1);
		expect(subtypeAnnotations?.[0]?.value).toBe("fragment");
	});
});

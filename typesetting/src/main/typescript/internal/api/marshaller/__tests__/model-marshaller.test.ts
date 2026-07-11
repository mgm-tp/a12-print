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

import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";

import modelValid from "../../../../../resources/patterns/models/Domain_de-1996.json" with { type: "json" };
import { TypesettingModelMarshaller } from "../../../../a12internal/api/marshaller/model-marshaller.js";

describe("TypesettingModelMarshaller Test", () => {
	const marshaller = new TypesettingModelMarshaller();

	it("success marshaller test", () => {
		const input = JSON.stringify(modelValid);
		const deserializerResult = marshaller.deserialize(input);

		expect(deserializerResult.result).toBeDefined();
		expect(deserializerResult.report.noErrorOccurred).toBe(true);

		if (deserializerResult.result) {
			const serializerResult = marshaller.serialize(deserializerResult.result);
			expect(serializerResult.result).toBeDefined();
			expect(serializerResult.report.noErrorOccurred).toBe(true);
		}
	});

	it("fail deserializer test: additional property in header", () => {
		const modifiedDTO = {
			header: { ...modelValid.header, newOptionalProperty: "test" },
			content: modelValid.content,
		};
		const result = marshaller.deserialize(modifiedDTO);
		expect(result.result).toBeFalsy();
		expect(result.report.noErrorOccurred).toBe(false);
		expect(Object.keys(result.report.errorMap).length).toBeGreaterThan(0);
		expect(result.report.errorMap[ErrorSeverity.ERROR]).toBeDefined();
		expect(result.report.errorMap[ErrorSeverity.ERROR].length).toBeGreaterThan(0);
		expect(result.report.errorMap[ErrorSeverity.ERROR][0].errorCode).toBe(
			"could not resolve header.newOptionalProperty in the DocumentModel"
		);
	});

	it("fail deserializer test: additional property in content", () => {
		const modifiedDTO = {
			header: modelValid.header,
			content: { ...modelValid.content, unknownField: "invalid" },
		};
		const result = marshaller.deserialize(modifiedDTO);
		expect(result.result).toBeFalsy();
		expect(result.report.noErrorOccurred).toBe(false);
		expect(result.report.errorMap[ErrorSeverity.ERROR]).toBeDefined();
		expect(result.report.errorMap[ErrorSeverity.ERROR].length).toBeGreaterThan(0);
		expect(result.report.errorMap[ErrorSeverity.ERROR][0].errorCode).toBe(
			"could not resolve content.unknownField in the DocumentModel"
		);
	});

	it("fail deserializer test: invalid hyphenmins value", () => {
		const invalidTypesettingModelDTO = cloneDeep(modelValid);
		invalidTypesettingModelDTO.content.internal.hyphenation.general.hyphenmins.typesetting.left =
			"INVALID_VALUE" as never;

		const result = marshaller.deserialize(invalidTypesettingModelDTO);
		expect(result.result).toBeFalsy();
		expect(result.report.noErrorOccurred).toBe(false);
		expect(result.report.errorMap[ErrorSeverity.ERROR]).toBeDefined();
		expect(Object.keys(result.report.errorMap[ErrorSeverity.ERROR]).length).toBeGreaterThan(0);
	});

	it("fail deserializer test: invalid header modelType", () => {
		const invalidTypesettingModelDTO = cloneDeep(modelValid);
		invalidTypesettingModelDTO.header.modelType = { dump: "INVALID_MODEL_TYPE" } as never;

		const result = marshaller.deserialize(invalidTypesettingModelDTO);
		expect(result.result).toBeFalsy();
		expect(result.report.noErrorOccurred).toBe(false);
		expect(result.report.errorMap[ErrorSeverity.ERROR]).toBeDefined();
		expect(result.report.errorMap[ErrorSeverity.ERROR].length).toBeGreaterThan(0);
	});

	it("fail deserializer test: invalid language tag", () => {
		const invalidTypesettingModelDTO = cloneDeep(modelValid);
		invalidTypesettingModelDTO.content.internal.hyphenation.general.language.tag = 12345 as never;

		const result = marshaller.deserialize(invalidTypesettingModelDTO);
		expect(result.result).toBeFalsy();
		expect(result.report.noErrorOccurred).toBe(false);
		expect(result.report.errorMap[ErrorSeverity.ERROR]).toBeDefined();
		expect(result.report.errorMap[ErrorSeverity.ERROR].length).toBeGreaterThan(0);
	});

	it("fail deserializer test: missing required field", () => {
		const invalidTypesettingModelDTO = cloneDeep(modelValid);
		delete (invalidTypesettingModelDTO.header as Partial<typeof invalidTypesettingModelDTO.header>).id;

		const result = marshaller.deserialize(invalidTypesettingModelDTO);
		expect(result.result).toBeFalsy();
		expect(result.report.noErrorOccurred).toBe(false);
		expect(result.report.errorMap[ErrorSeverity.ERROR]).toBeDefined();
		expect(result.report.errorMap[ErrorSeverity.ERROR].length).toBeGreaterThan(0);
	});
});

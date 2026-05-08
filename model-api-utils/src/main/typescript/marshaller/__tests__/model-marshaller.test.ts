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

import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/lib/errors/deep-partial-error-map.js";

import validPrintModelDTO from "../../../../test/resources/print-models/PrintModel-with-text.json" with { type: "json" };
import { PrintValidationMode } from "../../internal/validation/print-validator.js";

import { PrintModelMarshaller } from "../model-marshaller.js";

describe("PrintModelMarshaller Test", () => {
	const marshaller = new PrintModelMarshaller();

	it("success marshaller-chain test", () => {
		const deserializerResult = marshaller.deserialize(validPrintModelDTO, [], PrintValidationMode.SKIP_REFERENCES);
		expect(deserializerResult.result).toBeDefined();
		expect(deserializerResult.report.noErrorOccurred).toBe(true);

		expect(deserializerResult.report.errorMap.content?.segments?.definitions?.[0]["@id"]).toBeDefined();
		expect(deserializerResult.report.errorMap.content?.segments?.definitions?.[0]["@id"]).toBe(
			"ID_291d178b-85c4-4d9f-ac6f-12ea4e62083f"
		);
		expect(deserializerResult.report.errorMap.content?.segments?.definitions?.[0]["@type"]).toBeDefined();
		expect(deserializerResult.report.errorMap.content?.segments?.definitions?.[0]["@type"]).toBe("Default");

		expect(deserializerResult.report.errorMap.content?.elementDefinitions?.[0]["@id"]).toBeDefined();
		expect(deserializerResult.report.errorMap.content?.elementDefinitions?.[0]["@id"]).toBe(
			"aymJotzgBFBPVVufjeG89"
		);
		expect(deserializerResult.report.errorMap.content?.elementDefinitions?.[0]["@type"]).toBeDefined();
		expect(deserializerResult.report.errorMap.content?.elementDefinitions?.[0]["@type"]).toBe("Text");

		expect(deserializerResult.report.errorMap.content?.textStyles?.definitions?.[0]["@id"]).toBeDefined();
		expect(deserializerResult.report.errorMap.content?.textStyles?.definitions?.[0]["@id"]).toBe(
			"ID_eaec83d5-b064-4874-916e-2fe62af0ef24"
		);
		expect(deserializerResult.report.errorMap.content?.textStyles?.definitions?.[0]["@type"]).toBeFalsy();

		if (deserializerResult.result) {
			const serializerResult = marshaller.serialize(
				deserializerResult.result,
				[],
				PrintValidationMode.SKIP_REFERENCES
			);
			expect(serializerResult.result).toBeDefined();
			expect(deserializerResult.report.noErrorOccurred).toBe(true);
		}
	});

	it("fail deserializer test: additional property", () => {
		const modifiedDTOImpl = {
			header: { ...validPrintModelDTO.header, newOptionalProperty: "test" },
			content: validPrintModelDTO.content,
		};
		const result = marshaller.deserialize(modifiedDTOImpl, [], PrintValidationMode.SKIP_REFERENCES);
		expect(result.result).toBeFalsy();
		expect(Object.keys(result.report.errorMap).length).toBeGreaterThan(0);
		expect(result.report.errorMap[ErrorSeverity.ERROR][0].errorCode).toBe(
			"could not resolve header.newOptionalProperty in the DocumentModel"
		);
	});

	it("fail deserializer test: invalid model", () => {
		const invalidPrintModelDTO = cloneDeep(validPrintModelDTO);
		invalidPrintModelDTO.content.segments.definitions[0].elementReferences[0].position.x =
			"INVALID_POSITION_VALUE" as never;

		const result = marshaller.deserialize(invalidPrintModelDTO, [], PrintValidationMode.SKIP_REFERENCES);
		expect(result.result).toBeFalsy();
		expect(result.report.noErrorOccurred).toBe(false);
		expect(Object.keys(result.report.errorMap[ErrorSeverity.ERROR]).length).toBeGreaterThan(0);
	});
});

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
import { Text } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/lib/errors/deep-partial-error-map.js";

import TextElementValid from "../../../../test/resources/print-models/print-element-definition-text-valid.json" with { type: "json" };
import TextElementInvalid from "../../../../test/resources/print-models/print-element-definition-text-invalid.json" with { type: "json" };
import { PrintValidationMode } from "../../internal/validation/print-validator.js";

import { ElementDefinitionMarshaller } from "../element-definition-marshaller.js";

describe("ElementDefinitionMarshaller Test", () => {
	const validElementDefinitionDTO = {
		id: TextElementValid.id,
		text: TextElementValid.text,
		type: TextElementValid.type,
		textProperties: TextElementValid.textProperties,
		borderProperties: TextElementValid.borderProperties,
	};

	const invalidElementDefinitionDTO = {
		id: TextElementInvalid.id,
		text: TextElementInvalid.text,
		type: TextElementInvalid.type,
		textProperties: TextElementInvalid.textProperties,
		borderProperties: TextElementInvalid.borderProperties,
	};

	const marshaller = new ElementDefinitionMarshaller();

	it("success marshaller-chain test", () => {
		const deserializerResult = marshaller.deserialize<Text>(
			validElementDefinitionDTO,
			[],
			PrintValidationMode.SKIP_REFERENCES
		);
		expect(deserializerResult.result).toBeDefined();
		expect(deserializerResult.report.noErrorOccurred).toBe(true);
		expect(deserializerResult.report.errorMap["@id"]).toBeDefined();
		expect(deserializerResult.report.errorMap["@id"]).toBe("aymJotzgBFBPVVufjeG89");
		expect(deserializerResult.report.errorMap["@type"]).toBeDefined();
		expect(deserializerResult.report.errorMap["@type"]).toBe("Text");

		if (deserializerResult.result) {
			const serializerResult = marshaller.serialize<Text>(
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
			...validElementDefinitionDTO,
			newOptionalProperty: "test",
		};
		const result = marshaller.deserialize<Text>(modifiedDTOImpl, [], PrintValidationMode.SKIP_REFERENCES);
		expect(result.result).toBeFalsy();
		expect(Object.keys(result.report.errorMap).length).toBeGreaterThan(0);
		expect(result.report.errorMap[ErrorSeverity.ERROR][0].errorCode).toBe(
			"could not resolve elementDefinition.newOptionalProperty in the DocumentModel"
		);
	});

	it("fail deserializer test: invalid model", () => {
		const result = marshaller.deserialize<Text>(
			invalidElementDefinitionDTO,
			[],
			PrintValidationMode.SKIP_REFERENCES
		);
		expect(result.result).toBeFalsy();
		expect(result.report.noErrorOccurred).toBe(false);
		expect(Object.keys(result.report.errorMap).length).toBeGreaterThan(0);
	});
});

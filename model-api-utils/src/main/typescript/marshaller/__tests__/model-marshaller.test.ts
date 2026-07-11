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
import type { PrintModelDTO } from "@com.mgmtp.a12.print/print-model-api/generated/a12internal";
import type { EntityInstancePath } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { DocumentServiceFactory } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import validPrintModelDTO from "../../../../test/resources/print-models/PrintModel-with-text.json" with { type: "json" };
import printModelWithRefsDTO from "../../../../test/resources/print-models/Print-model-with-path-references.json" with { type: "json" };
import personDMJson from "../../../../test/resources/document-models/Person.json" with { type: "json" };

import { PrintModelMarshaller } from "../model-marshaller.js";

describe("PrintModelMarshaller Test", () => {
	const marshaller = new PrintModelMarshaller();

	it("success marshaller-chain test", () => {
		const deserializerResult = marshaller.deserialize(validPrintModelDTO);
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
			const serializerResult = marshaller.serialize(deserializerResult.result);
			expect(serializerResult.result).toBeDefined();
			expect(deserializerResult.report.noErrorOccurred).toBe(true);
		}
	});

	it("fail deserializer test: additional property", () => {
		const modifiedDTOImpl = {
			header: { ...validPrintModelDTO.header, newOptionalProperty: "test" },
			content: validPrintModelDTO.content,
		};
		const result = marshaller.deserialize(modifiedDTOImpl);
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

		const result = marshaller.deserialize(invalidPrintModelDTO);
		expect(result.result).toBeFalsy();
		expect(result.report.noErrorOccurred).toBe(false);
		expect(Object.keys(result.report.errorMap[ErrorSeverity.ERROR]).length).toBeGreaterThan(0);
	});

	it("invalid enum value for type — core validator rejects it, no result returned", () => {
		const dtoWithInvalidType = cloneDeep(validPrintModelDTO as PrintModelDTO);
		dtoWithInvalidType.content.elementDefinitions![0].type = "TextXXX" as never;

		const result = marshaller.deserialize(dtoWithInvalidType, { html: false });

		expect(result.result).toBeFalsy();
		expect(result.report.noErrorOccurred).toBe(false);
		expect(result.report.errorMap[ErrorSeverity.ERROR].length).toBeGreaterThan(0);
	});
});

describe("PrintModelMarshaller — HTML validation options", () => {
	const marshaller = new PrintModelMarshaller();

	// Index of a Text element in elementDefinitions (type === "Text")
	const TEXT_ELEM_IDX = 0;

	it("html:false — skips HTML validation, malformed HTML produces no errors", () => {
		const dto = cloneDeep(validPrintModelDTO as PrintModelDTO);
		setHtml(dto, TEXT_ELEM_IDX, "<p style='color: red'>non-hex color</p>");

		const result = marshaller.deserialize(dto, { html: false });

		expect(result.result).toBeDefined();
		expect(result.report.noErrorOccurred).toBe(true);
		expect(result.report.errorMap[ErrorSeverity.ERROR]).toHaveLength(0);
	});

	it("html:true (default) — malformed HTML produces errors", () => {
		const dto = cloneDeep(validPrintModelDTO as PrintModelDTO);
		setHtml(dto, TEXT_ELEM_IDX, "<p style='color: red'>non-hex color</p>");

		const result = marshaller.deserialize(dto, { html: true });

		expect(result.result).toBeDefined();
		expect(result.report.noErrorOccurred).toBe(false);
		expect(result.report.errorMap[ErrorSeverity.ERROR].length).toBeGreaterThan(0);
	});

	it("html:true — malformed HTML still returns the model so the editor can open and fix errors", () => {
		const dto = cloneDeep(validPrintModelDTO as PrintModelDTO);
		setHtml(dto, TEXT_ELEM_IDX, "<p style='color: red'>non-hex color</p>");

		const result = marshaller.deserialize(dto, { html: true });

		expect(result.result).toBeDefined();
		expect(result.report.errorMap[ErrorSeverity.ERROR].length).toBe(1);
	});

	it("omitting html option defaults to html:true — malformed HTML produces errors", () => {
		const dto = cloneDeep(validPrintModelDTO as PrintModelDTO);
		setHtml(dto, TEXT_ELEM_IDX, "<p style='color: red'>non-hex color</p>");

		const result = marshaller.deserialize(dto);

		expect(result.result).toBeDefined();
		expect(result.report.noErrorOccurred).toBe(false);
		expect(result.report.errorMap[ErrorSeverity.ERROR].length).toBeGreaterThan(0);
	});
});

describe("PrintModelMarshaller — reference validation options", () => {
	const marshaller = new PrintModelMarshaller();
	const personDM = new DocumentServiceFactory()
		.getDocumentModelSerializer()
		.deserialize(JSON.stringify(personDMJson));

	it("references not provided — ref validation skipped, no errors", () => {
		const result = marshaller.deserialize(printModelWithRefsDTO, { html: false });

		expect(result.result).toBeDefined();
		expect(result.report.noErrorOccurred).toBe(true);
		expect(result.report.errorMap[ErrorSeverity.ERROR]).toHaveLength(0);
	});

	it("references with correct DM — valid paths produce no errors", () => {
		const result = marshaller.deserialize(printModelWithRefsDTO, {
			html: false,
			references: { documentModels: [personDM] },
		});

		expect(result.result).toBeDefined();
		expect(result.report.noErrorOccurred).toBe(true);
		expect(result.report.errorMap[ErrorSeverity.ERROR]).toHaveLength(0);
	});

	it("references with empty DM list — referenced DM not found, produces errors", () => {
		const result = marshaller.deserialize(printModelWithRefsDTO, {
			html: false,
			references: { documentModels: [] },
		});

		expect(result.result).toBeDefined();
		expect(result.report.noErrorOccurred).toBe(false);
		expect(result.report.errorMap[ErrorSeverity.ERROR].length).toBeGreaterThan(0);
	});

	it("references with empty DM list — model is still returned so the editor can open and fix errors", () => {
		const result = marshaller.deserialize(printModelWithRefsDTO, {
			html: false,
			references: { documentModels: [] },
		});

		expect(result.result).toBeDefined();
		expect(result.report.noErrorOccurred).toBe(false);
		expect(result.report.errorMap[ErrorSeverity.ERROR].length).toBeGreaterThan(0);
	});

	it("references with wrong DM — invalid paths produce errors, model is still returned", () => {
		const dto = cloneDeep(printModelWithRefsDTO as PrintModelDTO);
		const calculation = dto.content.elementDefinitions?.find(element => element.id === "ImjR21frIiC8yPp2koODl");
		const comp = calculation?.calculation?.computationAlternatives?.[0];
		if (!comp) {
			throw new Error("Error in test setup: element not found in test model");
		}
		comp.operation = "[Person/person/dateXXX]";
		const result = marshaller.deserialize(dto, {
			html: false,
			references: { documentModels: [personDM] },
		});

		expect(result.result).toBeDefined();
		expect(result.report.noErrorOccurred).toBe(false);
		expect(result.report.errorMap[ErrorSeverity.ERROR]).toHaveLength(1);
	});
});

describe("PrintModelMarshaller — partial validation options", () => {
	const marshaller = new PrintModelMarshaller();

	it("partial relevantPaths are passed through to the report", () => {
		const paths: EntityInstancePath[] = [
			[{ elementName: "header", index: 1 }],
			[
				{ elementName: "content", index: 1 },
				{ elementName: "segments", index: 1 },
			],
		];

		const result = marshaller.deserialize(validPrintModelDTO, {
			html: false,
			partial: { relevantPaths: paths },
		});

		expect(result.result).toBeDefined();
		expect(result.report.relevantPaths).toEqual(paths);
	});
});

function setHtml(model: PrintModelDTO, index: number, html: string) {
	const textElement = model.content?.elementDefinitions?.[index]?.text;
	if (!textElement) {
		throw new Error(`Could not find text element at index ${index} in elementDefinitions`);
	}
	textElement.text = html;
}

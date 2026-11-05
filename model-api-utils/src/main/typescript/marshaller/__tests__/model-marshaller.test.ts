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
import { FRAGMENT_MODEL_REFERENCE_PURPOSE } from "@com.mgmtp.a12.print/print-model-api/model";
import type { EntityInstancePath } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { DocumentServiceFactory } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import validPrintModelDTO from "../../../../test/resources/print-models/PrintModel-with-text.json" with { type: "json" };
import printFragmentModelDTO from "../../../../test/resources/print-models/printFragment.json" with { type: "json" };
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

describe("PrintModelMarshaller — fragment model Document Model validation", () => {
	const marshaller = new PrintModelMarshaller();

	/** The fragment model test model, deserialized with its document model reference replaced by the given one. */
	function createFragmentModel(documentModel: string) {
		const dto = cloneDeep(printFragmentModelDTO as PrintModelDTO);
		dto.header.modelReferences = dto.header.modelReferences?.map(modelReference =>
			modelReference.modelType === "document" ? { ...modelReference, reference: documentModel } : modelReference
		);
		return marshaller.deserialize(dto).result!;
	}

	/** The print model test model (referencing "DomainText") with a reference to the fragment model test model. */
	function createPrintModelDTOWithFragmentReference() {
		const dto = cloneDeep(validPrintModelDTO as PrintModelDTO);
		dto.header.modelReferences = [
			...(dto.header.modelReferences ?? []),
			{ modelType: "print", reference: "printFragment", purpose: FRAGMENT_MODEL_REFERENCE_PURPOSE },
		];
		return dto;
	}

	it("fragment model with the same DM — produces no errors", () => {
		const result = marshaller.deserialize(createPrintModelDTOWithFragmentReference(), {
			html: false,
			references: { fragmentModels: [createFragmentModel("DomainText")] },
		});

		expect(result.result).toBeDefined();
		expect(result.report.noErrorOccurred).toBe(true);
		expect(result.report.errorMap[ErrorSeverity.ERROR]).toHaveLength(0);
	});

	it("fragment model with a different DM — produces an error, model is still returned", () => {
		const result = marshaller.deserialize(createPrintModelDTOWithFragmentReference(), {
			html: false,
			references: { fragmentModels: [createFragmentModel("ExampleDM")] },
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

describe("PrintModelMarshaller — fragment model round-trip", () => {
	const marshaller = new PrintModelMarshaller();

	it("serializes and deserializes fragment model", () => {
		const modelWithRef = cloneDeep(printFragmentModelDTO) as PrintModelDTO;

		const deserResult = marshaller.deserialize(modelWithRef);
		expect(deserResult.result).toBeDefined();
		expect(deserResult.report.noErrorOccurred).toBe(true);

		const serResult = marshaller.serialize(deserResult.result!);
		expect(serResult.result).toBeDefined();
		expect(serResult.report.noErrorOccurred).toBe(true);
	});
});

describe("PrintModelMarshaller — watermarks.references round-trip", () => {
	const marshaller = new PrintModelMarshaller();

	it("serializes and deserializes watermarks.references without loss", () => {
		const modelWithRef = cloneDeep(validPrintModelDTO) as PrintModelDTO;
		(modelWithRef.content as unknown as Record<string, unknown>).watermarks = {
			id: "wc-1",
			definitions: [],
			references: [{ id: "ref-1", refId: "wm-frag-1", model: "fragment-model-id" }],
		};

		const deserResult = marshaller.deserialize(modelWithRef);
		if (!deserResult.result) {
			throw new Error("Failed Deserialization.");
		}
		expect(deserResult.result?.content?.watermarks?.references).toHaveLength(1);
		const ref = deserResult.result?.content?.watermarks?.references?.[0];
		expect(ref?.id).toBe("ref-1");
		expect(ref?.refId).toBe("wm-frag-1");
		expect(ref?.model).toBe("fragment-model-id");

		const serResult = marshaller.serialize(deserResult.result);
		expect(serResult.result).toBeDefined();
		const serializedRefs = (serResult.result?.content?.watermarks as Record<string, unknown>)
			?.references as unknown[];
		expect(serializedRefs).toHaveLength(1);
		const serializedRef = serializedRefs[0] as Record<string, string>;
		expect(serializedRef.id).toBe("ref-1");
		expect(serializedRef.refId).toBe("wm-frag-1");
		expect(serializedRef.model).toBe("fragment-model-id");
	});
});

describe("PrintModelMarshaller — sections.references round-trip", () => {
	const marshaller = new PrintModelMarshaller();

	it("serializes and deserializes sections.references without loss", () => {
		const modelWithRef = cloneDeep(validPrintModelDTO) as PrintModelDTO;
		(modelWithRef.content as unknown as Record<string, unknown>).sections = {
			id: "sc-1",
			definitions: [],
			references: [{ id: "ref-1", refId: "sec-frag-1", model: "fragment-model-id" }],
		};

		const deserResult = marshaller.deserialize(modelWithRef);
		if (!deserResult.result) {
			throw new Error("Failed Deserialization.");
		}
		expect(deserResult.result?.content?.sections?.references).toHaveLength(1);
		const ref = deserResult.result?.content?.sections?.references?.[0];
		expect(ref?.id).toBe("ref-1");
		expect(ref?.refId).toBe("sec-frag-1");
		expect(ref?.model).toBe("fragment-model-id");

		const serResult = marshaller.serialize(deserResult.result);
		expect(serResult.result).toBeDefined();
		const serializedRefs = (serResult.result?.content?.sections as Record<string, unknown>)
			?.references as unknown[];
		expect(serializedRefs).toHaveLength(1);
		const serializedRef = serializedRefs[0] as Record<string, string>;
		expect(serializedRef.id).toBe("ref-1");
		expect(serializedRef.refId).toBe("sec-frag-1");
		expect(serializedRef.model).toBe("fragment-model-id");
	});

	it("serializes and deserializes sections.references.sectionUsage without loss", () => {
		const modelWithRef = cloneDeep(validPrintModelDTO) as PrintModelDTO;
		(modelWithRef.content as unknown as Record<string, unknown>).sections = {
			id: "sc-1",
			definitions: [],
			references: [{ id: "ref-1", refId: "sec-frag-1", model: "fragment-model-id", sectionUsage: "First" }],
		};

		const deserResult = marshaller.deserialize(modelWithRef);
		if (!deserResult.result) {
			throw new Error("Failed Deserialization.");
		}
		const ref = deserResult.result?.content?.sections?.references?.[0];
		expect(ref?.sectionUsage).toBe("First");

		const serResult = marshaller.serialize(deserResult.result);
		expect(serResult.result).toBeDefined();
		const serializedRefs = (serResult.result?.content?.sections as Record<string, unknown>)
			?.references as unknown[];
		const serializedRef = serializedRefs[0] as Record<string, string>;
		expect(serializedRef.sectionUsage).toBe("First");
	});

	it("leaves sectionUsage undefined when not provided on the reference", () => {
		const modelWithRef = cloneDeep(validPrintModelDTO) as PrintModelDTO;
		(modelWithRef.content as unknown as Record<string, unknown>).sections = {
			id: "sc-1",
			definitions: [],
			references: [{ id: "ref-1", refId: "sec-frag-1", model: "fragment-model-id" }],
		};

		const deserResult = marshaller.deserialize(modelWithRef);
		if (!deserResult.result) {
			throw new Error("Failed Deserialization.");
		}
		const ref = deserResult.result?.content?.sections?.references?.[0];
		expect(ref?.sectionUsage).toBeUndefined();
	});
});

describe("PrintModelMarshaller — textStyles.references round-trip", () => {
	const marshaller = new PrintModelMarshaller();

	it("serializes and deserializes textStyles.references without loss", () => {
		const modelWithRef = cloneDeep(validPrintModelDTO) as PrintModelDTO;
		(modelWithRef.content as unknown as Record<string, unknown>).textStyles = {
			id: "ts-1",
			definitions: [],
			references: [{ id: "ref-1", refId: "ts-frag-1", model: "fragment-model-id" }],
		};

		const deserResult = marshaller.deserialize(modelWithRef);
		if (!deserResult.result) {
			throw new Error("Failed Deserialization.");
		}
		expect(deserResult.result?.content?.textStyles?.references).toHaveLength(1);
		const ref = deserResult.result?.content?.textStyles?.references?.[0];
		expect(ref?.id).toBe("ref-1");
		expect(ref?.refId).toBe("ts-frag-1");
		expect(ref?.model).toBe("fragment-model-id");

		const serResult = marshaller.serialize(deserResult.result);
		expect(serResult.result).toBeDefined();
		const serializedRefs = (serResult.result?.content?.textStyles as Record<string, unknown>)
			?.references as unknown[];
		expect(serializedRefs).toHaveLength(1);
		const serializedRef = serializedRefs[0] as Record<string, string>;
		expect(serializedRef.id).toBe("ref-1");
		expect(serializedRef.refId).toBe("ts-frag-1");
		expect(serializedRef.model).toBe("fragment-model-id");
	});
});

describe("PrintModelMarshaller — segments.fragmentReferences round-trip", () => {
	const marshaller = new PrintModelMarshaller();

	it("serializes and deserializes segments.fragmentReferences without loss", () => {
		const modelWithRef = cloneDeep(validPrintModelDTO) as PrintModelDTO;
		(modelWithRef.content as unknown as Record<string, Record<string, unknown>>).segments.fragmentReferences = [
			{ id: "ref-seg-1", refId: "seg-frag-1", model: "fragment-model-id" },
		];

		const deserResult = marshaller.deserialize(modelWithRef);
		if (!deserResult.result) {
			throw new Error("Failed Deserialization.");
		}
		expect(deserResult.result?.content?.segments?.fragmentReferences).toHaveLength(1);
		const ref = deserResult.result?.content?.segments?.fragmentReferences?.[0];
		expect(ref?.id).toBe("ref-seg-1");
		expect(ref?.refId).toBe("seg-frag-1");
		expect(ref?.model).toBe("fragment-model-id");

		const serResult = marshaller.serialize(deserResult.result);
		expect(serResult.result).toBeDefined();
		const serializedRefs = (serResult.result?.content?.segments as unknown as Record<string, unknown>)
			?.fragmentReferences as unknown[];
		expect(serializedRefs).toHaveLength(1);
		const serializedRef = serializedRefs[0] as Record<string, string>;
		expect(serializedRef.id).toBe("ref-seg-1");
		expect(serializedRef.refId).toBe("seg-frag-1");
		expect(serializedRef.model).toBe("fragment-model-id");
	});
});

describe("PrintModelMarshaller — fragment element placed inside a wrapper", () => {
	const marshaller = new PrintModelMarshaller();
	const AREA_ID = "sL2q81D6dhyWcOemGpkMB";

	function findArea(elementDefinitions: unknown[]) {
		const area = elementDefinitions.find(element => (element as Record<string, string>).id === AREA_ID) as Record<
			string,
			Record<string, Record<string, string>[]>
		>;
		if (!area?.area?.elementReferences?.length) {
			throw new Error(`Area ${AREA_ID} with element references expected in the test model`);
		}
		return area.area.elementReferences;
	}

	it("keeps the model of a placement nested in an area", () => {
		const modelWithRef = cloneDeep(printModelWithRefsDTO) as unknown as PrintModelDTO;
		findArea(modelWithRef.content.elementDefinitions as unknown[])[0].model = "fragment-model-id";

		const deserResult = marshaller.deserialize(modelWithRef);
		if (!deserResult.result) {
			throw new Error("Failed Deserialization.");
		}
		const deserializedArea = deserResult.result.content.elementDefinitions.find(
			element => element.id === AREA_ID
		) as unknown as { area: { elementReferences: { model?: string }[] } };
		expect(deserializedArea.area.elementReferences[0].model).toBe("fragment-model-id");

		const serResult = marshaller.serialize(deserResult.result);
		expect(serResult.result).toBeDefined();
		expect(findArea(serResult.result?.content.elementDefinitions as unknown[])[0].model).toBe("fragment-model-id");
	});
});

function setHtml(model: PrintModelDTO, index: number, html: string) {
	const textElement = model.content?.elementDefinitions?.[index]?.text;
	if (!textElement) {
		throw new Error(`Could not find text element at index ${index} in elementDefinitions`);
	}
	textElement.text = html;
}

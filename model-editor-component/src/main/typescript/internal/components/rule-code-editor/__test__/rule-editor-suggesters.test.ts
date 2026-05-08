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
import { DocumentServiceFactory } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { PrintModelMarshaller } from "@com.mgmtp.a12.print/print-model-api-utils/lib/marshaller/model-marshaller.js";
import { DocumentModelUtils } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/utils/document-model-utils.js";
import { PrintValidationMode } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/validation/print-validator.js";

import testPartialPrintModel from "../../../../../../test/typescript/models/Print-model-with-path-references.json" with { type: "json" };
import testDocumentModel from "../../../../../../test/typescript/models/Person.json" with { type: "json" };

import { getRootSuggester, getSuggester } from "../rule-editor-suggesters.js";

const documentService = new DocumentServiceFactory();

const deserialized = documentService.getDocumentModelSerializer().deserialize(JSON.stringify(testDocumentModel));
const documentModelData = DocumentModelUtils.getDocumentModelData(deserialized);

const printModelMarshaller = new PrintModelMarshaller();
const deserializeResult = printModelMarshaller.deserialize(
	testPartialPrintModel,
	[],
	PrintValidationMode.SKIP_REFERENCES
);

describe("Rule Editor Suggestor - getSuggester", () => {
	const { elementMap, annotations, enhancements } = documentModelData;
	const modelId = deserializeResult.result?.header.modelReferences?.at(0)?.reference;
	const modelAlias = deserializeResult.result?.header.modelReferences?.at(0)?.alias;
	const runtimeVariables = deserializeResult.result?.content.general.runtimeVariables;

	it("should have correct test setup", () => {
		expect(modelId).toBe("Person");
		expect(modelAlias).toBe("PersonAlias");
		expect(runtimeVariables).toHaveLength(3);
	});
	// without alias
	it("should get suggestions for group", async () => {
		const items = await getSuggester(true, elementMap, annotations, undefined, undefined, modelId, undefined)();
		expect(items.map(e => e.label)).toMatchSnapshot();
	});
	it("should get suggestions for group listing", async () => {
		const items = await getSuggester(
			true,
			elementMap,
			annotations,
			undefined,
			undefined,
			modelId,
			undefined,
			"listing"
		)();
		expect(items.map(e => e.label)).toMatchSnapshot();
	});
	it("should get suggestions for field", async () => {
		const items = await getSuggester(
			false,
			elementMap,
			annotations,
			enhancements,
			runtimeVariables,
			modelId,
			undefined
		)();
		expect(items.map(e => e.label)).toMatchSnapshot();
	});
	it("should get suggestions for field listing", async () => {
		const items = await getSuggester(
			false,
			elementMap,
			annotations,
			enhancements,
			runtimeVariables,
			modelId,
			undefined,
			"listing"
		)();
		expect(items.map(e => e.label)).toMatchSnapshot();
	});

	// with alias
	it("should get suggestions with Alias for group", async () => {
		const items = await getSuggester(true, elementMap, annotations, undefined, undefined, modelId, modelAlias)();
		expect(items.map(e => e.label)).toMatchSnapshot();
	});
	it("should get suggestions with Alias for group listing", async () => {
		const items = await getSuggester(
			true,
			elementMap,
			annotations,
			undefined,
			undefined,
			modelId,
			modelAlias,
			"listing"
		)();
		expect(items.map(e => e.label)).toMatchSnapshot();
	});
	it("should get suggestions with Alias for field", async () => {
		const items = await getSuggester(
			false,
			elementMap,
			annotations,
			enhancements,
			runtimeVariables,
			modelId,
			modelAlias
		)();
		expect(items.map(e => e.label)).toMatchSnapshot();
	});
	it("should get suggestions with Alias for field listing", async () => {
		const items = await getSuggester(
			false,
			elementMap,
			annotations,
			enhancements,
			runtimeVariables,
			modelId,
			modelAlias,
			"listing"
		)();
		expect(items.map(e => e.label)).toMatchSnapshot();
	});
});

describe("Rule Editor Suggestor - getRootSuggester", () => {
	it("should get suggestions for root", async () => {
		const items = await getRootSuggester()();
		expect(items.map(e => e.label)).toMatchSnapshot();
	});
	it("should get suggestions for root with Document Model Id", async () => {
		const items = await getRootSuggester("DM1")();
		expect(items.map(e => e.label)).toMatchSnapshot();
	});
	it("should get suggestions for root with Document Model Id and Document Model Alias", async () => {
		const items = await getRootSuggester("DM1", "Alias")();
		expect(items.map(e => e.label)).toMatchSnapshot();
	});
});

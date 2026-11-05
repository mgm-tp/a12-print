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
import { DeepPartialErrorMap, ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";
import type { PrintError } from "@com.mgmtp.a12.print/print-model-api/errors";
import { PrintModelMarshaller } from "@com.mgmtp.a12.print/print-model-api-utils/marshaller";
import type { PrintModelDTO } from "@com.mgmtp.a12.print/print-model-api/generated/a12internal";

import { createPrintModel } from "../create-print-model.js";

/** The metadata rules of the meta model that report a default value as INFO. */
const DEFAULT_METADATA_INFO_KEYS = [
	"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.general.metadata.titleHasDefaultValue",
	"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.general.metadata.descriptionHasDefaultValue",
	"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.general.metadata.languageHasDefaultValue",
	"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.general.metadata.authorHasDefaultValue",
];

const marshaller = new PrintModelMarshaller();

/** Collects every message of the given severity from the whole error map, regardless of its path. */
const collectMessages = (errorMap: unknown, severity: ErrorSeverity): PrintError[] => {
	if (Array.isArray(errorMap)) {
		return errorMap.flatMap(entry => collectMessages(entry, severity));
	}
	if (errorMap === null || typeof errorMap !== "object") {
		return [];
	}
	return Object.entries(errorMap as Record<string, unknown>).flatMap(([key, value]) => {
		if (key === severity) {
			return (value as PrintError[]) ?? [];
		}
		return DeepPartialErrorMap.isPropertyKey(key) ? [] : collectMessages(value, severity);
	});
};

const messageKeys = (errorMap: unknown, severity: ErrorSeverity): string[] => [
	...new Set(
		collectMessages(errorMap, severity)
			.map(message => message.parameters?.messageKey)
			.filter((messageKey): messageKey is string => messageKey !== undefined)
	),
];

const deserialize = (printModel: PrintModelDTO) => marshaller.deserialize(printModel, { html: false });

describe("createPrintModel", () => {
	it("should create a print model with metadata and without a sub type annotation", () => {
		const printModel = createPrintModel("MyPrintModel", []);

		expect(printModel.header.annotations).toEqual([]);
		expect(printModel.content.general?.metadata).toEqual(
			expect.objectContaining({
				titleComputation: [expect.objectContaining({ operation: '"MyPrintModel"' })],
				descriptionComputation: [expect.objectContaining({ operation: '"Description"' })],
				languageComputation: [expect.objectContaining({ operation: '"DE"' })],
				authorComputation: [expect.objectContaining({ operation: '"Print Model Editor"' })],
			})
		);
	});

	it("should annotate the given roles", () => {
		const printModel = createPrintModel("MyPrintModel", [{ roleName: "admin" }, { roleName: "editor" }]);

		expect(printModel.header.annotations).toEqual([{ name: "roles", value: "admin,editor" }]);
	});

	it("should create a fragment model with the fragment annotation and without default metadata", () => {
		const fragmentModel = createPrintModel("MyFragment", [], "fragment");

		expect(fragmentModel.header.annotations).toEqual([{ name: "modelSubType", value: "fragment" }]);
		expect(fragmentModel.content.general?.metadata).toEqual({
			id: expect.any(String),
			titleComputation: [],
			descriptionComputation: [],
			languageComputation: [],
			authorComputation: [],
		});
	});

	it("should annotate roles and the fragment sub type", () => {
		const fragmentModel = createPrintModel("MyFragment", [{ roleName: "admin" }], "fragment");

		expect(fragmentModel.header.annotations).toEqual([
			{ name: "roles", value: "admin" },
			{ name: "modelSubType", value: "fragment" },
		]);
	});

	describe("validation", () => {
		it("should create a valid print model that only informs about its default metadata", () => {
			const { result, report } = deserialize(createPrintModel("MyPrintModel", []));

			expect(collectMessages(report.errorMap, ErrorSeverity.ERROR)).toEqual([]);
			expect(collectMessages(report.errorMap, ErrorSeverity.WARNING)).toEqual([]);
			expect(report.noErrorOccurred).toBe(true);
			expect(result).toBeDefined();
			expect(messageKeys(report.errorMap, ErrorSeverity.INFO)).toEqual(
				expect.arrayContaining(DEFAULT_METADATA_INFO_KEYS)
			);
		});

		it("should create a valid fragment model without any default metadata info", () => {
			const { result, report } = deserialize(createPrintModel("MyFragment", [], "fragment"));

			expect(collectMessages(report.errorMap, ErrorSeverity.ERROR)).toEqual([]);
			expect(collectMessages(report.errorMap, ErrorSeverity.WARNING)).toEqual([]);
			expect(report.noErrorOccurred).toBe(true);
			expect(result).toBeDefined();
			expect(messageKeys(report.errorMap, ErrorSeverity.INFO)).toEqual(
				expect.not.arrayContaining(DEFAULT_METADATA_INFO_KEYS)
			);
			expect(messageKeys(report.errorMap, ErrorSeverity.INFO)).toEqual([]);
		});

		it("should keep the mandatory computation lists of the API type on a fragment model", () => {
			const { result } = deserialize(createPrintModel("MyFragment", [], "fragment"));

			expect(result?.content.general.metadata).toEqual({
				id: expect.any(String),
				titleComputation: [],
				descriptionComputation: [],
				languageComputation: [],
				authorComputation: [],
			});
		});
	});
});

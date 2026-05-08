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

import { PrintSettingModelMarshaller } from "../print-setting-marshaller.js";

import validPrintSettingModelDTO from "./__testdata__/valid-print-setting-model.json" with { type: "json" };

describe("PrintSettingModelMarshaller Test", () => {
	const marshaller = new PrintSettingModelMarshaller();

	describe("round-trip marshalling", () => {
		it("success marshaller-chain test", () => {
			const deserializerResult = marshaller.deserialize(validPrintSettingModelDTO, []);
			expect(deserializerResult.result).toBeDefined();
			expect(deserializerResult.report.noErrorOccurred).toBe(true);

			if (deserializerResult.result) {
				const serializerResult = marshaller.serialize(deserializerResult.result, []);
				expect(serializerResult.result).toBeDefined();
				expect(serializerResult.report.noErrorOccurred).toBe(true);

				const result = serializerResult.result;
				expect(result?.header?.id).toBe(validPrintSettingModelDTO.header.id);
				expect(result?.header?.modelType).toBe(validPrintSettingModelDTO.header.modelType);
				expect(result?.header?.annotations).toHaveLength(1);
				expect(result?.header?.annotations?.[0].name).toBe("roles");
				expect(result?.content?.settings?.fonts).toHaveLength(3);
				expect(result?.content?.settings?.fonts?.[0].name).toBe("font1");
				expect(result?.content?.settings?.fonts?.[0].type).toBe("attachment");
			}
		});

		it("should preserve font with attachment type", () => {
			const modelWithAttachment = cloneDeep(validPrintSettingModelDTO);
			(modelWithAttachment.content.settings as { fonts: unknown[] }).fonts = [
				{
					name: "CustomFont",
					type: "attachment",
					fallback: false,
					fontAttachment: {
						content: "base64encodedcontent",
						internal_filename: "custom-font.ttf",
						original_filename: "Custom Font.ttf",
						mime_type: "font/ttf",
						size: 2048,
						category: "display",
						description: "A custom display font",
					},
				},
			];

			const deserializerResult = marshaller.deserialize(modelWithAttachment, []);
			expect(deserializerResult.result).toBeDefined();
			expect(deserializerResult.report.noErrorOccurred).toBe(true);

			if (deserializerResult.result) {
				const serializerResult = marshaller.serialize(deserializerResult.result, []);
				expect(serializerResult.result).toBeDefined();

				const font = serializerResult.result?.content?.settings?.fonts?.[0];
				expect(font?.name).toBe("CustomFont");
				expect(font?.type).toBe("attachment");
				expect(font?.fallback).toBe(false);
				expect(font?.fontAttachment?.content).toBe("base64encodedcontent");
				expect(font?.fontAttachment?.internal_filename).toBe("custom-font.ttf");
				expect(font?.fontAttachment?.original_filename).toBe("Custom Font.ttf");
				expect(font?.fontAttachment?.size).toBe(2048);
			}
		});

		it("should preserve font with path type", () => {
			const modelWithPath = cloneDeep(validPrintSettingModelDTO);
			(modelWithPath.content.settings as { fonts: unknown[] }).fonts = [
				{
					name: "SystemFont",
					type: "path",
					path: "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
					fallback: true,
				},
			];

			const deserializerResult = marshaller.deserialize(modelWithPath, []);
			expect(deserializerResult.result).toBeDefined();
			expect(deserializerResult.report.noErrorOccurred).toBe(true);

			if (deserializerResult.result) {
				const serializerResult = marshaller.serialize(deserializerResult.result, []);
				expect(serializerResult.result).toBeDefined();

				const font = serializerResult.result?.content?.settings?.fonts?.[0];
				expect(font?.name).toBe("SystemFont");
				expect(font?.type).toBe("path");
				expect(font?.path).toBe("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf");
				expect(font?.fallback).toBe(true);
			}
		});

		it("should preserve default fonts", () => {
			const modelWithDefaults = cloneDeep(validPrintSettingModelDTO);
			(modelWithDefaults.content as unknown as { defaults: unknown }).defaults = {
				fonts: [
					{ name: "PrimaryFont", fallback: false },
					{ name: "FallbackFont", fallback: true },
				],
			};

			const deserializerResult = marshaller.deserialize(modelWithDefaults, []);
			expect(deserializerResult.result).toBeDefined();
			expect(deserializerResult.report.noErrorOccurred).toBe(true);

			if (deserializerResult.result) {
				const serializerResult = marshaller.serialize(deserializerResult.result, []);
				expect(serializerResult.result).toBeDefined();

				const defaults = serializerResult.result?.content?.defaults;
				expect(defaults?.fonts).toHaveLength(2);
				expect(defaults?.fonts?.[0].name).toBe("PrimaryFont");
				expect(defaults?.fonts?.[0].fallback).toBe(false);
				expect(defaults?.fonts?.[1].name).toBe("FallbackFont");
				expect(defaults?.fonts?.[1].fallback).toBe(true);
			}
		});

		it("should preserve header annotations", () => {
			const modelWithAnnotations = cloneDeep(validPrintSettingModelDTO);
			modelWithAnnotations.header.annotations = [
				{ name: "roles", value: "admin,editor,viewer" },
				{ name: "custom", value: "customValue" },
			];

			const deserializerResult = marshaller.deserialize(modelWithAnnotations, []);
			expect(deserializerResult.result).toBeDefined();
			expect(deserializerResult.report.noErrorOccurred).toBe(true);

			if (deserializerResult.result) {
				const serializerResult = marshaller.serialize(deserializerResult.result, []);
				expect(serializerResult.result).toBeDefined();

				const annotations = serializerResult.result?.header?.annotations;
				expect(annotations).toHaveLength(2);
				expect(annotations?.[0].name).toBe("roles");
				expect(annotations?.[0].value).toBe("admin,editor,viewer");
				expect(annotations?.[1].name).toBe("custom");
				expect(annotations?.[1].value).toBe("customValue");
			}
		});

		it("should handle empty settings", () => {
			const modelWithEmptySettings = cloneDeep(validPrintSettingModelDTO);
			(modelWithEmptySettings.content.settings as { fonts: unknown[] }).fonts = [];

			const deserializerResult = marshaller.deserialize(modelWithEmptySettings, []);
			expect(deserializerResult.result).toBeDefined();
			expect(deserializerResult.report.noErrorOccurred).toBe(true);

			if (deserializerResult.result) {
				const serializerResult = marshaller.serialize(deserializerResult.result, []);
				expect(serializerResult.result).toBeDefined();
				expect(serializerResult.result?.content?.settings?.fonts).toHaveLength(0);
			}
		});
	});

	describe("deserialization errors", () => {
		it("fail deserializer test: additional property", () => {
			const modifiedDTOImpl = {
				header: { ...validPrintSettingModelDTO.header, newOptionalProperty: "test" },
				content: validPrintSettingModelDTO.content,
			};
			const result = marshaller.deserialize(modifiedDTOImpl, []);
			expect(result.result).toBeFalsy();
			expect(Object.keys(result.report.errorMap).length).toBeGreaterThan(0);
			expect(result.report.errorMap[ErrorSeverity.ERROR][0].errorCode).toBe(
				"could not resolve header.newOptionalProperty in the DocumentModel"
			);
		});

		it("fail deserializer test: invalid model - missing required font properties", () => {
			const invalidPrintSettingModelDTO = cloneDeep(validPrintSettingModelDTO);
			invalidPrintSettingModelDTO.content.settings.fonts[0] = {} as never;

			const result = marshaller.deserialize(invalidPrintSettingModelDTO, []);
			expect(result.result).toBeFalsy();
			expect(result.report.noErrorOccurred).toBe(false);
			expect(Object.keys(result.report.errorMap[ErrorSeverity.ERROR]).length).toBeGreaterThan(0);
		});

		it("fail deserializer test: invalid font type", () => {
			const invalidPrintSettingModelDTO = cloneDeep(validPrintSettingModelDTO);
			invalidPrintSettingModelDTO.content.settings.fonts[0].type = "invalid" as never;

			const result = marshaller.deserialize(invalidPrintSettingModelDTO, []);
			expect(result.result).toBeFalsy();
			expect(result.report.noErrorOccurred).toBe(false);
		});

		it("fail deserializer test: missing header id", () => {
			const invalidPrintSettingModelDTO = cloneDeep(validPrintSettingModelDTO);
			delete (invalidPrintSettingModelDTO.header as Record<string, unknown>).id;

			const result = marshaller.deserialize(invalidPrintSettingModelDTO, []);
			expect(result.result).toBeFalsy();
			expect(result.report.noErrorOccurred).toBe(false);
		});
	});
});

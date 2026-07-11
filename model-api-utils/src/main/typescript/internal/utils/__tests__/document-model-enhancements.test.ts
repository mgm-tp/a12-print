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
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { DocumentServiceFactory } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import documentModelJson from "../../../../../test/resources/document-models/test-document-model.json" with { type: "json" };
import type { ElementMapEntry } from "../../../a12internal/utils/document-model-data.js";

import {
	AnnotationEnhancements,
	DocumentModelEnhancements,
	EnumFieldEnhancements,
	MetadataEnhancements,
} from "../document-model-enhancements.js";

describe("document model enhancement", () => {
	const documentModelMarshaller = new DocumentServiceFactory().getDocumentModelSerializer();
	const documentModel = documentModelMarshaller.deserialize(JSON.stringify(documentModelJson));

	const groupElement: DocumentModel.Element = documentModel.content.modelRoot.elements[0];
	const enumFieldElement: DocumentModel.Element = (groupElement as DocumentModel.Group).elements[0];

	const elementMapEnumField = {
		element: enumFieldElement,
		elementPath: `/group/${enumFieldElement.name}`,
		isGroup: false,
		isSubOfRepeatable: false,
	} as ElementMapEntry;

	const elementMapGroup = {
		elementPath: "/group",
		isGroup: true,
		repeatability: 1,
		isSubOfRepeatable: false,
		hasNonRepFieldLeafs: true,
		element: groupElement,
	} as ElementMapEntry;

	describe("AnnotationEnhancements.enhancePathWithAnnotations", () => {
		it("should enhance paths correctly", () => {
			const initialPaths: string[] = [];
			AnnotationEnhancements.enhancePathWithAnnotations(elementMapEnumField, initialPaths);

			const expectedResult: string[] = [];
			if (enumFieldElement.annotations) {
				enumFieldElement.annotations.forEach(annotation => {
					expectedResult.push(`annotations${elementMapEnumField.elementPath}/${annotation.name}`);
				});
			}

			expect(initialPaths).toEqual(expectedResult);
		});
	});

	describe("EnumFieldEnhancements.enhancePathWitEnumFieldInstanceInformation", () => {
		it("should enhance path with enum field instance information correctly", () => {
			const initialPaths: string[] = [];

			EnumFieldEnhancements.enhancePathWitEnumFieldInstanceInformation(
				elementMapEnumField,
				"documentModelId",
				initialPaths
			);

			expect(initialPaths).toEqual(["documentModelId/group/enum_field_text"]);
		});
	});

	describe("MetadataEnhancements.enhancePathWithMetadata", () => {
		it("should enhance path with metadata for elementMapEntry as field correctly", () => {
			const initialPaths: string[] = [];
			MetadataEnhancements.enhancePathWithMetadata(elementMapEnumField, initialPaths);

			expect(initialPaths).toEqual([
				"metadata/group/enum_field/required",
				"metadata/group/enum_field/externalDescription",
				"metadata/group/enum_field/path",
				"metadata/group/enum_field/label",
				"metadata/group/enum_field/errorMessage",
			]);
		});
		it("should enhance path with metadata for elementMapEntry as group correctly", () => {
			const initialPaths: string[] = [];
			MetadataEnhancements.enhancePathWithMetadata(elementMapGroup, initialPaths);

			expect(initialPaths).toEqual([
				"metadata/group/required",
				"metadata/group/externalDescription",
				"metadata/group/path",
				"metadata/group/repeatability",
			]);
		});
	});

	describe("DocumentModelEnhancements.getDocumentModelEnhancements", () => {
		it("should get document enhancements correctly", () => {
			const documentModelEnhancements = DocumentModelEnhancements.getDocumentModelEnhancements(
				elementMapEnumField,
				"documentModelId"
			);

			expect(documentModelEnhancements).toEqual([
				"metadata/group/enum_field/required",
				"metadata/group/enum_field/externalDescription",
				"metadata/group/enum_field/path",
				"metadata/group/enum_field/label",
				"metadata/group/enum_field/errorMessage",
				"documentModelId/group/enum_field_text",
				"annotations/group/enum_field/anno_enum_field",
			]);
		});
	});
});

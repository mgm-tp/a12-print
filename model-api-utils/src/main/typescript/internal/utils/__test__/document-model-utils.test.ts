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
import { DocumentModel, DocumentServiceFactory } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import documentModelJson from "../../../../../test/resources/document-models/test-document-model.json" with { type: "json" };

import { DocumentModelEnhancements } from "../document-model-enhancements.js";
import { DocumentModelUtils } from "../document-model-utils.js";

describe("document model utils", () => {
	const documentModelMarshaller = new DocumentServiceFactory().getDocumentModelSerializer();
	const documentModel = documentModelMarshaller.deserialize(JSON.stringify(documentModelJson));
	const groupElement: DocumentModel.Element = documentModel.content.modelRoot.elements[0];
	const fieldElement1: DocumentModel.Element = (groupElement as DocumentModel.Group).elements[0];
	const fieldElement2: DocumentModel.Element = (groupElement as DocumentModel.Group).elements[1];

	describe("getDocumentModelData", () => {
		it("should return document model data correctly", () => {
			const documentModelData = DocumentModelUtils.getDocumentModelData(documentModel);

			const elementMapField1 = {
				[`/${groupElement.id}/${fieldElement1.id}`]: {
					element: fieldElement1,
					elementPath: `/group/${fieldElement1.name}`,
					isGroup: false,
					isSubOfRepeatable: false,
				},
			};

			const elementMapField2 = {
				[`/${groupElement.id}/${fieldElement2.id}`]: {
					element: fieldElement2,
					elementPath: `/group/${fieldElement2.name}`,
					isGroup: false,
					isSubOfRepeatable: false,
				},
			};

			const elementMapGroup = {
				[`/${groupElement.id}`]: {
					elementPath: "/group",
					isGroup: true,
					repeatability: 1,
					isSubOfRepeatable: false,
					hasNonRepFieldLeafs: true,
					element: groupElement as DocumentModel.Element,
				},
			};

			const enhancements = [
				...DocumentModelEnhancements.getDocumentModelEnhancements(
					Object.values(elementMapField1)[0],
					documentModel.header.id
				),
				...DocumentModelEnhancements.getDocumentModelEnhancements(
					Object.values(elementMapField2)[0],
					documentModel.header.id
				),
				...DocumentModelEnhancements.getDocumentModelEnhancements(
					Object.values(elementMapGroup)[0],
					documentModel.header.id
				),
			];

			const annotations = new Set();
			for (const element of [fieldElement1, fieldElement2, groupElement]) {
				if (element.annotations) {
					element.annotations.forEach(annotation => {
						annotations.add(annotation.name);
					});
				}
			}

			const expectedResult = {
				elementMap: {
					...elementMapField1,
					...elementMapField2,
					...elementMapGroup,
				},
				enhancements,
				annotations,
			};

			expect(documentModelData).toMatchObject(expectedResult);
		});
	});

	describe("isGroup", () => {
		it("should return true if element type is group", () => {
			const result = DocumentModelUtils.isGroup(groupElement);
			expect(result).toBe(true);
		});
		it("should return false if element type is not group", () => {
			const result = DocumentModelUtils.isGroup(fieldElement1);
			expect(result).toBe(false);
		});
	});

	describe("isField", () => {
		it("should return true if element type is field", () => {
			const result = DocumentModelUtils.isField(fieldElement2);
			expect(result).toBe(true);
		});
		it("should return false if element type is not field", () => {
			const result = DocumentModelUtils.isField(groupElement);
			expect(result).toBe(false);
		});
	});
});

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
import { Locale } from "@com.mgmtp.a12.utils/utils-localization/lib/main/index.js";
import { Model } from "@com.mgmtp.a12.base/base-model-api/lib/main/model/index.js";

import { DocumentModelData, ElementMapEntry, ExtendedDocumentModel } from "../types/document-model-data.js";

import { DocumentModelEnhancements } from "./document-model-enhancements.js";

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

type DocumentModelDataBuilder = Writeable<
	Omit<DocumentModelData, "typeDefinitions" | "enhancements" | "fieldTypes">
> & {
	enhancements: string[];
	fieldTypes: Record<string, DocumentModel.FieldType>;
};

export namespace DocumentModelUtils {
	export function getDeserializedDocumentModels(models: Model[]) {
		const documentModelMarshaller = new DocumentServiceFactory().getDocumentModelSerializer();
		return models.map(model => {
			return documentModelMarshaller.deserialize(JSON.stringify(DocumentModelUtils.convertTypeDefinition(model)));
		});
	}

	export function getDocumentModelData(model: DocumentModel, locale?: Locale): DocumentModelData {
		const rootGroupsWrapper = model.content.modelRoot;

		const documentModelData: DocumentModelDataBuilder = {
			model,
			elementMap: {},
			enhancements: [],
			annotations: new Set(),
			fieldTypes: {},
		};

		getDocumentModelDataRecursively(
			model.header.id,
			rootGroupsWrapper.elements,
			"",
			"",
			documentModelData,
			false,
			locale
		);

		return {
			...documentModelData,
			typeDefinitions:
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(model.content as any).typeDefinitions || [],
		};
	}

	export function convertTypeDefinition(model: Model): Model {
		if (ExtendedDocumentModel.isInstance(model)) {
			return {
				...model,
				content: {
					...model.content,
					typeDefinitions: model.content.typeDefinitions.map(typeDef => ({
						...typeDef,
						name: [model.header.id, typeDef.name].join("_"),
						fieldType: convertCustomTypeToStringType(typeDef.fieldType),
					})),
				},
			};
		}

		return model;
	}

	export function isGroup(element: DocumentModel.Element): element is DocumentModel.Group {
		return element.type === "Group";
	}

	export function isField(element: DocumentModel.Element): element is DocumentModel.Field {
		return element.type === "Field";
	}
}

function convertCustomTypeToStringType(fieldType: DocumentModel.FieldType) {
	if (fieldType.type === "CustomFieldType") {
		const stringFieldType: DocumentModel.StringType = { type: "StringType" };
		return stringFieldType;
	}

	return fieldType;
}

function getDocumentModelDataRecursively(
	documentModelId: string,
	elements: ReadonlyArray<DocumentModel.Element>,
	subPath: string,
	subIdPath: string,
	documentModelData: DocumentModelDataBuilder,
	parentIsRepeatable: boolean = false,
	locale?: Locale
) {
	let numOfNonRepFieldLeafs = 0;
	for (const subElement of elements) {
		const newPath = `${subPath}/${subElement.name}`;
		const newIdPath = `${subIdPath}/${subElement.id}`;
		if (subElement.type === "Group" && subElement.elements && subElement.elements.length > 0) {
			const subNumOfNonRepFieldLeafs = getDocumentModelDataRecursively(
				documentModelId,
				subElement.elements,
				newPath,
				newIdPath,
				documentModelData,
				parentIsRepeatable || subElement.repeatability > 1,
				locale
			);
			const elementMapEntry: ElementMapEntry = {
				elementPath: newPath,
				isGroup: true,
				repeatability: subElement.repeatability,
				isSubOfRepeatable: parentIsRepeatable,
				element: subElement,
				hasNonRepFieldLeafs: subNumOfNonRepFieldLeafs > 0,
			};

			addElementToModelData(documentModelData, elementMapEntry, documentModelId, newIdPath);

			numOfNonRepFieldLeafs += subNumOfNonRepFieldLeafs;
		} else if (subElement.type === "Field") {
			if (subElement.fieldType) {
				const key = getFieldTypeLabel(subElement.fieldType, locale);
				documentModelData.fieldTypes[key] = subElement.fieldType;
			}

			const elementMapEntry: ElementMapEntry = {
				elementPath: newPath,
				isGroup: false,
				isSubOfRepeatable: parentIsRepeatable,
				element: subElement,
			};

			addElementToModelData(documentModelData, elementMapEntry, documentModelId, newIdPath);

			numOfNonRepFieldLeafs++;
		}
	}
	return !parentIsRepeatable ? numOfNonRepFieldLeafs : 0;
}

function addElementToModelData(
	documentModelData: DocumentModelDataBuilder,
	elementMapEntry: ElementMapEntry,
	documentModelId: string,
	newIdPath: string
) {
	elementMapEntry.element.annotations?.forEach(a => {
		documentModelData.annotations.add(a.name);
	});

	documentModelData.elementMap[newIdPath] = elementMapEntry;

	const enhancements = DocumentModelEnhancements.getDocumentModelEnhancements(elementMapEntry, documentModelId);
	documentModelData.enhancements.push(...enhancements);
}

function getFieldTypeLabel(fieldType: DocumentModel.FieldType, locale?: Locale) {
	const suffix =
		fieldType.type === "EnumerationType" && fieldType.values
			? fieldType.values
					.map(
						v =>
							`${v.label?.find(l => l.locale === locale?.language)?.text || v.label?.[0]?.text}: ${
								v.value
							}`
					)
					.join("; ")
			: Object.entries(fieldType)
					.map(entry => `${entry[0]}: ${entry[1]}`)
					.join("; ");
	const type = fieldType.type;
	return `${type} (${suffix})`;
}

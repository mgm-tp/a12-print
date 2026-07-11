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
import type { DocumentModel, DocumentModelSearchService } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { DocumentServiceFactory } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import type { PartialPrintModel } from "@com.mgmtp.a12.print/print-model-api/model";
import { RuntimeVariableType } from "@com.mgmtp.a12.print/print-model-api/model";
import { ModelPath } from "@com.mgmtp.a12.base/base-model-api";

import type { DocumentModelData } from "../../../a12internal/utils/document-model-data.js";
import type { CollectedPath } from "../../types/reference-path.js";
import { DocumentModelUtils } from "../../../a12internal/utils/document-model-utils.js";

const documentService = new DocumentServiceFactory();

const ADDITIONAL_FIELDS = new Map([
	[
		"listing",
		[
			"value",
			"path",
			"name",
			"depth",
			"isField",
			"currentRepetition",
			"repetitions",
			"currentRepetitionOfParent",
			"repetitionsOfParent",
			"parentName",
			"parentPath",
			"relativeMetadata/label",
			"relativeMetadata/required",
			"relativeMetadata/externalDescription",
			"relativeMetadata/repeatability",
			"relativeMetadata/errorMessage",
		],
	],
]);

export interface ValidationServiceContext {
	allowedSyntheticPaths: string[];
	searchService: DocumentModelSearchService;
	modelId: string;
	alias?: string;
	documentModelData?: DocumentModelData;
}

export type ValidatonServiceFactory = (collectedPath: CollectedPath) => {
	isValidDocumentModelPath: () => boolean;
	isValidEmptyPath: () => boolean;
	isValidSyntheticPath: () => boolean;
	getRelevantDocumentModels: () => string[];
	isPathInListing: () => boolean;
	isPathRepeatable: () => boolean;
};

export namespace ReferencePathValidationService {
	export function createFactory(
		printModel: PartialPrintModel,
		documentModels: readonly DocumentModel[]
	): ValidatonServiceFactory {
		const validationServiceContexts = createValidationServiceContexts(printModel, documentModels);

		return collectedPath => {
			const pathSegments = ModelPath.fromString((collectedPath.documentModelPath ?? "").replaceAll("*", ""));
			const firstPathElement = pathSegments.at(0)?.elementName;
			const documentModelPath = pathSegments.slice(1);

			return {
				isValidDocumentModelPath: () =>
					createIsValidDocumentModelPath(validationServiceContexts, firstPathElement, documentModelPath),
				isValidEmptyPath: () =>
					createIsValidEmptyPath(validationServiceContexts, firstPathElement, documentModelPath),
				isValidSyntheticPath: () => createIsValidSyntheticPath(validationServiceContexts, pathSegments),
				isPathRepeatable: () => createIsPathRepeatable(validationServiceContexts, pathSegments),
				isPathInListing: () => collectedPath.printModelPath.toString().toLowerCase().includes("listing"),
				getRelevantDocumentModels: () => validationServiceContexts.map(dm => dm.modelId),
			};
		};
	}

	function createValidationServiceContexts(
		printModel: PartialPrintModel,
		documentModels: readonly DocumentModel[]
	): ValidationServiceContext[] {
		const documentModelsToCheck: ValidationServiceContext[] = [];

		documentModels.forEach(documentModel => {
			const referenceInPrintModel = printModel.header?.modelReferences?.find(
				e => e.reference === documentModel.header.id
			);
			if (!referenceInPrintModel?.reference) {
				return;
			}

			const { alias, reference: modelId } = referenceInPrintModel;

			const searchService = documentService.getDocumentModelSearchService(documentModel);
			const documentModelData = DocumentModelUtils.getDocumentModelData(documentModel);
			const allowedSyntheticPaths = getAllowedSyntheticPaths(printModel, documentModelData, modelId, alias);

			documentModelsToCheck.push({ searchService, allowedSyntheticPaths, modelId, alias, documentModelData });
		});

		return documentModelsToCheck;
	}

	function createIsValidDocumentModelPath(
		validationServiceContexts: ValidationServiceContext[],
		firstPathElement: string | undefined,
		documentModelPath: ModelPath
	) {
		return validationServiceContexts.some(({ searchService, modelId, alias }) => {
			if (firstPathElement === modelId || firstPathElement === alias) {
				const element = searchService?.getByPath(documentModelPath);
				return !!element;
			}
			return false;
		});
	}

	function createIsValidEmptyPath(
		validationServiceContexts: ValidationServiceContext[],
		firstPathElement: string | undefined,
		documentModelPath: ModelPath
	) {
		return validationServiceContexts.some(({ modelId, alias }) => {
			if (firstPathElement === modelId || firstPathElement === alias) {
				if (!documentModelPath.length || documentModelPath.at(0)?.elementName === "") {
					return true;
				}
			}
			return false;
		});
	}

	function createIsValidSyntheticPath(
		validationServiceContexts: ValidationServiceContext[],
		pathSegments: ModelPath
	) {
		return validationServiceContexts.some(({ allowedSyntheticPaths }) =>
			allowedSyntheticPaths.includes(pathSegments.map(e => e.elementName).join("/"))
		);
	}

	function createIsPathRepeatable(validationServiceContexts: ValidationServiceContext[], pathSegments: ModelPath) {
		const documentModelPath = ModelPath.toString(pathSegments.slice(1));
		return validationServiceContexts.some(({ documentModelData }) => {
			const elementMap = documentModelData?.elementMap || {};
			for (const [, value] of Object.entries(elementMap)) {
				if (value.elementPath === documentModelPath) {
					return value.isSubOfRepeatable || (value.repeatability && value.repeatability > 1);
				}
			}
			return false;
		});
	}

	function getAllowedSyntheticPaths(
		printModel: PartialPrintModel,
		documentModelData: DocumentModelData,
		modelId: string,
		modelAlias?: string
	) {
		const runtimeVariables = printModel.content?.general?.runtimeVariables || [];
		const { annotations, enhancements } = documentModelData;

		const allowedPaths: string[] = [];

		ADDITIONAL_FIELDS.get("listing")?.forEach(option => allowedPaths.push(option));

		annotations.forEach(annotation => allowedPaths.push(`relativeAnnotation/${annotation}`));

		enhancements?.forEach(path => {
			if (path.startsWith(modelId) && modelAlias) {
				allowedPaths.push(path);
				allowedPaths.push(path.replace(modelId, modelAlias));
			} else {
				allowedPaths.push(path);
			}
		});
		runtimeVariables?.forEach(variable => {
			if (variable.type === RuntimeVariableType.StringArray) {
				allowedPaths.push(`runtime/${variable.name}*/value`);
			} else {
				allowedPaths.push(`runtime/${variable.name}`);
			}
		});

		return allowedPaths;
	}
}

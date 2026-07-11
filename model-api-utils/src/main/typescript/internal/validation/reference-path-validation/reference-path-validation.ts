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
import type { PartialPrintModel } from "@com.mgmtp.a12.print/print-model-api/model";
import type { PrintError } from "@com.mgmtp.a12.print/print-model-api/errors";
import { ErrorOrigin, DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/errors";
import type { Localizable } from "@com.mgmtp.a12.utils/utils-localization";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { DocumentServiceFactory } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import type { CollectedPath } from "../../types/reference-path.js";

import { getAllReferencedPaths } from "./partial-print-model-visitor-reference-collector.js";
import { ReferencePathValidationService } from "./reference-path-validation-service.js";

export const documentService = new DocumentServiceFactory();

function isComputationStatement(collectedPath: CollectedPath) {
	return collectedPath.usedIn === "operation" || collectedPath.usedIn === "precondition";
}

export namespace ReferencePathValidation {
	export function validateDocumentModelReferences(
		printModel: PartialPrintModel,
		documentModels: readonly DocumentModel[]
	) {
		let errorMap = DeepPartialErrorMap.getEmptyMap();

		const createReferencePathValidationService = ReferencePathValidationService.createFactory(
			printModel,
			documentModels
		);

		const referencedPaths = getAllReferencedPaths(printModel);

		for (const collectedPath of referencedPaths) {
			if (collectedPath.error) {
				const error = createComputationError(collectedPath);
				errorMap = DeepPartialErrorMap.pushAtPath(errorMap, collectedPath.printModelPath.toArray(), error);
				continue;
			}
			if (!collectedPath.documentModelPath) {
				continue;
			}

			const {
				isValidDocumentModelPath,
				isValidEmptyPath,
				isValidSyntheticPath,
				getRelevantDocumentModels,
				isPathInListing,
				isPathRepeatable,
			} = createReferencePathValidationService(collectedPath);

			if (isValidDocumentModelPath()) {
				if (isComputationStatement(collectedPath) && isPathInListing() && isPathRepeatable()) {
					const error = createComputationOperationAbsolutePathWarning(collectedPath);
					errorMap = DeepPartialErrorMap.pushAtPath(errorMap, collectedPath.printModelPath.toArray(), error);
				}
				continue;
			}
			if (
				(isComputationStatement(collectedPath) && isValidSyntheticPath()) ||
				(!isComputationStatement(collectedPath) && isValidEmptyPath())
			) {
				continue;
			}

			const error = createDocumentModelReferenceError(collectedPath, getRelevantDocumentModels());
			errorMap = DeepPartialErrorMap.pushAtPath(errorMap, collectedPath.printModelPath.toArray(), error);
		}

		return errorMap;
	}

	function createDocumentModelReferenceError(
		collectedPath: CollectedPath,
		relevantDocumentModels?: string[]
	): PrintError {
		const { printModelPath, documentModelPath } = collectedPath;
		const pathError: Localizable = {
			key: "print.validation.error",
			args: {
				documentModelPath: { type: "plain", value: documentModelPath },
				documentModelNames: {
					type: "plain",
					value: `(${relevantDocumentModels?.join("|") || "No Document Model given"})`,
				},
			},
			defaults: {
				en: `The path '$documentModelPath$' can not be resolved in the Document Model $documentModelNames$`,
				de: `Der Pfad '$documentModelPath$' kann nicht aufgelöst werden im Document Model $documentModelNames$`,
			},
		};
		return {
			severity: "ERROR",
			errorCode: pathError.key,
			jsonPath: printModelPath.toArray(),
			origin: ErrorOrigin.VALIDATOR,
			errorMessage: [pathError],
			refId: collectedPath.id,
		};
	}

	function createComputationError(collectedPath: CollectedPath): PrintError {
		const { printModelPath } = collectedPath;
		const pathError: Localizable = {
			key: "print.validation.error",
			args: {},
			defaults: {
				en: `The computation statement is invalid`,
				de: `Der Computation Ausdruck ist ungültig`,
			},
		};
		return {
			severity: "ERROR",
			errorCode: pathError.key,
			jsonPath: printModelPath.toArray(),
			origin: ErrorOrigin.VALIDATOR,
			errorMessage: [pathError],
			refId: collectedPath.id,
		};
	}

	function createComputationOperationAbsolutePathWarning(collectedPath: CollectedPath): PrintError {
		const { printModelPath, documentModelPath } = collectedPath;
		const pathError: Localizable = {
			key: "print.validation.error",
			args: {
				documentModelPath: { type: "plain", value: documentModelPath },
			},
			defaults: {
				en:
					"$documentModelPath$ points to the first element of a repeatable group. " +
					"Use [value] to list all repetitions.",
				de:
					"$documentModelPath$ verweißt auf das erste Element einer wiederholbaren Gruppe. " +
					"Verwenden Sie [value], um alle Wiederholungen anzuzeigen.",
			},
		};
		return {
			severity: "WARNING",
			errorCode: pathError.key,
			jsonPath: printModelPath.toArray(),
			origin: ErrorOrigin.VALIDATOR,
			errorMessage: [pathError],
			refId: collectedPath.id,
		};
	}
}

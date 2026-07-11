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
import type {
	DocumentRtService,
	Document,
	DocumentModel,
	DocumentValidationResult,
	EntityInstancePath,
} from "@com.mgmtp.a12.kernel/kernel-md-facade";
import {
	DeepPartialErrorMap,
	ErrorOrigin,
	ExtendedEntityInstancePath,
} from "@com.mgmtp.a12.print/print-model-api/errors";
import type { PartialPrintModel, PrintModel } from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/utils";

import type { PrintValidator } from "../../a12internal/validation/print-validator.js";

export function fullValidation<T>(
	document: Document,
	documentRtService: DocumentRtService,
	documentModel: DocumentModel,
	relevantPaths: EntityInstancePath[] = []
): PrintValidator.IntegrityReport<T> {
	const validationResult = relevantPaths.length
		? documentRtService.validatePart(document, relevantPaths)
		: documentRtService.validateFull(document);

	const errorMap = getErrorMap(validationResult, documentModel);

	return {
		errorMap,
		document,
		noErrorOccurred: validationResult.noErrorOccurred,
	};
}

function getErrorMap(result: DocumentValidationResult, documentModel: DocumentModel) {
	let errorMap = DeepPartialErrorMap.getEmptyMap();
	const messages = result.messages;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const printModel = (result as any).data.document as PartialPrintModel;
	for (const message of messages) {
		const { entityInstance, errorCode, severity, errorText, rulePath, messageType } = message;
		const refId = getIdForEntityInstancePathInPrintModel(printModel, entityInstance);
		const extendedPath = ExtendedEntityInstancePath.extendEntityInstancePath(entityInstance, documentModel);
		errorMap = DeepPartialErrorMap.pushAtPath(errorMap, extendedPath, {
			jsonPath: extendedPath,
			errorCode,
			severity,
			errorMessage: errorText,
			parameters: {
				rulePath,
				messageType: messageType.toString(),
				messageKey: errorText.length > 0 ? errorText[0].key : undefined,
			},
			origin: ErrorOrigin.VALIDATOR,
			refId,
		});
	}

	return errorMap;
}

function getIdForEntityInstancePathInPrintModel(printModel: PartialPrintModel, path: EntityInstancePath) {
	let printModelPointer = printModel;
	let deepestId = undefined;
	for (let i = 0; i < path.length; i++) {
		const key = path[i].elementName as keyof PartialPrintModel;
		const index = path[i].index - 1;

		if (Array.isArray(printModelPointer[key]) && printModelPointer[key][index]) {
			deepestId = printModelPointer[key][index]["id"] ?? deepestId;
			printModelPointer = printModelPointer[key][index];
		} else if (printModelPointer[key]) {
			deepestId = printModelPointer[key]["id"] ?? deepestId;
			printModelPointer = printModelPointer[key] as DeepPartialRecursive<PrintModel>;
		} else {
			break;
		}
	}
	return deepestId;
}

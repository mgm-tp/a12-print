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
import type { PrintError } from "@com.mgmtp.a12.print/print-model-api/errors";
import {
	ErrorOrigin,
	DeepPartialErrorMap,
	ExtendedEntityInstancePathBuilder,
} from "@com.mgmtp.a12.print/print-model-api/errors";
import type { PartialPrintModel, PrintModel } from "@com.mgmtp.a12.print/print-model-api/model";
import { FRAGMENT_MODEL_REFERENCE_PURPOSE } from "@com.mgmtp.a12.print/print-model-api/model";
import type { Localizable } from "@com.mgmtp.a12.utils/utils-localization";

type DocumentModelMismatch = "differentDocumentModel" | "printModelWithoutDocumentModel";

const MISMATCH_MESSAGES: Record<DocumentModelMismatch, Localizable["defaults"]> = {
	differentDocumentModel: {
		en: `The Fragment Model '$reference$' references a different Document Model than this Print Model`,
		de: `Das Fragment Model '$reference$' referenziert ein anderes Document Model als dieses Print Model`,
	},
	printModelWithoutDocumentModel: {
		en: `The Fragment Model '$reference$' references a Document Model, but this Print Model does not`,
		de: `Das Fragment Model '$reference$' referenziert ein Document Model, dieses Print Model jedoch nicht`,
	},
};

/**
 * Validates that every Fragment Model referenced in the print model header is compatible with the print model's
 * Document Model.
 */
export namespace FragmentDocumentModelValidation {
	export function validateDocumentModelCompatibility(
		printModel: PartialPrintModel,
		fragmentModels: ReadonlyArray<PrintModel>
	) {
		let errorMap = DeepPartialErrorMap.getEmptyMap();
		const documentModels = getDocumentModelReferences(printModel);

		(printModel.header?.modelReferences ?? []).forEach((modelReference, index) => {
			if (modelReference?.modelType !== "print" || modelReference.purpose !== FRAGMENT_MODEL_REFERENCE_PURPOSE) {
				return;
			}
			// A missing fragment model is reported by the reference declaration validation.
			const fragmentModel = fragmentModels.find(model => model.header.id === modelReference.reference);
			if (!fragmentModel) {
				return;
			}
			const mismatch = getDocumentModelMismatch(documentModels, getDocumentModelReferences(fragmentModel));
			if (!mismatch) {
				return;
			}

			const path = ExtendedEntityInstancePathBuilder.ROOT_PATH.with("header")
				.with("modelReferences", index)
				.toArray();
			const error = createDocumentModelMismatchError(
				{ id: modelReference.id, reference: fragmentModel.header.id },
				mismatch,
				path
			);
			errorMap = DeepPartialErrorMap.pushAtPath(errorMap, path, error);
		});

		return errorMap;
	}

	function getDocumentModelReferences(model: PartialPrintModel | PrintModel) {
		return (model.header?.modelReferences ?? [])
			.filter(modelReference => modelReference?.modelType === "document")
			.map(modelReference => modelReference?.reference);
	}

	function getDocumentModelMismatch(
		documentModels: ReadonlyArray<string | undefined>,
		fragmentDocumentModels: ReadonlyArray<string | undefined>
	): DocumentModelMismatch | undefined {
		if (fragmentDocumentModels.length === 0) {
			return undefined;
		}
		if (documentModels.length === 0) {
			return "printModelWithoutDocumentModel";
		}
		const isSame =
			documentModels.length === 1 &&
			fragmentDocumentModels.length === 1 &&
			documentModels[0] === fragmentDocumentModels[0];
		return isSame ? undefined : "differentDocumentModel";
	}

	function createDocumentModelMismatchError(
		modelReference: { id?: string; reference: string },
		mismatch: DocumentModelMismatch,
		path: ReturnType<ExtendedEntityInstancePathBuilder["toArray"]>
	): PrintError {
		const pathError: Localizable = {
			key: "print.validation.error",
			args: {
				reference: { type: "plain", value: modelReference.reference },
			},
			defaults: MISMATCH_MESSAGES[mismatch],
		};

		return {
			severity: "ERROR",
			errorCode: pathError.key,
			jsonPath: path,
			origin: ErrorOrigin.VALIDATOR,
			errorMessage: [pathError],
			refId: modelReference.id,
		};
	}
}

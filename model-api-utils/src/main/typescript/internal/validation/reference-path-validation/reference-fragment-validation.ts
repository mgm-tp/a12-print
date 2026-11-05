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
import { ErrorOrigin, DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/errors";
import type { Localizable } from "@com.mgmtp.a12.utils/utils-localization";
import type { FragmentType, PrintModel } from "@com.mgmtp.a12.print/print-model-api/model";

import type { MissingFragmentReference, ReferenceCollectorResult } from "../../types/reference-path.js";

/** Label used in the error message, per fragment type. */
const FRAGMENT_TYPE_LABEL: Record<FragmentType, string> = {
	element: "Element",
	watermark: "Watermark",
	section: "Section",
	segment: "Segment",
	textStyle: "Text Style",
};

export namespace ReferenceFragmentValidation {
	export function validateFragmentReferences(
		referenceLocations: ReferenceCollectorResult,
		fragmentModels: ReadonlyArray<PrintModel> = []
	) {
		let errorMap = DeepPartialErrorMap.getEmptyMap();
		const availableModelIds = new Set(fragmentModels.map(fragmentModel => fragmentModel.header?.id));

		for (const fragmentReference of referenceLocations.missingFragmentReferences) {
			const error = createFragmentModelReferenceError(
				fragmentReference,
				availableModelIds.has(fragmentReference.model)
			);
			errorMap = DeepPartialErrorMap.pushAtPath(errorMap, fragmentReference.printModelPath.toArray(), error);
		}

		return errorMap;
	}

	function createFragmentModelReferenceError(
		collectedFragmentReference: MissingFragmentReference,
		isModelAvailable: boolean
	): PrintError {
		const { type, model, refId, printModelPath } = collectedFragmentReference;
		const pathError: Localizable = {
			key: "print.validation.error",
			args: {
				type: { type: "plain", value: FRAGMENT_TYPE_LABEL[type] },
				refId: { type: "plain", value: refId },
				model: { type: "plain", value: model },
			},
			defaults: isModelAvailable
				? {
						en: `The $type$ Fragment '$refId$' can not be resolved in the Fragment Model '$model$'`,
						de: `Das $type$-Fragment '$refId$' kann nicht aufgelöst werden im Fragment Model '$model$'`,
					}
				: {
						en: `The $type$ Fragment '$refId$' can not be resolved, no Fragment Model '$model$' given`,
						de: `Das $type$-Fragment '$refId$' kann nicht aufgelöst werden, kein Fragment Model '$model$' vorhanden`,
					},
		};

		return {
			severity: "ERROR",
			errorCode: pathError.key,
			jsonPath: printModelPath.toArray(),
			origin: ErrorOrigin.VALIDATOR,
			errorMessage: [pathError],
			// Tells apart what is wrong with a reference itself from what is wrong inside the entity it refers to.
			parameters: { fragmentType: type },
			refId,
		};
	}
}

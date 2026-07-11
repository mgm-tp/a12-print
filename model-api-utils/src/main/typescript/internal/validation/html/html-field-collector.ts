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
import {
	DeepPartialErrorMap,
	ErrorOrigin,
	ExtendedEntityInstancePathBuilder,
} from "@com.mgmtp.a12.print/print-model-api/errors";
import {
	PartialText,
	type PartialPrintModel,
	type PrintModelElement,
} from "@com.mgmtp.a12.print/print-model-api/model";

import type { HtmlValidationIssue } from "./html-validation-result.js";
import { validateHtml } from "./html-validator.js";

/**
 * Walks the print model document, runs HTML validation on every Text element's `text.text` field,
 * and returns the aggregated errors/warnings as a DeepPartialErrorMap.
 *
 * Only `content.elementDefinitions` entries with `type === "Text"` are inspected.
 * Each field is visited exactly once — no caching needed.
 */
export function collectHtmlErrors<T>(printModel: PartialPrintModel): DeepPartialErrorMap<T> {
	let errorMap = DeepPartialErrorMap.getEmptyMap<T>();
	const elementDefinitions = printModel.content?.elementDefinitions;

	if (!Array.isArray(elementDefinitions)) {
		return errorMap;
	}

	for (let i = 0; i < elementDefinitions.length; i++) {
		const element: PrintModelElement = elementDefinitions[i];
		if (!PartialText.isInstance(element)) continue;

		const html = element.text?.text;
		if (typeof html !== "string" || !html.trim()) continue;

		const result = validateHtml(html);
		if (!result.hasErrors && !result.hasWarnings) continue;

		const path = ExtendedEntityInstancePathBuilder.ROOT_PATH.with("content")
			.with("elementDefinitions", i)
			.toArray();
		const refId = typeof element.id === "string" ? element.id : undefined;

		for (const issue of result.issues) {
			errorMap = DeepPartialErrorMap.pushAtPath(errorMap, path, {
				jsonPath: path,
				errorCode: issue.type,
				severity: issue.severity,
				errorMessage: [toLocalizable(issue)],
				origin: ErrorOrigin.VALIDATOR,
				refId,
			});
		}
	}

	return errorMap;
}

function toLocalizable(issue: HtmlValidationIssue) {
	return {
		key: `html.${issue.type.toLowerCase()}`,
		args: {},
		defaults: { en: issue.message, de: issue.message },
	};
}

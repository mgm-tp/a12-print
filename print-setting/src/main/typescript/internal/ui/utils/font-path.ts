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
	PrintError,
	ExtendedEntityInstancePath,
} from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";

import { PrintSettingModel } from "../../api/model/print-setting-model.js";

import { createFontPathError } from "./font-error.js";
import { fontFormatValidation } from "./font-format.js";

export function expandFontErrorMap(
	errorMap: DeepPartialErrorMap<PrintSettingModel> | undefined,
	fontPathErrors: PrintError[]
): DeepPartialErrorMap<PrintSettingModel> {
	let finalErrorMap = errorMap || DeepPartialErrorMap.getEmptyMap();
	fontPathErrors.forEach(error => {
		finalErrorMap = DeepPartialErrorMap.pushAtPath<PrintSettingModel, PrintSettingModel>(
			finalErrorMap,
			error.jsonPath as ExtendedEntityInstancePath,
			error
		);
	});
	return finalErrorMap;
}

export async function validateAllFontPaths(
	printSetting: PrintSettingModel | undefined,
	validateFontPath: (path: string) => Promise<boolean>
): Promise<PrintError[]> {
	if (!printSetting) {
		return [];
	}

	const errors: PrintError[] = [];
	const promises: Promise<void>[] = [];
	printSetting.content?.settings?.fonts?.forEach(({ path }, index) => {
		if (path) {
			//validate path exists
			promises.push(
				validateFontPath(path).then(isValid => {
					if (!isValid) {
						errors.push(createFontPathError(index));
					}
				})
			);
			// validate font extension
			const extension = path.split(".").pop()?.toLowerCase() || "";
			const fontValidationError = fontFormatValidation(extension, index);
			fontValidationError && errors.push(fontValidationError);
		}
	});

	await Promise.all(promises);

	return errors;
}

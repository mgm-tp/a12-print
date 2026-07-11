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
import type { ICustomFieldTypeCheckError } from "@com.mgmtp.a12.kernel/kernel-core-runtime-api-ts";
import { StaticResourceProvider } from "@com.mgmtp.a12.kernel/kernel-core-runtime-api-ts";
import type { Localizable, LocalizableArgs, PlainPlaceholder } from "@com.mgmtp.a12.utils/utils-localization";

import { PrintDateTimeFormatErrorEnum } from "./error-enum.js";
import { PrintDateTimeFormatErrorImpl } from "./check-error-impl.js";
import en from "./bundles/en.js";
import de from "./bundles/de.js";

const defaultResourceProvider = new StaticResourceProvider(en, de);

export class PrintDateTimeFormatErrorUtil {
	static getResult(
		error: PrintDateTimeFormatErrorEnum,
		errorKey: string,
		args?: LocalizableArgs
	): ICustomFieldTypeCheckError | undefined {
		const errorMessage = PrintDateTimeFormatErrorUtil.getLocalizableErrorMessage(error, args);
		if (!errorMessage) {
			return undefined;
		}
		return new PrintDateTimeFormatErrorImpl([errorMessage], errorKey);
	}

	static createPlainPlaceholder(value: string): PlainPlaceholder {
		return { type: "plain", value };
	}

	private static getLocalizableErrorMessage(
		error: PrintDateTimeFormatErrorEnum,
		args?: LocalizableArgs
	): Localizable | undefined {
		if (PrintDateTimeFormatErrorEnum.NO_MISTAKE === error) {
			return undefined;
		}
		const key = PrintDateTimeFormatErrorUtil.createCustomTypeErrorKey(error);
		const defaults = PrintDateTimeFormatErrorUtil.getAllErrorTexts(error);
		return {
			key,
			defaults,
			args,
		};
	}

	private static createCustomTypeErrorKey(error: PrintDateTimeFormatErrorEnum): string {
		return `kernel.customTypeErrors.${PrintDateTimeFormatErrorEnum[error]}`;
	}

	private static getAllErrorTexts(key: PrintDateTimeFormatErrorEnum): {
		readonly [locale: string]: string | undefined;
	} {
		return defaultResourceProvider.getAllTextsForKey(PrintDateTimeFormatErrorEnum[key]);
	}
}

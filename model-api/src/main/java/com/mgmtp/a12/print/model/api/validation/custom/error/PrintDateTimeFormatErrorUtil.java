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
package com.mgmtp.a12.print.model.api.validation.custom.error;

import com.mgmtp.a12.kernel.core.customfieldtype.ICustomFieldTypeCheckError;
import java.util.Locale;
import java.util.Optional;
import java.util.ResourceBundle;

public class PrintDateTimeFormatErrorUtil {

	public static final String ERROR_MESSAGES_RESOURCE_NAME = "custom_field_types/error_messages";

	private PrintDateTimeFormatErrorUtil() {
		throw new UnsupportedOperationException("No instantiation for PrintDateTimeFormatErrorUtil!");
	}

	public static Optional<ICustomFieldTypeCheckError> getResult(PrintDateTimeFormatErrorEnum error, Locale locale,
																 String errorKey) {
		String errorMsg = getErrorMessage(locale, error);
		if (errorMsg.isEmpty()) {
			return Optional.empty();
		}
		return Optional.of(new PrintDateTimeFormatErrorImpl(errorMsg, errorKey));
	}

	public static String getErrorMessage(Locale locale, PrintDateTimeFormatErrorEnum error) {
		return getErrorMessage(locale, error.name());
	}

	private static String getErrorMessage(Locale locale, String error) {
		if (PrintDateTimeFormatErrorEnum.NO_MISTAKE.name().equals(error)) {
			return "";
		}

		ResourceBundle bundle = ResourceBundle.getBundle(ERROR_MESSAGES_RESOURCE_NAME, locale);
		return bundle.getString(error);
	}

}

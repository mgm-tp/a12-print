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
package com.mgmtp.a12.print.model.api.validation.custom;

import com.mgmtp.a12.kernel.core.customfieldtype.ICustomFieldType;
import com.mgmtp.a12.kernel.core.customfieldtype.ICustomFieldTypeCheckError;
import com.mgmtp.a12.kernel.core.customfieldtype.ICustomFieldTypeConversionResult;
import com.mgmtp.a12.kernel.core.customfieldtype.ICustomFieldTypeValidationParam;
import com.mgmtp.a12.print.model.api.validation.custom.error.PrintDateTimeFormatErrorEnum;
import com.mgmtp.a12.print.model.api.validation.custom.error.PrintDateTimeFormatErrorImpl;
import com.mgmtp.a12.print.model.api.validation.custom.error.PrintDateTimeFormatErrorUtil;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PrintDateTimeFormat implements ICustomFieldType {

	private static final Logger logger = LoggerFactory.getLogger(PrintDateTimeFormat.class);
	private static final PrintDateTimeFormat instance = new PrintDateTimeFormat();
	public static final String TYPE_NAME = "PrintDateTimeFormat";

	public static PrintDateTimeFormat getInstance() {
		return instance;
	}

	@Override
	public Optional<ICustomFieldTypeCheckError> validate(String value, ICustomFieldTypeValidationParam valParam, boolean isDisplayValue, Map<String, Object> map) {
		try {
			DateTimeFormatter.ofPattern(value).withZone(ZoneId.systemDefault());
			return Optional.empty();
		} catch (Exception e) {
			String invalidCharacter = "";
			PrintDateTimeFormatErrorEnum error = PrintDateTimeFormatErrorEnum.DATE_INVALID;

			if (e instanceof IllegalArgumentException) {
				String exceptionMessage = e.getMessage();
				if (exceptionMessage.contains("incomplete string literal")) {
					error = PrintDateTimeFormatErrorEnum.UNTERMINATED_QUOTE;
				} else if (exceptionMessage.contains("Illegal pattern character")) {
					invalidCharacter = getInvalidCharacter(exceptionMessage, Pattern.compile("'(.+?)'"));
					error = PrintDateTimeFormatErrorEnum.PATTERN_CHARACTER_INVALID;
				} else if (exceptionMessage.contains("contains ] without previous [")) {
					error = PrintDateTimeFormatErrorEnum.OPTIONAL_SECTION_CLOSED_UNOPENED;
				} else if (exceptionMessage.contains("Too many pattern letters")) {
					invalidCharacter = getInvalidCharacter(exceptionMessage, Pattern.compile(": (.+?)"));
					error = PrintDateTimeFormatErrorEnum.CHARACTER_MAX_REPETITION_EXCEEDED;
				}
			}

			String errorMsg = PrintDateTimeFormatErrorUtil.getErrorMessage(valParam.getErrorMsgLocale(), error);
			if (StringUtils.isNotEmpty(invalidCharacter)) {
				errorMsg = errorMsg.replace("<invalidChar>", invalidCharacter);
			}
			return Optional.of(
				new PrintDateTimeFormatErrorImpl(errorMsg, PrintDateTimeFormatErrorEnum.DATE_INVALID.name()));
		}
	}

	private String getInvalidCharacter(String message, Pattern pattern) {
		try {
			Matcher matcher = pattern.matcher(message);

			if (matcher.find()) {
				return matcher.group(1);
			}
			return "";
		} catch (Exception e) {
			logger.error("Error when getting an invalid character");
			return "";
		}

	}

	@Override
	public ICustomFieldTypeConversionResult convertDisplay2Internal(String displayValue, Map<String, Object> map) {
		return new ICustomFieldTypeConversionResult() {
			public Optional<String> getErrorMessage() {
				return Optional.empty();
			}

			public String getConvertedValue() {
				return displayValue;
			}
		};
	}

	@Override
	public ICustomFieldTypeConversionResult convertInternal2Display(String internalValue, Map<String, Object> map) {
		return new ICustomFieldTypeConversionResult() {
			public Optional<String> getErrorMessage() {
				return Optional.empty();
			}

			public String getConvertedValue() {
				return internalValue;
			}
		};
	}
}

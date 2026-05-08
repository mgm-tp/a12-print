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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.formatter;

import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Constant;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.FormattingResult;
import com.mgmtp.a12.print.model.api.model.element.base.DisplayOptions;
import lombok.Builder;
import lombok.Data;
import lombok.NonNull;
import org.apache.commons.lang3.StringUtils;

import java.util.Locale;
import java.util.Objects;
import java.util.TimeZone;


public class BooleanTypeFormatter implements ValueFormatProvider {


	@Override
	public boolean isSupported(ValueFormatProvider.FormattingDetails details) {
		return details instanceof FormattingDetails;
	}

	public @NonNull FormattingResult format(@NonNull final FormattingParameters parameters) {
		final var value = parameters.value();
		final var isTrue = Objects.equals(value, true)
			|| ( value instanceof String && Constant.TRUE.getValue().equalsIgnoreCase((String) value));
		final var formattingDetails = (FormattingDetails) parameters.formattingDetails();

		if (formattingDetails.getDisplayType() == DisplayOptions.DisplayType.CHECKBOX) {
			final var formattedValue = isTrue
				? formattingDetails.getCheckboxCheckedValue()
				: formattingDetails.getCheckboxUncheckedValue();
			return new FormattingResult(formattedValue, parameters.isHtml());
		}
		return new FormattingResult(Boolean.toString(isTrue), parameters.isHtml());
	}

	@Data
	@Builder(toBuilder = true)
	public static class FormattingDetails implements ValueFormatProvider.FormattingDetails {

		private final DisplayOptions.DisplayType displayType;
		private final String checkboxCheckedValue;
		private final String checkboxUncheckedValue;

		private String getCheckboxCheckedValue() {
			if (StringUtils.isNotBlank(checkboxCheckedValue)) {
				return checkboxCheckedValue;
			}
			return Boolean.TRUE.toString();
		}

		private String getCheckboxUncheckedValue() {
			if (StringUtils.isNotBlank(checkboxUncheckedValue)) {
				return checkboxUncheckedValue;
			}
			return Boolean.FALSE.toString();
		}
	}


}

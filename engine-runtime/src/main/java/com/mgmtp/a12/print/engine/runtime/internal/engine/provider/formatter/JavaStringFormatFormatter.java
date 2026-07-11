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

import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.FormattingResult;
import lombok.Builder;
import lombok.Data;
import lombok.NonNull;

public class JavaStringFormatFormatter implements ValueFormatProvider {

	@Override
	public boolean isSupported(ValueFormatProvider.FormattingDetails details) {
		return true;
	}

	public @NonNull FormattingResult format(@NonNull final FormattingParameters parameters) {
		final var value = parameters.value();
		final var formattingDetails = parameters.formattingDetails();
		final var isHtml = parameters.isHtml();

		if (
			value instanceof String valueAsString &&
			formattingDetails instanceof FormattingDetails stringFormattingDetails &&
			stringFormattingDetails.isLineBreakPermitted()
		) {
			if (!isHtml) {
				valueAsString = StringEscapeUtils.escapeXHTML(valueAsString);
			}

			valueAsString = valueAsString.replaceAll(Constants.NEW_LINE, Constants.BR_TAG);

			if (stringFormattingDetails.getFormatParams().length == 0) {
				stringFormattingDetails = stringFormattingDetails.toBuilder()
					.formatParams(new Object[] { valueAsString })
					.build();
			}
			return FormattingResult.builder()
				.formattedValue(
					String.format(stringFormattingDetails.getFormatString(), stringFormattingDetails.getFormatParams())
				)
				.isHtml(true)
				.build();
		}
		return new FormattingResult(String.format(Constants.STRING_FORMAT, value), isHtml);
	}

	@Data
	@Builder(toBuilder = true)
	public static class FormattingDetails implements ValueFormatProvider.FormattingDetails {

		public static final FormattingDetails DEFAULT = FormattingDetails.builder().build();

		@NonNull
		@Builder.Default
		private final String formatString = Constants.STRING_FORMAT;

		@Builder.Default
		private final boolean lineBreakPermitted = false;

		@NonNull
		@Builder.Default
		private final Object[] formatParams = new Object[0];

	}
}

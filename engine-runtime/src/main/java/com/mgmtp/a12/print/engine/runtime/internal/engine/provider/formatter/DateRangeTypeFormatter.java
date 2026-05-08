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

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.FormattingResult;
import lombok.Builder;
import lombok.Data;
import lombok.NonNull;

import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

public class DateRangeTypeFormatter implements ValueFormatProvider {

	@Override
	public boolean isSupported(ValueFormatProvider.FormattingDetails details) {
		return details instanceof FormattingDetails;
	}

	public @NonNull FormattingResult format(@NonNull final FormattingParameters parameters) {
		final var value = parameters.value();
		final var dateRangeFormattingDetails = (FormattingDetails) parameters.formattingDetails();

		final var formatterFrom = DateTimeFormatter.ofPattern(dateRangeFormattingDetails.getDateTimeFormatFrom(), parameters.locale());
		final var formatterTo = DateTimeFormatter.ofPattern(dateRangeFormattingDetails.getDateTimeFormatTo(), parameters.locale());

		if (value instanceof Date[] dateRangeValue && ((Date[]) value).length == 2) {
			final var from = DateTimeLikeTypeFormatter.getDateInTimeZone(dateRangeValue[0], parameters.timeZone());
			final var to = DateTimeLikeTypeFormatter.getDateInTimeZone(dateRangeValue[1], parameters.timeZone());
			final var formattedValue = String.join(
				dateRangeFormattingDetails.getDelimiter(),
				List.of(
					DateTimeLikeTypeFormatter.formatWith(from, formatterFrom),
					DateTimeLikeTypeFormatter.formatWith(to, formatterTo)
				)
			);
			return new FormattingResult(formattedValue, parameters.isHtml());
		}
		throw new PrintException("Unsupported field value for date range type: {}", value);
	}

	@Data
	@Builder(toBuilder = true)
	public static class FormattingDetails implements ValueFormatProvider.FormattingDetails {
		@NonNull
		private final String dateTimeFormatFrom;
		@NonNull
		private final String dateTimeFormatTo;
		@NonNull
		private final String delimiter;
	}
}

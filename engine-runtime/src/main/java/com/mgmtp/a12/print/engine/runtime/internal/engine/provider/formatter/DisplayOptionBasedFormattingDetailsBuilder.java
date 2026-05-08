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

import com.mgmtp.a12.print.model.api.model.element.base.DisplayOptions;
import lombok.Builder;
import lombok.Data;
import lombok.NonNull;

@Data
@Builder
public class DisplayOptionBasedFormattingDetailsBuilder implements FormattingDetailsVisitor {

	private final DisplayOptions displayOptions;

	public ValueFormatProvider.FormattingDetails build() {
		if (displayOptions != null && displayOptions.getDisplayType().isPresent()) {
			switch (displayOptions.getDisplayType().get()) {
				case HTML:
					return ValueFormatProvider.FormattingDetails.plainString();
				case DATE: {
					var details = DateTimeLikeTypeFormatter.FormattingDetails.builder();
					applyDateDisplayOptions(details);
					return details.build();
				}
				case DATE_RANGE: {
					var details = DateRangeTypeFormatter.FormattingDetails.builder();
					applyDateRangeDisplayOptions(details);
					return details.build();
				}
				case CHECKBOX: {
					var details = BooleanTypeFormatter.FormattingDetails.builder();
					applyBooleanDisplayOptions(details);
					return details.build();
				}
			}
		}
		return ValueFormatProvider.FormattingDetails.plainString();
	}

	@Override
	public @NonNull ValueFormatProvider.FormattingDetails visit(BooleanTypeFormatter.FormattingDetails formattingDetails) {
		if (
			displayOptions.getDisplayType().isPresent() &&
				!displayOptions.getDisplayType().get().equals(DisplayOptions.DisplayType.CHECKBOX)
		) {
			return formattingDetails;
		}
		var details = formattingDetails.toBuilder();
		applyBooleanDisplayOptions(details);
		return details.build();
	}

	@Override
	public @NonNull ValueFormatProvider.FormattingDetails visit(NumberTypeFormatter.FormattingDetails formattingDetails) {
		return formattingDetails.toBuilder().build();
	}

	private void applyBooleanDisplayOptions(BooleanTypeFormatter.FormattingDetails.FormattingDetailsBuilder details) {
		details.displayType(DisplayOptions.DisplayType.CHECKBOX);
		displayOptions.getCheckboxChecked().ifPresent(details::checkboxCheckedValue);
		displayOptions.getCheckboxUnchecked().ifPresent(details::checkboxUncheckedValue);
	}

	@Override
	public @NonNull ValueFormatProvider.FormattingDetails visit(ConfirmTypeFormatter.FormattingDetails formattingDetails) {
		if (
			displayOptions.getDisplayType().isPresent() &&
				!displayOptions.getDisplayType().get().equals(DisplayOptions.DisplayType.CHECKBOX)
		) {
			return formattingDetails;
		}
		var details = formattingDetails.toBuilder();
		details.displayType(DisplayOptions.DisplayType.CHECKBOX);
		displayOptions.getCheckboxChecked().ifPresent(details::checkboxCheckedValue);
		return details.build();
	}

	@Override
	public @NonNull ValueFormatProvider.FormattingDetails visit(DateRangeTypeFormatter.FormattingDetails formattingDetails) {
		if (
			displayOptions.getDisplayType().isPresent() &&
				!displayOptions.getDisplayType().get().equals(DisplayOptions.DisplayType.DATE_RANGE)
		) {
			return formattingDetails;
		}

		var details = formattingDetails.toBuilder();
		applyDateRangeDisplayOptions(details);
		return details.build();
	}

	private void applyDateRangeDisplayOptions(DateRangeTypeFormatter.FormattingDetails.FormattingDetailsBuilder details) {
		displayOptions.getDateRangeFormatStart().ifPresent(details::dateTimeFormatFrom);
		displayOptions.getDateRangeFormatEnd().ifPresent(details::dateTimeFormatTo);
		displayOptions.getDateRangeDelimiter().ifPresent(details::delimiter);
	}

	@Override
	public @NonNull ValueFormatProvider.FormattingDetails visit(DateTimeLikeTypeFormatter.FormattingDetails formattingDetails) {
		if (
			displayOptions.getDisplayType().isPresent() &&
				!displayOptions.getDisplayType().get().equals(DisplayOptions.DisplayType.DATE)
		) {
			return formattingDetails;
		}

		var details = formattingDetails.toBuilder();
		applyDateDisplayOptions(details);
		return details.build();
	}

	@Override
	public @NonNull ValueFormatProvider.FormattingDetails visit(
		JavaStringFormatFormatter.FormattingDetails formattingDetails
	) {
		return formattingDetails;

	}

	@Override
	public @NonNull ValueFormatProvider.FormattingDetails visit(EnumerationTypeFormatter.FormattingDetails formattingDetails) {
		return formattingDetails;
	}

	private void applyDateDisplayOptions(DateTimeLikeTypeFormatter.FormattingDetails.FormattingDetailsBuilder details) {
		displayOptions.getDateFormat().ifPresent(details::dateTimeFormat);
	}

}

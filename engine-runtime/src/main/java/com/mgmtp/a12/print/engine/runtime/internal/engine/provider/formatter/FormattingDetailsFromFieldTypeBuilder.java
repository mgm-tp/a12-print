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

import com.mgmtp.a12.kernel.md.model.api.fieldtypes.*;
import com.mgmtp.a12.kernel.md.model.internal.wrapper.fieldtypes.StringTypeWrapper;
import lombok.NonNull;

class FormattingDetailsFromFieldTypeBuilder {


	public @NonNull ValueFormatProvider.FormattingDetails build(IFieldType fieldType) {
		return new FieldTypeVisitor().visit(fieldType);
	}

	private static class FieldTypeVisitor implements com.mgmtp.a12.print.engine.runtime.kernel.internal.kernel.FieldTypeVisitor<ValueFormatProvider.FormattingDetails> {

		@Override
		public @NonNull BooleanTypeFormatter.FormattingDetails visit(IBooleanType fieldType) {
			return BooleanTypeFormatter.FormattingDetails
				.builder()
				.build();
		}

		@Override
		public @NonNull ConfirmTypeFormatter.FormattingDetails visit(IConfirmType fieldType) {
			return ConfirmTypeFormatter.FormattingDetails
				.builder()
				.checkboxCheckedValue("true")
				.build();
		}

		@Override
		public @NonNull NumberTypeFormatter.FormattingDetails visit(INumberType fieldType) {
			return NumberTypeFormatter.FormattingDetails
				.builder()
				.maxFractionalDigits(fieldType.getMaxFractionalDigits())
				.minFractionalDigits(fieldType.getMinFractionalDigits())
				.maxIntegerDigits(fieldType.getMaxIntegerDigits().orElse(null))
				.build();
		}

		@Override
		public @NonNull DateTimeLikeTypeFormatter.FormattingDetails visit(ITimeType fieldType) {
			return DateTimeLikeTypeFormatter.FormattingDetails
				.builder()
				.dateTimeFormat(fieldType.getFormat())
				.build();
		}

		@Override
		public @NonNull DateTimeLikeTypeFormatter.FormattingDetails visit(IDateTimeType fieldType) {
			return DateTimeLikeTypeFormatter.FormattingDetails
				.builder()
				.dateTimeFormat(fieldType.getFormat())
				.build();
		}

		@Override
		public @NonNull DateTimeLikeTypeFormatter.FormattingDetails visit(IDateType fieldType) {
			return DateTimeLikeTypeFormatter.FormattingDetails
				.builder()
				.dateTimeFormat(fieldType.getFormat())
				.build();
		}

		@Override
		public @NonNull DateTimeLikeTypeFormatter.FormattingDetails visit(IDateFragmentType fieldType) {
			return DateTimeLikeTypeFormatter.FormattingDetails
				.builder()
				.dateTimeFormat(fieldType.getFormatOfFragment())
				.build();
		}


		@Override
		public @NonNull DateRangeTypeFormatter.FormattingDetails visit(IDateRangeType fieldType) {
			return DateRangeTypeFormatter.FormattingDetails
				.builder()
				.dateTimeFormatFrom(fieldType.getFormat())
				.dateTimeFormatTo(fieldType.getFormat())
				.delimiter(fieldType.getRangeSeparator())
				.build();
		}

		@Override
		public ValueFormatProvider.FormattingDetails visit(IEnumerationType fieldType) {
			final var builder = EnumerationTypeFormatter
				.FormattingDetails
				.builder();

			for (var value : fieldType.getValues()) {
				builder.translation(value.getValue(), value.getLabel());
			}

			return builder.build();
		}

		@Override
		public @NonNull ValueFormatProvider.FormattingDetails visitNotSupported(IFieldType fieldType) {
			return ValueFormatProvider.FormattingDetails.plainString();
		}

		@Override
		public ValueFormatProvider.FormattingDetails visit(IStringType fieldType) {
			return JavaStringFormatFormatter.FormattingDetails
				.builder()
				.lineBreakPermitted(fieldType.isLineBreaksPermitted())
				.build();
		}

		@Override
		public ValueFormatProvider.FormattingDetails visitNotImplemented(IFieldType fieldType) {
			if (fieldType instanceof StringTypeWrapper stringTypeWrapper && stringTypeWrapper.isLineBreaksPermitted()) {
				return JavaStringFormatFormatter.FormattingDetails
					.builder()
					.lineBreakPermitted(stringTypeWrapper.isLineBreaksPermitted())
					.build();
			}
			return ValueFormatProvider.FormattingDetails.plainString();
		}
	}

}

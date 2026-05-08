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

import com.mgmtp.a12.kernel.md.model.api.fieldtypes.IFieldType;
import com.mgmtp.a12.print.engine.runtime.internal.PrintEngineRuntimeDependency;
import com.mgmtp.a12.print.engine.runtime.internal.RuntimeType;
import com.mgmtp.a12.print.engine.runtime.internal.engine.ValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.FormattingResult;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.ComputationFieldType;
import com.mgmtp.a12.print.model.api.model.element.base.DisplayOptions;
import lombok.Data;
import lombok.NonNull;
import lombok.experimental.SuperBuilder;

import java.util.Optional;


@Data
@SuperBuilder
@PrintEngineRuntimeDependency(type = RuntimeType.CORE)
public class FormattedValueDependency implements ValueDependency<FormattingResult> {

	public static final String DEFAULT_DATE_FORMAT = "yyyy-MM-dd";
	public static final String DEFAULT_DATE_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";
	public static final String DEFAULT_TIME_FORMAT = "HH:mm:ss";
	public static final String A12_DATE_RANGE_SEPARATOR = "/";
	private final ValueFormatProvider.FormattingDetails formattingDetails;
	private final DisplayOptions.DisplayType displayType;
	private final Object value;
	private String prefix;
	private String suffix;

	private static ValueFormatProvider.FormattingDetails fromComputationFieldType(ComputationFieldType computationFieldType) {
		return switch (computationFieldType) {
			case NUMBER -> NumberTypeFormatter.FormattingDetails.builder().build();
			case BOOLEAN -> BooleanTypeFormatter.FormattingDetails.builder().build();
			case DATE_TIME ->
				DateTimeLikeTypeFormatter.FormattingDetails.builder().dateTimeFormat(DEFAULT_DATE_TIME_FORMAT).build();
			case TIME ->
				DateTimeLikeTypeFormatter.FormattingDetails.builder().dateTimeFormat(DEFAULT_TIME_FORMAT).build();
			case DATE, DATE_FRAGMENT ->
				DateTimeLikeTypeFormatter.FormattingDetails.builder().dateTimeFormat(DEFAULT_DATE_FORMAT).build();
			case DATE_RANGE ->
				DateRangeTypeFormatter.FormattingDetails.builder().dateTimeFormatFrom(DEFAULT_DATE_FORMAT).dateTimeFormatTo(DEFAULT_DATE_FORMAT).delimiter(A12_DATE_RANGE_SEPARATOR).build();
			default -> ValueFormatProvider.FormattingDetails.plainString();
		};
	}


	public static FormattedValueDependency buildFrom(
		Object evaluatedValue,
		DisplayOptions displayOptionParam,
		ComputationFieldType computationFieldType
	) {
		final var displayOptionOptional = Optional.ofNullable(displayOptionParam);

		final var formattingDetails
			= Optional.ofNullable(computationFieldType)
					  .map(fieldType -> displayOptionOptional
						  .map(displayOptions ->
							  new DisplayOptionBasedFormattingDetailsBuilder(displayOptions).visit(fromComputationFieldType(fieldType))
						  )
						  .orElseGet(() -> fromComputationFieldType(fieldType))
					  ).orElseGet(() ->
				displayOptionOptional
					.map(FormattedValueDependency::getFormattingDetails)
					.orElseGet(ValueFormatProvider.FormattingDetails::plainString)
			);

		final var formattingDependency
			= FormattedValueDependency.builder()
									  .value(evaluatedValue)
									  .formattingDetails(formattingDetails);

		displayOptionOptional
			.flatMap(DisplayOptions::getDisplayType)
			.ifPresent(formattingDependency::displayType);

		displayOptionOptional
			.flatMap(DisplayOptions::getSuffix)
			.ifPresent(formattingDependency::suffix);

		return formattingDependency.build();

	}

	public static FormattedValueDependency buildFrom(
		Object evaluatedValue,
		DisplayOptions displayOptionParam,
		IFieldType fieldTypeOption
	) {

		final var displayOptionOptional = Optional.ofNullable(displayOptionParam);

		final var formattingDetails
			= Optional.ofNullable(fieldTypeOption)
					  .map(fieldType -> displayOptionOptional
						  .map(displayOptions -> getFormattingDetails(
							  displayOptions,
							  fieldType
						  ))
						  .orElseGet(() -> getFormattingDetails(fieldType))
					  ).orElseGet(() ->
				displayOptionOptional
					.map(FormattedValueDependency::getFormattingDetails)
					.orElseGet(ValueFormatProvider.FormattingDetails::plainString)
			);

		final var formattingDependency
			= FormattedValueDependency.builder()
									  .value(evaluatedValue)
									  .formattingDetails(formattingDetails);

		displayOptionOptional
			.flatMap(DisplayOptions::getDisplayType)
			.ifPresent(formattingDependency::displayType);

		displayOptionOptional
			.flatMap(DisplayOptions::getSuffix)
			.ifPresent(formattingDependency::suffix);

		return formattingDependency.build();
	}

	private static @NonNull ValueFormatProvider.FormattingDetails getFormattingDetails(@NonNull IFieldType fieldType) {
		return new FormattingDetailsFromFieldTypeBuilder().build(fieldType);
	}

	private static @NonNull ValueFormatProvider.FormattingDetails getFormattingDetails(@NonNull DisplayOptions displayOptions) {
		return new DisplayOptionBasedFormattingDetailsBuilder(displayOptions).build();
	}

	private static @NonNull ValueFormatProvider.FormattingDetails getFormattingDetails(@NonNull DisplayOptions displayOptions, @NonNull IFieldType fieldType) {
		return new FormattingDetailsBuilderWithDisplayOptions(displayOptions).build(fieldType);
	}

	public Optional<Object> getValue() {
		return Optional.ofNullable(value);
	}


}

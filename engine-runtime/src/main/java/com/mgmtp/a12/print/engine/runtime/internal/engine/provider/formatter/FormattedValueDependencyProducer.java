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

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.CoreDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.html.SanitizeValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.FormattingResult;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntime;
import com.mgmtp.a12.print.model.api.model.element.base.DisplayOptions;
import lombok.Data;
import lombok.NonNull;
import lombok.Singular;
import org.apache.commons.lang3.StringUtils;

import java.util.List;


@Data
public class FormattedValueDependencyProducer implements CoreDependencyValueProvider<FormattingResult, FormattedValueDependency> {

	@NonNull
	@Singular
	public final List<ValueFormatProvider> typeFormatters;

	public FormattedValueDependencyProducer() {
		this.typeFormatters = List.of(
			new NumberTypeFormatter(),
			new BooleanTypeFormatter(),
			new ConfirmTypeFormatter(),
			new DateRangeTypeFormatter(),
			new DateTimeLikeTypeFormatter(),
			new EnumerationTypeFormatter(),
			// Fallback
			new JavaStringFormatFormatter()
		);
	}

	@Override
	public ValueFactory<FormattingResult> produce(FormattedValueDependency dependency, PrintJob job, PrintEngine<?> engine, InternalCorePrintEngineRuntime runtime) {
		final var valueOptional = dependency.getValue();
		final var prefix = StringUtils.defaultString(dependency.getPrefix());
		final var suffix = StringUtils.defaultString(dependency.getSuffix());

		final FormattingResult formattingResult = valueOptional
			.map(value ->
				typeFormatters
					.stream()
					.filter(e -> e.isSupported(dependency.getFormattingDetails()))
					.findFirst()
					.map(typeFormatter ->
						typeFormatter.format(
							new ValueFormatProvider.FormattingParameters(
								dependency.getFormattingDetails(),
								dependency.getDisplayType(),
								value,
								job.getLocale(),
								job.getTimeZone()
							)
						)
					)
					.orElseThrow(() -> new PrintException("invalid FormattedValueDependencyProducer Setup. Fallback is missing."))
			)
			.orElse(FormattingResult.builder().formattedValue(Constants.EMPTY_STRING).build());

		var outputValue = String.format("%s%s%s", prefix, formattingResult.getFormattedValue(), suffix);

		if (needSanitize(dependency, formattingResult)) {
			outputValue = runtime.provide(new SanitizeValueDependency(outputValue)).get();
		}
		formattingResult.setFormattedValue(outputValue);
		return () -> formattingResult;
	}

	private boolean needSanitize(final FormattedValueDependency dependency, FormattingResult formattingResult) {
		return dependency.getDisplayType() == DisplayOptions.DisplayType.HTML ||
			dependency.getDisplayType() == DisplayOptions.DisplayType.CHECKBOX ||
			formattingResult.isHtml();
	}

}

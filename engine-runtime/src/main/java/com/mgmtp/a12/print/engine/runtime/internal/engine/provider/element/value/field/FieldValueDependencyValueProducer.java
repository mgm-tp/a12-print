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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.field;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.CoreDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.fieldType.FieldTypeDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.formatter.FormattedValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.html.SanitizeValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.FormattingResult;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntime;
import com.mgmtp.a12.print.model.api.model.element.base.DisplayOptions;
import lombok.extern.slf4j.Slf4j;

import java.util.Optional;


@Slf4j
public class FieldValueDependencyValueProducer implements CoreDependencyValueProvider<Optional<FormattingResult>, FieldValueDependency> {

	@Override
	public ValueFactory<Optional<FormattingResult>> produce(FieldValueDependency dependency, PrintJob job, PrintEngine<?> engine, InternalCorePrintEngineRuntime runtime) {

		final var printDocumentContext = dependency.getPrintDocumentContext();
		final var printField = dependency.getField();
		final var path = printField.getFieldProperties().getPath();
		var model = printField.getFieldProperties().getModel();
		final var isHTML = printField.getFieldProperties()
			.getDisplayOptions()
			.map(DisplayOptions::isHtml)
			.orElse(false);

		final var fieldType = runtime.provide(
			new FieldTypeDependency(model, path, printField.getId(), printDocumentContext)
		).get();

		final var formattingResult = printDocumentContext.findSingleFieldInstance(path)
			.flatMap(PrintDocumentContext.Entity::getValue)
			.flatMap(value -> runtime.provide(
				FormattedValueDependency.buildFrom(
					value,
					printField.getFieldProperties().getDisplayOptions().orElse(null),
					fieldType
				))
				.map(Optional::ofNullable).get()
			)
			.map(value -> {
				if (isHTML) {
					value.setFormattedValue(
						runtime.provide(new SanitizeValueDependency(value.getFormattedValue())).get()
					);
				}
				return value;
			});
		return () -> formattingResult;
	}

}

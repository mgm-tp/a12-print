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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.calculation;

import com.mgmtp.a12.kernel.md.model.a12internal.fieldtypes.BooleanType;
import com.mgmtp.a12.kernel.md.model.a12internal.fieldtypes.NumberType;
import com.mgmtp.a12.kernel.md.model.a12internal.fieldtypes.StringType;
import com.mgmtp.a12.kernel.md.model.api.fieldtypes.IFieldType;
import com.mgmtp.a12.kernel.md.model.api.fieldtypes.IStringType;
import com.mgmtp.a12.kernel.md.model.internal.wrapper.fieldtypes.BooleanTypeWrapper;
import com.mgmtp.a12.kernel.md.model.internal.wrapper.fieldtypes.NumberTypeWrapper;
import com.mgmtp.a12.kernel.md.model.internal.wrapper.fieldtypes.StringTypeWrapper;
import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintDomainException;
import com.mgmtp.a12.print.engine.runtime.internal.CoreDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.fieldType.FieldTypeFromPathValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.formatter.FormattedValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.html.SanitizeValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.FormattingResult;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.ManagedPrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.computation.ComputationExpression;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.LogicContainerEvaluationDependency;
import com.mgmtp.a12.print.model.api.model.element.type.calculation.CalculationProperties;
import org.apache.commons.lang3.StringUtils;

import java.util.Optional;


public class CalculationDependencyValueProducer implements CoreDependencyValueProvider<Optional<FormattingResult>, CalculationValueDependency> {

	@Override
	public ValueFactory<Optional<FormattingResult>> produce(CalculationValueDependency dependency, PrintJob job, PrintEngine<?> engine, InternalCorePrintEngineRuntime runtime) {
		final var trace = dependency.getCalculation();
		final var calculation = trace.getTracedElement();

		final var logicContainerEvaluation = runtime.provide(
			new LogicContainerEvaluationDependency(
				trace.createDescendent(calculation.getCalculationProperties()),
				new ComputationExpression.Parameters()
					.withPrintDocumentContext(dependency.getPrintDocumentContext())
			)
		).get();

		final var objValue = logicContainerEvaluation.getValue();
		FormattedValueDependency formattedValueDependency = null;

		final var value = objValue.orElse(null);
		final var displayOptions = calculation.getCalculationProperties().getDisplayOptions().orElse(null);
		final var resultFieldType = fieldTypeByFieldTypeDefinition(calculation.getCalculationProperties(), job);

		Optional<IFieldType> referencedFieldType = runtime.provide(
			new FieldTypeFromPathValueDependency(
				calculation.getCalculationProperties().getComputationAlternatives().stream().toList(),
				trace.getPath().getParents()
			)
		).get();

		if (resultFieldType.isPresent()) {
			formattedValueDependency = FormattedValueDependency.buildFrom(value, displayOptions, resultFieldType.get());
		} else if (referencedFieldType.isPresent() && referencedFieldType.get() instanceof IStringType iStringType) {
			formattedValueDependency = FormattedValueDependency.buildFrom(
				value,
				calculation.getCalculationProperties().getDisplayOptions().orElse(null),
				iStringType
			);
		} else {
			formattedValueDependency = FormattedValueDependency.buildFrom(
				value,
				calculation.getCalculationProperties().getDisplayOptions().orElse(null),
				logicContainerEvaluation.getComputationFieldType()
			);
		}

		final var formattingResult = runtime.provide(formattedValueDependency).get();

		if (formattingResult.isHtml()) {
			formattingResult.setFormattedValue(
				runtime.provide(new SanitizeValueDependency(formattingResult.getFormattedValue())).get()
			);
		}

		return StringUtils.isBlank(formattingResult.getFormattedValue()) && objValue.isEmpty()
			? Optional::empty
			: () -> Optional.of(formattingResult);
	}

	private Optional<? extends IFieldType> fieldTypeByFieldTypeDefinition(
		CalculationProperties calculationProperties,
		PrintJob job
	) {
		return calculationProperties.getFieldType().flatMap(fieldTypeDefinition ->
			fieldTypeDefinition.getFieldType().map(fieldType ->
				switch (fieldType) {
					case STRING:
						yield new StringTypeWrapper(new StringType());
					case NUMBER:
						yield new NumberTypeWrapper(new NumberType());
					case BOOLEAN:
						yield new BooleanTypeWrapper(new BooleanType());
					case TYPE_DEFINITION: {
						final var typeDefinition = calculationProperties.getFieldType().get().getTypeDefinition().orElseThrow(
							() -> new PrintDomainException("The field type is \"TypeDefinition\" but there is no Type Definition selected")
						);
						yield ((ManagedPrintJob) job).getPrintModelCompilationContext()
							.getDocumentModelIndexMap().values().stream().flatMap(documentModelIndex ->
								documentModelIndex.getFieldType(typeDefinition).stream()
							).findFirst().orElseThrow(() -> new PrintDomainException(
								"The Type Definition with the name {} is not present in the current Document Model", typeDefinition.getId()
							));
					}
				})
		);
	}
}

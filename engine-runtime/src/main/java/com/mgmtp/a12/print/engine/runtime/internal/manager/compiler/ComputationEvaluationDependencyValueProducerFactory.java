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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler;

import com.mgmtp.a12.kernel.md.document.api.IEntityInstance;
import com.mgmtp.a12.kernel.md.document.api.IFieldInstance;
import com.mgmtp.a12.kernel.md.document.api.IGroupInstance;
import com.mgmtp.a12.kernel.md.model.api.*;
import com.mgmtp.a12.kernel.md.model.api.fieldtypes.IEnumerationType;
import com.mgmtp.a12.print.engine.api.exception.PrintCompilerException;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.formatter.FormattedValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.FormattingResult;
import com.mgmtp.a12.print.engine.runtime.internal.manager.ComputationEvaluationAdvice;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.computation.*;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.eval.EvaluationDocumentModelCompiler;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.ComputationExpressionDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.LogicContainerEvaluationDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.utils.FieldValueSerializer;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.KernelElementUtils;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Arithmetic;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.ComputationFieldType;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Constant;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.ReferenceSegment;
import com.mgmtp.a12.print.model.api.walker.model.ExhaustivePrintModelVisitor;
import lombok.Builder;
import lombok.Data;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

import static com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Logic.Operator.AND;
import static com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Logic.Operator.OR;
import static com.mgmtp.a12.print.model.api.model.element.base.internal.LogicComponent.EvaluationSemantic.BOOLEAN_OR;
import static com.mgmtp.a12.print.model.api.model.element.base.internal.LogicComponent.EvaluationSemantic.IF_NOT_EMPTY_AND_TRUE_THEN_LAST;

@Data
@Slf4j
@Builder(buildMethodName = "createFactory")
class ComputationEvaluationDependencyValueProducerFactory implements ExhaustivePrintModelVisitor {

	private final ComputationEvaluationAdviceCompiler adviceCompiler;
	@NonNull
	private final EvaluationDocumentModelCompiler evaluationDocumentModelCompiler;
	@NonNull
	private final Queue<LogicContainerCompilation> computations;

	private static Optional<Object> getInstanceValue(IEntityInstance e) {
		if (e instanceof IFieldInstance) {
			return ((IFieldInstance) e).getValue();
		} else if (e instanceof PrintDocumentContext.Entity) {
			return ((PrintDocumentContext.Entity<?>) e).getValue();
		} else if (e instanceof IGroupInstance) {
			return Optional.empty();
		} else {
			throw new PrintException("invalid entity instance");
		}
	}

	public TypedComputationExpression compileComputationEvaluationAdvice(ComputationEvaluationAdvice advice) {
		switch (advice.evaluationCategory()) {
			case NO_VALUE:
				return new NotFilledFieldComputationExpression(advice.getProviderId());
			case CONSTANT:
				return getConstantValueStrategy((ComputationEvaluationAdvice.ConstantValue) advice);
			case FIELD:
				return getFieldValueStrategy((ComputationEvaluationAdvice.FieldValue) advice);
			case LOGIC_EXPRESSION:
				return getLogicExpressionValueStrategy((ComputationEvaluationAdvice.JavaFunctionalExpression) advice);
			case ARITHMETIC_EXPRESSION:
				return getArithmeticExpressionValueStrategy((ComputationEvaluationAdvice.JavaFunctionalExpression) advice);
			case COMPARE_EXPRESSION:
				return getCompareExpressionValueStrategy((ComputationEvaluationAdvice.JavaFunctionalExpression) advice);
			case KERNEL_COMPUTATION:
				return getKernelComputationStrategy((ComputationEvaluationAdvice.KernelComputation) advice);
			case META_FIELD:
				return getMetaFieldComputationStrategy((ComputationEvaluationAdvice.MetaFieldValue) advice);
			case META_CONSTANT:
				return getMetaConstantComputationStrategy((ComputationEvaluationAdvice.MetaConstantValue) advice);
			case NULL_CHECK: {
				final var nullCheck = (ComputationEvaluationAdvice.NullCheck) advice;
				final var target = nullCheck.getTargetProviderId();
				final var targetValue = nullCheck.isCheckIfValueIsNull();
				adviceCompiler.getExpressionById(target);
				return new NullCheckExpression(
					advice.getProviderId(),
					target,
					targetValue
				);
			}
			case RESOLVE_PROVIDER: {
				throw new PrintCompilerException("ResolveProvider Advice cannot be compiled");
			}
			default:
				throw new PrintCompilerException("unmapped advice category: " + advice.evaluationCategory().name(), advice);
		}
	}

	private TypedComputationExpression getMetaFieldComputationStrategy(ComputationEvaluationAdvice.MetaFieldValue advice) {
		final var syntheticField = advice.getSyntheticField();
		if (syntheticField.getMetaField() == null) {
			throw new NullPointerException("Synthetic Meta Field is invalid");
		}
		final var providerId = advice.getProviderId();
		final var computationFieldType = advice.getComputationFieldType();
		switch (syntheticField.getMetaField()) {
			case VALUE: {
				return new FunctionalExpression(
					providerId,
					(p, j, r) -> p.getEntityInstance()
								  .flatMap(ComputationEvaluationDependencyValueProducerFactory::getInstanceValue),
					computationFieldType
				);
			}
			case LITERAL_VALUE: {
				return new FunctionalExpression(
					providerId,
					(p, j, r) -> p.getElement()
								  .flatMap(element -> p.getEntityInstance()
													   .map(instance -> FieldValueSerializer.getLiteralValue(
														   element,
														   instance.getPath(),
														   getInstanceValue(instance),
														   j.getTimeZone()
													   ))
								  ),
					computationFieldType
				);
			}
			case REPETITIONS: {
				return new FunctionalExpression(
					providerId,
					(p, j, r) -> p.getPrintDocumentContext().flatMap(
						documentContext -> p.getElement().map(
							element -> new BigDecimal(documentContext.findMaxRepetition(element))
						)
					),
					computationFieldType

				);
			}
			case REPETITIONS_OF_PARENT: {
				return new FunctionalExpression(
					providerId,
					(p, j, r) -> p.getPrintDocumentContext().flatMap(
						documentContext -> p.getElement().map(
							element -> new BigDecimal(documentContext.findMaxRepetition(element.getParent()))
						)
					),
					computationFieldType
				);
			}
			case CURRENT_REPETITION: {
				return new FunctionalExpression(
					providerId,
					(p, j, r) ->
						p.getEntityInstance()
						 .map(e -> new BigDecimal(e.getRepetitions()[e.getRepetitions().length - 1])),
					computationFieldType
				);
			}

			case CURRENT_REPETITION_OF_PARENT: {
				return new FunctionalExpression(
					providerId,
					(p, j, r) ->
						p.getEntityInstance()
						 .map(e -> new BigDecimal(e.getRepetitions().length > 1
							 ? e.getRepetitions()[e.getRepetitions().length - 2]
							 : 1
						 )),
					computationFieldType
				);
			}
			case CONSTANT:
				throw new PrintCompilerException("invalid Advice mapping for " + advice.getProviderId());
			default:

		}

		throw new PrintCompilerException("unmapped Meta Field: " + syntheticField.getMetaConstant().name());
	}

	private TypedComputationExpression getMetaConstantComputationStrategy(ComputationEvaluationAdvice.MetaConstantValue advice) {
		final var syntheticField = advice.getSyntheticField();

		final var documentModel = evaluationDocumentModelCompiler.getPrintModel().getDocumentModelById(syntheticField.getDataModel());
		final var entityPath = "/" + String.join("/", syntheticField.getPath());
		final var element = documentModel.getDocumentModelSearchService().getByPath(entityPath).orElseThrow(
			() -> new PrintCompilerException(String.format("Synthetic Variable Path is invalid no %s in %s", entityPath, syntheticField.getDataModel()))
		);
		if (syntheticField.getMetaConstant() == null) {
			throw new NullPointerException("Synthetic Variable Constant is invalid");
		}
		switch (syntheticField.getMetaConstant()) {
			case PATH: {
				return handleConstant(
					advice.getProviderId(),
					advice.getComputationFieldType(),
					entityPath.endsWith("/")
						? entityPath
						: (entityPath + "/")
				);
			}
			case ANNOTATION: {
				assert syntheticField.getRest().size() == 1;
				final var key = syntheticField.getRest().get(0);
				final var value = element.getAnnotations().stream()
					.filter(annotation -> annotation.getName().equals(key))
					.findFirst()
					.orElse(null);
				return handleConstant(advice.getProviderId(), advice.getComputationFieldType(), value);
			}
			case NAME: {
				return handleConstant(
					advice.getProviderId(),
					advice.getComputationFieldType(),
					element.getName()
				);
			}
			case PARENT_NAME: {
				return handleConstant(
					advice.getProviderId(),
					advice.getComputationFieldType(),
					element.getParent().getName()
				);
			}
			case PARENT_PATH: {
				return handleConstant(
					advice.getProviderId(),
					advice.getComputationFieldType(),
					"/" + KernelElementUtils.getPath(element.getParent()).stream().map(IIdNamed::getName).collect(Collectors.joining("/")) + "/"
				);
			}
			case DEPTH: {
				return handleConstant(
					advice.getProviderId(),
					advice.getComputationFieldType(),
					KernelElementUtils.getPath(element.getParent()).size()
				);
			}
			case LABEL: {
				return handleLocalizedText(
					advice.getProviderId(),
					advice.getComputationFieldType(),
					element instanceof ILabeled ? ((ILabeled) element).getLabel() : null
				);
			}
			case EXTERNAL_DESCRIPTION: {
				return handleLocalizedText(
					advice.getProviderId(),
					advice.getComputationFieldType(),
					element.getExternalDescription()
				);
			}
			case ERROR_MESSAGE: {
				if (element instanceof IField) {
					final var field = ((IField) element);
					final var type = field.getEffectiveType().orElse(field.getFieldType());
					if (type instanceof IEnumerationType) {
						return handleLocalizedText(
							advice.getProviderId(),
							advice.getComputationFieldType(),
							((IEnumerationType) type).getErrorMessage()
						);
					}
				}
				return handleLocalizedText(
					advice.getProviderId(),
					advice.getComputationFieldType(),
					null
				);
			}
			case REQUIRED: {
				return handleConstant(
					advice.getProviderId(),
					advice.getComputationFieldType(),
                    element instanceof IField && ((IField) element).getRequirednessConfig().isPresent()
				);
			}
			case REPEATABILITY: {
				return handleConstant(
					advice.getProviderId(),
					advice.getComputationFieldType(),
					element instanceof IGroup
						? ((IGroup) element).getRepeatability()
						: 1
				);
			}
			case IS_FIELD: {
				return handleConstant(
					advice.getProviderId(),
					advice.getComputationFieldType(),
					element instanceof IField
				);
			}
			default:

		}
		throw new PrintCompilerException("unmapped Meta Constant: " + syntheticField.getMetaConstant().name());
	}

	private TypedComputationExpression handleConstant(String providerId, ComputationFieldType computationFieldType, final Object constant) {
		return new ConstantValueExpression(constant, providerId, computationFieldType);
	}

	private TypedComputationExpression handleLocalizedText(String providerId, ComputationFieldType computationFieldType, final ILocalizedTextMap iLocalizedTextMap) {
		return new FunctionalExpression(
			providerId,
			(p, job, r) -> Optional.ofNullable(iLocalizedTextMap.get(job.getLocale())),
			computationFieldType
		);
	}

	private TypedComputationExpression getConstantValueStrategy(
		ComputationEvaluationAdvice.ConstantValue advice
	) {

		switch (advice.getLiteralValue().getConstantType()) {
			case STRING: {
				return new ConstantValueExpression(
					advice.getLiteralValue().getValue(),
					advice.getProviderId(),
					advice.getComputationFieldType()
				);
			}
			case BOOLEAN: {
				return new ConstantValueExpression(
					advice.getLiteralValue().getValue().equalsIgnoreCase(Constant.TRUE.getValue()),
					advice.getProviderId(),
					advice.getComputationFieldType()
				);
			}
			case INTEGER, FLOAT: {
				return new ConstantValueExpression(
					new BigDecimal(advice.getLiteralValue().getValue()),
					advice.getProviderId(),
					advice.getComputationFieldType()
				);
			}
		}

		throw new PrintCompilerException("invalid Constant");
	}

	private TypedComputationExpression getFieldValueStrategy(
		ComputationEvaluationAdvice.FieldValue fieldValueAdvice
	) {
		var reference = fieldValueAdvice.getVariable();
		var tailSegments = Arrays.stream(reference.getSegments()).skip(1).map(ReferenceSegment::getLabel).toList();
		var path = "/" + String.join("/", tailSegments);
		var dataModel = reference.getSegments()[0].getLabel();
		return FieldValueExpression
			.builder()
			.path(path)
			.computationFieldType(fieldValueAdvice.getComputationFieldType())
			.providerId(fieldValueAdvice.getProviderId())
			.modelName(dataModel)
			.defaultValue(null)
			.build();

	}

	private TypedComputationExpression getArithmeticExpressionValueStrategy(
		ComputationEvaluationAdvice.JavaFunctionalExpression advice
	) {
		if (advice.getArithmeticOperator().equals(Arithmetic.Operator.PLUS)) {

			final var dependencies = advice
				.getBranchProviderIds()
				.stream()
				.map(adviceCompiler::getExpressionById)
				.toList();

			return new FunctionalExpression(
				advice.getProviderId(),
				(parameters, job, internalPdfPrintEngineRuntime) ->
					Optional.of(
						dependencies.stream()
									.map(e -> e.call(parameters, job, internalPdfPrintEngineRuntime))
									.map(e -> e
										.map(literal -> internalPdfPrintEngineRuntime.provide(
											FormattedValueDependency.buildFrom(
												literal,
												null,
												ComputationFieldType.STRING
											)
										).get())
										.orElse(FormattingResult.builder().formattedValue(Constants.EMPTY_STRING).build())
									)
									.map(FormattingResult::getFormattedValue)
									.collect(Collectors.joining())
					)
				,
				advice.getComputationFieldType()
			);

		} else {
			throw new PrintCompilerException("currently only Java String Concatenation is allowed.");
		}

	}

	private TypedComputationExpression getCompareExpressionValueStrategy(
		ComputationEvaluationAdvice.JavaFunctionalExpression advice
	) {
		if (advice.getBranchProviderIds().size() != 2) {
			throw new PrintCompilerException("malformed none-binary compare", advice);
		}

		final var left = adviceCompiler.getExpressionById(advice.getBranchProviderIds().get(0));
		final var right = adviceCompiler.getExpressionById(advice.getBranchProviderIds().get(1));

		assert left.getComputationFieldType().isComparableTo(right.getComputationFieldType());

		Class<?> cmpClass = null;
		Comparator<Object> comparator = null;

		switch (left.getComputationFieldType()) {
			case STRING, ENUMERATION: {
				cmpClass = String.class;
				comparator = Comparator.comparing(String.class::cast);
				break;
			}
			case NUMBER: {
				cmpClass = BigDecimal.class;
				comparator = Comparator.comparing((Object o) -> o == null ? new BigDecimal(0) : (BigDecimal) o);
				break;
			}
			case BOOLEAN: {
				cmpClass = Boolean.class;
				comparator = Comparator.comparing((Object o) -> o != null && (Boolean) o);
				break;
			}
			case DATE, DATE_TIME,TIME, DATE_RANGE, DATE_FRAGMENT, CUSTOM, UNKNOWN: {
				throw new PrintCompilerException(
					String.format("invalid Compare Expression. Comparing %s should be handled by the kernel", left.getComputationFieldType())
				);
			}
			default:
				break;
		}

		ComputationExpression strategy = switch (advice.getCompareOperator()) {
			case EQUALITY -> ComputationExpression.binaryPredicate(cmpClass, cmpClass, left, right, Objects::equals);
			case UN_EQUALITY ->
				ComputationExpression.binaryPredicate(cmpClass, cmpClass, left, right, (a, b) -> !Objects.equals(a, b));
			case GREATER_THAN -> {
				assert comparator != null;
				yield ComputationExpression.compare(cmpClass, left, right, comparator, weight -> 0 < weight);
			}
			case GREATER_THAN_OR_EQUAL -> {
				assert comparator != null;
				yield ComputationExpression.compare(cmpClass, left, right, comparator, weight -> 0 <= weight);
			}
			case LESS_THAN -> {
				assert comparator != null;
				yield ComputationExpression.compare(cmpClass, left, right, comparator, weight -> 0 > weight);
			}
			case LESS_THAN_OR_EQUAL -> {
				assert comparator != null;
				yield ComputationExpression.compare(cmpClass, left, right, comparator, weight -> 0 >= weight);
			}
		};

		return new FunctionalExpression(
			advice.getProviderId(),
			strategy,
			advice.getComputationFieldType()
		);
	}

	private TypedComputationExpression getLogicExpressionValueStrategy(
		ComputationEvaluationAdvice.JavaFunctionalExpression advice
	) {
		ComputationExpression expression = null;
		final var strategies = advice.getBranchProviderIds();
		assert strategies.size() > 1;
		final var initialTy = traced(adviceCompiler.getExpressionById(strategies.getLast()));
		assert initialTy.getComputationFieldType().equals(ComputationFieldType.BOOLEAN);

		if (advice.getLogicOperator().equals(AND)) {
			BooleanComputationExpression previous = BooleanComputationExpression.evaluatesTrue(initialTy);
			for (var i = strategies.size() - 2; i >= 0; i--) {
				final var nextTy = traced(adviceCompiler.getExpressionById(strategies.get(i)));
				assert nextTy.getComputationFieldType().equals(ComputationFieldType.BOOLEAN);
				previous = BooleanComputationExpression.evaluatesTrue(nextTy).and(previous);
			}
			expression = previous;
		} else if (advice.getLogicOperator().equals(OR)) {
			BooleanComputationExpression previous = BooleanComputationExpression.evaluatesTrue(initialTy);
			for (var i = strategies.size() - 2; i >= 0; i--) {
				final var nextTy = traced(adviceCompiler.getExpressionById(strategies.get(i)));
				assert nextTy.getComputationFieldType().equals(ComputationFieldType.BOOLEAN);
				previous = BooleanComputationExpression.evaluatesTrue(nextTy).or(previous);
			}
			expression = previous;
		}

		return traced(new FunctionalExpression(
			advice.getProviderId(),
			expression,
			ComputationFieldType.BOOLEAN
		));

	}

	public TypedComputationExpression traced(TypedComputationExpression expression) {
		if(log.isDebugEnabled()) {
			return ComputationExpressionTrace.trace(expression);
		} else {
			return expression;
		}
	}

	private TypedComputationExpression getKernelComputationStrategy(
		ComputationEvaluationAdvice.KernelComputation advice
	) {
		return evaluationDocumentModelCompiler.getComputedFieldStrategyKey(advice);
	}


	public void setDependencyValueProducer(PrintModelCompilationContext context) {
		context.setLogicContainerEvaluationDependencyValueProducer(
			LogicContainerEvaluationDependencyValueProducer.builder().strategies(consumeComputations()).build()
		);
		context.setComputationExpressionDependencyValueProducer(
			new ComputationExpressionDependencyValueProducer(adviceCompiler.getTypedComputationExpressionCache())
		);

	}

	private Map<String, TypedComputationExpression> consumeComputations() {
		final var strategyHashMap = new HashMap<String, TypedComputationExpression>();

		adviceCompiler.compileAdvices(this::compileComputationEvaluationAdvice);

		while (!computations.isEmpty()) {
			final var logicContainerCompilation = computations.poll();
			final var componentStrategies = new ArrayList<TypedComputationExpression>();

			consumeComponents(logicContainerCompilation, componentStrategies);

			if (componentStrategies.isEmpty()) {
				strategyHashMap.put(
					logicContainerCompilation.getElement().getId(),
					new NotFilledFieldComputationExpression(logicContainerCompilation.getElement().getId())
				);
			} else if (componentStrategies.size() == 1) {
				strategyHashMap.put(logicContainerCompilation.getElement().getId(), componentStrategies.get(0));
			} else {
				final var initial = componentStrategies.get(0);
				var current = (ComputationExpression) initial;
				for (var i = 1; i < componentStrategies.size(); i++) {
					current = current.notNullOrElse(componentStrategies.get(i));
				}
				final var prev = strategyHashMap.put(
					logicContainerCompilation.getElement().getId(),
					new FunctionalExpression(
						logicContainerCompilation.getElement().getId(),
						current,
						initial.getComputationFieldType()
					)
				);
				if (prev != null) {
					throw new PrintCompilerException("Invalid state, there are Logic Containers with none-unique id!");
				}
			}
		}
		return strategyHashMap;
	}

	private void consumeComponents(LogicContainerCompilation logicContainerCompilation, ArrayList<TypedComputationExpression> componentStrategies) {
		for (var logicComponentCompilation : logicContainerCompilation.getComponents()) {
			var statements = logicComponentCompilation.getStatements();
			final var statementEvaluationStrategies = new ArrayList<TypedComputationExpression>();

			for (var statement : statements) {
				statementEvaluationStrategies.add(
					traced(adviceCompiler.getExpression(statement.getAdvice()))
				);
			}
			final var statementSemantic = logicComponentCompilation.getComponent().computationStatementSemantic();
			if (statementSemantic.equals(BOOLEAN_OR)) {
				getStrategiesFromBooleanSemantic(componentStrategies, logicComponentCompilation, statementEvaluationStrategies);
			} else if (statementSemantic.equals(IF_NOT_EMPTY_AND_TRUE_THEN_LAST)) {
				if (statementEvaluationStrategies.size() < 2 || statementEvaluationStrategies.size() % 2 != 0) {
					throw new PrintCompilerException("semantics do not match statement count", logicComponentCompilation);
				} else {
					final var condition = statementEvaluationStrategies.get(0);
					final var operation = statementEvaluationStrategies.get(1);
					componentStrategies.add(
						new FunctionalExpression(
							logicComponentCompilation.getComponent().getId(),
							condition.ifThen(operation),
							operation.getComputationFieldType()
						)
					);
				}
			}
		}
	}

	private static void getStrategiesFromBooleanSemantic(ArrayList<TypedComputationExpression> componentStrategies, LogicComponentCompilation logicComponentCompilation, ArrayList<TypedComputationExpression> statementEvaluationStrategies) {
		if (statementEvaluationStrategies.size() > 1) {
			var current = BooleanComputationExpression.evaluatesTrue(statementEvaluationStrategies.getFirst());
			for (var i = 1; i < statementEvaluationStrategies.size(); i++) {
				final var other = BooleanComputationExpression.evaluatesTrue(statementEvaluationStrategies.get(i));
				current = current.or(other);
			}
			componentStrategies.add(new FunctionalExpression(
				logicComponentCompilation.getComponent().getId(),
				current,
				ComputationFieldType.BOOLEAN
			));
		} else {
			componentStrategies.add(statementEvaluationStrategies.getFirst());
		}
	}

}

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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.table;

import com.mgmtp.a12.kernel.md.model.api.fieldtypes.IFieldType;
import com.mgmtp.a12.kernel.md.model.api.fieldtypes.INumberType;
import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.CoreDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.Entity;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.calculation.CalculationValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.expression.ExpressionDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.expression.PreCompiledExpressionDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.fieldType.FieldTypeDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.formatter.FormattedValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.inputSource.ReferenceInputSourceResolver;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.runtime.RuntimeWalker;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Variable;
import com.mgmtp.a12.print.model.api.inputSource.InputValueSourceResolver;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.element.base.Measure;
import com.mgmtp.a12.print.model.api.model.element.type.calculation.Calculation;
import com.mgmtp.a12.print.model.api.model.element.type.expression.Expression;
import com.mgmtp.a12.print.model.api.model.element.type.field.Field;
import com.mgmtp.a12.print.model.api.model.element.type.table.Table;
import com.mgmtp.a12.print.model.api.model.reference.TableColumnReference;
import com.mgmtp.a12.print.model.api.walker.TraversalCommand;
import com.mgmtp.a12.print.model.api.walker.model.ExhaustivePrintModelVisitor;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;
import com.mgmtp.a12.print.model.document.internal.base.IContentHolder;
import com.mgmtp.a12.print.model.document.internal.element.table.TableSumCellType;
import lombok.Getter;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;


@Slf4j
public class TableValuesDependencyValueProducer implements CoreDependencyValueProvider<TableValueResult, TableValuesDependency> {

	@Override
	public ValueFactory<TableValueResult> produce(TableValuesDependency dependency, PrintJob job, PrintEngine<?> engine, InternalCorePrintEngineRuntime runtime) {
		final var table = dependency.getTable();
		final var streamContentProvider = dependency.getStreamContentProvider();
		final var sumValueContentProvider = dependency.getSumValueContentProvider();
		final var printDocumentContext = dependency.getPrintDocumentContext();
		final var tableProperties = table.getTracedElement().getTableProperties();
		final var referenceInputSourceResolver = ReferenceInputSourceResolver.builder()
			.runtime(runtime)
			.printModelTreeTrace(new PrintModelTreeTrace<>(table.getPath(), table.getTracedElement()))
			.build();

		final var subRanges = printDocumentContext
			.findRepetitions(Variable.abs(tableProperties.getBasePath()))
			.limit(InputValueSourceResolver.getInputValue(tableProperties.getMaxRowCount(), referenceInputSourceResolver).map(Long::valueOf).orElse(Long.MAX_VALUE))
			.filter(subRange ->
				table.getTracedElement().getTableProperties().getFilterExpression().isEmpty() ||
					checkRowForFilterExpression(table, subRange, runtime)
			).toList();

		final var references = table.getTracedElement().getReferences();

		final List<List<IContentHolder>> contentHolders = subRanges.stream().map(subRange ->
			streamContentProvider.provideRowContent(subRange, references)).collect(Collectors.toList());

		if (references.stream().anyMatch(reference -> reference.isSumColumn().orElse(false))) {
			getSumRow(new ArrayList<>(references), subRanges, table, sumValueContentProvider, runtime)
				.ifPresent(contentHolders::add);
		}

		final List<String> headerCells = table.getTracedElement().getTableProperties().hideHeader().orElse(false)
			? null
			: table.getTracedElement().getReferences().stream().map(column -> {
			if (column.headerLabelHidden().orElse(false)) {
				return Constants.EMPTY_STRING;
			} else {
				return InputValueSourceResolver.getInputValue(column.getLabel(), referenceInputSourceResolver).orElse(Constants.EMPTY_STRING);
			}
		}).toList();

		final List<Optional<Integer>> colGroups = table.getTracedElement().getReferences().stream()
			.map(column -> InputValueSourceResolver.getInputValue(column.getWidth())
				.map(Measure::getValue))
			.toList();


		return () -> new TableValueResult(contentHolders, headerCells, colGroups);
	}

	private boolean checkRowForFilterExpression(
		PrintModelTreeTrace<Table> table,
		PrintDocumentContext printDocumentContext,
		InternalCorePrintEngineRuntime runtime
	) {
		final var expressionElementId = table.getTracedElement().getId() + "_filter_expression";
		final var preCompiledExpression = runtime.provide(new PreCompiledExpressionDependency(expressionElementId)).get();

		if (preCompiledExpression.getInterpreter().getIncludedEntities().size() == 1 &&
			preCompiledExpression.getInterpreter().getIncludedEntities().get(0) instanceof final Calculation calculation
		) {
			final var value = runtime.provide(
				new CalculationValueDependency(
					table
						.createDescendent(
							new ExpressionDependencyValueProducer.VirtualExpressionElementReference(
								calculation.getId(),
								"virtual-ref-" + expressionElementId)
						)
						.createDescendent(calculation),
					printDocumentContext
				)
			).get();

			return value
				.map(v -> v.getFormattedValue().equals("True"))
				.orElse(false);
		}

		return true;
	}

	private Optional<List<IContentHolder>> getSumRow(
		List<TableColumnReference> references,
		List<PrintDocumentContext> subRanges,
		PrintModelTreeTrace<Table> table,
		TableValuesDependency.SumValueContentProvider sumValueContentProvider,
		InternalCorePrintEngineRuntime runtime
	) {
		final List<BigDecimal> sumRowList = new ArrayList<>(Collections.nCopies(references.size(), null));
		final List<SumValueVisitor.ColumnData> sumRowColumnDataList = new ArrayList<>();

		for (var i = 0; i < subRanges.size(); i++) {
			final var subRange = subRanges.get(i);
			for (var j = 0; j < references.size(); j++) {
				final var tableColumnReference = references.get(j);
				SumValueVisitor.ColumnDataWrapper fieldData = new RuntimeWalker<>(runtime).walkReference(
					new SumValueVisitor(subRange),
					table.createDescendent(tableColumnReference),
					SumValueVisitor::getColumnDataWrapper
				).apply(runtime).get();

				final Optional<BigDecimal> numberValue = fieldData.fieldValue();

				if (
					tableColumnReference.isSumColumn().orElse(false) &&
						numberValue.isPresent()
				) {
					sumRowList.set(j, sumRowList.get(j) != null
						? sumRowList.get(j).add(numberValue.get())
						: numberValue.get()
					);
				}

				if (i == 0) {
					sumRowColumnDataList.add(fieldData.columnData());
				}
			}
		}

		if (sumRowList.stream().anyMatch(Objects::nonNull)) {
			return getSumRowContent(table, sumValueContentProvider, runtime, sumRowList, sumRowColumnDataList);
		}

		return Optional.empty();
	}

	private static Optional<List<IContentHolder>> getSumRowContent(
		@NonNull final PrintModelTreeTrace<Table> table,
		@NonNull final TableValuesDependency.SumValueContentProvider sumValueContentProvider,
		@NonNull final InternalCorePrintEngineRuntime runtime,
		@NonNull final List<BigDecimal> sumRowList,
		@NonNull final List<SumValueVisitor.ColumnData> sumRowColumnDataList
	) {
		final List<IContentHolder> sumRow = new ArrayList<>();

		final var referenceInputSourceResolver = ReferenceInputSourceResolver.builder()
			.runtime(runtime)
			.printModelTreeTrace(new PrintModelTreeTrace<>(table.getPath(), table.getTracedElement()))
			.build();

		final var sumRowLabel = InputValueSourceResolver.getInputValue(table.getTracedElement().getTableProperties().getSumLabel(), referenceInputSourceResolver);

		for (var i = 0; i < sumRowList.size(); i++) {
			final var sumValue = sumRowList.get(i);
			final var columnData = sumRowColumnDataList.get(i);

			var sumCellType = TableSumCellType.SUM_VALUE;
			ValueFactory<Optional<String>> value = () -> Optional.of("");

			if (
				sumValue != null &&
					columnData.element instanceof Field field &&
					columnData.fieldType().isPresent()
			) {
				value = () ->
					Optional.of(runtime.provide(
						FormattedValueDependency.buildFrom(
							sumValue,
							field.getFieldProperties().getDisplayOptions().orElse(null),
							columnData.fieldType().get()
						)).get().getFormattedValue()
					);
			} else if (i == 0) {
				value = () -> sumRowLabel;
				sumCellType = TableSumCellType.SUM_LABEL;
			}

			sumRow.add(sumValueContentProvider.provideSumValue(
				new PrintModelTreeTrace<>(columnData.path(), columnData.element()),
				value,
				sumCellType
			));
		}

		return Optional.of(sumRow);
	}

	@RequiredArgsConstructor
	@Getter
	private static class SumValueVisitor implements ExhaustivePrintModelVisitor {
		private final PrintDocumentContext printDocumentContext;

		private Function<InternalCorePrintEngineRuntime, ValueFactory<ColumnDataWrapper>> columnDataWrapper = null;

		@Override
		public TraversalCommand visitField(Field field, PrintModelPath path) {
			columnDataWrapper = runtime -> {
				final var fieldPath = field.getFieldProperties().getPath();
				final var fieldType = runtime.provide(
					new FieldTypeDependency(
						field.getFieldProperties().getModel(),
						fieldPath,
						field.getId(),
						printDocumentContext
					)
				).get();

				final var fieldData = new ColumnData(
					Optional.ofNullable(fieldType),
					field,
					path
				);

				if (fieldType instanceof INumberType) {
					final var value = printDocumentContext.findSingleFieldInstance(fieldPath)
						.flatMap(Entity::getValue);

					return () -> new ColumnDataWrapper(
						(value.isPresent() && value.get() instanceof BigDecimal bigDecimal)
							? Optional.of(bigDecimal)
							: Optional.empty(),
						fieldData
					);
				}

				return () -> new ColumnDataWrapper(
					Optional.empty(),
					fieldData
				);
			};
			return TraversalCommand.HALT;
		}

		@Override
		public TraversalCommand visitExpression(Expression expression, PrintModelPath path) {
			columnDataWrapper = runtime -> () -> new ColumnDataWrapper(
				Optional.empty(),
				new ColumnData(
					Optional.empty(),
					expression,
					path
				)
			);
			return TraversalCommand.HALT;
		}

		public record ColumnDataWrapper(
			Optional<BigDecimal> fieldValue,
			ColumnData columnData
		) {
		}

		public record ColumnData(
			Optional<IFieldType> fieldType,
			PrintModelElement element,
			PrintModelPath path
		) {
		}
	}
}

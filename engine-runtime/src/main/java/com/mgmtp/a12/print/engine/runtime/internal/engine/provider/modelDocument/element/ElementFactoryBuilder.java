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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element;

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.calculation.CalculationValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.chart.ChartValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.expression.ExpressionValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.field.FieldValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.image.ImageValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.listing.ListingValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.table.TableValuesDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.tableLayout.TableLayoutValuesDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.text.TextValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.text.TextValueMarkup;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.inputSource.ReferenceInputSourceResolver;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.FormattingResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.area.AreaElementDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.listing.ListingElementDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.switchCase.SwitchElementDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.text.TextBasedElementDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalModelDocumentPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.modelDocument.ModelDocumentPrintEngine;
import com.mgmtp.a12.print.model.api.inputSource.InputValueSourceResolver;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.container.BaseReferenceContainer;
import com.mgmtp.a12.print.model.api.model.element.ElementType;
import com.mgmtp.a12.print.model.api.model.element.type.area.Area;
import com.mgmtp.a12.print.model.api.model.element.type.boundingBox.BoundingBox;
import com.mgmtp.a12.print.model.api.model.element.type.calculation.Calculation;
import com.mgmtp.a12.print.model.api.model.element.type.chart.Chart;
import com.mgmtp.a12.print.model.api.model.element.type.chart.barChart.BarChart;
import com.mgmtp.a12.print.model.api.model.element.type.chart.lineChart.LineChart;
import com.mgmtp.a12.print.model.api.model.element.type.chart.pieChart.PieChart;
import com.mgmtp.a12.print.model.api.model.element.type.expression.Expression;
import com.mgmtp.a12.print.model.api.model.element.type.field.Field;
import com.mgmtp.a12.print.model.api.model.element.type.horizontalLine.HorizontalLine;
import com.mgmtp.a12.print.model.api.model.element.type.image.Image;
import com.mgmtp.a12.print.model.api.model.element.type.listing.Listing;
import com.mgmtp.a12.print.model.api.model.element.type.override.OverrideElement;
import com.mgmtp.a12.print.model.api.model.element.type.pageNumber.PageNumber;
import com.mgmtp.a12.print.model.api.model.element.type.pageNumber.PageNumberTotal;
import com.mgmtp.a12.print.model.api.model.element.type.switchCase.Switch;
import com.mgmtp.a12.print.model.api.model.element.type.table.Table;
import com.mgmtp.a12.print.model.api.model.element.type.tableLayout.TableLayout;
import com.mgmtp.a12.print.model.api.model.element.type.text.TextElement;
import com.mgmtp.a12.print.model.api.model.reference.ElementReference;
import com.mgmtp.a12.print.model.api.walker.DescendCommand;
import com.mgmtp.a12.print.model.api.walker.TraversalCommand;
import com.mgmtp.a12.print.model.api.walker.model.ExhaustivePrintModelVisitor;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;
import com.mgmtp.a12.print.model.document.internal.attachments.PrintAttachment;
import com.mgmtp.a12.print.model.document.internal.base.IContentHolder;
import com.mgmtp.a12.print.model.document.internal.base.IPrintElement;
import com.mgmtp.a12.print.model.document.internal.base.IPrintEntity;
import com.mgmtp.a12.print.model.document.internal.element.ImageBasedElement;
import com.mgmtp.a12.print.model.document.internal.element.PrintElement;
import com.mgmtp.a12.print.model.document.internal.element.PrintElementNestedContainer;
import com.mgmtp.a12.print.model.document.internal.element.TextBasedElement;
import com.mgmtp.a12.print.model.document.internal.element.table.TableBasedElement;
import com.mgmtp.a12.print.model.document.internal.element.table.TableCell;
import com.mgmtp.a12.print.model.document.internal.element.table.TableRow;
import com.mgmtp.a12.print.model.document.internal.element.table.TableSumCell;
import freemarker.core.XHTMLOutputFormat;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@RequiredArgsConstructor
public class ElementFactoryBuilder implements ExhaustivePrintModelVisitor {

	private final PrintDocumentContext printDocumentContext;
	private final List<ModelDocumentPrintEngine.OverriddenBoundingBoxes> overriddenBoundingBoxes;
	private Function<InternalModelDocumentPrintEngineRuntime, ValueFactory<AttachmentWrapper<IPrintElement>>> attachmentWrapper = null;

	private void setPrintElementFactory(Function<InternalModelDocumentPrintEngineRuntime, ValueFactory<IPrintElement>> factory) {
		setAttachmentWrapperFactory((runtime) -> () -> {
			final var element = factory.apply(runtime).get();
			return element == null ? null : new AttachmentWrapper<>(factory.apply(runtime).get(), new ArrayList<>());
		});
	}

	private void setAttachmentWrapperFactory(Function<InternalModelDocumentPrintEngineRuntime, ValueFactory<AttachmentWrapper<IPrintElement>>> factory) {
		if (attachmentWrapper != null) {
			throw new PrintException("malformed element result creation");
		}
		attachmentWrapper = factory;
	}

	public Function<InternalModelDocumentPrintEngineRuntime, ValueFactory<AttachmentWrapper<IPrintElement>>> single() {
		if (attachmentWrapper == null) {
			throw new PrintException("malformed element result creation");
		}
		return attachmentWrapper;
	}

	@Override
	public TraversalCommand visitField(Field field, PrintModelPath path) {
		setPrintElementFactory(runtime -> {
			final var formattingResult = runtime.provide(new FieldValueDependency(
				field,
				printDocumentContext
			)).get();
			return runtime.provide(
				new TextBasedElementDependency(
					new PrintModelTreeTrace<>(path, field),
					() -> formattingResult.map(FormattingResult::getFormattedValue),
					formattingResult.map(FormattingResult::isHtml).orElse(false)
				)
			);
		});
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitCalculation(Calculation calculation, PrintModelPath path) {
		setPrintElementFactory(runtime -> {
			final var formattingResult = runtime.provide(
				new CalculationValueDependency(new PrintModelTreeTrace<>(path, calculation), printDocumentContext)
			).get();
			return runtime.provide(
				new TextBasedElementDependency(
					new PrintModelTreeTrace<>(path, calculation),
					() -> formattingResult.map(FormattingResult::getFormattedValue),
					formattingResult.map(FormattingResult::isHtml).orElse(false)
				)
			);
		});
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitText(TextElement text, PrintModelPath path) {
		setPrintElementFactory(runtime -> {
			var results = runtime.streamReferenceModelDocumentDependency(
				ReferenceModelDocumentDependency.ofContainerReferences(
					new PrintModelTreeTrace<>(path, text), printDocumentContext, Collections.emptyList()
				)
			).filter(Objects::nonNull).toList();
			// "pageNumberGlobalStyles" could be ignored because it is only for styling
			final var evaluatedValue = runtime.provide(new TextValueDependency(
				text,
				results.stream().map(ElementFactoryBuilder::mapTextValueMarkup).toList()
			)).get().value();
			return runtime.provide(
				new TextBasedElementDependency(
					new PrintModelTreeTrace<>(path, text),
					() -> evaluatedValue,
					results.stream().map(AttachmentWrapper::getElement).toList(),
					true
				)
			);
		});
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitExpression(Expression expression, PrintModelPath path) {
		final var expressionTrace = new PrintModelTreeTrace<>(path, expression);
		setPrintElementFactory(runtime -> {
			final var evaluatedValue = runtime.provide(new ExpressionValueDependency(expressionTrace, (traces ->
				runtime.streamElementModelDocumentDependency(
					traces.stream().map(
						trace -> new ElementModelDocumentDependency(
							trace,
							printDocumentContext
						)
					)
				).map(ElementFactoryBuilder::mapTextValueMarkup).toList())));

			return runtime.provide(new TextBasedElementDependency(
				new PrintModelTreeTrace<>(path, expression),
				evaluatedValue,
				true
			));
		});
		return TraversalCommand.HALT;
	}

	private static TextValueMarkup mapTextValueMarkup(
		AttachmentWrapper<IPrintElement> wrapper
	) {
		return wrapper.getElement() instanceof TextBasedElement textBasedElement
			? new TextValueMarkup(
			textBasedElement.getId(),
			textBasedElement.isValueIsRenderedAsHtml()
				? textBasedElement.getValue()
				: XHTMLOutputFormat.INSTANCE.escapePlainText(textBasedElement.getValue()),
			textBasedElement.isValueIsRenderedAsHtml(),
			StringUtils.isEmpty(textBasedElement.getValue())
		)
			: new TextValueMarkup(wrapper.getElement().getId(), Constants.EMPTY_STRING, false, false);
	}

	@Override
	public TraversalCommand visitPageNumber(PageNumber pageNumber, PrintModelPath path) {
		setPrintElementFactory(runtime -> () -> new PrintElement(pageNumber.getId(), ElementType.PAGE_NUMBER));
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitPageNumberTotal(PageNumberTotal pageNumberTotal, PrintModelPath path) {
		setPrintElementFactory(runtime -> () -> new PrintElement(pageNumberTotal.getId(), ElementType.PAGE_NUMBER_TOTAL));
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitHorizontalLine(HorizontalLine horizontalLine, PrintModelPath path) {
		setPrintElementFactory(runtime -> () -> new PrintElement(horizontalLine.getId(), ElementType.HORIZONTAL_LINE));
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitImage(Image image, PrintModelPath path) {
		setPrintElementFactory(runtime -> {
			final var srcUri = runtime.provide(
				new ImageValueDependency(image, printDocumentContext)
			).get().orElse(Constants.EMPTY_STRING);
			return () -> new ImageBasedElement(
				image.getId(),
				ElementType.IMAGE,
				srcUri,
				image.getImageProperties().getAlternativeText()
			);
		});
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitTable(Table table, PrintModelPath path) {
		final var tableTrace = new PrintModelTreeTrace<>(path, table);
		setPrintElementFactory(runtime -> {
			final var tableResult = runtime.provide(new TableValuesDependency(
				new PrintModelTreeTrace<>(path, table),
				printDocumentContext,
				(subRange, references) -> runtime.streamReferenceModelDocumentDependency(
					references
						.stream()
						.map(reference -> new ReferenceModelDocumentDependency(
							tableTrace.createDescendent(reference), subRange, Collections.emptyList())
						)
				).map(AttachmentWrapper::getElement).map(IContentHolder.class::cast).toList(),
				(trace, value, type) -> new TableSumCell(
					trace.getTracedElement().getId(),
					type,
					((TextBasedElement) runtime.provide(new TextBasedElementDependency(trace, value, false)).get()).getValue()
				)
			)).get();

			return () -> new TableBasedElement(
				table.getId(),
				table.getType(),
				tableResult.getHeaderCells(),
				tableResult.getRows().stream().map(row -> new TableRow(
					row.stream().map(cell -> new TableCell((IPrintEntity) cell)).toList()
				)).toList()
			);
		});
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitTableLayout(TableLayout tableLayout, PrintModelPath path) {
		setPrintElementFactory(runtime -> {
			final var tableLayoutRows = runtime.provide(new TableLayoutValuesDependency(
				new PrintModelTreeTrace<>(path, tableLayout),
				(ref) -> (IContentHolder) runtime.provide(
					new ReferenceModelDocumentDependency(ref, printDocumentContext, Collections.emptyList())
				).get().getElement()
			)).get();

			return () -> new TableBasedElement(
				tableLayout.getId(),
				tableLayout.getType(),
				null,
				tableLayoutRows.stream().map(row -> new TableRow(
					row.getElements().stream().map(cell -> new TableCell(cell.getContent().isPresent()
							? (IPrintEntity) cell.getContent().get()
							: null
						)
					).toList())).toList()
			);
		});
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitOverrideElement(OverrideElement overrideElement, PrintModelPath path) {
		setAttachmentWrapperFactory(runtime -> {
			final var overriddenBoundingBox = overriddenBoundingBoxes.stream().filter(box ->
				box.getOverrideElement().getId().equals(overrideElement.getId())
			).findFirst();

			if (overriddenBoundingBox.isEmpty()) {
				throw new PrintException(
					String.format("The override element '%s' has no origin bounding box", overrideElement.getId())
				);
			}

			final var originBoundingBox = overriddenBoundingBox.get().getBoundingBox();
			final var boundingBoxTrace = new PrintModelTreeTrace<>(
				overriddenBoundingBox.get().getPath(),
				overriddenBoundingBox.get().getBoundingBox()
			);
			final var references = originBoundingBox.getReferences()
				.stream().map(boundingBoxTrace::createDescendent).collect(Collectors.toList());

			references.addAll(
				overriddenBoundingBox.get().getOverrideElement().getReferences().stream().map(boundingBoxTrace::createDescendent).toList()
			);

			var results = runtime.streamReferenceModelDocumentDependency(
				ReferenceModelDocumentDependency.ofReferences(
					references,
					printDocumentContext,
					overriddenBoundingBoxes
				)
			).filter(Objects::nonNull).toList();
			var attachments = new ArrayList<PrintAttachment>();
			results.forEach(res -> attachments.addAll(res.getAttachments()));

			return () -> new AttachmentWrapper<>(
				new PrintElementNestedContainer(
					originBoundingBox.getId(),
					originBoundingBox.getType(),
					results.stream().map(AttachmentWrapper::getElement).toList()
				),
				attachments
			);
		});
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitBoundingBox(BoundingBox boundingBox, PrintModelPath path) {
		setAttachmentWrapperFactory(runtime -> {
			final var boundingBoxTrace = new PrintModelTreeTrace<>(path, boundingBox);
			var results = runtime.streamReferenceModelDocumentDependency(
				ReferenceModelDocumentDependency.ofContainerReferences(
					boundingBoxTrace,
					printDocumentContext,
					overriddenBoundingBoxes
				)
			).filter(Objects::nonNull).toList();
			var attachments = new ArrayList<PrintAttachment>();
			results.forEach(res -> attachments.addAll(res.getAttachments()));

			return () -> new AttachmentWrapper<>(
				new PrintElementNestedContainer(
					boundingBox.getId(),
					boundingBox.getType(),
					results.stream().map(AttachmentWrapper::getElement).toList()
				),
				attachments
			);
		});
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitArea(Area area, PrintModelPath path) {
		setAttachmentWrapperFactory(runtime ->
			runtime.provide(new AreaElementDependency(
				area, path, printDocumentContext
			))
		);
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitSwitch(Switch switchElement, PrintModelPath path) {
		setAttachmentWrapperFactory(runtime ->
			runtime.provide(new SwitchElementDependency(
				switchElement, path, printDocumentContext
			))
		);
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitBarChart(BarChart barChart, PrintModelPath path) {
		evaluateChart(barChart, path);
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitLineChart(LineChart lineChart, PrintModelPath path) {
		evaluateChart(lineChart, path);
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitPieChart(PieChart pieChart, PrintModelPath path) {
		evaluateChart(pieChart, path);
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitListing(Listing listing, PrintModelPath path) {
		final var listingTrace = new PrintModelTreeTrace<>(path, listing);
		setAttachmentWrapperFactory(runtime -> runtime.provide(new ListingElementDependency(
			listingTrace,
			runtime.provide(new ListingValueDependency(
				listingTrace,
				printDocumentContext,
				(textStyleDependency) -> null
			)).get()
		)));
		return TraversalCommand.HALT;
	}

	private void evaluateChart(Chart chart, PrintModelPath path) {
		setPrintElementFactory(runtime -> {
			final var chartValue = runtime.provide(new ChartValueDependency(new PrintModelTreeTrace<>(path, chart), printDocumentContext));
			final var chartSrc = chartValue.get();
			final var srcUri = chartSrc.orElse(Constants.EMPTY_STRING);
			final var alternativeText = InputValueSourceResolver.getInputValue(
					chart.getChartProperties().getTitle(),
					ReferenceInputSourceResolver
						.builder()
						.runtime(runtime)
						.printModelTreeTrace(new PrintModelTreeTrace<>(path, chart)).build())
				.map(title -> String.format(
					"%s: %s",
					chart.getType().name(),
					chart.getType().name())
				)
				.orElse(chart.getType().name());

			return () -> new ImageBasedElement(
				chart.getId(),
				chart.getType(),
				srcUri,
				alternativeText
			);
		});
	}

	@Override
	public TraversalCommand visitUnresolvedElement(ElementReference reference, PrintModelPath path, int index) {
		throw new PrintException("Unresolved Element: {}", reference.getId());
	}

	@Override
	public DescendCommand descendContainer(
		BaseReferenceContainer<? extends ElementReference> container,
		PrintModelPath path,
		int index
	) {
		/*
		 * the visitor should only work on single elements, therefore we do not descent into any container
		 */
		return DescendCommand.NO_DESCEND;
	}

}

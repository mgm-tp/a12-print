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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup;

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.*;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.listing.ListingMarkupDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.table.TableMarkupDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.tableLayout.TableLayoutMarkupDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.text.TextBasedElementMarkupDependency;
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
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer.HtmlDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer.HtmlTemplateParameters;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfPrintEngineRuntime;
import com.mgmtp.a12.print.model.api.inputSource.InputValueSourceResolver;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.container.BaseReferenceContainer;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
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
import com.mgmtp.a12.print.model.api.model.element.type.pageNumber.PageNumber;
import com.mgmtp.a12.print.model.api.model.element.type.pageNumber.PageNumberTotal;
import com.mgmtp.a12.print.model.api.model.element.type.switchCase.Switch;
import com.mgmtp.a12.print.model.api.model.element.type.table.Table;
import com.mgmtp.a12.print.model.api.model.element.type.tableLayout.TableLayout;
import com.mgmtp.a12.print.model.api.model.element.type.text.TextElement;
import com.mgmtp.a12.print.model.api.model.reference.ElementReference;
import com.mgmtp.a12.print.model.api.model.reference.PlaceableReference;
import com.mgmtp.a12.print.model.api.walker.DescendCommand;
import com.mgmtp.a12.print.model.api.walker.TraversalCommand;
import com.mgmtp.a12.print.model.api.walker.model.ExhaustivePrintModelVisitor;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;
import com.mgmtp.a12.print.model.document.internal.base.IContentHolder;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

import java.util.Collections;
import java.util.Optional;
import java.util.function.Function;

@RequiredArgsConstructor
public class MarkupFactoryBuilder implements ExhaustivePrintModelVisitor {

	private final PrintDocumentContext printDocumentContext;
	private Function<InternalPdfPrintEngineRuntime, ValueFactory<MarkupResult>> markupResult = null;

	private static Optional<PlaceableReference> getPlaceableReference(PrintModelElement element, PrintModelPath path) {
		return path.findReferenceCallSite(element)
				   .flatMap(e -> e.tryCastTracedElement(PlaceableReference.class))
				   .map(PrintModelTreeTrace::getTracedElement);
	}

	private void setMarkupResultFactory(Function<InternalPdfPrintEngineRuntime, ValueFactory<MarkupResult>> factory) {
		if (markupResult != null) {
			throw new PrintException("malformed markup result creation");
		}
		markupResult = factory;
	}

	private ValueFactory<MarkupResult> emptyMarkup(
		@NonNull final PrintModelElement element
	) {
		return () -> new MarkupResult(
			element.getId(),
			Constants.EMPTY_STRING
		);
	}

	private ValueFactory<MarkupResult> templateResult(
		@NonNull final InternalPdfPrintEngineRuntime runtime,
		@NonNull String templateName,
		final boolean hasEmptyContent,
		@NonNull final PrintModelElement element,
		@NonNull final HtmlTemplateParameters templateParameters
	) {
		final var html = runtime.provide(new HtmlDependency(
			templateName,
			templateParameters
		));
		final var id = element.getId();
		return () -> new MarkupResult(
			id,
			html.get(),
			hasEmptyContent
		);
	}

	public Function<InternalPdfPrintEngineRuntime, ValueFactory<MarkupResult>> single() {
		if (markupResult == null) {
			throw new PrintException("malformed markup result creation");
		}
		return markupResult;
	}

	@Override
	public TraversalCommand visitField(Field field, PrintModelPath path) {
		setMarkupResultFactory(runtime -> {
			final var formattingResult = runtime.provide(new FieldValueDependency(
				field,
				printDocumentContext
			)).get();
			return runtime.provide(
				new TextBasedElementMarkupDependency(
					new PrintModelTreeTrace<>(path, field),
					() -> formattingResult.map(FormattingResult::getFormattedValue),
					Collections.emptyMap(),
					formattingResult.map(FormattingResult::isHtml).orElse(false)
				)
			);
		});
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitCalculation(Calculation calculation, PrintModelPath path) {
		setMarkupResultFactory(runtime -> {
			final var formattingResult = runtime.provide(
				new CalculationValueDependency(new PrintModelTreeTrace<>(path, calculation), printDocumentContext)
			).get();
			return runtime.provide(
				new TextBasedElementMarkupDependency(
					new PrintModelTreeTrace<>(path, calculation),
					() -> formattingResult.map(FormattingResult::getFormattedValue),
					Collections.emptyMap(),
					formattingResult.map(FormattingResult::isHtml).orElse(false)
				)
			);
		});
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitText(TextElement text, PrintModelPath path) {
		setMarkupResultFactory(runtime -> {
			var results = runtime.streamReferenceMarkupResultDependency(
				ReferenceMarkupResultDependency.ofContainerReferences(new PrintModelTreeTrace<>(path, text), printDocumentContext)
			).toList();
			final var textValueResult = runtime.provide(new TextValueDependency(
				text,
				results.stream().map(res ->
					new TextValueMarkup(res.getId(), res.getMarkup(), true, res.hasEmptyContent())
				).toList()
			)).get();
			return runtime.provide(
				new TextBasedElementMarkupDependency(
					new PrintModelTreeTrace<>(path, text),
					textValueResult::value,
					textValueResult.pageNumberGlobalStyles(),
					true
				)
			);
		});
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitExpression(Expression expression, PrintModelPath path) {
		final var expressionTrace = new PrintModelTreeTrace<>(path, expression);
		setMarkupResultFactory(runtime -> {
			final var evaluatedValue = runtime.provide(new ExpressionValueDependency(expressionTrace, (traces ->
				runtime.streamElementMarkupResultDependency(
					traces.stream().map(
						trace -> new ElementMarkupResultDependency(
							trace,
							printDocumentContext
						)
					)
				).map(res -> new TextValueMarkup(res.getId(), res.getMarkup(), true, res.hasEmptyContent())).toList())));

			return runtime.provide(new TextBasedElementMarkupDependency(
				new PrintModelTreeTrace<>(path, expression),
				evaluatedValue,
				Collections.emptyMap(),
				true
			));
		});
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitPageNumber(PageNumber pageNumber, PrintModelPath path) {
		setMarkupResultFactory(runtime -> emptyMarkup(pageNumber));
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitPageNumberTotal(PageNumberTotal pageNumberTotal, PrintModelPath path) {
		setMarkupResultFactory(runtime -> emptyMarkup(pageNumberTotal));
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitHorizontalLine(HorizontalLine horizontalLine, PrintModelPath path) {
		setMarkupResultFactory(runtime -> templateResult(
			runtime,
			"element/line.ftlx",
			false,
			horizontalLine,
			HorizontalLineHtmlTemplateParameters
				.builder()
				.element(horizontalLine)
				.placeableReference(getPlaceableReference(horizontalLine, path).orElseThrow(() -> new PrintException("invalid nested Horizontal Line")))
				.build()
		));
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitImage(Image image, PrintModelPath path) {
		setMarkupResultFactory(runtime -> {
			final var src = runtime.provide(new ImageValueDependency(image, printDocumentContext));
			final var placeableReference = getPlaceableReference(image, path);
			final var imageSrc = src.get();
			final var srcUri = imageSrc.orElse(Constants.EMPTY_STRING);
			return templateResult(
				runtime,
				"element/image.ftlx",
				imageSrc.isEmpty(),
				image,
				ImageHtmlTemplateParameters
					.builder()
					.element(image)
					.placeableReference(placeableReference.orElse(null))
					.srcUri(srcUri)
					.alternativeText(image.getImageProperties().getAlternativeText())
					.imageDimensions(image.getImageProperties().getDimensions())
					.build()
			);
		});
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitTable(Table table, PrintModelPath path) {
		final var tableTrace = new PrintModelTreeTrace<>(path, table);
		setMarkupResultFactory(runtime -> runtime.provide(
			new TableMarkupDependency(
				tableTrace,
				runtime.provide(
					new TableValuesDependency(
						tableTrace,
						printDocumentContext,
						(subRange, references) -> runtime.streamReferenceMarkupResultDependency(
							references
								.stream()
								.map(reference -> new ReferenceMarkupResultDependency(tableTrace.createDescendent(reference), subRange))
						).map(IContentHolder.class::cast).toList(),
						(trace, value, type) -> runtime.provide(
							new TextBasedElementMarkupDependency(trace, value, Collections.emptyMap(), false)
						).get()
					)
				)
			)
		));
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitTableLayout(TableLayout tableLayout, PrintModelPath path) {
		setMarkupResultFactory(runtime -> runtime.provide(
			new TableLayoutMarkupDependency(
				new PrintModelTreeTrace<>(path, tableLayout),
				runtime.provide(
					new TableLayoutValuesDependency(
						new PrintModelTreeTrace<>(path, tableLayout),
						(ref) -> runtime.provide(
							new ReferenceMarkupResultDependency(ref, printDocumentContext)
						).get()
					)
				)
			)
		));
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitBoundingBox(BoundingBox boundingBox, PrintModelPath path) {
		visitedByNestedContainerSpreadExpression("BoundingBox");
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitArea(Area area, PrintModelPath path) {
		visitedByNestedContainerSpreadExpression("Area");
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitSwitch(Switch switchElement, PrintModelPath path) {
		visitedByNestedContainerSpreadExpression("Switch");
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
		setMarkupResultFactory(runtime -> runtime.provide(
				new ListingMarkupDependency(
					listingTrace,
					runtime.provide(new ListingValueDependency(
						listingTrace,
						printDocumentContext,
						(textStyleDependency) -> runtime.provide(textStyleDependency).get()
					)).get()
				)
			)
		);
		return TraversalCommand.HALT;
	}

	private void evaluateChart(Chart chart, PrintModelPath path) {
		setMarkupResultFactory(runtime -> {
			final var chartTreeTrace = new PrintModelTreeTrace<>(path, chart);
			final var chartValue = runtime.provide(new ChartValueDependency(chartTreeTrace, printDocumentContext));
			final var placeableReference = getPlaceableReference(chart, path);
			final var chartSrc = chartValue.get();
			final var srcUri = chartSrc.orElse(Constants.EMPTY_STRING);

			final var referenceInputSourceResolver =  ReferenceInputSourceResolver.builder()
				.runtime(runtime)
				.printModelTreeTrace(new PrintModelTreeTrace<>(path, chart))
				.build();

			final var alternativeText = InputValueSourceResolver.getInputValue(chart.getChartProperties().getTitle(), referenceInputSourceResolver)
				.map(title -> String.format(
					"%s: %s",
					chart.getType().name(),
					chart.getType().name())
				)
				.orElse(chart.getType().name());

			return templateResult(
				runtime,
				"element/chart.ftlx",
				chartSrc.isEmpty(),
				chart,
				ChartHtmlTemplateParameters
					.builder()
					.element(chart)
					.placeableReference(placeableReference.orElse(null))
					.base64ImageData(srcUri)
					.alternativeText(alternativeText)
					.dimensions(chart.getChartProperties().getDimensions())
					.build()
			);
		});
	}

	private void visitedByNestedContainerSpreadExpression(String element) {
		throw new PrintException(String.format("The %s should not be visited in the MarkupFactoryBuilder because it is handled by the NestedContainerSpreadExpression", element));
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

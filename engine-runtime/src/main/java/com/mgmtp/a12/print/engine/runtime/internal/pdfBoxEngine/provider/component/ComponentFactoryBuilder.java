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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component;

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintDomainException;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.expression.ExpressionValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.listing.ListingValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.table.TableValuesDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.text.TextValueMarkup;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.inputSource.ReferenceInputSourceResolver;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.FormattingResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.textStyleResolver.TextStyleDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.ElementComponentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.ReferenceComponentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.BoxComponent;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.EntityComponent;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.TextComponentContent;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.*;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.text.TextComponentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.text.TextElementComponentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Size;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.SizeResolverUtils;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.HtmlStyle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.TextRenderStyle;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.container.BaseReferenceContainer;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.element.base.Dimensions;
import com.mgmtp.a12.print.model.api.model.element.base.inputSource.StringInputSource;
import com.mgmtp.a12.print.model.api.model.element.properties.BorderProperties;
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
import com.mgmtp.a12.print.model.api.model.reference.PlaceableReference;
import com.mgmtp.a12.print.model.api.walker.DescendCommand;
import com.mgmtp.a12.print.model.api.walker.TraversalCommand;
import com.mgmtp.a12.print.model.api.walker.model.ExhaustivePrintModelVisitor;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;
import com.mgmtp.a12.print.model.document.internal.base.IContentHolder;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;

import java.util.Optional;
import java.util.function.Function;

import static com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants.EMPTY_STRING;
import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Size.EMPTY_SIZE;

@RequiredArgsConstructor
public class ComponentFactoryBuilder implements ExhaustivePrintModelVisitor {

	private final PrintDocumentContext printDocumentContext;
	@NonNull
	private final PDDocument pdDocument;
	private final Long containerWidth;
	private final int totalPageCount;
	private final int currentPageCount;
	private Function<InternalPdfBoxPrintEngineRuntime, ValueFactory<Component>> component = null;

	private static Optional<PlaceableReference> getPlaceableReference(PrintModelElement element, PrintModelPath path) {
		return path.findReferenceCallSite(element)
				   .flatMap(e -> e.tryCastTracedElement(PlaceableReference.class))
				   .map(PrintModelTreeTrace::getTracedElement);
	}

	private static Optional<PlaceableReference> getPlaceableReference(String id, PrintModelPath path) {
		return path.findReferenceCallSite(id)
			.flatMap(e -> e.tryCastTracedElement(PlaceableReference.class))
			.map(PrintModelTreeTrace::getTracedElement);
	}

	private void setComponentFactory(Function<InternalPdfBoxPrintEngineRuntime, ValueFactory<Component>> factory) {
		if (component != null) {
			throw new PrintException("Malformed component creation");
		}
		component = factory;
	}


	public Function<InternalPdfBoxPrintEngineRuntime, ValueFactory<Component>> single() {
		if (component == null) {
			throw new PrintException("Malformed component result creation");
		}
		return component;
	}

	@Override
	public TraversalCommand visitImage(Image image, PrintModelPath path) {
		setComponentFactory(runtime -> runtime.provide(new ImageComponentDependency(
			image, printDocumentContext
		)));
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitField(Field field, PrintModelPath path) {
		setComponentFactory(runtime -> runtime.provide(
			new FieldComponentDependency(
				new PrintModelTreeTrace<>(path, field),
				printDocumentContext
			)
		));
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitCalculation(Calculation calculation, PrintModelPath path) {
		setComponentFactory(runtime -> runtime.provide(
			new CalculationComponentDependency(
				new PrintModelTreeTrace<>(path, calculation),
				printDocumentContext
			)
		));
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitText(TextElement text, PrintModelPath path) {
		setComponentFactory(runtime -> {
			final long width;
			if (containerWidth != null) {
				width = containerWidth;
			} else {
				var ref = getPlaceableReference(text, path).orElseThrow(() -> new PrintException("Placeable reference not found"));
				width = PDFUnitUtil.mmToLongPt(ref.getDimensions().getWidth().getValue());
			}

			var results = runtime.streamReferenceComponentDependency(
				ReferenceComponentDependency.ofContainerReferences(
					new PrintModelTreeTrace<>(path, text), printDocumentContext, pdDocument, totalPageCount, currentPageCount
				)
			).toList();
			final var textValueMarkups = results.stream().map(el -> (TextValueMarkup) mapTextValue(el)).toList();
			return runtime.provide(
				new TextElementComponentDependency(
					new PrintModelTreeTrace<>(path, text),
					textValueMarkups,
					text.getTextProperties().orElse(null),
					text.getBorderProperties().orElse(null),
					width,
					pdDocument
				)
			);
		});
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitExpression(Expression expression, PrintModelPath path) {
		final var expressionTrace = new PrintModelTreeTrace<>(path, expression);
		setComponentFactory(runtime -> {
			var ref = getPlaceableReference(expression, path);
			final var textValueResult = runtime.provide(new ExpressionValueDependency(expressionTrace, (traces ->
				runtime.streamElementComponentDependency(
					traces.stream().map(
						trace -> new ElementComponentDependency(
							trace,
							printDocumentContext,
							pdDocument,
							totalPageCount,
							currentPageCount
						)
					)
				).map(el -> (TextValueMarkup) mapTextValue(el)).toList())));

			// ref is empty, when expression is child of table
			if (ref.isEmpty()) {
				return () -> new EntityComponent(
					expression.getId(),
					expressionTrace,
					textValueResult.get().map(res -> FormattingResult.builder()
						.formattedValue(res)
						.isHtml(true)
						.build()
					).orElse(null),
					EMPTY_SIZE
				);
			}

			final var referenceInputSourceResolver = ReferenceInputSourceResolver.builder()
				.runtime(runtime)
				.printModelTreeTrace(new PrintModelTreeTrace<>(expressionTrace.getPath(), expressionTrace.getTracedElement()))
				.build();
			final var textProperties = expression.getTextProperties().orElse(null);
			final Optional<StringInputSource> textStyleId = SizeResolverUtils.getOptTextStyleId(textProperties);
			final var textStyle = runtime.provide(TextStyleDependency.create(
				textStyleId, referenceInputSourceResolver
			)).get();

			return runtime.provide(
				new TextComponentDependency(
					new PrintModelTreeTrace<>(path, expression),
					textValueResult.get().orElse(null),
					HtmlStyle.ofTextProperties(textProperties, referenceInputSourceResolver),
					TextRenderStyle.EMPTY_STYLE.withTextStyle(textStyle),
					expression.getBorderProperties().orElse(null),
					PDFUnitUtil.mmToLongPt(ref.get().getDimensions().getWidth().getValue()),
					true,
					pdDocument
				)
			);
		});
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitPageNumber(PageNumber pageNumber, PrintModelPath path) {
		final var trace = new PrintModelTreeTrace<>(path, pageNumber);
		if (currentPageCount == -1) {
			throw new PrintDomainException("Page Numbers are only allowed on sections");
		}
		setComponentFactory(runtime -> () -> new EntityComponent(
			pageNumber.getId(), trace, FormattingResult.builder().formattedValue(String.valueOf(currentPageCount)).isHtml(false).build(), EMPTY_SIZE
		));
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitPageNumberTotal(PageNumberTotal pageNumberTotal, PrintModelPath path) {
		final var trace = new PrintModelTreeTrace<>(path, pageNumberTotal);
		if (totalPageCount == -1) {
			throw new PrintDomainException("Page Number Totals are only allowed on sections");
		}
		setComponentFactory(runtime -> () -> new EntityComponent(
			pageNumberTotal.getId(), trace, FormattingResult.builder().formattedValue(String.valueOf(totalPageCount)).isHtml(false).build(), EMPTY_SIZE
		));
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitBoundingBox(BoundingBox boundingBox, PrintModelPath path) {
		setBoxComponent(
			boundingBox,
			boundingBox.getBorderProperties().orElse(null),
			boundingBox.getBoundingBoxProperties().getDimensions()
		);
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitOverrideElement(final OverrideElement overrideElement, final PrintModelPath path) {
		setComponentFactory(runtime -> {
			var ref = getPlaceableReference(
				overrideElement.getOverrideProperties().getRefId(),
				path
			).orElseThrow(() -> new PrintException("Placeable reference not found"));
			return () -> new BoxComponent(
				ref.getRefId(),
				Size.ofReference(ref),
				null,
				overrideElement.getType()
			);
		});
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitArea(Area area, PrintModelPath path) {
		setBoxComponent(
			area,
			area.getBorderProperties().orElse(null),
			area.getAreaProperties().getDimensions()
		);
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitSwitch(Switch switchElement, PrintModelPath path) {
		setBoxComponent(switchElement, null, switchElement.getSwitchProperties().getDimensions());
		return TraversalCommand.HALT;
	}

	private void setBoxComponent(
		PrintModelElement element,
		BorderProperties borderProperties,
		Dimensions dimensions
	) {
		setComponentFactory(runtime -> () -> new BoxComponent(
			element.getId(),
			Size.ofDimensions(dimensions),
			borderProperties,
			element.getType()
		));
	}

	@Override
	public TraversalCommand visitListing(Listing listing, PrintModelPath path) {
		final var listingTrace = new PrintModelTreeTrace<>(path, listing);
		setComponentFactory(runtime -> {
			final var ref = getPlaceableReference(listing, path)
				.orElseThrow(() -> new PrintException("Invalid nested Listing"));
			final var listingValues = runtime.provide(new ListingValueDependency(
				listingTrace,
				printDocumentContext,
				textStyleDependency -> runtime.provide(textStyleDependency).get()
			)).get();
			return runtime.provide(new ListingComponentDependency(
				listingTrace,
				listingValues,
				ref.getDimensions(),
				pdDocument,
				printDocumentContext
			));
		});
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitHorizontalLine(HorizontalLine horizontalLine, PrintModelPath path) {
		setComponentFactory(runtime -> {
			final var ref = getPlaceableReference(horizontalLine, path)
				.orElseThrow(() -> new PrintException("Invalid nested Horizontal Line"));
			return runtime.provide(new LineComponentDependency(horizontalLine, ref.getDimensions()));
		});
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitTable(Table table, PrintModelPath path) {
		final var tableTrace = new PrintModelTreeTrace<>(path, table);
		setComponentFactory(runtime -> {
			final var ref = getPlaceableReference(table, path)
				.orElseThrow(() -> new PrintException("Invalid nested Table"));
			final var tableResult = runtime.provide(new TableValuesDependency(
				new PrintModelTreeTrace<>(path, table),
				printDocumentContext,
				(subRange, references) -> runtime.streamReferenceComponentDependency(
					references
						.stream()
						.map(reference -> new ReferenceComponentDependency(
							tableTrace.createDescendent(reference), subRange, pdDocument, totalPageCount, currentPageCount)
						)
				).map(ComponentFactoryBuilder::mapTextValue).map(el -> (IContentHolder) el).toList(),
				(trace, value, type) -> new TextComponentContent(
					trace.getTracedElement().getId(),
					trace,
					value.get().orElse(EMPTY_STRING),
					false,
					false
				)
			)).get();

			return runtime.provide(new TableComponentDependency(
				new PrintModelTreeTrace<>(path, table),
				ref.getDimensions(),
				tableResult,
				pdDocument
			));
		});
		return TraversalCommand.HALT;
	}

	@Override
	public TraversalCommand visitTableLayout(TableLayout tableLayout, PrintModelPath path) {
		setComponentFactory(runtime -> {
			final var ref = getPlaceableReference(tableLayout, path)
				.orElseThrow(() -> new PrintException("Invalid nested Table Layout"));
			return runtime.provide(new TableLayoutComponentDependency(
				new PrintModelTreeTrace<>(path, tableLayout),
				ref.getDimensions(),
				pdDocument,
				totalPageCount,
				currentPageCount,
				printDocumentContext
			));
		});
		return TraversalCommand.HALT;
	}

	private static TextComponentContent mapTextValue(
		Component component
	) {
		if (component instanceof EntityComponent entityComponent) {
			final var formattedResult = Optional.ofNullable(entityComponent.getFormattingResult());

			String value;
			boolean isHtml = false;
			if (formattedResult.isPresent()) {
				final var formattedValue = formattedResult.get().getFormattedValue();
				isHtml = formattedResult.get().isHtml();
				value = formattedValue;
			} else {
				value = EMPTY_STRING;
			}

			return new TextComponentContent(component.getId(), entityComponent.getPrintModelElementTrace(), value, isHtml, formattedResult.isEmpty());
		}

		throw new PrintException("Unsupported component type {}", component.getClass().getName());
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

	private void evaluateChart(Chart chart, PrintModelPath path) {
		setComponentFactory(runtime -> runtime.provide(new ChartComponentDependency(chart, path, printDocumentContext)));
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

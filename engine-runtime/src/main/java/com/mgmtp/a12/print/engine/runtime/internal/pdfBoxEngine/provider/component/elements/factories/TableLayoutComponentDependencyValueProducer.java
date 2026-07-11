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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.runtime.internal.PdfBoxDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.inputSource.ReferenceInputSourceResolver;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.referenceResolver.ReferenceElementDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.Component;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.ReferenceComponentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.ComponentCell;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.ComponentRow;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.TableComponent;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.TextComponent;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.BoxStyleParameters;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.PrintRenderingException;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Size;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.SizeResolverUtils;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.TableColumnWidthUtil;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.TextRenderStyle;
import com.mgmtp.a12.print.model.api.inputSource.InputValueSourceResolver;
import com.mgmtp.a12.print.model.api.model.PrintModelEntity;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.base.Measure;
import com.mgmtp.a12.print.model.api.model.element.base.Styleable;
import com.mgmtp.a12.print.model.api.model.element.base.inputSource.InputSource;
import com.mgmtp.a12.print.model.api.model.element.base.inputSource.PossibleInputSource;
import com.mgmtp.a12.print.model.api.model.element.properties.BorderProperties;
import com.mgmtp.a12.print.model.api.model.element.type.tableLayout.ColumnProperties;
import com.mgmtp.a12.print.model.api.model.element.type.tableLayout.RowProperties;
import com.mgmtp.a12.print.model.api.model.element.type.tableLayout.TableLayout;
import com.mgmtp.a12.print.model.api.model.reference.TableLayoutCellReference;
import lombok.NonNull;
import org.apache.pdfbox.pdmodel.PDDocument;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public class TableLayoutComponentDependencyValueProducer implements PdfBoxDependencyValueProvider<Component, TableLayoutComponentDependency> {
	public static final int DEFAULT_ROW_HEIGHT_IN_MM = 10;

	@Override
	public ValueFactory<Component> produce(TableLayoutComponentDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfBoxPrintEngineRuntime runtime) {
		final var document = dependency.getDocument();
		final var totalPageCount = dependency.getTotalPageCount();
		final var currentPageCount = dependency.getCurrentPageCount();
		final var printDocumentContext = dependency.getPrintDocumentContext();
		final var tableLayoutTrace = dependency.getTableLayoutTrace();
		final var tableLayout = tableLayoutTrace.getTracedElement();
		final var containerWidth = PDFUnitUtil.mmToLongPt(dependency.getDimensions().getWidth().getValue());
		final var cells = tableLayout.getTableLayoutProperties().getCells();
		final var columnCount = tableLayout.getTableLayoutProperties().getColumnCount();
		final var rowCount = tableLayout.getTableLayoutProperties().getRowCount();
		final var rowProperties = tableLayout.getTableLayoutProperties().getRowProperties();
		final var borderProperties = tableLayout.getBorderProperties().orElse(null);
		final var textProperties = tableLayout.getTextProperties().orElse(null);

		final long borderWidth = SizeResolverUtils.getBorderWidth(tableLayout.getBorderProperties().orElse(null));

		final var rowPropertiesMap = rowProperties.stream()
			.collect(Collectors.toMap(RowProperties::getIndex, x -> x));

		final var columnWidthMap = TableColumnWidthUtil.calculateColumnWidth(tableLayout, containerWidth);

		final var rows = getRows(
			rowCount,
			columnCount,
			rowPropertiesMap,
			cells,
			tableLayoutTrace,
			columnWidthMap,
			borderWidth,
			runtime,
			printDocumentContext,
			document,
			totalPageCount,
			currentPageCount
		);

		final long totalHeight = rows.stream().mapToLong(ComponentRow::getHeight).sum();

		return () -> new TableComponent(
			tableLayout.getId(),
			new Size(containerWidth, totalHeight),
			tableLayout.getType(),
			columnWidthMap,
			null,
			rows,
			borderProperties,
			textProperties,
			null,
			0
		);
	}

	private static List<ComponentRow> getRows(
		final int rowCount,
		final int colCount,
		@NonNull final Map<Integer, RowProperties> rowPropertiesMap,
		@NonNull final List<TableLayoutCellReference> cells,
		@NonNull PrintModelTreeTrace<TableLayout> tableLayoutTrace,
		@NonNull final Map<Integer, Long> columnWidthMap,
		final long borderWidth,
		@NonNull final InternalPdfBoxPrintEngineRuntime runtime,
		PrintDocumentContext printDocumentContext,
		@NonNull PDDocument document,
		int totalPageCount,
		int currentPageCount
	) {
		final var verticalAlignmentMap = getVerticalAlignmentMap(tableLayoutTrace.getTracedElement().getTableLayoutProperties().getColumnProperties());
		return IntStream.rangeClosed(1, rowCount).mapToObj(rowIndex ->
			getRow(
				rowIndex,
				colCount,
				rowPropertiesMap,
				cells,
				tableLayoutTrace,
				columnWidthMap,
				verticalAlignmentMap,
				borderWidth,
				runtime,
				printDocumentContext,
				document,
				totalPageCount,
				currentPageCount
			)
		).toList();
	}

	private static ComponentRow getRow(
		final int rowIndex,
		final int colCount,
		@NonNull final Map<Integer, RowProperties> rowPropertiesMap,
		@NonNull final List<TableLayoutCellReference> cells,
		@NonNull PrintModelTreeTrace<TableLayout> tableLayoutTrace,
		@NonNull final Map<Integer, Long> columnWidthMap,
		@NonNull final Map<Integer, ColumnProperties.VerticalAlignment> verticalAlignmentMap,
		final long borderWidth,
		@NonNull final InternalPdfBoxPrintEngineRuntime runtime,
		PrintDocumentContext printDocumentContext,
		@NonNull PDDocument document,
		int totalPageCount,
		int currentPageCount
	) {
		final var components = new ArrayList<ComponentCell>();
		long maxCellHeight = 0;

		final var borderProperties = tableLayoutTrace.getTracedElement().getBorderProperties().orElseThrow(() -> new PrintRenderingException("Table layout border properties are required"));
		for (var i = 1; i <= colCount; i++) {
			final int finalI = i;
			final var cellOpt = cells.stream().filter(c ->
				c.getRow() == rowIndex - 1 && c.getColumn() == finalI - 1
			).findFirst();

			if (cellOpt.isEmpty()) {
				components.add(new ComponentCell(null, null, TextRenderStyle.EMPTY_STYLE, 1));
				continue;
			}

			final var cell = cellOpt.get();
			final var columnWidth = columnWidthMap.get(cell.getColumn());

			final var referenceTrace = tableLayoutTrace.createDescendent(cell);
			final var nestedBorderProperties = runtime.provide(new ReferenceElementDependency(referenceTrace)).get()
				.flatMap(el -> el.tryCastTracedElement(Styleable.class))
				.flatMap(el -> el.getTracedElement().getBorderProperties())
				.orElseThrow(() -> new PrintRenderingException("Nested border properties are required"));
			final boolean isBorderUnchanged = nestedBorderProperties.getBorderStyle().map(InputSource::getSource).filter(x -> x.equals(PossibleInputSource.INHERITED)).isPresent()
				&& nestedBorderProperties.getBorderWidth().map(InputSource::getSource).filter(x -> x.equals(PossibleInputSource.INHERITED)).isPresent();

			var component = (TextComponent) runtime.provide(new ReferenceComponentDependency(
				tableLayoutTrace.createDescendent(cell),
				printDocumentContext,
				document,
				isBorderUnchanged ? Math.max(0, columnWidth - 2 * borderWidth) : columnWidth,
				totalPageCount,
				currentPageCount
			)).get();


			BorderProperties appliedBorderProperties = borderProperties;
			if (component != null) {
				// Take Border from nested TextElement for the Grid Renderer but remove it from the TextElement
				component = component.toBuilder().borderProperties(null).build();
				appliedBorderProperties = nestedBorderProperties;

			}

			final var verticalAlignment = verticalAlignmentMap.get(i - 1);
			final TextRenderStyle textRenderStyle = TextRenderStyle.EMPTY_STYLE.withVerticalAlignment(verticalAlignment);
			PrintModelTreeTrace<PrintModelEntity> printModelTreeTrace = tableLayoutTrace.tryCastTracedElement(PrintModelEntity.class).orElseThrow();
			ReferenceInputSourceResolver referenceInputSourceResolver = ReferenceInputSourceResolver.builder()
				.runtime(runtime)
				.printModelTreeTrace(printModelTreeTrace)
				.build();
			final BoxStyleParameters nestedBoxStyle = BoxStyleParameters.fromPropertiesBuilder(appliedBorderProperties, null, referenceInputSourceResolver).build();
			if (component != null && !isBorderUnchanged) {
				final long sizeReduction = 2 * nestedBoxStyle.getBorderWidth();
				final Size newSize = Size.reduceSize(component.getSize(), sizeReduction);
				component = component.toBuilder()
					.size(newSize)
					.build();
			}
			components.add(
				new ComponentCell(component, nestedBoxStyle, textRenderStyle, 1)
			);

			final long cellHeight = component.getSize().getHeight() + 2 * nestedBoxStyle.getBorderWidth();
			if (component != null && maxCellHeight < cellHeight) {
				maxCellHeight = cellHeight;
			}
		}

		final long minHeightRow = getMinHeightRow(rowPropertiesMap, rowIndex);
		final var rowCells = cells.stream().filter(c -> c.getRow() == rowIndex - 1).toList();

		if (rowCells.isEmpty()) {
			return new ComponentRow(components, minHeightRow);
		}

		return new ComponentRow(components, Math.max(maxCellHeight, minHeightRow));
	}

	private static Map<Integer, ColumnProperties.VerticalAlignment> getVerticalAlignmentMap(
		@NonNull final List<ColumnProperties> columnProperties
	) {
		final var verticalAlignmentMap = new HashMap<Integer, ColumnProperties.VerticalAlignment>();

		columnProperties.forEach(columnProperty -> {
			final var verticalAlignment = columnProperty.getVerticalAlignment();
			if (verticalAlignment != null) {
				verticalAlignmentMap.put(columnProperty.getIndex() - 1, verticalAlignment);
			}
		});

		return verticalAlignmentMap;
	}

	private static long getMinHeightRow(final Map<Integer, RowProperties> rowPropertiesMap, int rowIndex) {
		final float minHeightRowMm = Optional.ofNullable(rowPropertiesMap.get(rowIndex))
			.map(RowProperties::getMinHeight)
			.map(InputValueSourceResolver::getInputValue)
			.flatMap(measure -> measure
				.map(Measure::getValue))
			.orElse(DEFAULT_ROW_HEIGHT_IN_MM);
		return PDFUnitUtil.mmToLongPt(minHeightRowMm);
	}
}

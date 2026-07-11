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
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.listing.ListingValues;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.inputSource.ReferenceInputSourceResolver;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.textStyleResolver.TextStyleDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.Component;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.ComponentCell;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.ComponentRow;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.TableComponent;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.TextComponent;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.BoxStyleParameters;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.text.TextComponentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.PDFUnitUtil;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Size;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.SizeResolverUtils;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.TableColumnWidthUtil;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.HtmlStyle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.TextRenderStyle;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.base.inputSource.StringInputSource;
import com.mgmtp.a12.print.model.api.model.element.properties.BorderProperties;
import com.mgmtp.a12.print.model.api.model.element.properties.TextProperties;
import com.mgmtp.a12.print.model.api.model.element.type.listing.GroupPropertyComputation;
import com.mgmtp.a12.print.model.api.model.element.type.listing.Listing;
import com.mgmtp.a12.print.model.api.model.element.type.listing.RowPropertyComputation;
import com.mgmtp.a12.print.model.api.model.element.type.listing.column.ColumnPropertyComputation;
import com.mgmtp.a12.print.model.api.model.element.type.listing.column.ListingColumn;
import lombok.NonNull;
import org.apache.pdfbox.pdmodel.PDDocument;

import java.util.*;

import static com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants.EMPTY_STRING;
import static com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.listing.ListingPathUtils.checkIsSubPath;
import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.tokenizing.HtmlStyle.checkObjectIsBooleanAndTrue;

public class ListingComponentDependencyValueProducer implements PdfBoxDependencyValueProvider<Component, ListingComponentDependency> {

	@Override
	public ValueFactory<Component> produce(ListingComponentDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfBoxPrintEngineRuntime runtime) {
		final var document = dependency.getDocument();
		final var values = dependency.getListingValueResult();
		final var headerCells = values.getHeaderCells();
		final var rows = values.getRows();
		final var trace = dependency.getListingTreeTrace();
		final var listing = trace.getTracedElement();
		final var listingProperties = listing.getListingProperties();

		final var referenceInputSourceResolver = ReferenceInputSourceResolver.builder()
			.runtime(runtime)
			.printModelTreeTrace(new PrintModelTreeTrace<>(trace.getPath(), trace.getTracedElement()))
			.build();

		final var borderProperties = listing.getBorderProperties().orElse(null);
		final var textProperties = listing.getTextProperties().orElse(null);
		final var headerTextProperties = listingProperties.getHeaderTextProperties().orElse(textProperties);

		final var maxWidth = PDFUnitUtil.mmToLongPt(dependency.getDimensions().getWidth().getValue());
		final var borderWidth = SizeResolverUtils.getBorderWidth(borderProperties);
		final var columnWidthMap = TableColumnWidthUtil.calculateColumnWidth(values.getRows(), listing, maxWidth, borderWidth);

		final var headerRow = headerCells == null
			? null
			: getHeaderRow(
				headerCells,
				headerTextProperties,
				borderProperties,
				columnWidthMap,
				trace,
				document,
				runtime,
				referenceInputSourceResolver
			);

		final var bodyRows = getRows(rows, listingProperties.getColumns(), columnWidthMap, trace, document, runtime, referenceInputSourceResolver);
		final var headerHeight = headerRow == null ? 0 : headerRow.getHeight();
		final var bodyHeight = bodyRows.stream().mapToLong(ComponentRow::getHeight).sum();

		final var tableHeight = headerHeight + bodyHeight;

		return () -> new TableComponent(
			listing.getId(),
			new Size(maxWidth, tableHeight),
			listing.getType(),
			filterNullValues(columnWidthMap),
			headerRow,
			bodyRows,
			borderProperties,
			textProperties,
			headerTextProperties,
			borderWidth,
			values.getAttachmentsToAppend()
		);
	}

	private static List<ComponentRow> getRows(
		@NonNull final List<ListingValues.MarkupListingRowValue> rows,
		@NonNull final List<ListingColumn> columns,
		@NonNull final Map<Integer, Long> columnWidthMap,
		@NonNull PrintModelTreeTrace<Listing> listingTrace,
		@NonNull PDDocument document,
		@NonNull final InternalPdfBoxPrintEngineRuntime runtime,
		@NonNull final ReferenceInputSourceResolver referenceInputSourceResolver
	) {
		return filterHiddenRows(rows).stream()
			.map(row ->
				getRow(row, columns, columnWidthMap, listingTrace, document, runtime, referenceInputSourceResolver)
			)
			.toList();
	}

	private static List<ListingValues.MarkupListingRowValue> filterHiddenRows(
		@NonNull final List<ListingValues.MarkupListingRowValue> rows
	) {
		final var groupHiddenFilteredRows = new ArrayList<ListingValues.MarkupListingRowValue>();
		String currentHiddenBasePath = null;

		for (var row : rows) {
			final var listingRowHidden = getListingGroupHidden(row);
			if (listingRowHidden || currentHiddenBasePath != null) {
				if (!listingRowHidden && !checkIsSubPath(row.getPath(), currentHiddenBasePath, false)) {
					currentHiddenBasePath = null;
					groupHiddenFilteredRows.add(row);
				} else if (currentHiddenBasePath == null || (listingRowHidden && !checkIsSubPath(row.getPath(), currentHiddenBasePath, false))) {
					currentHiddenBasePath = row.getPath();
				}
			} else if (!getListingRowHidden(row)) {
				groupHiddenFilteredRows.add(row);
			}
		}
		return groupHiddenFilteredRows;
	}

	private static ComponentRow getHeaderRow(
		@NonNull final List<String> cells,
		final TextProperties textProperties,
		final BorderProperties borderProperties,
		@NonNull final Map<Integer, Long> columnWidthMap,
		@NonNull PrintModelTreeTrace<Listing> listingTrace,
		@NonNull PDDocument document,
		@NonNull final InternalPdfBoxPrintEngineRuntime runtime,
		@NonNull final ReferenceInputSourceResolver referenceValueSourceResolver
	) {
		final var components = new ArrayList<ComponentCell>();
		long maxCellHeight = 0;

		final Optional<StringInputSource> textStyleId = SizeResolverUtils.getOptTextStyleId(textProperties);
		final var textStyle = runtime.provide(TextStyleDependency.create(
			textStyleId, referenceValueSourceResolver
		)).get();

		final BoxStyleParameters boxStyle = BoxStyleParameters.fromProperties(borderProperties, textProperties);
		final HtmlStyle htmlStyle = HtmlStyle.ofTextProperties(textProperties, referenceValueSourceResolver, true);
		final TextRenderStyle textRenderStyle = TextRenderStyle.EMPTY_STYLE.withTextStyle(textStyle);

		for (var i = 0; i < cells.size(); i++) {
			final var cell = cells.get(i);

			if (columnWidthMap.get(i) == null) {
				continue;
			}

			final long columnWidth = columnWidthMap.get(i);
			final long borderWidth = boxStyle.getBorderWidth();
			final long cellWidth = Math.max(0, columnWidth - borderWidth);

			final var component = (TextComponent) runtime.provide(new TextComponentDependency(
					listingTrace,
					cell,
					htmlStyle,
					textRenderStyle,
					null,
					cellWidth,
					false,
					document
			)).get();


			components.add(
				new ComponentCell(component, boxStyle, textRenderStyle, 1)
			);

			if (component != null) {
				final var cellHeight = component.getSize().getHeight() + borderWidth;
				if (maxCellHeight < cellHeight) {
					maxCellHeight = cellHeight;
				}
			}
		}

		return new ComponentRow(components, maxCellHeight);
	}

	private static ComponentRow getRow(
		@NonNull final ListingValues.MarkupListingRowValue row,
		@NonNull final List<ListingColumn> columns,
		@NonNull final Map<Integer, Long> columnWidthMap,
		@NonNull PrintModelTreeTrace<Listing> listing,
		@NonNull PDDocument document,
		@NonNull final InternalPdfBoxPrintEngineRuntime runtime,
		@NonNull final ReferenceInputSourceResolver referenceValueSourceResolver
	) {
		Listing listingElement = listing.getTracedElement();
		List<ListingValues.MarkupListingColumnValue> cells = row.getColumnValues();

		final var components = new ArrayList<ComponentCell>();
		long maxCellHeight = 0;

		final var rowProperties = getCellPropertiesMap(row, columnWidthMap, listingElement, referenceValueSourceResolver, runtime);

		for (var i = 0; i < cells.size(); i++) {
			if (columnWidthMap.get(i) == null) {
				continue;
			}

			final var cell = cells.get(i);

			final int colSpan = getIntProperty(cell.getColumnProperties(), ColumnPropertyComputation.PropertyType.COLUMN_SPAN, 1);
			final long spanWidth = TableColumnWidthUtil.sumVisibleSpanWidths(columnWidthMap, i, colSpan);

			final var cellProperties = rowProperties.get(i);

			final BoxStyleParameters boxStyle = cellProperties.boxStyle;
			final HtmlStyle style = cellProperties.htmlStyle;
			final TextRenderStyle textRenderStyle = cellProperties.textRenderStyle;


			final long horizontalBorder = calculateHorizontalCellBorder(columns, i, colSpan, rowProperties);
			final long cellContentWidth = Math.max(0, spanWidth - horizontalBorder);

			final var component = getCellComponent(listing, document, runtime, cell, style, textRenderStyle, cellContentWidth);

			components.add(new ComponentCell(component, boxStyle, textRenderStyle, colSpan));
			if (component != null) {
				final long cellHeight = component.getSize().getHeight() + boxStyle.getBorderWidth();
				if (maxCellHeight < cellHeight) {
					maxCellHeight = cellHeight;
				}
			}

			if (colSpan > 1) {
				for (int j = 1; j < colSpan; j++) {
					components.add(null);
				}
				i += colSpan - 1;
			}
		}

		return new ComponentRow(components, maxCellHeight);
	}

	private static TextComponent getCellComponent(
		PrintModelTreeTrace<Listing> listing,
		PDDocument document,
		InternalPdfBoxPrintEngineRuntime runtime,
		ListingValues.MarkupListingColumnValue cell,
		HtmlStyle style,
		TextRenderStyle textRenderStyle,
		long cellContentWidth
	) {
		final var cellHidden = getListingCellHidden(cell);
		final var cellValue = !cellHidden && getListingCellContentHidden(cell) ? EMPTY_STRING : cell.getValue();
		return cellHidden
			? null
			: (TextComponent) runtime.provide(
				new TextComponentDependency(
					listing,
					cellValue,
					style,
					textRenderStyle,
					null, // Border is handled by the TableComponent
					cellContentWidth,
					!cellValue.isEmpty() && cell.isHTML(),
					document
				)
			).get();
	}

	private record CellProperties(BoxStyleParameters boxStyle, HtmlStyle htmlStyle, TextRenderStyle textRenderStyle) {}

	private static Map<Integer, CellProperties> getCellPropertiesMap(
		@NonNull final ListingValues.MarkupListingRowValue row,
		@NonNull final Map<Integer, Long> columnWidthMap,
		@NonNull Listing listing,
		@NonNull final ReferenceInputSourceResolver referenceValueSourceResolver,
		InternalPdfBoxPrintEngineRuntime runtime
	) {
		List<ListingValues.MarkupListingColumnValue> cells = row.getColumnValues();

		final var rowBorderMap = new HashMap<Integer, CellProperties>();
		for (var i = 0; i < cells.size(); i++) {
			if (columnWidthMap.get(i) == null) {
				continue;
			}

			final var cell = cells.get(i);
			final var column = cell.getColumn();

			final Map<ColumnPropertyComputation.PropertyType, Object> colProperties = cell.getColumnProperties();
			final Map<RowPropertyComputation.PropertyType, Object> rowProperties = row.getRowProperties();

			final BorderProperties borderProperties = getAppliedBorderProperties(listing, column);
			final TextProperties textProperties = getAppliedTextProperties(listing, column);

			final BoxStyleParameters boxStyle = BoxStyleParameters.fromPropertiesBuilder(borderProperties, textProperties, referenceValueSourceResolver)
				.build()
				.setComputedColumnProperties(colProperties)
				.setComputedRowProperties(rowProperties);

			final HtmlStyle htmlStyle = HtmlStyle.ofTextProperties(textProperties, referenceValueSourceResolver)
				.withComputedColumnProperties(colProperties)
				.withComputedRowProperties(rowProperties)
				.toBuilder()
				.backgroundColor(null)
				.build();

			final Optional<StringInputSource> textStyleId = SizeResolverUtils.getOptTextStyleId(textProperties);
			final var textStyle = runtime.provide(TextStyleDependency.create(
				textStyleId, referenceValueSourceResolver
			)).get();

			final TextRenderStyle textRenderStyle = TextRenderStyle.EMPTY_STYLE
				.withComputedColumnProperties(colProperties)
				.withComputedRowProperties(rowProperties)
				.withTextStyle(textStyle);

			rowBorderMap.put(i, new CellProperties(boxStyle, htmlStyle, textRenderStyle));
		}

		return rowBorderMap;
	}

	private static BorderProperties getAppliedBorderProperties(Listing listing, ListingColumn column) {
		final boolean hasCustomBorderProperties = column.hasCustomBorderProperties().orElse(false);
		return hasCustomBorderProperties
			? column.getBorderProperties().orElse(null)
			: listing.getBorderProperties().orElse(null);
	}

	private static TextProperties getAppliedTextProperties(Listing listing, ListingColumn column) {
		final boolean hasCustomTextProperties = column.hasCustomTextProperties().orElse(false);
		return hasCustomTextProperties
			? column.getTextProperties().orElse(null)
			: listing.getTextProperties().orElse(null);
	}

	private static long calculateHorizontalCellBorder(
		@NonNull final List<ListingColumn> columns,
		final int index,
		final int colSpan,
		final Map<Integer, CellProperties> cellPropertiesMap
	) {
		final int prevIndex = index - 1;
		final int nextIndex = index + colSpan;

		final long ownBorder = getBorderWidthOrDefault(cellPropertiesMap.get(index), 0L);

		// If the previous row has a custom border, use it; otherwise, use the cell border.
		final long previousBorder = prevIndex >= 0
			? getBorderWidthOrDefault(cellPropertiesMap.get(prevIndex), ownBorder)
			: 0L;

		// If the next row has a custom border, use it; otherwise, use the cell border.
		final long nextBorder = nextIndex < columns.size()
			? getBorderWidthOrDefault(cellPropertiesMap.get(nextIndex), ownBorder)
			: 0L;

		//  Use the larger of the previous or current border for the left edge
		final long leftBorder = Math.max(previousBorder, ownBorder) / 2;
		// Use the larger of the next or current border for the right edge
		final long rightBorder = Math.max(nextBorder, ownBorder) / 2;

		return leftBorder + rightBorder;
	}

	private static long getBorderWidthOrDefault(CellProperties cellProperties, long defaultValue) {
		return (cellProperties != null && cellProperties.boxStyle != null)
			? cellProperties.boxStyle.getBorderWidth()
			: defaultValue;
	}

	private static Map<Integer, Long> filterNullValues(Map<Integer, Long> colWidths) {
		final var resultMap = new HashMap<Integer, Long>();
		int index = 0;
		for (final var entry : colWidths.entrySet()) {
			if (entry.getValue() != null) {
				resultMap.put(index, entry.getValue());
				index++;
			}
		}
		return resultMap;
	}

	private static int getIntProperty(
		Map<ColumnPropertyComputation.PropertyType, Object> props,
		ColumnPropertyComputation.PropertyType key,
		int defaultVal
	) {
		Object v = props.get(key);
		if (v instanceof Number n) return n.intValue();
		if (v instanceof String s) {
			try { return Integer.parseInt(s.trim()); } catch (NumberFormatException ignored) {
				// is handled by returning default value
			}
		}
		return defaultVal;
	}

	public static boolean getListingRowHidden(final ListingValues.MarkupListingRowValue listingRowValue) {
		return checkObjectIsBooleanAndTrue(listingRowValue.getRowProperties().get(RowPropertyComputation.PropertyType.IS_HIDDEN)) ||
			listingRowValue.getColumnValues().stream().allMatch(ListingComponentDependencyValueProducer::getListingCellHidden);
	}

	private static boolean getListingGroupHidden(final ListingValues.MarkupListingRowValue listingRowValue) {
		return checkObjectIsBooleanAndTrue(listingRowValue.getGroupProperties().get(GroupPropertyComputation.PropertyType.IS_HIDDEN));
	}

	public static boolean getListingCellHidden(final ListingValues.MarkupListingColumnValue listingColumnValue) {
		return checkObjectIsBooleanAndTrue(listingColumnValue.getColumnProperties().get(ColumnPropertyComputation.PropertyType.IS_HIDDEN));
	}

	private static boolean getListingCellContentHidden(final ListingValues.MarkupListingColumnValue listingColumnValue) {
		return checkObjectIsBooleanAndTrue(listingColumnValue.getColumnProperties().get(ColumnPropertyComputation.PropertyType.IS_CONTENT_HIDDEN));
	}
}

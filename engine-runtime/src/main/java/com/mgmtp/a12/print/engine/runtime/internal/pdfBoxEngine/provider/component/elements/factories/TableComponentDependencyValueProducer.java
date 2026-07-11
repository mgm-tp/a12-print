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
import com.mgmtp.a12.print.engine.api.exception.impl.PrintDomainException;
import com.mgmtp.a12.print.engine.runtime.internal.PdfBoxDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.inputSource.ReferenceInputSourceResolver;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.textStyleResolver.TextStyleDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.Component;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.*;
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
import com.mgmtp.a12.print.model.api.model.element.properties.TextProperties;
import com.mgmtp.a12.print.model.api.model.element.type.table.Table;
import com.mgmtp.a12.print.model.document.internal.base.IContentHolder;
import lombok.NonNull;
import org.apache.pdfbox.pdmodel.PDDocument;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants.EMPTY_STRING;

public class TableComponentDependencyValueProducer implements PdfBoxDependencyValueProvider<Component, TableComponentDependency> {

	@Override
	public ValueFactory<Component> produce(TableComponentDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfBoxPrintEngineRuntime runtime) {
		final var document = dependency.getDocument();
		final var tableTrace = dependency.getTableTrace();
		final var table = tableTrace.getTracedElement();
		final var tableProperties = table.getTableProperties();

		final var referenceInputSourceResolver = ReferenceInputSourceResolver.builder()
			.runtime(runtime)
			.printModelTreeTrace(new PrintModelTreeTrace<>(tableTrace.getPath(), tableTrace.getTracedElement()))
			.build();

		final var headerTextProperties = tableProperties.getHeaderTextProperties().orElse(null);
		final var borderProperties = table.getBorderProperties().orElse(null);
		final var textProperties = table.getTextProperties().orElse(null);

		final var dimensions = dependency.getDimensions();
		final var tableValueResult = dependency.getTableValueResult();
		final var headerCells = tableValueResult.getHeaderCells();
		final var rows = tableValueResult.getRows();
		final var colGroups = tableValueResult.getColGroups();
		final var maxWidth = PDFUnitUtil.mmToLongPt(dimensions.getWidth().getValue());
		final var borderWidth = SizeResolverUtils.getBorderWidth(borderProperties);
		final var columnWidthMap = TableColumnWidthUtil.calculateColumnWidth(colGroups, maxWidth, borderWidth);

		final var headerRow = headerCells != null
			? getRow(
				headerCells.stream().map(cell -> (IContentHolder) new TextComponentContent(
					EMPTY_STRING,
					tableTrace,
					cell,
					false,
					false
				)).toList(),
				headerTextProperties,
				columnWidthMap,
				borderWidth,
				document,
				runtime,
				tableTrace,
				referenceInputSourceResolver
			)
			: null;

		final var bodyRows = getRows(rows, textProperties, columnWidthMap, borderWidth, document, runtime, tableTrace, referenceInputSourceResolver);

		final var bodyHeight = bodyRows.stream().mapToLong(ComponentRow::getHeight).sum();
		final var headerRowHeight = headerRow != null ? headerRow.getHeight() : 0;
		final var tableHeight = headerRowHeight + bodyHeight + borderWidth;

		return () -> new TableComponent(
			table.getId(),
			new Size(maxWidth, tableHeight),
			table.getType(),
			columnWidthMap,
			headerRow,
			bodyRows,
			borderProperties,
			textProperties,
			headerTextProperties,
			borderWidth
		);
	}

	private static List<ComponentRow> getRows(
		@NonNull final List<List<IContentHolder>> rows,
		final TextProperties textProperties,
		@NonNull final Map<Integer, Long> columnWidthMap,
		final long borderWidth,
		@NonNull PDDocument document,
		@NonNull final InternalPdfBoxPrintEngineRuntime runtime,
		@NonNull PrintModelTreeTrace<Table> table,
		@NonNull final ReferenceInputSourceResolver referenceValueSourceResolver
	) {
		return rows.stream()
			.map(cells ->
				getRow(cells, textProperties, columnWidthMap, borderWidth, document, runtime, table, referenceValueSourceResolver)
			)
			.toList();
	}

	private static ComponentRow getRow(
		@NonNull final List<IContentHolder> cells,
		final TextProperties textProperties,
		@NonNull final Map<Integer, Long> columnWidthMap,
		final long borderWidth,
		@NonNull PDDocument document,
		@NonNull final InternalPdfBoxPrintEngineRuntime runtime,
		@NonNull PrintModelTreeTrace<Table> table,
		@NonNull final ReferenceInputSourceResolver referenceValueSourceResolver
	) {
		final var components = new ArrayList<ComponentCell>();
		long maxCellHeight = 0;

		final Optional<StringInputSource> textStyleId = SizeResolverUtils.getOptTextStyleId(textProperties);
		final var textStyle = runtime.provide(TextStyleDependency.create(
			textStyleId, referenceValueSourceResolver
		)).get();

		final BoxStyleParameters boxStyle = BoxStyleParameters.fromProperties(table.getTracedElement().getBorderProperties().orElse(null), textProperties);
		final HtmlStyle htmlStyle = HtmlStyle.ofTextProperties(textProperties, referenceValueSourceResolver, true);
		final TextRenderStyle textRenderStyle = TextRenderStyle.EMPTY_STYLE.withTextStyle(textStyle);

		for (var i = 0; i < cells.size(); i++) {
			final var cell = cells.get(i);
			if (!(cell instanceof TextComponentContent textComponentContent)) {
				throw new PrintDomainException("Cell needs to be of text type");
			}

			final long columnWidth = columnWidthMap.get(i);
			final long cellWidth = Math.max(0, columnWidth - borderWidth);

			final var component = textComponentContent.isEmpty()
				? null
				: (TextComponent) runtime.provide(new TextComponentDependency(
					textComponentContent.getPrintModelElementTrace(),
					textComponentContent.getMarkup(),
					htmlStyle,
					textRenderStyle,
					null,
					cellWidth,
					textComponentContent.isHtml(),
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

}

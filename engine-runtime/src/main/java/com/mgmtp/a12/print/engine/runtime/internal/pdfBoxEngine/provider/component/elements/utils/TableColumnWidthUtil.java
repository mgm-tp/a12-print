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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils;

import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.listing.ListingHtmlTemplateParameters;
import com.mgmtp.a12.print.model.api.inputSource.InputValueSourceResolver;
import com.mgmtp.a12.print.model.api.model.element.base.Measure;
import com.mgmtp.a12.print.model.api.model.element.type.listing.Listing;
import com.mgmtp.a12.print.model.api.model.element.type.listing.column.ColumnPropertyComputation;
import com.mgmtp.a12.print.model.api.model.element.type.tableLayout.ColumnProperties;
import com.mgmtp.a12.print.model.api.model.element.type.tableLayout.TableLayout;
import lombok.NonNull;
import org.jspecify.annotations.Nullable;

import java.util.*;
import java.util.stream.Collectors;

public class TableColumnWidthUtil {

	// Table
	public static Map<Integer, Long> calculateColumnWidth(
		@NonNull final List<Optional<Integer>> colGroups,
		final long containerWidth,
		final long borderWidth
	) {
		return calculateColumnWidthCore(colGroups, null, containerWidth - borderWidth);
	}

	// Listing
	public static Map<Integer, Long> calculateColumnWidth(
		@NonNull List<ListingHtmlTemplateParameters.MarkupListingRowValue> rows,
		@NonNull final Listing listing,
		final long containerWidth,
		final long borderWidth
	) {
		final var result = listing
			.getListingProperties()
			.getColumns()
			.stream()
			.map(c -> InputValueSourceResolver.getInputValue(c.getWidth()).map(Measure::getValue))
			.collect(Collectors.toCollection(ArrayList::new));

		final boolean[] visibleColumns = rows.isEmpty() ? null : getVisibleListingColumnMap(listing, rows);

		return calculateColumnWidthCore(result, visibleColumns, containerWidth - borderWidth);
	}

	// TableLayout
	public static Map<Integer, Long> calculateColumnWidth(
		@NonNull final TableLayout tableLayout,
		final long containerWidth
	) {
		final List<ColumnProperties> columnProperties = tableLayout.getTableLayoutProperties().getColumnProperties();
		final var columnCount = tableLayout.getTableLayoutProperties().getColumnCount();

		final var colGroups = new ArrayList<Optional<Integer>>(
			java.util.Collections.nCopies(columnCount, Optional.empty())
		);

		for (final var colProp : columnProperties) {
			final int idx = colProp.getIndex() - 1;
			InputValueSourceResolver.getInputValue(colProp.getWidth())
				.map(Measure::getValue)
				.ifPresent(percent -> colGroups.set(idx, Optional.of(percent)));
		}

		return TableColumnWidthUtil.calculateColumnWidthCore(colGroups, null, containerWidth);
	}

	private static Map<Integer, Long> calculateColumnWidthCore(
		@NonNull final List<Optional<Integer>> colGroups,
		@Nullable final boolean[] visibleColumnMap,   // null -> all visible
		final long tableContentWidth
	) {
		final var columnWidthMap = new HashMap<Integer, Long>();
		long remainingWidth = tableContentWidth;
		final List<Integer> remainingColumn = new ArrayList<>();

		final int totalWidthPercent = getTotalWidthPercent(colGroups, visibleColumnMap);

		// columns with defined widths
		for (int i = 0; i < colGroups.size(); i++) {
			final boolean isVisible = (visibleColumnMap == null) || visibleColumnMap[i];
			if (!isVisible) {
				columnWidthMap.put(i, null);
				continue;
			}

			final var column = colGroups.get(i);
			if (column.isPresent()) {
				final long width = SizeResolverUtils.calculateWidth(tableContentWidth, column.get(), totalWidthPercent);
				columnWidthMap.put(i, width);
				remainingWidth -= width;
			} else {
				remainingColumn.add(i);
			}
		}

		if (remainingColumn.isEmpty()) {
			return columnWidthMap;
		}

		// Calculate the width of columns without a set width.
		final long width = Math.max(remainingWidth, 0L) / remainingColumn.size();
		for (final var i : remainingColumn) {
			columnWidthMap.putIfAbsent(i, width);
		}

		return columnWidthMap;
	}

	private static int getTotalWidthPercent(
		@NonNull final List<Optional<Integer>> colGroups,
		@Nullable final boolean[] visibleColumnMap
	) {
		int columnsWithDefinedWidth = 0;
		int columnsVisible = 0;
		int totalWidthPercent = 0;

		for (int i = 0; i < colGroups.size(); i++) {
			final var widthMeasure = colGroups.get(i).orElse(null);
			if (widthMeasure != null) {
				totalWidthPercent += widthMeasure;
				columnsWithDefinedWidth++;
			}
			final boolean isVisibleColumn = (visibleColumnMap == null) || visibleColumnMap[i];
			if (isVisibleColumn) {
				columnsVisible++;
			}
		}

		if (columnsWithDefinedWidth != columnsVisible) {
			return 100;
		}
		return totalWidthPercent;
	}

	private static boolean[] getVisibleListingColumnMap(
		@NonNull final Listing listing,
		@NonNull final List<ListingHtmlTemplateParameters.MarkupListingRowValue> rows
	) {
		final boolean[] visibleColumnMap = new boolean[listing.getListingProperties().getColumns().size()];
		for (int i = 0; i < listing.getListingProperties().getColumns().size(); i++) {
			final boolean isVisibleColumn = !isListingColumnHidden(rows, i);
			visibleColumnMap[i] = isVisibleColumn;
		}
		return visibleColumnMap;
	}

	private static boolean isListingColumnHidden(
		@NonNull final List<ListingHtmlTemplateParameters.MarkupListingRowValue> rows,
		final int index
	) {
		return rows.stream().allMatch(row -> Objects.equals(
			true,
			row.getColumnValues()
				.get(index)
				.getColumnProperties()
				.get(ColumnPropertyComputation.PropertyType.IS_HIDDEN)
		));
	}

	public static long sumVisibleSpanWidths(Map<Integer, Long> colWidthMap, int start, int colSpan) {
		long spannedWidth = 0L;
		for (int i = 0; i < colSpan; i++) {
			Long colWidth = colWidthMap.get(start + i);
			if (colWidth != null) spannedWidth += colWidth;
		}
		return spannedWidth;
	}
}

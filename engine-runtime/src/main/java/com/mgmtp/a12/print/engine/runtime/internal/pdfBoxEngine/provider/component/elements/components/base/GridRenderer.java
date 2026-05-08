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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base;

import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.GridCellComponentResult;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Position;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NonNull;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.documentinterchange.logicalstructure.PDStructureElement;
import org.apache.pdfbox.pdmodel.documentinterchange.taggedpdf.PDTableAttributeObject;

import java.util.ArrayList;
import java.util.List;

import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.AccessibilityUtils.getStructElement;
import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.BoxRenderer.*;
import static com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.RenderUtils.*;
import static org.apache.pdfbox.pdmodel.documentinterchange.taggedpdf.PDTableAttributeObject.SCOPE_COLUMN;
import static org.apache.pdfbox.pdmodel.documentinterchange.taggedpdf.StandardStructureTypes.*;

@AllArgsConstructor
public abstract class GridRenderer {
	@Builder
	public record GridRendererConfig(
		boolean inset,
		boolean hideHeader,
		boolean hasDifferingCellColors,
		boolean hasDifferingBorderStyles,
		long remainingSpace,
		long regionSpace
	) {}
	private final GridRendererConfig config;

	// Header Resolvers
	public long resolveHeaderHeight() {
		return 0;
	}
	public BoxStyleParameters resolveHeaderStyle(int col) {
		return BoxStyleParameters.builder().build();
	}
	public abstract AccessibilityData renderHeaderContent(Position position, Size size, int col);
	// Dimension Resolvers
	public abstract long resolveColumnWidth(int col, int row);
	public abstract int resolveColSpan(int col, int row);
	public abstract long resolveRowHeight(int row);
	public abstract long getFirstLineHeight(int row);
	// Body Cell Resolvers
	public abstract BoxStyleParameters resolveCellStyle(int col, int row, Boolean willBeSplit);
	public abstract GridCellComponentResult renderCellContent(Position position, Size size, int col, int row, long remainingSpace, boolean isPreflighting);

	public GridRendererResult getPreflightedResult(
		@NonNull final Position position,
		final int rowCount,
		final int colCount
	) {
		final long regionSpace = config.regionSpace();
		long remainingSpace = config.remainingSpace();
		long headerHeight = !config.hideHeader ? resolveHeaderHeight() : 0;
		final var firstRenderableRow = getFirstRenderableRow(rowCount);

		Integer breakRowIndex = null;
		List<GridCellComponentResult> splitRowResults = new ArrayList<>();
		long cellYOffset = position.getY();

		if (!config.hideHeader) {
			if (headerHeight > regionSpace) {
				throw new PrintRenderingException(String.format("Header height (%d) exceeds page height (%d)", headerHeight, regionSpace));
			} else if (shouldRenderOnNewPage(headerHeight, remainingSpace, regionSpace, firstRenderableRow)) {
				breakRowIndex = 0;
			} else {
				cellYOffset += headerHeight;
				remainingSpace -= headerHeight;
			}
		}
		if (breakRowIndex == null) {
			for (int row = 0; row < rowCount; row++) {
				long rowHeight = resolveRowHeight(row);
				boolean shouldStop = shouldStopRenderingRow(headerHeight, rowHeight, remainingSpace, regionSpace, row);

				if (!shouldStop) {
					List<GridCellComponentResult> cellResults = renderCellContent(
						colCount, row, rowHeight, position.getX(), cellYOffset, null, null, null, remainingSpace, true
					);

					if (cellResults.stream().anyMatch(c -> c.getRemainingComponent().isPresent())) {
						shouldStop = true;
						splitRowResults.addAll(cellResults);
					}

					cellYOffset += rowHeight;
					remainingSpace -= rowHeight;
				}
				if (shouldStop) {
					breakRowIndex = row;
					break;
				}
			}
		}

		return new GridRendererResult(
			breakRowIndex,
			AccessibilityData.EMPTY_ACCESSIBILITY_DATA,
			splitRowResults
		);
	}

	public GridRendererResult render(
		@NonNull final ContentStreamAdapter contentStream,
		@NonNull final Position position,
		@NonNull final Size size,
		final int colCount,
		final int rowCount
	) {
		renderBackgrounds(contentStream, position, size, colCount, rowCount);
		renderBorders(contentStream, position, colCount, rowCount);
		return renderContents(contentStream, position, colCount, rowCount);
	}

	public void renderBackgrounds(
		@NonNull final ContentStreamAdapter contentStream,
		@NonNull final Position position,
		@NonNull final Size size,
		final int colCount,
		final int rowCount
	) {
		final long regionSpace = config.regionSpace();
		var remainingSpace = config.remainingSpace();
		long headerHeight = !config.hideHeader ? resolveHeaderHeight() : 0;
		final var firstRenderableRow = getFirstRenderableRow(rowCount);
		if (shouldRenderOnNewPage(headerHeight, remainingSpace, regionSpace, firstRenderableRow)) {
			return;
		}
		// Header Background
		renderHeaderBackground(contentStream, size, colCount, headerHeight, position);

		// Body Background
		remainingSpace -= headerHeight;
		long cellXOffset = position.getX();
		long cellYOffset = position.getY() + headerHeight;

		if (!config.hasDifferingCellColors) {
			contentStream.saveGraphicsState();

			final BoxStyleParameters boxStyle = resolveCellStyle(0, 0, null).setInset(config.inset);

			var bodyWidth = size.getWidth() - boxStyle.getBorderWidth();
			long bodyHeight = 0;
			for (int row = 0; row < rowCount; row++) {
				final long rowHeight = resolveRowHeight(row);
				if (rowHeight >= remainingSpace) {
					bodyHeight += remainingSpace;
					break;
				}
				bodyHeight += rowHeight;
				remainingSpace -= rowHeight;
			}

			final Size bodySize = new Size(bodyWidth, bodyHeight);
			setNonStrokingColor(contentStream, boxStyle.backgroundColor);
			renderBackground(contentStream, new Position(cellXOffset, cellYOffset), bodySize, boxStyle, config.hasDifferingCellColors);

			contentStream.restoreGraphicsState();
		} else {
			renderBackgroundPerCell(contentStream, position, colCount, rowCount, remainingSpace, cellYOffset);
		}
	}

	private void renderBackgroundPerCell(
		@NonNull final ContentStreamAdapter contentStream,
		@NonNull final Position position,
		int colCount,
		int rowCount,
		long remainingSpace,
		long cellYOffset
	) {
		for (int row = 0; row < rowCount; row++) {
			if (shouldStopRenderingRow(resolveHeaderHeight(), resolveRowHeight(row), remainingSpace, config.regionSpace, row)) {
				if (remainingSpace > 0 && row > 0) {
					renderRowBackground(contentStream, position, colCount, row, remainingSpace, cellYOffset);
				}
				break;
			}
			final long rowHeight = resolveRowHeight(row);
			final long renderHeight = Math.min(rowHeight, remainingSpace);
			remainingSpace -= rowHeight;
			renderRowBackground(contentStream, position, colCount, row, renderHeight, cellYOffset);
			cellYOffset += rowHeight;
		}
	}

	private void renderRowBackground(
		@NonNull final ContentStreamAdapter contentStream,
		@NonNull final Position position,
		int colCount,
		int row,
		long renderHeight,
		long cellYOffset
	) {
		long cellXOffset = position.getX();
		for (int col = 0; col < colCount; col++) {
			final long columnWidth = resolveColumnWidth(col, row);
			if (columnWidth <= 0) { continue; }

			final Size rowCellSize = new Size(columnWidth, renderHeight);
			final BoxStyleParameters boxStyle = resolveCellStyle(col, row, null).setInset(config.inset);

			renderBackground(contentStream, new Position(cellXOffset, cellYOffset), rowCellSize, boxStyle);

			cellXOffset += columnWidth;
		}
	}

	private void renderHeaderBackground(
		@NonNull final ContentStreamAdapter contentStream,
		@NonNull final Size size,
		int colCount,
		long headerHeight,
		Position position
	) {
		var cellXOffset = position.getX();
		final var cellYOffset = position.getY();
		if (!config.hideHeader) {
			if (!config.hasDifferingCellColors) {
				final BoxStyleParameters boxStyle = resolveHeaderStyle(0).setInset(config.inset);
				contentStream.saveGraphicsState();

				final Size headerSize = new Size(size.getWidth() - boxStyle.getBorderWidth(), headerHeight);
				setNonStrokingColor(contentStream, boxStyle.backgroundColor);
				renderBackground(contentStream, new Position(cellXOffset, cellYOffset), headerSize, boxStyle, config.hasDifferingCellColors);

				contentStream.restoreGraphicsState();
			} else {
				for (int col = 0; col < colCount; col++) {
					final long columnWidth = resolveColumnWidth(col, -1);
					if (columnWidth <= 0) continue;

					final Size headerCellSize = new Size(columnWidth, headerHeight);
					final BoxStyleParameters boxStyle = resolveHeaderStyle(col).setInset(config.inset);

					renderBackground(contentStream, new Position(cellXOffset, cellYOffset), headerCellSize, boxStyle, config.hasDifferingCellColors);

					cellXOffset += columnWidth;
				}
			}
		}
	}

	public void renderBorders(
		@NonNull final ContentStreamAdapter contentStream,
		@NonNull final Position position,
		final int colCount,
		final int rowCount
	) {
		final long regionSpace = config.regionSpace();
		var remainingSpace = config.remainingSpace();
		long headerHeight = !config.hideHeader ? resolveHeaderHeight() : 0;
		final var firstRenderableRow = getFirstRenderableRow(rowCount);
		if (shouldRenderOnNewPage(headerHeight, remainingSpace, regionSpace, firstRenderableRow)) {
			return;
		}
		prepareBorderGraphicsState(contentStream);

		long cellYOffset = position.getY();
		// Header Border
		if (!config.hideHeader) {
			renderHeaderBorder(contentStream, colCount, headerHeight, position.getX(), cellYOffset);
			remainingSpace -= headerHeight;
			cellYOffset += headerHeight;
		}
		// Body Border
		for (int row = 0; row < rowCount; row++) {
			long rowHeight = resolveRowHeight(row);
			if (shouldStopRenderingRow(headerHeight, rowHeight, remainingSpace, regionSpace, row)) {
				if (remainingSpace > 0 && row > 0) {
					renderRowBorder(contentStream, position, colCount, row, remainingSpace, true, cellYOffset);
				}
				break;
			}
			boolean willBeSplit = false;
			if (rowHeight > remainingSpace) {
				rowHeight = remainingSpace;
				willBeSplit = true;
			}

			renderRowBorder(contentStream, position, colCount, row, rowHeight, willBeSplit, cellYOffset);
			cellYOffset += rowHeight;
			remainingSpace -= rowHeight;
		}

		if (!config.hasDifferingBorderStyles) {
			contentStream.restoreGraphicsState();
		}
	}

	private void renderRowBorder(
		@NonNull final ContentStreamAdapter contentStream,
		@NonNull final Position position,
		int colCount,
		int row,
		long rowHeight,
		Boolean willBeSplit,
		long cellYOffset) {

		long cellXOffset = position.getX();
		for (int col = 0; col < colCount; col++) {
			final long columnWidth = resolveColumnWidth(col, row);
			if (columnWidth <= 0) { continue; }

			final Size rowCellSize = new Size(columnWidth, rowHeight);
			final BoxStyleParameters boxStyle = resolveCellStyle(col, row, willBeSplit).setInset(config.inset);

			renderBorder(contentStream, new Position(cellXOffset, cellYOffset), rowCellSize, boxStyle, config.hasDifferingBorderStyles);

			cellXOffset += columnWidth;
		}
	}

	private void prepareBorderGraphicsState(ContentStreamAdapter contentStream) {
		if (!config.hasDifferingBorderStyles) {
			contentStream.saveGraphicsState();
			final BoxStyleParameters boxStyle = resolveCellStyle(0,0, null).setInset(config.inset);
			setStrokingColor(contentStream, boxStyle.borderColor);
			setLineWidth(contentStream, boxStyle);
			if (boxStyle.hasBorder() && boxStyle.borderWidth != null) {
				setBorderStyle(contentStream, boxStyle.borderStyle, boxStyle.borderWidth);
			}
		}
	}

	private void renderHeaderBorder(
		@NonNull final ContentStreamAdapter contentStream,
		int colCount,
		long headerHeight,
		long cellXOffset,
		long cellYOffset
	) {
		if (!config.hideHeader) {
			for (int col = 0; col < colCount; col++) {
				final long columnWidth = resolveColumnWidth(col, -1);
				if (columnWidth <= 0) continue;

				final Size headerCellSize = new Size(columnWidth, headerHeight);
				final BoxStyleParameters boxStyle = resolveHeaderStyle(col).setInset(config.inset);

				renderBorder(contentStream, new Position(cellXOffset, cellYOffset), headerCellSize, boxStyle, config.hasDifferingBorderStyles);

				cellXOffset += columnWidth;
			}
		}
	}

	public GridRendererResult renderContents(
		@NonNull final ContentStreamAdapter contentStream,
		@NonNull final Position position,
		final int colCount,
		final int rowCount
	) {
		final var page = contentStream.getPage();
		final long regionSpace = config.regionSpace();
		long remainingSpace = config.remainingSpace();
		long headerHeight = !config.hideHeader ? resolveHeaderHeight() : 0;
		final var firstRenderableRow = getFirstRenderableRow(rowCount);
		final var parentTreeElements = new ArrayList<PDStructureElement>();

		Integer breakRowIndex = null;
		PDStructureElement tableBodyStructElement = getStructElement(T_BODY, page);
		List<GridCellComponentResult> splitRowResults = new ArrayList<>();
		long cellYOffset = position.getY();

		PDStructureElement tableHeadStructElement = null;
		if (!config.hideHeader) {
			if (headerHeight > regionSpace) {
				throw new PrintRenderingException(String.format("Header height (%d) exceeds page height (%d)", headerHeight, regionSpace));
			} else if (shouldRenderOnNewPage(headerHeight, remainingSpace, regionSpace, firstRenderableRow)) {
				breakRowIndex = 0;
			} else {
				tableHeadStructElement = getStructElement(T_HEAD, page);
				final var tableRowStructElement = getStructElement(TR, page);
				renderHeaderContent(colCount, headerHeight, position, parentTreeElements, page, tableRowStructElement);
				tableHeadStructElement.appendKid(tableRowStructElement);
				cellYOffset += headerHeight;
				remainingSpace -= headerHeight;
			}
		}
		// Render Body Content
		if (breakRowIndex == null) {
			for (int row = 0; row < rowCount; row++) {
				long rowHeight = resolveRowHeight(row);
				boolean shouldStop = shouldStopRenderingRow(headerHeight, rowHeight, remainingSpace, regionSpace, row);

				if (!shouldStop) {
					final var tableRowStructElement = getStructElement(TR, page);
					List<GridCellComponentResult> cellResults = renderCellContent(
						colCount, row, rowHeight, position.getX(), cellYOffset, parentTreeElements, page, tableRowStructElement, remainingSpace, false
					);
					tableBodyStructElement.appendKid(tableRowStructElement);

					if (cellResults.stream().anyMatch(c -> c.getRemainingComponent().isPresent())) {
						shouldStop = true;
						splitRowResults.addAll(cellResults);
					}

					cellYOffset += rowHeight;
					remainingSpace -= rowHeight;
				}
				if (shouldStop) {
					breakRowIndex = row;
					break;
				}
			}
		}

		final var tableStructElement = getStructElement(TABLE, contentStream.getPage());
		if (tableHeadStructElement != null) {
			tableStructElement.appendKid(tableHeadStructElement);
		}
		tableStructElement.appendKid(tableBodyStructElement);

		return new GridRendererResult(
			breakRowIndex,
			new AccessibilityData(List.of(tableStructElement), parentTreeElements),
			splitRowResults
		);
	}

	private void renderHeaderContent(
		final int colCount,
		final long headerHeight,
		final Position position,
		@NonNull final List<PDStructureElement> parentTreeElements,
		@NonNull final PDPage page,
		@NonNull final PDStructureElement tableRowStructElement
	) {
		var changedCellXOffset = position.getX();
		for (int col = 0; col < colCount; col++) {
			final BoxStyleParameters boxStyle = resolveHeaderStyle(col).setInset(config.inset);
			final long columnWidth = resolveColumnWidth(col, -1);
			if (columnWidth <= 0) continue;

			final long offset = boxStyle.getContentSizeDifference();
			final Size headerCellSize = new Size(columnWidth, headerHeight - offset);

			final var accessibilityData = renderHeaderContent(
				new Position(changedCellXOffset, position.getY()),
				headerCellSize,
				col
			);
			parentTreeElements.addAll(accessibilityData.getParentTreeElements());

			final var thStructElement = getStructElement(TH, page);
			final var attribute = new PDTableAttributeObject();
			attribute.setScope(SCOPE_COLUMN);
			thStructElement.addAttribute(attribute);

			for (final var headerStructElement : accessibilityData.getParentTreeElements()) {
				thStructElement.appendKid(headerStructElement);
			}

			tableRowStructElement.appendKid(thStructElement);

			changedCellXOffset += columnWidth;
		}
	}

	private List<GridCellComponentResult> renderCellContent(
		final int colCount,
		final int row,
		final long rowHeight,
		final long cellXOffset,
		final long cellYOffset,
		final List<PDStructureElement> parentTreeElements,
		final PDPage page,
		final PDStructureElement tableRowStructElement,
		long remainingSpace,
		boolean isPreflighting
	) {
		var changedCellXOffset = cellXOffset;
		List<GridCellComponentResult> cellResults = new ArrayList<>();
		for (int col = 0; col < colCount; col++) {
			final long columnWidth = resolveColumnWidth(col, row);
			if (columnWidth <= 0) continue;

			final BoxStyleParameters boxStyle = resolveCellStyle(col, row, null).setInset(config.inset);
			final long offset = boxStyle.getContentSizeDifference();
			final Size rowCellSize = new Size(columnWidth, rowHeight - offset);

			final var componentResult = renderCellContent(
				new Position(changedCellXOffset, cellYOffset),
				rowCellSize,
				col,
				row,
				remainingSpace,
				isPreflighting
			);
			cellResults.add(componentResult);
			if (parentTreeElements != null) {
				final int colspan = resolveColSpan(col, row);
				final var accessibilityData = componentResult.getAccessibilityData();
				parentTreeElements.addAll(accessibilityData.getParentTreeElements());

				final var tdStructElement = getStructElement(TD, page);
				for (final var bodyStructElement : accessibilityData.getParentTreeElements()) {
					tdStructElement.appendKid(bodyStructElement);
				}
				if (colspan != 1) {
					final var attribute = new PDTableAttributeObject();
					attribute.setColSpan(colspan);
					tdStructElement.addAttribute(attribute);
				}
				tableRowStructElement.appendKid(tdStructElement);
			}

			changedCellXOffset += columnWidth;
		}
		return cellResults;
	}

	private boolean shouldRenderOnNewPage(long headerHeight, long remainingSpace, long regionSpace, int firstRenderableRow) {
		long rowHeight = firstRenderableRow >=0 ? resolveRowHeight(firstRenderableRow) : 0;
		long firstLineHeight = firstRenderableRow >=0 ? getFirstLineHeight(firstRenderableRow) : 0;
		return (headerHeight + rowHeight > remainingSpace && headerHeight + rowHeight <= regionSpace)
			|| (headerHeight + firstLineHeight > remainingSpace);
	}

	private boolean shouldStopRenderingRow(long headerHeight, long rowHeight, long remainingSpace, long regionSpace, int row) {
		return (rowHeight > remainingSpace && headerHeight + rowHeight <= regionSpace)
			|| (getFirstLineHeight(row) > remainingSpace && rowHeight > 0);
	}

	private int getFirstRenderableRow(int rowCount) {
		for (int i = 0; i < rowCount; i++) {
			long rowHeight = resolveRowHeight(i);
			if (rowHeight > 0) {
				return i;
			}
		}
		return -1;
	}
}

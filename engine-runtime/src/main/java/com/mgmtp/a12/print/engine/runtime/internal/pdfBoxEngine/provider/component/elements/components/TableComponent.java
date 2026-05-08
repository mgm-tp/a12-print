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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components;

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.AttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.documentHandle.RegionCursor;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.*;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.*;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.components.base.BoxStyleParameters.BorderRenderMode;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Position;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.Size;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.TableColumnWidthUtil;
import com.mgmtp.a12.print.model.api.model.element.ElementType;
import com.mgmtp.a12.print.model.api.model.element.properties.BorderProperties;
import com.mgmtp.a12.print.model.api.model.element.properties.TextProperties;
import lombok.EqualsAndHashCode;
import lombok.NonNull;
import lombok.Value;
import lombok.experimental.SuperBuilder;
import org.apache.commons.collections4.CollectionUtils;
import org.jspecify.annotations.Nullable;

import java.util.*;

@Value
@EqualsAndHashCode(callSuper = true)
@SuperBuilder(toBuilder = true)
public class TableComponent extends BaseComponent {
	ElementType elementType;
	BorderProperties borderProperties;
	TextProperties textProperties;
	TextProperties headerTextProperties;

	Map<Integer, Long> columnWidthMap;
	ComponentRow headerRow;
	List<ComponentRow> bodyRows;
	long borderWidth;
	boolean inset;

	Size size;

	LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend;

	public TableComponent(
		String id,
		Size size,
		ElementType elementType,
		Map<Integer, Long> columnWidthMap,
		ComponentRow headerRow,
		List<ComponentRow> bodyRows,
		BorderProperties borderProperties,
		TextProperties textProperties,
		TextProperties headerTextProperties,
		long borderWidth
	) {
		this(id, size, elementType, columnWidthMap, headerRow, bodyRows, borderProperties, textProperties, headerTextProperties, borderWidth, new LinkedHashMap<>());
	}

	public TableComponent(
		String id,
		Size size,
		ElementType elementType,
		Map<Integer, Long> columnWidthMap,
		ComponentRow headerRow,
		List<ComponentRow> bodyRows,
		BorderProperties borderProperties,
		TextProperties textProperties,
		TextProperties headerTextProperties,
		long borderWidth,
		LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend
	) {
		super(id);
		this.borderProperties = borderProperties;
		this.textProperties = textProperties;
		this.headerTextProperties = headerTextProperties;
		this.headerRow = headerRow;
		this.columnWidthMap = columnWidthMap;
		this.bodyRows = bodyRows;
		this.size = size;
		this.borderWidth = borderWidth;
		this.elementType = elementType;
		this.attachmentsToAppend = attachmentsToAppend;
		this.inset = elementType.equals(ElementType.TABLE_LAYOUT);
	}

	@Override
	public ComponentResult render(@NonNull RegionCursor regionCursor, boolean preventPageBreak) {
		return renderTable(regionCursor, preventPageBreak);
	}

	@Override
	public PreflightedComponent preflight(@NonNull RegionCursor regionCursor, boolean preventPageBreak) {
		final var gridRenderer = getGridRenderer(regionCursor);
		final var preflightResult = gridRenderer.getPreflightedResult(regionCursor.getPosition(), bodyRows.size(), columnWidthMap.size());

		return new PreflightedComponent() {
			@Override
			public PreflightedComponentResult renderPreflightedComponent() {
				return new PreflightedComponentResult(
					renderTable(regionCursor, preventPageBreak), regionCursor
				);
			}

			@Override
			public ComponentResult getPreflightedComponentResult() {
				if (shouldRenderOnNewPage(preventPageBreak, preflightResult, regionCursor.getRegionSpace())) {
					return new ComponentResult(Optional.of(TableComponent.this), regionCursor.getRemainingRegionSpace());
				}
				return getComponentResultFromRenderResult(preflightResult, regionCursor.getRemainingRegionSpace());
			}
		};
	}

	@Override
	public boolean isLocatedOnPageBreak(@NonNull RegionCursor regionCursor) {
		final var tableGridRenderer = getGridRenderer(regionCursor);
		final var preflightResult = tableGridRenderer.getPreflightedResult(regionCursor.getPosition(), bodyRows.size(), columnWidthMap.size());
		return preflightResult.getBreakRowIndex() != null;
	}

	private boolean shouldRenderOnNewPage(
		boolean preventPageBreak,
		@NonNull GridRendererResult preflightResult,
		long regionSpace
	) {
		return preventPageBreak && preflightResult.getBreakRowIndex() != null && regionSpace > size.getHeight();
	}

	private ComponentResult renderTable(
		@NonNull RegionCursor regionCursor,
		boolean preventPageBreak
	) {
		if (shouldRenderOnNewPage(
			preventPageBreak,
			getGridRenderer(regionCursor).getPreflightedResult(regionCursor.getPosition(), bodyRows.size(), columnWidthMap.size()),
			regionCursor.getRegionSpace()
		)) {
			return new ComponentResult(Optional.of(this), regionCursor.getRemainingRegionSpace());
		}

		final var remainingSpace = regionCursor.getRemainingRegionSpace();
		final var contentStream = regionCursor.getContentStream();
		final var position = regionCursor.getPosition();

		final var documentHandle = regionCursor.getContainerDocumentHandle();
		documentHandle.addAttachmentsToAppend(attachmentsToAppend);

		final var tableGridRenderer = getGridRenderer(regionCursor);

		final int columnCount = columnWidthMap.size();
		final int rowCount = bodyRows.size();

		final var result = tableGridRenderer.render(contentStream, position, size, columnCount, rowCount);

		return getComponentResultFromRenderResult(result, remainingSpace);
	}

	private ComponentResult getComponentResultFromRenderResult(
		@NonNull GridRendererResult result,
		long remainingSpace
	) {
		if (result.getBreakRowIndex() != null || !result.getSplitRowResults().isEmpty()) {
			final List<ComponentRow> newBodyRows = result.getBreakRowIndex() != null
				? new ArrayList<>(bodyRows.subList(result.getBreakRowIndex(), bodyRows.size()))
				: bodyRows;

			if (!CollectionUtils.isEmpty(result.getSplitRowResults())) {
				ComponentRow updatedRow = getRemainingOfFirstRow(newBodyRows, result);
				newBodyRows.set(0, updatedRow);
			} else if (result.getBreakRowIndex() != null && result.getBreakRowIndex() < bodyRows.size() && result.getBreakRowIndex() > 0) {
				ComponentRow updatedRow = updateMovedRow(newBodyRows);
				newBodyRows.set(0, updatedRow);
			}

			final var bodyHeight = newBodyRows.stream().mapToLong(ComponentRow::getHeight).sum();
			final var headerRowHeight = headerRow != null ? headerRow.getHeight() : 0;
			final var tableHeight = headerRowHeight + bodyHeight + borderWidth;

			return new ComponentResult(
				Optional.of(this.toBuilder()
					.bodyRows(newBodyRows)
					.size(new Size(size.getWidth(), tableHeight))
					.build()
				),
				remainingSpace,
				result.getAccessibilityData()
			);
		}

		return new ComponentResult(Optional.empty(), size.getHeight(), result.getAccessibilityData());
	}

	private ComponentRow updateMovedRow(List<ComponentRow> newBodyRows) {
		ComponentRow newRow = new ComponentRow(new ArrayList<>(), newBodyRows.getFirst().getHeight());
		for (int i = 0; i < newBodyRows.getFirst().getCells().size(); i++) {
			ComponentCell cell = newBodyRows.getFirst().getCells().get(i);
			if (cell != null) {
				cell = cell.toBuilder().ongoingRendering(true).build();
			}
			newRow.getCells().add(cell);
		}
		return newRow;
	}

	private ComponentRow getRemainingOfFirstRow(List<ComponentRow> newBodyRows, GridRendererResult result) {
		ComponentRow newRow = new ComponentRow(new ArrayList<>(), 0);
		for (int i = 0; i < newBodyRows.getFirst().getCells().size(); i++) {
			ComponentCell cell = newBodyRows.getFirst().getCells().get(i);
			Optional<TextComponent> remainingComponent = result.getSplitRowResults().get(i).getRemainingComponent().map(TextComponent.class::cast);
			cell = new ComponentCell(
				remainingComponent.orElse(null),
				cell.getBoxStyle(),
				remainingComponent.map(TextComponent::getTextRenderStyle).orElse(cell.getTextRenderStyle()),
				cell.getColSpan(),
				result.getSplitRowResults().get(i).getPrecalculatedYOffset(),
				true
			);
			newRow.getCells().add(cell);
		}

		final var highestRenderedCell = result.getSplitRowResults().stream()
			.map(ComponentResult::getEvaluatedHeight)
			.max(Comparator.naturalOrder())
			.orElse(0L);

		long newRowHeight = newBodyRows.getFirst().getHeight() - highestRenderedCell;

		Long maxCellHeight = result.getSplitRowResults().stream()
			.map(ComponentResult::getRemainingComponent)
			.flatMap(Optional::stream)
			.map(Component::getSize)
			.map(Size::getHeight)
			.max(Comparator.naturalOrder())
			.orElse(0L);

		return new ComponentRow(newRow.getCells(), Math.max(maxCellHeight, newRowHeight));
	}

	private GridRenderer getGridRenderer(
		@NonNull final RegionCursor regionCursor
	) {
		final BoxStyleParameters bodyStyle = BoxStyleParameters.fromProperties(borderProperties, textProperties);
		final var config = GridRenderer.GridRendererConfig.builder()
			.remainingSpace(regionCursor.getRemainingRegionSpace())
			.regionSpace(regionCursor.getRegionSpace())
			.inset(this.inset)
			.hideHeader(headerRow == null)
			.hasDifferingBorderStyles(elementType.equals(ElementType.TABLE_LAYOUT) || elementType.equals(ElementType.LISTING))
			.hasDifferingCellColors(elementType.equals(ElementType.LISTING)).build();

		return getGridRenderer(regionCursor, config, bodyStyle);
	}

	private GridRenderer getGridRenderer(RegionCursor regionCursor, GridRenderer.GridRendererConfig config, BoxStyleParameters bodyStyle) {
		return new GridRenderer(config) {
			@Override public int resolveColSpan(int col, int row) {
				if (row == -1) return 1;
				final var cell = bodyRows.get(row).getCells().get(col);
				if (cell == null) {
					throw new PrintException("The grid render should never ask for null cell colspan");
				}
				return cell.getColSpan();
			}
			@Override public long resolveColumnWidth(int col, int row) {
				if (row == -1) return columnWidthMap.get(col);

				final var cell = bodyRows.get(row).getCells().get(col);
				if (cell == null) return 0L; // no rendering

				final int colSpan = cell.getColSpan();
				if (colSpan <= 1) return columnWidthMap.get(col);

				return TableColumnWidthUtil.sumVisibleSpanWidths(columnWidthMap, col, colSpan);
			}
			@Override public long resolveRowHeight(int row) {
				return bodyRows.get(row).getHeight();
			}
			@Override public long getFirstLineHeight(int row) {
				try {
					return bodyRows.get(row).getCells().stream().filter(Objects::nonNull).map(comp -> comp.getTextRenderStyle().getLineHeight()).max(Comparator.naturalOrder()).orElse(0L);
				} catch (IndexOutOfBoundsException e) {
					return 0;
				}
			}
			@Override public long resolveHeaderHeight() {
				return headerRow == null ? 0 : headerRow.getHeight();
			}
			@Override public BoxStyleParameters resolveHeaderStyle(int col) {
				return resolveHeaderCellStyle(col);
			}
			@Override public BoxStyleParameters resolveCellStyle(int col, int row, Boolean willBeSplit) {
				return resolveBodyCellStyle(col, row, bodyStyle, willBeSplit);
			}
			@Override
			public AccessibilityData renderHeaderContent(Position position, Size size, int col) {
				return renderHeaderCell(position, size, col, regionCursor);
			}
			@Override
			public GridCellComponentResult renderCellContent(Position position, Size size, int col, int row, long remainingSpace, boolean isPreflighting) {
				return renderBodyCell(position, size, col, row, regionCursor, remainingSpace, isPreflighting);
			}
		};
	}

	private BoxStyleParameters resolveHeaderCellStyle(int col) {
		if (headerRow == null) {
			throw new PrintRenderingException("There is no header row");
		}
		final var cell = headerRow.getCells().get(col);
		if (cell == null) return null;

		return cell.getBoxStyle();
	}

	private BoxStyleParameters resolveBodyCellStyle(int col, int row, BoxStyleParameters bodyStyle, Boolean willBeSplit) {
		if (bodyRows.isEmpty()) return bodyStyle;
		if (bodyRows.get(row).getCells().isEmpty()) return bodyStyle;

		final var cell = bodyRows.get(row).getCells().get(col);
		if (cell == null) return bodyStyle;

		final var cellStyle = cell.getBoxStyle() != null ? cell.getBoxStyle() : bodyStyle.copy();

		if (willBeSplit != null) {
			if (cell.isOngoingRendering() && willBeSplit) {
				cellStyle.setBorderRenderMode(BorderRenderMode.BETWEEN);
			} else if (willBeSplit) {
				cellStyle.setBorderRenderMode(BorderRenderMode.START);
			} else if (cell.isOngoingRendering()) {
				cellStyle.setBorderRenderMode(BorderRenderMode.END);
			}
		}
		return cellStyle;
	}

	private GridCellComponentResult renderBodyCell(
		Position position,
		Size size,
		int col,
		int row,
		RegionCursor regionCursor,
		long remainingSpace,
		boolean isPreflighting
	) {
		final var cell = bodyRows.get(row).getCells().get(col);
		if (cell != null && cell.getComponent() != null) {
			final TextComponent component = (TextComponent) cell.getComponent();

			final long alignmentYOffset = getAlignmentOffset(cell, size);
			final long yOffset = getTopOffset(row, col) + alignmentYOffset;
			final long xOffset = getLeftOffset(row, col);
			final long yOffsetOfFooter = position.getY() + remainingSpace;

			Position positionToStartRendering = Position.addOffset(position, new Position(xOffset, yOffset));
			if (positionToStartRendering.getY() >= yOffsetOfFooter) {
				return new GridCellComponentResult(Optional.of(component),
					remainingSpace,
					AccessibilityData.EMPTY_ACCESSIBILITY_DATA,
					positionToStartRendering.getY() - (position.getY() + remainingSpace));
			}
			remainingSpace = Math.max(0, yOffsetOfFooter - positionToStartRendering.getY());

			final RegionCursor cursor = regionCursor.toBuilder()
				.remainingRegionSpace(remainingSpace)
				.position(positionToStartRendering)
				.build();

			ComponentResult renderedResult = isPreflighting
				? component.preflight(cursor, false).getPreflightedComponentResult()
				: component.render(cursor, false);
			if (renderedResult.getRemainingComponent().isPresent()) {
				renderedResult = new GridCellComponentResult(renderedResult, 0L);
			}
			return new GridCellComponentResult(renderedResult, null);
		}

		return new GridCellComponentResult(Optional.empty(), 0, AccessibilityData.EMPTY_ACCESSIBILITY_DATA, null);
	}

	private AccessibilityData renderHeaderCell(
		@NonNull final Position position,
		@NonNull final Size size,
		int col,
		@NonNull final RegionCursor regionCursor
	) {
		if (headerRow == null) {
			throw new PrintRenderingException("There is no header row");
		}
		final var headerCell = headerRow.getCells().get(col);
		if (headerCell != null && headerCell.getComponent() != null) {
			final var headerCellComponent = headerCell.getComponent();

			final var alignmentYOffset = getAlignmentOffset(headerCell, size);
			final var borderContentOffset = getContentOffset(headerCell);
			final var cursor = regionCursor.toBuilder()
				.position(Position.addOffset(position, new Position(borderContentOffset, borderContentOffset + alignmentYOffset)))
				.build();
			final var renderResult = headerCellComponent.render(cursor, false);
			return renderResult.getAccessibilityData();
		}
		return AccessibilityData.EMPTY_ACCESSIBILITY_DATA;
	}

	private long getAlignmentOffset(@NonNull ComponentCell cell, Size cellSize) {
		final TextComponent component = (TextComponent) cell.getComponent();
		if (cell.getPrecalculatedYOffset() != null) {
			return cell.getPrecalculatedYOffset();
		}

		final long cellHeight = cellSize.getHeight();
		final long cellContentHeight = component.getSize().getHeight();
		final long free = Math.max(0L, cellHeight - cellContentHeight);

		return switch (cell.getTextRenderStyle().getVerticalAlignment()) {
			case TOP    -> 0L;
			case MIDDLE -> free / 2;
			case BOTTOM -> free;
		};
	}

	private long getTopOffset(int row, int col) {
		final var currentCell = bodyRows.get(row).getCells().get(col);
		return getContentOffset(currentCell);
	}

	private long getLeftOffset(int row, int col) {
		final var currentCell = bodyRows.get(row).getCells().get(col);
		final long ownBorderOffset = getContentOffset(currentCell);

		if (!elementType.equals(ElementType.LISTING)) return ownBorderOffset;

		final long prevBorderOffset = (col > 0)
			? getContentOffset(bodyRows.get(row).getCells().get(col - 1))
			: 0L;
		return Math.max(prevBorderOffset, ownBorderOffset);
	}

	private long getContentOffset(@Nullable ComponentCell cell) {
		if (cell == null) return 0L;
		return cell.getBoxStyle() != null
			? cell.getBoxStyle().setInset(inset).getContentDrawOffset()
			: 0L;
	}
}

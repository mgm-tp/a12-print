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
package com.mgmtp.a12.print.model.api.walker.model;

import com.mgmtp.a12.print.model.api.exceptions.*;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.container.BaseReferenceContainer;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.element.type.area.Area;
import com.mgmtp.a12.print.model.api.model.element.type.boundingBox.BoundingBox;
import com.mgmtp.a12.print.model.api.model.element.type.calculation.Calculation;
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
import com.mgmtp.a12.print.model.api.model.general.Metadata;
import com.mgmtp.a12.print.model.api.model.reference.ElementReference;
import com.mgmtp.a12.print.model.api.model.reference.PlaceableReference;
import com.mgmtp.a12.print.model.api.model.reference.TableColumnReference;
import com.mgmtp.a12.print.model.api.model.reference.TableLayoutCellReference;
import com.mgmtp.a12.print.model.api.model.section.ModelSection;
import com.mgmtp.a12.print.model.api.model.segment.ModelSegment;
import com.mgmtp.a12.print.model.api.model.watermark.Watermark;
import com.mgmtp.a12.print.model.api.walker.DescendCommand;
import com.mgmtp.a12.print.model.api.walker.TraversalCommand;

/**
 * Provides an interface to execute a given function on every print model entity.
 * Uses {@link DescendCommand} and {@link TraversalCommand} return values to control the navigation of the corresponding {@link PrintModelWalker}.
 */
public interface PrintModelVisitor {

	default void beforeVisitElement(final PrintModelElement element, final PrintModelPath path) {

	}

	default void afterVisitElement(final PrintModelElement element, final PrintModelPath path) {
	}

	default DescendCommand descendPrintModel(final PrintModel printModel) {
		return DescendCommand.DESCEND_FIRST;
	}

	default DescendCommand descendDINTemplate(
		final ModelSegment dinTemplate,
		final PrintModelPath path
	) {
		return DescendCommand.DESCEND_FIRST;
	}

	default DescendCommand descendContainer(
		final BaseReferenceContainer<? extends ElementReference> container,
		final PrintModelPath path,
		final int index
	) {
		return DescendCommand.DESCEND_FIRST;
	}

	default TraversalCommand visitPrintModel(final PrintModel printModel) {
		return TraversalCommand.CONTINUE;
	}

	default TraversalCommand visitDINTemplate(
		final ModelSegment dinTemplate,
		final PrintModelPath path
	) {
		return TraversalCommand.CONTINUE;
	}

	default TraversalCommand visitUnresolvedDinTemplate(
		final String dinTemplateReference
	) {
		throw new UnresolvedDinTemplateException(dinTemplateReference);
	}

	default TraversalCommand visitContainer(
		final BaseReferenceContainer<? extends ElementReference> container,
		final PrintModelPath path
	) {
		if (container instanceof PrintModelElement) {
			return this.visitElement((PrintModelElement) container, path);
		}
		return this.visitReferenceContainer(container, path);
	}

	default TraversalCommand visitReferenceContainer(
		final BaseReferenceContainer<? extends ElementReference> container,
		final PrintModelPath path
	) {
		if (container instanceof ModelSegment) {
			return visitSegment((ModelSegment) container, path);
		}
		if (container instanceof ModelSection) {
			return visitSection((ModelSection) container, path);
		}
		if (container instanceof Watermark) {
			return visitWatermark((Watermark) container, path);
		}
		return visitUnresolvedReferenceContainer(container, path);
	}

	default TraversalCommand visitUnresolvedReferenceContainer(
		final BaseReferenceContainer<? extends ElementReference> container,
		final PrintModelPath path
	) {
		throw new UnresolvedReferenceContainerException(container);
	}

	default TraversalCommand visitSegment(final ModelSegment segment, final PrintModelPath path) {
		return TraversalCommand.CONTINUE;
	}

	default TraversalCommand visitSection(final ModelSection section, final PrintModelPath path) {
		return TraversalCommand.CONTINUE;
	}

	default TraversalCommand visitWatermark(final Watermark watermark, final PrintModelPath path) {
		return TraversalCommand.CONTINUE;
	}

	default TraversalCommand visitMetadata(final Metadata metadata, final PrintModelPath path) {
		return TraversalCommand.CONTINUE;
	}

	default TraversalCommand visitReference(
		final ElementReference reference,
		final PrintModelPath path,
		final int index
	) {
		if (reference instanceof PlaceableReference) {
			return visitPlaceableReference((PlaceableReference) reference, path, index);
		}
		if (reference instanceof TableLayoutCellReference) {
			return visitTableLayoutCellReference((TableLayoutCellReference) reference, path, index);
		}
		if (reference instanceof TableColumnReference) {
			return visitTableColumnReference((TableColumnReference) reference, path, index);
		}

		return TraversalCommand.CONTINUE;
	}

	default TraversalCommand visitPlaceableReference(
		final PlaceableReference reference,
		final PrintModelPath path,
		final int index
	) {
		return TraversalCommand.CONTINUE;
	}

	default TraversalCommand visitTableLayoutCellReference(
		final TableLayoutCellReference reference,
		final PrintModelPath path,
		final int index
	) {
		return TraversalCommand.CONTINUE;
	}

	default TraversalCommand visitTableColumnReference(
		final TableColumnReference reference,
		final PrintModelPath path,
		final int index
	) {
		return TraversalCommand.CONTINUE;
	}

	default TraversalCommand visitElement(final PrintModelElement element, final PrintModelPath path) {
		if (element instanceof TextElement) {
			return visitText((TextElement) element, path);
		} else if (element instanceof Expression) {
			return visitExpression((Expression) element, path);
		} else if (element instanceof HorizontalLine) {
			return visitHorizontalLine((HorizontalLine) element, path);
		} else if (element instanceof Image) {
			return visitImage((Image) element, path);
		} else if (element instanceof Listing) {
			return visitListing((Listing) element, path);
		} else if (element instanceof Table) {
			return visitTable((Table) element, path);
		} else if (element instanceof TableLayout) {
			return visitTableLayout((TableLayout) element, path);
		} else if (element instanceof BarChart) {
			return visitBarChart((BarChart) element, path);
		} else if (element instanceof LineChart) {
			return visitLineChart((LineChart) element, path);
		} else if (element instanceof PieChart) {
			return visitPieChart((PieChart) element, path);
		} else if (element instanceof Field) {
			return visitField((Field) element, path);
		} else if (element instanceof Calculation) {
			return visitCalculation((Calculation) element, path);
		} else if (element instanceof PageNumber) {
			return visitPageNumber((PageNumber) element, path);
		} else if (element instanceof PageNumberTotal) {
			return visitPageNumberTotal((PageNumberTotal) element, path);
		} else if (element instanceof BoundingBox) {
			return visitBoundingBox((BoundingBox) element, path);
		} else if (element instanceof Area) {
			return visitArea((Area) element, path);
		} else if (element instanceof Switch) {
			return visitSwitch((Switch) element, path);
		} else if (element instanceof OverrideElement) {
			return visitOverrideElement((OverrideElement) element, path);
		}

		return visitUnknownElement(element, path);
	}

	default TraversalCommand visitUnresolvedElement(
		final ElementReference reference,
		final PrintModelPath path,
		final int index
	) {
		throw new UnresolvedElementException(reference, index);
	}

	default TraversalCommand visitUnresolvedSegment(
		final String segmentId,
		final int index
	) {
		throw new UnresolvedSegmentException(segmentId, index);
	}

	default TraversalCommand visitUnresolvedSection(
		final String sectionId,
		final int index
	) {
		throw new UnresolvedSectionException(sectionId, index);
	}

	default TraversalCommand visitUnresolvedWatermark(
		final String watermarkId,
		final int index
	) {
		throw new UnresolvedWatermarkException(watermarkId, index);
	}

	default TraversalCommand visitUnknownElement(
		final PrintModelElement element,
		final PrintModelPath path
	) {
		return TraversalCommand.CONTINUE;
	}

	default TraversalCommand defaultVisitElement(final PrintModelElement element, final PrintModelPath path) {
		return TraversalCommand.CONTINUE;
	}

	default TraversalCommand visitExpression(final Expression expression, final PrintModelPath path) {
		return defaultVisitElement(expression, path);
	}

	default TraversalCommand visitListing(final Listing listing, final PrintModelPath path) {
		return defaultVisitElement(listing, path);
	}

	default TraversalCommand visitTable(final Table table, final PrintModelPath path) {
		return defaultVisitElement(table, path);
	}

	default TraversalCommand visitTableLayout(final TableLayout staticTableLayout, final PrintModelPath path) {
		return defaultVisitElement(staticTableLayout, path);
	}

	default TraversalCommand visitBarChart(final BarChart barChart, final PrintModelPath path) {
		return defaultVisitElement(barChart, path);
	}

	default TraversalCommand visitLineChart(final LineChart lineChart, final PrintModelPath path) {
		return defaultVisitElement(lineChart, path);
	}

	default TraversalCommand visitPieChart(final PieChart pieChart, final PrintModelPath path) {
		return defaultVisitElement(pieChart, path);
	}

	default TraversalCommand visitImage(final Image image, final PrintModelPath path) {
		return defaultVisitElement(image, path);
	}

	default TraversalCommand visitHorizontalLine(final HorizontalLine horizontalLine, final PrintModelPath path) {
		return defaultVisitElement(horizontalLine, path);
	}

	default TraversalCommand visitPageNumber(final PageNumber pageNumber, final PrintModelPath path) {
		return defaultVisitElement(pageNumber, path);
	}

	default TraversalCommand visitPageNumberTotal(final PageNumberTotal pageNumberTotal, final PrintModelPath path) {
		return defaultVisitElement(pageNumberTotal, path);
	}

	default TraversalCommand visitCalculation(final Calculation calculation, final PrintModelPath path) {
		return defaultVisitElement(calculation, path);
	}

	default TraversalCommand visitField(final Field field, final PrintModelPath path) {
		return defaultVisitElement(field, path);
	}

	default TraversalCommand visitText(final TextElement text, final PrintModelPath path) {
		return defaultVisitElement(text, path);
	}

	default TraversalCommand visitBoundingBox(final BoundingBox box, final PrintModelPath path) {
		return defaultVisitElement(box, path);
	}

	default TraversalCommand visitArea(final Area area, final PrintModelPath path) {
		return defaultVisitElement(area, path);
	}

	default TraversalCommand visitSwitch(final Switch switchElement, final PrintModelPath path) {
		return defaultVisitElement(switchElement, path);
	}

	default TraversalCommand visitOverrideElement(final OverrideElement overrideElement, final PrintModelPath path) {
		return defaultVisitElement(overrideElement, path);
	}

	default TraversalCommand visitOverriddenBoundingBox(
		final BoundingBox boundingBox,
		final PrintModelPath path,
		final OverrideElement overrideElement
	) {
		return TraversalCommand.CONTINUE;
	}
}

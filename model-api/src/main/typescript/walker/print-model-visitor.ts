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
// Disabling unused vars rule due to the need to maintain method signatures in abstract classes and their derivatives.
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
	type AnyContainerElement,
	type AnyTopLevelContainerElement,
	Area,
	BarChart,
	BoundingBox,
	Calculation,
	Expression,
	Field,
	Image,
	isPlaceableReference,
	isSection,
	isSegment,
	isTableLayoutCellReference,
	isWatermark,
	Line,
	LineChart,
	Listing,
	Override,
	PageNumber,
	PageNumberTotal,
	type PartialReference,
	type PartialTableColumnReference,
	PieChart,
	type PlaceableReference,
	type PrintModel,
	PrintModelElement,
	type Reference,
	type Section,
	type Segment,
	Switch,
	Table,
	TableLayout,
	type TableLayoutCellReference,
	Text,
	type Watermark,
} from "../model/index.js";

import type { PrintModelTrace } from "./print-model-trace.js";
import type { PartialPrintModelTrace } from "./partial/index.js";

export class UnvisitedElement extends Error {
	constructor(element: PrintModelElement) {
		super(`Not exhaustive visitation, element: ${element.type} was visited by the default method.`);
		Object.setPrototypeOf(this, UnvisitedElement.prototype);
	}
}

export enum DescendCommand {
	NO_DESCEND,
	DESCEND_FIRST,
	ELEMENT_FIRST,
}

export enum TraversalCommand {
	STOP,
	HALT,
	CONTINUE,
}

export abstract class PrintModelVisitor {
	abstract beforeVisitElement(element: PrintModelElement, printModelTrace: PrintModelTrace): void;

	abstract afterVisitElement(element: PrintModelElement, printModelTrace: PrintModelTrace): void;

	descendPrintModel(printModel: PrintModel): DescendCommand {
		return DescendCommand.DESCEND_FIRST;
	}

	descendContainer(
		container: AnyContainerElement | PrintModelElement,
		printModelTrace: PrintModelTrace,
		index?: number | undefined
	): DescendCommand {
		return DescendCommand.DESCEND_FIRST;
	}

	descendDinTemplate(dinTemplate: Segment): DescendCommand {
		return DescendCommand.DESCEND_FIRST;
	}

	visitPrintModel(printModel: PrintModel): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	visitContainer(
		container: AnyContainerElement | PrintModelElement,
		printModelTrace: PrintModelTrace
	): TraversalCommand {
		if (PrintModelElement.isInstance(container)) {
			return this.visitElement(container, printModelTrace);
		}
		return this.visitReferenceContainer(container, printModelTrace);
	}

	visitReferenceContainer(
		referenceContainer: AnyTopLevelContainerElement,
		printModelTrace: PrintModelTrace
	): TraversalCommand {
		if (isSegment(referenceContainer)) {
			return this.visitSegment(referenceContainer, printModelTrace);
		}
		if (isSection(referenceContainer)) {
			return this.visitSection(referenceContainer, printModelTrace);
		}
		if (isWatermark(referenceContainer)) {
			return this.visitWatermark(referenceContainer, printModelTrace);
		}
		return this.visitUnresolvedReferenceContainer(referenceContainer, printModelTrace);
	}

	visitUnresolvedReferenceContainer(
		referenceContainer: AnyContainerElement,
		printModelTrace: PrintModelTrace
	): TraversalCommand {
		return TraversalCommand.HALT;
	}

	visitSegment(segment: Segment, printModelTrace: PrintModelTrace): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	visitSection(section: Section, printModelTrace: PrintModelTrace): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	visitWatermark(watermark: Watermark, printModelTrace: PrintModelTrace): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	visitReference(reference: Reference, printModelTrace: PrintModelTrace, index?: number): TraversalCommand {
		if (isPlaceableReference(reference)) {
			return this.visitPlaceableReference(reference, printModelTrace, index);
		}
		if (isTableLayoutCellReference(reference)) {
			return this.visitTableLayoutCellReference(reference, printModelTrace, index);
		}

		const parent = printModelTrace.getParent()?.parent;

		if (!parent || !PrintModelElement.isInstance(parent)) {
			return this.visitUnknownReference(reference, printModelTrace, index);
		}

		switch (true) {
			case Table.isInstance(parent):
				return this.visitTableColumnReference(reference, printModelTrace, index);
			case Text.isInstance(parent):
				return this.visitTextEntityReference(reference, printModelTrace, index);
			case Switch.isInstance(parent):
				return this.visitSwitchCaseReference(reference, printModelTrace, index);
			default:
				return this.visitUnknownReference(reference, printModelTrace, index);
		}
	}

	visitPlaceableReference(
		reference: PlaceableReference,
		printModelTrace: PrintModelTrace,
		index?: number
	): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	visitTableLayoutCellReference(
		reference: TableLayoutCellReference,
		printModelTrace: PrintModelTrace,
		index?: number
	): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	visitTableColumnReference(
		reference: PartialTableColumnReference,
		printModelTrace: PartialPrintModelTrace,
		index?: number
	): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	visitTextEntityReference(
		reference: PartialReference,
		printModelTrace: PartialPrintModelTrace,
		index?: number
	): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	visitSwitchCaseReference(
		reference: PartialReference,
		printModelTrace: PartialPrintModelTrace,
		index?: number
	): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	visitUnknownReference(reference: PartialReference, printModelTrace: PartialPrintModelTrace, index?: number) {
		return TraversalCommand.HALT;
	}

	visitElement(element: PrintModelElement, printModelTrace: PrintModelTrace): TraversalCommand {
		if (Text.isInstance(element)) {
			return this.visitText(element, printModelTrace);
		}
		if (Table.isInstance(element)) {
			return this.visitTable(element, printModelTrace);
		}
		if (TableLayout.isInstance(element)) {
			return this.visitTableLayout(element, printModelTrace);
		}
		if (PieChart.isInstance(element)) {
			return this.visitPieChart(element, printModelTrace);
		}
		if (PageNumber.isInstance(element)) {
			return this.visitPageNumber(element, printModelTrace);
		}
		if (PageNumberTotal.isInstance(element)) {
			return this.visitPageNumberTotal(element, printModelTrace);
		}
		if (Listing.isInstance(element)) {
			return this.visitListing(element, printModelTrace);
		}
		if (Line.isInstance(element)) {
			return this.visitLine(element, printModelTrace);
		}
		if (LineChart.isInstance(element)) {
			return this.visitLineChart(element, printModelTrace);
		}
		if (Image.isInstance(element)) {
			return this.visitImage(element, printModelTrace);
		}
		if (Field.isInstance(element)) {
			return this.visitField(element, printModelTrace);
		}
		if (Expression.isInstance(element)) {
			return this.visitExpression(element, printModelTrace);
		}
		if (Calculation.isInstance(element)) {
			return this.visitCalculation(element, printModelTrace);
		}
		if (BarChart.isInstance(element)) {
			return this.visitBarChart(element, printModelTrace);
		}
		if (Switch.isInstance(element)) {
			return this.visitSwitch(element, printModelTrace);
		}
		if (Area.isInstance(element)) {
			return this.visitArea(element, printModelTrace);
		}
		if (BoundingBox.isInstance(element)) {
			return this.visitBoundingBox(element, printModelTrace);
		}
		if (Override.isInstance(element)) {
			return this.visitOverride(element, printModelTrace);
		}
		return this.visitUnknownElement(element, printModelTrace);
	}

	visitText(element: Text, printModelTrace: PrintModelTrace): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace);
	}

	visitTable(element: Table, printModelTrace: PrintModelTrace): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace);
	}

	visitTableLayout(element: TableLayout, printModelTrace: PrintModelTrace): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace);
	}

	visitPieChart(element: PieChart, printModelTrace: PrintModelTrace): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace);
	}

	visitPageNumber(element: PageNumber, printModelTrace: PrintModelTrace): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace);
	}

	visitPageNumberTotal(element: PageNumberTotal, printModelTrace: PrintModelTrace): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace);
	}

	visitListing(element: Listing, printModelTrace: PrintModelTrace): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace);
	}

	visitLine(element: Line, printModelTrace: PrintModelTrace): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace);
	}

	visitLineChart(element: LineChart, printModelTrace: PrintModelTrace): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace);
	}

	visitImage(element: Image, printModelTrace: PrintModelTrace): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace);
	}

	visitField(element: Field, printModelTrace: PrintModelTrace): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace);
	}

	visitExpression(element: Expression, printModelTrace: PrintModelTrace): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace);
	}

	visitCalculation(element: Calculation, printModelTrace: PrintModelTrace): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace);
	}

	visitBarChart(element: BarChart, printModelTrace: PrintModelTrace): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace);
	}

	visitBoundingBox(element: BoundingBox, printModelTrace: PrintModelTrace): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace);
	}

	visitArea(element: Area, printModelTrace: PrintModelTrace): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace);
	}

	visitOverride(element: Override, printModelTrace: PrintModelTrace): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace);
	}

	visitOverriddenBoundingBox(
		boundingBox: BoundingBox,
		override: Override,
		printModelTrace: PrintModelTrace
	): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	visitSwitch(element: Switch, printModelTrace: PrintModelTrace) {
		return this.defaultVisitElement(element, printModelTrace);
	}

	visitDINTemplate(dinTemplate: Segment): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	visitUnresolvedElement(reference: Reference, printModelTrace: PrintModelTrace, index?: number): TraversalCommand {
		return TraversalCommand.HALT;
	}

	visitUnresolvedSegment(id: string, index?: number): TraversalCommand {
		return TraversalCommand.HALT;
	}

	visitUnresolvedSection(id: string, index?: number): TraversalCommand {
		return TraversalCommand.HALT;
	}

	visitUnresolvedWatermark(id: string, index?: number): TraversalCommand {
		return TraversalCommand.HALT;
	}

	visitUnresolvedDinTemplate(templateId: string): TraversalCommand {
		return TraversalCommand.HALT;
	}

	visitUnknownElement(element: PrintModelElement, printModelTrace: PrintModelTrace): TraversalCommand {
		return TraversalCommand.HALT;
	}

	defaultVisitElement(element: PrintModelElement, printModelTrace: PrintModelTrace): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}
}

export abstract class ExhaustivePrintModelVisitor extends PrintModelVisitor {
	defaultVisitElement(element: PrintModelElement): TraversalCommand {
		throw new UnvisitedElement(element);
	}
}

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
	isPartialSection,
	isPartialSegment,
	isPartialWatermark,
	PartialAnyContainerElement,
	PartialArea,
	PartialBarChart,
	PartialBoundingBox,
	PartialCalculation,
	PartialExpression,
	PartialField,
	PartialImage,
	PartialLine,
	PartialLineChart,
	PartialListing,
	PartialMetadata,
	PartialOverride,
	PartialPageNumber,
	PartialPageNumberTotal,
	PartialPieChart,
	PartialPlaceableReference,
	PartialPrintModel,
	PartialPrintModelElement,
	PartialReference,
	PartialSection,
	PartialSegment,
	PartialSwitch,
	PartialSwitchCaseReference,
	PartialTable,
	PartialTableColumnReference,
	PartialTableLayout,
	PartialTableLayoutCellReference,
	PartialText,
	PartialWatermark,
} from "../../model/partial.js";
import { isReference } from "../../model/reference/reference.js";
import type { Segment } from "../../model/print-model.js";
import { PrintModelElement } from "../../model/elements/print-model-element.js";
import type { BoundingBox } from "../../model/elements/type/index.js";
import { ExtendedEntityInstancePathBuilder } from "../../errors/extended-entity-instance-path.js";

import { DescendCommand, TraversalCommand } from "../print-model-visitor.js";

import type { PartialPrintModelTrace } from "./partial-print-model-trace.js";

export abstract class PartialPrintModelVisitor {
	abstract beforeVisitElement(element: PartialPrintModelElement, printModelTrace: PartialPrintModelTrace): void;

	abstract afterVisitElement(element: PartialPrintModelElement, printModelTrace: PartialPrintModelTrace): void;

	descendPrintModel(printModel: PartialPrintModel): DescendCommand {
		return DescendCommand.DESCEND_FIRST;
	}

	descendContainer(
		container: PartialAnyContainerElement,
		printModelTrace: PartialPrintModelTrace,
		index?: number | undefined
	): DescendCommand {
		return DescendCommand.DESCEND_FIRST;
	}

	descendDinTemplate(dinTemplate: PartialSegment): DescendCommand {
		return DescendCommand.DESCEND_FIRST;
	}

	visitPrintModel(printModel: PartialPrintModel): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	visitMetadata(metadata: PartialMetadata, printModelPath: ExtendedEntityInstancePathBuilder): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	visitContainer(
		container: PartialAnyContainerElement,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		if (PrintModelElement.isInstance(container)) {
			return this.visitElement(container, printModelTrace, printModelPath);
		}
		return this.visitTopLevelContainer(container, printModelTrace, printModelPath);
	}

	visitTopLevelContainer(
		referenceContainer: PartialAnyContainerElement,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		if (isPartialSegment(referenceContainer)) {
			return this.visitSegment(referenceContainer, printModelTrace, printModelPath);
		}
		if (isPartialSection(referenceContainer)) {
			return this.visitSection(referenceContainer, printModelTrace, printModelPath);
		}
		if (isPartialWatermark(referenceContainer)) {
			return this.visitWatermark(referenceContainer, printModelTrace, printModelPath);
		}
		return this.visitUnresolvedReferenceContainer(referenceContainer, printModelTrace, printModelPath);
	}

	visitUnresolvedReferenceContainer(
		referenceContainer: PartialAnyContainerElement,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return TraversalCommand.HALT;
	}

	visitSegment(
		segment: PartialSegment,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	visitSection(
		section: PartialSection,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	visitWatermark(
		watermark: PartialWatermark,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	visitReference(
		reference: PartialReference,
		printModelTrace: PartialPrintModelTrace,
		index: number,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		const parent = printModelTrace.getParent()?.parent;

		if (!parent) {
			return this.visitUnknownReference(reference, printModelTrace, index);
		}

		if (isPartialSegment(parent) || isPartialSection(parent) || isPartialWatermark(parent)) {
			return this.visitPlaceableReference(reference, printModelTrace, index, printModelPath);
		}

		if (!PrintModelElement.isInstance(parent)) {
			return this.visitUnknownReference(reference, printModelTrace, index);
		}

		let result = TraversalCommand.CONTINUE;

		if (!isReference(reference)) {
			result = this.visitUndefinedReference(reference, printModelTrace, index);
		}

		if (result !== TraversalCommand.CONTINUE) {
			return result;
		}

		switch (true) {
			case PartialBoundingBox.isInstance(parent):
			case PartialArea.isInstance(parent):
			case PartialOverride.isInstance(parent):
				result = this.visitPlaceableReference(reference, printModelTrace, index, printModelPath);
				break;
			case PartialTableLayout.isInstance(parent):
				result = this.visitTableLayoutCellReference(reference, printModelTrace, index, printModelPath);
				break;
			case PartialTable.isInstance(parent):
				result = this.visitTableColumnReference(reference, printModelTrace, index, printModelPath);
				break;
			case PartialText.isInstance(parent):
				result = this.visitTextEntityReference(reference, printModelTrace, index, printModelPath);
				break;
			case PartialSwitch.isInstance(parent):
				result = this.visitSwitchCaseReference(reference, printModelTrace, index, printModelPath);
				break;
			default:
				result = this.visitUnknownReference(reference, printModelTrace, index);
		}

		return result;
	}

	visitPlaceableReference(
		reference: PartialPlaceableReference,
		printModelTrace: PartialPrintModelTrace,
		index: number,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	visitTableLayoutCellReference(
		reference: PartialTableLayoutCellReference,
		printModelTrace: PartialPrintModelTrace,
		index: number,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	visitTableColumnReference(
		reference: PartialTableColumnReference,
		printModelTrace: PartialPrintModelTrace,
		index: number,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	visitTextEntityReference(
		reference: PartialReference,
		printModelTrace: PartialPrintModelTrace,
		index: number,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	visitSwitchCaseReference(
		reference: PartialSwitchCaseReference,
		printModelTrace: PartialPrintModelTrace,
		index: number,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	visitUnknownReference(reference: PartialReference, printModelTrace: PartialPrintModelTrace, index?: number) {
		return TraversalCommand.HALT;
	}

	visitUndefinedReference(reference: PartialReference, printModelTrace: PartialPrintModelTrace, index?: number) {
		return TraversalCommand.STOP;
	}

	visitElement(
		element: PartialPrintModelElement,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		if (!PrintModelElement.isInstance(element)) {
			return this.visitUndefinedElement(element, printModelTrace);
		}

		if (PartialText.isInstance(element)) {
			return this.visitText(element, printModelTrace, printModelPath);
		}
		if (PartialTable.isInstance(element)) {
			return this.visitTable(element, printModelTrace, printModelPath);
		}
		if (PartialTableLayout.isInstance(element)) {
			return this.visitTableLayout(element, printModelTrace, printModelPath);
		}
		if (PartialPieChart.isInstance(element)) {
			return this.visitPieChart(element, printModelTrace, printModelPath);
		}
		if (PartialPageNumber.isInstance(element)) {
			return this.visitPageNumber(element, printModelTrace, printModelPath);
		}
		if (PartialPageNumberTotal.isInstance(element)) {
			return this.visitPageNumberTotal(element, printModelTrace, printModelPath);
		}
		if (PartialListing.isInstance(element)) {
			return this.visitListing(element, printModelTrace, printModelPath);
		}
		if (PartialLine.isInstance(element)) {
			return this.visitLine(element, printModelTrace, printModelPath);
		}
		if (PartialLineChart.isInstance(element)) {
			return this.visitLineChart(element, printModelTrace, printModelPath);
		}
		if (PartialImage.isInstance(element)) {
			return this.visitImage(element, printModelTrace, printModelPath);
		}
		if (PartialField.isInstance(element)) {
			return this.visitField(element, printModelTrace, printModelPath);
		}
		if (PartialExpression.isInstance(element)) {
			return this.visitExpression(element, printModelTrace, printModelPath);
		}
		if (PartialCalculation.isInstance(element)) {
			return this.visitCalculation(element, printModelTrace, printModelPath);
		}
		if (PartialBarChart.isInstance(element)) {
			return this.visitBarChart(element, printModelTrace, printModelPath);
		}
		if (PartialSwitch.isInstance(element)) {
			return this.visitSwitch(element, printModelTrace, printModelPath);
		}
		if (PartialArea.isInstance(element)) {
			return this.visitArea(element, printModelTrace, printModelPath);
		}
		if (PartialBoundingBox.isInstance(element)) {
			return this.visitBoundingBox(element, printModelTrace, printModelPath);
		}
		if (PartialOverride.isInstance(element)) {
			return this.visitOverride(element, printModelTrace, printModelPath);
		}
		return this.visitUnknownElement(element, printModelTrace);
	}

	visitText(
		element: PartialText,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace, printModelPath);
	}

	visitTable(
		element: PartialTable,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace, printModelPath);
	}

	visitTableLayout(
		element: PartialTableLayout,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace, printModelPath);
	}

	visitPieChart(
		element: PartialPieChart,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace, printModelPath);
	}

	visitPageNumber(
		element: PartialPageNumber,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace, printModelPath);
	}

	visitPageNumberTotal(
		element: PartialPageNumberTotal,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace, printModelPath);
	}

	visitListing(
		element: PartialListing,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace, printModelPath);
	}

	visitLine(
		element: PartialLine,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace, printModelPath);
	}

	visitLineChart(
		element: PartialLineChart,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace, printModelPath);
	}

	visitImage(
		element: PartialImage,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace, printModelPath);
	}

	visitField(
		element: PartialField,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace, printModelPath);
	}

	visitExpression(
		element: PartialExpression,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace, printModelPath);
	}

	visitCalculation(
		element: PartialCalculation,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace, printModelPath);
	}

	visitBarChart(
		element: PartialBarChart,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace, printModelPath);
	}

	visitBoundingBox(
		element: PartialBoundingBox,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace, printModelPath);
	}

	visitArea(
		element: PartialArea,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace, printModelPath);
	}

	visitOverride(
		element: PartialOverride,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return this.defaultVisitElement(element, printModelTrace, printModelPath);
	}

	visitOverriddenBoundingBox(
		boundingBox: BoundingBox,
		override: PartialOverride,
		printModelTrace: PartialPrintModelTrace
	): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	visitSwitch(
		element: PartialSwitch,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	) {
		return this.defaultVisitElement(element, printModelTrace, printModelPath);
	}

	visitDINTemplate(dinTemplate: Segment): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	visitUnresolvedElement(
		reference: PartialReference,
		printModelTrace: PartialPrintModelTrace,
		index?: number
	): TraversalCommand {
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

	visitUnknownElement(element: PartialPrintModelElement, printModelTrace: PartialPrintModelTrace): TraversalCommand {
		return TraversalCommand.HALT;
	}

	visitUndefinedElement(
		element: PartialPrintModelElement,
		printModelTrace: PartialPrintModelTrace
	): TraversalCommand {
		return TraversalCommand.STOP;
	}

	defaultVisitElement(
		element: PartialPrintModelElement,
		printModelTrace: PartialPrintModelTrace,
		printModelPath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}
}

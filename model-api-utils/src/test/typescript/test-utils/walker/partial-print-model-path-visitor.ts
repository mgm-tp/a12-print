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
	BoundingBox,
	PartialOverride,
	PartialPlaceableReference,
	PartialPrintModelElement,
	PartialReference,
	PartialSection,
	PartialSegment,
	PartialSwitchCaseReference,
	PartialTableColumnReference,
	PartialTableLayoutCellReference,
	PartialWatermark,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { ExtendedEntityInstancePathBuilder } from "@com.mgmtp.a12.print/print-model-api/lib/errors/extended-entity-instance-path.js";
import { TraversalCommand } from "@com.mgmtp.a12.print/print-model-api/lib/walker/print-model-visitor.js";
import {
	PartialPrintModelTrace,
	PartialPrintModelVisitor,
} from "@com.mgmtp.a12.print/print-model-api/lib/walker/partial/index.js";

export class PartialPrintModelPathVisitor extends PartialPrintModelVisitor {
	visitedPaths: Map<string, string[]> = new Map();
	visitedIdToPathMap: Map<string, Set<string>> = new Map();

	beforeVisitElement(element: PartialPrintModelElement, printModelTrace: PartialPrintModelTrace): void {}

	afterVisitElement(element: PartialPrintModelElement, printModelTrace: PartialPrintModelTrace): void {}

	private addVisitedPath(caller: string, id: string, visitedPath: string) {
		if (!this.visitedPaths.has(caller)) {
			this.visitedPaths.set(caller, []);
		}
		this.visitedPaths.get(caller)!.push(visitedPath);

		if (!this.visitedIdToPathMap.has(id)) {
			this.visitedIdToPathMap.set(id, new Set());
		}
		this.visitedIdToPathMap.get(id)!.add(visitedPath);
	}

	visitSegment(
		segment: PartialSegment,
		printModelTrace: PartialPrintModelTrace,
		basePath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		this.addVisitedPath("visitSegment", segment.id, basePath.toString());
		return TraversalCommand.CONTINUE;
	}

	visitSection(
		section: PartialSection,
		printModelTrace: PartialPrintModelTrace,
		basePath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		this.addVisitedPath("visitSection", section.id, basePath.toString());
		return TraversalCommand.CONTINUE;
	}

	visitWatermark(
		watermark: PartialWatermark,
		printModelTrace: PartialPrintModelTrace,
		basePath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		this.addVisitedPath("visitWatermark", watermark.id, basePath.toString());
		return TraversalCommand.CONTINUE;
	}

	visitPlaceableReference(
		reference: PartialPlaceableReference,
		printModelTrace: PartialPrintModelTrace,
		index: number,
		basePath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		this.addVisitedPath("visitPlaceableReference", reference.id, basePath.toString());
		return TraversalCommand.CONTINUE;
	}

	visitTableLayoutCellReference(
		reference: PartialTableLayoutCellReference,
		printModelTrace: PartialPrintModelTrace,
		index: number,
		basePath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		this.addVisitedPath("visitTableLayoutCellReference", reference.id, basePath.toString());
		return TraversalCommand.CONTINUE;
	}

	visitTableColumnReference(
		reference: PartialTableColumnReference,
		printModelTrace: PartialPrintModelTrace,
		index: number,
		basePath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		this.addVisitedPath("visitTableColumnReference", reference.id, basePath.toString());
		return TraversalCommand.CONTINUE;
	}

	visitTextEntityReference(
		reference: PartialReference,
		printModelTrace: PartialPrintModelTrace,
		index: number,
		basePath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		this.addVisitedPath("visitTextEntityReference", reference.id, basePath.toString());
		return TraversalCommand.CONTINUE;
	}

	visitSwitchCaseReference(
		reference: PartialSwitchCaseReference,
		printModelTrace: PartialPrintModelTrace,
		index: number,
		basePath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		if (basePath) {
			this.addVisitedPath("visitSwitchCaseReference", reference.id, basePath.toString());
		}
		return TraversalCommand.CONTINUE;
	}

	visitOverriddenBoundingBox(
		boundingBox: BoundingBox,
		override: PartialOverride,
		printModelTrace: PartialPrintModelTrace
	): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

	defaultVisitElement(
		element: PartialPrintModelElement,
		printModelTrace: PartialPrintModelTrace,
		basePath: ExtendedEntityInstancePathBuilder
	): TraversalCommand {
		this.addVisitedPath("defaultVisitElement", element.id, basePath.toString());
		return TraversalCommand.CONTINUE;
	}
}

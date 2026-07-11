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
import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type {
	PartialPrintModel,
	PartialPrintModelElement,
	PartialSection,
	PartialSegment,
	PartialWatermark,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	PartialAnyTopLevelContainerElement,
	PartialArea,
	PartialBoundingBox,
	PartialOverride,
	PartialSwitch,
	PartialTableLayout,
	PrintModelElement,
	isPartialSection,
	isPartialSegment,
	isPartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/model";
import type { PartialPrintModelTrace, PartialPrintModelWalker } from "@com.mgmtp.a12.print/print-model-api/walker";
import {
	createPartialPrintModelWalker,
	PartialPrintModelVisitor,
	TraversalCommand,
} from "@com.mgmtp.a12.print/print-model-api/walker";

import type { ElementNavigationStep, NavigationStep, WrapperElementNavigationStep } from "./navigation-steps.js";
import {
	createCanvasRootStep,
	createElementStep,
	createReferenceStep,
	createWrapperStep,
	isElementNavigationStep,
} from "./navigation-steps.js";

export class PartialPrintModelPathVisitor extends PartialPrintModelVisitor {
	targetElementId: string;
	targetElementTrace: PartialPrintModelTrace | null;

	constructor(targetElementId: string) {
		super();
		this.targetElementId = targetElementId;
		this.targetElementTrace = null;
	}
	beforeVisitElement(): void {}
	afterVisitElement(): void {}

	defaultVisitElement(element: PartialPrintModelElement, printModelTrace: PartialPrintModelTrace) {
		if (element.id === this.targetElementId) {
			this.targetElementTrace = printModelTrace;
			return TraversalCommand.STOP;
		}
		return TraversalCommand.CONTINUE;
	}
}

// TableLayout elements are not navigable — the editor has no drill-in view for them or their children.
export function filterTableLayoutAncestors(navigationSteps: NavigationStep[]): NavigationStep[] {
	const lastStep = navigationSteps[navigationSteps.length - 1];

	function excludeTableLayoutParentSteps() {
		return navigationSteps.filter(
			s => !(isElementNavigationStep(s) && PartialTableLayout.isInstance(s.elementDef))
		);
	}

	if (isElementNavigationStep(lastStep) && !PartialTableLayout.isInstance(lastStep.elementDef)) {
		return excludeTableLayoutParentSteps();
	}

	return navigationSteps;
}

export function buildAncestrySteps(
	elementToken: ElementNavigationStep | WrapperElementNavigationStep,
	model: PartialPrintModel,
	targetContainer?: { type: SidebarItem; id: string }
): NavigationStep[] {
	const pathVistor = new PartialPrintModelPathVisitor(elementToken.elementId);
	const walker = createPartialPrintModelWalker(model, pathVistor, []);

	if (targetContainer) {
		return findAncestryInContainer(targetContainer, model, walker, pathVistor);
	}

	return findAncestryInAllContainers(model, walker, pathVistor);
}

function findAncestryInContainer(
	targetContainer: { type: SidebarItem; id: string },
	model: PartialPrintModel,
	walker: PartialPrintModelWalker,
	pathVistor: PartialPrintModelPathVisitor
): NavigationStep[] {
	switch (targetContainer.type) {
		case SidebarItem.SEGMENT: {
			const segment = (model.content?.segments?.definitions || []).find(s => s.id === targetContainer.id);
			if (!segment) return [];
			walker.walkSegment(segment);
			break;
		}
		case SidebarItem.SECTION: {
			const section = (model.content?.sections?.definitions || []).find(s => s.id === targetContainer.id);
			if (!section) return [];
			walker.walkSection(section);
			break;
		}
		case SidebarItem.WATERMARK: {
			const watermark = (model.content?.watermarks?.definitions || []).find(w => w.id === targetContainer.id);
			if (!watermark) return [];
			walker.walkWatermark(watermark);
			break;
		}
	}
	return pathVistor.targetElementTrace ? getParentPathFromTrace(pathVistor.targetElementTrace) : [];
}

function findAncestryInAllContainers(
	model: PartialPrintModel,
	walker: PartialPrintModelWalker,
	pathVistor: PartialPrintModelPathVisitor
): NavigationStep[] {
	const segments: readonly PartialSegment[] = model.content?.segments?.definitions || [];
	let trace = lookInSegments(segments, walker, pathVistor);
	if (trace) return getParentPathFromTrace(trace);

	const sections: readonly PartialSection[] = model.content?.sections?.definitions || [];
	trace = lookInSections(sections, walker, pathVistor);
	if (trace) return getParentPathFromTrace(trace);

	const watermarks: readonly PartialWatermark[] = model.content?.watermarks?.definitions || [];
	trace = lookInWatermark(watermarks, walker, pathVistor);
	if (trace) return getParentPathFromTrace(trace);

	return [];
}

function getParentPathFromTrace(trace: PartialPrintModelTrace): NavigationStep[] {
	const steps: NavigationStep[] = [];

	for (const { parent } of trace.parents) {
		if (!parent) continue;

		if (PartialAnyTopLevelContainerElement.isInstance(parent)) {
			const tab = isPartialSegment(parent)
				? SidebarItem.SEGMENT
				: isPartialSection(parent)
					? SidebarItem.SECTION
					: SidebarItem.WATERMARK;
			steps.push(createCanvasRootStep(tab, parent.id, []));
			continue;
		}

		if (PrintModelElement.isInstance(parent)) {
			if (
				PartialArea.isInstance(parent) ||
				PartialBoundingBox.isInstance(parent) ||
				PartialOverride.isInstance(parent) ||
				PartialSwitch.isInstance(parent)
			) {
				steps.push(createWrapperStep(parent.id, parent, []));
				continue;
			}

			steps.push(createElementStep(parent.id, parent, []));
			continue;
		}

		if (isPartialValidPlaceableReference(parent)) {
			steps.push(createReferenceStep(parent.refId, parent.id, parent, []));
		}
	}

	return steps;
}

function lookInSegments(
	segments: readonly PartialSegment[],
	walker: PartialPrintModelWalker,
	pathVistor: PartialPrintModelPathVisitor
): PartialPrintModelTrace | undefined {
	for (let i = 0; i <= segments.length - 1; i++) {
		const segment = segments[i];
		walker.walkSegment(segment);
		if (pathVistor.targetElementTrace) {
			return pathVistor.targetElementTrace;
		}
	}
	return undefined;
}

function lookInSections(
	sections: readonly PartialSection[],
	walker: PartialPrintModelWalker,
	pathVistor: PartialPrintModelPathVisitor
): PartialPrintModelTrace | undefined {
	for (let i = 0; i <= sections.length - 1; i++) {
		const section = sections[i];
		walker.walkSection(section);
		if (pathVistor.targetElementTrace) {
			return pathVistor.targetElementTrace;
		}
	}
	return undefined;
}

function lookInWatermark(
	watermakrs: readonly PartialWatermark[],
	walker: PartialPrintModelWalker,
	pathVistor: PartialPrintModelPathVisitor
): PartialPrintModelTrace | undefined {
	for (let i = 0; i <= watermakrs.length - 1; i++) {
		const watermakr = watermakrs[i];
		walker.walkWatermark(watermakr);
		if (pathVistor.targetElementTrace) {
			return pathVistor.targetElementTrace;
		}
	}
	return undefined;
}

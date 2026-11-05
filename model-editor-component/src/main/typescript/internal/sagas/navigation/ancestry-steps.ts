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
	PrintModel,
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
	DefaultPartialSectionIdResolver,
	DefaultPartialSegmentIdResolver,
	DefaultPartialWatermarkIdResolver,
	PartialPrintModelVisitor,
	PrintModelListResolver,
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

	/**
	 * A reference that cannot be resolved - a placement pointing into a print fragment model that no longer holds the
	 * element - says nothing about the ancestry, and stopping there would hide the ancestry of everything behind it.
	 */
	visitUnresolvedElement(): TraversalCommand {
		return TraversalCommand.CONTINUE;
	}

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

/** @param fragmentModels Needed to look into the segments/sections/watermarks used from print fragment models. */
export function buildAncestrySteps(
	elementToken: ElementNavigationStep | WrapperElementNavigationStep,
	model: PartialPrintModel,
	targetContainer?: { type: SidebarItem; id: string },
	fragmentModels: PrintModel[] = []
): NavigationStep[] {
	const pathVistor = new PartialPrintModelPathVisitor(elementToken.elementId);
	const walker = createPartialPrintModelWalker(model, pathVistor, fragmentModels);
	const containers = resolveUsedContainers(model, fragmentModels);

	if (targetContainer) {
		return findAncestryInContainer(targetContainer, model, containers, walker, pathVistor);
	}

	return findAncestryInAllContainers(model, containers, walker, pathVistor);
}

interface UsedContainers {
	segments: readonly PartialSegment[];
	sections: readonly PartialSection[];
	watermarks: readonly PartialWatermark[];
}

/** The containers defined in the model plus the ones it uses from print fragment models. */
function resolveUsedContainers(model: PartialPrintModel, fragmentModels: PrintModel[]): UsedContainers {
	const printModelResolver = PrintModelListResolver.fromModelList(fragmentModels);
	const segmentIdResolver = DefaultPartialSegmentIdResolver.fromModel(model, printModelResolver);
	const sectionIdResolver = DefaultPartialSectionIdResolver.fromModel(model, printModelResolver);
	const watermarkIdResolver = DefaultPartialWatermarkIdResolver.fromModel(model, printModelResolver);

	return {
		segments: withReferencedContainers(
			id => segmentIdResolver.resolveSegmentId(id),
			model.content?.segments?.definitions,
			model.content?.general?.structure
		),
		sections: withReferencedContainers(
			id => sectionIdResolver.resolveSectionId(id),
			model.content?.sections?.definitions,
			model.content?.general?.sections
		),
		watermarks: withReferencedContainers(
			id => watermarkIdResolver.resolveWatermarkId(id),
			model.content?.watermarks?.definitions,
			model.content?.general?.watermarks
		),
	};
}

function withReferencedContainers<T extends { id?: string }>(
	resolve: (id: string) => T | undefined,
	definitions: readonly T[] = [],
	usedIds: readonly string[] = []
): readonly T[] {
	const referenced = usedIds
		.filter(id => !definitions.some(definition => definition.id === id))
		.map(resolve)
		.filter((container): container is T => container !== undefined);

	return referenced.length ? [...definitions, ...referenced] : definitions;
}

function findAncestryInContainer(
	targetContainer: { type: SidebarItem; id: string },
	model: PartialPrintModel,
	containers: UsedContainers,
	walker: PartialPrintModelWalker,
	pathVistor: PartialPrintModelPathVisitor
): NavigationStep[] {
	switch (targetContainer.type) {
		case SidebarItem.SEGMENT: {
			const segment = containers.segments.find(s => s.id === targetContainer.id);
			if (!segment) return [];
			walker.walkSegment(segment);
			break;
		}
		case SidebarItem.SECTION: {
			const section = containers.sections.find(s => s.id === targetContainer.id);
			if (!section) return [];
			walker.walkSection(section);
			break;
		}
		case SidebarItem.WATERMARK: {
			const watermark = containers.watermarks.find(w => w.id === targetContainer.id);
			if (!watermark) return [];
			walker.walkWatermark(watermark);
			break;
		}
		case SidebarItem.FRAGMENT: {
			const fragmentElement = (model.content?.elementDefinitions || []).find(
				el => el.id === targetContainer.id && el.isFragment
			);
			const nestedSteps = fragmentElement && findAncestryInFragmentElement(fragmentElement, walker, pathVistor);
			return nestedSteps ?? [createCanvasRootStep(SidebarItem.FRAGMENT, targetContainer.id, [])];
		}
	}
	return pathVistor.targetElementTrace ? getParentPathFromTrace(pathVistor.targetElementTrace) : [];
}

function findAncestryInAllContainers(
	model: PartialPrintModel,
	containers: UsedContainers,
	walker: PartialPrintModelWalker,
	pathVistor: PartialPrintModelPathVisitor
): NavigationStep[] {
	let trace = lookInSegments(containers.segments, walker, pathVistor);
	if (trace) return getParentPathFromTrace(trace);

	trace = lookInSections(containers.sections, walker, pathVistor);
	if (trace) return getParentPathFromTrace(trace);

	trace = lookInWatermark(containers.watermarks, walker, pathVistor);
	if (trace) return getParentPathFromTrace(trace);

	// Element fragments are standalone Fragment Tree entities, not referenced by any container's
	// elementReferences within this model, so the walker never finds them above — mirrors the
	// explicit SidebarItem.FRAGMENT case in findAncestryInContainer for when a hint is provided.
	const fragmentElement = (model.content?.elementDefinitions || []).find(
		el => el.id === pathVistor.targetElementId && el.isFragment
	);
	if (fragmentElement) {
		return [createCanvasRootStep(SidebarItem.FRAGMENT, fragmentElement.id, [])];
	}

	for (const element of model.content?.elementDefinitions || []) {
		const nestedSteps = element.isFragment && findAncestryInFragmentElement(element, walker, pathVistor);
		if (nestedSteps) return nestedSteps;
	}

	return [];
}

function findAncestryInFragmentElement(
	fragmentElement: PartialPrintModelElement,
	walker: PartialPrintModelWalker,
	pathVistor: PartialPrintModelPathVisitor
): NavigationStep[] | undefined {
	walker.walkElement(fragmentElement);
	if (!pathVistor.targetElementTrace) return undefined;
	return [
		createCanvasRootStep(SidebarItem.FRAGMENT, fragmentElement.id, []),
		...getParentPathFromTrace(pathVistor.targetElementTrace),
	];
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

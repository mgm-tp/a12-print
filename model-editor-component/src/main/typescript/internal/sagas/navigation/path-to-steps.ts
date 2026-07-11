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
import type { EntityInstancePath } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type {
	PartialAnyPrintModelElement,
	PartialPrintModel,
	PartialSection,
	PartialSegment,
	PartialValidPlaceableReference,
	PartialWatermark,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	PartialArea,
	PartialBoundingBox,
	PartialOverride,
	PartialSwitch,
} from "@com.mgmtp.a12.print/print-model-api/model";

import type { NavigationStep, ReferenceNavigationStep } from "./navigation-steps.js";
import {
	createCanvasRootStep,
	createElementStep,
	createReferenceStep,
	createRootStep,
	createWrapperStep,
} from "./navigation-steps.js";

export type {
	CanvasRootNavigationStep as CanvasRootNavigationToken,
	ElementNavigationStep as ElementNavigationToken,
	NavigationStep as NavigationToken,
	ReferenceNavigationStep as ReferenceNavigationToken,
	RootNavigationStep as RootNavigationToken,
	WrapperElementNavigationStep as WrapperElementNavigationToken,
} from "./navigation-steps.js";

export function parsePath(path: EntityInstancePath, model: PartialPrintModel): NavigationStep[] {
	if (!path.length) return [];

	const root = path.at(0);

	if (root?.elementName === "header") {
		if (path.at(1)?.elementName === "modelReferences") return [createRootStep(SidebarItem.SCHEMA, path)];
		return [createRootStep(SidebarItem.GENERAL, path)];
	}
	if (root?.elementName !== "content") return [];

	const child = path.at(1);

	if (child?.elementName === "general") return [createRootStep(SidebarItem.GENERAL, path)];
	if (child?.elementName === "textStyles") return [createRootStep(SidebarItem.TEXT_STYLES, path)];
	if (child?.elementName === "segments") return parseCanvasPath(path, "segments", SidebarItem.SEGMENT, model);
	if (child?.elementName === "sections") return parseCanvasPath(path, "sections", SidebarItem.SECTION, model);
	if (child?.elementName === "watermarks") return parseCanvasPath(path, "watermarks", SidebarItem.WATERMARK, model);
	if (child?.elementName === "elementDefinitions") {
		return parseElementDefinitionPath(path, adjustIndex(child.index), model);
	}

	return [];
}

function parseCanvasPath(
	path: EntityInstancePath,
	canvasType: "segments" | "sections" | "watermarks",
	tab: SidebarItem,
	model: PartialPrintModel
): NavigationStep[] {
	const canvasEntry = path.at(1);
	if (!canvasEntry) return [];
	const entity = resolveCanvasEntity(canvasType, adjustIndex(canvasEntry.index), model);
	if (!entity) return [];
	const steps: NavigationStep[] = [createCanvasRootStep(tab, entity.id, path)];
	const refStep = parseReferencePath(
		path,
		entity.id,
		(entity.elementReferences || []) as PartialValidPlaceableReference[]
	);
	if (refStep) steps.push(refStep);
	return steps;
}

function parseElementDefinitionPath(
	path: EntityInstancePath,
	elemDefIndex: number,
	model: PartialPrintModel
): NavigationStep[] {
	const elemDef = model.content?.elementDefinitions?.[elemDefIndex] as PartialAnyPrintModelElement | undefined;
	if (!elemDef?.id) return [];

	if (isWrapperElement(elemDef)) {
		return parseWrapperElementSteps(path, elemDef);
	}

	return [createElementStep(elemDef.id, elemDef, path)];
}

function parseWrapperElementSteps(
	path: EntityInstancePath,
	elemDef: PartialArea | PartialBoundingBox | PartialOverride | PartialSwitch
): NavigationStep[] {
	if (PartialSwitch.isInstance(elemDef)) {
		const hasCases = path.some(e => e.elementName === "cases");
		return [
			hasCases ? createWrapperStep(elemDef.id!, elemDef, path) : createElementStep(elemDef.id!, elemDef, path),
		];
	}

	const elemRefIdx = path.findIndex(e => e.elementName === "elementReferences");

	if (elemRefIdx === -1) {
		return [createElementStep(elemDef.id!, elemDef, path)];
	}

	const steps: NavigationStep[] = [createWrapperStep(elemDef.id!, elemDef, path)];

	const elementReferences = getWrapperElementReferences(elemDef);
	const refStep = parseReferencePath(path, elemDef.id!, elementReferences);
	if (refStep) steps.push(refStep);

	return steps;
}

/** If path contains elementReferences followed by pageBreakBehavior or hideConditions, return a ReferenceNavigationToken */
function parseReferencePath(
	path: EntityInstancePath,
	containerId: string,
	elementReferences: readonly PartialValidPlaceableReference[]
): ReferenceNavigationStep | null {
	const elemRefIdx = path.findIndex(e => e.elementName === "elementReferences");
	if (elemRefIdx === -1) return null;
	if (!hasNavigableRefSubPath(path, elemRefIdx)) return null;

	const elemRefPath = path[elemRefIdx];
	const elementReference = elementReferences[adjustIndex(elemRefPath.index)];

	return createReferenceStep(containerId, elementReference.id, elementReference, path.slice(elemRefIdx));
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function adjustIndex(pathIndex: number) {
	return pathIndex - 1;
}

/** True if path after elemRefIdx contains "pageBreakBehavior" or "hideConditions" */
function hasNavigableRefSubPath(path: EntityInstancePath, elemRefIdx: number): boolean {
	return path
		.slice(elemRefIdx + 1)
		.some(e => e.elementName === "pageBreakBehavior" || e.elementName === "hideConditions");
}

function isWrapperElement(el: PartialAnyPrintModelElement) {
	return (
		PartialArea.isInstance(el) ||
		PartialBoundingBox.isInstance(el) ||
		PartialOverride.isInstance(el) ||
		PartialSwitch.isInstance(el)
	);
}

function getWrapperElementReferences(el: PartialAnyPrintModelElement): readonly PartialValidPlaceableReference[] {
	if (PartialArea.isInstance(el)) return (el.area?.elementReferences || []) as PartialValidPlaceableReference[];
	if (PartialBoundingBox.isInstance(el)) {
		return (el.boundingBox?.elementReferences || []) as PartialValidPlaceableReference[];
	}
	if (PartialOverride.isInstance(el)) {
		return (el.override?.boundingBox?.elementReferences || []) as PartialValidPlaceableReference[];
	}
	return [];
}

// ─── Resolvers ────────────────────────────────────────────────────────────────

/** Resolve entity ID from 0-based definition index in the model */
function resolveCanvasEntity(
	canvasType: "segments" | "sections" | "watermarks",
	definitionIndex: number,
	model: PartialPrintModel
): PartialSegment | PartialSection | PartialWatermark | undefined {
	switch (canvasType) {
		case "segments":
			return model.content?.segments?.definitions?.[definitionIndex];
		case "sections":
			return model.content?.sections?.definitions?.[definitionIndex];
		case "watermarks":
			return model.content?.watermarks?.definitions?.[definitionIndex];
	}
}

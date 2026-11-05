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
	PrintModelContent,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	FRAGMENT_MODEL_REFERENCE_PURPOSE,
	PartialArea,
	PartialBoundingBox,
	PartialOverride,
	PartialSwitch,
} from "@com.mgmtp.a12.print/print-model-api/model";

import type { ModelReferenceSection } from "../../redux/navigation/state.js";

import type { NavigationStep, ReferenceNavigationStep } from "./navigation-steps.js";
import {
	createCanvasRootStep,
	createElementStep,
	createModelReferenceStep,
	createReferenceStep,
	createRootStep,
	createTextStyleStep,
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

type CanvasType = Extract<keyof PrintModelContent, "segments" | "sections" | "watermarks">;

export function parsePath(path: EntityInstancePath, model: PartialPrintModel): NavigationStep[] {
	if (!path.length) return [];

	const root = path.at(0);

	if (root?.elementName === "header") {
		if (path.at(1)?.elementName === "modelReferences") return parseModelReferencePath(path, model);
		return [createRootStep(SidebarItem.GENERAL, path)];
	}
	if (root?.elementName !== "content") return [];

	const child = path.at(1);

	if (child?.elementName === "general") return [createRootStep(SidebarItem.GENERAL, path)];
	if (child?.elementName === "textStyles") return parseTextStylesPath(path, model);
	if (child?.elementName === "segments") return parseCanvasEntryPath(path, "segments", SidebarItem.SEGMENT, model);
	if (child?.elementName === "sections") return parseCanvasEntryPath(path, "sections", SidebarItem.SECTION, model);
	if (child?.elementName === "watermarks") {
		return parseCanvasEntryPath(path, "watermarks", SidebarItem.WATERMARK, model);
	}
	if (child?.elementName === "textStyleReferences") return parseTextStyleReferencePath(path, model);
	if (child?.elementName === "segmentReferences") {
		return parseCanvasReferencePath(path, "segments", SidebarItem.SEGMENT, model);
	}
	if (child?.elementName === "sectionReferences") {
		return parseCanvasReferencePath(path, "sections", SidebarItem.SECTION, model);
	}
	if (child?.elementName === "watermarkReferences") {
		return parseCanvasReferencePath(path, "watermarks", SidebarItem.WATERMARK, model);
	}
	if (child?.elementName === "elementDefinitions") {
		return parseElementDefinitionPath(path, adjustIndex(child.index), model);
	}

	return [];
}

/**
 * Opens the Schema tab, additionally expanding the section that lists the Model Reference the index resolves to.
 */
function parseModelReferencePath(path: EntityInstancePath, model: PartialPrintModel): NavigationStep[] {
	const rootStep = createRootStep(SidebarItem.SCHEMA, path);
	const entry = path.at(1);
	const namesModelReference = path.length > 2 || (!!entry && "isRepeatable" in entry && entry.isRepeatable === true);
	if (!namesModelReference) return [rootStep];
	const modelReference = entry && model.header?.modelReferences?.[adjustIndex(entry.index)];
	const section = modelReference && getModelReferenceSection(modelReference.modelType, modelReference.purpose);
	return section ? [rootStep, createModelReferenceStep(section, path)] : [rootStep];
}

/**
 * A canvas entry either addresses a definition of this print model or a reference pulling a container in from a print
 * fragment model, both of which carry the index in their own list: `content.segments.definitions[i]` versus
 * `content.segments.fragmentReferences[i]`. A path that stops at the canvas itself keeps the index there.
 */
function parseCanvasEntryPath(
	path: EntityInstancePath,
	canvasType: CanvasType,
	tab: SidebarItem,
	model: PartialPrintModel
): NavigationStep[] {
	const canvasEntry = path.at(1);
	if (!canvasEntry) return [];

	const listEntry = path.at(2);
	const fragmentReferenceList = canvasType === "segments" ? "fragmentReferences" : "references";
	if (listEntry?.elementName === fragmentReferenceList) {
		return parseCanvasReferencePath(path, canvasType, tab, model, adjustIndex(listEntry.index));
	}

	const definitionIndex =
		listEntry?.elementName === "definitions" ? adjustIndex(listEntry.index) : adjustIndex(canvasEntry.index);
	return parseCanvasPath(path, canvasType, tab, model, definitionIndex);
}

function parseCanvasPath(
	path: EntityInstancePath,
	canvasType: CanvasType,
	tab: SidebarItem,
	model: PartialPrintModel,
	definitionIndex: number
): NavigationStep[] {
	const entity = resolveCanvasEntity(canvasType, definitionIndex, model);
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

/** Points at a fragment reference entry (not a native definition) in a canvas container. */
function parseCanvasReferencePath(
	path: EntityInstancePath,
	canvasType: CanvasType,
	tab: SidebarItem,
	model: PartialPrintModel,
	referenceIndex?: number
): NavigationStep[] {
	const canvasEntry = path.at(1);
	const index = referenceIndex ?? (canvasEntry && adjustIndex(canvasEntry.index));
	if (index === undefined) return [];
	const reference = resolveCanvasReference(canvasType, index, model);
	if (!reference?.id) return [];
	// The reference id is what the navigation state uses for a referenced container - see PrintEngineSelectors.segment.
	return [createCanvasRootStep(tab, reference.id, path)];
}

/** Opens the Text Styles tab, additionally focusing the specific definition or reference the index resolves to. */
function parseTextStylesPath(path: EntityInstancePath, model: PartialPrintModel): NavigationStep[] {
	const rootStep = createRootStep(SidebarItem.TEXT_STYLES, path);
	const textStyles = model.content?.textStyles;
	const listEntry = path.at(2);

	if (listEntry?.elementName === "references") {
		const reference = textStyles?.references?.[adjustIndex(listEntry.index)];
		return reference?.id ? [rootStep, createTextStyleStep(reference.id, path)] : [rootStep];
	}

	const entry = listEntry?.elementName === "definitions" ? listEntry : path.at(1);
	const textStyle = entry && textStyles?.definitions?.[adjustIndex(entry.index)];
	if (!textStyle?.id) return [rootStep];
	return [rootStep, createTextStyleStep(textStyle.id, path)];
}

function parseTextStyleReferencePath(path: EntityInstancePath, model: PartialPrintModel): NavigationStep[] {
	const entry = path.at(1);
	if (!entry) return [createRootStep(SidebarItem.TEXT_STYLES, path)];
	const reference = model.content?.textStyles?.references?.[adjustIndex(entry.index)];
	// PrintEngineSelectors.textStyle resolves a reference by its own id (not refId, the fragment's
	// definition id) — TextStyleCard's selectionId for a reference card must match that convention.
	if (!reference?.id) return [createRootStep(SidebarItem.TEXT_STYLES, path)];
	return [createRootStep(SidebarItem.TEXT_STYLES, path), createTextStyleStep(reference.id, path)];
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

/**
 * Points at a placement's sub-property (pageBreakBehavior/hideConditions), or at a fragment placement itself.
 * A local placement without sub-path isn't navigable this way.
 */
function parseReferencePath(
	path: EntityInstancePath,
	containerId: string,
	elementReferences: readonly PartialValidPlaceableReference[]
): ReferenceNavigationStep | null {
	const elemRefIdx = path.findIndex(e => e.elementName === "elementReferences");
	if (elemRefIdx === -1) return null;

	const elemRefPath = path[elemRefIdx];
	const elementReference = elementReferences[adjustIndex(elemRefPath.index)];
	if (!elementReference) return null;

	if (!elementReference.model && !hasNavigableRefSubPath(path, elemRefIdx)) return null;

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

/** Mirrors how the Schema tab sorts the Model References into its sections - see PrintEngineSelectors. */
function getModelReferenceSection(modelType: unknown, purpose: unknown): ModelReferenceSection | undefined {
	switch (modelType) {
		case "document":
			return "document";
		case "typesetting":
			return "typesetting";
		case "print":
			return purpose === FRAGMENT_MODEL_REFERENCE_PURPOSE ? "fragment" : "print";
		default:
			return undefined;
	}
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
	canvasType: CanvasType,
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

/** Resolve a fragment reference (not a native definition) from its 0-based index in the model */
function resolveCanvasReference(
	canvasType: CanvasType,
	referenceIndex: number,
	model: PartialPrintModel
): { id?: string } | undefined {
	switch (canvasType) {
		case "segments":
			return model.content?.segments?.fragmentReferences?.[referenceIndex];
		case "sections":
			return model.content?.sections?.references?.[referenceIndex];
		case "watermarks":
			return model.content?.watermarks?.references?.[referenceIndex];
	}
}

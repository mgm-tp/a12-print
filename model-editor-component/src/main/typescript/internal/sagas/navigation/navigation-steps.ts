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
import type { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type {
	PartialAnyPrintModelElement,
	PartialArea,
	PartialBoundingBox,
	PartialOverride,
	PartialSwitch,
	PartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/model";

// ─── Token interfaces ─────────────────────────────────────────────────────────

export interface RootNavigationStep {
	kind: "root";
	type: SidebarItem;
	jsonPath: EntityInstancePath;
}

export interface CanvasRootNavigationStep {
	kind: "canvasRoot";
	type: SidebarItem;
	entityId: string;
	jsonPath: EntityInstancePath;
}

export interface WrapperElementNavigationStep {
	kind: "wrapper";
	elementId: string;
	elementDef: PartialArea | PartialBoundingBox | PartialOverride | PartialSwitch;
	jsonPath: EntityInstancePath;
}

export interface ElementNavigationStep {
	kind: "element";
	elementId: string;
	elementDef: PartialAnyPrintModelElement;
	jsonPath: EntityInstancePath;
}

export interface ReferenceNavigationStep {
	kind: "reference";
	elementId: string;
	referenceId: string;
	referemce: PartialValidPlaceableReference;
	jsonPath: EntityInstancePath;
}

export type NavigationStep =
	| RootNavigationStep
	| CanvasRootNavigationStep
	| WrapperElementNavigationStep
	| ElementNavigationStep
	| ReferenceNavigationStep;

// ─── Type guards ──────────────────────────────────────────────────────────────

export function isRootNavigationStep(step: NavigationStep): step is RootNavigationStep {
	return step.kind === "root";
}

export function isCanvasRootNavigationStep(step: NavigationStep): step is CanvasRootNavigationStep {
	return step.kind === "canvasRoot";
}

export function isWrapperElementNavigationStep(step: NavigationStep): step is WrapperElementNavigationStep {
	return step.kind === "wrapper";
}

export function isElementNavigationStep(step: NavigationStep): step is ElementNavigationStep {
	return step.kind === "element";
}

export function isReferenceNavigationStep(step: NavigationStep): step is ReferenceNavigationStep {
	return step.kind === "reference";
}

// ─── Factories ────────────────────────────────────────────────────────────────

export function createRootStep(root: SidebarItem, jsonPath: EntityInstancePath): RootNavigationStep {
	return { kind: "root", type: root, jsonPath };
}

export function createCanvasRootStep(
	type: SidebarItem,
	entityId: string,
	jsonPath: EntityInstancePath
): CanvasRootNavigationStep {
	return { kind: "canvasRoot", type, entityId, jsonPath };
}

export function createElementStep(
	elementId: string,
	elementDef: PartialAnyPrintModelElement,
	jsonPath: EntityInstancePath
): ElementNavigationStep {
	return { kind: "element", elementId, elementDef, jsonPath };
}

export function createReferenceStep(
	elementId: string,
	referenceId: string,
	referemce: PartialValidPlaceableReference,
	jsonPath: EntityInstancePath
): ReferenceNavigationStep {
	return { kind: "reference", elementId, referenceId, referemce, jsonPath };
}

export function createWrapperStep(
	elementId: string,
	elementDef: PartialArea | PartialBoundingBox | PartialOverride | PartialSwitch,
	jsonPath: EntityInstancePath
): WrapperElementNavigationStep {
	return { kind: "wrapper", elementId, elementDef, jsonPath };
}

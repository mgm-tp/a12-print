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
import {
	type DataContext,
	ElementType,
	type Measure,
	type PartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";

import type { OmitId } from "../../../utils/index.js";
import type { EditorMode } from "../../editor-state/state.js";

import type { EditorModeState } from "./form-state.js";

/**
 * Context information for wrapper elements (BoundingBox, Override, Area, Switch).
 * Stores the placeable reference that was used to navigate into this wrapper.
 */
export interface WrapperContext {
	placeableReference?: PartialValidPlaceableReference;
}

export interface BaseStackEntry {
	id: string;
	currentMode: EditorMode;
	modes: Partial<Record<EditorMode, EditorModeState>>;
}

/** Root level -- no canvas geometry */
export interface EntityStackEntry extends BaseStackEntry {
	type: "Segment" | "Section" | "Watermark";
}

/**
 * Shared geometry for all drill-in levels.
 * dimensions is optional: absent when constructing a jump target from IDs only;
 * the saga resolves geometry from the model before rendering this level.
 */
export interface BaseWrapperStackEntry extends BaseStackEntry {
	dimensions?: { width: OmitId<Measure>; height: OmitId<Measure> };
	dataContexts?: DeepPartial<DataContext>[];
	wrapperContext?: WrapperContext;
}

export interface BoundingBoxStackEntry extends BaseWrapperStackEntry {
	type: ElementType.BoundingBox;
}

export interface OverrideStackEntry extends BaseWrapperStackEntry {
	type: ElementType.Override;
}

export interface AreaStackEntry extends BaseWrapperStackEntry {
	type: ElementType.Area;
}

export interface SwitchStackEntry extends BaseWrapperStackEntry {
	type: ElementType.Switch;
}

export type WrapperStackEntry = BoundingBoxStackEntry | OverrideStackEntry | AreaStackEntry | SwitchStackEntry;

export type StackEntry = EntityStackEntry | WrapperStackEntry;

export function isBoundingBoxStackEntry(entry: StackEntry): entry is BoundingBoxStackEntry {
	return entry.type === ElementType.BoundingBox;
}

export function isOverrideStackEntry(entry: StackEntry): entry is OverrideStackEntry {
	return entry.type === ElementType.Override;
}

export function isAreaStackEntry(entry: StackEntry): entry is AreaStackEntry {
	return entry.type === ElementType.Area;
}

export function isSwitchStackEntry(entry: StackEntry): entry is SwitchStackEntry {
	return entry.type === ElementType.Switch;
}

export function isWrapperStackEntry(entry: StackEntry): entry is WrapperStackEntry {
	return (
		isBoundingBoxStackEntry(entry) ||
		isOverrideStackEntry(entry) ||
		isAreaStackEntry(entry) ||
		isSwitchStackEntry(entry)
	);
}

export function isEntityStackEntry(entry: StackEntry): entry is EntityStackEntry {
	return entry.type === "Segment" || entry.type === "Section" || entry.type === "Watermark";
}

/**
 * Stack of navigation levels for one entity.
 *   [0] = entity root (Segment | Section | Watermark)
 *   [n] = nth drill-in level
 *   last = currently rendered level
 * Drill in -> push WrapperStackEntry
 * Go back  -> pop last entry
 * Jump     -> replace entire array
 */
export type EntityNavStack = StackEntry[];

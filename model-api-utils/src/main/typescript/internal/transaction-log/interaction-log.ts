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
/**
 * Defines possible types affected by an interaction. Note that "interaction" is also a valid type for undo and redo.
 */
export type AffectedItemType =
	| "interaction"
	| "segment"
	| "segmentReference"
	| "section"
	| "watermark"
	| "printModelHeader"
	| "printModelContentGeneral"
	| "textStyle"
	| "printModelElement";

export const USED_TEXT_STYLE = "USED_TEXT_STYLE";
export type PreventUndo = typeof USED_TEXT_STYLE | boolean;

/**
 * Defines the type and id of the object so it can be traced back from the interaction
 */
export interface AffectedItem {
	type: AffectedItemType;
	id: string;
}

/**
 * Defines a single interaction log entry.
 */
export interface InteractionLogEntry {
	interactionId: string;
	timestamp: number;
	affectedItems: AffectedItem[];
	description?: string;
	preventUndo?: PreventUndo;
	type: InteractionLogEntryType;
}

export type InteractionLogEntryType = "SET" | "UNDO" | "REDO";

/**
 * Interaction log entry extended with additional information so that the store can be properly recreated from scratch (the WAL file).
 */
export interface InteractionLogPersistentEntry extends Omit<InteractionLogEntry, "affectedItems"> {
	affectedInteractionId?: string;
	region: InteractionRegion;
	regionId: string;
}

export enum SidebarItem {
	GENERAL = "general",
	SCHEMA = "schema",
	TEXT_STYLES = "text-styles",
	SEGMENT = "segment",
	SECTION = "section",
	WATERMARK = "watermark",
	COMMIT_CHANGES = "commit-changes",
}

export namespace GlobalRegion {
	export const SIDEBAR = "sidebar";
	export const STAGE = "stage";
	export const FORM = "form";

	export type RegionKeys = typeof SIDEBAR | typeof STAGE | typeof FORM;
}

export namespace StageRegion {
	export const DEFAULT = "stage";
	export const LAYOUT = "layoutStage";
	export const READING_ORDER = "readingOrderStage";
	export const SWITCH = "switchStage";

	export type RegionKeys = typeof DEFAULT | typeof LAYOUT | typeof READING_ORDER | typeof SWITCH;
}

export namespace ListingRegion {
	export const LISTING_COLUMN_FORM = "formListingColumn";
	export const FIELD_COMPUTATION_FORM = "formListingField";
	export const PROPERTY_COMPUTATION_FORM = "formListingProperty";
	export const GROUP_PROPERTY_COMPUTATION_FORM = "formListingGroupProperty";

	export type RegionKeys =
		| typeof FIELD_COMPUTATION_FORM
		| typeof LISTING_COLUMN_FORM
		| typeof PROPERTY_COMPUTATION_FORM
		| typeof GROUP_PROPERTY_COMPUTATION_FORM;
}

export namespace TableRegion {
	export const TABLE_COLUMN_FORM = "formTableColumn";

	export type RegionKeys = typeof TABLE_COLUMN_FORM;
}

export namespace TextRegion {
	export const TEXT_FROM_FIELD = "formTextField";
	export const TEXT_FROM_CALCULATION = "formTextCalculation";

	export type RegionKeys = typeof TEXT_FROM_FIELD | typeof TEXT_FROM_CALCULATION;
}

export namespace SidebarRegion {
	export const TEXT_STYLES = "textStyles";

	export type RegionKeys = typeof TEXT_STYLES;
}

/**
 * Defines regions of user action. Interactions will be linked to a specific region which will have an effect on undo and redo.
 */
export type InteractionRegion =
	| GlobalRegion.RegionKeys
	| StageRegion.RegionKeys
	| ListingRegion.RegionKeys
	| TableRegion.RegionKeys
	| TextRegion.RegionKeys
	| SidebarRegion.RegionKeys;

/**
 * Redux state for interaction log
 */
export type InteractionLogStore = Record<InteractionRegion, Record<string, InteractionLogEntry[]>>;

export function createNewInteractionLogStore(): InteractionLogStore {
	return {
		sidebar: Object.values(SidebarItem).reduce<Record<string, InteractionLogEntry[]>>((res, key) => {
			res[key] = [];
			return res;
		}, {}),
		stage: {},
		readingOrderStage: {},
		layoutStage: {},
		switchStage: {},
		form: {},
		formListingColumn: {},
		formListingField: {},
		formListingProperty: {},
		formListingGroupProperty: {},
		formTableColumn: {},
		formTextField: {},
		formTextCalculation: {},
		textStyles: {},
	};
}

export function assertInteractionLogEntryType(value?: string): asserts value is InteractionLogEntryType {
	const checkMap: Record<InteractionLogEntryType, true> = {
		REDO: true,
		UNDO: true,
		SET: true,
	};
	if (!value || !checkMap[value as InteractionLogEntryType]) {
		throw new Error(`${value} is not InteractionLogEntryType`);
	}
}

export function assertInteractionRegion(value?: string): asserts value is InteractionRegion {
	const checkMap: Record<InteractionRegion, true> = {
		[GlobalRegion.FORM]: true,
		[GlobalRegion.SIDEBAR]: true,
		[GlobalRegion.STAGE]: true,
		[StageRegion.LAYOUT]: true,
		[StageRegion.SWITCH]: true,
		[StageRegion.READING_ORDER]: true,
		[ListingRegion.LISTING_COLUMN_FORM]: true,
		[ListingRegion.FIELD_COMPUTATION_FORM]: true,
		[ListingRegion.PROPERTY_COMPUTATION_FORM]: true,
		[ListingRegion.GROUP_PROPERTY_COMPUTATION_FORM]: true,
		[TableRegion.TABLE_COLUMN_FORM]: true,
		[TextRegion.TEXT_FROM_CALCULATION]: true,
		[TextRegion.TEXT_FROM_FIELD]: true,
		[SidebarRegion.TEXT_STYLES]: true,
	};

	if (!value || !checkMap[value as InteractionRegion]) {
		throw new Error(`${value} is not InteractionRegion`);
	}
}

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
import type {
	TableLayoutCell,
	TableColumn,
	Hideable,
	Placeable,
	ScreenReadingOrderable,
	PrintModelEntity,
	RelativeLayout,
	SwitchCase,
} from "../elements/index.js";

/**
 * @param refId - The id of a referenced print model element.
 */
export interface Reference extends PrintModelEntity {
	readonly refId: string;
}

export interface PlaceableReference extends Reference, Placeable, Hideable, RelativeLayout, ScreenReadingOrderable {}

export type TableColumnReference = Reference & TableColumn;

export type TableLayoutCellReference = Reference & TableLayoutCell;

export type SwitchCaseReference = Reference & SwitchCase;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isReference(value: any): value is Reference {
	return "refId" in value && typeof value.refId === "string";
}

export function isPlaceableReference(reference: Reference): reference is PlaceableReference {
	return "position" in reference && "dimensions" in reference && "screenReadingOrder" in reference;
}

export function isTableLayoutCellReference(reference: Reference): reference is TableLayoutCellReference {
	return "row" in reference && "column" in reference;
}

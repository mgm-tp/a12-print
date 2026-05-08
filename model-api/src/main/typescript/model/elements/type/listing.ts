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
import type { PartialAnyPrintModelElement } from "../../partial.js";

import type {
	ComputationAlternative,
	DisplayOptions,
	PrintModelEntity,
	Styleable,
	BorderProperties,
	TextProperties,
	MeasureInputSource,
	InputSource,
} from "../base.js";
import type { PrintModelElement } from "../print-model-element.js";
import { ElementType } from "../print-model-element.js";

export interface Listing extends PrintModelElement, Styleable {
	readonly type: ElementType.Listing;
	readonly listing: ListingProperties;
}

export interface ListingProperties extends PrintModelEntity {
	readonly model: string;
	readonly basePath: string;
	readonly showRepeatedGroupEntries?: boolean;
	readonly hideHeader?: boolean;
	readonly rowPropertyComputations?: ReadonlyArray<RowPropertyComputations>;
	readonly groupPropertyComputations?: ReadonlyArray<GroupPropertyComputations>;
	readonly columns?: ReadonlyArray<ListingColumn>;
	readonly headerTextProperties?: TextProperties;
}

export interface ListingColumn extends PrintModelEntity {
	readonly label: InputSource<string>;
	readonly width: MeasureInputSource;
	readonly isSortingIndex?: boolean;
	readonly hasCustomTextProperties?: boolean;
	readonly hasCustomBorderProperties?: boolean;
	readonly default?: ListingColumnDefault;
	readonly group?: ListingColumnGroup;
	readonly field?: ReadonlyArray<ListingColumnField>;
	readonly textProperties?: TextProperties;
	readonly borderProperties?: BorderProperties;
}

export type ListingColumnDefault = BaseListingColumnComputations;

export type ListingColumnGroup = BaseListingColumnComputations;

export interface ListingColumnField extends BaseListingColumnComputations {
	readonly inputFieldTypeSerialized: string;
	readonly outputFieldTypeSerialized: string;
	readonly displayOptions?: DisplayOptions;
}

export interface BaseListingColumnComputations extends PrintModelEntity {
	readonly propertyComputations?: ReadonlyArray<ColumnPropertyComputations>;
	readonly valueComputationAlternatives?: ReadonlyArray<ComputationAlternative>;
}

export interface PropertyComputations extends PrintModelEntity {
	readonly property: RowPropertyKeyType | ColumnPropertyKeyType | GroupPropertyKeyType;
	readonly computationAlternatives?: ReadonlyArray<ComputationAlternative>;
}

export interface ColumnPropertyComputations extends PropertyComputations {
	readonly property: ColumnPropertyKeyType;
}

export interface RowPropertyComputations extends PropertyComputations {
	readonly property: RowPropertyKeyType;
}

export interface GroupPropertyComputations extends PrintModelEntity {
	readonly property: GroupPropertyKeyType;
	readonly groupPath: string;
	readonly computationAlternatives?: ReadonlyArray<Required<ComputationAlternative>>;
}

export enum RowPropertyKeyType {
	Bold = "Bold",
	Italic = "Italic",
	Underline = "Underline",
	Font = "Font",
	FontSize = "FontSize",
	LineHeight = "LineHeight",
	HorizontalAlignment = "HorizontalAlignment",
	VerticalAlignment = "VerticalAlignment",
	Color = "Color",
	BackgroundColor = "BackgroundColor",
	BorderStyle = "BorderStyle",
	BorderWidth = "BorderWidth",
	BorderColor = "BorderColor",
	IsHidden = "IsHidden",
	PaddingTop = "PaddingTop",
	PaddingBottom = "PaddingBottom",
	PaddingLeft = "PaddingLeft",
	PaddingRight = "PaddingRight",
}

export enum ColumnPropertyKeyType {
	Bold = "Bold",
	Italic = "Italic",
	Underline = "Underline",
	Font = "Font",
	FontSize = "FontSize",
	LineHeight = "LineHeight",
	HorizontalAlignment = "HorizontalAlignment",
	VerticalAlignment = "VerticalAlignment",
	Color = "Color",
	BackgroundColor = "BackgroundColor",
	BorderStyle = "BorderStyle",
	BorderWidth = "BorderWidth",
	BorderColor = "BorderColor",
	IsHidden = "IsHidden",
	IsContentHidden = "IsContentHidden",
	ColumnSpan = "ColumnSpan",
	PaddingTop = "PaddingTop",
	PaddingBottom = "PaddingBottom",
	PaddingLeft = "PaddingLeft",
	PaddingRight = "PaddingRight",
}

export enum GroupPropertyKeyType {
	IsHidden = "IsHidden",
}

export namespace Listing {
	export function isInstance(element: PartialAnyPrintModelElement): element is Listing {
		return element.type === ElementType.Listing && typeof element.listing?.basePath === "string";
	}
}

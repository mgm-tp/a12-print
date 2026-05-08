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
import React from "react";

import {
	ColumnPropertyKeyType,
	GroupPropertyKeyType,
	RowPropertyKeyType,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../../localization/index.js";

export type PropertyItemsType = "row" | "column" | "group";

interface ListingPropertyItem {
	label: string;
	value: "" | RowPropertyKeyType;
}

function usePropertyItems(): ListingPropertyItem[] {
	const localizer = PrintLocalizer.useLocalizer();

	return React.useMemo(
		() => [
			{
				label: "",
				value: "",
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.propertyItems.bold),
				value: RowPropertyKeyType.Bold,
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.propertyItems.italic),
				value: RowPropertyKeyType.Italic,
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.propertyItems.underline),
				value: RowPropertyKeyType.Underline,
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.propertyItems.font),
				value: RowPropertyKeyType.Font,
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.propertyItems.fontSize),
				value: RowPropertyKeyType.FontSize,
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.propertyItems.lineHeight),
				value: RowPropertyKeyType.LineHeight,
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.propertyItems.horizontalAlignment),
				value: RowPropertyKeyType.HorizontalAlignment,
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.propertyItems.verticalAlignment),
				value: RowPropertyKeyType.VerticalAlignment,
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.propertyItems.color),
				value: RowPropertyKeyType.Color,
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.propertyItems.backgroundColor),
				value: RowPropertyKeyType.BackgroundColor,
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.propertyItems.borderStyle),
				value: RowPropertyKeyType.BorderStyle,
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.propertyItems.borderWidth),
				value: RowPropertyKeyType.BorderWidth,
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.propertyItems.borderColor),
				value: RowPropertyKeyType.BorderColor,
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.propertyItems.paddingTop),
				value: RowPropertyKeyType.PaddingTop,
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.propertyItems.paddingBottom),
				value: RowPropertyKeyType.PaddingBottom,
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.propertyItems.paddingLeft),
				value: RowPropertyKeyType.PaddingLeft,
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.propertyItems.paddingRight),
				value: RowPropertyKeyType.PaddingRight,
			},
		],
		[localizer]
	);
}

export function useRowPropertyItems(): ListingPropertyItem[] {
	const localizer = PrintLocalizer.useLocalizer();
	const propertyItems = usePropertyItems();

	return React.useMemo(
		() => [
			...propertyItems,
			{
				label: localizer(RESOURCE_KEYS.elementOptions.propertyItems.isHiddenRow),
				value: RowPropertyKeyType.IsHidden,
			},
		],
		[localizer, propertyItems]
	);
}

export function useColumnPropertyItems() {
	const localizer = PrintLocalizer.useLocalizer();
	const propertyItems = usePropertyItems();

	return React.useMemo(
		() => [
			...propertyItems,
			{
				label: localizer(RESOURCE_KEYS.elementOptions.propertyItems.isHidden),
				value: ColumnPropertyKeyType.IsHidden,
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.propertyItems.isContentHidden),
				value: ColumnPropertyKeyType.IsContentHidden,
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.propertyItems.columnSpan),
				value: ColumnPropertyKeyType.ColumnSpan,
			},
		],
		[localizer, propertyItems]
	);
}

export function useGroupPropertyItems() {
	const localizer = PrintLocalizer.useLocalizer();

	return React.useMemo(
		() => [
			{
				label: "",
				value: "",
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.groupPropertyItem.isHidden),
				value: GroupPropertyKeyType.IsHidden,
			},
		],
		[localizer]
	);
}

export function useSelectedPropertyItems(propertyItemsType: PropertyItemsType) {
	const columnPropertyItems = useColumnPropertyItems();
	const rowPropertyItems = useRowPropertyItems();
	const groupPropertyItems = useGroupPropertyItems();

	return React.useMemo(() => {
		switch (propertyItemsType) {
			case "column":
				return columnPropertyItems;
			case "row":
				return rowPropertyItems;
			case "group":
				return groupPropertyItems;
			default:
				return [];
		}
	}, [columnPropertyItems, propertyItemsType, rowPropertyItems, groupPropertyItems]);
}

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
import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";

import { RESOURCE_KEYS } from "../localization/keys.js";

interface ElementProperties {
	name: string;
	iconName: string;
}

export const ElementTypes: Record<ElementType, ElementProperties | undefined> = {
	[ElementType.Text]: {
		name: RESOURCE_KEYS.editor.element.Text,
		iconName: "title",
	},
	[ElementType.Line]: {
		name: RESOURCE_KEYS.editor.element.Line,
		iconName: "horizontal_rule",
	},
	[ElementType.Table]: {
		name: RESOURCE_KEYS.editor.element.Table,
		iconName: "window",
	},
	[ElementType.Image]: {
		name: RESOURCE_KEYS.editor.element.Image,
		iconName: "image",
	},
	[ElementType.Expression]: {
		name: RESOURCE_KEYS.editor.element.Expression,
		iconName: "functions",
	},
	[ElementType.Listing]: {
		name: RESOURCE_KEYS.editor.element.Listing,
		iconName: "list",
	},
	[ElementType.TableLayout]: {
		name: RESOURCE_KEYS.editor.element.TableLayout,
		iconName: "grid_on",
	},
	[ElementType.LineChart]: {
		name: RESOURCE_KEYS.editor.element.LineChart,
		iconName: "show_chart",
	},
	[ElementType.BarChart]: {
		name: RESOURCE_KEYS.editor.element.BarChart,
		iconName: "bar_chart",
	},
	[ElementType.PieChart]: {
		name: RESOURCE_KEYS.editor.element.PieChart,
		iconName: "pie_chart",
	},
	[ElementType.BoundingBox]: {
		name: RESOURCE_KEYS.editor.element.BoundingBox,
		iconName: "filter_frames",
	},
	[ElementType.Area]: {
		name: RESOURCE_KEYS.editor.element.Area,
		iconName: "crop_free",
	},
	[ElementType.Calculation]: {
		name: RESOURCE_KEYS.editor.element.Calculation,
		iconName: "functions",
	},
	[ElementType.Field]: {
		name: RESOURCE_KEYS.editor.element.Field,
		iconName: "input",
	},
	[ElementType.PageNumber]: {
		name: RESOURCE_KEYS.editor.element.PageNumber,
		iconName: "filter_1",
	},
	[ElementType.PageNumberTotal]: {
		name: RESOURCE_KEYS.editor.element.PageNumberTotal,
		iconName: "filter_9_plus",
	},
	[ElementType.Override]: {
		name: RESOURCE_KEYS.editor.element.Override,
		iconName: "",
	},
	[ElementType.Switch]: {
		name: RESOURCE_KEYS.editor.element.Switch,
		iconName: "account_tree",
	},
};

export const CHART_ELEMENTS: ElementType[] = [ElementType.BarChart, ElementType.LineChart, ElementType.PieChart];

export const FIXED_DIMENSIONS_ELEMENTS: ElementType[] = [...CHART_ELEMENTS, ElementType.Image, ElementType.Override];

export const TOOLBOX_ELEMENTS = [
	ElementType.Text,
	ElementType.Line,
	ElementType.Table,
	ElementType.Image,
	ElementType.Expression,
	ElementType.Listing,
	ElementType.TableLayout,
	ElementType.LineChart,
	ElementType.BarChart,
	ElementType.PieChart,
	ElementType.BoundingBox,
	ElementType.Area,
	ElementType.Switch,
];

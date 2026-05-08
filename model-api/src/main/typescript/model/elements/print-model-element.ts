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
import { isObject } from "../print-model.js";

import type { PrintModelEntity } from "./base.js";
import type {
	Area,
	BarChart,
	BoundingBox,
	Calculation,
	Expression,
	Field,
	Image,
	Line,
	LineChart,
	Listing,
	Override,
	PageNumber,
	PageNumberTotal,
	PieChart,
	Table,
	TableLayout,
	Text,
	Switch,
} from "./type/index.js";

export interface PrintModelElement extends PrintModelEntity {
	readonly type: ElementType;
}

export enum ElementType {
	Text = "Text",
	Expression = "Expression",
	Image = "Image",
	Table = "Table",
	TableLayout = "TableLayout",
	Listing = "Listing",
	BarChart = "BarChart",
	LineChart = "LineChart",
	PieChart = "PieChart",
	Line = "Line",
	Field = "Field",
	Calculation = "Calculation",
	PageNumber = "PageNumber",
	PageNumberTotal = "PageNumberTotal",
	BoundingBox = "BoundingBox",
	Override = "Override",
	Area = "Area",
	Switch = "Switch",
}

export type AnyPrintModelElement =
	| BarChart
	| BoundingBox
	| Calculation
	| Expression
	| Field
	| Image
	| LineChart
	| Line
	| Listing
	| PageNumberTotal
	| PageNumber
	| PieChart
	| TableLayout
	| Table
	| Text
	| Override
	| Area
	| Switch;

export namespace PrintModelElement {
	export function isInstance(element: unknown): element is PrintModelElement {
		return (
			isObject(element) &&
			"id" in element &&
			"type" in element &&
			Object.values(ElementType).includes(element.type as ElementType)
		);
	}
}

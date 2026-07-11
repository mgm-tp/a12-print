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
import type { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/errors";
import type {
	Area,
	BarChart,
	BoundingBox,
	Calculation,
	Expression,
	Field,
	Image,
	LineChart,
	Listing,
	Override,
	PieChart,
	PrintModelElement,
	Styleable,
	Switch,
	Table,
	TableLayout,
	Text,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";

import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";

export type Selector<R> = (state: PrintEngineState) => R;

export function isStyleableElement(
	element: DeepPartialErrorMap<PrintModelElement>
): element is DeepPartialErrorMap<Styleable> {
	return "borderProperties" in element || "textProperties" in element;
}

export function isExpressionErrorMap(
	element: DeepPartialErrorMap<PrintModelElement>
): element is DeepPartialErrorMap<Expression> {
	return element["@type"] === ElementType.Expression;
}

export function isPieChartErrorMap(
	element: DeepPartialErrorMap<PrintModelElement>
): element is DeepPartialErrorMap<PieChart> {
	return element["@type"] === ElementType.PieChart;
}

export function isLineChartErrorMap(
	element: DeepPartialErrorMap<PrintModelElement>
): element is DeepPartialErrorMap<LineChart> {
	return element["@type"] === ElementType.LineChart;
}

export function isBarChartErrorMap(
	element: DeepPartialErrorMap<PrintModelElement>
): element is DeepPartialErrorMap<BarChart> {
	return element["@type"] === ElementType.BarChart;
}

export function isImageErrorMap(
	element: DeepPartialErrorMap<PrintModelElement>
): element is DeepPartialErrorMap<Image> {
	return element["@type"] === ElementType.Image;
}

export function isFieldErrorMap(
	element: DeepPartialErrorMap<PrintModelElement>
): element is DeepPartialErrorMap<Field> {
	return element["@type"] === ElementType.Field;
}

export function isCalculationErrorMap(
	element: DeepPartialErrorMap<PrintModelElement>
): element is DeepPartialErrorMap<Calculation> {
	return element["@type"] === ElementType.Calculation;
}

export function isTableLayoutErrorMap(
	element: DeepPartialErrorMap<PrintModelElement>
): element is DeepPartialErrorMap<TableLayout> {
	return element["@type"] === ElementType.TableLayout;
}

export function isTableErrorMap(
	element: DeepPartialErrorMap<PrintModelElement>
): element is DeepPartialErrorMap<Table> {
	return element["@type"] === ElementType.Table;
}

export function isListingErrorMap(
	element: DeepPartialErrorMap<PrintModelElement>
): element is DeepPartialErrorMap<Listing> {
	return element["@type"] === ElementType.Listing;
}

export function isTextErrorMap(element: DeepPartialErrorMap<PrintModelElement>): element is DeepPartialErrorMap<Text> {
	return element["@type"] === ElementType.Text;
}

export function isBoundingBoxErrorMap(
	element: DeepPartialErrorMap<PrintModelElement>
): element is DeepPartialErrorMap<BoundingBox> {
	return element["@type"] === ElementType.BoundingBox;
}

export function isOverrideErrorMap(
	element: DeepPartialErrorMap<PrintModelElement>
): element is DeepPartialErrorMap<Override> {
	return element["@type"] === ElementType.Override;
}

export function isAreaErrorMap(element: DeepPartialErrorMap<PrintModelElement>): element is DeepPartialErrorMap<Area> {
	return element["@type"] === ElementType.Area;
}

export function isSwitchErrorMap(
	element: DeepPartialErrorMap<PrintModelElement>
): element is DeepPartialErrorMap<Switch> {
	return element["@type"] === ElementType.Switch;
}

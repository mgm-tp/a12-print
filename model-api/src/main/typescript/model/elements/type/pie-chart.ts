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
import { PartialAnyPrintModelElement } from "../../partial.js";

import type { BaseChartProperties, PrintModelEntity, Styleable } from "../base.js";
import { isMeasure } from "../base.js";
import type { PrintModelElement } from "../print-model-element.js";
import { ElementType } from "../print-model-element.js";

export interface PieChart extends PrintModelElement, Styleable {
	readonly type: ElementType.PieChart;
	readonly pieChart: PieChartProperties;
}

export interface PieChartProperties extends BaseChartProperties {
	readonly data?: PieChartData;
}

export interface PieChartData extends PrintModelEntity {
	readonly valueField: string;
	readonly keyField?: string;
	readonly labelIsNumeration?: boolean;
}
export namespace PieChart {
	export function isInstance(element: PartialAnyPrintModelElement): element is PieChart {
		return (
			element.type === ElementType.PieChart &&
			typeof element.pieChart?.basePath === "string" &&
			isMeasure(element.pieChart?.dimensions?.width) &&
			isMeasure(element.pieChart?.dimensions?.height)
		);
	}
}

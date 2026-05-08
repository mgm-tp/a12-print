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
import type { ReferenceContainer, ReferenceContainerLabels, TableLayoutCellReference } from "../../reference/index.js";
import type { PartialAnyPrintModelElement } from "../../partial.js";

import type { MeasureInputSource, PrintModelEntity, Styleable } from "../base.js";
import type { PrintModelElement } from "../print-model-element.js";
import { ElementType } from "../print-model-element.js";

export interface TableLayout extends PrintModelElement, Styleable {
	readonly type: ElementType.TableLayout;
	readonly tableLayout: TableLayoutProperties;
}

export interface TableLayoutProperties
	extends ReferenceContainer<ReferenceContainerLabels.cells, TableLayoutCellReference>,
		PrintModelEntity {
	readonly rowCount: number;
	readonly columnCount: number;
	readonly rowProperties?: ReadonlyArray<RowProperties>;
	readonly columnProperties?: ReadonlyArray<ColumnProperties>;
}

export interface RowProperties extends PrintModelEntity {
	readonly index: number;
	readonly minHeight: MeasureInputSource;
}

export interface ColumnProperties extends PrintModelEntity {
	readonly index: number;
	readonly width: MeasureInputSource;
	readonly verticalAlignment?: VerticalAlignment;
}

export enum VerticalAlignment {
	Top = "Top",
	Middle = "Middle",
	Bottom = "Bottom",
}

export interface TableLayoutCell extends PrintModelEntity {
	readonly row: number;
	readonly column: number;
}

export namespace TableLayout {
	export function isInstance(element: PartialAnyPrintModelElement): element is TableLayout {
		return (
			element.type === ElementType.TableLayout &&
			typeof element.tableLayout?.rowCount === "number" &&
			typeof element.tableLayout.columnCount === "number" &&
			Array.isArray(element.tableLayout.cells)
		);
	}
}

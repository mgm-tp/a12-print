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
import type { ReactNode } from "react";

import type { BaseColumnType, TableRenderPropsType, SelectItem } from "@com.mgmtp.a12.widgets/widgets-core";
import type { MeasureUnit } from "@com.mgmtp.a12.print/print-model-api/model";

import type { ElementWithoutIdAndType } from "../type.js";
import type { SourceInputProperties } from "../custom-base-input-components/types.js";

export interface CustomBodyContentProps<RowType> extends TableRenderPropsType.BodyContentProps<
	RowType,
	RepeatColumnType<RowType>
> {
	closeRepeatBodyRow(): void;

	clonedRow: RowType;
	setClonedRow: React.Dispatch<React.SetStateAction<RowType>>;

	dispatchNewRowData(newRow: RowType, rowIndex: number): void;

	getErrorMessage?: (property: keyof ElementWithoutIdAndType<RowType>, rowIndex: number) => ReactNode;
}

type InputTypes = "textline" | "select" | "checkbox" | "number";

export interface RepeatColumnType<RowType> extends BaseColumnType<RowType> {
	inputType?: InputTypes;
	selectItems?: SelectItem[];
	inputProps?: React.HTMLProps<HTMLInputElement>;
	suffixes?: React.ReactNode | React.ReactNode[];
	readonly?: boolean;
	sourceProperties?: Pick<SourceInputProperties, "property" | "element"> & { measureUnit?: MeasureUnit };
	renderColumn?: (row: RowType, dataKey?: string | number) => string;
}

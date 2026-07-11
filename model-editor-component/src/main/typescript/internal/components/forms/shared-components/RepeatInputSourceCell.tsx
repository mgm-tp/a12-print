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
import * as React from "react";

import { getDataByKey } from "@com.mgmtp.a12.widgets/widgets-core";
import type { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";
import type { InputSource, MeasureInputSource } from "@com.mgmtp.a12.print/print-model-api/model";
import { isInputSource, MeasureUnit } from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/utils";

import {
	changeMeasureInputValue,
	changeMMInputSource,
	changeInputSource,
	changeInputValue,
	changePercentInputSource,
} from "../../../utils/input-source-utils.js";

import type { ElementWithoutIdAndType } from "../type.js";
import { SourceInput } from "../custom-base-input-components/source-input/index.js";

import type { CustomBodyContentProps } from "./types.js";

type RepeatInputSourceCellProps<RowType> = CustomBodyContentProps<RowType>;

export function RepeatInputSourceCell<RowType>(props: RepeatInputSourceCellProps<RowType>) {
	const { column, clonedRow, getErrorMessage, rowIndex, setClonedRow, dispatchNewRowData } = props;
	const { inputProps, suffixes } = column;

	const cellValue = column.dataKey !== undefined ? getDataByKey(clonedRow, column.dataKey) : undefined;

	const errorMessage = getErrorMessage?.(column.dataKey as keyof ElementWithoutIdAndType<RowType>, rowIndex);
	const isReadOnly = column.readonly;

	const sourceProperties = column.sourceProperties;

	if (!sourceProperties) {
		throw new Error("Missing source properties");
	}

	if (!["textline", "number"].includes(String(column.inputType))) {
		throw new Error(`Column type ${column.inputType}: is not supported as input source`);
	}

	if (!typeGuard(cellValue)) {
		throw new Error(`Column ${column.dataKey}: Value is not input source`);
	}

	const onSourceChange = (source: PossibleInputSource, path: string) => {
		const measureUnit = sourceProperties.measureUnit;
		let updateCellValue: DeepPartialRecursive<MeasureInputSource | InputSource<string | number>> | undefined;

		if (measureUnit === MeasureUnit.Percent) {
			updateCellValue = changePercentInputSource(source, path, cellValue as MeasureInputSource);
		} else if (measureUnit === MeasureUnit.Millimeter) {
			updateCellValue = changeMMInputSource(source, path, cellValue as MeasureInputSource);
		} else if (column.inputType === "number") {
			updateCellValue = changeInputSource(source, path, cellValue as InputSource<number>);
		} else if (column.inputType === "textline") {
			updateCellValue = changeInputSource(source, path, cellValue as InputSource<string>);
		} else {
			updateCellValue = undefined;
		}

		const updatedRow = { ...clonedRow, [`${column.dataKey}`]: updateCellValue };
		setClonedRow(updatedRow);

		dispatchNewRowData(updatedRow, rowIndex);
	};

	const onValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		const measureUnit = sourceProperties.measureUnit;
		let updateCellValue: DeepPartialRecursive<MeasureInputSource | InputSource<string | number>> | undefined;

		if (measureUnit) {
			updateCellValue = changeMeasureInputValue(
				value ? Number(value) : undefined,
				cellValue as MeasureInputSource
			);
		} else if (column.inputType === "number") {
			updateCellValue = changeInputValue(value ? Number(value) : undefined, cellValue as InputSource<number>);
		} else if (column.inputType === "textline") {
			updateCellValue = changeInputValue(value, cellValue as InputSource<string>);
		}

		setClonedRow(row => ({
			...row,
			[`${column.dataKey}`]: updateCellValue,
		}));
	};

	const onInputBlur = React.useCallback(() => {
		dispatchNewRowData(clonedRow, rowIndex);
	}, [clonedRow, dispatchNewRowData, rowIndex]);

	switch (column.inputType) {
		case "textline":
			return (
				<SourceInput
					sourceProperties={{
						...sourceProperties,
						inputSource: cellValue,
						onSourceChange,
					}}
					value={cellValue?.value ? String(cellValue.value) : undefined}
					onChange={onValueChange}
					onBlur={isReadOnly ? undefined : onInputBlur}
					inputProps={inputProps}
					errorMessage={errorMessage}
					readonly={isReadOnly}
				/>
			);
		case "number":
			return (
				<SourceInput
					sourceProperties={{
						...sourceProperties,
						inputSource: cellValue,
						onSourceChange,
					}}
					value={String(cellValue?.value)}
					onChange={onValueChange}
					onBlur={onInputBlur}
					textAlignment="right"
					inputProps={inputProps}
					suffixes={suffixes}
					errorMessage={errorMessage}
				/>
			);
		default:
			return <div>Error: No specific component found</div>;
	}
}

const typeGuard = (cellValue: unknown): cellValue is InputSource<number | string> | MeasureInputSource => {
	if (!cellValue) {
		return true;
	}

	return isInputSource(cellValue);
};

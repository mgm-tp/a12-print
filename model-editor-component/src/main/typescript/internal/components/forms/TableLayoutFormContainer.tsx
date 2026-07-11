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
import { useDispatch, useSelector } from "react-redux";
import { nanoid } from "nanoid";

import { TextAffix } from "@com.mgmtp.a12.widgets/widgets-core";
import type {
	ColumnProperties,
	RowProperties,
	TableLayoutCell,
	TableLayoutProperties,
	TableLayout,
	PartialBorderProperties,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { MeasureUnit, PartialTableLayout } from "@com.mgmtp.a12.print/print-model-api/model";
import { GlobalRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import type { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/errors";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";
import { InputSourceGenerator, InputValueSourceResolver } from "@com.mgmtp.a12.print/print-model-api/input-source";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { TransactionLogStateActions } from "../../redux/index.js";
import { InteractionLogActions } from "../../redux//interaction-log/index.js";
import type { OmitId } from "../../utils/index.js";
import { useBorderPropertiesErrorMessage } from "../../utils/index.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import { ValidationSelectors } from "../../redux//validation/selectors.js";
import { stringifyMeasureInputValue } from "../../utils/input-source-utils.js";
import { BORDER_PROPERTIES_PATH, TABLE_LAYOUT_PROPERTY_PATH } from "../../constant/element-property-path.js";

import { PositiveNumberInput } from "../custom-input/PositiveNumberInput.js";

import { BorderPropertiesForm, RepeatTable } from "./shared-components/index.js";
import type { ElementWithoutIdAndType } from "./type.js";
import type { RepeatColumnType } from "./shared-components/types.js";

const NUMBER_INPUT_PROPS = {
	type: "number",
	min: 1,
	max: 15,
	step: 1,
};

const WIDTH_PERCENTAGE_INPUT_PROPS = {
	type: "number",
	min: 1,
	max: 100,
	step: 1,
};

const HEIGHT_INPUT_PROPS = {
	type: "number",
	min: 0,
	step: 1,
};

const MAXIMUM_COLUMN_AND_ROW = 15;

const ROW_PROPERTY_MAP: Record<string, keyof RowProperties> = {
	minHeight: "minHeight",
};

const COL_PROPERTY_MAP: Record<string, keyof ColumnProperties> = {
	width: "width",
};

type TableLayoutCellKey = keyof Pick<TableLayoutCell, "row" | "column">;
const ROW_KEY: TableLayoutCellKey = "row";
const COLUMN_KEY: TableLayoutCellKey = "column";

type TableLayoutCountKey = keyof Pick<TableLayoutProperties, "rowCount" | "columnCount">;
const ROW_COUNT_KEY: TableLayoutCountKey = "rowCount";
const COLUMN_COUNT_KEY: TableLayoutCountKey = "columnCount";

export const TableLayoutFormContainer = () => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const element = useSelector(PrintEngineSelectors.currentFormElement);
	const errorMap = useSelector((state: PrintEngineState) => ValidationSelectors.tableLayout(state, element?.id));

	if (!element || !PartialTableLayout.isInstance(element)) {
		throw Error("Expected element of type Tablelayout");
	}
	const tableLayout = element.tableLayout;

	const rowOptionsColumns = useRowOptionsColumns(element);
	const colOptionsColumns = useColOptionsColumns(element);

	const updateTableLayout = React.useCallback(
		(data: OmitId<DeepPartial<TableLayoutProperties>>, description: string) => {
			const updatedElement: PartialTableLayout = {
				...element,
				tableLayout: { id: nanoid(), ...tableLayout, ...data },
			};
			dispatch(
				InteractionLogActions.start({
					description,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, tableLayout]
	);

	const rowData = React.useMemo(() => {
		return (tableLayout?.rowProperties?.slice() || []).map(rowProp => ({
			...rowProp,
		}));
	}, [tableLayout?.rowProperties]);

	const setRowTableData = React.useCallback(
		(rowProperties: DeepPartial<RowProperties>[]) => {
			updateTableLayout(
				{ rowProperties },
				RESOURCE_KEYS.interaction.form.tableLayoutFormContainer.changeRowOption
			);
		},
		[updateTableLayout]
	);

	const colData = React.useMemo(() => {
		return (tableLayout?.columnProperties?.slice() || []).map(colProp => ({
			...colProp,
		}));
	}, [tableLayout?.columnProperties]);

	const setColTableData = React.useCallback(
		(columnProperties: DeepPartial<ColumnProperties>[]) => {
			updateTableLayout(
				{ columnProperties },
				RESOURCE_KEYS.interaction.form.tableLayoutFormContainer.changeColumnOption
			);
		},
		[updateTableLayout]
	);

	const formatOnChange = React.useCallback((newValue: string, oldValue?: string) => {
		const numberValue = Number(newValue);
		if (!Number.isSafeInteger(numberValue) || numberValue === 0) {
			return undefined;
		}
		if (numberValue > MAXIMUM_COLUMN_AND_ROW) {
			return oldValue;
		}
		return String(numberValue);
	}, []);

	const onCountBlur = React.useCallback(
		(newValue: string | undefined, key: TableLayoutCountKey) => {
			const interactionDescription =
				key === ROW_COUNT_KEY
					? RESOURCE_KEYS.interaction.form.tableLayoutFormContainer.changeNumberOfRow
					: RESOURCE_KEYS.interaction.form.tableLayoutFormContainer.changeNumberOfColumn;

			const tableDirectionKey = key === ROW_COUNT_KEY ? ROW_KEY : COLUMN_KEY;

			const newCountValue = Number(newValue) || 0;
			const oldCountValue = Number(tableLayout?.[key]) || 0;

			if (tableLayout && newCountValue < oldCountValue) {
				// number of rows/columns has been decreased
				const filteredCells = tableLayout.cells?.filter(cell => {
					const index = cell[tableDirectionKey];
					return index !== undefined && index < newCountValue;
				});

				updateTableLayout({ [key]: newCountValue || undefined, cells: filteredCells }, interactionDescription);
			} else {
				updateTableLayout({ [key]: newCountValue || undefined }, interactionDescription);
			}
		},
		[updateTableLayout, tableLayout]
	);

	const setBorderProperties = React.useCallback(
		(newProps: OmitId<PartialBorderProperties>) => {
			const updatedElement = {
				...element,
				borderProperties: { id: nanoid(), ...element.borderProperties, ...newProps },
			};
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.tableLayoutFormContainer.changeBorderProperties,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element]
	);

	const getBasePropertyErrorMessage = React.useCallback(
		(
			property: keyof ElementWithoutIdAndType<
				Omit<TableLayoutProperties, "rowProperties" | "columnProperties" | "cells">
			>
		) => {
			return errorMap
				? errorMessageLocalizer(errorMap?.tableLayout?.[property]?.[ErrorSeverity.ERROR])
				: undefined;
		},
		[errorMap, errorMessageLocalizer]
	);

	const getRowPropertiesErrorMessage = React.useCallback(
		(property: keyof ElementWithoutIdAndType<RowProperties>, rowIndex: number) => {
			const realProperty = ROW_PROPERTY_MAP[property] ?? property;
			return errorMap
				? errorMessageLocalizer(
						errorMap?.tableLayout?.rowProperties?.[rowIndex]?.[realProperty]?.[ErrorSeverity.ERROR]
					)
				: undefined;
		},
		[errorMap, errorMessageLocalizer]
	);

	const getColumnPropertiesErrorMessage = React.useCallback(
		(property: keyof ElementWithoutIdAndType<ColumnProperties>, columnIndex: number) => {
			const realProperty = COL_PROPERTY_MAP[property] ?? property;
			return errorMap
				? errorMessageLocalizer(
						errorMap?.tableLayout?.columnProperties?.[columnIndex]?.[realProperty]?.[ErrorSeverity.ERROR]
					)
				: undefined;
		},
		[errorMap, errorMessageLocalizer]
	);

	return (
		<>
			<PositiveNumberInput
				placeholder={localizer(RESOURCE_KEYS.input.selectPlaceholder)}
				label={localizer(RESOURCE_KEYS.elementForm.tableLayout.rowCount)}
				inputProps={NUMBER_INPUT_PROPS}
				value={String(tableLayout?.rowCount || "")}
				onBlur={e => onCountBlur(e.target.value, ROW_COUNT_KEY)}
				formatOnChange={formatOnChange}
				errorMessage={getBasePropertyErrorMessage(ROW_COUNT_KEY)}
			/>
			<PositiveNumberInput
				placeholder={localizer(RESOURCE_KEYS.input.selectPlaceholder)}
				label={localizer(RESOURCE_KEYS.elementForm.tableLayout.columnCount)}
				inputProps={NUMBER_INPUT_PROPS}
				value={String(tableLayout?.columnCount || "")}
				onBlur={e => onCountBlur(e.target.value, COLUMN_COUNT_KEY)}
				formatOnChange={formatOnChange}
				errorMessage={getBasePropertyErrorMessage(COLUMN_COUNT_KEY)}
			/>
			<RepeatTable<DeepPartial<RowProperties>>
				data={rowData}
				columns={rowOptionsColumns}
				setTableData={setRowTableData}
				createEmptyRow={createEmptyRow}
				headline={localizer(RESOURCE_KEYS.elementForm.tableLayout.rowProperties.headline)}
				errorMap={errorMap?.tableLayout?.rowProperties as DeepPartialErrorMap<RowProperties>[] | undefined}
				getErrorMessage={getRowPropertiesErrorMessage}
			/>
			<RepeatTable<DeepPartial<ColumnProperties>>
				data={colData}
				columns={colOptionsColumns}
				setTableData={setColTableData}
				createEmptyRow={createEmptyRow}
				headline={localizer(RESOURCE_KEYS.elementForm.tableLayout.columnProperties.headline)}
				errorMap={
					errorMap?.tableLayout?.columnProperties as
						DeepPartialErrorMap<DeepPartial<ColumnProperties>>[] | undefined
				}
				getErrorMessage={getColumnPropertiesErrorMessage}
			/>
			<BorderPropertiesForm
				element={element}
				propertiesPath={BORDER_PROPERTIES_PATH}
				borderProperties={element.borderProperties}
				setBorderProperties={setBorderProperties}
				getErrorMessage={useBorderPropertiesErrorMessage(element.id)}
			/>
		</>
	);
};

function createEmptyRow(): DeepPartial<RowProperties> | DeepPartial<ColumnProperties> {
	const tableLayoutLifetimeInputSources = InputSourceGenerator.generateInputSourcesForGroup<TableLayout>([
		"tableLayout.columnProperties.width",
		"tableLayout.rowProperties.minHeight",
	]);
	const widthInputSource = InputSourceGenerator.upgradeToMeasureInputSource(
		(tableLayoutLifetimeInputSources.tableLayout.columnProperties as unknown as ColumnProperties).width,
		MeasureUnit.Percent
	);
	const minHeightInputSource = InputSourceGenerator.upgradeToMeasureInputSource(
		(tableLayoutLifetimeInputSources.tableLayout.rowProperties as unknown as RowProperties).minHeight,
		MeasureUnit.Millimeter
	);
	return { id: nanoid(), width: widthInputSource, minHeight: minHeightInputSource };
}

const useRowOptionsColumns = (element: PartialTableLayout): RepeatColumnType<DeepPartial<RowProperties>>[] => {
	const localizer = PrintLocalizer.useLocalizer();

	return React.useMemo(
		() => [
			{
				label: localizer(RESOURCE_KEYS.elementForm.tableLayout.rowProperties.index),
				dataKey: "index",
				horizontalAlignment: "center",
				inputType: "number",
				verticalAlignment: "middle",
				inputProps: NUMBER_INPUT_PROPS,
			},
			{
				label: localizer(RESOURCE_KEYS.elementForm.tableLayout.rowProperties.minHeight),
				dataKey: "minHeight",
				horizontalAlignment: "center",
				inputType: "number",
				verticalAlignment: "middle",
				inputProps: HEIGHT_INPUT_PROPS,
				suffixes: <TextAffix>mm</TextAffix>,
				sourceProperties: {
					property: TABLE_LAYOUT_PROPERTY_PATH.rowMinHeight,
					element,
					measureUnit: MeasureUnit.Millimeter,
				},
				renderColumn: col => {
					return stringifyMeasureInputValue(
						col.minHeight,
						InputValueSourceResolver.getSourceNumberValue(
							col.minHeight,
							element,
							TABLE_LAYOUT_PROPERTY_PATH.rowMinHeight
						)
					);
				},
				width: 1.5,
			},
			{
				label: "",
				dataKey: "",
				horizontalAlignment: "center",
				pinning: "right",
				actionColumn: true,
			},
		],
		[element, localizer]
	);
};

const useColOptionsColumns = (element: PartialTableLayout): RepeatColumnType<DeepPartial<ColumnProperties>>[] => {
	const localizer = PrintLocalizer.useLocalizer();

	return React.useMemo(
		() => [
			{
				label: localizer(RESOURCE_KEYS.elementForm.tableLayout.columnProperties.index),
				dataKey: "index",
				horizontalAlignment: "center",
				inputType: "number",
				verticalAlignment: "middle",
				inputProps: NUMBER_INPUT_PROPS,
			},
			{
				label: `${localizer(RESOURCE_KEYS.elementForm.tableLayout.columnProperties.width)}`,
				dataKey: "width",
				renderColumn: row => {
					return stringifyMeasureInputValue(
						row.width,
						InputValueSourceResolver.getSourceNumberValue(
							row.width,
							element,
							TABLE_LAYOUT_PROPERTY_PATH.columnWidth
						)
					);
				},
				horizontalAlignment: "center",
				inputType: "number",
				verticalAlignment: "middle",
				inputProps: WIDTH_PERCENTAGE_INPUT_PROPS,
				suffixes: <TextAffix>%</TextAffix>,
				sourceProperties: {
					property: TABLE_LAYOUT_PROPERTY_PATH.columnWidth,
					element,
					measureUnit: MeasureUnit.Percent,
				},
				width: 1.5,
			},
			{
				label: localizer(RESOURCE_KEYS.elementForm.tableLayout.columnProperties.verticalAlignment.label),
				dataKey: "verticalAlignment",
				horizontalAlignment: "center",
				inputType: "select",
				selectItems: [
					{ label: "", value: "" },
					{
						label: localizer(RESOURCE_KEYS.elementForm.tableLayout.columnProperties.verticalAlignment.top),
						value: "Top",
					},
					{
						label: localizer(
							RESOURCE_KEYS.elementForm.tableLayout.columnProperties.verticalAlignment.middle
						),
						value: "Middle",
					},
					{
						label: localizer(
							RESOURCE_KEYS.elementForm.tableLayout.columnProperties.verticalAlignment.bottom
						),
						value: "Bottom",
					},
				],
				verticalAlignment: "middle",
			},
			{
				label: "",
				dataKey: "",
				horizontalAlignment: "center",
				pinning: "right",
				actionColumn: true,
			},
		],
		[element, localizer]
	);
};

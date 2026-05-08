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

import {
	DefaultTableComponentRenderers,
	getDataByKey,
	Table,
	TableContextProvider,
	TableRenderPropsType,
	useTableContext,
} from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api/index.js";
import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/index.js";
import { ButtonGroup } from "@com.mgmtp.a12.widgets/widgets-core/lib/button-group/index.js";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";
import { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { BadgeGroup } from "../../badge/BadgeGroup.js";
import { ValidationCounter } from "../../../redux/index.js";

import { ElementWithoutIdAndType } from "../type.js";
import { CustomCheckbox, CustomSelect, CustomTextLineStateless } from "../custom-base-input-components/index.js";

import { FormContainerHeadline } from "./FormContainerHeadline.js";
import { AddButtonGroup } from "./AddButtonGroup.js";
import { ActionColumnButtonGroup } from "./ActionColumnButtonGroup.js";
import { CustomBodyContentProps, RepeatColumnType } from "./types.js";
import { RepeatInputSourceCell } from "./RepeatInputSourceCell.js";

interface RepeatTableProps<RowType> {
	data: RowType[];
	columns: RepeatColumnType<RowType>[];

	setTableData(newTableData: RowType[]): void;

	createEmptyRow: () => RowType;
	headline?: string;
	getErrorMessage?: (property: keyof ElementWithoutIdAndType<RowType>, rowIndex: number) => React.ReactNode;
	errorMap?: DeepPartialErrorMap<RowType>[];
	customRepeatAdd?: React.ReactNode;
}

export function RepeatTable<RowType>(props: RepeatTableProps<RowType>) {
	const { data, columns, setTableData, createEmptyRow, headline, errorMap, getErrorMessage, customRepeatAdd } = props;

	const [selectedRow, setSelectedRow] = React.useState<number | undefined>();

	const onAddRowClick = React.useCallback(() => {
		setTableData([...data, createEmptyRow()]);
	}, [setTableData, data, createEmptyRow]);

	const closeRepeatBodyRow = React.useCallback(() => setSelectedRow(undefined), []);

	const deleteBodyRow = React.useCallback(
		(event: React.MouseEvent<HTMLElement, MouseEvent>, rowIndex: number) => {
			event.stopPropagation();
			setSelectedRow(undefined);
			const newTableData = data.filter((_elData, elIndex) => elIndex !== rowIndex);
			setTableData(newTableData);
		},
		[setTableData, data]
	);

	const dispatchNewRowData = React.useCallback(
		(newRow: RowType, rowIndex: number) => {
			setTableData(data.map((el, index) => (index !== rowIndex ? el : newRow)));
		},
		[data, setTableData]
	);

	const bodyContentRenderer = React.useCallback(
		(props: TableRenderPropsType.BodyContentProps<RowType, RepeatColumnType<RowType>>) => {
			const { column, row, rowIndex } = props;
			if (column.actionColumn) {
				return (
					<ActionColumnButtonGroup
						onEdit={() => setSelectedRow(rowIndex)}
						onDelete={e => deleteBodyRow(e, rowIndex)}
					/>
				);
			}
			if (column.renderColumn) {
				return column.renderColumn(props.row, props.column?.dataKey);
			}
			if (column.inputType === "checkbox") {
				const cellValue = column.dataKey !== undefined ? getDataByKey(row, column.dataKey) : undefined;
				const icon = cellValue ? "check_box" : "check_box_outline_blank";
				return <Icon>{icon}</Icon>;
			}
			return DefaultTableComponentRenderers.bodyContentRenderer(props);
		},
		[deleteBodyRow]
	);

	const bodyRowRenderer = React.useCallback(
		(props: TableRenderPropsType.BodyRowProps<RowType>) => {
			const { key, ...restProps } = props;
			return (
				<React.Fragment key={props.rowIndex}>
					<BadgeGroup validationCounter={ValidationCounter.from(errorMap?.[props.rowIndex])} standalone />
					{props.rowIndex === selectedRow ? (
						<RepeatRow<RowType>
							{...restProps}
							closeRepeatBodyRow={closeRepeatBodyRow}
							dispatchNewRowData={dispatchNewRowData}
							getErrorMessage={getErrorMessage}
						/>
					) : (
						DefaultTableComponentRenderers.bodyRowRenderer({
							...props,
							interactive: true,
							onClick: () => setSelectedRow(props.rowIndex),
						})
					)}
				</React.Fragment>
			);
		},
		[closeRepeatBodyRow, dispatchNewRowData, errorMap, getErrorMessage, selectedRow]
	);

	return (
		<>
			{headline && <FormContainerHeadline label={headline} />}
			<div>
				<Table<RowType, RepeatColumnType<RowType>>
					data={data}
					columns={columns}
					componentRenderers={{ bodyContentRenderer, bodyRowRenderer }}
				/>
			</div>
			{customRepeatAdd || <AddButtonGroup onClick={onAddRowClick} />}
		</>
	);
}

interface RepeatRowProps<RowType> extends TableRenderPropsType.BodyRowProps<RowType> {
	closeRepeatBodyRow(): void;

	dispatchNewRowData(newRow: RowType, rowIndex: number): void;

	getErrorMessage?: (property: keyof ElementWithoutIdAndType<RowType>, rowIndex: number) => React.ReactNode;
}

function RepeatRow<RowType>(props: RepeatRowProps<RowType>) {
	const { closeRepeatBodyRow, dispatchNewRowData, getErrorMessage, ...restProps } = props;
	const context = useTableContext<RowType>(context => context);

	const [clonedRow, setClonedRow] = React.useState<RowType>(restProps.row);

	const bodyContentRenderer = React.useCallback(
		(bodyContentProps: TableRenderPropsType.BodyContentProps<RowType, RepeatColumnType<RowType>>) => (
			<CustomBodyContent<RowType>
				{...bodyContentProps}
				closeRepeatBodyRow={closeRepeatBodyRow}
				clonedRow={clonedRow}
				setClonedRow={setClonedRow}
				dispatchNewRowData={dispatchNewRowData}
				getErrorMessage={getErrorMessage}
			/>
		),
		[clonedRow, closeRepeatBodyRow, dispatchNewRowData, getErrorMessage]
	);

	React.useEffect(() => {
		setClonedRow(restProps.row);
	}, [restProps.row]);

	return (
		<TableContextProvider
			value={{
				...context,
				componentRenderers: {
					...context.componentRenderers,
					bodyContentRenderer,
				},
			}}
		>
			{DefaultTableComponentRenderers.bodyRowRenderer(restProps)}
		</TableContextProvider>
	);
}

function CustomBodyContent<RowType>(props: CustomBodyContentProps<RowType>) {
	const { column, closeRepeatBodyRow, clonedRow, setClonedRow, dispatchNewRowData, rowIndex, getErrorMessage } =
		props;
	const localizer = PrintLocalizer.useLocalizer();

	const handleChange = React.useCallback(
		(value: string | number | boolean): void => {
			setClonedRow(row => ({ ...row, [`${column.dataKey}`]: value }));
		},
		[column.dataKey, setClonedRow]
	);

	const onInputBlur = React.useCallback(() => {
		dispatchNewRowData(clonedRow, rowIndex);
	}, [clonedRow, dispatchNewRowData, rowIndex]);

	if (column.actionColumn) {
		return (
			<ButtonGroup>
				<Button
					primary
					icon={<Icon>check</Icon>}
					title={localizer(RESOURCE_KEYS.button.save)}
					onKeyDown={onActionButtonKeydown}
					onClick={closeRepeatBodyRow}
				/>
			</ButtonGroup>
		);
	}

	const cellValue = column.dataKey !== undefined ? getDataByKey(clonedRow, column.dataKey) : undefined;
	const { inputProps, selectItems, suffixes } = column;

	const errorMessage = getErrorMessage?.(column.dataKey as keyof ElementWithoutIdAndType<RowType>, rowIndex);
	const isReadOnly = column.readonly;
	const sourceProperties = column.sourceProperties;

	if (sourceProperties) {
		return <RepeatInputSourceCell {...props} />;
	}

	switch (column.inputType) {
		case "textline":
			return (
				<CustomTextLineStateless
					value={cellValue ? String(cellValue) : undefined}
					onChange={e => handleChange(e.target.value)}
					onBlur={isReadOnly ? undefined : onInputBlur}
					inputProps={inputProps}
					errorMessage={errorMessage}
					readonly={isReadOnly}
				/>
			);
		case "select":
			return (
				<CustomSelect
					value={String(cellValue)}
					onValueChanged={handleChange}
					items={selectItems || []}
					onBlur={onInputBlur}
					errorMessage={errorMessage}
				/>
			);
		case "number":
			return (
				<CustomTextLineStateless
					value={String(cellValue)}
					onChange={e => handleChange(Number(e.target.value))}
					onBlur={onInputBlur}
					textAlignment="right"
					inputProps={inputProps}
					suffixes={suffixes}
					errorMessage={errorMessage}
				/>
			);
		case "checkbox":
			return (
				<CustomCheckbox
					checked={!!cellValue as boolean}
					onChange={handleChange}
					onBlur={onInputBlur}
					fitToParent={false}
					errorMessage={errorMessage}
				/>
			);
		default:
			return <div>Error: No specific component found</div>;
	}
}

function onActionButtonKeydown(event: React.KeyboardEvent<HTMLElement>) {
	if (event.key === "Enter") {
		event.stopPropagation();
	}
}

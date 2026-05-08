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
import { useDispatch, useSelector } from "react-redux";
import * as React from "react";
import { nanoid } from "nanoid";

import { BaseColumnType } from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api/column.api.js";
import { TableRenderPropsType } from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api/index.js";
import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/index.js";
import { ButtonGroup } from "@com.mgmtp.a12.widgets/widgets-core/lib/button-group/index.js";
import { noop } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/index.js";
import {
	DefaultTableComponentRenderers,
	Table,
} from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api/table.view.js";
import {
	MeasureUnit,
	PartialTable,
	PrintModelElement,
	Table as PrintTable,
	TableColumn,
	TableColumnReference,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";
import {
	GlobalRegion,
	TableRegion,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import {
	InputSourceGenerator,
	InputValueSourceResolver,
} from "@com.mgmtp.a12.print/print-model-api/lib/input-source/index.js";

import { PrintEngineSelectors } from "../../../store/selectors.js";
import { DetailDataActions } from "../../../redux/detail-data/index.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { TransactionLogStateActions, ValidationCounter } from "../../../redux/index.js";
import { PrintEngineState } from "../../../store/root-reducer.js";
import { InteractionLogActions } from "../../../redux/interaction-log/index.js";
import { BadgeGroup } from "../../badge/BadgeGroup.js";
import { ValidationSelectors } from "../../../redux/validation/selectors.js";
import { stringifyMeasureInputValue } from "../../../utils/input-source-utils.js";
import { TABLE_PROPERTY_PATH } from "../../../constant/element-property-path.js";

import { ActionColumnButtonGroup } from "../shared-components/ActionColumnButtonGroup.js";
import { CustomCheckbox } from "../custom-base-input-components/index.js";

type RowType = DeepPartial<TableColumnReference>;

interface TableColumnsProps {
	element: PrintModelElement & DeepPartial<PrintTable>;
}

export const TableColumns = ({ element }: TableColumnsProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const currentDetailDataId = useSelector(PrintEngineSelectors.currentDetailDataId);

	const table = element.table;
	const columnsCopy = React.useMemo(() => element.table?.columns?.slice() || [], [element.table?.columns]);
	const columnDefinitions = useColumnDefinitions();

	const columnCreation = React.useCallback((id: string) => {
		const tableLifetimeInputSources = InputSourceGenerator.generateInputSource<PrintTable>("table.columns");
		const widthInputSource = InputSourceGenerator.upgradeToMeasureInputSource(
			(tableLifetimeInputSources.table.columns as unknown as TableColumn).width,
			MeasureUnit.Percent
		);
		const tableColumnInputSource = {
			...tableLifetimeInputSources,
			table: {
				columns: {
					...tableLifetimeInputSources.table.columns,
					width: widthInputSource,
				},
			},
		};
		return {
			id: id,
			...tableColumnInputSource.table.columns,
		};
	}, []);

	const openTableColumnForm = React.useCallback(() => {
		const columnId = nanoid();
		const updatedElement: PartialTable = {
			...element,
			table: { id: nanoid(), ...table, columns: [...columnsCopy, columnCreation(columnId)] },
		};
		dispatch(
			InteractionLogActions.start({
				description: RESOURCE_KEYS.interaction.form.tableFormContainer.tableColumn.addColumn,
				region: GlobalRegion.FORM,
				transactionLogActions: [
					TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
				],
			})
		);
		dispatch(
			DetailDataActions.updateAdditionalData({
				containerId: currentDetailDataId,
				table: {
					columnId,
					columnIndex: columnsCopy.length,
				},
			})
		);
		dispatch(
			DetailDataActions.addView({
				containerId: currentDetailDataId,
				view: TableRegion.TABLE_COLUMN_FORM,
			})
		);
	}, [element, table, columnsCopy, dispatch, currentDetailDataId, columnCreation]);

	const onDeleteRow = React.useCallback(
		(rowIndex: number) => {
			const updatedElement: PartialTable = {
				...element,
				table: { id: nanoid(), ...table, columns: columnsCopy.filter((_el, idx) => idx !== rowIndex) },
			};
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.tableFormContainer.tableColumn.deleteColumn,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
					affectedItems: [{ type: "printModelElement", id: updatedElement.id }],
				})
			);
		},
		[columnsCopy, dispatch, element, table]
	);

	const { componentRenderers, rowEventHandlers } = useTableHandlers(element, onDeleteRow);

	return (
		<div className="-u-margin-t-2xs">
			<Table<RowType>
				columns={columnDefinitions}
				data={columnsCopy}
				componentRenderers={componentRenderers}
				rowEventHandlers={rowEventHandlers}
			></Table>
			<ButtonGroup alignment={"right"}>
				<Button
					label={localizer(RESOURCE_KEYS.button.add)}
					className="-u-margin-t-2xs"
					onClick={openTableColumnForm}
				/>
			</ButtonGroup>
		</div>
	);
};

const useTableHandlers = (
	element: PrintModelElement & DeepPartial<PrintTable>,
	onDelete: (rowIndex: number) => void
) => {
	const dispatch = useDispatch();
	const currentDetailDataId = useSelector(PrintEngineSelectors.currentDetailDataId);
	const errorMap = useSelector(
		(state: PrintEngineState) => ValidationSelectors.table(state, element.id)?.table?.columns
	);

	const rowEventHandlers = React.useCallback(
		(params: { row: RowType; rowIndex: number }) => {
			const onRowClick = (rowIndex: number) => {
				dispatch(
					DetailDataActions.updateAdditionalData({
						containerId: currentDetailDataId,
						table: { columnIndex: rowIndex, columnId: params.row.id },
					})
				);
				dispatch(
					DetailDataActions.addView({
						containerId: currentDetailDataId,
						view: TableRegion.TABLE_COLUMN_FORM,
					})
				);
			};

			return {
				onClick: () => onRowClick(params.rowIndex),
			};
		},
		[dispatch, currentDetailDataId]
	);

	const componentRenderers = React.useMemo(() => {
		const bodyContentRenderer = (props: TableRenderPropsType.BodyContentProps<RowType>) => {
			const {
				column: { actionColumn, dataKey },
				row: { headerLabelHidden, width, label, refId },
				rowIndex,
			} = props;

			if (actionColumn) {
				if (dataKey === "headerLabelHidden") {
					return <CustomCheckbox readonly checked={Boolean(headerLabelHidden)} onChange={noop} />;
				}
				if (dataKey === "action") {
					return (
						<ActionColumnButtonGroup
							onDelete={(event: React.MouseEvent<HTMLElement>) => {
								event.stopPropagation();
								onDelete(rowIndex);
							}}
						/>
					);
				}
			}
			if (dataKey === "width") {
				return stringifyMeasureInputValue(
					width,
					InputValueSourceResolver.getSourceNumberValue(width, element, TABLE_PROPERTY_PATH.columnWidth)
				);
			}
			if (dataKey === "label") {
				return InputValueSourceResolver.getSourceStringValue(label, element, TABLE_PROPERTY_PATH.columnLabel);
			}
			if (dataKey === "refId" && refId) {
				return <TypeColumn refId={refId} />;
			}
			return DefaultTableComponentRenderers.bodyContentRenderer(props);
		};

		const bodyRowRenderer = (props: TableRenderPropsType.BodyRowProps<RowType>) => {
			return (
				<React.Fragment key={props.rowIndex}>
					<BadgeGroup validationCounter={ValidationCounter.from(errorMap?.[props.rowIndex])} standalone />
					{DefaultTableComponentRenderers.bodyRowRenderer(props)}
				</React.Fragment>
			);
		};

		return {
			bodyContentRenderer,
			bodyRowRenderer,
		};
	}, [element, errorMap, onDelete]);

	return {
		rowEventHandlers,
		componentRenderers,
	};
};

const TypeColumn = ({ refId }: { refId: string }) => {
	const refElement = useSelector((state: PrintEngineState) => PrintEngineSelectors.printModelElement(state, refId));

	return <>{refElement.type}</>;
};

const useColumnDefinitions = (): BaseColumnType<RowType>[] => {
	const localizer = PrintLocalizer.useLocalizer();

	return React.useMemo(
		() => [
			{
				label: localizer(RESOURCE_KEYS.elementForm.table.column.type),
				dataKey: "refId",
			},
			{
				label: localizer(RESOURCE_KEYS.elementForm.table.column.label),
				dataKey: "label",
			},
			{
				label: localizer(RESOURCE_KEYS.elementForm.table.column.headerLabelHidden),
				dataKey: "headerLabelHidden",
				actionColumn: true,
			},
			{
				label: localizer(RESOURCE_KEYS.elementForm.table.column.width),
				dataKey: "width",
			},
			{
				label: "",
				dataKey: "action",
				actionColumn: true,
			},
		],
		[localizer]
	);
};

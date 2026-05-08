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

import { TextAffix } from "@com.mgmtp.a12.widgets/widgets-core/lib/input/text-line/index.js";
import {
	ElementType,
	PartialExpression,
	PartialField,
	PartialTable,
	PartialTableColumnReference,
	TableColumnReference,
	TextProperties,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { addPrefix } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/index.js";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";
import { TableRegion } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/lib/input-source/input-source.js";
import { InputValueSourceResolver } from "@com.mgmtp.a12.print/print-model-api/lib/input-source/index.js";

import { DetailDataActions, TransactionLogStateActions } from "../../../redux/index.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { PrintEngineState } from "../../../store/root-reducer.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { InteractionLogActions } from "../../../redux/interaction-log/index.js";
import { ValidationSelectors } from "../../../redux/validation/selectors.js";
import { PositiveNumberInput } from "../../custom-input/PositiveNumberInput.js";
import {
	changeInputSource,
	changeInputValue,
	changeMeasureInputValue,
	changePercentInputSource,
	parseNumberInputValue,
	stringifyInputValue,
} from "../../../utils/input-source-utils.js";
import { TABLE_PROPERTY_PATH, TEXT_PROPERTIES_PATH } from "../../../constant/element-property-path.js";

import { BackButtonGroup } from "../shared-components/index.js";
import { CustomCheckbox, CustomSelect, CustomTextLineStateful } from "../custom-base-input-components/index.js";

import { TableColumnFieldForm } from "./TableColumnFieldForm.js";
import { TableColumnExpressionForm } from "./TableColumnExpressionForm.js";
import { TableColumnElementBaseProps } from "./table-column-element-base.js";

type ColumnElementType = ElementType.Field | ElementType.Expression | "";

interface TableColumnFormDetailProps {
	element: PartialTable;
	columnIndex: number;
}

export const TableColumnFormDetail = ({ element, columnIndex }: TableColumnFormDetailProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const currentDetailDataId = useSelector(PrintEngineSelectors.currentDetailDataId);
	const refId = element.table?.columns?.[columnIndex].refId;
	const refElement = useSelector((state: PrintEngineState) =>
		refId ? PrintEngineSelectors.printModelElement(state, refId) : undefined
	);
	const errorMap = useSelector(
		(state: PrintEngineState) => ValidationSelectors.table(state, element.id)?.table?.columns?.[columnIndex]
	);
	const getPropertyErrorMessage = React.useCallback(
		(property: keyof TableColumnReference) => {
			return errorMap ? errorMessageLocalizer(errorMap?.[property]?.[ErrorSeverity.ERROR]) : undefined;
		},
		[errorMap, errorMessageLocalizer]
	);

	const table = element.table;
	const columns = React.useMemo(() => {
		return element.table?.columns || [];
	}, [element.table?.columns]);

	const currentColumn = React.useMemo(() => {
		return columns[columnIndex];
	}, [columnIndex, columns]);

	const onBackButton = React.useCallback(() => {
		dispatch(
			DetailDataActions.removeView({
				containerId: currentDetailDataId,
				view: TableRegion.TABLE_COLUMN_FORM,
			})
		);
		dispatch(DetailDataActions.deleteAdditionalData({ containerId: currentDetailDataId }));
	}, [dispatch, currentDetailDataId]);

	const updateCurrentColumn = (newColumn: DeepPartialRecursive<TableColumnReference>, description: string) => {
		const updatedElement: PartialTable = {
			...element,
			table: {
				id: nanoid(),
				...table,
				columns: columns.map((el: PartialTableColumnReference, index: number) =>
					index === columnIndex ? { ...currentColumn, ...newColumn } : el
				),
			},
		};
		dispatch(
			InteractionLogActions.start({
				description,
				region: TableRegion.TABLE_COLUMN_FORM,
				transactionLogActions: [
					TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
				],
			})
		);
	};

	const onLabelSourceChange = (source: PossibleInputSource, path: string) => {
		let updatedColumn: DeepPartialRecursive<TableColumnReference> = columns[columnIndex];

		if (updatedColumn) {
			updatedColumn = {
				...updatedColumn,
				label: changeInputSource(source, path, updatedColumn?.label),
			};
			updateCurrentColumn(
				updatedColumn,
				RESOURCE_KEYS.interaction.form.tableFormContainer.tableColumnForm.changeLabel.source
			);
		}
	};

	const onLabelValueChange = (event: React.FocusEvent<HTMLInputElement>) => {
		let updatedColumn: DeepPartialRecursive<TableColumnReference> = columns[columnIndex];

		if (updatedColumn?.label) {
			updatedColumn = {
				...updatedColumn,
				label: changeInputValue(event.target.value, updatedColumn?.label),
			};
			updateCurrentColumn(
				updatedColumn,
				RESOURCE_KEYS.interaction.form.tableFormContainer.tableColumnForm.changeLabel.value
			);
		}
	};

	const onColumnTypeChange = (type: ColumnElementType) => {
		if (type === "") {
			const newColumn = { ...currentColumn, refId: undefined };
			updateCurrentColumn(newColumn, RESOURCE_KEYS.interaction.form.tableFormContainer.tableColumnForm.default);
		} else {
			const newId = nanoid();
			let newElement: PartialExpression | PartialField = {
				id: newId,
				type,
				[String(type).toLowerCase()]: {
					id: nanoid(),
					model: element.table?.model,
					basePath: type === ElementType.Expression ? element?.table?.basePath : undefined,
				},
			};

			if (PartialExpression.isInstance(newElement)) {
				newElement = {
					textProperties: setInheritForExpressionTextProperties(newElement, element),
					...newElement,
				};
			}
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.tableFormContainer.tableColumnForm.changeElementType,
					region: TableRegion.TABLE_COLUMN_FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [newElement] }),
					],
				})
			);
			const newColumn = { ...currentColumn, refId: newId };
			updateCurrentColumn(newColumn, RESOURCE_KEYS.interaction.form.tableFormContainer.tableColumnForm.default);
		}
	};

	const onWidthSourceChange = (source: PossibleInputSource, path: string) => {
		let updatedColumn: DeepPartialRecursive<TableColumnReference> = columns[columnIndex];

		if (updatedColumn) {
			updatedColumn = {
				...updatedColumn,
				width: changePercentInputSource(source, path, updatedColumn?.width),
			};
			updateCurrentColumn(
				updatedColumn,
				RESOURCE_KEYS.interaction.form.tableFormContainer.tableColumnForm.changeWidth.source
			);
		}
	};

	const onWidthValueChange = (event: React.FocusEvent<HTMLInputElement>) => {
		let updatedColumn: DeepPartialRecursive<TableColumnReference> = columns[columnIndex];

		if (updatedColumn?.width) {
			updatedColumn = {
				...updatedColumn,
				width: changeMeasureInputValue(parseNumberInputValue(event.target.value), updatedColumn.width),
			};
			updateCurrentColumn(
				updatedColumn,
				RESOURCE_KEYS.interaction.form.tableFormContainer.tableColumnForm.changeWidth.value
			);
		}
	};

	const columnTypes = useColumnTypes();

	const TableColumnForm = TableColumnFormProvider[refElement?.type || ""];
	const group = element.table?.basePath || "";
	const sumColumn = Boolean(currentColumn.sumColumn);
	const showSumColumn = refElement?.type === ElementType.Field;
	return (
		<div>
			<CustomSelect
				label={`${localizer(RESOURCE_KEYS.elementForm.table.column.type)}*`}
				value={refElement?.type || ""}
				items={columnTypes}
				onValueChanged={onColumnTypeChange}
				errorMessage={getPropertyErrorMessage("refId")}
			/>
			<CustomTextLineStateful
				sourceProperties={{
					inputSource: currentColumn?.label,
					element,
					property: TABLE_PROPERTY_PATH.columnLabel,
					onSourceChange: onLabelSourceChange,
				}}
				label={localizer(RESOURCE_KEYS.elementForm.table.column.label)}
				value={currentColumn.label?.value}
				onBlur={onLabelValueChange}
				errorMessage={getPropertyErrorMessage("label")}
			/>
			<CustomCheckbox
				checked={Boolean(currentColumn.headerLabelHidden)}
				onChange={value =>
					updateCurrentColumn(
						{ headerLabelHidden: value },
						RESOURCE_KEYS.interaction.form.tableFormContainer.tableColumnForm.toggleHideLabel
					)
				}
				label={localizer(RESOURCE_KEYS.elementForm.table.column.headerLabelHidden)}
				className={addPrefix("-u-margin-t-2xs")}
				errorMessage={getPropertyErrorMessage("headerLabelHidden")}
			/>
			<PositiveNumberInput
				sourceProperties={{
					inputSource: currentColumn?.width,
					element,
					property: TABLE_PROPERTY_PATH.columnWidth,
					onSourceChange: onWidthSourceChange,
				}}
				label={localizer(RESOURCE_KEYS.elementForm.table.column.width)}
				inputProps={{
					type: "number",
					min: 0,
					max: 100,
				}}
				value={stringifyInputValue(currentColumn.width?.value)}
				onBlur={onWidthValueChange}
				textAlignment="right"
				suffixes={<TextAffix>%</TextAffix>}
				errorMessage={getPropertyErrorMessage("width")}
			/>
			{TableColumnForm && (
				<TableColumnForm refId={refElement?.id || ""} group={group} model={element.table?.model} />
			)}
			{showSumColumn && (
				<CustomCheckbox
					checked={sumColumn}
					onChange={value =>
						updateCurrentColumn(
							{ sumColumn: value },
							RESOURCE_KEYS.interaction.form.tableFormContainer.tableColumnForm.toggleSumColumn
						)
					}
					label={localizer(RESOURCE_KEYS.elementForm.table.column.field.sumColumn)}
					className={addPrefix("-u-margin-t-2xs")}
					errorMessage={getPropertyErrorMessage("sumColumn")}
				/>
			)}
			<BackButtonGroup onBack={onBackButton} className={addPrefix("-u-margin-t-md")} />
		</div>
	);
};

export const TableColumnFormProvider: Record<
	ElementType.Field | ElementType.Expression | string,
	React.ComponentType<TableColumnElementBaseProps>
> = {
	[ElementType.Field]: TableColumnFieldForm,
	[ElementType.Expression]: TableColumnExpressionForm,
};

const useColumnTypes = () => {
	const localizer = PrintLocalizer.useLocalizer();

	return React.useMemo(
		() => [
			{
				label: "",
				value: "",
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.tableColumnType.field),
				value: ElementType.Field,
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.tableColumnType.expression),
				value: ElementType.Expression,
			},
		],
		[localizer]
	);
};

function setInheritForExpressionTextProperties(expression: PartialExpression, table: PartialTable): TextProperties {
	function createInheritedGroup(path: string) {
		return {
			id: nanoid(),
			source: PossibleInputSource.INHERITED,
			path: InputValueSourceResolver.getInputSourceMetadata(expression, path).path,
			reference: table.id,
		};
	}
	return {
		id: nanoid(),
		textStyleId: createInheritedGroup(TEXT_PROPERTIES_PATH.textStyleId),
		color: createInheritedGroup(TEXT_PROPERTIES_PATH.color),
		backgroundColor: createInheritedGroup(TEXT_PROPERTIES_PATH.backgroundColor),
		bold: createInheritedGroup(TEXT_PROPERTIES_PATH.bold),
		italic: createInheritedGroup(TEXT_PROPERTIES_PATH.italic),
		underlined: createInheritedGroup(TEXT_PROPERTIES_PATH.underlined),
		alignment: createInheritedGroup(TEXT_PROPERTIES_PATH.alignment),
	};
}

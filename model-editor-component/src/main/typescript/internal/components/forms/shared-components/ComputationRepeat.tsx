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
import { useSelector } from "react-redux";
import { nanoid } from "nanoid";

import { GRAMMAR_ROOT_RULE_NAMES } from "@com.mgmtp.a12.dml/dml/lib/ruleCodeEditor/constants.js";
import { ComputationAlternative, PartialListing } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";
import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/index.js";
import { ButtonGroup } from "@com.mgmtp.a12.widgets/widgets-core/lib/button-group/index.js";
import { TableTemplate } from "@com.mgmtp.a12.widgets/widgets-core/lib/table/index.js";
import {
	BaseColumnType,
	DefaultTableComponentRenderers,
	Table,
	TableRenderPropsType,
} from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api/index.js";
import {
	DeepPartialErrorMap,
	ErrorSeverity,
	PrintError,
} from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";
import { DocumentModelData } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/types/document-model-data.js";

import { useModelNameAliasConverter } from "../../../hooks/index.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { BadgeGroup } from "../../badge/BadgeGroup.js";
import { ValidationCounter } from "../../../redux/index.js";
import { RuleCodeEditor } from "../../rule-code-editor/RuleCodeEditor.js";
import { PrintEngineState } from "../../../store/root-reducer.js";
import { DocumentModelDataSelectors } from "../../../redux/document-model-data/selectors.js";

import { ActionColumnButtonGroup } from "./ActionColumnButtonGroup.js";
import { AddButtonGroup } from "./AddButtonGroup.js";

export type ComputationRepeatRowType = DeepPartial<ComputationAlternative>;

interface ComputationRepeatProps {
	documentModel: string | undefined;
	setTableData: (newValue: ComputationRepeatRowType[]) => void;
	tableData: ComputationRepeatRowType[];
	computationErrorMap?: DeepPartialErrorMap<ComputationAlternative>[];
	initiallyExpanded?: boolean;
}

export const ComputationRepeat = ({
	documentModel,
	tableData,
	setTableData,
	computationErrorMap,
	initiallyExpanded = false,
}: ComputationRepeatProps) => {
	const [expandedRow, setExpandedRow] = React.useState<number | undefined>(
		initiallyExpanded && tableData.length > 0 ? 0 : undefined
	);
	const columns = useComputationColumns();
	const getComputationError = computationErrorMapGetter(computationErrorMap);
	const documentModelData = useSelector((state: PrintEngineState) =>
		DocumentModelDataSelectors.documentModelData(state, documentModel)
	);

	const { aliasDocumentModel, convertModelNameToAlias, convertAliasToModelName } =
		useModelNameAliasConverter(documentModel);

	const onAddRowClick = React.useCallback(() => {
		setTableData([...tableData, { id: nanoid() }]);
	}, [setTableData, tableData]);

	const onEditClick = React.useCallback(
		(bodyContentProps: TableRenderPropsType.BodyContentProps<ComputationRepeatRowType>) => {
			setExpandedRow(bodyContentProps.rowIndex);
		},
		[]
	);

	const closeRepeatBodyRow = React.useCallback(() => setExpandedRow(undefined), []);

	const deleteBodyRow = React.useCallback(
		(rowIndex: number) => {
			setExpandedRow(undefined);
			const newTableData = tableData.filter((_elData, elIndex) => elIndex !== rowIndex);
			setTableData(newTableData);
		},
		[setTableData, tableData]
	);

	const setNewRowData = React.useCallback(
		(rowIndex: number, key: string, newData: string) => {
			const newTableData = tableData.map((elData, elIndex) =>
				elIndex !== rowIndex ? elData : { ...elData, [key]: convertAliasToModelName(newData) }
			);
			setTableData(newTableData);
		},
		[convertAliasToModelName, setTableData, tableData]
	);

	const bodyRowRenderer = React.useCallback(
		({ key, ...props }: TableRenderPropsType.BodyRowProps<ComputationRepeatRowType>) => {
			const row = {
				key,
				...props.row,
				precondition: convertModelNameToAlias(props?.row?.precondition),
				operation: convertModelNameToAlias(props?.row?.operation),
			};
			return props.rowIndex === expandedRow ? (
				<RepeatBodyRow
					key={key}
					closeRepeatBodyRow={closeRepeatBodyRow}
					deleteBodyRow={deleteBodyRow}
					setNewRowData={setNewRowData}
					documentModel={documentModel}
					aliasDocumentModel={aliasDocumentModel}
					documentModelData={documentModelData}
					getComputationError={getComputationError}
					{...props}
					row={row}
				/>
			) : (
				<React.Fragment key={key}>
					<BadgeGroup
						validationCounter={ValidationCounter.from(computationErrorMap?.[props.rowIndex])}
						standalone
					/>
					{DefaultTableComponentRenderers.bodyRowRenderer({
						key,
						...props,
						row,
					})}
				</React.Fragment>
			);
		},
		[
			aliasDocumentModel,
			closeRepeatBodyRow,
			convertModelNameToAlias,
			computationErrorMap,
			deleteBodyRow,
			documentModel,
			documentModelData,
			expandedRow,
			getComputationError,
			setNewRowData,
		]
	);

	const bodyContentRenderer = React.useCallback(
		(props: TableRenderPropsType.BodyContentProps<ComputationRepeatRowType>) => {
			return props.column.actionColumn ? (
				<ActionColumnButtonGroup
					onEdit={() => onEditClick(props)}
					onDelete={() => deleteBodyRow(props.rowIndex)}
				/>
			) : (
				DefaultTableComponentRenderers.bodyContentRenderer(props)
			);
		},
		[deleteBodyRow, onEditClick]
	);

	return (
		<>
			<div>
				<Table<ComputationRepeatRowType>
					columns={columns}
					data={tableData}
					componentRenderers={{
						bodyContentRenderer,
						bodyRowRenderer,
					}}
				/>
			</div>
			<AddButtonGroup onClick={onAddRowClick} />
		</>
	);
};

interface RepeatBodyRowProps extends TableRenderPropsType.BodyRowProps<ComputationRepeatRowType> {
	closeRepeatBodyRow(): void;

	deleteBodyRow(rowIndex: number): void;

	setNewRowData(rowIndex: number, key: string, newData: string): void;

	documentModel: string | undefined;
	aliasDocumentModel: string | undefined;
	documentModelData: DocumentModelData | undefined;
	getComputationError: (property: keyof ComputationRepeatRowType, rowIndex: number) => PrintError[] | undefined;
}

const RepeatBodyRow = ({
	closeRepeatBodyRow,
	deleteBodyRow,
	setNewRowData,
	documentModel,
	getComputationError,
	aliasDocumentModel,
	documentModelData,
	...bodyRowProps
}: RepeatBodyRowProps) => {
	const { rowIndex } = bodyRowProps;
	const localizer = PrintLocalizer.useLocalizer();
	const element = useSelector(PrintEngineSelectors.detailPrintModelElement);

	function onCloseClick(event: React.MouseEvent<HTMLElement, MouseEvent>) {
		event.stopPropagation();
		closeRepeatBodyRow();
	}

	function onDeleteClick(event: React.MouseEvent<HTMLElement, MouseEvent>) {
		event.stopPropagation();
		deleteBodyRow(rowIndex);
	}

	const setNewRowDataByKey = React.useCallback(
		(key: string) => {
			return (newData: string) => setNewRowData(rowIndex, key, newData);
		},
		[rowIndex, setNewRowData]
	);

	const suggestionType = React.useMemo(
		() => (element && PartialListing.isInstance(element) ? "listing" : "default"),
		[element]
	);

	const closeButtonText = localizer(RESOURCE_KEYS.button.close);

	const ruleCodeKey = aliasDocumentModel || documentModel;

	return (
		<TableTemplate.BodyRow key={rowIndex} selected={true}>
			<TableTemplate.ExpandableRow>
				<TableTemplate.ExpandableRowBody>
					<RuleCodeEditor
						key={`${ruleCodeKey}-1`}
						rootRuleName={GRAMMAR_ROOT_RULE_NAMES.COMPUTATION_PRECONDITION}
						label={localizer(RESOURCE_KEYS.elementForm.computation.precondition)}
						setNewRowData={setNewRowDataByKey("precondition")}
						value={bodyRowProps.row.precondition}
						documentModel={documentModel}
						suggestionType={suggestionType}
						aliasDocumentModel={aliasDocumentModel}
						documentModelData={documentModelData}
						validationErrors={getComputationError("precondition", rowIndex)}
					/>
					<RuleCodeEditor
						key={`${ruleCodeKey}-2`}
						rootRuleName={GRAMMAR_ROOT_RULE_NAMES.COMPUTATION_CALCULATION}
						label={localizer(RESOURCE_KEYS.elementForm.computation.operation)}
						setNewRowData={setNewRowDataByKey("operation")}
						value={bodyRowProps.row.operation}
						documentModel={documentModel}
						suggestionType={suggestionType}
						aliasDocumentModel={aliasDocumentModel}
						documentModelData={documentModelData}
						validationErrors={getComputationError("operation", rowIndex)}
					/>
				</TableTemplate.ExpandableRowBody>
				<TableTemplate.ExpandableRowFooter>
					<ButtonGroup alignment="right">
						<Button title={closeButtonText} label={closeButtonText} onClick={onCloseClick} />
						<Button
							destructive
							title={localizer(RESOURCE_KEYS.button.delete)}
							onClick={onDeleteClick}
							icon={<Icon>delete</Icon>}
						/>
					</ButtonGroup>
				</TableTemplate.ExpandableRowFooter>
			</TableTemplate.ExpandableRow>
		</TableTemplate.BodyRow>
	);
};

const useComputationColumns = (): BaseColumnType<ComputationRepeatRowType>[] => {
	const localizer = PrintLocalizer.useLocalizer();

	return [
		{
			label: localizer(RESOURCE_KEYS.elementForm.computation.precondition),
			dataKey: "precondition",
			horizontalAlignment: "center",
		},
		{
			label: localizer(RESOURCE_KEYS.elementForm.computation.operation),
			dataKey: "operation",
			horizontalAlignment: "center",
		},
		{
			label: "",
			dataKey: "",
			horizontalAlignment: "center",
			pinning: "right",
			actionColumn: true,
		},
	];
};

function computationErrorMapGetter<T extends keyof ComputationRepeatRowType>(
	computationErrorMap?: DeepPartialErrorMap<ComputationAlternative>[]
) {
	return (property: T, rowIndex: number) => {
		const errors = computationErrorMap?.[rowIndex]?.[property]?.[ErrorSeverity.ERROR];
		const warnings = computationErrorMap?.[rowIndex]?.[property]?.[ErrorSeverity.WARNING];
		const info = computationErrorMap?.[rowIndex]?.[property]?.[ErrorSeverity.INFO];

		const result: PrintError[] = [];
		if (errors) result.push(...errors);
		if (warnings) result.push(...warnings);
		if (info) result.push(...info);
		return result.length > 0 ? result : undefined;
	};
}

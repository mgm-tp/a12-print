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

import { GRAMMAR_ROOT_RULE_NAMES } from "@com.mgmtp.a12.dml/dml";
import type { Precondition } from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import type { BaseColumnType, TableRenderPropsType } from "@com.mgmtp.a12.widgets/widgets-core";
import {
	Button,
	ButtonGroup,
	Icon,
	TableTemplate,
	DefaultTableComponentRenderers,
	Table,
} from "@com.mgmtp.a12.widgets/widgets-core";
import type { DeepPartialErrorMap, PrintError } from "@com.mgmtp.a12.print/print-model-api/errors";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";
import type { DocumentModelData } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { useModelNameAliasConverter } from "../../../hooks/index.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { BadgeGroup } from "../../badge/BadgeGroup.js";
import { ValidationCounter } from "../../../redux/index.js";
import { RuleCodeEditor } from "../../rule-code-editor/RuleCodeEditor.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { DocumentModelDataSelectors } from "../../../redux/document-model-data/selectors.js";

import { ActionColumnButtonGroup } from "./ActionColumnButtonGroup.js";
import { AddButtonGroup } from "./AddButtonGroup.js";
import { StyledPreconditionsRepeat } from "./PreconditionRepeat.styled.js";

export type PreconditionRepeatRowType = DeepPartial<Precondition>;

interface PreconditionsRepeatProps {
	setTableData: (newValue: PreconditionRepeatRowType[]) => void;
	tableData: PreconditionRepeatRowType[];
	preconditionErrorMap?: DeepPartialErrorMap<Precondition>[];
}

export const PreconditionsRepeat = ({ tableData, setTableData, preconditionErrorMap }: PreconditionsRepeatProps) => {
	const [expandedRow, setExpandedRow] = React.useState<number | undefined>();
	const columns = usePreconditionColumns();
	const documentModel = useSelector(PrintEngineSelectors.defaultModelReference);
	const getComputationError = preconditionErrorMapGetter(preconditionErrorMap);
	const documentModelData = useSelector((state: PrintEngineState) =>
		DocumentModelDataSelectors.documentModelData(state, documentModel)
	);

	const { aliasDocumentModel, convertModelNameToAlias, convertAliasToModelName } =
		useModelNameAliasConverter(documentModel);

	const onAddRowClick = React.useCallback(() => {
		setTableData([...tableData, { id: nanoid() }]);
	}, [setTableData, tableData]);

	const onEditClick = React.useCallback(
		(bodyContentProps: TableRenderPropsType.BodyContentProps<PreconditionRepeatRowType>) => {
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
		({ key, ...props }: TableRenderPropsType.BodyRowProps<PreconditionRepeatRowType>) => {
			const row = {
				key,
				...props.row,
				precondition: convertModelNameToAlias(props?.row?.precondition),
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
						validationCounter={ValidationCounter.from(preconditionErrorMap?.[props.rowIndex])}
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
			preconditionErrorMap,
			deleteBodyRow,
			documentModel,
			documentModelData,
			expandedRow,
			getComputationError,
			setNewRowData,
		]
	);

	const bodyContentRenderer = React.useCallback(
		(props: TableRenderPropsType.BodyContentProps<PreconditionRepeatRowType>) => {
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
		<StyledPreconditionsRepeat>
			<div>
				<Table<PreconditionRepeatRowType>
					columns={columns}
					data={tableData}
					componentRenderers={{
						bodyContentRenderer,
						bodyRowRenderer,
					}}
				/>
			</div>
			<AddButtonGroup onClick={onAddRowClick} />
		</StyledPreconditionsRepeat>
	);
};

interface RepeatBodyRowProps extends TableRenderPropsType.BodyRowProps<PreconditionRepeatRowType> {
	closeRepeatBodyRow(): void;
	deleteBodyRow(rowIndex: number): void;
	setNewRowData(rowIndex: number, key: string, newData: string): void;
	documentModel: string | undefined;
	aliasDocumentModel: string | undefined;
	documentModelData: DocumentModelData | undefined;
	getComputationError: (rowIndex: number) => PrintError[] | undefined;
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

	function onCloseClick(event: React.MouseEvent<HTMLElement, MouseEvent>) {
		event.stopPropagation();
		closeRepeatBodyRow();
	}

	function onDeleteClick(event: React.MouseEvent<HTMLElement, MouseEvent>) {
		event.stopPropagation();
		deleteBodyRow(rowIndex);
	}

	const setNewRowDataByKey = React.useCallback(
		(newData: string) => {
			setNewRowData(rowIndex, "precondition", newData);
		},
		[rowIndex, setNewRowData]
	);

	const closeButtonText = localizer(RESOURCE_KEYS.button.close);
	const ruleCodeKey = aliasDocumentModel || documentModel;
	return (
		<TableTemplate.BodyRow key={rowIndex} selected={true}>
			<TableTemplate.ExpandableRow>
				<TableTemplate.ExpandableRowBody>
					<RuleCodeEditor
						key={ruleCodeKey}
						rootRuleName={GRAMMAR_ROOT_RULE_NAMES.COMPUTATION_PRECONDITION}
						label={localizer(RESOURCE_KEYS.elementForm.computation.condition)}
						setNewRowData={setNewRowDataByKey}
						value={bodyRowProps.row.precondition}
						documentModel={documentModel}
						suggestionType={"default"}
						aliasDocumentModel={aliasDocumentModel}
						documentModelData={documentModelData}
						validationErrors={getComputationError(rowIndex)}
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

const usePreconditionColumns = (): BaseColumnType<PreconditionRepeatRowType>[] => {
	const localizer = PrintLocalizer.useLocalizer();

	return [
		{
			label: localizer(RESOURCE_KEYS.elementForm.computation.condition),
			dataKey: "precondition",
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

function preconditionErrorMapGetter(preconditionErrorMap?: DeepPartialErrorMap<Precondition>[]) {
	return (rowIndex: number) => {
		const errors = preconditionErrorMap?.[rowIndex]?.precondition?.[ErrorSeverity.ERROR];
		const warnings = preconditionErrorMap?.[rowIndex]?.precondition?.[ErrorSeverity.WARNING];
		const info = preconditionErrorMap?.[rowIndex]?.precondition?.[ErrorSeverity.INFO];

		const result: PrintError[] = [];
		if (errors) result.push(...errors);
		if (warnings) result.push(...warnings);
		if (info) result.push(...info);
		return result.length > 0 ? result : undefined;
	};
}

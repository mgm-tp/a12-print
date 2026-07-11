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

import type { SelectItem } from "@com.mgmtp.a12.widgets/widgets-core";
import type {
	BaseChartProperties,
	ChartDimensions,
	LineChartData,
	LineChartProperties,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { PartialLineChart } from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { getItemsFromElementMap } from "../../utils/index.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import type { UpdateElementsTransactionLogAction } from "../../redux/index.js";
import { TransactionLogStateActions } from "../../redux/index.js";
import { InteractionLogActions } from "../../redux//interaction-log/index.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import { ValidationSelectors } from "../../redux//validation/selectors.js";
import { ElementMapUtils } from "../../utils/element-map-utils.js";
import { DocumentModelDataSelectors } from "../../redux/document-model-data/selectors.js";

import type { CommonProperties } from "./shared-components/index.js";
import {
	AllowedElementType,
	ChartCommonProperties,
	DataContextSelection,
	RepeatTable,
} from "./shared-components/index.js";
import { DocumentModelSelect } from "./shared-components/DocumentModelSelect.js";
import { CustomTextField } from "./custom-base-input-components/index.js";
import type { ElementWithoutIdAndType } from "./type.js";
import type { RepeatColumnType } from "./shared-components/types.js";

type LineDiagramData = DeepPartial<LineChartData>;

export const LineChartFormContainer = () => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const element = useSelector(PrintEngineSelectors.currentFormElement);
	const elementReferences = useSelector(PrintEngineSelectors.elementReferences);
	const errorMap = useSelector((state: PrintEngineState) => ValidationSelectors.lineChart(state, element?.id));
	const wrapperDataContext = useSelector(PrintEngineSelectors.wrapperDataContext);

	if (!element || !PartialLineChart.isInstance(element)) {
		throw Error("Expected element of type LineChart");
	}

	const lineChart = element.lineChart;
	const group = lineChart?.basePath;
	const model = lineChart?.model;

	const elementMap = useSelector(
		(state: PrintEngineState) => DocumentModelDataSelectors.documentModelData(state, model)?.elementMap
	);

	const documentModelData = useSelector((state: PrintEngineState) =>
		DocumentModelDataSelectors.documentModelData(state, model)
	);

	const getLineDiagramColumns = useLineDiagramColumns();

	const tableColumns = React.useMemo(() => {
		const selectItems = documentModelData ? getItemsFromElementMap(group, documentModelData.elementMap) : [];
		return getLineDiagramColumns(selectItems);
	}, [documentModelData, getLineDiagramColumns, group]);

	const setSelectedPath = React.useCallback(
		(path: string) => {
			if (path === element.lineChart?.basePath) {
				return;
			}

			const updatedElement = {
				...element,
				lineChart: { id: nanoid(), ...lineChart, basePath: path, data: [] },
			};
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.lineChartFormContainer.changeBasePath,
					region: "form",
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, lineChart]
	);

	const onPropertyChange = React.useCallback(
		(newProps: Partial<CommonProperties>) => {
			const { height, width } = newProps.dimensions || {};
			const updatedElement: PartialLineChart = {
				...element,
				lineChart: {
					id: nanoid(),
					...lineChart,
					...newProps,
				},
			};
			const actions: UpdateElementsTransactionLogAction[] = [
				TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
			];
			if ((height || width) && elementReferences) {
				actions.push(
					TransactionLogStateActions.updateReferenceElements({
						data: elementReferences.map(el =>
							el.refId === element.id
								? {
										...el,
										dimensions: {
											...el.dimensions,
											minHeight: height || el.dimensions?.minHeight,
											minWidth: width || el.dimensions?.minWidth,
										},
									}
								: el
						),
					})
				);
			}
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.lineChartFormContainer.changeGeneralDiagramProps,
					region: "form",
					transactionLogActions: actions,
				})
			);
		},
		[elementReferences, dispatch, element, lineChart]
	);

	const setTableData = React.useCallback(
		(newTableData: LineDiagramData[]) => {
			const updatedElement = {
				...element,
				lineChart: { id: nanoid(), ...lineChart, data: newTableData },
			};
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.lineChartFormContainer.changeDiagramTableData,
					region: "form",
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, lineChart]
	);

	const onChangeDocumentModel = React.useCallback(
		(documentModel?: string) => {
			const updatedElement = {
				...element,
				lineChart: { id: nanoid(), ...lineChart, model: documentModel, basePath: "", data: [] },
			};
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.lineChartFormContainer.changeDocumentModel,
					region: "form",
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, lineChart]
	);

	const getRepeatableChartErrorMessage = React.useCallback(
		(property: keyof ElementWithoutIdAndType<Omit<LineChartProperties, "data">>) => {
			return errorMap ? errorMessageLocalizer(errorMap?.lineChart?.[property]?.[ErrorSeverity.ERROR]) : undefined;
		},
		[errorMap, errorMessageLocalizer]
	);

	const getBaseErrorMessage = React.useCallback(
		(property: keyof ElementWithoutIdAndType<BaseChartProperties>) => {
			return errorMap ? errorMessageLocalizer(errorMap?.lineChart?.[property]?.[ErrorSeverity.ERROR]) : undefined;
		},
		[errorMap, errorMessageLocalizer]
	);

	const getDimensionsErrorMessage = React.useCallback(
		(property: keyof ElementWithoutIdAndType<ChartDimensions>) => {
			return errorMap
				? errorMessageLocalizer(errorMap?.lineChart?.dimensions?.[property]?.[ErrorSeverity.ERROR])
				: undefined;
		},
		[errorMap, errorMessageLocalizer]
	);

	const getDataErrorMessage = React.useCallback(
		(property: keyof LineDiagramData, rowIndex: number) =>
			errorMap
				? errorMessageLocalizer(errorMap?.lineChart?.data?.[rowIndex]?.[property]?.[ErrorSeverity.ERROR])
				: undefined,
		[errorMap, errorMessageLocalizer]
	);

	const processedElementMap = React.useMemo(() => {
		return ElementMapUtils.createEntriesFromDataContext(Object.values(elementMap || {}), wrapperDataContext);
	}, [elementMap, wrapperDataContext]);

	const tableData = React.useMemo(() => lineChart?.data?.slice() || [], [lineChart?.data]);
	const { title, dimensions, labelX, labelY, orientation } = lineChart || {};
	return (
		<>
			<ChartCommonProperties
				element={element}
				isRepeatable
				properties={{
					title,
					orientation,
					labelX,
					labelY,
					dimensions: dimensions as ChartDimensions,
				}}
				onPropertyChange={onPropertyChange}
				getRepeatableChartErrorMessage={getRepeatableChartErrorMessage}
				getBaseErrorMessage={getBaseErrorMessage}
				getChartDimensionsErrorMessage={getDimensionsErrorMessage}
			/>
			<DocumentModelSelect
				value={model}
				onValueChanged={onChangeDocumentModel}
				errorMessage={getBaseErrorMessage("model")}
			/>

			<CustomTextField
				label={localizer(RESOURCE_KEYS.elementForm.model.group)}
				value={group}
				readonly
				errorMessage={getBaseErrorMessage("basePath")}
			/>
			<DataContextSelection
				type={AllowedElementType.anyGroup}
				elementMapEntries={processedElementMap}
				selectedPath={group}
				setSelectedPath={setSelectedPath}
				maxRepeatLevel={0}
			/>
			<RepeatTable<LineDiagramData>
				data={tableData}
				columns={tableColumns}
				setTableData={setTableData}
				createEmptyRow={createEmptyRow}
				errorMap={errorMap?.lineChart?.data}
				getErrorMessage={getDataErrorMessage}
			/>
		</>
	);
};

function createEmptyRow(): LineDiagramData {
	return { id: nanoid() };
}

const useLineDiagramColumns = (): ((selectItems: SelectItem[]) => RepeatColumnType<LineDiagramData>[]) => {
	const localizer = PrintLocalizer.useLocalizer();

	return React.useCallback(
		(selectItems: SelectItem[]) => [
			{
				label: localizer(RESOURCE_KEYS.elementForm.chart.data.valueField),
				dataKey: "valueField",
				horizontalAlignment: "center",
				inputType: "select",
				selectItems: selectItems,
				verticalAlignment: "middle",
			},
			{
				label: localizer(RESOURCE_KEYS.elementForm.chart.data.seriesName),
				dataKey: "seriesName",
				horizontalAlignment: "center",
				inputType: "textline",
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
		[localizer]
	);
};

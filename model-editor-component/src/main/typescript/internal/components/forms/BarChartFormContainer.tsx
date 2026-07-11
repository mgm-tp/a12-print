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
	BarChartData,
	BarChartProperties,
	BaseChartProperties,
	ChartDimensions,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { PartialBarChart } from "@com.mgmtp.a12.print/print-model-api/model";
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

type BarDiagramData = DeepPartial<BarChartData>;

export const BarChartFormContainer = () => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const element = useSelector(PrintEngineSelectors.currentFormElement);
	const errorMap = useSelector((state: PrintEngineState) => ValidationSelectors.barChart(state, element?.id));
	const elementReferences = useSelector(PrintEngineSelectors.elementReferences);
	const wrapperDataContext = useSelector(PrintEngineSelectors.wrapperDataContext);

	if (!element || !PartialBarChart.isInstance(element)) {
		throw Error("Expected element of type BarChart");
	}

	const barChart = element.barChart;
	const group = barChart?.basePath;
	const model = barChart?.model;

	const elementMap = useSelector(
		(state: PrintEngineState) => DocumentModelDataSelectors.documentModelData(state, model)?.elementMap
	);

	const documentModelData = useSelector((state: PrintEngineState) =>
		DocumentModelDataSelectors.documentModelData(state, model)
	);

	const getBarDiagramColumns = useBarDiagramColumns();

	const tableColumns = React.useMemo(() => {
		const selectItems = documentModelData ? getItemsFromElementMap(group, documentModelData.elementMap) : [];
		return getBarDiagramColumns(selectItems);
	}, [documentModelData, getBarDiagramColumns, group]);

	const setSelectedPath = React.useCallback(
		(path: string) => {
			if (path === element.barChart?.basePath) {
				return;
			}

			const updatedElement = { ...element, barChart: { id: nanoid(), ...barChart, basePath: path, data: [] } };
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.barChartFormContainer.changeBasePath,
					region: "form",
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[barChart, dispatch, element]
	);

	const onPropertyChange = React.useCallback(
		(newProps: Partial<CommonProperties>) => {
			const { height, width } = newProps.dimensions || {};
			const updatedElement: PartialBarChart = {
				...element,
				barChart: {
					id: nanoid(),
					...barChart,
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
					description: RESOURCE_KEYS.interaction.form.barChartFormContainer.changeGeneralDiagramProps,
					region: "form",
					transactionLogActions: actions,
				})
			);
		},
		[barChart, element, elementReferences, dispatch]
	);

	const setTableData = React.useCallback(
		(newTableData: BarDiagramData[]) => {
			const updatedElement = { ...element, barChart: { id: nanoid(), ...barChart, data: newTableData } };
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.barChartFormContainer.changeDiagramTableData,
					region: "form",
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[barChart, dispatch, element]
	);

	const onChangeDocumentModel = React.useCallback(
		(documentModel?: string) => {
			const updatedElement = {
				...element,
				barChart: { id: nanoid(), ...barChart, model: documentModel, basePath: "", data: [] },
			};
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.barChartFormContainer.changeDocumentModel,
					region: "form",
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, barChart]
	);

	const tableData = React.useMemo(() => barChart?.data?.slice() || [], [barChart?.data]);

	const generalDiagramProps = React.useMemo(
		() => ({
			title: barChart?.title,
			labelX: barChart?.labelX,
			labelY: barChart?.labelY,
			orientation: barChart?.orientation,
			dimensions: barChart?.dimensions as ChartDimensions,
		}),
		[barChart?.dimensions, barChart?.labelX, barChart?.labelY, barChart?.orientation, barChart?.title]
	);

	const getBasePropertiesErrorMessage = React.useCallback(
		(property: keyof ElementWithoutIdAndType<BaseChartProperties>) =>
			errorMap ? errorMessageLocalizer(errorMap.barChart?.[property]?.[ErrorSeverity.ERROR]) : undefined,
		[errorMap, errorMessageLocalizer]
	);

	const getPropertiesErrorMessage = React.useCallback(
		(property: keyof ElementWithoutIdAndType<Omit<BarChartProperties, "data">>) =>
			errorMap ? errorMessageLocalizer(errorMap.barChart?.[property]?.[ErrorSeverity.ERROR]) : undefined,
		[errorMap, errorMessageLocalizer]
	);

	const getDimensionsErrorMessage = React.useCallback(
		(property: keyof ElementWithoutIdAndType<ChartDimensions>) =>
			errorMap
				? errorMessageLocalizer(errorMap.barChart?.dimensions?.[property]?.[ErrorSeverity.ERROR])
				: undefined,
		[errorMap, errorMessageLocalizer]
	);

	const getDataErrorMessage = React.useCallback(
		(property: keyof BarDiagramData, rowIndex: number) =>
			errorMap
				? errorMessageLocalizer(errorMap?.barChart?.data?.[rowIndex]?.[property]?.[ErrorSeverity.ERROR])
				: undefined,
		[errorMap, errorMessageLocalizer]
	);

	const processedElementMap = React.useMemo(() => {
		return ElementMapUtils.createEntriesFromDataContext(Object.values(elementMap || {}), wrapperDataContext);
	}, [elementMap, wrapperDataContext]);

	return (
		<>
			<ChartCommonProperties
				element={element}
				isRepeatable
				properties={generalDiagramProps}
				onPropertyChange={onPropertyChange}
				getRepeatableChartErrorMessage={getPropertiesErrorMessage}
				getChartDimensionsErrorMessage={getDimensionsErrorMessage}
				getBaseErrorMessage={getBasePropertiesErrorMessage}
			/>
			<DocumentModelSelect
				value={model}
				onValueChanged={onChangeDocumentModel}
				errorMessage={getBasePropertiesErrorMessage("model")}
			/>
			<CustomTextField
				label={localizer(RESOURCE_KEYS.elementForm.model.group)}
				value={group}
				readonly
				errorMessage={getBasePropertiesErrorMessage("basePath")}
			/>
			<DataContextSelection
				type={AllowedElementType.anyGroup}
				elementMapEntries={processedElementMap}
				selectedPath={group}
				setSelectedPath={setSelectedPath}
				maxRepeatLevel={0}
			/>
			<RepeatTable<BarDiagramData>
				data={tableData}
				columns={tableColumns}
				setTableData={setTableData}
				createEmptyRow={createEmptyRow}
				errorMap={errorMap?.barChart?.data}
				getErrorMessage={getDataErrorMessage}
			/>
		</>
	);
};

function createEmptyRow(): BarDiagramData {
	return { id: nanoid() };
}

const useBarDiagramColumns = (): ((selectItems: SelectItem[]) => RepeatColumnType<BarDiagramData>[]) => {
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
				label: localizer(RESOURCE_KEYS.elementForm.chart.data.keyField),
				dataKey: "keyField",
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
				label: localizer(RESOURCE_KEYS.elementForm.chart.data.labelIsNumeration),
				dataKey: "labelIsNumeration",
				horizontalAlignment: "center",
				inputType: "checkbox",
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

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

import type { ChartDimensions, PieChartData, PieChartProperties } from "@com.mgmtp.a12.print/print-model-api/model";
import { PartialPieChart } from "@com.mgmtp.a12.print/print-model-api/model";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { getItemsFromElementMap } from "../../utils/index.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import type { UpdateElementsTransactionLogAction } from "../../redux/index.js";
import { TransactionLogStateActions } from "../../redux/index.js";
import { InteractionLogActions } from "../../redux//interaction-log/index.js";
import { ValidationSelectors } from "../../redux//validation/selectors.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import { ElementMapUtils } from "../../utils/element-map-utils.js";
import { DocumentModelDataSelectors } from "../../redux/document-model-data/selectors.js";

import { DocumentModelSelect } from "./shared-components/DocumentModelSelect.js";
import type { CommonProperties } from "./shared-components/index.js";
import { AllowedElementType, ChartCommonProperties, DataContextSelection } from "./shared-components/index.js";
import { CustomCheckbox, CustomSelect, CustomTextField } from "./custom-base-input-components/index.js";
import type { ElementWithoutIdAndType } from "./type.js";

export const PieChartFormContainer = () => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const element = useSelector(PrintEngineSelectors.currentFormElement);
	const elementReferences = useSelector(PrintEngineSelectors.elementReferences);
	const errorMap = useSelector((state: PrintEngineState) => ValidationSelectors.pieChart(state, element?.id));
	const wrapperDataContext = useSelector(PrintEngineSelectors.wrapperDataContext);

	if (!element || !PartialPieChart.isInstance(element)) {
		throw Error("Expected element of type PieChart");
	}

	const pieChart = element.pieChart;
	const model = element.pieChart?.model;

	const elementMap = useSelector(
		(state: PrintEngineState) => DocumentModelDataSelectors.documentModelData(state, model)?.elementMap
	);

	const onPropertyChange = React.useCallback(
		(newProps: CommonProperties) => {
			const { width, height } = newProps.dimensions || {};
			const updatedElement: PartialPieChart = {
				...element,
				pieChart: {
					id: nanoid(),
					...pieChart,
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
					description: RESOURCE_KEYS.interaction.form.pieChartFormContainer.changeGeneralDiagramProps,
					region: "form",
					transactionLogActions: actions,
				})
			);
		},
		[elementReferences, dispatch, element, pieChart]
	);

	const onChangeDocumentModel = React.useCallback(
		(documentModel?: string) => {
			const updatedElement = {
				...element,
				pieChart: {
					id: nanoid(),
					...pieChart,
					model: documentModel,
					basePath: "",
					data: { id: nanoid(), ...element.pieChart?.data, valueField: "", keyField: "" },
				},
			};
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.pieChartFormContainer.changeDocumentModel,
					region: "form",
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, pieChart]
	);

	const setSelectedPath = React.useCallback(
		(path: string) => {
			if (path === element.pieChart?.basePath) {
				return;
			}

			const updatedElement = {
				...element,
				pieChart: {
					id: nanoid(),
					...pieChart,
					basePath: path,
					data: { id: nanoid(), ...element.pieChart?.data, valueField: "", keyField: "" },
				},
			};
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.pieChartFormContainer.changeBasePath,
					region: "form",
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, pieChart]
	);

	const getPropertyErrorMessage = React.useCallback(
		(property: keyof ElementWithoutIdAndType<PieChartProperties>) => {
			return errorMap ? errorMessageLocalizer(errorMap?.pieChart?.[property]?.[ErrorSeverity.ERROR]) : undefined;
		},
		[errorMap, errorMessageLocalizer]
	);

	const getDimensionsErrorMessage = React.useCallback(
		(property: keyof ChartDimensions) => {
			return errorMap
				? errorMessageLocalizer(errorMap?.pieChart?.dimensions?.[property]?.[ErrorSeverity.ERROR])
				: undefined;
		},
		[errorMap, errorMessageLocalizer]
	);

	const processedElementMap = React.useMemo(() => {
		return ElementMapUtils.createEntriesFromDataContext(Object.values(elementMap || {}), wrapperDataContext);
	}, [elementMap, wrapperDataContext]);

	const group = element.pieChart?.basePath;
	return (
		<>
			<ChartCommonProperties
				element={element}
				properties={{
					title: element.pieChart?.title,
					dimensions: element?.pieChart?.dimensions as ChartDimensions,
				}}
				onPropertyChange={onPropertyChange}
				getBaseErrorMessage={getPropertyErrorMessage}
				getChartDimensionsErrorMessage={getDimensionsErrorMessage}
			/>
			<DocumentModelSelect
				value={model}
				onValueChanged={onChangeDocumentModel}
				errorMessage={getPropertyErrorMessage("model")}
			/>
			<CustomTextField
				label={localizer(RESOURCE_KEYS.elementForm.model.group)}
				value={group}
				readonly
				errorMessage={getPropertyErrorMessage("basePath")}
			/>
			<DataContextSelection
				type={AllowedElementType.anyGroup}
				elementMapEntries={processedElementMap}
				selectedPath={group}
				setSelectedPath={setSelectedPath}
				maxRepeatLevel={0}
			/>
			<PieDiagramAxisProperties element={element} documentModel={model} />
		</>
	);
};

type PieAxisDataKeys = "keyField" | "valueField";

interface PieDiagramAxisPropertiesProps {
	element: PartialPieChart;
	documentModel: string | undefined;
}

const PieDiagramAxisProperties = ({ element, documentModel }: PieDiagramAxisPropertiesProps) => {
	const dispatch = useDispatch();
	const localize = PrintLocalizer.useLocalizer();
	const documentModelData = useSelector((state: PrintEngineState) =>
		DocumentModelDataSelectors.documentModelData(state, documentModel)
	);
	const getErrorMessage = usePieChartDataPropertyErrorMessage(element.id);

	const pieChart = element.pieChart;

	const selectItems = React.useMemo(() => {
		return documentModelData ? getItemsFromElementMap(pieChart?.basePath, documentModelData.elementMap) : [];
	}, [documentModelData, pieChart?.basePath]);

	const onValueChange = React.useCallback(
		(newValue: string, key: PieAxisDataKeys) => {
			const updatedElement = {
				...element,
				pieChart: { id: nanoid(), ...pieChart, data: { id: nanoid(), ...pieChart?.data, [key]: newValue } },
			};
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.pieChartFormContainer.changeAxisProps,
					region: "form",
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, pieChart]
	);

	const onIsNumerationLabelChange = React.useCallback(
		(newValue: boolean) => {
			const updatedElement = {
				...element,
				pieChart: {
					id: nanoid(),
					...pieChart,
					data: { id: nanoid(), ...pieChart?.data, labelIsNumeration: newValue },
				},
			};
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.pieChartFormContainer.toggleUseNumerationAsLabel,
					region: "form",
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, pieChart]
	);

	const isNumerationLabel = Boolean(pieChart?.data?.labelIsNumeration);
	const fieldValue = pieChart?.data?.valueField;
	const labelValue = pieChart?.data?.keyField;
	return (
		<div>
			<CustomSelect
				label={localize(RESOURCE_KEYS.elementForm.chart.data.valueField)}
				onValueChanged={newVal => onValueChange(newVal, "valueField")}
				value={fieldValue}
				items={selectItems}
				errorMessage={getErrorMessage("valueField")}
			/>
			<CustomSelect
				label={localize(RESOURCE_KEYS.elementForm.chart.data.keyField)}
				onValueChanged={newVal => onValueChange(newVal, "keyField")}
				value={labelValue}
				items={selectItems}
				errorMessage={getErrorMessage("keyField")}
			/>
			<CustomCheckbox
				label={localize(RESOURCE_KEYS.elementForm.chart.data.labelIsNumeration)}
				checked={isNumerationLabel}
				onChange={onIsNumerationLabelChange}
				errorMessage={getErrorMessage("labelIsNumeration")}
			/>
		</div>
	);
};

function usePieChartDataPropertyErrorMessage<T extends keyof ElementWithoutIdAndType<PieChartData>>(id = "") {
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.pieChart(state, id));

	return (property: T) =>
		error ? errorMessageLocalizer(error.pieChart?.data?.[property]?.[ErrorSeverity.ERROR]) : undefined;
}

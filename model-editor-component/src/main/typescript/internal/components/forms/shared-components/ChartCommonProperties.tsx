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
import type { FocusEvent } from "react";

import type { SelectItem } from "@com.mgmtp.a12.widgets/widgets-core";
import { TextAffix } from "@com.mgmtp.a12.widgets/widgets-core";
import type {
	BaseChartProperties,
	ChartDimensions,
	InputSource,
	PartialBarChart,
	PartialLineChart,
	PartialPieChart,
	PrintModelEntity,
	RepeatableChartProperties,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { ChartOrientation } from "@com.mgmtp.a12.print/print-model-api/model";
import type { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";
import type { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/utils";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { EditorConst } from "../../../constant/editor.js";
import { changeMmMeasureValue } from "../../../utils/index.js";
import { PositiveNumberInput } from "../../custom-input/PositiveNumberInput.js";
import { changeInputSource, changeInputValue } from "../../../utils/input-source-utils.js";
import { CHARTS_PROPERTY_PATH } from "../../../constant/element-property-path.js";

import { CustomSelect, DynamicSourceTextField } from "../custom-base-input-components/index.js";
import type { ElementWithoutIdAndType } from "../type.js";

const { CM_TO_MM, MM_TO_CM } = EditorConst;

export type CommonProperties = Partial<
	Omit<RepeatableChartProperties, "model" | "basePath" | "title" | "labelX" | "labelY"> & {
		title?: DeepPartialRecursive<InputSource<string>> & PrintModelEntity;
		labelX?: DeepPartialRecursive<InputSource<string>> & PrintModelEntity;
		labelY?: DeepPartialRecursive<InputSource<string>> & PrintModelEntity;
	}
>;

export interface ChartCommonPropertiesProps {
	element: PartialBarChart | PartialLineChart | PartialPieChart;
	properties: CommonProperties;
	onPropertyChange: (value: Partial<CommonProperties>) => void;
	getBaseErrorMessage: (property: keyof ElementWithoutIdAndType<BaseChartProperties>) => React.ReactNode;
	getRepeatableChartErrorMessage?: (
		property: keyof ElementWithoutIdAndType<Partial<CommonProperties>>
	) => React.ReactNode;
	getChartDimensionsErrorMessage?: (property: keyof ElementWithoutIdAndType<ChartDimensions>) => React.ReactNode;
	isRepeatable?: boolean;
}

type PropertyValues = string | undefined | Partial<ChartDimensions> | ChartOrientation;

const DIMENSION_INPUT_PROPS = {
	type: "number",
	min: 0,
	step: 0.1,
};

export const ChartCommonProperties = ({
	element,
	properties,
	onPropertyChange,
	isRepeatable,
	getRepeatableChartErrorMessage,
	getChartDimensionsErrorMessage,
	getBaseErrorMessage,
}: ChartCommonPropertiesProps) => {
	const localizer = PrintLocalizer.useLocalizer();

	const onDimensionsBlur = React.useCallback(
		(type: "height" | "width", inputNumber: string) => {
			onPropertyChange({
				dimensions: {
					...properties.dimensions,
					[type]:
						inputNumber !== ""
							? changeMmMeasureValue(
									Math.floor(CM_TO_MM(Number(inputNumber))),
									properties.dimensions?.[type]
								)
							: undefined,
				} as ChartDimensions,
			});
		},
		[onPropertyChange, properties.dimensions]
	);

	const onBlur = React.useCallback(
		(property: keyof CommonProperties, value: PropertyValues) => {
			onPropertyChange({ [property]: value });
		},
		[onPropertyChange]
	);

	const onSourceChange = React.useCallback(
		(property: "title" | "labelX" | "labelY", source: PossibleInputSource, path: string) => {
			onPropertyChange({ [property]: changeInputSource(source, path, properties[property]) });
		},
		[onPropertyChange, properties]
	);

	const onValueChange = React.useCallback(
		(property: "title" | "labelX" | "labelY", value: string) => {
			const inputSource = properties[property];
			if (inputSource) {
				onPropertyChange({ [property]: changeInputValue(value, inputSource) });
			}
		},
		[onPropertyChange, properties]
	);

	const heightValue = properties.dimensions?.height?.value;
	const heightInCm = React.useMemo(() => (heightValue ? MM_TO_CM(heightValue) : ""), [heightValue]);
	const widthValue = properties.dimensions?.width?.value;
	const widthInCm = React.useMemo(() => (widthValue ? MM_TO_CM(widthValue) : ""), [widthValue]);
	const chartOrientationItems = useChartOrientationItems();

	return (
		<div>
			<DynamicSourceTextField
				sourceProperties={{
					inputSource: properties.title,
					element,
					property: CHARTS_PROPERTY_PATH.title,
					onSourceChange: (source: PossibleInputSource, path: string) =>
						onSourceChange("title", source, path),
				}}
				label={localizer(RESOURCE_KEYS.elementForm.chart.title)}
				value={properties.title?.value}
				onBlur={(e: FocusEvent<HTMLInputElement>) => onValueChange("title", e.target.value)}
				errorMessage={getBaseErrorMessage?.("title")}
			/>
			<PositiveNumberInput
				label={localizer(RESOURCE_KEYS.elementForm.chart.height)}
				value={String(heightInCm)}
				inputProps={DIMENSION_INPUT_PROPS}
				onBlur={(e: FocusEvent<HTMLInputElement>) => onDimensionsBlur("height", e.target.value)}
				suffixes={<TextAffix>cm</TextAffix>}
				errorMessage={getChartDimensionsErrorMessage?.("height")}
			/>
			<PositiveNumberInput
				label={localizer(RESOURCE_KEYS.elementForm.chart.width)}
				value={String(widthInCm)}
				inputProps={DIMENSION_INPUT_PROPS}
				onBlur={(e: FocusEvent<HTMLInputElement>) => onDimensionsBlur("width", e.target.value)}
				suffixes={<TextAffix>cm</TextAffix>}
				errorMessage={getChartDimensionsErrorMessage?.("width")}
			/>
			{isRepeatable && (
				<>
					<DynamicSourceTextField
						sourceProperties={{
							inputSource: properties.labelX,
							element,
							property: CHARTS_PROPERTY_PATH.labelX,
							onSourceChange: (source: PossibleInputSource, path: string) =>
								onSourceChange("labelX", source, path),
						}}
						label={localizer(RESOURCE_KEYS.elementForm.chart.labelX)}
						value={properties.labelX?.value}
						onBlur={(e: FocusEvent<HTMLInputElement>) => onValueChange("labelX", e.target.value)}
						errorMessage={getRepeatableChartErrorMessage?.("labelX")}
					/>
					<DynamicSourceTextField
						sourceProperties={{
							inputSource: properties.labelY,
							element,
							property: CHARTS_PROPERTY_PATH.labelY,
							onSourceChange: (source: PossibleInputSource, path: string) =>
								onSourceChange("labelY", source, path),
						}}
						label={localizer(RESOURCE_KEYS.elementForm.chart.labelY)}
						value={properties.labelY?.value}
						onBlur={(e: FocusEvent<HTMLInputElement>) => onValueChange("labelY", e.target.value)}
						errorMessage={getRepeatableChartErrorMessage?.("labelY")}
					/>
					<CustomSelect
						placeholder={localizer(RESOURCE_KEYS.input.selectPlaceholder)}
						label={localizer(RESOURCE_KEYS.elementForm.chart.orientation.label)}
						onValueChanged={(newValue: ChartOrientation) => onBlur("orientation", newValue)}
						errorMessage={getRepeatableChartErrorMessage?.("orientation")}
						value={properties.orientation}
						items={chartOrientationItems}
					/>
				</>
			)}
		</div>
	);
};

function useChartOrientationItems(): SelectItem[] {
	const localizer = PrintLocalizer.useLocalizer();

	return [
		{
			label: localizer(RESOURCE_KEYS.elementForm.chart.orientation.horizontal),
			value: ChartOrientation.Horizontal,
		},
		{
			label: localizer(RESOURCE_KEYS.elementForm.chart.orientation.vertical),
			value: ChartOrientation.Vertical,
		},
	];
}

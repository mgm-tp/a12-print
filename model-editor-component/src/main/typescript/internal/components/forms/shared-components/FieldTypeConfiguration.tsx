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

import type {
	CalculationProperties,
	DisplayOptions,
	PartialCalculation,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { DisplayType, FieldTypeDefinition } from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import { TextRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { TransactionLogStateActions } from "../../../redux/index.js";
import { InteractionLogActions } from "../../../redux/interaction-log/index.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";
import type { OmitId } from "../../../utils/index.js";
import { ValidationSelectors } from "../../../redux/validation/selectors.js";
import { DocumentModelDataSelectors } from "../../../redux/document-model-data/selectors.js";

import type { ElementWithoutIdAndType } from "../type.js";
import { CustomSelect, DynamicSourceTextField } from "../custom-base-input-components/index.js";

import { DateFormatInput } from "./DateFormatInput.js";
import type { DisplayOptionsKeys, DisplayTypeItems, DisplayTypeItemValue } from "./shared-interfaces.js";

type FieldTypeItemValue = FieldTypeDefinition | "";

type FieldTypeItems = {
	label: string;
	value: FieldTypeItemValue;
}[];

interface FieldTypeConfigurationProps {
	element: PartialCalculation;
	getDisplayOptionsError: (fieldType: keyof ElementWithoutIdAndType<DisplayOptions>) => React.ReactNode;
	documentModel: string | undefined;
}

export const FieldTypeConfiguration = ({
	element,
	documentModel,
	getDisplayOptionsError,
}: FieldTypeConfigurationProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const documentModelData = useSelector((state: PrintEngineState) =>
		DocumentModelDataSelectors.documentModelData(state, documentModel)
	);

	const fieldTypeItems = useFieldTypesItems();
	const formattingItemsMapping = useFormattingItemsMapping();
	const calculation = element.calculation;

	const typeDefinitionItems = React.useMemo(
		() => [
			{ label: "", value: "" },
			...(documentModelData?.typeDefinitions?.map(el => ({ label: el.name, value: el.name })) || []),
		],
		[documentModelData?.typeDefinitions]
	);

	const updateCalculation = React.useCallback(
		(newData: OmitId<DeepPartial<CalculationProperties>>) => {
			const updatedElement: PartialCalculation = {
				...element,
				calculation: { id: nanoid(), ...calculation, ...newData },
			};
			dispatch(
				InteractionLogActions.start({
					description:
						RESOURCE_KEYS.interaction.form.sharedComponent.fieldTypeConfiguration
							.changeFieldTypeConfiguration,
					region: TextRegion.TEXT_FROM_CALCULATION,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[calculation, dispatch, element]
	);

	const onResultFieldBlur = React.useCallback(
		(newValue: string, key: DisplayOptionsKeys) => {
			updateCalculation({
				displayOptions: { id: nanoid(), ...calculation?.displayOptions, [key]: newValue },
			});
		},
		[calculation?.displayOptions, updateCalculation]
	);

	const onFieldTypeChange = React.useCallback(
		(newValue: FieldTypeItemValue) => {
			updateCalculation({
				fieldType: { id: nanoid(), fieldType: newValue || undefined },
				displayOptions: undefined,
			});
		},
		[updateCalculation]
	);

	const onTypeDefinitionChange = React.useCallback(
		(newValue: string) => {
			updateCalculation({
				fieldType: { id: nanoid(), ...calculation?.fieldType, typeDefinition: { id: newValue } },
			});
		},
		[calculation?.fieldType, updateCalculation]
	);

	const onFormattingTypeChange = React.useCallback(
		(newVal: DisplayTypeItemValue) => {
			updateCalculation({
				displayOptions: { id: calculation?.displayOptions?.id || nanoid(), displayType: newVal || undefined },
			});
		},
		[calculation?.displayOptions?.id, updateCalculation]
	);

	const typeDefinitionId = element.calculation?.fieldType?.typeDefinition?.id;
	const fieldTypeItem = element.calculation?.fieldType?.fieldType || "";
	const formattingItems = formattingItemsMapping[fieldTypeItem];
	const formattingType = element.calculation?.displayOptions?.displayType;
	const showDateFormat =
		(fieldTypeItem === FieldTypeDefinition.String || fieldTypeItem === FieldTypeDefinition.TypeDefinition) &&
		formattingType === DisplayType.Date;
	const showDateRangeFormat =
		(fieldTypeItem === FieldTypeDefinition.String || fieldTypeItem === FieldTypeDefinition.TypeDefinition) &&
		formattingType === DisplayType.DateRange;
	const showCheckboxes =
		(fieldTypeItem === FieldTypeDefinition.Boolean || fieldTypeItem === FieldTypeDefinition.TypeDefinition) &&
		formattingType === DisplayType.Checkbox;
	const {
		suffix,
		dateFormat,
		dateRangeFormatStart,
		dateRangeFormatEnd,
		dateRangeDelimiter,
		checkboxChecked,
		checkboxUnchecked,
	} = calculation?.displayOptions || {};
	const typeDefinitionError = useTypeDefinitionError(element.id);

	return (
		<>
			<CustomSelect
				label={localizer(RESOURCE_KEYS.elementForm.field.fieldType)}
				items={fieldTypeItems}
				value={fieldTypeItem}
				onValueChanged={onFieldTypeChange}
				fitToParent={false}
			/>
			{fieldTypeItem === FieldTypeDefinition.TypeDefinition && (
				<CustomSelect
					label={localizer(RESOURCE_KEYS.elementForm.textFlow.computation.typeDefinition)}
					items={typeDefinitionItems}
					value={typeDefinitionId}
					onValueChanged={onTypeDefinitionChange}
					fitToParent={false}
					errorMessage={typeDefinitionError}
				/>
			)}
			{formattingItems.length > 0 && (
				<CustomSelect
					label={localizer(RESOURCE_KEYS.elementForm.textFlow.computation.formattingType)}
					items={formattingItems}
					value={formattingType}
					onValueChanged={onFormattingTypeChange}
					fitToParent={false}
					errorMessage={getDisplayOptionsError("displayType")}
				/>
			)}
			<DynamicSourceTextField
				label={localizer(RESOURCE_KEYS.elementForm.field.suffix)}
				value={suffix}
				onBlur={e => onResultFieldBlur(e.target.value, "suffix")}
				errorMessage={getDisplayOptionsError("suffix")}
			/>
			{showDateFormat && (
				<DateFormatInput
					label={localizer(RESOURCE_KEYS.elementForm.field.dateFormat)}
					value={dateFormat}
					onBlur={e => onResultFieldBlur(e.target.value, "dateFormat")}
					errorMessage={getDisplayOptionsError("dateFormat")}
				/>
			)}
			{showDateRangeFormat && (
				<>
					<DateFormatInput
						label={localizer(RESOURCE_KEYS.elementForm.field.dateRangeFormatStart)}
						value={dateRangeFormatStart}
						onBlur={e => onResultFieldBlur(e.target.value, "dateRangeFormatStart")}
						errorMessage={getDisplayOptionsError("dateRangeFormatStart")}
					/>
					<DynamicSourceTextField
						label={localizer(RESOURCE_KEYS.elementForm.field.dateRangeDelimiter)}
						value={dateRangeDelimiter}
						onBlur={e => onResultFieldBlur(e.target.value, "dateRangeDelimiter")}
						errorMessage={getDisplayOptionsError("dateRangeDelimiter")}
					/>
					<DateFormatInput
						label={localizer(RESOURCE_KEYS.elementForm.field.dateRangeFormatEnd)}
						value={dateRangeFormatEnd}
						onBlur={e => onResultFieldBlur(e.target.value, "dateRangeFormatEnd")}
						errorMessage={getDisplayOptionsError("dateRangeFormatEnd")}
					/>
				</>
			)}
			{showCheckboxes && (
				<>
					<DynamicSourceTextField
						label={localizer(RESOURCE_KEYS.elementForm.field.checkboxChecked)}
						value={checkboxChecked}
						onBlur={e => onResultFieldBlur(e.target.value, "checkboxChecked")}
						errorMessage={getDisplayOptionsError("checkboxChecked")}
					/>
					<DynamicSourceTextField
						label={localizer(RESOURCE_KEYS.elementForm.field.checkboxUnchecked)}
						value={checkboxUnchecked}
						onBlur={e => onResultFieldBlur(e.target.value, "checkboxUnchecked")}
						errorMessage={getDisplayOptionsError("checkboxUnchecked")}
					/>
				</>
			)}
		</>
	);
};

const useFieldTypesItems = (): FieldTypeItems => {
	const localizer = PrintLocalizer.useLocalizer();
	return React.useMemo(
		() => [
			{ label: "", value: "" },
			{
				label: localizer(RESOURCE_KEYS.elementOptions.fieldTypes.string),
				value: FieldTypeDefinition.String,
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.fieldTypes.number),
				value: FieldTypeDefinition.Number,
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.fieldTypes.bool),
				value: FieldTypeDefinition.Boolean,
			},
			{
				label: localizer(RESOURCE_KEYS.elementOptions.fieldTypes.typeDefinition),
				value: FieldTypeDefinition.TypeDefinition,
			},
		],
		[localizer]
	);
};

function useTypeDefinitionError(id: string) {
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.calculation(state, id));

	return error
		? errorMessageLocalizer(error?.calculation?.fieldType?.typeDefinition?.[ErrorSeverity.ERROR])
		: undefined;
}

const useFormattingItemsMapping = (): Record<FieldTypeDefinition | "", DisplayTypeItems> => {
	const localizer = PrintLocalizer.useLocalizer();
	const checkboxLabel = localizer(RESOURCE_KEYS.elementOptions.formattingItems.checkbox);
	const dateLabel = localizer(RESOURCE_KEYS.elementOptions.formattingItems.date);
	const dateRangeLabel = localizer(RESOURCE_KEYS.elementOptions.formattingItems.dateRange);
	const htmlLabel = localizer(RESOURCE_KEYS.elementOptions.formattingItems.html);

	return React.useMemo(
		() => ({
			"": [],
			[FieldTypeDefinition.Number]: [],
			[FieldTypeDefinition.Boolean]: [
				{ label: "", value: "" },
				{ label: checkboxLabel, value: DisplayType.Checkbox },
			],
			[FieldTypeDefinition.String]: [
				{ label: "", value: "" },
				{ label: htmlLabel, value: DisplayType.Html },
				{ label: dateLabel, value: DisplayType.Date },
				{ label: dateRangeLabel, value: DisplayType.DateRange },
			],
			[FieldTypeDefinition.TypeDefinition]: [
				{ label: "", value: "" },
				{ label: htmlLabel, value: DisplayType.Html },
				{ label: dateLabel, value: DisplayType.Date },
				{ label: dateRangeLabel, value: DisplayType.DateRange },
				{ label: checkboxLabel, value: DisplayType.Checkbox },
			],
		}),
		[checkboxLabel, dateLabel, dateRangeLabel, htmlLabel]
	);
};

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
import { nanoid } from "nanoid";
import { FocusEvent } from "react";

import { DisplayOptions, DisplayType } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";

import { CustomSelect } from "../custom-base-input-components/index.js";
import { CustomTextLineStateful } from "../custom-base-input-components/CustomTextLineStateful.js";

import { DisplayOptionsKeys, FieldTypeKeys, DisplayTypeItems, DisplayTypeItemValue } from "./shared-interfaces.js";
import { DateFormatInput } from "./DateFormatInput.js";

export const FIELD_TYPE_KEY: Record<FieldTypeKeys, DisplayOptionsKeys> = {
	CheckboxUnchecked: "checkboxUnchecked",
	Checkbox: "checkboxChecked",
	Date: "dateFormat",
	DateRange: "dateRangeFormatStart",
	DateRangeDelimiter: "dateRangeDelimiter",
	DateRangeFormatStart: "dateRangeFormatStart",
	DateRangeFormatEnd: "dateRangeFormatEnd",
	Html: "suffix",
	"": "suffix",
};

interface FieldFormattingInputFormProps {
	displayOptions: DeepPartial<DisplayOptions> | undefined;
	updateDisplayOptions: (newData: DeepPartial<DisplayOptions>) => void;
	getErrorMessage: (property: keyof DisplayOptions) => React.ReactNode;
}

export const FieldFormattingInputForm = (props: FieldFormattingInputFormProps) => {
	const { displayOptions, updateDisplayOptions, getErrorMessage } = props;
	const localizer = PrintLocalizer.useLocalizer();
	const displayTypeItems = useDisplayTypeItems();

	const onDisplayTypeAttributeBlur = React.useCallback(
		(newVal: string, selected: FieldTypeKeys) => {
			const changeKey = FIELD_TYPE_KEY[selected];
			updateDisplayOptions({ id: nanoid(), ...displayOptions, [changeKey]: newVal });
		},
		[displayOptions, updateDisplayOptions]
	);

	const onDisplayTypeChange = React.useCallback(
		(newDisplayType: DisplayTypeItemValue) => {
			const newOptions = { id: displayOptions?.id || nanoid(), displayType: newDisplayType || undefined };
			updateDisplayOptions(newOptions);
		},
		[displayOptions?.id, updateDisplayOptions]
	);

	const selectedDisplayType = displayOptions?.displayType || "";
	const FieldAttributeForm = FieldAttributeFormProvider[selectedDisplayType];
	return (
		<>
			<CustomSelect
				label={localizer(RESOURCE_KEYS.elementForm.field.fieldType)}
				items={displayTypeItems}
				value={selectedDisplayType}
				onValueChanged={onDisplayTypeChange}
				fitToParent={false}
				errorMessage={getErrorMessage("displayType")}
			/>
			<FieldAttributeForm
				displayOptions={displayOptions}
				onBlur={onDisplayTypeAttributeBlur}
				getErrorMessage={getErrorMessage}
			/>
		</>
	);
};

export const useDisplayTypeItems = (): DisplayTypeItems => {
	const localizer = PrintLocalizer.useLocalizer();

	return React.useMemo(
		() => [
			{ label: "", value: "" },
			{ label: localizer(RESOURCE_KEYS.elementOptions.formattingItems.html), value: DisplayType.Html },
			{ label: localizer(RESOURCE_KEYS.elementOptions.formattingItems.date), value: DisplayType.Date },
			{ label: localizer(RESOURCE_KEYS.elementOptions.formattingItems.dateRange), value: DisplayType.DateRange },
			{
				label: localizer(RESOURCE_KEYS.elementOptions.formattingItems.checkbox),
				value: DisplayType.Checkbox,
			},
		],
		[localizer]
	);
};

interface FieldAttributeFormProps {
	onBlur: (newVal: string, selected: FieldTypeKeys) => void;
	getErrorMessage: (property: keyof DisplayOptions) => React.ReactNode;
	displayOptions?: DeepPartial<DisplayOptions>;
}

const CheckBoxInput = ({ displayOptions, getErrorMessage, onBlur }: FieldAttributeFormProps) => {
	const localizer = PrintLocalizer.useLocalizer();

	return (
		<>
			<CustomTextLineStateful
				label={localizer(RESOURCE_KEYS.elementForm.field.checkboxChecked)}
				value={displayOptions?.checkboxChecked}
				onBlur={(e: FocusEvent<HTMLInputElement>) => onBlur(e.target.value, DisplayType.Checkbox)}
				errorMessage={getErrorMessage("checkboxChecked")}
			/>
			<CustomTextLineStateful
				label={localizer(RESOURCE_KEYS.elementForm.field.checkboxUnchecked)}
				value={displayOptions?.checkboxUnchecked}
				onBlur={(e: FocusEvent<HTMLInputElement>) => onBlur(e.target.value, "CheckboxUnchecked")}
				errorMessage={getErrorMessage("checkboxUnchecked")}
			/>
		</>
	);
};

const DateInput = ({ displayOptions, getErrorMessage, onBlur }: FieldAttributeFormProps) => {
	const localizer = PrintLocalizer.useLocalizer();

	return (
		<DateFormatInput
			label={localizer(RESOURCE_KEYS.elementForm.field.dateFormat)}
			value={displayOptions?.dateFormat}
			onBlur={e => onBlur(e.target.value, DisplayType.Date)}
			errorMessage={getErrorMessage("dateFormat")}
		/>
	);
};

const DateRangeInput = ({ displayOptions, getErrorMessage, onBlur }: FieldAttributeFormProps) => {
	const localizer = PrintLocalizer.useLocalizer();

	return (
		<>
			<DateFormatInput
				label={localizer(RESOURCE_KEYS.elementForm.field.dateRangeFormatStart)}
				value={displayOptions?.dateRangeFormatStart}
				onBlur={(e: FocusEvent<HTMLInputElement>) => onBlur(e.target.value, "DateRangeFormatStart")}
				errorMessage={getErrorMessage("dateRangeFormatStart")}
			/>
			<CustomTextLineStateful
				label={localizer(RESOURCE_KEYS.elementForm.field.dateRangeDelimiter)}
				value={displayOptions?.dateRangeDelimiter}
				onBlur={(e: FocusEvent<HTMLInputElement>) => onBlur(e.target.value, "DateRangeDelimiter")}
				errorMessage={getErrorMessage("dateRangeDelimiter")}
			/>
			<DateFormatInput
				label={localizer(RESOURCE_KEYS.elementForm.field.dateRangeFormatEnd)}
				value={displayOptions?.dateRangeFormatEnd}
				onBlur={(e: FocusEvent<HTMLInputElement>) => onBlur(e.target.value, "DateRangeFormatEnd")}
				errorMessage={getErrorMessage("dateRangeFormatEnd")}
			/>
		</>
	);
};

const DefaultInput = ({ displayOptions, getErrorMessage, onBlur }: FieldAttributeFormProps) => {
	const localizer = PrintLocalizer.useLocalizer();

	return (
		<CustomTextLineStateful
			label={localizer(RESOURCE_KEYS.elementForm.field.suffix)}
			value={displayOptions?.suffix}
			onBlur={(e: FocusEvent<HTMLInputElement>) => onBlur(e.target.value, DisplayType.Html)}
			errorMessage={getErrorMessage("suffix")}
		/>
	);
};

const FieldAttributeFormProvider: Record<DisplayTypeItemValue, React.ComponentType<FieldAttributeFormProps>> = {
	[DisplayType.Checkbox]: CheckBoxInput,
	[DisplayType.Date]: DateInput,
	[DisplayType.DateRange]: DateRangeInput,
	[DisplayType.Html]: DefaultInput,
	"": DefaultInput,
};

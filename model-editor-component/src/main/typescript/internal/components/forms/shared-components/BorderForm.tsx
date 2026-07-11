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

import { TextAffix } from "@com.mgmtp.a12.widgets/widgets-core";
import type {
	BorderProperties,
	InputSource,
	PartialAnyPrintModelElement,
	PartialBorderProperties,
	PrintModelEntity,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { BorderStyle } from "@com.mgmtp.a12.print/print-model-api/model";
import type { InheritedValueResolver } from "@com.mgmtp.a12.print/print-model-api/input-source";
import { InputValueSourceResolver, PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";
import type { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/utils";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import type { OmitId } from "../../../utils/index.js";
import { changeInputSource, changeInputValue } from "../../../utils/input-source-utils.js";
import type { BorderPropertiesPath } from "../../../types/input-source.js";
import { formatLeadingDecimal } from "../../custom-input/PositiveNumberInput.js";

import { SourceColorPicker, SourceInput, SourceSelect } from "../custom-base-input-components/index.js";

export interface InheritedBorderResolver {
	resolveWidth?: InheritedValueResolver<string | number>;
	resolveStyle?: InheritedValueResolver<string>;
	resolveColor?: InheritedValueResolver<string>;
}

export interface BorderFormProps extends InheritedBorderResolver {
	element: PartialAnyPrintModelElement;
	setBorderProperties: (newProperties: OmitId<PartialBorderProperties>) => void;
	getErrorMessage?: (property: keyof OmitId<BorderProperties>) => React.ReactNode;
	borderProperties?: PartialBorderProperties;
	determineInheritedSource?: (element: PrintModelEntity, inheritedCondition: string) => boolean;
	propertiesPath: BorderPropertiesPath;
}

export const BorderForm = ({
	element,
	borderProperties,
	setBorderProperties,
	getErrorMessage = () => undefined,
	determineInheritedSource,
	propertiesPath,
	resolveWidth,
	resolveStyle,
	resolveColor,
}: BorderFormProps) => {
	const localizer = PrintLocalizer.useLocalizer();

	const BORDER_STYLE_ITEMS = React.useMemo(
		(): { label: string; value: BorderStyle | "" }[] => [
			{ label: localizer(RESOURCE_KEYS.elementOptions.borderStyles.solid), value: BorderStyle.Solid },
			{ label: localizer(RESOURCE_KEYS.elementOptions.borderStyles.dotted), value: BorderStyle.Dotted },
			{ label: localizer(RESOURCE_KEYS.elementOptions.borderStyles.dashed), value: BorderStyle.Dashed },
		],
		[localizer]
	);

	const updateBorderProperty = React.useCallback(
		<T extends string | number | BorderStyle>(
			value: (DeepPartialRecursive<InputSource<T>> & PrintModelEntity) | undefined | string,
			property: keyof PartialBorderProperties
		) => {
			setBorderProperties({ ...borderProperties, [property]: value });
		},
		[borderProperties, setBorderProperties]
	);

	const formatOnChange = React.useCallback((newValue: string) => {
		return Number.isNaN(Number(newValue)) ? "" : formatLeadingDecimal(newValue);
	}, []);

	const isStyleUnset = borderProperties?.borderStyle?.source === PossibleInputSource.UNSET;

	const onBorderStyleSourceChange = React.useCallback(
		(source: PossibleInputSource, path: string) => {
			if (source === PossibleInputSource.UNSET) {
				const borderColorPath = InputValueSourceResolver.getInputSourceMetadata(
					element,
					propertiesPath.borderColor
				).path;
				const borderWidthPath = InputValueSourceResolver.getInputSourceMetadata(
					element,
					propertiesPath.borderWidth
				).path;
				setBorderProperties({
					...borderProperties,
					borderStyle: changeInputSource(source, path, borderProperties?.borderStyle),
					borderColor: changeInputSource(
						PossibleInputSource.DEFAULT,
						borderColorPath,
						borderProperties?.borderColor
					),
					borderWidth: changeInputSource(
						PossibleInputSource.DEFAULT,
						borderWidthPath,
						borderProperties?.borderWidth
					),
				});
			} else {
				updateBorderProperty(changeInputSource(source, path, borderProperties?.borderStyle), "borderStyle");
			}
		},
		[borderProperties, element, propertiesPath, setBorderProperties, updateBorderProperty]
	);

	return (
		<div>
			<SourceSelect
				id="borderStyle"
				label={localizer(RESOURCE_KEYS.elementForm.borderProperties.borderStyle)}
				onValueChanged={value =>
					updateBorderProperty(changeInputValue(value, borderProperties!.borderStyle!), "borderStyle")
				}
				value={borderProperties?.borderStyle?.value || ""}
				items={BORDER_STYLE_ITEMS}
				errorMessage={getErrorMessage("borderStyle")}
				inputProps={{ "data-testid": "border-style-select" } as React.HTMLProps<HTMLSelectElement>}
				sourceProperties={{
					element,
					determineInheritedSource,
					property: propertiesPath.borderStyle,
					onSourceChange: onBorderStyleSourceChange,
					inputSource: borderProperties?.borderStyle,
					inheritedValueResolver: resolveStyle,
				}}
			/>
			<SourceInput
				label={localizer(RESOURCE_KEYS.elementForm.borderProperties.borderWidth)}
				inputProps={
					{
						type: "number",
						min: 0,
						step: 0.5,
						"data-testid": "border-width-input",
					} as React.HTMLProps<HTMLInputElement>
				}
				disabled={isStyleUnset}
				value={String(borderProperties?.borderWidth?.value) || undefined}
				suffixes={<TextAffix>pt</TextAffix>}
				errorMessage={getErrorMessage("borderWidth")}
				formatOnChange={formatOnChange}
				onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
					updateBorderProperty(
						changeInputValue(Number(ev.target.value), borderProperties!.borderWidth!),
						"borderWidth"
					);
				}}
				sourceProperties={{
					element,
					determineInheritedSource,
					property: propertiesPath.borderWidth,
					inputSource: borderProperties?.borderWidth,
					onSourceChange: (source: PossibleInputSource, path: string) => {
						updateBorderProperty(
							changeInputSource(source, path, borderProperties?.borderWidth),
							"borderWidth"
						);
					},
					inheritedValueResolver: resolveWidth,
				}}
			/>
			<SourceColorPicker
				id="color"
				label={localizer(RESOURCE_KEYS.elementForm.borderProperties.borderColor)}
				inputProps={{ type: "color" }}
				disabled={isStyleUnset}
				value={borderProperties?.borderColor?.value}
				sourceProperties={{
					element,
					determineInheritedSource,
					property: propertiesPath.borderColor,
					onSourceChange: (source: PossibleInputSource, path: string) => {
						updateBorderProperty(
							changeInputSource(source, path, borderProperties?.borderColor),
							"borderColor"
						);
					},
					inputSource: borderProperties?.borderColor,
					inheritedValueResolver: resolveColor,
				}}
				onColorChange={value =>
					updateBorderProperty(changeInputValue(value, borderProperties!.borderColor!), "borderColor")
				}
				errorMessage={getErrorMessage("borderColor")}
			/>
		</div>
	);
};

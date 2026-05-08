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
import { useMemo } from "react";

import {
	Alignment,
	InputSource,
	PartialAnyPrintModelElement,
	PrintModelEntity,
	PartialTextProperties,
	PartialTextStyle,
	TextStyle,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";
import { DeepPartialErrorMap, ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";
import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/index.js";
import { addPrefix } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/index.js";
import {
	InputValueSourceResolver,
	PossibleInputSource,
} from "@com.mgmtp.a12.print/print-model-api/lib/input-source/index.js";
import { SelectItem } from "@com.mgmtp.a12.widgets/widgets-core";
import { TEXT_STYLE } from "@com.mgmtp.a12.print/print-model-api/lib/model/constant.js";
import type { PrintFontMap } from "@com.mgmtp.a12.print/print-fonts/lib/internal/types/font.js";
import { getPrefixedFontFamily } from "@com.mgmtp.a12.print/print-fonts/lib/internal/api/utils/font-utils.js";

import { OmitId } from "../../../utils/type-utils.js";
import { changeInputSource, changeInputValue } from "../../../utils/input-source-utils.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { TextPropertiesPath } from "../../../types/input-source.js";
import { TEXT_PROPERTIES_PATH } from "../../../constant/element-property-path.js";
import { NO_TEXT_STYLE_FALLBACK } from "../../../constant/textstyle.js";

import {
	SourceColorPicker,
	SourceCheckbox,
	SourceSelect,
	StyleCheckboxGroup,
} from "../custom-base-input-components/index.js";

import { StyledTextStyleItem } from "./TextPropertiesInput.styled.js";

export interface TextPropertiesProps {
	showColor?: boolean;
	showBackgroundColor?: boolean;
	showBold?: boolean;
	showItalic?: boolean;
	showUnderline?: boolean;
}

export interface TextPropertiesInputProps extends TextPropertiesProps {
	element: PartialAnyPrintModelElement;
	setTextProperties: (newProps: OmitId<PartialTextProperties>) => void;
	textProperties?: PartialTextProperties;
	textPropertyErrors?: DeepPartialErrorMap<PartialTextProperties>;
	propertiesPath: TextPropertiesPath;
	determineInheritedSource?: (element: PrintModelEntity, inheritedCondition: string) => boolean;
}

export const TextPropertiesInput = (props: TextPropertiesInputProps) => {
	const {
		showColor = true,
		showBackgroundColor = true,
		showBold = true,
		showItalic = true,
		showUnderline = true,
		element,
		textProperties,
		setTextProperties,
		textPropertyErrors,
		propertiesPath,
		determineInheritedSource = () => false,
	} = props;
	const localizer = PrintLocalizer.useLocalizer();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();

	const textStyles = useSelector(PrintEngineSelectors.textStyles);
	const defaultTextStyle = useSelector(PrintEngineSelectors.defaultTextStyle);
	const fonts = useSelector(PrintEngineSelectors.fonts);

	const textStyleId = InputValueSourceResolver.getSourceStringValue(
		textProperties?.textStyleId,
		element,
		TEXT_PROPERTIES_PATH.textStyleId
	);

	const selectedSemantic = useMemo(
		() => textStyles.find(textStyle => textStyle.id === textStyleId)?.semantic || defaultTextStyle.semantic,
		[defaultTextStyle.semantic, textStyleId, textStyles]
	);

	const alignmentItems = useAlignmentItems();
	const boldLabel = localizer(RESOURCE_KEYS.elementForm.textProperties.bold);
	const italicLabel = localizer(RESOURCE_KEYS.elementForm.textProperties.italic);
	const underlineLabel = localizer(RESOURCE_KEYS.elementForm.textProperties.underline);
	const colorLabel = localizer(RESOURCE_KEYS.elementForm.textProperties.color);
	const backgroundColorLabel = localizer(RESOURCE_KEYS.elementForm.textProperties.backgroundColor);
	const semanticButtonLabel = localizer(RESOURCE_KEYS.textStyles.semantic[selectedSemantic]);

	const getErrorMessage = (property: keyof PartialTextProperties) => {
		return textPropertyErrors
			? errorMessageLocalizer(textPropertyErrors?.[property]?.[ErrorSeverity.ERROR])
			: undefined;
	};

	const getWarningsMessage = (property: keyof PartialTextProperties) => {
		return textPropertyErrors
			? errorMessageLocalizer(textPropertyErrors?.[property]?.[ErrorSeverity.WARNING])
			: undefined;
	};

	const updateTexProperty = <T extends string | boolean | Alignment>(
		value: (DeepPartialRecursive<InputSource<T>> & PrintModelEntity) | undefined | string,
		property: keyof PartialTextProperties
	) => {
		setTextProperties({ ...textProperties, [property]: value });
	};

	const hasCheckBox = showBold || showItalic || showUnderline;

	const textPropertiesTextStyleId = textProperties?.textStyleId;
	const isFallbackTextStyleExisted = useMemo(() => {
		const textStyleId = InputValueSourceResolver.getSourceStringValue(
			textPropertiesTextStyleId,
			element,
			TEXT_PROPERTIES_PATH.textStyleId
		);

		return textStyleId === TEXT_STYLE.NO_TEXT_STYLE_FALLBACK_ID;
	}, [textPropertiesTextStyleId, element]);

	const { textStyleItems, tooltips: textStyleTooltip } = useMemo(() => {
		return {
			textStyleItems:
				textPropertiesTextStyleId?.source === PossibleInputSource.DEFAULT
					? generateTextStyleItems([defaultTextStyle], defaultTextStyle, fonts)
					: generateTextStyleItems(textStyles, defaultTextStyle, fonts, isFallbackTextStyleExisted),
			tooltips:
				textPropertiesTextStyleId?.source === PossibleInputSource.DEFAULT ||
				(textPropertiesTextStyleId?.source === PossibleInputSource.INPUT &&
					textPropertiesTextStyleId?.value) ? (
					<Button key="semantic-tooltip" disabled title={semanticButtonLabel} label={selectedSemantic} />
				) : null,
		};
	}, [
		isFallbackTextStyleExisted,
		textPropertiesTextStyleId,
		defaultTextStyle,
		textStyles,
		fonts,
		semanticButtonLabel,
		selectedSemantic,
	]);

	return (
		<div>
			<SourceSelect
				id="textStyleId"
				label={localizer(RESOURCE_KEYS.textStyles.label)}
				value={textProperties?.textStyleId?.value}
				items={textStyleItems}
				sourceProperties={{
					element,
					determineInheritedSource,
					property: propertiesPath.textStyleId,
					onSourceChange: (source, path) => {
						updateTexProperty(changeInputSource(source, path, textPropertiesTextStyleId), "textStyleId");
					},
					inputSource: textPropertiesTextStyleId,
				}}
				onValueChanged={value =>
					updateTexProperty(changeInputValue(value, textPropertiesTextStyleId!), "textStyleId")
				}
				errorMessage={getErrorMessage("textStyleId")}
				warningMessage={getWarningsMessage("textStyleId")}
				tooltips={textStyleTooltip}
			/>
			{hasCheckBox && (
				<StyleCheckboxGroup className={addPrefix("-u-margin-t-xs")}>
					{showBold && propertiesPath.bold && (
						<SourceCheckbox
							label={boldLabel}
							title={boldLabel}
							sourceProperties={{
								element,
								determineInheritedSource,
								property: propertiesPath.bold,
								inputSource: textProperties?.bold,
								onSourceChange: (source: PossibleInputSource, path: string) =>
									updateTexProperty(changeInputSource(source, path, textProperties?.bold), "bold"),
							}}
							checked={textProperties?.bold?.value}
							onChange={checked =>
								updateTexProperty(changeInputValue(checked, textProperties!.bold!), "bold")
							}
							errorMessage={getErrorMessage("bold")}
						/>
					)}
					{showItalic && propertiesPath.italic && (
						<SourceCheckbox
							label={italicLabel}
							title={italicLabel}
							sourceProperties={{
								element,
								determineInheritedSource,
								property: propertiesPath.italic,
								inputSource: textProperties?.italic,
								onSourceChange: (source: PossibleInputSource, path: string) =>
									updateTexProperty(
										changeInputSource(source, path, textProperties?.italic),
										"italic"
									),
							}}
							checked={textProperties?.italic?.value}
							onChange={checked =>
								updateTexProperty(changeInputValue(checked, textProperties!.italic!), "italic")
							}
							errorMessage={getErrorMessage("italic")}
						/>
					)}

					{showUnderline && propertiesPath.underlined && (
						<SourceCheckbox
							label={underlineLabel}
							title={underlineLabel}
							sourceProperties={{
								element,
								determineInheritedSource,
								property: propertiesPath.underlined,
								inputSource: textProperties?.underlined,
								onSourceChange: (source: PossibleInputSource, path: string) =>
									updateTexProperty(
										changeInputSource(source, path, textProperties?.underlined),
										"underlined"
									),
							}}
							checked={textProperties?.underlined?.value}
							onChange={checked =>
								updateTexProperty(changeInputValue(checked, textProperties!.underlined!), "underlined")
							}
							errorMessage={getErrorMessage("underlined")}
						/>
					)}
				</StyleCheckboxGroup>
			)}
			{showColor && propertiesPath.color && (
				<SourceColorPicker
					id="color"
					label={colorLabel}
					value={textProperties?.color?.value}
					sourceProperties={{
						element,
						determineInheritedSource,
						property: propertiesPath.color,
						onSourceChange: (source: PossibleInputSource, path: string) => {
							updateTexProperty(changeInputSource(source, path, textProperties?.color), "color");
						},
						inputSource: textProperties?.color,
					}}
					onColorChange={value => updateTexProperty(changeInputValue(value, textProperties!.color!), "color")}
					errorMessage={getErrorMessage("color")}
				/>
			)}
			{showBackgroundColor && propertiesPath.backgroundColor && (
				<SourceColorPicker
					id="backgroundColor"
					label={backgroundColorLabel}
					value={textProperties?.backgroundColor?.value}
					sourceProperties={{
						element,
						determineInheritedSource,
						property: propertiesPath.backgroundColor,
						onSourceChange: (source: PossibleInputSource, path: string) => {
							updateTexProperty(
								changeInputSource(source, path, textProperties?.backgroundColor),
								"backgroundColor"
							);
						},
						inputSource: textProperties?.backgroundColor,
					}}
					onColorChange={value =>
						updateTexProperty(changeInputValue(value, textProperties!.backgroundColor!), "backgroundColor")
					}
					errorMessage={getErrorMessage("backgroundColor")}
				/>
			)}
			{propertiesPath.alignment && (
				<SourceSelect
					id="alignment"
					label={localizer(RESOURCE_KEYS.elementForm.textProperties.alignment)}
					value={textProperties?.alignment?.value}
					items={alignmentItems}
					sourceProperties={{
						element,
						determineInheritedSource,
						property: propertiesPath.alignment,
						onSourceChange: (source: PossibleInputSource, path: string) => {
							updateTexProperty(changeInputSource(source, path, textProperties?.alignment), "alignment");
						},
						inputSource: textProperties?.alignment,
					}}
					onValueChanged={(value: Alignment) =>
						updateTexProperty(changeInputValue(value, textProperties!.alignment!), "alignment")
					}
					errorMessage={getErrorMessage("alignment")}
					readonly={true}
				/>
			)}
		</div>
	);
};

function generateTextStyleItems(
	textStyles: PartialTextStyle[],
	defaultTextStyle: TextStyle,
	fonts: PrintFontMap,
	isFallbackTextStyleExisted: boolean = false
): SelectItem[] {
	const items = [...textStyles].map(({ name, id, font }) => ({
		label: "",
		value: String(id),
		graphic: (
			<StyledTextStyleItem fontFamily={getPrefixedFontFamily(fonts, font)} fontSize={defaultTextStyle.fontSize}>
				{name}
			</StyledTextStyleItem>
		),
	}));

	if (isFallbackTextStyleExisted) {
		items.push({
			label: "",
			value: NO_TEXT_STYLE_FALLBACK.id,
			graphic: (
				<StyledTextStyleItem
					fontFamily={getPrefixedFontFamily(fonts, NO_TEXT_STYLE_FALLBACK.font)}
					fontSize={NO_TEXT_STYLE_FALLBACK.fontSize}
				>
					{NO_TEXT_STYLE_FALLBACK.name}
				</StyledTextStyleItem>
			),
		});
	}

	return items;
}

const useAlignmentItems = () => {
	const localizer = PrintLocalizer.useLocalizer();

	return React.useMemo(
		(): { label: string; value: Alignment }[] => [
			{ label: localizer(RESOURCE_KEYS.elementOptions.alignment.left), value: Alignment.Left },
			{ label: localizer(RESOURCE_KEYS.elementOptions.alignment.center), value: Alignment.Center },
			{ label: localizer(RESOURCE_KEYS.elementOptions.alignment.right), value: Alignment.Right },
			{ label: localizer(RESOURCE_KEYS.elementOptions.alignment.justify), value: Alignment.Justify },
		],
		[localizer]
	);
};

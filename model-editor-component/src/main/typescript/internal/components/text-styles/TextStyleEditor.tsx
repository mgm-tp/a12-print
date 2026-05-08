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

import { LayoutGrid } from "@com.mgmtp.a12.widgets/widgets-core/lib/layout/layout-grid/index.js";
import { SizeDetectorProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/layout/size-detector/index.js";
import { SidebarRegion } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import { PartialTextStyle, TextStyle } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";
import { Typography } from "@com.mgmtp.a12.widgets/widgets-core/lib/typography/index.js";
import { HintTooltip } from "@com.mgmtp.a12.widgets/widgets-core";
import { addPrefix } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/index.js";

import { InteractionLogActions, TransactionLogStateActions } from "../../redux/index.js";
import { PrintEngineState } from "../../store/root-reducer.js";
import { ValidationSelectors } from "../../redux/validation/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { OmitId } from "../../utils/index.js";
import { DEFAULT_TEXT_STYLE_ID } from "../../constant/textstyle.js";

import { HiddenHeightComponentContext } from "../hidden-height-context-wrapper/index.js";

import { FontSizeLineHeightGroup, StyledTextRow, StyledTextStyleEditorGrid } from "./TextStyleEditor.styled.js";
import {
	FontSelect,
	FontSizeInput,
	LineHeightInput,
	NameInput,
	SemanticSelect,
	TypesettingModelSelect,
} from "./properties/index.js";
import { HyphenatorSelect } from "./properties/HyphenatorSelect.js";

const { Row, Column } = LayoutGrid;
const breakpoints: SizeDetectorProps.BreakPoint[] = [
	{
		width: 250,
		size: "xs",
	},
	{
		width: 350,
		size: "sm",
	},
	{
		width: 450,
		size: "md",
	},
	{
		width: Number.POSITIVE_INFINITY,
		size: "lg",
	},
];

interface TextStyleEditorProps {
	textStyle: PartialTextStyle;
}

export const TextStyleEditor = ({ textStyle }: TextStyleEditorProps) => {
	const { name, semantic, font, fontSize, lineHeight, id, typesettingModelName, staticHyphenator } = textStyle;
	const getErrorMessage = useTextStylePropertyErrorMessage(textStyle);
	const isDefaultTextStyle = id === DEFAULT_TEXT_STYLE_ID;
	const localizer = PrintLocalizer.useLocalizer();

	return (
		<StyledTextStyleEditorGrid breakpoints={breakpoints}>
			<Row>
				<Column size={{ lg: 12 }}>
					<Typography.Headline level={3} ariaLevel={3}>
						{localizer(RESOURCE_KEYS.textStyles.headline.textStyleSetting)}
					</Typography.Headline>
				</Column>
			</Row>
			<Row>
				<Column size={{ lg: 8 }}>
					<NameInput
						name={name}
						onBlur={useTextStylePropertyChange(textStyle, "name")}
						isDefaultTextStyle={isDefaultTextStyle}
						key={`name-${id}`}
						errorMessage={getErrorMessage("name")}
					/>
				</Column>
				<Column size={{ lg: 4 }}>
					<SemanticSelect
						semantic={semantic}
						onValueChanged={useTextStylePropertyChange(textStyle, "semantic")}
						isDefaultTextStyle={isDefaultTextStyle}
						key={`semantic-${id}`}
						errorMessage={getErrorMessage("semantic")}
					/>
				</Column>
			</Row>
			<Row>
				<Column size={{ lg: 12 }}>
					<Typography.Headline level={3} ariaLevel={3}>
						{localizer(RESOURCE_KEYS.textStyles.headline.typographySetting)}
					</Typography.Headline>
				</Column>
			</Row>
			<Row>
				<Column size={{ lg: 8 }}>
					<TypesettingModelSelect
						value={typesettingModelName}
						onChange={useTextStylePropertyChange(textStyle, "typesettingModelName")}
						isDefaultTextStyle={isDefaultTextStyle}
						errorMessage={getErrorMessage("typesettingModelName")}
					/>
				</Column>
				<Column size={{ lg: 4 }}>
					<HyphenatorSelect
						value={staticHyphenator}
						isDefaultTextStyle={isDefaultTextStyle}
						onValueChanged={useTextStylePropertyChange(textStyle, "staticHyphenator")}
						errorMessage={getErrorMessage("staticHyphenator")}
					/>
				</Column>
			</Row>
			<Row>
				<Column size={{ lg: 8 }}>
					<FontSelect
						selectedFontName={font}
						onValueChanged={useTextStylePropertyChange(textStyle, "font")}
						isDefaultTextStyle={isDefaultTextStyle}
						key={`font-${id}`}
						errorMessage={getErrorMessage("font")}
					/>
				</Column>
				<Column size={{ lg: 4 }} className={addPrefix("-u-flex", "-u-items-end", "-u-justify-end")}>
					<StyledTextRow>
						<FontSizeLineHeightGroup>
							<FontSizeInput
								fontSize={fontSize}
								onBlur={useTextStylePropertyChange(textStyle, "fontSize")}
								isDefaultTextStyle={isDefaultTextStyle}
								key={`fontSize-${id}`}
								errorMessage={getErrorMessage("fontSize")}
							/>
							<LineHeightInput
								lineHeight={lineHeight}
								onBlur={useTextStylePropertyChange(textStyle, "lineHeight")}
								isDefaultTextStyle={isDefaultTextStyle}
								key={`lineHeight-${id}`}
								errorMessage={getErrorMessage("lineHeight")}
							/>
						</FontSizeLineHeightGroup>
						<HintTooltip
							text={localizer(RESOURCE_KEYS.textStyles.tooltips.fontSizeLineHeightNote)}
							key="hint"
						/>
					</StyledTextRow>
				</Column>
			</Row>
		</StyledTextStyleEditorGrid>
	);
};

function useTextStylePropertyErrorMessage<T extends keyof OmitId<TextStyle>>(textStyle: PartialTextStyle) {
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.textStyle(state, textStyle?.id));

	return (property: T) => {
		if (!error) {
			return;
		}
		return errorMessageLocalizer(error[property]?.[ErrorSeverity.ERROR]);
	};
}

function useTextStylePropertyChange<T extends keyof OmitId<TextStyle>>(textStyle: PartialTextStyle, property: T) {
	const dispatch = useDispatch();
	const { calculateNewHeightsTextStyle } = React.useContext(HiddenHeightComponentContext);

	return React.useCallback(
		(val?: TextStyle[T]) => {
			if (textStyle[property] === val) {
				return;
			}
			const newTextStyle = { ...textStyle, [property]: val };
			if (property === "font" || property === "fontSize" || property === "lineHeight") {
				calculateNewHeightsTextStyle(newTextStyle);
			}
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.textStyle.textStyleEditor.changeTextStyleProperties,
					region: SidebarRegion.TEXT_STYLES,
					transactionLogActions: [
						TransactionLogStateActions.updateTextStyle({
							data: newTextStyle,
						}),
					],
				})
			);
		},
		[calculateNewHeightsTextStyle, dispatch, property, textStyle]
	);
}

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
import { css, CSSObject } from "styled-components";
import { CSSProperties } from "react";

import {
	Alignment,
	BorderProperties,
	PartialAnyPrintModelElement,
	TextStyle,
	PartialTextProperties,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import type { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";
import { Orientation } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/index.js";
import { InputValueSourceResolver } from "@com.mgmtp.a12.print/print-model-api/lib/input-source/index.js";
import { PrintFontMap } from "@com.mgmtp.a12.print/print-fonts/lib/internal/types/font.js";
import { getPrefixedFontFamily } from "@com.mgmtp.a12.print/print-fonts/lib/internal/api/utils/font-utils.js";

import { TextPropertiesPath } from "../types/input-source.js";
import type { StylableText } from "../types/styles.js";

type CssPropertySuffix = "px" | "pt" | "mm" | "%";

type CssPropertyValue = "bold" | "italic" | "underline" | "normal" | "none";

export namespace CssUtils {
	export type StyleProperties = {
		textStyle?: DeepPartialRecursive<TextStyle>;
		textProperties?: StylableText;
		borderProperties?: DeepPartialRecursive<BorderProperties>;
	};

	export function getCssStyles(properties: StyleProperties, fonts: PrintFontMap, additionalProperties?: CSSObject) {
		const { textStyle, textProperties, borderProperties } = properties;
		const additionalPropString = Object.entries(additionalProperties || {})
			.filter(entry => entry[1])
			.map(entry => `${entry[0]}: ${entry[1]};`)
			.join("\n");

		return css`
			${additionalPropString}
			font-family: ${getPrefixedFontFamily(fonts, textStyle?.font)};
			font-size: ${optionalValueToString(textStyle?.fontSize, "pt")};
			line-height: ${optionalValueToString(textStyle?.lineHeight, "pt")};
			font-weight: ${optionalBooleanToString(textProperties?.bold, "bold")};
			font-style: ${optionalBooleanToString(textProperties?.italic, "italic")};
			text-decoration: ${optionalBooleanToString(textProperties?.underlined, "underline")};
			text-align: ${getTextAlignment(textProperties?.alignment)};
			border-style: ${borderProperties?.borderStyle};
			border-color: ${borderProperties?.borderColor};
			border-width: ${optionalValueToString(borderProperties?.borderWidth, "pt")};
			background-color: ${textProperties?.backgroundColor};
			color: ${textProperties?.color};
		`;
	}

	export function getCssInlineStyles(properties: StyleProperties, fonts: PrintFontMap): CSSProperties {
		const { textStyle, textProperties, borderProperties } = properties;
		return {
			fontFamily: getPrefixedFontFamily(fonts, textStyle?.font),
			fontSize: optionalValueToString(textStyle?.fontSize, "pt"),
			lineHeight: optionalValueToString(textStyle?.lineHeight, "pt"),
			fontWeight: optionalBooleanToString(textProperties?.bold, "bold"),
			fontStyle: optionalBooleanToString(textProperties?.italic, "italic"),
			textDecoration: optionalBooleanToString(textProperties?.underlined, "underline"),
			textAlign: getTextAlignment(textProperties?.alignment),
			borderStyle: borderProperties?.borderStyle,
			borderColor: borderProperties?.borderColor,
			borderWidth: optionalValueToString(borderProperties?.borderWidth, "pt"),
			backgroundColor: textProperties?.backgroundColor,
			color: textProperties?.color,
		};
	}

	export function getOutlineStyles(properties?: DeepPartialRecursive<BorderProperties>): CSSProperties {
		const width = optionalValueToString(properties?.borderWidth, "pt");
		return {
			outlineStyle: properties?.borderStyle,
			outlineColor: properties?.borderColor,
			outlineWidth: width,
			outlineOffset: properties?.borderWidth ? `-${width}` : undefined,
		};
	}

	export const cssBoxStyles: CSSProperties = {
		position: "absolute",
		inset: 0,
		width: "100%",
		height: "100%",
		overflow: "hidden",
	};

	export function transformOrientation(orientation?: Orientation) {
		switch (orientation) {
			case "bottom-end":
				return css`
					transform: translate(-100%, -100%);
				`;
			case "bottom-start":
				return css`
					transform: translate(0, -100%);
				`;
			case "top-end":
				return css`
					transform: translate(-100%, 0);
				`;
			case "top-start":
			default:
				return css`
					transform: translate(0, 0);
				`;
		}
	}
}

export function getTextPropertiesStyles(
	textProperties: PartialTextProperties | undefined,
	element: PartialAnyPrintModelElement,
	textPropertiesPath: TextPropertiesPath
): StylableText {
	return {
		textStyleId: InputValueSourceResolver.getSourceStringValue(
			textProperties?.textStyleId,
			element,
			textPropertiesPath.textStyleId
		),
		color: InputValueSourceResolver.getSourceStringValue(textProperties?.color, element, textPropertiesPath.color),
		backgroundColor: InputValueSourceResolver.getSourceStringValue(
			textProperties?.backgroundColor,
			element,
			textPropertiesPath.backgroundColor
		),
		bold: InputValueSourceResolver.getSourceBooleanValue(textProperties?.bold, element, textPropertiesPath.bold),
		italic: InputValueSourceResolver.getSourceBooleanValue(
			textProperties?.italic,
			element,
			textPropertiesPath.italic
		),
		underlined: InputValueSourceResolver.getSourceBooleanValue(
			textProperties?.underlined,
			element,
			textPropertiesPath.underlined
		),
		alignment: InputValueSourceResolver.getSourceInputValue<Alignment>(
			textProperties?.alignment,
			element,
			textPropertiesPath.alignment,
			value => value as Alignment
		),
	};
}

export function getTextAlignment(alignment?: Alignment) {
	switch (alignment) {
		case Alignment.Center:
			return "center";
		case Alignment.Left:
			return "left";
		case Alignment.Justify:
			return "justify";
		case Alignment.Right:
			return "right";
		default:
			return undefined;
	}
}

export function optionalValueToString(value?: number | string | Alignment, suffix?: CssPropertySuffix) {
	if (value !== null && value !== undefined && value !== "") {
		return `${value}${suffix}`;
	}
	return undefined;
}

function optionalBooleanToString(
	value: boolean | undefined,
	trueValue: CssPropertyValue,
	falseValue?: CssPropertyValue
) {
	if (value !== undefined) {
		if (value) {
			return trueValue;
		}
		return falseValue;
	}
	return undefined;
}

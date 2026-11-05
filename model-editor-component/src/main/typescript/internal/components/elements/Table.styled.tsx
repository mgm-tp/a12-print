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
import type { PropsWithChildren } from "react";
import { styled } from "styled-components";
import { useSelector } from "react-redux";

import type { PartialBorderProperties } from "@com.mgmtp.a12.print/print-model-api/model";
import { Alignment } from "@com.mgmtp.a12.print/print-model-api/model";
import type { PrintFontMap } from "@com.mgmtp.a12.print/print-fonts/a12internal";

import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { CssUtils } from "../../utils/css-utils.js";
import { DEFAULT_TEXT_STYLE_ID } from "../../constant/textstyle.js";
import type { StylableText } from "../../types/styles.js";

export const StyledTableContainer = styled.table`
	width: 100%;
	table-layout: fixed;
	border-collapse: collapse;
`;

interface StyledTableHeaderProps {
	textProperties?: StylableText;
	borderProperties?: PartialBorderProperties;
	width?: number;
	fallbackTextProperties?: StylableText;
}

export const StyledTableHeader = ({
	textProperties,
	borderProperties,
	width,
	fallbackTextProperties,
	children,
	...rest
}: PropsWithChildren<StyledTableHeaderProps>) => {
	const textStyle = useSelector((state: PrintEngineState) =>
		PrintEngineSelectors.textStyle(state, textProperties?.textStyleId || DEFAULT_TEXT_STYLE_ID)
	);
	const fonts = useSelector(PrintEngineSelectors.fonts);
	const updatedTextProperties: StylableText = {
		...fallbackTextProperties,
		...textProperties,
		alignment: textProperties?.alignment || fallbackTextProperties?.alignment || Alignment.Left,
	};

	return (
		<TableHeaderCell
			textStyle={textStyle}
			fonts={fonts}
			textProperties={updatedTextProperties}
			borderProperties={borderProperties}
			width={width}
			{...rest}
		>
			{children}
		</TableHeaderCell>
	);
};

interface TableHeaderCellProps {
	textStyle?: CssUtils.StyleProperties["textStyle"];
	fonts: PrintFontMap;
	textProperties: StylableText;
	borderProperties?: PartialBorderProperties;
	width?: number;
}

const TableHeaderCell = styled.th<TableHeaderCellProps>(props =>
	CssUtils.getCssStyles(
		{
			textStyle: props.textStyle,
			textProperties: props.textProperties,
			borderProperties: props.borderProperties,
		},
		props.fonts,
		{
			width: props.width ? `${props.width}%` : "auto",
			"font-weight": "normal",
		}
	)
);

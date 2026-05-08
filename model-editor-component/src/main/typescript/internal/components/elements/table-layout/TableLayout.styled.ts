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
import { css, styled } from "styled-components";

import {
	BorderProperties,
	BorderStyle,
	VerticalAlignment,
	PartialBorderProperties,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { OmitId } from "../../../utils/index.js";
import { optionalValueToString } from "../../../utils/css-utils.js";

const DEFAULT_TR_HEIGHT = 40;

export const StyledTable = styled.table<{ width: number }>`
	width: ${({ width }) => width}px;
	min-width: auto;
	table-layout: fixed;
	border-collapse: separate;
	border-spacing: 0;
`;

export const StyledTr = styled.tr<{ height: number | undefined }>`
	height: ${({ height }) => height ?? DEFAULT_TR_HEIGHT}px;
`;

interface StyledTdEmptyProps {
	width: number | undefined;
	borderWidth?: number;
	borderStyle?: BorderStyle;
	borderColor?: string;
}

export const StyledTdEmpty = styled.td<StyledTdEmptyProps>(({ width, borderWidth, borderStyle, borderColor }) => {
	return css`
		position: relative;
		text-align: center;
		width: ${width !== undefined ? `${width}%` : "auto"};
		${getBorderStyles({ borderStyle, borderColor, borderWidth })}
	`;
});

interface StyledTdFilledProps {
	width: number | undefined;
	verticalAlignment: VerticalAlignment | undefined;
	borderProps: PartialBorderProperties | undefined;
	tableBorderProps: PartialBorderProperties | undefined;
}

export const StyledTdFilled = styled.td<StyledTdFilledProps>(
	({ width, verticalAlignment, borderProps, tableBorderProps }) => {
		return css`
			position: relative;
			height: auto;
			width: ${width !== undefined ? `${width}%` : "auto"};
			vertical-align: ${verticalAlignment};
			${getBorderStyles(tableBorderProps, borderProps)}
		`;
	}
);

function getBorderStyles(
	tableBorderProperties?: OmitId<BorderProperties>,
	cellBorderProperties?: OmitId<BorderProperties>
) {
	const borderProperties = {
		...tableBorderProperties,
		...cellBorderProperties,
	};
	return css`
		border-style: ${borderProperties?.borderStyle};
		border-color: ${borderProperties?.borderColor};
		border-width: ${optionalValueToString(borderProperties?.borderWidth, "pt")};
	`;
}

export const StyledActionsWrapper = styled.div`
	display: flex;
	position: absolute;
	top: 0;
	right: 0;
`;

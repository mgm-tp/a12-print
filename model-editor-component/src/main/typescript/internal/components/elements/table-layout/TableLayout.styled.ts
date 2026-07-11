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

import type {
	InputSource,
	VerticalAlignment,
	PartialBorderProperties,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";
import type { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/utils";

import type { OmitId } from "../../../utils/index.js";
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
	borderProp?: PartialBorderProperties;
}

export const StyledTdEmpty = styled.td<StyledTdEmptyProps>(({ width, borderProp }) => {
	return css`
		position: relative;
		text-align: center;
		width: ${width !== undefined ? `${width}%` : "auto"};
		border-style: ${borderProp?.borderStyle?.value};
		border-color: ${borderProp?.borderColor?.value};
		border-width: ${optionalValueToString(borderProp?.borderWidth?.value, "pt")};
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
	tableBorderProperties?: OmitId<PartialBorderProperties>,
	cellBorderProperties?: OmitId<PartialBorderProperties>
) {
	const borderStyle = resolveBorderProperty(tableBorderProperties?.borderStyle, cellBorderProperties?.borderStyle);
	const borderColor = resolveBorderProperty(tableBorderProperties?.borderColor, cellBorderProperties?.borderColor);
	const borderWidth = resolveBorderProperty(tableBorderProperties?.borderWidth, cellBorderProperties?.borderWidth);
	const result = css`
		border-style: ${borderStyle};
		border-color: ${borderColor};
	`;
	if (borderWidth !== undefined) {
		result.push(css`
			border-width: ${optionalValueToString(borderWidth as string, "pt")};
		`);
	}
	return result;
}

function resolveBorderProperty<T>(
	tableProp?: DeepPartialRecursive<InputSource<T>>,
	cellProp?: DeepPartialRecursive<InputSource<T>>
) {
	if (cellProp?.source === PossibleInputSource.INPUT) {
		return cellProp?.value;
	} else if (cellProp?.source === PossibleInputSource.INHERITED) {
		return tableProp?.value;
	}
	return undefined;
}

export const StyledActionsWrapper = styled.div`
	display: flex;
	position: absolute;
	top: 0;
	right: 0;
`;

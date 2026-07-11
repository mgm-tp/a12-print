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
import { styled } from "styled-components";

import { Icon } from "@com.mgmtp.a12.widgets/widgets-core";

import { EditorConst } from "../../constant/editor.js";
import type { MarginSide } from "../../types/margin.js";

import { ToolTipTop, ToolTipBottom } from "../tool-tips/ToolTips.styled.js";

const zIndexList = EditorConst.getZIndexList();
const DIAMETER = 8;

interface MarginProps {
	side: MarginSide;
	margin: number;
	highlight?: boolean;
}

export const StyledMargin = styled.div<MarginProps>`
	position: absolute;
	top: ${(props: MarginProps) => (props.side === "top" ? 0 : "100%")};
	left: 0;
	width: 100%;
	background-color: rgba(230, 244, 254, 0.7);
	user-select: none;
	height: ${({ margin }) => margin - 1}px;
	z-index: ${EditorConst.getZIndexList().ResizeMarginHandler};
	transform: translate(0, ${({ side, margin }) => (side === "top" ? margin * -1 : 0)}px);
	outline: 1px solid ${(props: MarginProps) => (props.highlight ? "#d51079" : "#cbd7e8")};
	${({ side }) => (side === "top" ? "margin-bottom: 1px" : "margin-top: 1px")}
`;

interface StyledMarginResizeHandleProps {
	side: MarginSide;
}

export const StyledMarginResizeHandle = styled.div<StyledMarginResizeHandleProps>`
	width: ${DIAMETER}px;
	height: ${DIAMETER}px;
	border-radius: 50%;
	background-color: #ffffff;
	border: 1px solid #3f5ba2;
	position: absolute;
	z-index: ${zIndexList.ResizeHandle};
	left: 50%;
	${({ side }) => (side === "bottom" ? `top: 100%` : "")};
	transform: ${`translate(-${DIAMETER / 2}px, -${DIAMETER / 2}px)`};
	cursor: ns-resize;
`;

interface StyledMarginValueContainerProps {
	offset?: number;
}
export const StyledMarginValueContainer = styled.div<StyledMarginValueContainerProps>`
	margin-top: ${({ offset = 0 }) => offset}px;
	font-size: 10px;
	position: absolute;
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
`;

export const StyledIconContainer = styled.div`
	position: absolute;
	right: 0;
	top: 0;
`;

export const StyledMarginTopToolTip = styled(ToolTipBottom)`
	display: flex;
	left: 50%;
	pointer-events: unset;
`;

export const StyledMarginBottomToolTip = styled(ToolTipTop)`
	display: flex;
	left: 50%;
	pointer-events: unset;
`;

interface StyledDeleteIconProps {
	color?: string;
}

export const StyledDeleteIcon = styled(Icon)<StyledDeleteIconProps>`
	color: ${({ color }) => color};
	cursor: pointer;
`;

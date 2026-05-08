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

const MIN_WIDTH_PX = 12;

interface StyledDragLayerContainerProps {
	zIndex: number;
}

export const StyledDragLayerContainer = styled.div<StyledDragLayerContainerProps>`
	position: absolute;
	pointer-events: none;
	left: 0;
	top: 0;
	z-index: ${props => props.zIndex};
	width: 100%;
	height: 100%;
`;

export interface StyleDragPreviewElementProps {
	zoomFactor: number;
}

export const StyleDragPreviewElement = styled.div<StyleDragPreviewElementProps>`
	position: absolute;
	transform-origin: 0 0;
	transform: scale(${({ zoomFactor }) => zoomFactor});
	word-break: break-word;
	outline: 1px solid #d51079;
	min-width: ${MIN_WIDTH_PX}px;
`;

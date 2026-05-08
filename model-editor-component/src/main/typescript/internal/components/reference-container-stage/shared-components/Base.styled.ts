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

import { BorderProperties } from "@com.mgmtp.a12.print/print-model-api/lib/model/elements/base.js";

import { EditorConst } from "../../../constant/editor.js";
import { PlainMeasureDimensions, PlainMeasurePosition } from "../../../utils/index.js";
import { CssUtils } from "../../../utils/css-utils.js";

const { getEditorOffset, getZIndexList, MM_TO_PX } = EditorConst;

interface StyledGeneralPageProps {
	zoomFactor: number;
	numberOfPages: number;
	editorDimensions: PlainMeasureDimensions;
}

export const StyledOuterEditorContainer = styled.div`
	background-color: ${props => props.theme.colors.background.secondaryBackground};
	flex: 1;
	overflow: auto;
	position: relative;
	padding: 0 50px;
	border: 1px solid ${props => props.theme.colors.divider.colorLight};
`;

type StyledEditorContainerProps = StyledGeneralPageProps;

export const StyledEditorContainer = styled.div<StyledEditorContainerProps>`
	margin: ${getEditorOffset().top}px auto;
	color: #333;
	background-color: ${props => props.theme.colors.interaction.disabled.colorLight};
	width: ${({ zoomFactor, editorDimensions }) => `${zoomFactor * MM_TO_PX(editorDimensions.minWidth.value)}px`};
	height: ${({ zoomFactor, numberOfPages, editorDimensions }) =>
		`${zoomFactor * MM_TO_PX(editorDimensions.minHeight.value) * numberOfPages}px`};
	box-shadow: rgba(0, 0, 0, 0.18) 0px 2px 4px;
	position: relative;
`;

type StyledEditorPageProps = Omit<StyledGeneralPageProps, "numberOfPages">;

export const StyledEditorPage = styled.div<StyledEditorPageProps>`
	width: ${({ zoomFactor, editorDimensions }) => `${zoomFactor * MM_TO_PX(editorDimensions.minWidth?.value)}px`};
	height: ${({ zoomFactor, editorDimensions }) => `${zoomFactor * MM_TO_PX(editorDimensions.minHeight?.value)}px`};
	overflow-y: clip;
	position: relative;
`;

export const StyledDropContainer = styled.div`
	height: 100%;
	width: 100%;
	position: relative;
`;

interface StyledBasicEditorProps extends StyledGeneralPageProps {
	isSegmentLike: boolean;
	borderProperties?: BorderProperties;
}

export const StyledBasicEditor = styled.div.attrs<StyledBasicEditorProps>(({ borderProperties }) => ({
	style: CssUtils.getOutlineStyles(borderProperties),
}))<StyledBasicEditorProps>`
	background-color: ${({ isSegmentLike, theme }) =>
		isSegmentLike ? "#ffffff" : theme.colors.interaction.disabled.colorDark};
	width: ${({ zoomFactor, editorDimensions }) => `${zoomFactor * MM_TO_PX(editorDimensions.minWidth.value)}px`};
	height: ${({ zoomFactor, numberOfPages, editorDimensions }) =>
		`${zoomFactor * MM_TO_PX(editorDimensions.minHeight.value) * numberOfPages}px`};
	z-index: ${getZIndexList().BasicEditor};
	position: relative;
`;

interface StyledPageDividerProps extends StyledGeneralPageProps {
	topOffset: number;
}

export const StyledPageDivider = styled.div<StyledPageDividerProps>`
	position: absolute;
	border-top: 1px dashed rgba(0, 0, 0, 0.5);
	height: 2px;
	width: 100%;
	left: 0;
	top: ${({ numberOfPages, zoomFactor, editorDimensions, topOffset }) =>
		MM_TO_PX(numberOfPages * editorDimensions.minHeight.value * zoomFactor) + topOffset}px;
	z-index: ${getZIndexList().PageDivider};
	pointer-events: none;
`;

interface StyledDividerLabelProps {
	side: "top" | "bottom";
}

export const StyledDividerLabel = styled.div<StyledDividerLabelProps>`
	position: absolute;
	left: 0;
	top: ${({ side }) => (side === "top" ? -24 : 6)}px;
	color: rgba(0, 0, 0, 0.75);
`;

export const StyledEditorWrapper = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 2px;
	overflow: auto;
	position: relative;
`;

interface StyledSelectRectProps {
	zoomFactor: number;
	selectRectDim: PlainMeasureDimensions;
	selectRectStart: PlainMeasurePosition;
}

export const StyledSelectRect = styled.div.attrs<StyledSelectRectProps>(
	({ zoomFactor, selectRectDim, selectRectStart }) => {
		const top =
			selectRectDim.minHeight.value >= 0
				? selectRectStart.y.value
				: selectRectStart.y.value + selectRectDim.minHeight.value;
		const left =
			selectRectDim.minWidth.value >= 0
				? selectRectStart.x.value
				: selectRectStart.x.value + selectRectDim.minWidth.value;
		return {
			style: {
				transform: `scale(${zoomFactor})`,
				width: MM_TO_PX(Math.abs(selectRectDim.minWidth.value)),
				height: MM_TO_PX(Math.abs(selectRectDim.minHeight.value)),
				top: MM_TO_PX(top) * zoomFactor,
				left: MM_TO_PX(left) * zoomFactor,
			},
		};
	}
)<StyledSelectRectProps>`
	position: absolute;
	border: 1px dashed #000000;
	background-color: rgba(201, 241, 255, 0.4);
	pointer-events: none;
	transform-origin: 0 0;
	z-index: ${getZIndexList().SelectRect};
`;

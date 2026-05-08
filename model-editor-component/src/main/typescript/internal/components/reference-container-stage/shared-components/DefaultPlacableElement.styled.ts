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

import {
	PartialAnyPrintModelElement,
	PartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { EditorConst } from "../../../constant/editor.js";
import { ElementsUtils } from "../../../utils/index.js";

interface StyledDefaultPlaceableElementProps {
	element: PartialAnyPrintModelElement;
	reference: PartialValidPlaceableReference;
	zoomFactor: number;
	isDragging: boolean;
	isSelected: boolean;
	isColliding: boolean;
	isOutsideBox: boolean;
	isMultiDrag: boolean;
	hovered: PartialValidPlaceableReference | null;
	showBorders: boolean;
	offsetTop?: number;
	zIndex?: number;
}

const { MM_TO_PX, getZIndexList } = EditorConst;

export const StyledDefaultPlaceableElement = styled.div<StyledDefaultPlaceableElementProps>`
	position: absolute;
	word-break: break-word;
	transform-origin: 0 0;
	transform: scale(${({ zoomFactor }) => zoomFactor});
	left: ${({ reference, zoomFactor }) => MM_TO_PX(reference.position.x.value) * zoomFactor}px;
	top: ${({ reference, zoomFactor, offsetTop = 0 }) => MM_TO_PX(reference.position.y.value + offsetTop) * zoomFactor}px;
	opacity: ${({ isDragging, isMultiDrag, isSelected }) => (isDragging || (isMultiDrag && isSelected) ? 0 : 1)};
	z-index: ${({ zIndex }) => zIndex || getZIndexList().DragSourceItem};
	width: ${({ reference }) => MM_TO_PX(reference.dimensions.minWidth.value)}px;
	min-width: ${({ reference }) => MM_TO_PX(reference.dimensions.minWidth.value)}px;
	min-height: ${({ reference, element }) =>
		MM_TO_PX(ElementsUtils.getFixedElementHeight(element, reference) || reference.dimensions.minHeight.value)}px;
	outline: ${({ hovered, isSelected, showBorders, isColliding, isOutsideBox, reference }) =>
		hovered?.refId === reference.refId
			? "1px solid #d51079"
			: isSelected
				? "1px solid #d51079"
				: !showBorders
					? "none"
					: isColliding || isOutsideBox
						? "2px solid red"
						: "1px solid #cbd7e8"};
	box-shadow: ${({ isSelected }) => (isSelected ? "0px 0px 7px 2px rgba(213, 16, 121, 0.25)" : "none")};}
`;

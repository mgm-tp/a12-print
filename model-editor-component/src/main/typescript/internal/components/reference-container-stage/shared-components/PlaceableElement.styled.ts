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

import type {
	PartialAnyPrintModelElement,
	PartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/model";

import { EditorConst } from "../../../constant/editor.js";
import { ElementsUtils } from "../../../utils/index.js";

interface StylePlaceableElementProps {
	element: PartialAnyPrintModelElement;
	reference: PartialValidPlaceableReference;
	zoomFactor: number;
	highlight?: boolean;
	offsetTop?: number;
	zIndex?: number;
}

const { MM_TO_PX } = EditorConst;

export const StylePlaceableElement = styled.div<StylePlaceableElementProps>`
	position: absolute;
	word-break: break-word;
	background-color: #e2e6e9;
	transform-origin: 0 0;
	transform: scale(${({ zoomFactor }) => zoomFactor});
	left: ${({ reference, zoomFactor }) => MM_TO_PX(reference.position.x.value) * zoomFactor}px;
	top: ${({ reference, zoomFactor, offsetTop = 0 }) =>
		MM_TO_PX(reference.position.y.value + offsetTop) * zoomFactor}px;
	width: ${({ reference }) => MM_TO_PX(reference.dimensions.minWidth.value)}px;
	min-height: ${({ reference, element }) =>
		MM_TO_PX(ElementsUtils.getFixedElementHeight(element, reference) || reference.dimensions.minHeight.value)}px;
	outline: ${({ highlight }) => `1px solid ${highlight ? "#d51079" : "#cbd7e8"}`};
	z-index: ${({ highlight, zIndex }) => zIndex || EditorConst.getZIndexList().PlaceableElement + (highlight ? 1 : 0)};
`;

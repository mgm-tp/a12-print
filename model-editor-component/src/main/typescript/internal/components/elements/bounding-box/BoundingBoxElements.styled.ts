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

import { ElementsUtils } from "../../../utils/index.js";
import { EditorConst } from "../../../constant/editor.js";

const MM_TO_PX = EditorConst.MM_TO_PX;

interface StyledBoundingBoxElementsProps {
	itemElement: PartialAnyPrintModelElement;
	item: PartialValidPlaceableReference;
}

export const StyledBoundingBoxElements = styled.div<StyledBoundingBoxElementsProps>`
	transform-origin: 0 0;
	position: absolute;
	left: ${({ item }) => MM_TO_PX(item.position.x.value) + "px"};
	top: ${({ item }) => MM_TO_PX(item.position.y.value) + "px"};
	opacity: 1;
	width: ${({ item }) => MM_TO_PX(item.dimensions.minWidth.value) + "px"};
	min-width: ${({ item }) => MM_TO_PX(item.dimensions.minWidth.value) + "px"};
	height: ${({ itemElement, item }) =>
		MM_TO_PX(
			ElementsUtils.isWrapperElement(itemElement)
				? item.dimensions.minHeight.value
				: ElementsUtils.getFixedElementHeight(itemElement, item) || item.dimensions.minHeight.value
		) + "px"};
	word-break: break-word;
	z-index: ${() => EditorConst.getZIndexList().NestedElement};
	outline: none;
	pointer-events: none;
`;

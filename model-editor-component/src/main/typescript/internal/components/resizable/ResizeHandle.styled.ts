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

import type { Dimensions, Position } from "@com.mgmtp.a12.print/print-model-api/model";

import { EditorConst } from "../../constant/editor.js";
import type { OmitId } from "../../utils/index.js";
import type { ISide } from "../../types/resize.js";

const zIndexList = EditorConst.getZIndexList();
const { MM_TO_PX } = EditorConst;
const DIAMETER = 8;

interface StyledResizeHandleProps {
	side: ISide;
	zoomFactor: number;
	position?: OmitId<Position>;
	dimensions: OmitId<Dimensions>;
}

export const StyledResizeHandle = styled.div.attrs<StyledResizeHandleProps>(
	({ dimensions, position, side, zoomFactor }) => {
		const isHorizontal = side === "left" || side === "right";
		const cursor = isHorizontal ? "ew-resize" : "ns-resize";
		let top: number;
		let left: number;
		if (isHorizontal && position) {
			top = position.y.value + dimensions.minHeight.value / 2;
			left = side === "left" ? position.x.value : position.x.value + dimensions.minWidth.value;
		} else {
			top =
				side === "top"
					? position?.y?.value || dimensions.minHeight.value
					: position?.y?.value !== undefined
						? position.y.value + dimensions.minHeight.value
						: 0;
			left = (position?.x?.value || 0) + dimensions.minWidth.value / 2;
		}
		return {
			style: {
				cursor: cursor,
				top: MM_TO_PX(top) * zoomFactor,
				left: MM_TO_PX(left) * zoomFactor,
			},
		};
	}
)`
	width: ${DIAMETER}px;
	height: ${DIAMETER}px;
	border-radius: 50%;
	background-color: #ffffff;
	border: 1px solid #3f5ba2;
	position: absolute;
	z-index: ${zIndexList.ResizeHandle};
	transform: ${`translate(-${DIAMETER / 2}px, -${DIAMETER / 2}px)`};
`;

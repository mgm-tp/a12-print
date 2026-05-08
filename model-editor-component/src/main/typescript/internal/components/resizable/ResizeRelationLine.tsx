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
import { EditorConst } from "../../constant/editor.js";
import { IRsLine } from "../../types/resize.js";
import { formatNumberToString } from "../../utils/index.js";

import { ToolTipBottom, ToolTipLeft, ToolTipRight, ToolTipTop } from "../tool-tips/ToolTips.styled.js";

const zIndexList = EditorConst.getZIndexList();
const { MM_TO_CM, MM_TO_PX } = EditorConst;

export function VerticalResizeRelationLine({
	rsLineVert,
	zoomFactor,
}: {
	rsLineVert: IRsLine | null;
	zoomFactor: number;
}) {
	if (!rsLineVert) {
		return null;
	}

	const height = rsLineVert.end.y.value - rsLineVert.start.y.value;

	return (
		<div
			style={{
				position: "absolute",
				top: MM_TO_PX(rsLineVert.start.y.value) * zoomFactor,
				left: MM_TO_PX(rsLineVert.start.x.value) * zoomFactor,
				height: MM_TO_PX(height) * zoomFactor,
				pointerEvents: "none",
				width: 1,
				zIndex: zIndexList.RsLines,
				backgroundColor: "#d51079",
			}}
		>
			{rsLineVert.type === "bottom" ? (
				<ToolTipBottom>{`${formatNumberToString(MM_TO_CM(height))} cm`}</ToolTipBottom>
			) : (
				<ToolTipTop>{`${formatNumberToString(MM_TO_CM(height))} cm`}</ToolTipTop>
			)}
		</div>
	);
}

export function HorizontalResizeRelationLine({
	rsLineHor,
	zoomFactor,
}: {
	rsLineHor: IRsLine | null;
	zoomFactor: number;
}) {
	if (!rsLineHor) {
		return null;
	}

	const width = rsLineHor.end.x.value - rsLineHor.start.x.value;

	return (
		<div
			style={{
				position: "absolute",
				top: MM_TO_PX(rsLineHor.start.y.value) * zoomFactor,
				left: MM_TO_PX(rsLineHor.start.x.value) * zoomFactor,
				height: 1,
				pointerEvents: "none",
				width: MM_TO_PX(width) * zoomFactor,
				zIndex: zIndexList.RsLines,
				backgroundColor: "#d51079",
			}}
		>
			{rsLineHor.type === "right" ? (
				<ToolTipRight>{`${formatNumberToString(MM_TO_CM(width))} cm`}</ToolTipRight>
			) : (
				<ToolTipLeft>{`${formatNumberToString(MM_TO_CM(width))} cm`}</ToolTipLeft>
			)}
		</div>
	);
}

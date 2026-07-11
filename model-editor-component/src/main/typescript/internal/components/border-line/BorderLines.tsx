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
import * as React from "react";
import { useSelector } from "react-redux";

import type { Placeable } from "@com.mgmtp.a12.print/print-model-api/model";

import { EditorConst } from "../../constant/editor.js";
import { EditorUtils, formatNumberWithFixedDecimals } from "../../utils/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";

import { ToolTipX, ToolTipY } from "../tool-tips/ToolTips.styled.js";

const { MM_TO_CM, MM_TO_PX } = EditorConst;
const zIndexList = EditorConst.getZIndexList();

interface Props {
	item: Placeable;
	zoomFactor: number;
	rsLines: (React.ReactElement | boolean | null)[];
	bodyState: HTMLDivElement | null;
	editorState: HTMLDivElement | null;
}

export const BorderLines = ({ item, zoomFactor, rsLines, bodyState, editorState }: Props) => {
	const editorDimensions = useSelector(PrintEngineSelectors.editorDimensions);

	const xPos = item.position.x.value;
	const yPos = item.position.y.value;
	const itemHeight = item.dimensions.minHeight.value;
	const itemWidth = item.dimensions.minWidth.value;
	const editorHeight = editorDimensions.minHeight.value;
	const heightOffset = EditorUtils.getRealPage(yPos, editorHeight) * editorHeight;
	const verticalPageOffset = MM_TO_PX(heightOffset) * zoomFactor;

	const getLineStyle = React.useCallback(
		(direction: string, side: string): React.CSSProperties => {
			const posX = MM_TO_PX(xPos) * zoomFactor;
			const posY = MM_TO_PX(yPos) * zoomFactor;

			if (direction === "vertical") {
				return {
					position: "absolute",
					borderLeft: "1px solid #d51079",
					width: 1,
					height: posY - verticalPageOffset,
					top: verticalPageOffset,
					left: side === "left" ? posX : posX + MM_TO_PX(itemWidth) * zoomFactor,
					zIndex: zIndexList.BorderLines,
				};
			}
			return {
				position: "absolute",
				borderTop: "1px solid #d51079",
				height: 1,
				width: posX,
				left: 0,
				top: side === "top" ? posY : posY + MM_TO_PX(itemHeight) * zoomFactor,
				zIndex: zIndexList.BorderLines,
			};
		},
		[itemHeight, itemWidth, verticalPageOffset, xPos, yPos, zoomFactor]
	);

	const getLineNumber = React.useCallback(
		(direction: string, side: string) => {
			let res = 0;
			if (direction === "vertical") {
				res = side === "left" ? yPos - heightOffset : yPos + itemHeight - heightOffset;
			} else {
				res = side === "top" ? xPos : xPos + itemWidth;
			}
			return formatNumberWithFixedDecimals(MM_TO_CM(res), 1);
		},
		[heightOffset, itemHeight, itemWidth, xPos, yPos]
	);

	const getLine = React.useCallback(
		(direction: string, side: string) => {
			if (!bodyState || !editorState) {
				return null;
			}

			const { marginTop, marginLeft } = window.getComputedStyle(editorState);
			const offsetTop = bodyState.scrollTop - Number(marginTop.replace("px", ""));
			const offsetLeft = bodyState.scrollLeft - Number(marginLeft.replace("px", ""));
			const top = offsetTop < 0 || offsetTop < verticalPageOffset ? 5 : 5 + offsetTop - verticalPageOffset;
			const left = offsetLeft < 0 ? 5 : 5 + offsetLeft;
			const lineNumber = getLineNumber(direction, side);

			return (
				<div style={getLineStyle(direction, side)}>
					{direction === "vertical" ? (
						<ToolTipY style={{ top }}>{lineNumber} cm</ToolTipY>
					) : (
						<ToolTipX style={{ left }}>{lineNumber} cm</ToolTipX>
					)}
				</div>
			);
		},
		[bodyState, editorState, getLineNumber, getLineStyle, verticalPageOffset]
	);

	return (
		<>
			{!rsLines[0] && getLine("horizontal", "top")}
			{!rsLines[1] && getLine("vertical", "left")}
		</>
	);
};

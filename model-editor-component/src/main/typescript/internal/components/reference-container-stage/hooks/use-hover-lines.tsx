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

import { PartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { EditorConst } from "../../../constant/editor.js";
import { EditorUtils, formatNumberToString } from "../../../utils/index.js";
import { ToolTipBottom, ToolTipLeft, ToolTipRight, ToolTipTop } from "../../tool-tips/ToolTips.styled.js";
import { useGetSectionOffset } from "../../../hooks/use-get-section-offset.js";

const zIndexList = EditorConst.getZIndexList();
const { MM_TO_PX, MM_TO_CM } = EditorConst;

interface HoverLine {
	x: number;
	y: number;
	width: number;
	height: number;
}

const defaultHL: HoverLine = { x: 1, y: 1, width: 1, height: 1 };

export const useHoverLines = (
	selected: string[],
	elementReferences: ReadonlyArray<PartialValidPlaceableReference>,
	isOver: boolean,
	zoomFactor: number
) => {
	const [hovered, setHovered] = React.useState<PartialValidPlaceableReference | null>(null);
	const getSectionOffset = useGetSectionOffset();
	const getHoverLines = React.useCallback(() => {
		if (!hovered || selected.length !== 1 || hovered.refId === selected[0]) {
			return null;
		}
		const selectedEl = elementReferences.find(el => el.refId === selected[0]);
		if (!selectedEl || EditorUtils.isColliding(selectedEl, hovered)) {
			return null;
		}
		const basicStyle: React.CSSProperties = {
			position: "absolute",
			pointerEvents: "none",
			zIndex: zIndexList.RsLines,
		};
		const hoveredSectionOffset = getSectionOffset(
			hovered.position.y.value,
			hovered.position.y.value + hovered.dimensions.minHeight.value,
			hovered
		);
		const selectedElSectionOffset = getSectionOffset(
			selectedEl.position.y.value,
			selectedEl.position.y.value + selectedEl.dimensions.minHeight.value,
			selectedEl
		);
		const selElPosXEnd = selectedEl.position.x.value + selectedEl.dimensions.minWidth.value;
		const hoveredPosXEnd = hovered.position.x.value + hovered.dimensions.minWidth.value;
		const selElPosYEnd =
			selectedEl.position.y.value + selectedEl.dimensions.minHeight.value + selectedElSectionOffset;
		const hoveredPosYEnd = hovered.position.y.value + hovered.dimensions.minHeight.value + hoveredSectionOffset;

		if (selElPosXEnd >= hovered.position.x.value && selectedEl.position.x.value <= hoveredPosXEnd) {
			return renderVerticalHoverLine({ selectedEl, hovered, getSectionOffset, isOver, zoomFactor, basicStyle });
		}

		if (selElPosYEnd >= hovered.position.y.value && selectedEl.position.y.value <= hoveredPosYEnd) {
			return renderHorizontalHoverLine({ selectedEl, hovered, isOver, zoomFactor, basicStyle });
		}

		return renderHoverLines({
			selectedEl,
			hovered,
			selElPosXEnd,
			hoveredPosXEnd,
			selElPosYEnd,
			hoveredPosYEnd,
			isOver,
			zoomFactor,
			basicStyle,
		});
	}, [elementReferences, getSectionOffset, hovered, isOver, selected, zoomFactor]);

	return {
		hovered,
		setHovered,
		getHoverLines,
	};
};

const renderVerticalHoverLine = ({
	selectedEl,
	hovered,
	getSectionOffset,
	isOver,
	zoomFactor,
	basicStyle,
}: {
	selectedEl: PartialValidPlaceableReference;
	hovered: PartialValidPlaceableReference;
	getSectionOffset: (start: number, end: number, element: PartialValidPlaceableReference) => number;
	isOver: boolean;
	zoomFactor: number;
	basicStyle: React.CSSProperties;
}) => {
	const left = Math.max(selectedEl.position.x.value, hovered.position.x.value);
	let top, height, type, sectionOffset;
	if (selectedEl.position.y.value > hovered.position.y.value) {
		sectionOffset = getSectionOffset(
			hovered.position.y.value,
			hovered.position.y.value + hovered.dimensions.minHeight.value,
			hovered
		);
		top = hovered.position.y.value + hovered.dimensions.minHeight.value + sectionOffset;
		height = selectedEl.position.y.value - top;
		type = "bottom";
	} else {
		sectionOffset = getSectionOffset(
			selectedEl.position.y.value,
			selectedEl.position.y.value + selectedEl.dimensions.minHeight.value,
			selectedEl
		);
		top = selectedEl.position.y.value + selectedEl.dimensions.minHeight.value + sectionOffset;
		height = hovered.position.y.value - top;
		type = "top";
	}
	return (
		!isOver && (
			<div
				style={{
					...basicStyle,
					left: MM_TO_PX(left) * zoomFactor,
					top: MM_TO_PX(top) * zoomFactor,
					height: MM_TO_PX(height) * zoomFactor,
					width: 1 * zoomFactor,
					borderLeft: "1px solid #d51079",
				}}
			>
				{type === "top" ? (
					<ToolTipTop>{`${formatNumberToString(MM_TO_CM(height))} cm`}</ToolTipTop>
				) : (
					<ToolTipBottom>{`${formatNumberToString(MM_TO_CM(height))} cm`}</ToolTipBottom>
				)}
			</div>
		)
	);
};

const renderHorizontalHoverLine = ({
	selectedEl,
	hovered,
	isOver,
	zoomFactor,
	basicStyle,
}: {
	selectedEl: PartialValidPlaceableReference;
	hovered: PartialValidPlaceableReference;
	isOver: boolean;
	zoomFactor: number;
	basicStyle: React.CSSProperties;
}) => {
	const top = Math.max(selectedEl.position.y.value, hovered.position.y.value);
	let left, width, type;
	if (selectedEl.position.x.value > hovered.position.x.value) {
		left = hovered.position.x.value + hovered.dimensions.minWidth.value;
		width = selectedEl.position.x.value - left;
		type = "right";
	} else {
		left = selectedEl.position.x.value + selectedEl.dimensions.minWidth.value;
		width = hovered.position.x.value - left;
		type = "left";
	}
	return (
		!isOver && (
			<div
				style={{
					...basicStyle,
					left: MM_TO_PX(left) * zoomFactor,
					top: MM_TO_PX(top) * zoomFactor,
					width: MM_TO_PX(width) * zoomFactor,
					height: zoomFactor,
					borderTop: "1px solid #d51079",
				}}
			>
				{type === "right" ? (
					<ToolTipRight>{`${formatNumberToString(MM_TO_CM(width))} cm`}</ToolTipRight>
				) : (
					<ToolTipLeft>{`${formatNumberToString(MM_TO_CM(width))} cm`}</ToolTipLeft>
				)}
			</div>
		)
	);
};

const renderHoverLines = ({
	selectedEl,
	hovered,
	selElPosXEnd,
	hoveredPosXEnd,
	selElPosYEnd,
	hoveredPosYEnd,
	isOver,
	zoomFactor,
	basicStyle,
}: {
	selectedEl: PartialValidPlaceableReference;
	hovered: PartialValidPlaceableReference;
	selElPosXEnd: number;
	hoveredPosXEnd: number;
	selElPosYEnd: number;
	hoveredPosYEnd: number;
	isOver: boolean;
	zoomFactor: number;
	basicStyle: React.CSSProperties;
}) => {
	let typeX: "left" | "right";
	let typeY: "top" | "bottom";
	const solidHor: HoverLine = { ...defaultHL };
	const dashedVert: HoverLine = { ...defaultHL };
	const solidVert: HoverLine = { ...defaultHL };
	const dashedHor: HoverLine = { ...defaultHL };

	if (hovered.position.x.value > selectedEl.position.x.value) {
		solidHor.x = selElPosXEnd;
		solidHor.width = hovered.position.x.value - solidHor.x;
		dashedVert.x = solidHor.x + solidHor.width;
		solidVert.x = selElPosXEnd;
		dashedHor.x = solidHor.x;
		dashedHor.width = solidHor.width;
		typeX = "left";
	} else {
		solidHor.x = hoveredPosXEnd;
		solidHor.width = selectedEl.position.x.value - solidHor.x;
		dashedVert.x = solidHor.x;
		solidVert.x = selectedEl.position.x.value;
		dashedHor.x = solidHor.x;
		dashedHor.width = solidHor.width;
		typeX = "right";
	}

	if (hovered.position.y.value > selectedEl.position.y.value) {
		solidHor.y = selElPosYEnd;
		dashedVert.y = solidHor.y;
		dashedVert.height = hovered.position.y.value - dashedVert.y;
		solidVert.y = selElPosYEnd;
		solidVert.height = dashedVert.height;
		dashedHor.y = hovered.position.y.value;
		typeY = "top";
	} else {
		solidHor.y = selectedEl.position.y.value;
		dashedVert.y = hoveredPosYEnd;
		dashedVert.height = selectedEl.position.y.value - dashedVert.y;
		solidVert.y = dashedVert.y;
		solidVert.height = dashedVert.height;
		dashedHor.y = hoveredPosYEnd;
		typeY = "bottom";
	}

	return (
		!isOver && (
			<>
				<div
					style={{
						...basicStyle,
						left: MM_TO_PX(solidHor.x) * zoomFactor,
						top: MM_TO_PX(solidHor.y) * zoomFactor,
						width: MM_TO_PX(solidHor.width) * zoomFactor,
						height: MM_TO_PX(solidHor.height) * zoomFactor,
						borderTop: "1px solid #d51079",
					}}
				>
					{typeX === "right" ? (
						<ToolTipRight>{`${formatNumberToString(MM_TO_CM(solidHor.width))} cm`}</ToolTipRight>
					) : (
						<ToolTipLeft>{`${formatNumberToString(MM_TO_CM(solidHor.width))} cm`}</ToolTipLeft>
					)}
				</div>
				<div
					style={{
						...basicStyle,
						left: MM_TO_PX(solidVert.x) * zoomFactor,
						top: MM_TO_PX(solidVert.y) * zoomFactor,
						width: MM_TO_PX(solidVert.width) * zoomFactor,
						height: MM_TO_PX(solidVert.height) * zoomFactor,
						borderLeft: "1px solid #d51079",
					}}
				>
					{typeY === "top" ? (
						<ToolTipTop>{`${formatNumberToString(MM_TO_CM(solidVert.height))} cm`}</ToolTipTop>
					) : (
						<ToolTipBottom>{`${formatNumberToString(MM_TO_CM(solidVert.height))} cm`}</ToolTipBottom>
					)}
				</div>
				<div
					style={{
						...basicStyle,
						left: MM_TO_PX(dashedHor.x) * zoomFactor,
						top: MM_TO_PX(dashedHor.y) * zoomFactor,
						width: MM_TO_PX(dashedHor.width) * zoomFactor,
						height: MM_TO_PX(dashedHor.height) * zoomFactor,
						borderTop: "1px dashed #d51079",
					}}
				></div>
				<div
					style={{
						...basicStyle,
						left: MM_TO_PX(dashedVert.x) * zoomFactor,
						top: MM_TO_PX(dashedVert.y) * zoomFactor,
						width: MM_TO_PX(dashedVert.width) * zoomFactor,
						height: MM_TO_PX(dashedVert.height) * zoomFactor,
						borderLeft: "1px dashed #d51079",
					}}
				></div>
			</>
		)
	);
};

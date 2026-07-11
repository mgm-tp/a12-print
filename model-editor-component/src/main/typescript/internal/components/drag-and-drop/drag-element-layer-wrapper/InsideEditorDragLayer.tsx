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

import type { PartialValidPlaceableReference, Placeable } from "@com.mgmtp.a12.print/print-model-api/model";

import { EditorConst } from "../../../constant/editor.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import type { PlainMeasurePosition } from "../../../utils/index.js";
import {
	createMmMeasure,
	createPlainMmMeasure,
	createPlainMmMeasureFromPx,
	EditorUtils,
	formatNumberToString,
} from "../../../utils/index.js";
import type { DragItem } from "../../../types/index.js";
import { ToolTipBottom, ToolTipLeft, ToolTipRight, ToolTipTop } from "../../tool-tips/ToolTips.styled.js";
import { BorderLines } from "../../border-line/BorderLines.js";
import { EditorContext } from "../../editor-stage/editor-context.js";
import type { DndRsLine } from "../../../types/dnd.js";

import type { BasicDragLayerProps } from "../create-drag-layer-wrapper.js";

import { PreviewElementContainer } from "./PreviewElementContainer.js";
import { StyledDragLayerContainer } from "./DragElementLayerWrapper.styled.js";
import { useRsLineSide } from "./hooks/use-rs-line-side.js";
import { useRsLineTop } from "./hooks/use-rs-line-top.js";

const zIndexList = EditorConst.getZIndexList();
const { PX_TO_MM, MM_TO_PX, MM_TO_CM } = EditorConst;
const EDITOR_OFFSET_TOP = EditorConst.getEditorOffset().top;

export interface InsideEditorDragLayerProps extends BasicDragLayerProps<DragItem> {
	snapOffset: PlainMeasurePosition;
	setSnapOffset: React.Dispatch<React.SetStateAction<PlainMeasurePosition>>;
	selected: string[];
	isOver: boolean;
	bodyState: HTMLDivElement | null;
	editorState: HTMLDivElement | null;
}

export const InsideEditorDragLayer = ({
	snapOffset,
	setSnapOffset,
	selected,
	isOver,
	bodyState,
	editorState,
	dragLayerProperties,
}: InsideEditorDragLayerProps) => {
	const { editorOptions } = useSelector(PrintEngineSelectors.printEditorState);
	const { zoomFactor } = editorOptions;

	const { elementReferences } = React.useContext(EditorContext);

	const [rsLineHor, setRsLineHor] = React.useState<DndRsLine | null>(null);
	const [rsLineVert, setRsLineVert] = React.useState<DndRsLine | null>(null);
	const getRsLinesSide = useRsLineSide();
	const getRsLinesTop = useRsLineTop();

	const { isDragging, item, differenceOffset: differenceOffsetPX, clientOffset } = dragLayerProperties;

	const differenceOffset: PlainMeasurePosition = React.useMemo(() => {
		return {
			x: createPlainMmMeasureFromPx((differenceOffsetPX?.x || 0) / zoomFactor),
			y: createPlainMmMeasureFromPx((differenceOffsetPX?.y || 0) / zoomFactor),
		};
	}, [differenceOffsetPX?.x, differenceOffsetPX?.y, zoomFactor]);

	const setRelationshipLines = React.useCallback(
		(updatedPos: PlainMeasurePosition, lMainTarget: PartialValidPlaceableReference) => {
			const bodyDiv = bodyState;
			if (!bodyDiv) {
				return { newRsLineHor: null, newRsLineVert: null };
			}
			const horizontalLines: DndRsLine[] = [];
			const verticalLines: DndRsLine[] = [];
			elementReferences.forEach(el => {
				if (
					el.position.y.value + EDITOR_OFFSET_TOP + el.dimensions.minHeight.value <
						PX_TO_MM(bodyDiv.scrollTop) ||
					el.position.y.value + EDITOR_OFFSET_TOP > PX_TO_MM(bodyDiv.scrollTop + bodyDiv.clientHeight) ||
					el.refId === lMainTarget.refId ||
					(selected.includes(lMainTarget.refId) && selected.includes(el.refId))
				) {
					return;
				}
				getRsLinesSide(el, lMainTarget, updatedPos, horizontalLines);
				getRsLinesTop(el, lMainTarget, updatedPos, verticalLines);
			});
			const newRsLineHor = horizontalLines.reduce((res: null | DndRsLine, next) => {
				if (res === null) {
					return next;
				}
				if (next.end.x.value - next.start.x.value < res.end.x.value - res.start.x.value) {
					return next;
				}
				return res;
			}, null);
			const newRsLineVert = verticalLines.reduce((res: null | DndRsLine, next) => {
				if (res === null) {
					return next;
				}
				if (next.end.y.value - next.start.y.value < res.end.y.value - res.start.y.value) {
					return next;
				}
				return res;
			}, null);
			setRsLineHor(newRsLineHor);
			setRsLineVert(newRsLineVert);
			return { newRsLineHor, newRsLineVert };
		},
		[bodyState, elementReferences, getRsLinesSide, getRsLinesTop, selected]
	);

	const calculateSnapOffset = React.useCallback(
		(currentDifference: PlainMeasurePosition, mainReference: PartialValidPlaceableReference) => {
			const { newRsLineHor, newRsLineVert } = setRelationshipLines(currentDifference, mainReference);
			const newSnapOffset = {
				x: snapOffset.x,
				y: snapOffset.y,
			};

			const calculateItemPosY = (rsLineType: string, currentY: number, itemHeight: number): number => {
				if (rsLineType.startsWith("same_end")) {
					return currentY + itemHeight;
				}
				if (rsLineType.startsWith("same_mid")) {
					return currentY + itemHeight / 2;
				}
				return currentY;
			};

			const calculateItemPosX = (rsLineType: string, currentX: number, itemWidth: number): number => {
				if (rsLineType.startsWith("same_end")) {
					return currentX + itemWidth;
				}
				if (rsLineType.startsWith("same_mid")) {
					return currentX + itemWidth / 2;
				}
				return currentX;
			};

			if (newRsLineHor) {
				const itemPosY = calculateItemPosY(
					newRsLineHor.type,
					currentDifference.y.value,
					mainReference.dimensions.minHeight.value
				);
				newSnapOffset.y = createPlainMmMeasure(newRsLineHor.start.y.value - itemPosY);
			}

			if (newRsLineVert) {
				const itemPosX = calculateItemPosX(
					newRsLineVert.type,
					currentDifference.x.value,
					mainReference.dimensions.minWidth.value
				);
				newSnapOffset.x = createPlainMmMeasure(newRsLineVert.start.x.value - itemPosX);
			}

			if (newSnapOffset.x.value !== snapOffset.x.value || newSnapOffset.y.value !== snapOffset.y.value) {
				setSnapOffset(newSnapOffset);
			}
		},
		[setRelationshipLines, setSnapOffset, snapOffset.x, snapOffset.y]
	);

	const mainTarget = React.useMemo(() => {
		if (item && item.position && item.dimensions && item.refId) {
			if (isOver && selected.length > 1 && selected.includes(item.refId)) {
				const selectedEls = elementReferences.filter(el => selected.includes(el.refId));
				return selectedEls.reduce(
					(res, next) => (EditorUtils.isCloserToTopLeft(res.position, next.position) ? res : next),
					selectedEls[0]
				);
			} else {
				return item;
			}
		} else {
			return undefined;
		}
	}, [selected, item, isOver, elementReferences]);

	const newPos = React.useMemo(() => {
		if (isDragging && isOver && differenceOffset && mainTarget) {
			let currentDifference = {
				x: createPlainMmMeasure(differenceOffset.x.value + mainTarget.position.x.value),
				y: createPlainMmMeasure(differenceOffset.y.value + mainTarget.position.y.value),
			};

			// Recalculate new position when drag new element base on clientOffset
			if (item.newType) {
				const { top = 0, left = 0 } = editorState?.getBoundingClientRect() || {};
				const { x: clientX = 0, y: clientY = 0 } = clientOffset || {};
				currentDifference = {
					x: createPlainMmMeasure(PX_TO_MM((clientX - left) / zoomFactor)),
					y: createPlainMmMeasure(PX_TO_MM((clientY - top) / zoomFactor)),
				};
			}

			return currentDifference;
		}
		return {
			x: createPlainMmMeasure(0),
			y: createPlainMmMeasure(0),
		};
	}, [clientOffset, differenceOffset, editorState, isDragging, isOver, item.newType, mainTarget, zoomFactor]);

	// Calculate snap offset as a side effect (not during render) to avoid
	// updating state of another component while this component is rendering.
	React.useLayoutEffect(() => {
		if (!(isDragging && isOver && mainTarget)) {
			return;
		}

		const frameId = globalThis.requestAnimationFrame(() => {
			calculateSnapOffset(newPos, mainTarget);
		});

		return () => {
			globalThis.cancelAnimationFrame(frameId);
		};
	}, [calculateSnapOffset, isDragging, isOver, mainTarget, newPos]);

	const isOverlapping = React.useMemo(() => {
		if (mainTarget) {
			return elementReferences.some(el => {
				if (
					el.refId === mainTarget.refId ||
					(selected.includes(mainTarget.refId) && selected.includes(el.refId))
				) {
					return false;
				}
				return EditorUtils.isElementOverlapping(
					{
						x: createPlainMmMeasure(snapOffset.x.value + newPos.x.value),
						y: createPlainMmMeasure(snapOffset.y.value + newPos.y.value),
						...mainTarget.dimensions,
					},
					{ ...el.dimensions, ...el.position },
					true
				);
			});
		}
		return false;
	}, [snapOffset, newPos, mainTarget, elementReferences, selected]);

	React.useEffect(() => {
		return () => {
			setSnapOffset({ x: createPlainMmMeasure(0), y: createPlainMmMeasure(0) });
			setRsLineHor(null);
			setRsLineVert(null);
		};
	}, [setSnapOffset]);

	const closestHorizontal = React.useMemo(() => {
		if (rsLineHor === null) {
			return null;
		}
		const distance =
			rsLineHor.type.endsWith("_left") || rsLineHor.type === "overlapRight" || rsLineHor.type === "outsideLeft"
				? rsLineHor.end.x.value - rsLineHor.start.x.value - snapOffset.x.value
				: rsLineHor.end.x.value - rsLineHor.start.x.value + snapOffset.x.value;
		const left =
			rsLineHor.type.endsWith("_left") || rsLineHor.type === "overlapRight" || rsLineHor.type === "outsideLeft"
				? (rsLineHor.start.x.value + snapOffset.x.value) * zoomFactor
				: rsLineHor.start.x.value * zoomFactor;
		const posStyle = {
			position: "absolute",
			top: MM_TO_PX(rsLineHor.start.y.value) * zoomFactor,
			left: MM_TO_PX(left),
			width: zoomFactor * MM_TO_PX(distance),
			pointerEvents: "none",
		};
		const height = MM_TO_PX(rsLineHor.dim) * zoomFactor;

		const calculateTopPosition = (rsLineType: string, baseTop: number, height: number): number => {
			if (rsLineType.startsWith("same_start")) {
				return baseTop;
			}
			if (rsLineType.startsWith("same_end")) {
				return baseTop - height;
			}
			return baseTop - height / 2;
		};

		const topRect = calculateTopPosition(rsLineHor.type, posStyle.top, height);
		return (
			<React.Fragment key="horRsFragment">
				<div
					key="horRsLineRect"
					style={{
						...(posStyle as React.CSSProperties),
						height,
						backgroundColor: "rgba(252, 209, 228, 0.7)",
						zIndex: zIndexList.rsLinesRect,
						top: topRect,
					}}
				/>
				<div
					key="horizontal"
					style={{
						...(posStyle as React.CSSProperties),
						height: 1,
						zIndex: zIndexList.RsLines,
						backgroundColor: "#d51079",
					}}
				>
					{rsLineHor.type.endsWith("_left") || rsLineHor.type === "outsideLeft" ? (
						<ToolTipLeft>{`${formatNumberToString(MM_TO_CM(distance))} cm`}</ToolTipLeft>
					) : (
						<ToolTipRight>{`${formatNumberToString(MM_TO_CM(distance))} cm`}</ToolTipRight>
					)}
				</div>
			</React.Fragment>
		);
	}, [rsLineHor, snapOffset.x, zoomFactor]);

	const closestVertical = React.useMemo(() => {
		if (rsLineVert === null) {
			return null;
		}
		const distance =
			rsLineVert.type.endsWith("_top") || rsLineVert.type === "overlapBottom" || rsLineVert.type === "outsideTop"
				? rsLineVert.end.y.value - rsLineVert.start.y.value - snapOffset.y.value
				: rsLineVert.end.y.value - rsLineVert.start.y.value + snapOffset.y.value;
		const top =
			rsLineVert.type.endsWith("_top") || rsLineVert.type === "overlapBottom" || rsLineVert.type === "outsideTop"
				? (rsLineVert.start.y.value + snapOffset.y.value) * zoomFactor
				: rsLineVert.start.y.value * zoomFactor;
		const posStyle = {
			position: "absolute",
			top: MM_TO_PX(top),
			left: MM_TO_PX(rsLineVert.start.x.value) * zoomFactor,
			height: zoomFactor * MM_TO_PX(distance),
			pointerEvents: "none",
		};
		const width = MM_TO_PX(rsLineVert.dim) * zoomFactor;

		const calculateLeftPosition = (rsLineType: string, baseLeft: number, width: number): number => {
			if (rsLineType.startsWith("same_start")) {
				return baseLeft;
			}
			if (rsLineType.startsWith("same_end")) {
				return baseLeft - width;
			}
			return baseLeft - width / 2;
		};

		const leftRect = calculateLeftPosition(rsLineVert.type, posStyle.left, width);
		return (
			<React.Fragment key="vertRsFragment">
				<div
					key="vertRsLineRect"
					style={{
						...(posStyle as React.CSSProperties),
						width,
						backgroundColor: "rgba(252, 209, 228, 0.7)",
						zIndex: zIndexList.rsLinesRect,
						left: leftRect,
					}}
				/>
				<div
					key="vertical"
					style={{
						...(posStyle as React.CSSProperties),
						width: 1,
						zIndex: zIndexList.RsLines,
						backgroundColor: "#d51079",
					}}
				>
					{rsLineVert.type.endsWith("_top") || rsLineVert.type === "outsideTop" ? (
						<ToolTipTop>{`${formatNumberToString(MM_TO_CM(distance))} cm`}</ToolTipTop>
					) : (
						<ToolTipBottom>{`${formatNumberToString(MM_TO_CM(distance))} cm`}</ToolTipBottom>
					)}
				</div>
			</React.Fragment>
		);
	}, [rsLineVert, snapOffset.y, zoomFactor]);

	const relationShipLines = React.useMemo(
		() => [closestHorizontal, closestVertical],
		[closestHorizontal, closestVertical]
	);

	const borderLineItem: Placeable = React.useMemo(() => {
		let yPos = item.position.y.value + differenceOffset.y.value + snapOffset.y.value;
		let xPos = item.position.x.value + differenceOffset.x.value + snapOffset.x.value;
		if (item.newType) {
			const { top = 0, left = 0 } = editorState?.getBoundingClientRect() || {};
			const { x: clientX = 0, y: clientY = 0 } = clientOffset || {};
			xPos = PX_TO_MM(clientX - left) / zoomFactor + snapOffset.x.value;
			yPos = PX_TO_MM(clientY - top) / zoomFactor + snapOffset.y.value;
		}

		return {
			position: {
				id: "",
				x: createMmMeasure(xPos),
				y: createMmMeasure(yPos),
			},
			dimensions: {
				id: "",
				minWidth: mainTarget?.dimensions?.minWidth || createMmMeasure(0),
				minHeight: mainTarget?.dimensions?.minHeight || createMmMeasure(0),
			},
		};
	}, [
		clientOffset,
		differenceOffset.x.value,
		differenceOffset.y.value,
		editorState,
		item.newType,
		item.position.x.value,
		item.position.y.value,
		mainTarget?.dimensions,
		snapOffset.x.value,
		snapOffset.y.value,
		zoomFactor,
	]);
	return isDragging && isOver && mainTarget?.dimensions && differenceOffset ? (
		<>
			<StyledDragLayerContainer zIndex={zIndexList.DragLayerContainer}>
				<PreviewElementContainer
					newPos={newPos}
					mainTarget={mainTarget}
					selected={selected}
					snapOffset={snapOffset}
					zoomFactor={zoomFactor}
					newType={item.newType}
				/>
			</StyledDragLayerContainer>
			{!isOverlapping && (
				<>
					<BorderLines
						zoomFactor={zoomFactor}
						item={borderLineItem}
						rsLines={relationShipLines}
						bodyState={bodyState}
						editorState={editorState}
					/>
					{relationShipLines}
				</>
			)}
		</>
	) : null;
};

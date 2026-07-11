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
import { useDispatch, useSelector } from "react-redux";

import { StageRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { Measure, PartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/model";

import { EditorConst } from "../../constant/editor.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import type { OmitId } from "../../utils/index.js";
import {
	changeMmMeasureValue,
	createPlainMmMeasure,
	createPlainMmMeasureFromPx,
	EditorUtils,
	formatNumberToString,
} from "../../utils/index.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import { TransactionLogStateActions } from "../../redux/index.js";
import { InteractionLogActions } from "../../redux//interaction-log/index.js";
import { RESOURCE_KEYS } from "../../localization/index.js";
import { useGetSectionOffset } from "../../hooks/use-get-section-offset.js";
import type { ISide } from "../../types/resize.js";
import { useUpdateDimensionsHandler } from "../../hooks/use-update-dimensions-handler.js";

import { ToolTipRight, ToolTipTop } from "../tool-tips/ToolTips.styled.js";
import { EditorContext } from "../editor-stage/editor-context.js";

import { useResizeRelationLines } from "./hooks/use-resize-relation-lines.js";
import { HorizontalResizeRelationLine, VerticalResizeRelationLine } from "./ResizeRelationLine.js";
import { GhostLineBox } from "./GhostLineBox.js";
import { useRegisterResizeMouseEvents } from "./hooks/use-register-resize-mouse-events.js";
import { useResizeInfo } from "./hooks/use-resize-info.js";
import { ResizeableWrapper } from "./ResizeableWrapper.js";

const zIndexList = EditorConst.getZIndexList();
const { MM_TO_CM, MM_TO_PX, PX_TO_MM } = EditorConst;

const MIN_WIDTH = 3;
const MIN_HEIGHT = 3;

interface Props {
	selected: string[];
	isDragging: boolean;
	setOutOfBoxList: React.Dispatch<React.SetStateAction<string[]>>;
	editorState: HTMLDivElement | null;
	setIsResizing: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Resizable = ({ selected, isDragging, setOutOfBoxList, editorState, setIsResizing }: Props) => {
	const { elementReferences, setElementReferences } = React.useContext(EditorContext);
	const { editorOptions } = useSelector(PrintEngineSelectors.printEditorState);
	const wrapperContainerElement = useSelector((state: PrintEngineState) =>
		PrintEngineSelectors.wrapperContainerElement(state, selected[0])
	);
	const { zoomFactor } = editorOptions;
	const dispatch = useDispatch();
	const getSectionOffset = useGetSectionOffset();

	const [startPosX, setStartPosX] = React.useState<OmitId<Measure>>(createPlainMmMeasure(0));
	const [startPosY, setStartPosY] = React.useState<OmitId<Measure>>(createPlainMmMeasure(0));
	const { resizeInfoRef, resizeInfo, setResizeInfo } = useResizeInfo();

	const { rsLineHor, rsLineVert, calculateRelationLines, clearRelationLines } = useResizeRelationLines();

	const updateElementDimensions = useUpdateDimensionsHandler();

	const resizeHandler = React.useCallback(
		(e: MouseEvent) => {
			const info = resizeInfoRef.current;
			if (!info) {
				return;
			}
			const { side, updatedElement: curEl } = info;

			function calculateDiffX() {
				if (side === "left") {
					return startPosX.value - PX_TO_MM(e.pageX / zoomFactor);
				}
				return PX_TO_MM(e.pageX / zoomFactor) - startPosX.value;
			}

			function calculateDiffY() {
				if (side === "top") {
					return startPosY.value - PX_TO_MM(e.pageY / zoomFactor);
				}
				return PX_TO_MM(e.pageY / zoomFactor) - startPosY.value;
			}

			const diffX = calculateDiffX();
			const diffY = calculateDiffY();

			const currentDiff = {
				x: createPlainMmMeasure(diffX),
				y: createPlainMmMeasure(diffY),
			};
			const isHorizontal = side === "left" || side === "right";
			const hasHorizontalChange = isHorizontal && currentDiff.x.value !== 0;
			const hasVerticalChange = !isHorizontal && currentDiff.y.value !== 0;
			const hasChanged = hasHorizontalChange || hasVerticalChange;

			if (!hasChanged) {
				return;
			}

			const { newWidth, newHeight, newX, newY } = calculateNewDimensions(curEl, currentDiff, side, isHorizontal);

			const newEl = {
				...curEl,
				dimensions: {
					...curEl.dimensions,
					minWidth: changeMmMeasureValue(newWidth, curEl.dimensions.minWidth),
					minHeight: changeMmMeasureValue(newHeight, curEl.dimensions.minHeight),
				},
				position: {
					...curEl.position,
					x: changeMmMeasureValue(newX, curEl.position.x),
					y: changeMmMeasureValue(newY, curEl.position.y),
				},
			};

			calculateRelationLines(newEl, side);

			isHorizontal
				? setStartPosX(createPlainMmMeasureFromPx(e.pageX / zoomFactor))
				: setStartPosY(createPlainMmMeasureFromPx(e.pageY / zoomFactor));
			setElementReferences(oldList => oldList.map(el => (el.refId !== curEl.refId ? el : newEl)));
			setResizeInfo(prev =>
				prev
					? {
							...prev,
							hasChanged: true,
							updatedElement: newEl,
						}
					: prev
			);
		},
		[
			resizeInfoRef,
			calculateRelationLines,
			zoomFactor,
			setElementReferences,
			setResizeInfo,
			startPosX.value,
			startPosY.value,
		]
	);

	const startResize = React.useCallback(
		(el: PartialValidPlaceableReference, pos: OmitId<Measure>, side: ISide) => {
			setIsResizing(true);
			const position = {
				...pos,
				value: Math.floor(pos.value / zoomFactor),
			};
			side === "left" || side === "right" ? setStartPosX(position) : setStartPosY(position);
			setResizeInfo({ updatedElement: el, originalElement: el, side, hasChanged: false });
		},
		[setIsResizing, setResizeInfo, zoomFactor]
	);

	const stopResize = React.useCallback(() => {
		const info = resizeInfoRef.current;
		if (!info) {
			return;
		}
		setIsResizing(false);
		clearRelationLines();
		setResizeInfo(null);

		if (!info.hasChanged) {
			return;
		}

		if (wrapperContainerElement) {
			const curEl = info.updatedElement;
			updateElementDimensions({
				description: RESOURCE_KEYS.interaction.resizable.resizeElement,
				dimensions: {
					height: curEl?.dimensions.minHeight.value,
					width: curEl?.dimensions.minWidth.value,
				},
				elementReferences: [...elementReferences],
				targetElement: wrapperContainerElement,
			});
		} else {
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.resizable.resizeElement,
					region: StageRegion.DEFAULT,
					transactionLogActions: [
						TransactionLogStateActions.updateReferenceElements({
							data: [...elementReferences],
						}),
					],
				})
			);
		}
		if (editorState) {
			const editorClientRect = editorState.getBoundingClientRect();
			const boxRect = {
				x: createPlainMmMeasureFromPx(editorClientRect.x),
				y: createPlainMmMeasureFromPx(editorClientRect.y),
				minWidth: createPlainMmMeasureFromPx(editorClientRect.width / zoomFactor),
				minHeight: createPlainMmMeasureFromPx(editorClientRect.height / zoomFactor),
			};
			setOutOfBoxList(EditorUtils.checkAllElementsInBox(elementReferences, boxRect).map(el => el.refId));
		}
	}, [
		resizeInfoRef,
		setIsResizing,
		clearRelationLines,
		setResizeInfo,
		wrapperContainerElement,
		editorState,
		updateElementDimensions,
		elementReferences,
		dispatch,
		zoomFactor,
		setOutOfBoxList,
	]);

	const [startOffset, midOffset, sectionHeightOffset] = React.useMemo(() => {
		if (!resizeInfo) {
			return [0, 0, 0];
		}
		const startOffset = getSectionOffset(
			resizeInfo.updatedElement.position.y.value,
			resizeInfo.updatedElement.position.y.value + resizeInfo.updatedElement.dimensions.minHeight.value,
			resizeInfo.updatedElement
		);
		const midOffset = getSectionOffset(
			resizeInfo.updatedElement.position.y.value,
			resizeInfo.updatedElement.position.y.value + resizeInfo.updatedElement.dimensions.minHeight.value / 2,
			resizeInfo.updatedElement
		);
		const sectionHeightOffset = getSectionOffset(
			resizeInfo.originalElement.position.y.value,
			resizeInfo.originalElement.position.y.value + resizeInfo.originalElement.dimensions.minHeight.value,
			resizeInfo.originalElement
		);
		return [startOffset, midOffset, sectionHeightOffset];
	}, [getSectionOffset, resizeInfo]);

	useRegisterResizeMouseEvents({ resizeHandler, stopResize });

	return selected.length !== 1 || isDragging ? null : (
		<>
			{elementReferences
				.filter(el => selected.includes(el.refId))
				.map(el => (
					<ResizeableWrapper
						zoomFactor={zoomFactor}
						placeableRef={el}
						startResize={startResize}
						key={el.refId}
					/>
				))}
			{resizeInfo &&
				(resizeInfo.side === "left" || resizeInfo.side === "right" ? (
					<div
						style={{
							position: "absolute",
							top: MM_TO_PX(
								(resizeInfo.updatedElement.position.y.value +
									resizeInfo.updatedElement.dimensions.minHeight.value +
									startOffset) *
									zoomFactor
							),
							left: MM_TO_PX(
								(resizeInfo.updatedElement.position.x.value +
									resizeInfo.updatedElement.dimensions.minWidth.value / 2) *
									zoomFactor
							),
							zIndex: zIndexList.ResizeHandle,
						}}
					>
						<ToolTipTop>
							{`${formatNumberToString(MM_TO_CM(resizeInfo.updatedElement.dimensions.minWidth.value))} cm`}
						</ToolTipTop>
					</div>
				) : (
					<div
						style={{
							position: "absolute",
							top: MM_TO_PX(
								(resizeInfo.updatedElement.position.y.value +
									midOffset +
									resizeInfo.updatedElement.dimensions.minHeight.value / 2) *
									zoomFactor
							),
							left: MM_TO_PX(resizeInfo.updatedElement.position.x.value * zoomFactor),
							zIndex: zIndexList.ResizeHandle,
						}}
					>
						<ToolTipRight>
							{`${formatNumberToString(MM_TO_CM(resizeInfo.updatedElement.dimensions.minHeight.value))} cm`}
						</ToolTipRight>
					</div>
				))}
			<GhostLineBox
				originalElement={resizeInfo?.originalElement}
				zoomFactor={zoomFactor}
				sectionHeightOffset={sectionHeightOffset}
			/>
			<VerticalResizeRelationLine rsLineVert={rsLineVert} zoomFactor={zoomFactor} />
			<HorizontalResizeRelationLine rsLineHor={rsLineHor} zoomFactor={zoomFactor} />
		</>
	);
};

const calculateNewDimensions = (
	curEl: PartialValidPlaceableReference,
	currentDiff: { x: OmitId<Measure>; y: OmitId<Measure> },
	side: ISide,
	isHorizontal: boolean
) => {
	let newWidth = curEl.dimensions.minWidth.value;
	let newHeight = curEl.dimensions.minHeight.value;
	let newX = curEl.position.x.value;
	let newY = curEl.position.y.value;

	if (isHorizontal && newWidth + currentDiff.x.value >= MIN_WIDTH) {
		newWidth = newWidth + currentDiff.x.value;
		newX = side === "left" ? curEl.position.x.value - currentDiff.x.value : curEl.position.x.value;
	}

	if (!isHorizontal && newHeight + currentDiff.y.value >= MIN_HEIGHT) {
		newHeight = newHeight + currentDiff.y.value;
		newY = side === "top" ? curEl.position.y.value - currentDiff.y.value : curEl.position.y.value;
	}

	return { newWidth, newHeight, newX, newY };
};

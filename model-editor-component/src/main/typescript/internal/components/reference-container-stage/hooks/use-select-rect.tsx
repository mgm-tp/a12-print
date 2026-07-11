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
import { useDispatch } from "react-redux";

import type { PlainMeasureDimensions, PlainMeasurePosition } from "../../../utils/index.js";
import { createPlainMmMeasure, EditorUtils } from "../../../utils/index.js";
import { EditorConst } from "../../../constant/editor.js";
import { DetailViewActions } from "../../../redux/index.js";
import { useGetSectionOffset } from "../../../hooks/use-get-section-offset.js";
import { EditorContext } from "../../editor-stage/editor-context.js";

import { StyledSelectRect } from "../shared-components/Base.styled.js";

const { PX_TO_MM } = EditorConst;

export const useSelectRect = (
	editorState: HTMLDivElement | null,
	zoomFactor: number,
	setSelected: React.Dispatch<React.SetStateAction<string[]>>
) => {
	const dispatch = useDispatch();
	const [mouseDownTS, setMouseDownTS] = React.useState(0);
	const [selectRectStart, setSelectRectStart] = React.useState<PlainMeasurePosition | undefined>();
	const [selectRectDim, setSelectRectDim] = React.useState<PlainMeasureDimensions>();
	const { elementReferences } = React.useContext(EditorContext);
	const getSectionOffset = useGetSectionOffset();

	const selectRectMouseDown = React.useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			// Only take left click
			if (editorState && e.button === 0) {
				setMouseDownTS(Date.now());
				const editorRect = editorState.getBoundingClientRect();
				setSelectRectStart({
					x: createPlainMmMeasure(PX_TO_MM(e.clientX - editorRect.x) / zoomFactor),
					y: createPlainMmMeasure(PX_TO_MM(e.clientY - editorRect.y) / zoomFactor),
				});
			}
		},
		[editorState, zoomFactor]
	);

	const selectRectMouseMove = React.useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (editorState && selectRectStart) {
				const editorRect = editorState.getBoundingClientRect();
				setSelectRectDim({
					minWidth: createPlainMmMeasure(
						PX_TO_MM(e.clientX - editorRect.x) / zoomFactor - selectRectStart.x.value
					),
					minHeight: createPlainMmMeasure(
						PX_TO_MM(e.clientY - editorRect.y) / zoomFactor - selectRectStart.y.value
					),
				});
			}
		},
		[editorState, selectRectStart, zoomFactor]
	);

	const selectRectMouseUp = React.useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (Date.now() - mouseDownTS < 150) {
				if (!e.ctrlKey) {
					setSelected([]);
				}
			} else if (selectRectDim && selectRectStart) {
				const rectDim = {
					minWidth: createPlainMmMeasure(Math.abs(selectRectDim.minWidth.value)),
					minHeight: createPlainMmMeasure(Math.abs(selectRectDim.minHeight.value)),
				};
				const rectPos = {
					x: createPlainMmMeasure(
						selectRectDim.minWidth.value >= 0
							? selectRectStart.x.value
							: selectRectStart.x.value + selectRectDim.minWidth.value
					),
					y: createPlainMmMeasure(
						selectRectDim.minHeight.value >= 0
							? selectRectStart.y.value
							: selectRectStart.y.value + selectRectDim.minHeight.value
					),
				};

				const newSelected = elementReferences
					.filter(el => {
						const elOffset = getSectionOffset(
							el.position.y.value,
							el.position.y.value + el.dimensions.minHeight.value,
							el
						);
						return EditorUtils.isElementOverlapping(
							{ ...rectDim, ...rectPos },
							{
								...el.dimensions,
								...el.position,
								y: createPlainMmMeasure(el.position.y.value + elOffset),
							}
						);
					})
					.map(el => el.refId);
				setSelected(newSelected);

				if (newSelected.length === 1) {
					dispatch(DetailViewActions.updateVisibilityConfig({ selected: newSelected }));
				}
			}
			setSelectRectStart(undefined);
			setSelectRectDim(undefined);
		},
		[dispatch, elementReferences, getSectionOffset, mouseDownTS, selectRectDim, selectRectStart, setSelected]
	);

	const SelectRect = React.useMemo(
		() =>
			selectRectStart && selectRectDim ? (
				<StyledSelectRect {...{ zoomFactor, selectRectDim, selectRectStart }} />
			) : null,
		[selectRectDim, selectRectStart, zoomFactor]
	);

	return {
		selectRectMouseDown,
		selectRectMouseMove,
		selectRectMouseUp,
		SelectRect,
	};
};

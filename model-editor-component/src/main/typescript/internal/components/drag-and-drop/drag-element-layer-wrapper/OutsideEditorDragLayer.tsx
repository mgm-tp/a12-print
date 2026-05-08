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
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";

import { EditorConst } from "../../../constant/editor.js";
import { createPlainMmMeasure } from "../../../utils/index.js";
import { DragItem } from "../../../types/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";

import { BasicDragLayerProps } from "../create-drag-layer-wrapper.js";

import { StyledDragLayerContainer } from "./DragElementLayerWrapper.styled.js";
import { NewElementPreview } from "./NewElementPreview.js";

export type OutsideEditorDragLayer = BasicDragLayerProps<DragItem>;
const zIndexList = EditorConst.getZIndexList();
const { PX_TO_MM } = EditorConst;

export const OutsideEditorDragLayer = ({ dragLayerProperties }: OutsideEditorDragLayer) => {
	const { item, clientOffset } = dragLayerProperties;
	const { editorOptions } = useSelector(PrintEngineSelectors.printEditorState);
	const { zoomFactor } = editorOptions;

	const newPos = React.useMemo(
		() => ({
			x: createPlainMmMeasure(PX_TO_MM(clientOffset?.x || 0) / zoomFactor),
			y: createPlainMmMeasure(PX_TO_MM(clientOffset?.y || 0) / zoomFactor),
		}),
		[clientOffset?.x, clientOffset?.y, zoomFactor]
	);

	const snapOffset = React.useMemo(
		() => ({
			x: createPlainMmMeasure(0),
			y: createPlainMmMeasure(0),
		}),
		[]
	);

	return (
		<>
			{createPortal(
				<StyledDragLayerContainer zIndex={zIndexList.ElementLibrary}>
					{item.newType && (
						<NewElementPreview
							newType={item.newType}
							newPos={newPos}
							snapOffset={snapOffset}
							zoomFactor={zoomFactor}
						></NewElementPreview>
					)}
				</StyledDragLayerContainer>,
				document.body
			)}
		</>
	);
};

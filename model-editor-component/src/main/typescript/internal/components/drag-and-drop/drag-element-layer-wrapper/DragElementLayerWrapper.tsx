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

import { PlainMeasurePosition } from "../../../utils/index.js";
import { ElementTypes } from "../../../constant/elements.js";
import { DragItem } from "../../../types/index.js";

import { BasicDragLayerProps, createDragLayerWrapper, DragItemType } from "../create-drag-layer-wrapper.js";

import { OutsideEditorDragLayer } from "./OutsideEditorDragLayer.js";
import { InsideEditorDragLayer } from "./InsideEditorDragLayer.js";

export interface DragElementLayerWrapperProps extends BasicDragLayerProps<DragItem> {
	snapOffset: PlainMeasurePosition;
	setSnapOffset: React.Dispatch<React.SetStateAction<PlainMeasurePosition>>;
	selected: string[];
	isOver: boolean;
	bodyState: HTMLDivElement | null;
	editorState: HTMLDivElement | null;
}

const DragElementProvider = ({ dragLayerProperties, ...restProps }: DragElementLayerWrapperProps) => {
	const { editorState } = restProps;
	const { item, clientOffset } = dragLayerProperties;
	const {
		top: editorTopOffset = 0,
		left: editorLeftOffset = 0,
		width = 0,
		height = 0,
	} = editorState?.getBoundingClientRect() || {};
	const { x: pointerX = 0, y: pointerY = 0 } = clientOffset || {};

	const isElementInsideEditor =
		pointerX > editorLeftOffset &&
		pointerX < editorLeftOffset + width &&
		pointerY > editorTopOffset &&
		pointerY < editorTopOffset + height;
	if (!item.newType || isElementInsideEditor) {
		return <InsideEditorDragLayer {...restProps} dragLayerProperties={dragLayerProperties} />;
	}

	return <OutsideEditorDragLayer dragLayerProperties={dragLayerProperties} />;
};

export const DragElementLayerWrapper = createDragLayerWrapper(
	DragElementProvider,
	function isEditorElement(type: DragItemType) {
		return Object.keys(ElementTypes).includes(String(type));
	}
);

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

import type { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";

import { createMmMeasure, ElementsUtils } from "../../../utils/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import type { BasePreviewProps } from "../../../types/index.js";
import { EditorConst } from "../../../constant/editor.js";
import { ElementComponent } from "../../element-container/ElementComponent.js";
import { DEFAULT_TEXT_STYLE_ID } from "../../../constant/textstyle.js";
import { TEXT_PROPERTIES_PATH } from "../../../constant/element-property-path.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";

import { StyleDragPreviewElement } from "./DragElementLayerWrapper.styled.js";

const { MM_TO_PX } = EditorConst;

interface NewElementPreviewProps extends Omit<BasePreviewProps, "mainTarget"> {
	newType: ElementType;
}

export const NewElementPreview = ({ newType, newPos, snapOffset, zoomFactor }: NewElementPreviewProps) => {
	const currentContainer = useSelector(PrintEngineSelectors.currentContainerElement);

	if (!currentContainer) {
		throw new Error("Current container element is not defined.");
	}

	const { newEl, placeableReference } = ElementsUtils.createNewlyDroppedElement(
		newType,
		{
			x: createMmMeasure(0),
			y: createMmMeasure(0),
		},
		currentContainer
	);
	const style = {
		width: MM_TO_PX(placeableReference.dimensions.minWidth.value),
		height: MM_TO_PX(
			ElementsUtils.getFixedElementHeight(newEl, placeableReference) ||
				placeableReference.dimensions.minHeight.value
		),
		left: MM_TO_PX(newPos.x.value + snapOffset.x.value) * zoomFactor,
		top: MM_TO_PX(newPos.y.value + snapOffset.y.value) * zoomFactor,
	};
	const textStyle = useSelector((state: PrintEngineState) =>
		PrintEngineSelectors.textStyle(state, DEFAULT_TEXT_STYLE_ID)
	);
	const fonts = useSelector(PrintEngineSelectors.fonts);

	const elementStyles = React.useMemo(
		() => ElementsUtils.getElementStyles(newEl, TEXT_PROPERTIES_PATH, placeableReference, false, textStyle, fonts),
		[fonts, newEl, placeableReference, textStyle]
	);

	return (
		<StyleDragPreviewElement style={style} zoomFactor={zoomFactor}>
			<ElementComponent element={newEl} reference={placeableReference} styles={elementStyles} />
		</StyleDragPreviewElement>
	);
};

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

import {
	PartialAnyPrintModelElement,
	PartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { EditorConst } from "../../../constant/editor.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { FIXED_DIMENSIONS_ELEMENTS } from "../../../constant/elements.js";
import { InteractionLogActions } from "../../../redux/index.js";
import { changeMmMeasureValue, ElementsUtils } from "../../../utils/index.js";
import { EditorContext } from "../../editor-stage/editor-context.js";

const { PX_TO_MM } = EditorConst;

interface HeightContainerCalculationProps {
	item: PartialValidPlaceableReference;
	itemElement: PartialAnyPrintModelElement;
	isResizing: boolean;
	children?: React.ReactNode;
}

export const HeightCalculationContainer: React.FunctionComponent<HeightContainerCalculationProps> = ({
	item,
	itemElement,
	children,
	isResizing,
}) => {
	const dispatch = useDispatch();

	const { setElementReferences } = React.useContext(EditorContext);

	const zoomFactor = useSelector(PrintEngineSelectors.zoomFactor);

	const [dragContainerHeightNormalized, setDragContainerHeightNormalized] = React.useState<number>(
		item.dimensions.minHeight.value
	);
	const isHeightUpdating = React.useRef(false);

	const updateDragContainerHeight = (ref: HTMLDivElement | null) => {
		if (ref) {
			setDragContainerHeightNormalized(PX_TO_MM(Math.round(ref.getBoundingClientRect().height / zoomFactor)));
		}
	};

	React.useEffect(() => {
		if (
			FIXED_DIMENSIONS_ELEMENTS.includes(itemElement.type) ||
			item.dimensions.minHeight.value === dragContainerHeightNormalized ||
			ElementsUtils.isWrapperElement(itemElement)
		) {
			isHeightUpdating.current = false;
			return;
		}

		if (isResizing) {
			setElementReferences(oldList =>
				oldList.map(el =>
					el.refId !== item.refId
						? el
						: {
								...el,
								dimensions: {
									...el.dimensions,
									minHeight: changeMmMeasureValue(
										dragContainerHeightNormalized,
										el.dimensions.minHeight
									),
								},
							}
				)
			);
			return;
		}
		if (!isHeightUpdating.current) {
			isHeightUpdating.current = true;
			dispatch(
				InteractionLogActions.updateElementHeightDomNode({
					...item,
					dimensions: {
						...item.dimensions,
						minHeight: changeMmMeasureValue(dragContainerHeightNormalized, item.dimensions.minHeight),
					},
				})
			);
		}
	}, [dispatch, dragContainerHeightNormalized, isResizing, item, itemElement, setElementReferences]);
	return (
		<div
			ref={updateDragContainerHeight}
			style={ElementsUtils.isWrapperElement(itemElement) ? { height: "100%" } : undefined}
		>
			{children}
		</div>
	);
};

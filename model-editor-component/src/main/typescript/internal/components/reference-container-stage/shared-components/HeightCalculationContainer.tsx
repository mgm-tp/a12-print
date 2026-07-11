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

import type {
	PartialAnyPrintModelElement,
	PartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/model";

import { changeMmMeasureValue, ElementsUtils } from "../../../utils/index.js";
import { EditorContext } from "../../editor-stage/editor-context.js";
import { FIXED_DIMENSIONS_ELEMENTS } from "../../../constant/elements.js";
import { InteractionLogActions } from "../../../redux/index.js";

import { useMeasuredHeight } from "../hooks/use-measured-height.js";

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

	const { ref, heightMm } = useMeasuredHeight(item.dimensions.minHeight.value);

	React.useEffect(() => {
		if (
			FIXED_DIMENSIONS_ELEMENTS.includes(itemElement.type) ||
			item.dimensions.minHeight.value === heightMm ||
			ElementsUtils.isWrapperElement(itemElement)
		) {
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
									minHeight: changeMmMeasureValue(heightMm, el.dimensions.minHeight),
								},
							}
				)
			);
			return;
		}
		dispatch(
			InteractionLogActions.updateElementHeightDomNode({
				...item,
				dimensions: {
					...item.dimensions,
					minHeight: changeMmMeasureValue(heightMm, item.dimensions.minHeight),
				},
			})
		);
	}, [dispatch, heightMm, isResizing, item, itemElement, setElementReferences]);

	return (
		<div ref={ref} style={ElementsUtils.isWrapperElement(itemElement) ? { height: "100%" } : undefined}>
			{children}
		</div>
	);
};

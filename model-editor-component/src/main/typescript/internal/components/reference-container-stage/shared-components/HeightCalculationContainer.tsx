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

import type {
	PartialAnyPrintModelElement,
	PartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { GlobalRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { assertExists, changeMmMeasureValue, ElementsUtils } from "../../../utils/index.js";
import { EditorContext } from "../../editor-stage/editor-context.js";
import { FIXED_DIMENSIONS_ELEMENTS } from "../../../constant/elements.js";
import { InteractionLogActions, TransactionLogStateActions } from "../../../redux/index.js";
import { RESOURCE_KEYS } from "../../../localization/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";

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

	// On a referenced stage measuring is fine, but writing a correction would turn the reference into a definition.
	const { setElementReferences, isReadonly: isReadonlyStage } = React.useContext(EditorContext);

	// On the fragment stage item.dimensions lags redux by a render, so read the committed height instead - except
	// while resizing, where item.dimensions is the live drag value and the redux value would never converge.
	const committedFragmentHeight = useSelector((state: PrintEngineState) => {
		const fragmentElement = PrintEngineSelectors.currentFragmentElement(state);
		return fragmentElement?.id === item.refId ? fragmentElement.fragmentDimensions?.height.value : undefined;
	});
	const committedHeight = isResizing
		? item.dimensions.minHeight.value
		: (committedFragmentHeight ?? item.dimensions.minHeight.value);

	const { ref, heightMm } = useMeasuredHeight(committedHeight);

	// update wrong element fragment reference dimensions in case the user has discarded the automatically applied updates
	React.useEffect(() => {
		if (!item.model || isResizing || isReadonlyStage) {
			return;
		}
		assertExists(itemElement.fragmentDimensions, "Fragment element must have fragmentDimensions set");
		const ownWidth = itemElement.fragmentDimensions.width.value;
		const ownHeight = ElementsUtils.isFixedHeightElement(itemElement)
			? itemElement.fragmentDimensions.height.value
			: undefined; // non-fixed height elements are already corrected by the measurement useEffect below

		const widthMismatch = ownWidth !== item.dimensions.minWidth.value;
		const heightMismatch = ownHeight !== undefined && ownHeight !== item.dimensions.minHeight.value;
		if (!widthMismatch && !heightMismatch) {
			return;
		}
		dispatch(
			InteractionLogActions.start({
				description: RESOURCE_KEYS.interaction.other.fixInvalidElementHeights,
				region: GlobalRegion.SIDEBAR,
				preventUndo: true,
				transactionLogActions: [
					TransactionLogStateActions.updateReferenceElement({
						data: {
							...item,
							dimensions: {
								...item.dimensions,
								minWidth: widthMismatch
									? changeMmMeasureValue(ownWidth, item.dimensions.minWidth)
									: item.dimensions.minWidth,
								minHeight: heightMismatch
									? changeMmMeasureValue(ownHeight, item.dimensions.minHeight)
									: item.dimensions.minHeight,
							},
						},
					}),
				],
			})
		);
	}, [dispatch, isReadonlyStage, isResizing, item, itemElement]);

	React.useEffect(() => {
		if (
			FIXED_DIMENSIONS_ELEMENTS.includes(itemElement.type) ||
			committedHeight === heightMm ||
			ElementsUtils.isWrapperElement(itemElement)
		) {
			return;
		}

		if (isResizing) {
			setElementReferences(oldList =>
				oldList.map(el =>
					el.id !== item.id
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
		if (isReadonlyStage) {
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
	}, [dispatch, heightMm, isReadonlyStage, isResizing, item, itemElement, setElementReferences, committedHeight]);

	return (
		<div ref={ref} style={ElementsUtils.isWrapperElement(itemElement) ? { height: "100%" } : undefined}>
			{children}
		</div>
	);
};

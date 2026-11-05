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
import { useDispatch } from "react-redux";
import { useCallback } from "react";

import type {
	PartialAnyPrintModelElement,
	PartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { PartialArea, PartialBoundingBox, PartialSwitch } from "@com.mgmtp.a12.print/print-model-api/model";
import { StageRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import type { AnyTransactionLogAction } from "../redux/index.js";
import { InteractionLogActions, TransactionLogStateActions } from "../redux/index.js";
import { ElementsUtils } from "../utils/elements-utils.js";

interface ResizeParams {
	targetElement: PartialAnyPrintModelElement;
	elementReferences: PartialValidPlaceableReference[];
	dimensions: { height?: number; width?: number };
	description: string;
}

export const useUpdateDimensionsHandler = () => {
	const dispatch = useDispatch();

	return useCallback(
		({ description, dimensions, elementReferences, targetElement }: ResizeParams) => {
			const actions: AnyTransactionLogAction[] = [
				TransactionLogStateActions.updateReferenceElements({
					data: elementReferences,
				}),
			];

			if (!ElementsUtils.isFixedHeightElement(targetElement)) {
				dispatch(
					InteractionLogActions.start({
						description,
						region: StageRegion.DEFAULT,
						transactionLogActions: actions,
					})
				);
				return;
			}

			const updatedElement = ElementsUtils.withOwnDimensions(targetElement, dimensions);
			// Area/BoundingBox/Switch are committed via their own dedicated action rather than
			// updatePrintModelElements - see TransactionLogStateActions.updateArea/updateBoundingBox/updateSwitch.
			if (PartialArea.isInstance(updatedElement)) {
				actions.push(TransactionLogStateActions.updateArea({ data: updatedElement }));
			} else if (PartialBoundingBox.isInstance(updatedElement)) {
				actions.push(TransactionLogStateActions.updateBoundingBox({ data: updatedElement }));
			} else if (PartialSwitch.isInstance(updatedElement)) {
				actions.push(TransactionLogStateActions.updateSwitch({ data: updatedElement }));
			} else {
				actions.push(TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }));
			}

			dispatch(
				InteractionLogActions.start({
					description,
					region: StageRegion.DEFAULT,
					transactionLogActions: actions,
				})
			);
		},
		[dispatch]
	);
};

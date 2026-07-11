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
import { nanoid } from "nanoid";

import type {
	Measure,
	PartialAnyPrintModelElement,
	PartialValidPlaceableReference,
	PrintModelEntity,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	PartialArea,
	PartialBarChart,
	PartialBoundingBox,
	PartialImage,
	PartialLineChart,
	PartialPieChart,
	PartialSwitch,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { StageRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/utils";

import type { AnyTransactionLogAction } from "../redux/index.js";
import { InteractionLogActions, TransactionLogStateActions } from "../redux/index.js";
import { ElementsUtils } from "../utils/elements-utils.js";
import { changePartialMmMeasureValue } from "../utils/index.js";

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

			if (PartialPieChart.isInstance(targetElement)) {
				const updatedElement: PartialPieChart = {
					...targetElement,
					pieChart: {
						id: nanoid(),
						...targetElement.pieChart,
						dimensions: {
							...targetElement.pieChart?.dimensions,
							id: targetElement.pieChart?.dimensions?.id || nanoid(),
							...updateDimensions(dimensions, targetElement.pieChart?.dimensions),
						},
					},
				};
				actions.push(TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }));
			} else if (PartialBarChart.isInstance(targetElement)) {
				const updatedElement: PartialBarChart = {
					...targetElement,
					barChart: {
						id: nanoid(),
						...targetElement.barChart,
						dimensions: {
							...targetElement.barChart?.dimensions,
							id: targetElement.barChart?.dimensions?.id || nanoid(),
							...updateDimensions(dimensions, targetElement.barChart?.dimensions),
						},
					},
				};
				actions.push(TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }));
			} else if (PartialLineChart.isInstance(targetElement)) {
				const updatedElement = {
					...targetElement,
					lineChart: {
						id: nanoid(),
						...targetElement.lineChart,
						dimensions: {
							...targetElement.lineChart?.dimensions,
							id: targetElement.lineChart?.dimensions?.id || nanoid(),
							...updateDimensions(dimensions, targetElement.lineChart?.dimensions),
						},
					},
				};

				actions.push(TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }));
			} else if (PartialImage.isInstance(targetElement)) {
				const updatedElement: PartialImage = {
					...targetElement,
					image: {
						id: nanoid(),
						...targetElement.image,
						dimensions: {
							...targetElement.image?.dimensions,
							id: targetElement.image?.dimensions?.id || nanoid(),
							...updateDimensions(dimensions, targetElement.image?.dimensions),
						},
					},
				};
				actions.push(TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }));
			} else if (PartialBoundingBox.isInstance(targetElement)) {
				const boundingBox: PartialBoundingBox = {
					...targetElement,
					boundingBox: {
						id: nanoid(),
						...targetElement.boundingBox,
						dimensions: {
							...targetElement.boundingBox?.dimensions,
							id: targetElement.boundingBox?.dimensions?.id || nanoid(),
							...updateDimensions(dimensions, targetElement.boundingBox?.dimensions),
						},
					},
				};

				actions.push(
					TransactionLogStateActions.updateBoundingBox({
						data: boundingBox,
					})
				);
			} else if (PartialArea.isInstance(targetElement)) {
				const area: PartialArea = {
					...targetElement,
					area: {
						id: nanoid(),
						...targetElement.area,
						dimensions: {
							...targetElement.area?.dimensions,
							id: targetElement.area?.dimensions?.id || nanoid(),
							...updateDimensions(dimensions, targetElement.area?.dimensions),
						},
					},
				};
				actions.push(
					TransactionLogStateActions.updateArea({
						data: area,
					})
				);
			} else if (PartialSwitch.isInstance(targetElement)) {
				const switchElement: PartialSwitch = {
					...targetElement,
					switch: {
						id: nanoid(),
						...targetElement.switch,
						dimensions: {
							...targetElement.switch?.dimensions,
							id: targetElement.switch?.dimensions?.id || nanoid(),
							...updateDimensions(dimensions, targetElement.switch?.dimensions),
						},
					},
				};
				actions.push(
					TransactionLogStateActions.updateSwitch({
						data: switchElement,
					})
				);
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

function updateDimensions(
	change: { height?: number; width?: number },
	origin?: {
		width?: DeepPartialRecursive<Measure> & PrintModelEntity;
		height?: DeepPartialRecursive<Measure> & PrintModelEntity;
	}
) {
	let newDimensions = { ...origin };

	if ("height" in change) {
		newDimensions = {
			...newDimensions,
			height: change.height ? changePartialMmMeasureValue(change.height, origin?.height) : undefined,
		};
	}

	if ("width" in change) {
		newDimensions = {
			...newDimensions,
			width: change.width ? changePartialMmMeasureValue(change.width, origin?.width) : undefined,
		};
	}
	return newDimensions;
}

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
import { nanoid } from "nanoid";

import { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";
import {
	Margins,
	MarginType,
	PartialValidPlaceableReference,
	PrintModelEntity,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { EditorConst } from "../constant/editor.js";
import { LimitZone, MarginSide } from "../types/margin.js";

import { changePartialMmMeasureValue } from "./measure-utils.js";
import { ElementsUtils } from "./elements-utils.js";
import { EditorUtils } from "./editor-utils.js";

const { PX_TO_MM } = EditorConst;

export function changePartialMarginValue(
	value: number,
	side: MarginSide,
	origin?: DeepPartialRecursive<Margins> & PrintModelEntity,
	marginType: MarginType = MarginType.EXPLICIT
): DeepPartialRecursive<Margins> & PrintModelEntity {
	const margin = origin?.[side];

	return {
		...origin,
		id: origin?.id || nanoid(),
		[side]: value
			? {
					...margin,
					id: margin?.id || nanoid(),
					type: margin?.type || marginType,
					margin: changePartialMmMeasureValue(value, margin?.margin),
				}
			: undefined,
	};
}

interface CalculateNewMarginParams {
	isTop: boolean;
	currentClientY: number;
	anchorClientY: number;
	limitPosY: number;
	zoomFactor: number;
	reference: PartialValidPlaceableReference;
}
export function calculateNewMargin({
	isTop,
	currentClientY,
	anchorClientY,
	limitPosY,
	zoomFactor,
	reference,
}: CalculateNewMarginParams): [number, boolean] {
	let marginValueInMM = 0;
	let isSkip = false;
	if (isTop && currentClientY < anchorClientY) {
		marginValueInMM = PX_TO_MM((anchorClientY - currentClientY) / zoomFactor);
		const topMarginPosY = reference.position.y.value - marginValueInMM;
		isSkip = topMarginPosY < limitPosY;
	} else if (!isTop && currentClientY > anchorClientY) {
		marginValueInMM = PX_TO_MM((currentClientY - anchorClientY) / zoomFactor);
		const bottomMarginPosY = reference.position.y.value + reference.dimensions.minHeight.value + marginValueInMM;
		isSkip = limitPosY > 0 && bottomMarginPosY > limitPosY;
	}
	return [marginValueInMM, isSkip];
}

export function getLimitTopValue(limitElementValue?: number, limitZone?: LimitZone) {
	const limitZoneValue = limitZone?.top?.value;
	return limitElementValue && limitZoneValue
		? Math.max(limitElementValue, limitZoneValue)
		: limitZoneValue || limitElementValue;
}

export function getLimitBottomValue(limitElementValue?: number, limitZone?: LimitZone) {
	const limitZoneValue = limitZone?.bottom?.value;
	return limitZoneValue && limitElementValue
		? Math.min(limitZoneValue, limitElementValue)
		: limitZoneValue || limitElementValue;
}

export function getLimitElement(
	elementReferences: readonly PartialValidPlaceableReference[],
	reference: PartialValidPlaceableReference
) {
	let topElement: PartialValidPlaceableReference | undefined = undefined;
	let bottomElement: PartialValidPlaceableReference | undefined = undefined;
	elementReferences.forEach(otherReference => {
		if (otherReference.refId === reference.refId || !EditorUtils.isHorizontallyOverlap(reference, otherReference)) {
			return;
		}

		if (otherReference.position.y.value < reference.position.y.value) {
			if (!topElement) {
				topElement = otherReference;
			} else if (
				ElementsUtils.getActualBottomPosition(otherReference) >
				ElementsUtils.getActualBottomPosition(topElement)
			) {
				topElement = otherReference;
			}
			return;
		}

		if (!bottomElement) {
			bottomElement = otherReference;
			return;
		} else if (
			ElementsUtils.getActualTopPosition(otherReference) < ElementsUtils.getActualTopPosition(bottomElement)
		) {
			bottomElement = otherReference;
		}
	});
	return [
		topElement ? ElementsUtils.getActualBottomPosition(topElement) : undefined,
		bottomElement ? ElementsUtils.getActualTopPosition(bottomElement) : undefined,
	];
}

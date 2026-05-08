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
import { useSelector } from "react-redux";
import { useCallback } from "react";

import {
	isPartialSection,
	isPartialSegment,
	PartialSection,
	PartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { PrintEngineSelectors } from "../store/selectors.js";
import { createPlainMmMeasure, PlainMeasureDimensions, PlainMeasurePosition } from "../utils/measure-utils.js";
import { EditorUtils } from "../utils/editor-utils.js";

export const useIsElementInsideStage = () => {
	const currentContainerElement = useSelector(PrintEngineSelectors.currentContainerElement);
	const currentWrapperContainer = useSelector(PrintEngineSelectors.currentWrapperContainer);
	const editorDimensions = useSelector(PrintEngineSelectors.editorDimensions);
	const currentAppliedSection = useSelector(PrintEngineSelectors.segmentSection);

	return useCallback(
		(reference: PartialValidPlaceableReference): boolean => {
			const elementRect: PlainMeasurePosition & PlainMeasureDimensions = {
				minHeight: reference.dimensions.minHeight,
				minWidth: reference.dimensions.minWidth,
				x: reference.position.x,
				y: reference.position.y,
			};

			if (currentWrapperContainer) {
				return EditorUtils.isElementInBox(
					{
						x: createPlainMmMeasure(0),
						y: createPlainMmMeasure(0),
						...editorDimensions,
					},
					elementRect
				);
			}

			if (!currentContainerElement) {
				return false;
			}

			if (isPartialSection(currentContainerElement)) {
				return isElementInsideSection(currentContainerElement, editorDimensions, elementRect);
			}

			if (isPartialSegment(currentContainerElement)) {
				return isElementInsideSegment(reference, editorDimensions, currentAppliedSection);
			}

			return false;
		},
		[currentAppliedSection, currentContainerElement, currentWrapperContainer, editorDimensions]
	);
};

const isElementInsideSection = (
	currentContainerElement: PartialSection,
	editorDimensions: PlainMeasureDimensions,
	elementRect: PlainMeasurePosition & PlainMeasureDimensions
): boolean => {
	if (!currentContainerElement.footerHeight?.value && !currentContainerElement.headerHeight?.value) {
		return false;
	}

	let headerBoxRect;
	let footerBoxRect;

	const containerBox = {
		x: createPlainMmMeasure(0),
		y: createPlainMmMeasure(0),
		...editorDimensions,
	};

	if (currentContainerElement.headerHeight?.value) {
		headerBoxRect = {
			...containerBox,
			minHeight: createPlainMmMeasure(currentContainerElement.headerHeight.value),
		};
	}

	if (currentContainerElement.footerHeight?.value) {
		footerBoxRect = {
			...containerBox,
			y: createPlainMmMeasure(editorDimensions.minHeight.value - currentContainerElement.footerHeight.value),
			minHeight: createPlainMmMeasure(currentContainerElement.footerHeight.value),
		};
	}

	const isInsideFooter = footerBoxRect ? EditorUtils.isElementInBox(footerBoxRect, elementRect) : false;
	const isInsideHeader = headerBoxRect ? EditorUtils.isElementInBox(headerBoxRect, elementRect) : false;
	return isInsideFooter || isInsideHeader;
};

const isElementInsideSegment = (
	reference: PartialValidPlaceableReference,
	editorDimensions: PlainMeasureDimensions,
	currentAppliedSection: PartialSection | undefined
): boolean => {
	const elementRect: PlainMeasurePosition & PlainMeasureDimensions = {
		minHeight: reference.dimensions.minHeight,
		minWidth: reference.dimensions.minWidth,
		x: reference.position.x,
		y: createPlainMmMeasure(reference.position.y.value % editorDimensions.minHeight.value),
	};

	function getHeaderBox(): (PlainMeasurePosition & PlainMeasureDimensions) | undefined {
		if (!currentAppliedSection?.headerHeight?.value) {
			return undefined;
		}
		return {
			...editorDimensions,
			x: createPlainMmMeasure(0),
			y: createPlainMmMeasure(0),
			minHeight: createPlainMmMeasure(currentAppliedSection.headerHeight.value),
		};
	}

	function getFooterBox(): (PlainMeasurePosition & PlainMeasureDimensions) | undefined {
		if (!currentAppliedSection?.footerHeight?.value) {
			return undefined;
		}
		return {
			...editorDimensions,
			x: createPlainMmMeasure(0),
			y: createPlainMmMeasure(editorDimensions.minHeight.value - currentAppliedSection.footerHeight.value),
		};
	}

	const headerBox = getHeaderBox();
	const footerBox = getFooterBox();

	const isOverlapHeader = headerBox && EditorUtils.isElementOverlapping(headerBox, elementRect, true);
	const isOverlapFooter = footerBox && EditorUtils.isElementOverlapping(footerBox, elementRect, true);

	if (isOverlapHeader || isOverlapFooter) {
		return false;
	}

	return EditorUtils.isElementInBox(
		{
			x: createPlainMmMeasure(0),
			y: createPlainMmMeasure(0),
			...editorDimensions,
		},
		{
			...elementRect,
			y: createPlainMmMeasure(elementRect.y.value % editorDimensions.minHeight.value),
		}
	);
};

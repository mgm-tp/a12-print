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
import {
	PageOrientation,
	SectionUsage,
	PartialValidPlaceableReference,
	PartialSection,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { PrintModelDTO } from "@com.mgmtp.a12.print/print-model-api/lib/generated/internal/dto/PrintModelDTO.js";

import { PlainMeasureDimensions, PlainMeasurePosition, createPlainMmMeasure } from "./measure-utils.js";
import { OmitId } from "./type-utils.js";
import { ElementsUtils } from "./elements-utils.js";

const FIRST_PAGE_NUMBER = 1;

export namespace EditorUtils {
	export function isColliding(curRef: PartialValidPlaceableReference, nextRef: PartialValidPlaceableReference) {
		if (curRef.refId === nextRef.refId) {
			return false;
		}
		return (
			curRef.position.x.value < nextRef.position.x.value + nextRef.dimensions.minWidth.value &&
			curRef.position.x.value + curRef.dimensions.minWidth.value > nextRef.position.x.value &&
			ElementsUtils.getActualTopPosition(curRef) < ElementsUtils.getActualBottomPosition(nextRef) &&
			ElementsUtils.getActualBottomPosition(curRef) > ElementsUtils.getActualTopPosition(nextRef)
		);
	}

	export function checkCollisionsAll(placeableReferences: ReadonlyArray<PartialValidPlaceableReference>) {
		return placeableReferences.reduce((res: ReadonlyArray<PartialValidPlaceableReference>, dragElRef) => {
			const collisions = checkCollisionsSingle(dragElRef, placeableReferences);
			collisions.forEach(collisionEl => {
				if (!res.find(resEl => resEl.refId === collisionEl.refId)) {
					res = [...res, collisionEl];
				}
			});
			return res;
		}, []);
	}

	export function checkCollisionsSingle(
		elRef: PartialValidPlaceableReference,
		placeableReferences: ReadonlyArray<PartialValidPlaceableReference>
	) {
		return placeableReferences.filter(placeableReference => isColliding(elRef, placeableReference));
	}

	export function checkAllElementsInBox(
		placeableReferences: ReadonlyArray<PartialValidPlaceableReference>,
		boxRect: PlainMeasurePosition & PlainMeasureDimensions
	) {
		return placeableReferences.reduce((res: ReadonlyArray<PartialValidPlaceableReference>, nextEl) => {
			const elRect = {
				x: createPlainMmMeasure(nextEl.position.x.value + boxRect.x.value),
				y: createPlainMmMeasure(ElementsUtils.getActualTopPosition(nextEl) + boxRect.y.value),
				minWidth: createPlainMmMeasure(nextEl.dimensions.minWidth.value),
				minHeight: createPlainMmMeasure(
					nextEl.dimensions.minHeight.value +
						(nextEl.margins?.top?.margin?.value || 0) +
						(nextEl.margins?.bottom?.margin?.value || 0)
				),
			};
			if (!isElementInBox(boxRect, elRect)) {
				res = [...res, nextEl];
			}
			return res;
		}, []);
	}

	export function isElementInBox(
		boxRect: PlainMeasurePosition & PlainMeasureDimensions,
		elRect: PlainMeasurePosition & PlainMeasureDimensions
	) {
		return (
			elRect.x.value + elRect.minWidth.value <= boxRect.x.value + boxRect.minWidth.value &&
			elRect.x.value >= boxRect.x.value &&
			elRect.y.value >= boxRect.y.value &&
			elRect.y.value + elRect.minHeight.value <= boxRect.y.value + boxRect.minHeight.value
		);
	}

	export function getRealPage(realPos: number, editorDimensionsMinHeight: number) {
		return Math.floor(realPos / editorDimensionsMinHeight);
	}

	export function isCloserToTopLeft(
		targetPos: PlainMeasurePosition,
		otherPos: PlainMeasurePosition,
		boxPos: PlainMeasurePosition = { x: createPlainMmMeasure(0), y: createPlainMmMeasure(0) }
	) {
		const distanceTarget = distanceToTopLeft(boxPos, targetPos);
		const distanceOther = distanceToTopLeft(boxPos, otherPos);
		return distanceTarget <= distanceOther;
	}

	export function isElementOverlapping(
		elRect: PlainMeasurePosition & PlainMeasureDimensions,
		otherRect: PlainMeasurePosition & PlainMeasureDimensions,
		strict = false
	) {
		if (strict) {
			return (
				elRect.x.value + elRect.minWidth.value > otherRect.x.value &&
				elRect.x.value < otherRect.x.value + otherRect.minWidth.value &&
				elRect.y.value + elRect.minHeight.value > otherRect.y.value &&
				elRect.y.value < otherRect.y.value + otherRect.minHeight.value
			);
		}
		return (
			elRect.x.value + elRect.minWidth.value >= otherRect.x.value &&
			elRect.x.value <= otherRect.x.value + otherRect.minWidth.value &&
			elRect.y.value + elRect.minHeight.value >= otherRect.y.value &&
			elRect.y.value <= otherRect.y.value + otherRect.minHeight.value
		);
	}

	export function getSegmentSectionUsage(pageNumber: number, currentSection?: OmitId<PartialSection>) {
		return currentSection?.sectionUsage === SectionUsage.Remaining
			? SectionUsage.Remaining
			: pageNumber === FIRST_PAGE_NUMBER
				? SectionUsage.First
				: SectionUsage.Remaining;
	}

	export function getLowestElementReference(
		placeableReferences: PartialValidPlaceableReference[],
		getOffset?: (
			startPositionInMM: number,
			endPositionInMM: number,
			reference: PartialValidPlaceableReference
		) => number
	) {
		return placeableReferences?.reduce((res: PartialValidPlaceableReference, next) => {
			const resSectionOffset =
				getOffset?.(res.position.y.value, ElementsUtils.getActualBottomPosition(res), res) || 0;
			const nextSectionOffset =
				getOffset?.(next.position.y.value, ElementsUtils.getActualBottomPosition(next), next) || 0;

			return ElementsUtils.getActualBottomPosition(res) + resSectionOffset >=
				ElementsUtils.getActualBottomPosition(next) + nextSectionOffset
				? res
				: next;
		}, placeableReferences[0]);
	}

	export function isElementOverlapFooter(
		reference: PartialValidPlaceableReference,
		pageHeight: number,
		getSection: (pageOrientation: PageOrientation, sectionUsage: SectionUsage) => PartialSection | undefined,
		appliedSection?: PartialSection
	) {
		const elementStartPosition = ElementsUtils.getActualTopPosition(reference);
		const elementEndPosition = ElementsUtils.getActualBottomPosition(reference);
		const pageNumber = Math.ceil(elementStartPosition / pageHeight);

		const sectionUsage = EditorUtils.getSegmentSectionUsage(pageNumber, appliedSection);

		const currentSection =
			appliedSection?.pageOrientation && sectionUsage !== appliedSection?.sectionUsage
				? getSection(appliedSection?.pageOrientation, sectionUsage)
				: appliedSection;

		const currentFooterPosition = pageHeight * pageNumber - (currentSection?.footerHeight?.value || 0);

		return (
			!!currentSection?.footerHeight?.value &&
			elementEndPosition > currentFooterPosition &&
			elementStartPosition < currentFooterPosition
		);
	}

	export function calculateNumberOfPages(pageHeight: number, placeableReferences?: PartialValidPlaceableReference[]) {
		if (!placeableReferences?.length) {
			return 1;
		}

		return Math.ceil(
			ElementsUtils.getActualBottomPosition(getLowestElementReference(placeableReferences)) / pageHeight
		);
	}

	export function isHorizontallyOverlap(
		targetReference: PartialValidPlaceableReference,
		otherReference: PartialValidPlaceableReference
	) {
		const targetPosX = targetReference.position.x.value;
		const otherPosX = otherReference.position.x.value;
		const targetWidth = targetReference.dimensions.minWidth.value;
		const otherWidth = otherReference.dimensions.minWidth.value;

		const maxLeftEdge = Math.max(targetPosX, otherPosX);
		const minRightEdge = Math.min(targetPosX + targetWidth, otherPosX + otherWidth);
		return minRightEdge > maxLeftEdge;
	}

	interface GetEndPageParams {
		pageNumber: number;
		pageHeight: number;
		previousEndOfElement: number;
		previousFooterHeight?: number;
		currentFooterHeight?: number;
		currentHeaderHeight?: number;
		remainingSection?: PartialSection;
	}

	export function getActualBottomPageNumber({
		pageNumber,
		previousEndOfElement,
		currentHeaderHeight = 0,
		currentFooterHeight = 0,
		previousFooterHeight = 0,
		pageHeight,
		remainingSection,
	}: GetEndPageParams): number {
		const endOfElement = previousEndOfElement + previousFooterHeight + currentHeaderHeight;
		const currentFooterPosition = pageHeight * pageNumber - currentFooterHeight;

		if (endOfElement > currentFooterPosition) {
			return getActualBottomPageNumber({
				pageNumber: pageNumber + 1,
				previousFooterHeight: currentFooterHeight,
				previousEndOfElement: endOfElement,
				currentFooterHeight: remainingSection?.footerHeight?.value,
				currentHeaderHeight: remainingSection?.headerHeight?.value,
				remainingSection,
				pageHeight,
			});
		}
		return pageNumber;
	}

	export const isNewPrintModel = (model: PrintModelDTO) => {
		const isSegmentDefinitionsEmpty = !model.content?.segments?.definitions?.length;
		const isSegmentReferencesEmpty = !model.content?.segments?.references?.length;
		const isElementDefinitionsEmpty = !model.content?.elementDefinitions?.length;
		const isWatermarksEmpty = !model.content?.watermarks?.definitions?.length;
		const isSectionsEmpty = !model.content?.sections?.definitions?.length;

		return (
			isSegmentDefinitionsEmpty &&
			isSegmentReferencesEmpty &&
			isElementDefinitionsEmpty &&
			isWatermarksEmpty &&
			isSectionsEmpty
		);
	};
}

function distanceToTopLeft(editorPos: PlainMeasurePosition, elPos: PlainMeasurePosition) {
	const a = elPos.x.value - editorPos.x.value;
	const b = elPos.y.value - editorPos.y.value;
	return Math.sqrt(a * a + b * b);
}

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

import { PartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { createPlainMmMeasure, EditorUtils, ElementsUtils } from "../../../utils/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { useGetSectionOffset } from "../../../hooks/use-get-section-offset.js";
import { EditorContext } from "../../editor-stage/editor-context.js";

import { useSetupSegmentEditor } from "../hooks/index.js";
import { LayoutReferencesRendererProps } from "../editor-interface.js";

import { BasicLayoutEditor } from "./BasicLayoutEditor.js";
import { SegmentLayoutReferenceRenderer } from "./SegmentLayoutReferenceRenderer.js";

export const SegmentLayoutEditor = () => {
	const { getSection } = React.useContext(EditorContext);
	const segmentSection = useSelector(PrintEngineSelectors.segmentSection);
	const editorDimensions = useSelector(PrintEngineSelectors.editorDimensions);

	const getSectionOffset = useGetSectionOffset();

	const curSegment = useSelector(PrintEngineSelectors.currentSegment);
	const { renderTopSlots, numberOfPages } = useSetupSegmentEditor(curSegment);

	const getLimitZone = React.useCallback(
		(reference: PartialValidPlaceableReference) => {
			const pageHeight = editorDimensions.minHeight.value;
			const currentPage = Math.ceil(reference.position.y.value / pageHeight);

			if (!currentPage) {
				return {
					top: createPlainMmMeasure(0),
				};
			}

			const currentSection =
				segmentSection && segmentSection.pageOrientation
					? getSection(
							segmentSection.pageOrientation,
							EditorUtils.getSegmentSectionUsage(currentPage, segmentSection)
						)
					: undefined;

			const topLimit = (currentPage - 1) * pageHeight + (currentSection?.headerHeight?.value || 0);

			return {
				top: createPlainMmMeasure(topLimit),
			};
		},
		[editorDimensions.minHeight.value, getSection, segmentSection]
	);

	const customGetLimitElement = React.useCallback(
		(elementReferences: readonly PartialValidPlaceableReference[], reference: PartialValidPlaceableReference) => {
			let topElement: PartialValidPlaceableReference | undefined;
			let bottomElement: PartialValidPlaceableReference | undefined;
			const currenReferenceOffset = getSectionOffset(
				reference.position.y.value,
				ElementsUtils.getActualBottomPosition(reference),
				reference
			);
			let topOffset = 0;
			elementReferences.forEach(otherReference => {
				if (
					otherReference.refId === reference.refId ||
					!EditorUtils.isHorizontallyOverlap(reference, otherReference)
				) {
					return;
				}

				if (otherReference.position.y.value < reference.position.y.value) {
					if (!topElement) {
						topElement = otherReference;
						topOffset = getSectionOffset(
							otherReference.position.y.value,
							ElementsUtils.getActualBottomPosition(otherReference),
							otherReference
						);
						return;
					}

					const otherReferenceOffset = getSectionOffset(
						otherReference.position.y.value,
						ElementsUtils.getActualBottomPosition(otherReference),
						otherReference
					);
					const topReferenceOffset = getSectionOffset(
						topElement.position.y.value,
						ElementsUtils.getActualBottomPosition(topElement),
						topElement
					);
					if (
						ElementsUtils.getActualBottomPosition(otherReference) + otherReferenceOffset >
						ElementsUtils.getActualBottomPosition(topElement) + topReferenceOffset
					) {
						topOffset = otherReferenceOffset;
						topElement = otherReference;
					}
					return;
				}

				if (!bottomElement) {
					bottomElement = otherReference;
					return;
				} else if (
					ElementsUtils.getActualTopPosition(otherReference) <
					ElementsUtils.getActualTopPosition(bottomElement)
				) {
					bottomElement = otherReference;
				}
			});
			return [
				topElement ? ElementsUtils.getActualBottomPosition(topElement) + topOffset : undefined,
				bottomElement ? ElementsUtils.getActualTopPosition(bottomElement) - currenReferenceOffset : undefined,
			];
		},
		[getSectionOffset]
	);

	const renderElementReferences = React.useCallback(
		(props: LayoutReferencesRendererProps) => <SegmentLayoutReferenceRenderer {...props} />,
		[]
	);
	return (
		<BasicLayoutEditor
			referenceContainer={curSegment}
			numberOfPages={numberOfPages}
			renderTopSlots={renderTopSlots}
			isActive={!!curSegment}
			getLimitZone={getLimitZone}
			customGetLimitElement={customGetLimitElement}
			renderElementReferences={renderElementReferences}
		/>
	);
};

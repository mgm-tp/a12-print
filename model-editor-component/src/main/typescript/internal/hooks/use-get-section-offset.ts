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

import { PartialValidPlaceableReference, SectionUsage } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { PrintEngineSelectors } from "../store/selectors.js";
import { EditorUtils } from "../utils/index.js";
import { EditorContext } from "../components/editor-stage/editor-context.js";

export const useGetSectionOffset = () => {
	const { getSection } = React.useContext(EditorContext);
	const editorDimensions = useSelector(PrintEngineSelectors.editorDimensions);
	const segmentSection = useSelector(PrintEngineSelectors.segmentSection);
	const isSegmentStage = useSelector(PrintEngineSelectors.isSegmentStage);

	const pageHeight = editorDimensions.minHeight.value;
	const remainingSection = segmentSection?.pageOrientation
		? getSection(segmentSection?.pageOrientation, SectionUsage.Remaining)
		: undefined;

	return React.useCallback(
		(startPositionInMM: number, endPositionInMM: number, reference: PartialValidPlaceableReference) => {
			const isInvalidPosition =
				reference?.position.x.value < 0 ||
				(reference?.position.x.value || 0) + (reference?.dimensions.minWidth.value || 0) >
					editorDimensions.minWidth.value;

			if (isInvalidPosition || !isSegmentStage) {
				return 0;
			}
			const startPageNumber = Math.ceil(startPositionInMM / pageHeight);
			const sectionUsage = EditorUtils.getSegmentSectionUsage(startPageNumber, segmentSection);

			const startPageSection = segmentSection?.pageOrientation
				? getSection(segmentSection?.pageOrientation, sectionUsage)
				: undefined;

			const endPageNumber = EditorUtils.getActualBottomPageNumber({
				pageNumber: startPageNumber,
				pageHeight,
				remainingSection,
				previousEndOfElement: endPositionInMM,
				currentFooterHeight: startPageSection?.footerHeight?.value,
			});
			const startPageFooterPositionY =
				pageHeight * startPageNumber - (startPageSection?.footerHeight?.value || 0);

			const isOverlap =
				startPageSection?.footerHeight?.value &&
				endPositionInMM > startPageFooterPositionY &&
				startPositionInMM < startPageFooterPositionY;

			const remainingSectionHeight =
				(endPageNumber - startPageNumber - 1) *
				((remainingSection?.headerHeight?.value || 0) + (remainingSection?.footerHeight?.value || 0));

			return isOverlap
				? (startPageSection?.footerHeight?.value || 0) +
						remainingSectionHeight +
						(remainingSection?.headerHeight?.value || 0)
				: 0;
		},
		[editorDimensions.minWidth.value, getSection, isSegmentStage, pageHeight, remainingSection, segmentSection]
	);
};

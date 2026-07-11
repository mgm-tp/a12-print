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

import type { PartialSegment, PartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/model";
import { SectionUsage } from "@com.mgmtp.a12.print/print-model-api/model";

import { EditorUtils, ElementsUtils } from "../../../utils/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { useGetSectionOffset } from "../../../hooks/use-get-section-offset.js";
import { EditorContext } from "../../editor-stage/editor-context.js";

import { PageDividers } from "../shared-components/PageDividers.js";

export const useSetupSegmentEditor = (segment?: PartialSegment) => {
	const { setElementReferences, getSection } = React.useContext(EditorContext);
	const editorDimensions = useSelector(PrintEngineSelectors.editorDimensions);

	const segmentSection = useSelector(PrintEngineSelectors.segmentSection);
	const getSectionOffset = useGetSectionOffset();

	const curSegment = useSelector(PrintEngineSelectors.currentSegment);
	const numberOfPages = React.useMemo(() => {
		if (!segment?.elementReferences?.length) {
			return 1;
		}

		const lowestElement = EditorUtils.getLowestElementReference(
			segment.elementReferences as PartialValidPlaceableReference[],
			getSectionOffset
		);
		const editorHeight = editorDimensions.minHeight?.value;
		const lowestPosY = ElementsUtils.getActualBottomPosition(lowestElement);

		const startPageNumber = Math.ceil(ElementsUtils.getActualTopPosition(lowestElement) / editorHeight);
		const currentSection = segmentSection?.pageOrientation
			? getSection(
					segmentSection.pageOrientation,
					EditorUtils.getSegmentSectionUsage(startPageNumber, segmentSection)
				)
			: undefined;

		const remainingSection = segmentSection?.pageOrientation
			? getSection(segmentSection?.pageOrientation, SectionUsage.Remaining)
			: undefined;

		return EditorUtils.getActualBottomPageNumber({
			pageNumber: startPageNumber,
			pageHeight: editorDimensions.minHeight.value,
			remainingSection,
			previousEndOfElement: lowestPosY,
			currentFooterHeight: currentSection?.footerHeight?.value,
		});
	}, [segment, getSectionOffset, editorDimensions.minHeight.value, segmentSection, getSection]);

	const renderTopSlots = React.useCallback(
		(_bodyEl?: HTMLDivElement | null, _editorEl?: HTMLDivElement | null, numberOfPages?: number) => (
			<PageDividers numberOfPages={numberOfPages || 1} />
		),
		[]
	);

	React.useEffect(() => {
		setElementReferences((curSegment?.elementReferences || []) as ReadonlyArray<PartialValidPlaceableReference>);
	}, [curSegment, setElementReferences]);

	return { numberOfPages, renderTopSlots };
};

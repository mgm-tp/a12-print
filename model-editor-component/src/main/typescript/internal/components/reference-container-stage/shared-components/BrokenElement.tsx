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
import { createPortal } from "react-dom";
import { Fragment } from "react";

import type { PartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/model";
import { SectionUsage } from "@com.mgmtp.a12.print/print-model-api/model";

import { PrintEngineSelectors } from "../../../store/selectors.js";
import { EditorContext } from "../../editor-stage/editor-context.js";
import { EditorUtils, ElementsUtils } from "../../../utils/index.js";

interface BreakPageRenderProps {
	reference: PartialValidPlaceableReference;
	renderElement: (offset: number) => React.ReactNode;
	pageRefs: Array<HTMLDivElement | null>;
}

export const BrokenElement = (props: BreakPageRenderProps) => {
	const { reference, renderElement, pageRefs } = props;
	const { getSection } = React.useContext(EditorContext);
	const segmentSection = useSelector(PrintEngineSelectors.segmentSection);
	const editorDimensions = useSelector(PrintEngineSelectors.editorDimensions);

	const pageHeight = editorDimensions.minHeight.value;
	const startPageNumber = Math.ceil(
		(reference.position.y.value - (reference.margins?.top?.margin?.value || 0)) / editorDimensions.minHeight.value
	);
	const sectionUsage = EditorUtils.getSegmentSectionUsage(startPageNumber, segmentSection);

	const startPageSection = segmentSection?.pageOrientation
		? getSection(segmentSection?.pageOrientation, sectionUsage)
		: undefined;
	const remainingSection = segmentSection?.pageOrientation
		? getSection(segmentSection?.pageOrientation, SectionUsage.Remaining)
		: undefined;

	const endPageNumber = EditorUtils.getActualBottomPageNumber({
		pageNumber: startPageNumber,
		pageHeight,
		remainingSection,
		previousEndOfElement: ElementsUtils.getActualBottomPosition(reference),
		currentFooterHeight: startPageSection?.footerHeight?.value,
	});

	const pages = React.useMemo(() => {
		const offsetByPages: Array<[number, number]> = [[startPageNumber, -((startPageNumber - 1) * pageHeight)]];
		let accOffset = startPageSection?.footerHeight?.value || 0;
		for (let page = startPageNumber + 1; page <= endPageNumber; page++) {
			accOffset += remainingSection?.headerHeight?.value || 0;
			const offsetTop = -((page - 1) * pageHeight) + accOffset;
			offsetByPages.push([page, offsetTop]);
			accOffset += remainingSection?.footerHeight?.value || 0;
		}
		return offsetByPages;
	}, [
		startPageSection?.footerHeight?.value,
		endPageNumber,
		pageHeight,
		remainingSection?.footerHeight?.value,
		remainingSection?.headerHeight?.value,
		startPageNumber,
	]);

	return (
		<>
			{pages.map(([pageNumber, offset]) => {
				const pageRef = pageRefs[pageNumber - 1];
				return (
					<Fragment key={`${reference.refId}-${pageNumber}`}>
						{pageRef && createPortal(renderElement(offset), pageRef)}
					</Fragment>
				);
			})}
		</>
	);
};

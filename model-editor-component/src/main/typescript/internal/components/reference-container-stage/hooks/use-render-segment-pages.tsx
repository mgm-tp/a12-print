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

import { EditorUtils } from "../../../utils/index.js";
import { StyledSection } from "../../sections/Section.styled.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { EditorContext } from "../../editor-stage/editor-context.js";

import { StyledEditorPage } from "../shared-components/Base.styled.js";

interface SegmentPagesProps {
	numberOfPages: number;
}

export const useRenderSegmentPages = ({ numberOfPages }: SegmentPagesProps) => {
	const editorDimensions = useSelector(PrintEngineSelectors.editorDimensions);
	const segmentSection = useSelector(PrintEngineSelectors.segmentSection);
	const zoomFactor = useSelector(PrintEngineSelectors.zoomFactor);
	const { getSection } = React.useContext(EditorContext);
	const pageOrientation = segmentSection?.pageOrientation;
	const [pageRefs, setPageRefs] = React.useState<Array<HTMLDivElement | null>>([]);

	const pages = React.useMemo(() => {
		const pages = [];
		for (let pageNumber = 0; pageNumber < numberOfPages; pageNumber++) {
			const usage = segmentSection?.sectionUsage
				? EditorUtils.getSegmentSectionUsage(pageNumber + 1, segmentSection)
				: undefined;
			const section = pageOrientation && usage ? getSection(pageOrientation, usage) : undefined;

			pages.push(
				<StyledEditorPage
					ref={ref => {
						setPageRefs(prevState => {
							prevState[pageNumber] = ref;
							return [...prevState];
						});
					}}
					zoomFactor={zoomFactor}
					editorDimensions={editorDimensions}
					key={pageNumber + 1}
				>
					<StyledSection
						side="top"
						height={section?.headerHeight?.value || 0}
						zoomFactor={zoomFactor}
						disable
					/>
					<StyledSection
						side="bottom"
						height={section?.footerHeight?.value || 0}
						zoomFactor={zoomFactor}
						disable
					/>
				</StyledEditorPage>
			);
		}
		return pages;
	}, [editorDimensions, getSection, numberOfPages, pageOrientation, segmentSection, zoomFactor]);

	return { pages, pageRefs };
};

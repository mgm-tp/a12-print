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
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { EditorContext } from "../../editor-stage/editor-context.js";
import { LayoutElementContainer } from "../../element-container/LayoutElementContainer.js";
import { MarginWrapper } from "../../margin/MarginWrapper.js";
import { MarginBreakPageContext } from "../../margin/MarginBreakPageContext.js";

import { LayoutReferencesRendererProps } from "../editor-interface.js";
import { useRenderSegmentPages } from "../hooks/use-render-segment-pages.js";
import { PlaceableElement } from "../shared-components/PlaceableElement.js";

type SegmentLayoutReferenceRendererProps = LayoutReferencesRendererProps;
export const SegmentLayoutReferenceRenderer = ({
	numberOfPages,
	elementReferences,
	onHoverChange,
	getLimitZone,
	onUpdateMargin,
	selectedReferenceId,
	hoveredReferenceId,
	onClick,
	onDoubleClick,
	customGetLimitElement,
}: SegmentLayoutReferenceRendererProps) => {
	const { getSection } = React.useContext(EditorContext);
	const editorDimensions = useSelector(PrintEngineSelectors.editorDimensions);

	const { pages, pageRefs } = useRenderSegmentPages({
		numberOfPages,
	});
	const segmentSection = useSelector(PrintEngineSelectors.segmentSection);
	const zoomFactor = useSelector(PrintEngineSelectors.zoomFactor);

	return (
		<>
			{pages}
			{pageRefs &&
				elementReferences.map(reference => {
					const isOverlap = EditorUtils.isElementOverlapFooter(
						reference,
						editorDimensions.minHeight.value,
						getSection,
						segmentSection
					);
					const isHighlight =
						reference.refId === selectedReferenceId || reference.refId === hoveredReferenceId;
					const isOutOfStage =
						reference.position.x.value < 0 ||
						reference.position.x.value + reference.dimensions.minWidth.value >
							editorDimensions.minWidth.value;
					return isOverlap && !isOutOfStage ? (
						<MarginBreakPageContext
							key={reference.refId}
							onClick={onClick}
							onDoubleClick={onDoubleClick}
							onHoverChange={onHoverChange}
							onUpdateMargin={onUpdateMargin}
							pageRefs={pageRefs}
							getLimitZone={getLimitZone}
							highlight={isHighlight}
							reference={reference}
							customGetLimitElement={customGetLimitElement}
						/>
					) : (
						<PlaceableElement
							key={reference.refId}
							reference={reference}
							onClick={onClick}
							onDoubleClick={onDoubleClick}
							onMouseEnter={() => onHoverChange(reference)}
							onMouseLeave={() => onHoverChange()}
							highlight={isHighlight}
						>
							<MarginWrapper
								reference={reference}
								zoomFactor={zoomFactor}
								highlight={isHighlight}
								getLimitZone={getLimitZone}
								onUpdateMargin={onUpdateMargin}
								onStartResize={onClick}
								customGetLimitElement={customGetLimitElement}
							>
								<LayoutElementContainer reference={reference} />
							</MarginWrapper>
						</PlaceableElement>
					);
				})}
		</>
	);
};

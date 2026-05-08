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
import { EditorConst } from "../../../constant/editor.js";
import { EditorContext } from "../../editor-stage/editor-context.js";
import { DefaultElementContainer } from "../../element-container/DefaultElementContainer.js";

import { useRenderSegmentPages } from "../hooks/use-render-segment-pages.js";
import { DefaultReferencesRendererProps } from "../editor-interface.js";
import { BrokenElement } from "../shared-components/BrokenElement.js";
import { DragSourceWrapper } from "../shared-components/DragSourceWrapper.js";

const BROKEN_Z_INDEX = EditorConst.getZIndexList().BrokenElement;

type SegmentDefaultReferenceRendererProps = DefaultReferencesRendererProps;
export const SegmentDefaultReferenceRenderer = ({
	numberOfPages,
	elementReferences,
	...restProps
}: SegmentDefaultReferenceRendererProps) => {
	const {
		onDoubleClick,
		onClick,
		setIsDraggingGL,
		selected,
		collisionsList,
		outOfBoxList,
		isMultiDrag,
		hovered,
		setHovered,
		isResizing,
		canDrag,
	} = restProps;

	const { pages, pageRefs } = useRenderSegmentPages({
		numberOfPages,
	});
	const { getSection } = React.useContext(EditorContext);

	const editorDimensions = useSelector(PrintEngineSelectors.editorDimensions);
	const segmentSection = useSelector(PrintEngineSelectors.segmentSection);

	return (
		<>
			{pages}
			{elementReferences.map(reference => {
				const isOverlap = EditorUtils.isElementOverlapFooter(
					reference,
					editorDimensions.minHeight.value,
					getSection,
					segmentSection
				);
				const isOutOfStage =
					reference.position.x.value < 0 ||
					reference.position.x.value + reference.dimensions.minWidth.value > editorDimensions.minWidth.value;
				return isOverlap && !isOutOfStage ? (
					<BrokenElement
						key={reference.refId}
						reference={reference}
						pageRefs={pageRefs}
						renderElement={offset => {
							return (
								<DragSourceWrapper
									item={reference}
									setIsDraggingGL={setIsDraggingGL}
									isSelected={selected.includes(reference.refId)}
									isColliding={collisionsList.includes(reference.refId)}
									isOutsideBox={outOfBoxList.includes(reference.refId)}
									isMultiDrag={isMultiDrag}
									hovered={hovered}
									setHovered={setHovered}
									isResizing={isResizing}
									canDrag={canDrag}
									onClick={onClick}
									onDoubleClick={onDoubleClick}
									offsetTop={offset}
									zIndex={BROKEN_Z_INDEX}
								>
									<DefaultElementContainer
										reference={reference}
										isHovered={hovered?.id === reference.id}
									/>
								</DragSourceWrapper>
							);
						}}
					/>
				) : (
					<DragSourceWrapper
						key={reference.refId}
						item={reference}
						setIsDraggingGL={setIsDraggingGL}
						isSelected={selected.includes(reference.refId)}
						isColliding={collisionsList.includes(reference.refId)}
						isOutsideBox={outOfBoxList.includes(reference.refId)}
						isMultiDrag={isMultiDrag}
						hovered={hovered}
						setHovered={setHovered}
						isResizing={isResizing}
						canDrag={canDrag}
						onClick={onClick}
						onDoubleClick={onDoubleClick}
					>
						<DefaultElementContainer reference={reference} isHovered={hovered?.id === reference.id} />
					</DragSourceWrapper>
				);
			})}
		</>
	);
};

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
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo } from "react";

import { PageOrientation, SectionUsage } from "@com.mgmtp.a12.print/print-model-api/lib/model/print-model.js";
import {
	BoundingBoxDimensions,
	DataContext,
	ElementType,
	isOverflowDimensions,
	OverflowDimensions,
	PartialArea,
	PartialSection,
	PartialSegment,
	PartialValidPlaceableReference,
	PartialWatermark,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import { Dimensions, isDimensions } from "@com.mgmtp.a12.print/print-model-api/lib/model/elements/base.js";
import { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";

import { WrapperContext, WrapperActions } from "../../redux/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { createMmMeasure, createPlainMmMeasure } from "../../utils/index.js";

import { EditorStage } from "./EditorStage.js";
import { EditorContext, PreviousEditorRef } from "./editor-context.js";
import { StyledEditorWrapper } from "./EditorContextWrapper.styled.js";

export const EditorContextWrapper = () => {
	const printModelRefs = useSelector(PrintEngineSelectors.printModelRefs);
	const previousEditorRef = React.useRef<PreviousEditorRef>(null);

	const sections = useSelector(PrintEngineSelectors.sections);
	const currentWrapperContainer = useSelector(PrintEngineSelectors.currentWrapperContainer);

	const [elementReferences, setElementReferences] = React.useState<ReadonlyArray<PartialValidPlaceableReference>>([]);
	const [copyElements, setCopyElements] = React.useState<ReadonlyArray<PartialValidPlaceableReference>>([]);

	const containerId = useMemo(() => {
		let containerId;
		if (printModelRefs.currentRefType === SidebarItem.SEGMENT) {
			containerId = printModelRefs?.segmentId;
		} else if (printModelRefs.currentRefType === SidebarItem.SECTION) {
			containerId = printModelRefs?.sectionId;
		} else {
			containerId = printModelRefs?.watermarkId;
		}

		return containerId;
	}, [
		printModelRefs.currentRefType,
		printModelRefs?.sectionId,
		printModelRefs?.segmentId,
		printModelRefs?.watermarkId,
	]);

	const dispatch = useDispatch();

	const openWrapperStage = React.useCallback(
		(
			elementId: string,
			type: ElementType.BoundingBox | ElementType.Area | ElementType.Override | ElementType.Switch,
			dimensions?: DeepPartial<BoundingBoxDimensions> | DeepPartial<OverflowDimensions> | Dimensions,
			dataContexts?: DeepPartial<DataContext>[],
			wrapperContext?: WrapperContext
		) => {
			let minHeight = isDimensions(dimensions) ? dimensions.minHeight : dimensions?.height;
			const minWidth = isDimensions(dimensions) ? dimensions.minWidth : dimensions?.width;
			if (isOverflowDimensions(dimensions)) {
				minHeight = createMmMeasure((minHeight?.value || 0) + dimensions.overflowHeight.value);
			}

			if (containerId) {
				dispatch(
					WrapperActions.addWrapperStage({
						containerId,
						id: elementId,
						type,
						dimensions: {
							height: createPlainMmMeasure(minHeight?.value || 0),
							width: createPlainMmMeasure(minWidth?.value || 0),
						},
						dataContexts,
						wrapperContext,
					})
				);
			}
		},
		[containerId, dispatch]
	);

	const openPreviousStage = React.useCallback(
		(referenceContainer: PartialSegment | PartialSection | PartialWatermark, wrapperId?: string) => {
			dispatch(
				WrapperActions.removeWrapperStage({
					containerId: referenceContainer.id,
					id: wrapperId || referenceContainer.id,
				})
			);
		},
		[dispatch]
	);

	const getSection = React.useCallback(
		(pageOrientation: PageOrientation, sectionUsage: SectionUsage) => {
			return sections.find(
				section => section.pageOrientation === pageOrientation && section.sectionUsage === sectionUsage
			);
		},
		[sections]
	);

	// Update the area dimensions if the current area changes: undo/redo
	useEffect(() => {
		if (currentWrapperContainer && PartialArea.isInstance(currentWrapperContainer)) {
			const dimensions = currentWrapperContainer.area?.dimensions;
			const dataContexts = [...(currentWrapperContainer.area?.dataContexts || [])];

			dispatch(
				WrapperActions.updateWrapperStage({
					containerId,
					id: currentWrapperContainer.id,
					type: currentWrapperContainer.type,
					dimensions: {
						height: createMmMeasure(
							(dimensions?.height?.value || 0) + (dimensions?.overflowHeight?.value || 0)
						),
						width: createPlainMmMeasure(dimensions?.width?.value || 0),
					},
					dataContexts,
				})
			);
		}
	}, [containerId, currentWrapperContainer, dispatch]);

	return (
		<EditorContext.Provider
			value={{
				elementReferences,
				copyElements,
				setElementReferences,
				setCopyElements,
				openWrapperStage,
				openPreviousStage,
				getSection,
				previousEditorRef,
			}}
		>
			<StyledEditorWrapper>
				<EditorStage />
			</StyledEditorWrapper>
		</EditorContext.Provider>
	);
};

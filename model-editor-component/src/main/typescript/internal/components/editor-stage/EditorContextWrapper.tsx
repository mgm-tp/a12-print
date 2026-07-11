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
import { useEffect } from "react";

import type {
	PageOrientation,
	SectionUsage,
	BoundingBoxDimensions,
	DataContext,
	ElementType,
	OverflowDimensions,
	PartialSection,
	PartialSegment,
	PartialValidPlaceableReference,
	PartialWatermark,
	Dimensions,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { isOverflowDimensions, PartialArea, isDimensions } from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";

import type { WrapperContext } from "../../redux/index.js";
import { NavigationActions, NavigationSelectors } from "../../redux/index.js";
import { EditorMode } from "../../redux/editor-state/state.js";
import type { WrapperStackEntry } from "../../redux/navigation/state.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { createMmMeasure, createPlainMmMeasure } from "../../utils/index.js";

import { EditorStage } from "./EditorStage.js";
import type { PreviousEditorRef } from "./editor-context.js";
import { EditorContext } from "./editor-context.js";
import { StyledEditorWrapper } from "./EditorContextWrapper.styled.js";

export const EditorContextWrapper = () => {
	const printModelRefs = useSelector(NavigationSelectors.activeEntities);
	const containerId = useSelector(PrintEngineSelectors.currentElementContainerId);

	const previousEditorRef = React.useRef<PreviousEditorRef>(null);

	const sections = useSelector(PrintEngineSelectors.sections);
	const currentWrapperContainer = useSelector(PrintEngineSelectors.currentWrapperContainer);

	const [elementReferences, setElementReferences] = React.useState<ReadonlyArray<PartialValidPlaceableReference>>([]);
	const [copyElements, setCopyElements] = React.useState<ReadonlyArray<PartialValidPlaceableReference>>([]);

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
				const resolvedDimensions = {
					height: createPlainMmMeasure(minHeight?.value || 0),
					width: createPlainMmMeasure(minWidth?.value || 0),
				};
				dispatch(
					NavigationActions.pushWrapper({
						tab: printModelRefs.currentRefType,
						entityId: containerId,
						entry: {
							id: elementId,
							type: type as WrapperStackEntry["type"],
							currentMode: EditorMode.Default,
							modes: {},
							dimensions: resolvedDimensions,
							dataContexts,
							wrapperContext,
						},
					})
				);
			}
		},
		[containerId, dispatch, printModelRefs.currentRefType]
	);

	const openPreviousStage = React.useCallback(
		(referenceContainer: PartialSegment | PartialSection | PartialWatermark) => {
			dispatch(
				NavigationActions.popWrapper({
					tab: printModelRefs.currentRefType,
					entityId: referenceContainer.id,
				})
			);
		},
		[dispatch, printModelRefs.currentRefType]
	);

	const getSection = React.useCallback(
		(pageOrientation: PageOrientation, sectionUsage: SectionUsage) => {
			return sections.find(
				section => section.pageOrientation === pageOrientation && section.sectionUsage === sectionUsage
			);
		},
		[sections]
	);

	// Update the area dimensions if the current area changes (e.g., undo/redo)
	useEffect(() => {
		if (containerId && currentWrapperContainer && PartialArea.isInstance(currentWrapperContainer)) {
			const dimensions = currentWrapperContainer.area?.dimensions;
			const dataContexts = [...(currentWrapperContainer.area?.dataContexts || [])];

			dispatch(
				NavigationActions.updateWrapperEntry({
					tab: printModelRefs.currentRefType,
					entityId: containerId,
					id: currentWrapperContainer.id,
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
	}, [containerId, currentWrapperContainer, dispatch, printModelRefs.currentRefType]);

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

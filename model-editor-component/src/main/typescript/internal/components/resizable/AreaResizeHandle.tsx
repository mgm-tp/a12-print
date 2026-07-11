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
import { nanoid } from "nanoid";

import type { Measure, PartialArea, PartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/model";
import { StageRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { PrintEngineSelectors } from "../../store/selectors.js";
import type { OmitId } from "../../utils/index.js";
import { createMmMeasure, createPlainMmMeasureFromPx, EditorUtils, ElementsUtils } from "../../utils/index.js";
import { EditorConst } from "../../constant/editor.js";
import {
	InteractionLogActions,
	NavigationActions,
	NavigationSelectors,
	TransactionLogStateActions,
} from "../../redux/index.js";
import { RESOURCE_KEYS } from "../../localization/index.js";

import { ResizeHandle } from "./ResizeHandle.js";
import { StyledAreaDivider } from "./AreaResizeHandle.styled.js";

const { MM_TO_PX } = EditorConst;

interface AreaResizeHandleProps {
	areaElement: PartialArea;
}

export const AreaResizeHandle = ({ areaElement }: AreaResizeHandleProps) => {
	const { editorOptions } = useSelector(PrintEngineSelectors.printEditorState);
	const editorDimensions = useSelector(PrintEngineSelectors.editorDimensions);
	const activeCanvasTab = useSelector(NavigationSelectors.activeCanvasTab);
	const currentElementContainerId = useSelector(PrintEngineSelectors.currentElementContainerId);

	const [startPos, setStartPos] = React.useState<OmitId<Measure> | null>(null);
	const dispatch = useDispatch();

	const { zoomFactor } = editorOptions;
	const dimensions = areaElement.area?.dimensions;
	const areaHeight = dimensions?.height?.value || 0;
	const editorHeight = editorDimensions?.minHeight?.value || 0;

	const lowestElementPos = React.useMemo(() => {
		const elementReferences = areaElement.area?.elementReferences || [];
		if (elementReferences.length === 0) {
			return 0;
		}
		return MM_TO_PX(
			ElementsUtils.getActualBottomPosition(
				EditorUtils.getLowestElementReference(elementReferences as PartialValidPlaceableReference[])
			)
		);
	}, [areaElement.area?.elementReferences]);

	const startResizeArea = React.useCallback(
		(e: MouseEvent) => {
			if (!startPos) {
				return;
			}
			const minHeight = MM_TO_PX(areaHeight);
			const overflowHeight = MM_TO_PX(dimensions?.overflowHeight?.value || 0);

			const diff = (e.pageY - MM_TO_PX(startPos.value)) / zoomFactor;
			const newEditorHeight = minHeight + overflowHeight + diff;
			if (newEditorHeight < minHeight || newEditorHeight < lowestElementPos) {
				return;
			}

			dispatch(
				NavigationActions.updateWrapperEntry({
					tab: activeCanvasTab,
					entityId: currentElementContainerId,
					id: areaElement.id,
					dimensions: {
						width: editorDimensions?.minWidth || createPlainMmMeasureFromPx(0),
						height: createPlainMmMeasureFromPx(newEditorHeight),
					},
				})
			);
		},
		[
			startPos,
			areaHeight,
			dimensions?.overflowHeight?.value,
			zoomFactor,
			lowestElementPos,
			dispatch,
			activeCanvasTab,
			currentElementContainerId,
			areaElement.id,
			editorDimensions.minWidth,
		]
	);

	const stopResizeArea = React.useCallback(() => {
		const newOverflowHeight = editorHeight - areaHeight;
		if (newOverflowHeight === areaElement.area?.dimensions?.overflowHeight?.value) {
			return;
		}

		const updatedElement: PartialArea = {
			...areaElement,
			area: {
				...areaElement?.area,
				id: areaElement?.area?.id || nanoid(),
				dimensions: {
					...areaElement?.area?.dimensions,
					overflowHeight: createMmMeasure(newOverflowHeight),
					id: areaElement?.area?.dimensions?.id || nanoid(),
				},
			},
		};
		dispatch(
			InteractionLogActions.start({
				description: RESOURCE_KEYS.interaction.resizable.resizeElement,
				region: StageRegion.DEFAULT,
				transactionLogActions: [TransactionLogStateActions.updateArea({ data: updatedElement })],
			})
		);

		dispatch(
			NavigationActions.updateWrapperEntry({
				tab: activeCanvasTab,
				entityId: currentElementContainerId,
				id: areaElement.id,
				dimensions: {
					height: createMmMeasure(editorHeight),
					width: editorDimensions?.minWidth || createPlainMmMeasureFromPx(0),
				},
			})
		);
		setStartPos(null);
	}, [
		activeCanvasTab,
		areaElement,
		areaHeight,
		currentElementContainerId,
		dispatch,
		editorDimensions.minWidth,
		editorHeight,
	]);

	React.useEffect(() => {
		if (startPos) {
			window.addEventListener("mousemove", startResizeArea, false);
			window.addEventListener("mouseup", stopResizeArea, false);
		}

		return () => {
			window.removeEventListener("mousemove", startResizeArea, false);
			window.removeEventListener("mouseup", stopResizeArea, false);
		};
	}, [startPos, startResizeArea, stopResizeArea]);

	return (
		<>
			{editorHeight > areaHeight && <StyledAreaDivider zoomFactor={zoomFactor} top={MM_TO_PX(areaHeight)} />}
			<ResizeHandle
				side="bottom"
				dimensions={{
					minWidth: createMmMeasure(editorDimensions?.minWidth?.value || 0),
					minHeight: createMmMeasure(editorHeight),
				}}
				position={{
					x: createMmMeasure(0),
					y: createMmMeasure(0),
				}}
				startResize={setStartPos}
				zoomFactor={zoomFactor}
			/>
		</>
	);
};

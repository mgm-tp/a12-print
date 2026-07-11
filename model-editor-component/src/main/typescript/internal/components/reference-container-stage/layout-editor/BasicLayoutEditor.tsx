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

import { StageRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { PartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/model";
import { isPartialSegment } from "@com.mgmtp.a12.print/print-model-api/model";

import { Toolbar } from "../../toolbar/index.js";
import { ToolbarItem } from "../../../types/toolbar-item.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { LayoutQuickEditorBar } from "../../quick-edit-bar/index.js";
import { InteractionLogActions, NavigationActions, TransactionLogStateActions } from "../../../redux/index.js";
import { RESOURCE_KEYS } from "../../../localization/index.js";
import { changePartialMarginValue } from "../../../utils/margin-utils.js";
import type { MarginSide } from "../../../types/margin.js";
import { NavigationSelectors } from "../../../redux/navigation/selectors.js";
import { EditorContext } from "../../editor-stage/editor-context.js";
import { LayoutElementContainer } from "../../element-container/LayoutElementContainer.js";
import { MarginWrapper } from "../../margin/MarginWrapper.js";

import { EditorContainer } from "../shared-components/EditorContainer.js";
import { PlaceableElement } from "../shared-components/PlaceableElement.js";
import { StyledBasicEditor, StyledEditorWrapper } from "../shared-components/Base.styled.js";
import type { LayoutEditorProps } from "../editor-interface.js";

export const BasicLayoutEditor = ({
	numberOfPages = 1,
	borderProperties,
	isActive,
	renderEditorSlots,
	renderTopSlots,
	getLimitZone,
	customGetLimitElement,
	renderElementReferences,
	referenceContainer,
}: LayoutEditorProps) => {
	const bodyRef = React.useRef<HTMLDivElement | null>(null);
	const editorRef = React.useRef<HTMLDivElement | null>(null);
	const [bodyState, setBodyState] = React.useState<HTMLDivElement | null>(null);
	const [editorState, setEditorState] = React.useState<HTMLDivElement | null>(null);
	const [timer, setTimer] = React.useState<NodeJS.Timeout>();

	React.useLayoutEffect(() => {
		setBodyState(bodyRef.current);
		setEditorState(editorRef.current);
	}, []);
	const dispatch = useDispatch();

	const { elementReferences } = React.useContext(EditorContext);
	const zoomFactor = useSelector(PrintEngineSelectors.zoomFactor);
	const editorDimensions = useSelector(PrintEngineSelectors.editorDimensions);
	const currentTopContainer = useSelector(PrintEngineSelectors.currentContainerElement);

	const { tab, entityId, mode } = useSelector(NavigationSelectors.currentCanvasStageContext);
	const [selectedReferenceId, setSelectedReferenceId] = React.useState<string>();
	const [hoveredReferenceId, setHoveredReferenceId] = React.useState<string>();

	const onClickReference = React.useCallback((reference: PartialValidPlaceableReference) => {
		setSelectedReferenceId(reference.refId);
	}, []);

	const onDoubleClickReference = React.useCallback(
		(reference: PartialValidPlaceableReference) => {
			if (!referenceContainer?.id || !currentTopContainer || !isPartialSegment(currentTopContainer)) return;

			dispatch(
				NavigationActions.setDetailForm({
					tab,
					entityId,
					mode,
					form: {
						formStack: [{ type: "PageBreakConfig", referenceId: reference.id }],
					},
				})
			);
		},
		[dispatch, tab, entityId, mode, referenceContainer?.id, currentTopContainer]
	);

	const debouncedOnHoverElement = (reference?: PartialValidPlaceableReference) => {
		if (reference) {
			if (timer) {
				clearTimeout(timer);
			}
			setHoveredReferenceId(reference.refId);
			return;
		}
		setTimer(
			globalThis.setTimeout(() => {
				setHoveredReferenceId(undefined);
				clearTimeout(timer);
			}, 400)
		);
	};

	const handleUpdateMargin = React.useCallback(
		(margin: number, side: MarginSide, reference: PartialValidPlaceableReference) => {
			const hasChanged = (reference.margins?.[side]?.margin?.value || 0) !== margin;

			if (!hasChanged) {
				return;
			}

			const updatedReference: PartialValidPlaceableReference = {
				...reference,
				margins: changePartialMarginValue(margin, side, reference.margins),
			};

			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.relativeLayout.changeMargin,
					region: StageRegion.LAYOUT,
					transactionLogActions: [
						TransactionLogStateActions.updateReferenceElement({
							data: updatedReference,
						}),
					],
				})
			);
		},
		[dispatch]
	);

	return (
		<StyledEditorWrapper>
			<Toolbar
				leftItems={[ToolbarItem.ZoomFactor]}
				rightItems={[
					<LayoutQuickEditorBar
						key={"layout-quick-editor-bar"}
						referenceId={selectedReferenceId}
						onUpdateMargin={handleUpdateMargin}
					/>,
				]}
			/>
			<EditorContainer
				bodyRef={bodyRef}
				editorRef={editorRef}
				numberOfPages={numberOfPages}
				renderTopSlots={renderTopSlots}
				containerId={referenceContainer?.id}
			>
				<StyledBasicEditor
					tabIndex={0}
					zoomFactor={zoomFactor}
					numberOfPages={numberOfPages}
					isSegmentLike={!!isActive}
					editorDimensions={editorDimensions}
					borderProperties={borderProperties}
				>
					{renderElementReferences
						? renderElementReferences({
								numberOfPages,
								elementReferences,
								onClick: onClickReference,
								onDoubleClick: onDoubleClickReference,
								onUpdateMargin: handleUpdateMargin,
								getLimitZone,
								onHoverChange: debouncedOnHoverElement,
								selectedReferenceId,
								hoveredReferenceId,
								customGetLimitElement,
							})
						: elementReferences.map(ref => {
								const isHighlight =
									ref.refId === selectedReferenceId || hoveredReferenceId === ref?.refId;
								return (
									<PlaceableElement
										key={ref.refId}
										reference={ref}
										onClick={onClickReference}
										onDoubleClick={onDoubleClickReference}
										onMouseEnter={() => debouncedOnHoverElement(ref)}
										onMouseLeave={() => debouncedOnHoverElement(undefined)}
										highlight={isHighlight}
									>
										<MarginWrapper
											reference={ref}
											zoomFactor={zoomFactor}
											highlight={isHighlight}
											getLimitZone={getLimitZone}
											onUpdateMargin={handleUpdateMargin}
											onStartResize={onClickReference}
											customGetLimitElement={customGetLimitElement}
										>
											<LayoutElementContainer reference={ref} />
										</MarginWrapper>
									</PlaceableElement>
								);
							})}
					{renderEditorSlots?.(bodyState, editorState, numberOfPages)}
				</StyledBasicEditor>
			</EditorContainer>
		</StyledEditorWrapper>
	);
};

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
import type { DropTargetMonitor, XYCoord } from "react-dnd";
import { useDispatch, useSelector } from "react-redux";

import type {
	PageOrientation,
	PartialAnyPrintModelElement,
	PartialArea,
	PartialBoundingBox,
	PartialOverride,
	SectionUsage,
	PartialSection,
	PartialSegment,
	PartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { isSegment, isPartialSection } from "@com.mgmtp.a12.print/print-model-api/model";
import { StageRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import type { DragItem } from "../../../types/index.js";
import type { OmitId, PlainMeasurePosition } from "../../../utils/index.js";
import { changeMmMeasureValue, createMmMeasure, EditorUtils, ElementsUtils } from "../../../utils/index.js";
import { HiddenHeightComponentContext } from "../../hidden-height-context-wrapper/index.js";
import { InteractionLogActions, TransactionLogStateActions } from "../../../redux/index.js";
import { RESOURCE_KEYS } from "../../../localization/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { EditorConst } from "../../../constant/editor.js";
import { EditorContext } from "../../editor-stage/editor-context.js";

const { PX_TO_MM } = EditorConst;

interface DropParams {
	item: DragItem;
	monitor: DropTargetMonitor;
	editorState: HTMLDivElement | null;
	snapOffset: PlainMeasurePosition;
	isMultiDrag: boolean;
	selected: string[];
	referenceContainer?: PartialSegment | PartialSection;
	setHovered: React.Dispatch<React.SetStateAction<PartialValidPlaceableReference | null>>;
}

interface DropNewElementParams {
	item: DragItem;
	editorState: HTMLDivElement;
	snapOffset: PlainMeasurePosition;
	offset: XYCoord;
	referenceContainer?: PartialSegment | PartialSection;
}

interface MoveElementParams {
	item: PartialValidPlaceableReference;
	delta: XYCoord;
	snapOffset: PlainMeasurePosition;
	isMultiDrag: boolean;
	selected: string[];
	referenceContainer?: PartialSegment | PartialSection;
	setHovered: React.Dispatch<React.SetStateAction<PartialValidPlaceableReference | null>>;
}

export const useHandleDrop = () => {
	const { elementReferences, setElementReferences, getSection } = React.useContext(EditorContext);
	const { calculateNewElementHeight } = React.useContext(HiddenHeightComponentContext);

	const editorDimensions = useSelector(PrintEngineSelectors.editorDimensions);
	const segmentSection = useSelector(PrintEngineSelectors.segmentSection);
	const isDinEditable = useSelector(PrintEngineSelectors.isDinEditable);
	const { editorOptions } = useSelector(PrintEngineSelectors.printEditorState);
	const currentContainer = useSelector(PrintEngineSelectors.currentContainerElement);
	const wrappers = useSelector(PrintEngineSelectors.wrappers);

	const dispatch = useDispatch();
	const { zoomFactor } = editorOptions;

	const dropNewElement = React.useCallback(
		({ item, editorState, offset, referenceContainer, snapOffset }: DropNewElementParams) => {
			if (!currentContainer) {
				throw new Error("Current container is undefined");
			}

			const editorPosition = editorState.getBoundingClientRect();

			const position = {
				x: createMmMeasure(
					Math.floor(PX_TO_MM((offset.x - editorPosition.x) / zoomFactor) + snapOffset.x.value)
				),
				y: createMmMeasure(
					Math.floor(PX_TO_MM((offset.y - editorPosition.y) / zoomFactor) + snapOffset.y.value)
				),
			};

			if (
				!isAllowDrop(
					position?.y.value,
					editorDimensions.minHeight.value,
					referenceContainer,
					segmentSection,
					getSection
				)
			) {
				return;
			}

			const { newEl, placeableReference } = ElementsUtils.createNewlyDroppedElement(
				item.newType,
				position,
				currentContainer,
				wrappers.at(-1)
			);
			const newElementReferences = [...elementReferences, placeableReference];
			calculateNewElementHeight({ element: newEl, elementReferences: newElementReferences });
		},
		[
			calculateNewElementHeight,
			currentContainer,
			editorDimensions.minHeight.value,
			elementReferences,
			getSection,
			segmentSection,
			wrappers,
			zoomFactor,
		]
	);

	const moveElement = React.useCallback(
		({ item, delta, snapOffset, isMultiDrag, selected, referenceContainer, setHovered }: MoveElementParams) => {
			const newPosX = Math.floor(item.position.x.value + PX_TO_MM(delta.x / zoomFactor) + snapOffset.x.value);
			const newPosY = Math.floor(item.position.y.value + PX_TO_MM(delta.y / zoomFactor) + snapOffset.y.value);

			if (
				!isAllowDrop(
					newPosY,
					editorDimensions.minHeight.value,
					referenceContainer,
					segmentSection,
					getSection,
					item.margins?.top?.margin?.value
				)
			) {
				return;
			}

			const curEl = elementReferences.find(el => el.refId === item.refId);
			if (!curEl) {
				return;
			}
			const newElementRefList: PartialValidPlaceableReference[] = [];
			for (const ref of elementReferences) {
				if (ref.refId === curEl.refId) {
					const movedElement = {
						...ref,
						position: {
							id: item.position.id,
							x: changeMmMeasureValue(newPosX, item.position.x),
							y: changeMmMeasureValue(newPosY, item.position.y),
						},
					};
					newElementRefList.push(movedElement);
					setHovered(movedElement);
				} else if (isMultiDrag && selected.includes(ref.refId)) {
					newElementRefList.push({
						...ref,
						position: {
							...ref.position,
							x: changeMmMeasureValue(
								ref.position.x.value + newPosX - curEl.position.x.value,
								ref.position.x
							),
							y: changeMmMeasureValue(
								ref.position.y.value + newPosY - curEl.position.y.value,
								ref.position.y
							),
						},
					});
				} else {
					newElementRefList.push(ref);
				}
			}
			setElementReferences(newElementRefList);
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.utils.movePrintModelElement,
					region: StageRegion.DEFAULT,
					transactionLogActions: [
						TransactionLogStateActions.updateReferenceElements({
							data: newElementRefList,
						}),
					],
				})
			);
		},
		[
			dispatch,
			editorDimensions.minHeight.value,
			elementReferences,
			getSection,
			segmentSection,
			setElementReferences,
			zoomFactor,
		]
	);

	return React.useCallback(
		function handleDrop({
			item,
			monitor,
			editorState,
			snapOffset,
			isMultiDrag,
			selected,
			referenceContainer,
			setHovered,
		}: DropParams) {
			if (editorState && referenceContainer) {
				const offset = monitor.getClientOffset();
				if (
					isDinSegment(referenceContainer) &&
					!ElementsUtils.isWrapperElement(referenceContainer as PartialAnyPrintModelElement) &&
					!isDinEditable
				) {
					return;
				}
				if ("newType" in item && offset) {
					dropNewElement({
						item,
						editorState,
						offset,
						referenceContainer,
						snapOffset,
					});
				} else {
					const delta = monitor.getDifferenceFromInitialOffset();
					if (delta && !("newType" in item)) {
						moveElement({
							item,
							delta,
							snapOffset,
							isMultiDrag,
							selected,
							referenceContainer,
							setHovered,
						});
					}
				}
			}
		},
		[dropNewElement, isDinEditable, moveElement]
	);
};

function isDinSegment(referenceContainer?: PartialSegment | PartialSection): boolean {
	return isSegment(referenceContainer) && referenceContainer.dinTemplate !== undefined;
}

function isElementInsideSection(
	postY: number,
	pageHeight: number,
	currentSection?: OmitId<PartialSection>,
	getSection?: (pageOrientation: PageOrientation, usage: SectionUsage) => PartialSection | undefined,
	isSectionStage?: boolean
) {
	const pageNumber = Math.ceil(postY / pageHeight);
	const section = isSectionStage
		? currentSection
		: currentSection?.pageOrientation && getSection
			? getSection(currentSection.pageOrientation, EditorUtils.getSegmentSectionUsage(pageNumber, currentSection))
			: undefined;
	return (
		postY <= (pageNumber - 1) * pageHeight + (section?.headerHeight?.value || 0) ||
		postY >= pageNumber * pageHeight - (section?.footerHeight?.value || 0)
	);
}

function isTopMarginOverlapSection(
	postY: number,
	pageHeight: number,
	segmentSection?: OmitId<PartialSection>,
	getSection?: (pageOrientation: PageOrientation, usage: SectionUsage) => PartialSection | undefined,
	marginTop: number = 0
) {
	const startMarginPageNumber = Math.ceil((postY - marginTop) / pageHeight);
	const startPosYPageNumber = Math.ceil(postY / pageHeight);

	const section =
		segmentSection?.pageOrientation && getSection
			? getSection(
					segmentSection.pageOrientation,
					EditorUtils.getSegmentSectionUsage(startMarginPageNumber, segmentSection)
				)
			: undefined;

	return (
		(section?.footerHeight?.value && startMarginPageNumber !== startPosYPageNumber) ||
		postY - marginTop < (startMarginPageNumber - 1) * pageHeight + (section?.headerHeight?.value || 0)
	);
}

function isAllowDrop(
	postY: number,
	pageHeight: number,
	referenceContainer?: PartialSection | PartialSegment | PartialArea | PartialOverride | PartialBoundingBox,
	segmentSection?: OmitId<PartialSection>,
	getSection?: (pageOrientation: PageOrientation, usage: SectionUsage) => PartialSection | undefined,
	marginTop?: number
) {
	if (ElementsUtils.isWrapperElement(referenceContainer as PartialAnyPrintModelElement)) {
		return true;
	}

	if (
		referenceContainer &&
		isPartialSection(referenceContainer) &&
		!isElementInsideSection(postY, pageHeight, referenceContainer, getSection, true)
	) {
		return false;
	}

	if (
		referenceContainer &&
		isSegment(referenceContainer) &&
		(isElementInsideSection(postY, pageHeight, segmentSection, getSection) ||
			isTopMarginOverlapSection(postY, pageHeight, segmentSection, getSection, marginTop))
	) {
		return false;
	}
	return true;
}

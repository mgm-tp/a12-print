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
import { useMemo } from "react";
import { useDrop } from "react-dnd";
import { useDispatch, useSelector } from "react-redux";
import debounce from "lodash/debounce.js";

import { StageRegion } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import {
	isPartialSection,
	Measure,
	PageOrientation,
	PartialSection,
	PartialTableLayout,
	PartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import {
	changeMmMeasureValue,
	createPlainMmMeasure,
	createPlainMmMeasureFromPx,
	EditorUtils,
	PlainMeasureDimensions,
	PlainMeasurePosition,
} from "../../../utils/index.js";
import {
	DetailDataActions,
	DetailViewActions,
	InteractionLogActions,
	TransactionLogStateActions,
} from "../../../redux/index.js";
import { RESOURCE_KEYS } from "../../../localization/index.js";
import { PrintEngineState } from "../../../store/root-reducer.js";
import { ToolbarItem } from "../../../types/toolbar-item.js";
import { EditorConst } from "../../../constant/editor.js";
import { ContextMenu } from "../../context-menu/ContextMenu.js";
import { ContextMenuWrapper } from "../../context-menu/ContextMenuWrapper.js";
import { DragElementLayerWrapper } from "../../drag-and-drop/index.js";
import { Resizable } from "../../resizable/index.js";
import { Toolbar } from "../../toolbar/index.js";
import { DefaultQuickEditBar } from "../../quick-edit-bar/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { ElementTypes } from "../../../constant/elements.js";
import { ContextMenuItem, ContextMenuOption, DragItem } from "../../../types/index.js";
import { EDITOR_DIMENSIONS, EditorContext } from "../../editor-stage/editor-context.js";
import { DefaultElementContainer } from "../../element-container/DefaultElementContainer.js";

import { DefaultEditorProps } from "../editor-interface.js";
import { StyledBasicEditor, StyledDropContainer, StyledEditorWrapper } from "../shared-components/Base.styled.js";
import { useCopyPaste, useHandleDrop, useHoverLines, useSelectRect } from "../hooks/index.js";
import { EditorContainer } from "../shared-components/EditorContainer.js";
import { DragSourceWrapper } from "../shared-components/DragSourceWrapper.js";
import { useGroupElements } from "../hooks/use-group-elements.js";

const { PX_TO_MM } = EditorConst;

export const BasicDefaultEditor = ({
	referenceContainer,
	borderProperties,
	isActive,
	numberOfPages = 1,
	renderEditorSlots,
	renderTopSlots,
	renderElementReferences,
}: DefaultEditorProps) => {
	const { elementReferences, setCopyElements } = React.useContext(EditorContext);
	const editorDimensions = useSelector(PrintEngineSelectors.editorDimensions);
	//
	// Refs, states, dispatch, selects
	//
	const bodyRef = React.useRef<HTMLDivElement>(null);
	const editorRef = React.useRef<HTMLDivElement>(null);
	const editorStageRef = React.useRef<HTMLDivElement>(null);
	const [bodyState, setBodyState] = React.useState<HTMLDivElement | null>(null);
	const [editorState, setEditorState] = React.useState<HTMLDivElement | null>(null);

	React.useLayoutEffect(() => {
		setBodyState(bodyRef.current);
		setEditorState(editorRef.current);
	}, []);

	const dispatch = useDispatch();
	const { editorOptions } = useSelector(PrintEngineSelectors.printEditorState);
	const { zoomFactor } = editorOptions;

	const detailDataId = useSelector(PrintEngineSelectors.currentDetailDataId);
	const detailData = useSelector(PrintEngineSelectors.currentDetailData);

	const debouncedFn = React.useMemo(
		() =>
			debounce((fn, ...args) => fn(...args), 400, {
				leading: true,
				trailing: false,
				maxWait: 400,
			}),
		[]
	);

	//
	// useStates
	//
	const [selected, setSelected] = React.useState<string[]>([]);
	const [outOfBoxList, setOutOfBoxList] = React.useState<string[]>([]);
	const [snapOffset, setSnapOffset] = React.useState<PlainMeasurePosition>({
		x: createPlainMmMeasure(0),
		y: createPlainMmMeasure(0),
	});
	const [isDraggingGL, setIsDraggingGL] = React.useState(false);
	const [collisionsList, setCollisionsList] = React.useState<string[]>([]);
	const [isResizing, setIsResizing] = React.useState(false);

	const selectedElementIds = useSelector((state: PrintEngineState) =>
		PrintEngineSelectors.elementIdsWithoutOverrides(state, selected)
	);
	const isAnyOverrideSelected = useSelector((state: PrintEngineState) =>
		PrintEngineSelectors.isAnyOverrideSelected(state, selected)
	);
	const selectedElements = useSelector((state: PrintEngineState) =>
		PrintEngineSelectors.multiplePrintModelElements(state, selected)
	);
	const handleDrop = useHandleDrop();
	const setHoveredRef = React.useRef<React.Dispatch<
		React.SetStateAction<PartialValidPlaceableReference | null>
	> | null>(null);

	//
	// dnd drop
	//
	const [{ isOver, draggingItem }, drop] = useDrop(
		() => ({
			accept: Object.keys(ElementTypes),
			drop: (item: DragItem, monitor) =>
				handleDrop({
					item,
					monitor,
					editorState,
					snapOffset,
					isMultiDrag: monitor.isOver() && selected.length > 1 && selected.includes(item.refId),
					selected,
					referenceContainer,
					setHovered: value => setHoveredRef.current?.(value),
				}),
			collect: monitor => ({ isOver: monitor.isOver(), draggingItem: monitor.getItem() }),
		}),
		[referenceContainer, snapOffset, handleDrop, selected]
	);

	const isMultiDrag = useMemo(
		() => isOver && selected.length > 1 && selected.includes(draggingItem?.refId),
		[draggingItem?.refId, isOver, selected]
	);

	//
	// custom hooks
	//
	const { selectRectMouseDown, selectRectMouseMove, selectRectMouseUp, SelectRect } = useSelectRect(
		editorState,
		zoomFactor,
		setSelected
	);

	const { pasteCopyElements } = useCopyPaste({
		setOutOfBoxList,
		editorState,
		zoomFactor,
	});

	const { hovered, setHovered, getHoverLines } = useHoverLines(selected, elementReferences, isOver, zoomFactor);

	React.useEffect(() => {
		setHoveredRef.current = setHovered;
	}, [setHovered]);

	const groupElements = useGroupElements();

	const selectElement = React.useCallback(
		(event: React.MouseEvent<HTMLDivElement>, element: PartialValidPlaceableReference) => {
			event.stopPropagation();
			let newSelected = [...selected];
			if (event.ctrlKey) {
				const curElIndex = selected.findIndex(selectedElId => selectedElId === element.refId);
				if (curElIndex > -1) {
					newSelected.splice(curElIndex, 1);
				} else {
					newSelected.push(element.refId);
				}
			} else {
				newSelected = [element.refId];
			}
			setSelected(newSelected);
			dispatch(DetailViewActions.updateVisibilityConfig({ selected: newSelected }));
		},
		[dispatch, selected]
	);

	const deleteSelectedEls = React.useCallback(() => {
		if (referenceContainer) {
			const allRelatedElementIds = selectedElements.reduce<string[]>((res, el) => {
				if (PartialTableLayout.isInstance(el)) {
					const cellRefIds = (el.tableLayout?.cells?.map(cell => cell.refId).filter(Boolean) ||
						[]) as string[];
					return [...res, el.id, ...cellRefIds];
				}
				return [...res, el.id];
			}, []);

			const placeableIds = elementReferences.filter(ref => selected.includes(ref.refId)).map(ref => ref.id);

			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.editor.deleteElementsOnStage,
					region: StageRegion.DEFAULT,
					affectedItems: selectedElements.flatMap(el => {
						return {
							type: "printModelElement",
							id: el.id,
						};
					}),
					transactionLogActions: [
						TransactionLogStateActions.updateReferenceElements({
							data: elementReferences.filter(el => !selected.includes(el.refId)),
						}),
					],
				})
			);

			if (
				(detailData?.refId && allRelatedElementIds.includes(detailData.refId)) ||
				(detailData?.placeableRefId && placeableIds.includes(detailData.placeableRefId))
			) {
				dispatch(DetailDataActions.remove({ containerId: detailDataId }));
			}
			setSelected([]);
		}
	}, [referenceContainer, dispatch, elementReferences, selectedElements, detailData, selected, detailDataId]);

	const groupSelectedEls = React.useCallback(() => {
		groupElements(selected);
	}, [groupElements, selected]);

	const moveByArrowKey = React.useCallback(
		(arrowKey: string) => {
			if (!editorState || !referenceContainer) {
				return;
			}
			const editorClientRect = editorState.getBoundingClientRect();

			const newDragElements = elementReferences.reduce((res: PartialValidPlaceableReference[], nextEl) => {
				if (selectedElementIds.includes(nextEl.refId)) {
					const { x, y, id } = nextEl.position;

					const newPosition = {
						id,
						x: updateXFromArrowKey(x, arrowKey),
						y: updateYFromArrowKey(y, arrowKey),
					};
					res.push({
						...nextEl,
						position: newPosition,
					});
				}
				return res;
			}, []);
			const unchangedElements = elementReferences.filter(el => !selectedElementIds.includes(el.refId));

			const editorClientRectX = PX_TO_MM(editorClientRect.x);
			const editorClientRectY = PX_TO_MM(editorClientRect.y);
			const boxRect = {
				x: createPlainMmMeasure(editorClientRectX),
				y: createPlainMmMeasure(editorClientRectY),
				minWidth: createPlainMmMeasureFromPx(editorClientRect.width / zoomFactor),
				minHeight: createPlainMmMeasureFromPx(editorClientRect.height / zoomFactor),
			};

			const isInsideSectionBounds =
				isPartialSection(referenceContainer) &&
				(referenceContainer.footerHeight?.value || referenceContainer.headerHeight?.value);

			if (
				isInsideSectionBounds &&
				!validateSectionBounds(
					newDragElements,
					unchangedElements,
					referenceContainer,
					editorClientRectX,
					editorClientRectY,
					boxRect
				)
			) {
				return;
			}

			if (
				!validateSegmentBounds(
					newDragElements,
					unchangedElements,
					editorClientRectX,
					editorClientRectY,
					boxRect
				)
			) {
				return;
			}

			const newReferenceList = [...unchangedElements, ...newDragElements];

			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.editor.moveElementByArrowKey,
					region: StageRegion.DEFAULT,
					transactionLogActions: [
						TransactionLogStateActions.updateReferenceElements({
							data: newReferenceList,
						}),
					],
				})
			);
		},
		[dispatch, elementReferences, editorState, referenceContainer, selectedElementIds, zoomFactor]
	);

	const onEditorKeyDown = React.useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (selectedElementIds.length > 0) {
				if (e.key === "Delete" || e.key === "Del") {
					if (!isAnyOverrideSelected) {
						deleteSelectedEls();
					}
				} else if (
					e.key === "ArrowLeft" ||
					e.key === "ArrowRight" ||
					e.key === "ArrowUp" ||
					e.key === "ArrowDown"
				) {
					e.preventDefault();
					debouncedFn(moveByArrowKey, e.key);
				}
			}
			if (e.metaKey || e.ctrlKey) {
				if (e.key === "c") {
					setCopyElements(elementReferences.filter(dragEl => selectedElementIds.includes(dragEl.refId)));
				} else if (e.key === "v") {
					pasteCopyElements();
				} else if (e.key === "g") {
					e.preventDefault();
					groupSelectedEls();
				}
			}
		},
		[
			debouncedFn,
			deleteSelectedEls,
			elementReferences,
			groupSelectedEls,
			isAnyOverrideSelected,
			moveByArrowKey,
			pasteCopyElements,
			selectedElementIds,
			setCopyElements,
		]
	);

	const onContextItemClick = React.useCallback(
		(event: React.MouseEvent<HTMLElement>, contextItem: ContextMenuItem, clickPos: PlainMeasurePosition) => {
			switch (contextItem.id) {
				case ContextMenuOption.Copy:
					setCopyElements(elementReferences.filter(dragEl => selected.includes(dragEl.refId)));
					editorStageRef?.current?.focus();
					break;
				case ContextMenuOption.Paste:
					pasteCopyElements(clickPos);
					break;
				case ContextMenuOption.HideConditions:
					if (selected.length === 1) {
						dispatch(
							DetailViewActions.openVisibilityConfig(
								elementReferences.find(ref => ref.refId === selected[0])?.id || ""
							)
						);
					}
					break;
				case ContextMenuOption.Delete:
					if (selected.length > 0) {
						deleteSelectedEls();
					}
					break;
				case ContextMenuOption.Group:
					if (selected.length > 0) {
						groupSelectedEls();
					}
					break;
				default:
					return;
			}
		},
		[deleteSelectedEls, dispatch, elementReferences, groupSelectedEls, pasteCopyElements, selected, setCopyElements]
	);

	const onElementDoubleClick = React.useCallback(
		(element: PartialValidPlaceableReference) => {
			dispatch(DetailViewActions.openElementForm(element.refId));
		},
		[dispatch]
	);

	//
	// useEffects
	//
	React.useEffect(() => {
		setSelected(detailData?.refId ? [detailData.refId] : []);
	}, [detailData?.refId]);

	React.useEffect(() => {
		setCollisionsList(EditorUtils.checkCollisionsAll(elementReferences).map(element => element.refId));
		if (editorState) {
			const editorPosition = editorState.getBoundingClientRect();
			const boxRect = {
				x: createPlainMmMeasureFromPx(editorPosition.x),
				y: createPlainMmMeasureFromPx(editorPosition.y),
				minWidth: createPlainMmMeasureFromPx(editorPosition.width / zoomFactor),
				minHeight: createPlainMmMeasureFromPx(editorPosition.height / zoomFactor),
			};
			setOutOfBoxList(EditorUtils.checkAllElementsInBox(elementReferences, boxRect).map(el => el.refId));
		}
	}, [elementReferences, editorState, zoomFactor, numberOfPages]);

	return (
		<StyledEditorWrapper>
			<Toolbar
				leftItems={[
					ToolbarItem.ElementLibrary,
					ToolbarItem.ZoomFactor,
					ToolbarItem.HideFrames,
					ToolbarItem.HideMargins,
				]}
				rightItems={[
					<DefaultQuickEditBar
						key="default-quick-edit-bar"
						selected={selected}
						deleteSelectedEls={deleteSelectedEls}
						groupSelectedEls={groupSelectedEls}
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
				{getHoverLines()}
				<DragElementLayerWrapper
					snapOffset={snapOffset}
					setSnapOffset={setSnapOffset}
					selected={selected}
					isOver={isOver}
					bodyState={bodyState}
					editorState={editorState}
				/>
				<ContextMenuWrapper>
					<ContextMenu
						onContextItemClick={onContextItemClick}
						editorState={editorState}
						selected={selected}
						hovered={hovered}
						setSelected={setSelected}
						elementReferences={elementReferences}
					>
						<StyledDropContainer
							ref={ref => {
								drop(ref);
							}}
							onMouseDown={selectRectMouseDown}
							onMouseMove={selectRectMouseMove}
							onMouseUp={selectRectMouseUp}
						>
							{SelectRect}
							<StyledBasicEditor
								ref={editorStageRef}
								onKeyDown={onEditorKeyDown}
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
											onClick: selectElement,
											onDoubleClick: onElementDoubleClick,
											selected,
											collisionsList,
											outOfBoxList,
											isMultiDrag,
											hovered,
											isResizing,
											canDrag: !isAnyOverrideSelected,
											setIsDraggingGL,
											setHovered,
										})
									: elementReferences.map(ref => (
											<DragSourceWrapper
												item={ref}
												key={ref.refId}
												onClick={selectElement}
												onDoubleClick={() => onElementDoubleClick(ref)}
												setIsDraggingGL={setIsDraggingGL}
												isSelected={selected.includes(ref.refId)}
												isColliding={collisionsList.includes(ref.refId)}
												isOutsideBox={outOfBoxList.includes(ref.refId)}
												isMultiDrag={isMultiDrag}
												hovered={hovered}
												setHovered={setHovered}
												isResizing={isResizing}
												canDrag={!isAnyOverrideSelected}
											>
												<DefaultElementContainer
													reference={ref}
													isHovered={hovered?.id === ref.id}
												/>
											</DragSourceWrapper>
										))}
								{renderEditorSlots?.(bodyState, editorState, numberOfPages)}
							</StyledBasicEditor>
							<Resizable
								selected={selected}
								isDragging={isDraggingGL}
								setOutOfBoxList={setOutOfBoxList}
								editorState={editorState}
								setIsResizing={setIsResizing}
							/>
						</StyledDropContainer>
					</ContextMenu>
				</ContextMenuWrapper>
			</EditorContainer>
		</StyledEditorWrapper>
	);
};

function updateXFromArrowKey(x: Measure, arrowKey: string) {
	if (arrowKey === "ArrowLeft") {
		return changeMmMeasureValue(x.value - 1, x);
	}

	if (arrowKey === "ArrowRight") {
		return changeMmMeasureValue(x.value + 1, x);
	}

	return x;
}

function updateYFromArrowKey(y: Measure, arrowKey: string) {
	if (arrowKey === "ArrowUp") {
		return changeMmMeasureValue(y.value - 1, y);
	}

	if (arrowKey === "ArrowDown") {
		return changeMmMeasureValue(y.value + 1, y);
	}

	return y;
}

const validateSectionBounds = (
	newDragElements: PartialValidPlaceableReference[],
	unchangedElements: PartialValidPlaceableReference[],
	referenceContainer: PartialSection,
	editorClientRectX: number,
	editorClientRectY: number,
	boxRect: PlainMeasurePosition & PlainMeasureDimensions
): boolean => {
	function getHeaderBoxRect() {
		if (!referenceContainer.headerHeight?.value) {
			return undefined;
		}

		return {
			...boxRect,
			minHeight: createPlainMmMeasure(referenceContainer.headerHeight.value),
		};
	}

	function getFooterBoxRect() {
		if (!referenceContainer.footerHeight?.value) {
			return undefined;
		}

		const editorHeight =
			referenceContainer.pageOrientation === PageOrientation.Landscape
				? EDITOR_DIMENSIONS.minWidth.value
				: EDITOR_DIMENSIONS.minHeight.value;
		return {
			...boxRect,
			y: createPlainMmMeasure(editorClientRectY + (editorHeight - referenceContainer.footerHeight.value)),
			minHeight: createPlainMmMeasure(referenceContainer.footerHeight.value),
		};
	}

	const headerBoxRect = getHeaderBoxRect();
	const footerBoxRect = getFooterBoxRect();

	const hasHeader = !!headerBoxRect;
	const hasFooter = !!footerBoxRect;

	for (const newDragEl of newDragElements) {
		const elRect = {
			x: createPlainMmMeasure(newDragEl.position.x.value + editorClientRectX),
			y: createPlainMmMeasure(newDragEl.position.y.value + editorClientRectY),
			minWidth: createPlainMmMeasure(newDragEl.dimensions.minWidth.value),
			minHeight: createPlainMmMeasure(newDragEl.dimensions.minHeight.value),
		};

		if (EditorUtils.checkCollisionsSingle(newDragEl, unchangedElements).length > 0) {
			return false;
		}

		const isInHeader = hasHeader && EditorUtils.isElementInBox(headerBoxRect, elRect);
		const isInFooter = hasFooter && EditorUtils.isElementInBox(footerBoxRect, elRect);

		if (!isInHeader && !isInFooter) {
			return false;
		}
	}

	return true;
};

function validateSegmentBounds(
	newDragElements: PartialValidPlaceableReference[],
	unchangedElements: PartialValidPlaceableReference[],
	editorClientRectX: number,
	editorClientRectY: number,
	boxRect: PlainMeasurePosition & PlainMeasureDimensions
) {
	for (const newDragEl of newDragElements) {
		const elRect = {
			x: createPlainMmMeasure(newDragEl.position.x.value + editorClientRectX),
			y: createPlainMmMeasure(newDragEl.position.y.value + editorClientRectY),
			minWidth: createPlainMmMeasure(newDragEl.dimensions.minWidth.value),
			minHeight: createPlainMmMeasure(newDragEl.dimensions.minHeight.value),
		};
		if (
			EditorUtils.checkCollisionsSingle(newDragEl, unchangedElements).length > 0 ||
			!EditorUtils.isElementInBox(boxRect, elRect)
		) {
			return false;
		}
	}

	return true;
}

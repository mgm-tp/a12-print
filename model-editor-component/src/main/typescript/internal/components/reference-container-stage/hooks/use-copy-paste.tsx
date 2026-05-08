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
import { nanoid } from "nanoid";
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";

import { StageRegion } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import { clonePrintModelEntity } from "@com.mgmtp.a12.print/print-model-api/lib/utils/print-model/index.js";
import {
	InputSource,
	isPartialSection,
	isPartialWatermark,
	PageBreakBehavior,
	PartialValidPlaceableReference,
	PrintModelEntity,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/lib/input-source/input-source.js";
import { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";

import {
	PlainMeasurePosition,
	createMmMeasure,
	createPlainMmMeasureFromPx,
	EditorUtils,
	ElementsUtils,
} from "../../../utils/index.js";
import { TransactionLogStateActions } from "../../../redux/transaction-log-state/index.js";
import { InteractionLogActions } from "../../../redux/interaction-log/index.js";
import { RESOURCE_KEYS } from "../../../localization/index.js";
import { EditorConst } from "../../../constant/editor.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { EditorContext } from "../../editor-stage/editor-context.js";

interface CopyPasteParams {
	setOutOfBoxList: (value: React.SetStateAction<string[]>) => void;
	editorState: HTMLDivElement | null;
	zoomFactor: number;
}
const { MM_TO_PX, PX_TO_MM } = EditorConst;

export const useCopyPaste = (params: CopyPasteParams) => {
	const dispatch = useDispatch();
	const isDinTemplateSegmentEditor = useSelector(PrintEngineSelectors.isDinTemplateSegmentEditor);
	const { elementReferences, copyElements } = React.useContext(EditorContext);
	const currentContainer = useSelector(PrintEngineSelectors.currentContainerElement);
	const wrappers = useSelector(PrintEngineSelectors.wrappers);

	const { setOutOfBoxList, editorState, zoomFactor } = params;

	const clonePageBreakBehavior = React.useCallback(
		(
			pageBreakBehavior?: DeepPartialRecursive<InputSource<PageBreakBehavior>> & PrintModelEntity
		): (DeepPartialRecursive<InputSource<PageBreakBehavior>> & PrintModelEntity) | undefined => {
			if (!pageBreakBehavior) {
				return pageBreakBehavior;
			}

			if (!currentContainer) {
				throw new Error("No current container available to clone page break behavior");
			}

			const newPageBreakBehavior = ElementsUtils.createPageBreakBehavior(currentContainer, wrappers.at(-1));

			if (!wrappers.at(-1) && (isPartialSection(currentContainer) || isPartialWatermark(currentContainer))) {
				return newPageBreakBehavior;
			}

			if (pageBreakBehavior.source !== PossibleInputSource.INHERITED) {
				return {
					...newPageBreakBehavior,
					value: pageBreakBehavior.value,
					source: pageBreakBehavior.source,
				};
			}
			if (!wrappers.length) {
				return {
					...newPageBreakBehavior,
					source: PossibleInputSource.DEFAULT,
				};
			}

			const referenceId = wrappers.at(-1)?.wrapperContext?.placeableReference?.id;
			if (!referenceId) {
				throw new Error("No selected placeable reference in the current wrapper.");
			}
			return {
				...newPageBreakBehavior,
				source: PossibleInputSource.INHERITED,
				reference: referenceId,
			};
		},
		[currentContainer, wrappers]
	);

	const pasteCopyElements = React.useCallback(
		(pos?: PlainMeasurePosition) => {
			if (isDinTemplateSegmentEditor) {
				return;
			}
			if (copyElements.length > 0) {
				const newPlaceableRefList: PartialValidPlaceableReference[] = [...elementReferences];
				const copyElementIdsList: TransactionLogStateActions.CopyElementIds[] = [];
				const referenceIdMap: Map<string, string> = new Map();
				if (pos) {
					const posX = PX_TO_MM(MM_TO_PX(pos.x.value) / zoomFactor);
					const posY = PX_TO_MM(MM_TO_PX(pos.y.value) / zoomFactor);

					const closestEl = copyElements.reduce((res, next) => {
						return EditorUtils.isCloserToTopLeft(res.position, next.position) ? res : next;
					});
					copyElements.forEach(elementToCopy => {
						const newId = nanoid();

						const newPlaceableRef = {
							...clonePrintModelEntity(elementToCopy),
							refId: newId,
							position: {
								id: nanoid(),
								x: createMmMeasure(
									elementToCopy.refId === closestEl.refId
										? posX
										: posX + elementToCopy.position.x.value - closestEl.position.x.value
								),
								y: createMmMeasure(
									elementToCopy.refId === closestEl.refId
										? posY
										: posY + elementToCopy.position.y.value - closestEl.position.y.value
								),
							},
							pageBreakBehavior: clonePageBreakBehavior(elementToCopy.pageBreakBehavior),
						};

						newPlaceableRefList.push(newPlaceableRef);
						referenceIdMap.set(elementToCopy.id, newPlaceableRef.id);
						copyElementIdsList.push({ copyId: elementToCopy.refId, newId });
					});
				} else {
					copyElements.forEach(elementToCopy => {
						const newId = nanoid();
						const newPlaceableRef = {
							...clonePrintModelEntity(elementToCopy),
							refId: newId,
							position: {
								id: nanoid(),
								x: createMmMeasure(elementToCopy.position.x.value + 3),
								y: createMmMeasure(elementToCopy.position.y.value + 3),
							},
							pageBreakBehavior: clonePageBreakBehavior(elementToCopy.pageBreakBehavior),
						};

						newPlaceableRefList.push(newPlaceableRef);
						copyElementIdsList.push({ copyId: elementToCopy.refId, newId });
						referenceIdMap.set(elementToCopy.id, newPlaceableRef.id);
					});
				}

				dispatch(
					InteractionLogActions.start({
						description: RESOURCE_KEYS.interaction.useCopyPaste.pasteElements,
						region: StageRegion.DEFAULT,
						transactionLogActions: [
							TransactionLogStateActions.copyPrintModelElements({
								data: {
									newReferenceElements: newPlaceableRefList,
									copyElementIdsList,
									referenceIdMap,
								},
							}),
						],
					})
				);
				if (editorState) {
					const editorClientRect = editorState.getBoundingClientRect();
					const boxRect = {
						x: createPlainMmMeasureFromPx(editorClientRect.x),
						y: createPlainMmMeasureFromPx(editorClientRect.y),
						minWidth: createPlainMmMeasureFromPx(editorClientRect.width / zoomFactor),
						minHeight: createPlainMmMeasureFromPx(editorClientRect.height / zoomFactor),
					};
					const allOutOfBoxEls = EditorUtils.checkAllElementsInBox(newPlaceableRefList, boxRect);
					setOutOfBoxList(allOutOfBoxEls.map(el => el.refId));
				}
			}
		},
		[
			isDinTemplateSegmentEditor,
			copyElements,
			elementReferences,
			dispatch,
			editorState,
			zoomFactor,
			clonePageBreakBehavior,
			setOutOfBoxList,
		]
	);

	return { pasteCopyElements };
};

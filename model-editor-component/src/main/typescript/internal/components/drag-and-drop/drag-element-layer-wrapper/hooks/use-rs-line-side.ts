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
import { useCallback } from "react";

import type { PartialValidPlaceableReference, Measure } from "@com.mgmtp.a12.print/print-model-api/model";

import { useGetSectionOffset } from "../../../../hooks/use-get-section-offset.js";
import type { PlainMeasurePosition } from "../../../../utils/measure-utils.js";
import { createPlainMmMeasure } from "../../../../utils/measure-utils.js";
import type { OmitId } from "../../../../utils/type-utils.js";
import type { DndRsLine } from "../../../../types/dnd.js";

const SNAP_TRIGGER_MM = 3;

export function useRsLineSide() {
	const getSectionOffset = useGetSectionOffset();

	const calculateHorizontalRsLine = useCallback(
		(
			element: PartialValidPlaceableReference,
			mainTarget: PartialValidPlaceableReference,
			itemPos: PlainMeasurePosition
		) => {
			const itemPosStartSide = itemPos.y.value;
			const elPosStartSide = element.position.y.value;
			const itemPosMidSide = itemPos.y.value + mainTarget.dimensions.minHeight.value / 2;
			const elPosMidSide = element.position.y.value + element.dimensions.minHeight.value / 2;
			const itemPosEndSide = itemPos.y.value + mainTarget.dimensions.minHeight.value;
			const elPosEndSide = element.position.y.value + element.dimensions.minHeight.value;
			const elEndSectionOffset = getSectionOffset(
				element.position.y.value,
				element.position.y.value + element.dimensions.minHeight.value,
				element
			);
			const elMidSectionOffset = getSectionOffset(
				element.position.y.value,
				element.position.y.value + element.dimensions.minHeight.value / 2,
				element
			);

			let rsLine;

			if (Math.abs(elPosStartSide - itemPosStartSide) <= SNAP_TRIGGER_MM) {
				rsLine = {
					elPosSide: elPosStartSide,
					type: "same_start",
				};
			}
			if (Math.abs(elPosMidSide + elMidSectionOffset - itemPosMidSide) <= SNAP_TRIGGER_MM) {
				rsLine = {
					elPosSide: elPosMidSide + elMidSectionOffset,
					type: "same_mid",
				};
			}
			if (Math.abs(elPosEndSide + elEndSectionOffset - itemPosEndSide) <= SNAP_TRIGGER_MM) {
				rsLine = {
					elPosSide: elPosEndSide + elEndSectionOffset,
					type: "same_end",
				};
			}

			return rsLine;
		},
		[getSectionOffset]
	);

	const createHorizontalSnapLine = useCallback(
		({
			element,
			itemPos,
			linesArr,
			mainTarget,
			rsLine,
		}: {
			element: PartialValidPlaceableReference;
			mainTarget: PartialValidPlaceableReference;
			itemPos: PlainMeasurePosition;
			rsLine: { elPosSide: number; type: string };
			linesArr: DndRsLine[];
		}) => {
			const height = Math.min(element.dimensions.minHeight.value, mainTarget.dimensions.minHeight.value);
			if (element.position.x.value + element.dimensions.minWidth.value < itemPos.x.value) {
				linesArr.push({
					start: {
						x: createPlainMmMeasure(element.position.x.value + element.dimensions.minWidth.value),
						y: createPlainMmMeasure(rsLine.elPosSide),
					},
					end: {
						x: itemPos.x,
						y: createPlainMmMeasure(rsLine.elPosSide),
					},
					dim: height,
					type: rsLine.type + "_right",
				});
				return;
			}

			if (element.position.x.value > itemPos.x.value) {
				linesArr.push({
					start: {
						x: createPlainMmMeasure(itemPos.x.value + mainTarget.dimensions.minWidth.value),
						y: createPlainMmMeasure(rsLine.elPosSide),
					},
					end: {
						x: element.position.x,
						y: createPlainMmMeasure(rsLine.elPosSide),
					},
					dim: height,
					type: rsLine.type + "_left",
				});
			}
		},
		[]
	);

	const createHorizonalEdgeSnapLine = useCallback(
		({
			element,
			itemPos,
			linesArr,
			mainTarget,
			elPosYBot,
		}: {
			element: PartialValidPlaceableReference;
			mainTarget: PartialValidPlaceableReference;
			itemPos: PlainMeasurePosition;
			linesArr: DndRsLine[];
			elPosYBot: OmitId<Measure>;
		}) => {
			const elPosXEnd = createPlainMmMeasure(element.position.x.value + element.dimensions.minWidth.value);
			const itemPosXEnd = createPlainMmMeasure(itemPos.x.value + mainTarget.dimensions.minWidth.value);

			if (itemPos.x.value >= element.position.x.value && itemPos.x.value <= elPosXEnd.value) {
				linesArr.push({
					start: {
						x: element.position.x,
						y: elPosYBot,
					},
					end: {
						x: itemPos.x,
						y: elPosYBot,
					},
					dim: 0,
					type: "overlapLeft",
				});
				return;
			}

			if (element.position.x.value > itemPos.x.value && element.position.x.value <= itemPosXEnd.value) {
				linesArr.push({
					start: {
						x: itemPos.x,
						y: elPosYBot,
					},
					end: {
						x: element.position.x,
						y: elPosYBot,
					},
					dim: 0,
					type: "overlapRight",
				});
			}

			if (itemPos.x.value > element.position.x.value) {
				linesArr.push({
					start: {
						x: elPosXEnd,
						y: elPosYBot,
					},
					end: {
						x: itemPos.x,
						y: elPosYBot,
					},
					dim: 0,
					type: "outsideRight",
				});
				return;
			}

			linesArr.push({
				start: {
					x: itemPosXEnd,
					y: elPosYBot,
				},
				end: {
					x: element.position.x,
					y: elPosYBot,
				},
				dim: 0,
				type: "outsideLeft",
			});
		},
		[]
	);

	const getRsLinesSide = useCallback(
		(
			element: PartialValidPlaceableReference,
			mainTarget: PartialValidPlaceableReference,
			itemPos: PlainMeasurePosition,
			linesArr: DndRsLine[]
		) => {
			const rsLine = calculateHorizontalRsLine(element, mainTarget, itemPos);

			if (rsLine) {
				createHorizontalSnapLine({ element, itemPos, linesArr, mainTarget, rsLine });
				return;
			}

			const elPosEndSide = element.position.y.value + element.dimensions.minHeight.value;
			const elEndSectionOffset = getSectionOffset(
				element.position.y.value,
				element.position.y.value + element.dimensions.minHeight.value,
				element
			);

			const elPosYBot = createPlainMmMeasure(elPosEndSide + elEndSectionOffset);
			const isSnap = Math.abs(elPosYBot.value - itemPos.y.value) <= SNAP_TRIGGER_MM;

			if (!isSnap) {
				return;
			}
			createHorizonalEdgeSnapLine({ element, itemPos, linesArr, mainTarget, elPosYBot });
		},
		[calculateHorizontalRsLine, createHorizonalEdgeSnapLine, createHorizontalSnapLine, getSectionOffset]
	);

	return getRsLinesSide;
}

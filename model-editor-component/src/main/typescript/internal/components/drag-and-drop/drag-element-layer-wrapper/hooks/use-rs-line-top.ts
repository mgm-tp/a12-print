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

import { PartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/lib/model/partial.js";

import { useGetSectionOffset } from "../../../../hooks/use-get-section-offset.js";
import { createPlainMmMeasure, PlainMeasurePosition } from "../../../../utils/measure-utils.js";
import { DndRsLine } from "../../../../types/dnd.js";

const SNAP_TRIGGER_MM = 3;

export function useRsLineTop() {
	const getSectionOffset = useGetSectionOffset();

	const calculateVerticalRsLine = useCallback(
		(
			el: PartialValidPlaceableReference,
			mainTarget: PartialValidPlaceableReference,
			itemPos: PlainMeasurePosition
		) => {
			const itemPosStartSide = itemPos.x.value;
			const elPosStartSide = el.position.x.value;
			const itemPosMidSide = itemPosStartSide + mainTarget.dimensions.minWidth.value / 2;
			const elPosMidSide = elPosStartSide + el.dimensions.minWidth.value / 2;
			const itemPosEndSide = itemPosStartSide + mainTarget.dimensions.minWidth.value;
			const elPosEndSide = elPosStartSide + el.dimensions.minWidth.value;

			if (Math.abs(itemPosStartSide - elPosStartSide) <= SNAP_TRIGGER_MM) {
				return {
					elPosSide: elPosStartSide,
					type: "same_start",
				};
			}
			if (Math.abs(itemPosMidSide - elPosMidSide) <= SNAP_TRIGGER_MM) {
				return {
					elPosSide: elPosMidSide,
					type: "same_mid",
				};
			}
			if (Math.abs(itemPosEndSide - elPosEndSide) <= SNAP_TRIGGER_MM) {
				return {
					elPosSide: elPosEndSide,
					type: "same_end",
				};
			}
			return undefined;
		},
		[]
	);

	const createVerticalSnapLine = useCallback(
		({
			el,
			mainTarget,
			itemPos,
			linesArr,
			rsLine,
		}: {
			el: PartialValidPlaceableReference;
			mainTarget: PartialValidPlaceableReference;
			itemPos: PlainMeasurePosition;
			linesArr: DndRsLine[];
			rsLine: { elPosSide: number; type: string };
		}) => {
			const width = Math.min(el.dimensions.minWidth.value, mainTarget.dimensions.minWidth.value);
			const elPosSide = createPlainMmMeasure(rsLine.elPosSide);
			const elEndSectionOffset = getSectionOffset(
				el.position.y.value,
				el.position.y.value + el.dimensions.minHeight.value,
				el
			);

			if (el.position.y.value + el.dimensions.minHeight.value + elEndSectionOffset < itemPos.y.value) {
				linesArr.push({
					start: {
						x: elPosSide,
						y: createPlainMmMeasure(
							el.position.y.value + el.dimensions.minHeight.value + elEndSectionOffset
						),
					},
					end: {
						x: elPosSide,
						y: itemPos.y,
					},
					dim: width,
					type: rsLine.type + "_bottom",
				});
				return;
			}

			if (el.position.y.value > itemPos.y.value) {
				linesArr.push({
					start: {
						x: elPosSide,
						y: createPlainMmMeasure(itemPos.y.value + mainTarget.dimensions.minHeight.value),
					},
					end: {
						x: elPosSide,
						y: el.position.y,
					},
					dim: width,
					type: rsLine.type + "_top",
				});
			}
		},
		[getSectionOffset]
	);

	const createVertialEdgeSnapLine = useCallback(
		({
			el,
			mainTarget,
			itemPos,
			linesArr,
		}: {
			el: PartialValidPlaceableReference;
			mainTarget: PartialValidPlaceableReference;
			itemPos: PlainMeasurePosition;
			linesArr: DndRsLine[];
		}) => {
			const elPosXRight = createPlainMmMeasure(el.position.x.value + el.dimensions.minWidth.value);
			const elEndSectionOffset = getSectionOffset(
				el.position.y.value,
				el.position.y.value + el.dimensions.minHeight.value,
				el
			);

			const elPosYEnd = createPlainMmMeasure(
				el.position.y.value + el.dimensions.minHeight.value + elEndSectionOffset
			);
			const itemPosYEnd = createPlainMmMeasure(itemPos.y.value + mainTarget.dimensions.minHeight.value);
			if (itemPos.y.value >= el.position.y.value && itemPos.y.value <= elPosYEnd.value) {
				linesArr.push({
					start: {
						x: elPosXRight,
						y: el.position.y,
					},
					end: {
						x: elPosXRight,
						y: itemPos.y,
					},
					dim: 0,
					type: "overlapTop",
				});
				return;
			}
			if (el.position.y.value > itemPos.y.value && el.position.y.value <= itemPosYEnd.value) {
				linesArr.push({
					start: {
						x: elPosXRight,
						y: itemPos.y,
					},
					end: {
						x: elPosXRight,
						y: el.position.y,
					},
					dim: 0,
					type: "overlapBottom",
				});
				return;
			}
			if (itemPos.y.value > el.position.y.value) {
				linesArr.push({
					start: {
						x: elPosXRight,
						y: elPosYEnd,
					},
					end: {
						x: elPosXRight,
						y: itemPos.y,
					},
					dim: 0,
					type: "outsideBottom",
				});
				return;
			}
			linesArr.push({
				start: {
					x: elPosXRight,
					y: itemPosYEnd,
				},
				end: {
					x: elPosXRight,
					y: el.position.y,
				},
				dim: 0,
				type: "outsideTop",
			});
		},
		[getSectionOffset]
	);

	const getRsLinesTop = useCallback(
		(
			el: PartialValidPlaceableReference,
			mainTarget: PartialValidPlaceableReference,
			itemPos: PlainMeasurePosition,
			linesArr: DndRsLine[]
		) => {
			const rsLine = calculateVerticalRsLine(el, mainTarget, itemPos);

			if (rsLine) {
				createVerticalSnapLine({ el, mainTarget, itemPos, linesArr, rsLine });
				return;
			}

			const elPosXRight = createPlainMmMeasure(el.position.x.value + el.dimensions.minWidth.value);
			const isSnap = Math.abs(elPosXRight.value - itemPos.x.value) <= SNAP_TRIGGER_MM;
			if (isSnap) {
				createVertialEdgeSnapLine({ el, mainTarget, itemPos, linesArr });
			}
		},
		[calculateVerticalRsLine, createVertialEdgeSnapLine, createVerticalSnapLine]
	);

	return getRsLinesTop;
}

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
import React from "react";

import { PartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { createPlainMmMeasure } from "../../../utils/index.js";
import { useGetSectionOffset } from "../../../hooks/use-get-section-offset.js";
import { IRsLine, ISide } from "../../../types/resize.js";
import { EditorContext } from "../../editor-stage/editor-context.js";

export function useResizeRelationLines() {
	const { elementReferences } = React.useContext(EditorContext);

	const [rsLineVert, setRsLineVert] = React.useState<IRsLine | null>(null);
	const [rsLineHor, setRsLineHor] = React.useState<IRsLine | null>(null);

	const getSectionOffset = useGetSectionOffset();

	const getElementRelationSides = React.useCallback(
		(el: PartialValidPlaceableReference, curEl: PartialValidPlaceableReference) => {
			const elRight = el.position.x.value + el.dimensions.minWidth.value;
			let elBottom = el.position.y.value + el.dimensions.minHeight.value;
			const elLeft = el.position.x.value;
			const elTop = el.position.y.value;
			const curElRight = curEl.position.x.value + curEl.dimensions.minWidth.value;
			let curElBottom = curEl.position.y.value + curEl.dimensions.minHeight.value;
			const curElLeft = curEl.position.x.value;
			const curElTop = curEl.position.y.value;

			const elSectionOffset = getSectionOffset(elTop, elBottom, el);
			const curElSectionOffset = getSectionOffset(curElTop, curElBottom, curEl);
			elBottom += elSectionOffset;
			curElBottom += curElSectionOffset;

			return { elRight, elLeft, elTop, elBottom, curElRight, curElLeft, curElTop, curElBottom };
		},
		[getSectionOffset]
	);

	const calcVerticalResizeRelationLines = React.useCallback(
		(
			el: PartialValidPlaceableReference,
			curEl: PartialValidPlaceableReference,
			side: string,
			linesArr: IRsLine[]
		) => {
			const { curElBottom, curElLeft, curElRight, curElTop, elBottom, elLeft, elRight, elTop } =
				getElementRelationSides(el, curEl);

			if (side === "left") {
				linesArr.push(
					// draw vertical line to other element when it's border aligns with the current elements left border
					...drawLeftVerticalLine({
						curElBottom,
						curElLeft,
						curElTop,
						elBottom,
						elLeft,
						elRight,
						elTop,
					})
				);
				return;
			}

			if (side === "right") {
				// draw vertical line to other element when it's border aligns with the current elements right border
				linesArr.push(
					...drawRightVerticalLine({
						curElBottom,
						curElRight,
						curElTop,
						elBottom,
						elLeft,
						elRight,
						elTop,
					})
				);
				return;
			}

			if (side === "top") {
				// draw vertical line to other elements bottom when their bottom side aligns with current elements top side
				linesArr.push(
					...drawTopVerticalLine({
						curElLeft,
						curElRight,
						curElTop,
						elBottom,
						elLeft,
						elRight,
					})
				);
				return;
			}

			if (side === "bottom") {
				// draw vertical line to other elements top when their top side aligns with current elements bottom side
				linesArr.push(
					...drawBottomVerticalLine({
						curElBottom,
						curElLeft,
						curElRight,
						elLeft,
						elRight,
						elTop,
					})
				);
			}
		},
		[getElementRelationSides]
	);

	const calcHorizontalResizeRelationLines = React.useCallback(
		(
			el: PartialValidPlaceableReference,
			curEl: PartialValidPlaceableReference,
			side: string,
			linesArr: IRsLine[]
		) => {
			const { curElBottom, curElLeft, curElRight, curElTop, elBottom, elLeft, elRight, elTop } =
				getElementRelationSides(el, curEl);

			if (side === "top") {
				// draw horizontal line to other element when it's border aligns with the current elements top border
				linesArr.push(
					...drawTopHorizontalLine({ curElLeft, curElRight, curElTop, elBottom, elLeft, elRight, elTop })
				);
			}

			if (side === "bottom") {
				// draw horizontal line to other element when it's border aligns with the current elements bottom border
				linesArr.push(
					...drawBottomHorizontalLine({
						curElBottom,
						curElLeft,
						curElRight,
						elBottom,
						elLeft,
						elRight,
						elTop,
					})
				);
			}

			if (side === "left") {
				// draw horizontal line to other elements right when their right side aligns with current element's left side
				linesArr.push(
					...drawLeftHorizontalLine({ curElBottom, curElLeft, curElTop, elBottom, elRight, elTop })
				);
			}

			if (side === "right") {
				// draw horizontal line to other elements left when their left side aligns with current element's right side
				linesArr.push(
					...drawRightHorizontalLine({ curElBottom, curElRight, curElTop, elBottom, elLeft, elTop })
				);
			}
		},
		[getElementRelationSides]
	);

	const calculateRelationLines = React.useCallback(
		(newEl: PartialValidPlaceableReference, side: ISide) => {
			const vertLines: IRsLine[] = [];
			const horLines: IRsLine[] = [];
			elementReferences.forEach(el => {
				if (el.refId === newEl.refId) {
					return;
				}
				calcVerticalResizeRelationLines(el, newEl, side, vertLines);
				calcHorizontalResizeRelationLines(el, newEl, side, horLines);
			});
			setRsLineVert(
				vertLines.reduce((res: null | IRsLine, next) => {
					if (res === null) {
						return next;
					}
					if (next.end.y.value - next.start.y.value < res.end.y.value - res.start.y.value) {
						return next;
					}
					return res;
				}, null)
			);
			setRsLineHor(
				horLines.reduce((res: null | IRsLine, next) => {
					if (res === null) {
						return next;
					}
					if (next.end.x.value - next.start.x.value < res.end.x.value - res.start.x.value) {
						return next;
					}
					return res;
				}, null)
			);
		},
		[calcHorizontalResizeRelationLines, calcVerticalResizeRelationLines, elementReferences]
	);

	const clearRelationLines = React.useCallback(() => {
		setRsLineVert(null);
		setRsLineHor(null);
	}, []);

	return { rsLineVert, rsLineHor, calculateRelationLines, clearRelationLines };
}

function createResizeRelationLine(yStart: number, yEnd: number, xStart: number, xEnd: number, type: ISide): IRsLine {
	return {
		start: {
			x: createPlainMmMeasure(xStart),
			y: createPlainMmMeasure(yStart),
		},
		end: {
			x: createPlainMmMeasure(xEnd),
			y: createPlainMmMeasure(yEnd),
		},
		type,
	};
}

function createVerticalLine(x: number, yStart: number, yEnd: number, type: ISide) {
	return createResizeRelationLine(yStart, yEnd, x, x, type);
}

function drawLeftVerticalLine({
	curElBottom,
	curElLeft,
	curElTop,
	elBottom,
	elLeft,
	elRight,
	elTop,
}: {
	curElLeft: number;
	curElTop: number;
	curElBottom: number;
	elLeft: number;
	elRight: number;
	elTop: number;
	elBottom: number;
}): IRsLine[] {
	const lines: IRsLine[] = [];
	if (curElLeft === elRight || curElLeft === elLeft) {
		if (curElTop >= elBottom) {
			lines.push(createVerticalLine(curElLeft, elBottom, curElTop, "bottom"));
		}
		if (curElBottom <= elTop) {
			lines.push(createVerticalLine(curElLeft, curElBottom, elTop, "top"));
		}
	}
	return lines;
}

function drawRightVerticalLine({
	curElBottom,
	curElRight,
	curElTop,
	elBottom,
	elLeft,
	elRight,
	elTop,
}: {
	curElRight: number;
	curElTop: number;
	curElBottom: number;
	elLeft: number;
	elRight: number;
	elTop: number;
	elBottom: number;
}): IRsLine[] {
	const lines: IRsLine[] = [];
	if (curElRight === elLeft || curElRight === elRight) {
		if (curElTop >= elBottom) {
			lines.push(createVerticalLine(curElRight, elBottom, curElTop, "bottom"));
		}
		if (curElBottom <= elTop) {
			lines.push(createVerticalLine(curElRight, curElBottom, elTop, "top"));
		}
	}
	return lines;
}

function drawTopVerticalLine({
	curElLeft,
	curElRight,
	curElTop,
	elBottom,
	elLeft,
	elRight,
}: {
	curElRight: number;
	curElTop: number;
	curElLeft: number;
	elLeft: number;
	elRight: number;
	elBottom: number;
}): IRsLine[] {
	const lines: IRsLine[] = [];
	if (curElRight >= elLeft && curElRight <= elRight && curElTop >= elBottom) {
		lines.push(createVerticalLine(curElRight, elBottom, curElTop, "bottom"));
	}
	if (curElLeft >= elLeft && curElLeft <= elRight && curElTop >= elBottom) {
		lines.push(createVerticalLine(curElLeft, elBottom, curElTop, "bottom"));
	}
	if (curElRight > elRight && curElLeft < elLeft && curElTop >= elBottom) {
		lines.push(createVerticalLine(elLeft, elBottom, curElTop, "bottom"));
	}
	return lines;
}

function drawBottomVerticalLine({
	curElLeft,
	curElRight,
	curElBottom,
	elTop,
	elLeft,
	elRight,
}: {
	curElRight: number;
	curElBottom: number;
	curElLeft: number;
	elLeft: number;
	elRight: number;
	elTop: number;
}): IRsLine[] {
	const lines: IRsLine[] = [];
	if (curElRight >= elLeft && curElRight <= elRight && curElBottom <= elTop) {
		lines.push(createVerticalLine(curElRight, curElBottom, elTop, "top"));
	}
	if (curElLeft >= elLeft && curElLeft <= elRight && curElBottom <= elTop) {
		lines.push(createVerticalLine(curElLeft, curElBottom, elTop, "top"));
	}
	if (curElRight > elRight && curElLeft < elLeft && curElBottom <= elTop) {
		lines.push(createVerticalLine(elLeft, curElBottom, elTop, "top"));
	}
	return lines;
}

function createHorizontalLine(y: number, xStart: number, xEnd: number, type: ISide) {
	return createResizeRelationLine(y, y, xStart, xEnd, type);
}

function drawTopHorizontalLine({
	curElTop,
	curElLeft,
	curElRight,
	elLeft,
	elRight,
	elTop,
	elBottom,
}: {
	curElRight: number;
	curElTop: number;
	curElLeft: number;
	elLeft: number;
	elRight: number;
	elTop: number;
	elBottom: number;
}) {
	const lines: IRsLine[] = [];

	if (curElTop === elBottom || curElTop === elTop) {
		if (curElLeft >= elRight) {
			lines.push(createHorizontalLine(curElTop, elRight, curElLeft, "right"));
		}
		if (curElRight <= elLeft) {
			lines.push(createHorizontalLine(curElTop, curElRight, elLeft, "left"));
		}
	}

	return lines;
}

function drawBottomHorizontalLine({
	curElLeft,
	curElRight,
	curElBottom,
	elLeft,
	elRight,
	elTop,
	elBottom,
}: {
	curElRight: number;
	curElBottom: number;
	curElLeft: number;
	elLeft: number;
	elRight: number;
	elTop: number;
	elBottom: number;
}) {
	const lines: IRsLine[] = [];

	if (curElBottom === elTop || curElBottom === elBottom) {
		if (curElLeft >= elRight) {
			lines.push(createHorizontalLine(curElBottom, elRight, curElLeft, "right"));
		}
		if (curElRight <= elLeft) {
			lines.push(createHorizontalLine(curElBottom, curElRight, elLeft, "left"));
		}
	}

	return lines;
}

function drawLeftHorizontalLine({
	curElLeft,
	curElBottom,
	curElTop,
	elRight,
	elTop,
	elBottom,
}: {
	curElBottom: number;
	curElLeft: number;
	curElTop: number;
	elRight: number;
	elTop: number;
	elBottom: number;
}) {
	const lines: IRsLine[] = [];
	if (curElBottom >= elTop && curElBottom <= elBottom && curElLeft >= elRight) {
		lines.push(createHorizontalLine(curElBottom, elRight, curElLeft, "right"));
	}
	if (curElTop >= elTop && curElTop <= elBottom && curElLeft >= elRight) {
		lines.push(createHorizontalLine(curElTop, elRight, curElLeft, "right"));
	}
	if (curElBottom > elBottom && curElTop < elTop && curElLeft >= elRight) {
		lines.push(createHorizontalLine(elTop, elRight, curElLeft, "right"));
	}
	return lines;
}

function drawRightHorizontalLine({
	curElRight,
	curElBottom,
	curElTop,
	elLeft,
	elTop,
	elBottom,
}: {
	curElBottom: number;
	curElRight: number;
	curElTop: number;
	elLeft: number;
	elTop: number;
	elBottom: number;
}) {
	const lines: IRsLine[] = [];
	if (curElBottom >= elTop && curElBottom <= elBottom && curElRight <= elLeft) {
		lines.push(createHorizontalLine(curElBottom, curElRight, elLeft, "left"));
	}
	if (curElTop >= elTop && curElTop <= elBottom && curElRight <= elLeft) {
		lines.push(createHorizontalLine(curElTop, curElRight, elLeft, "left"));
	}
	if (curElBottom > elBottom && curElTop < elTop && curElRight <= elLeft) {
		lines.push(createHorizontalLine(elTop, curElRight, elLeft, "left"));
	}
	return lines;
}

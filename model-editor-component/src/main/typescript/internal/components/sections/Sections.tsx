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

import {
	Dimensions,
	Measure,
	PartialSection,
	PartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { StageRegion } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";

import {
	changePartialMmMeasureValue,
	createMmMeasure,
	createPlainMmMeasure,
	createPlainMmMeasureFromPx,
	OmitId,
} from "../../utils/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { InteractionLogActions, TransactionLogStateActions } from "../../redux/index.js";
import { RESOURCE_KEYS } from "../../localization/index.js";
import { EditorConst } from "../../constant/editor.js";
import { ISide } from "../../types/resize.js";

import { BorderLines } from "../border-line/BorderLines.js";
import { EditorContext } from "../editor-stage/editor-context.js";

import { Section } from "./Section.js";
import { DEFAULT_HEIGHT } from "./SectionCard.js";

const { PX_TO_MM } = EditorConst;

const FILLER_DIMENSIONS = { id: "", minWidth: createMmMeasure(0), minHeight: createMmMeasure(0) };
const RS_LINES = [true, false];

interface SectionsProps {
	zoomFactor: number;
	bodyState: HTMLDivElement | null;
	editorState: HTMLDivElement | null;
	section: PartialSection;
}

export const Sections = ({ zoomFactor, bodyState, editorState, section }: SectionsProps) => {
	const { elementReferences } = React.useContext(EditorContext);
	const dispatch = useDispatch();
	const wrappers = useSelector(PrintEngineSelectors.wrappers);
	const editorDimensions = useSelector(PrintEngineSelectors.editorDimensions);

	const [headerHeight, setHeaderHeight] = React.useState(section?.headerHeight?.value || DEFAULT_HEIGHT);
	const [footerHeight, setFooterHeight] = React.useState(section?.footerHeight?.value || DEFAULT_HEIGHT);
	const [startPosY, setStartPosY] = React.useState<OmitId<Measure>>(createPlainMmMeasure(0));
	const [side, setSide] = React.useState<ISide | undefined>();

	React.useEffect(() => {
		if (section?.headerHeight?.value && section?.footerHeight?.value) {
			setHeaderHeight(section.headerHeight.value);
			setFooterHeight(section.footerHeight.value);
		}
	}, [section]);

	const startResize = React.useCallback((pos: OmitId<Measure>, side: ISide) => {
		setStartPosY(pos);
		setSide(side);
	}, []);

	const resizeStartEL = React.useCallback(
		(e: MouseEvent) => {
			if (!side) {
				return;
			}

			const isTop = side === "top";
			const diff = isTop ? PX_TO_MM(e.pageY) - startPosY.value : startPosY.value - PX_TO_MM(e.pageY);

			if (diff === 0) {
				return;
			}

			const curHeight = isTop ? headerHeight : footerHeight;
			const otherHeight = isTop ? footerHeight : headerHeight;
			const newHeight = curHeight + diff;

			const isValidHeight = newHeight > 0 && newHeight + otherHeight < editorDimensions.minHeight.value;

			if (
				isValidHeight &&
				areElementsInsideSections(
					isTop ? newHeight : headerHeight,
					isTop ? footerHeight : newHeight,
					editorDimensions.minHeight.value,
					elementReferences
				)
			) {
				setStartPosY(createPlainMmMeasureFromPx(e.pageY));
				isTop ? setHeaderHeight(newHeight) : setFooterHeight(newHeight);
			}
		},
		[editorDimensions.minHeight, elementReferences, footerHeight, headerHeight, side, startPosY]
	);

	const resizeStopEL = React.useCallback(() => {
		const hasChanged =
			headerHeight !== section?.headerHeight?.value || footerHeight !== section?.footerHeight?.value;

		if (side !== undefined && hasChanged) {
			setSide(undefined);
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.section.section.resizeSection,
					region: StageRegion.DEFAULT,
					transactionLogActions: [
						TransactionLogStateActions.updateSection({
							data: {
								...section,
								headerHeight: changePartialMmMeasureValue(headerHeight, section?.headerHeight),
								footerHeight: changePartialMmMeasureValue(footerHeight, section?.footerHeight),
							},
						}),
					],
				})
			);
		}
	}, [dispatch, footerHeight, headerHeight, section, side]);

	React.useEffect(() => {
		if (side) {
			window.addEventListener("mousemove", resizeStartEL);
			window.addEventListener("mouseup", resizeStopEL);
		} else {
			window.removeEventListener("mousemove", resizeStartEL);
			window.removeEventListener("mouseup", resizeStopEL);
		}
		return () => {
			window.removeEventListener("mousemove", resizeStartEL);
			window.removeEventListener("mouseup", resizeStopEL);
		};
	}, [resizeStartEL, resizeStopEL, side]);

	const placeable = {
		position: {
			id: "",
			x: createMmMeasure(editorDimensions.minWidth.value / 2),
			y: createMmMeasure(side === "top" ? headerHeight : editorDimensions.minHeight.value - footerHeight),
		},
		dimensions: FILLER_DIMENSIONS,
	};
	return (
		<>
			{wrappers.length === 0 && (
				<>
					<Section
						side="top"
						height={headerHeight}
						startResize={startResize}
						zoomFactor={zoomFactor}
						dimensions={getSectionDimension(headerHeight, editorDimensions.minWidth.value)}
					/>
					<Section
						side="bottom"
						height={footerHeight}
						startResize={startResize}
						zoomFactor={zoomFactor}
						dimensions={getSectionDimension(footerHeight, editorDimensions.minWidth.value)}
					/>
				</>
			)}
			{side && (
				<BorderLines
					zoomFactor={zoomFactor}
					item={placeable}
					rsLines={RS_LINES}
					bodyState={bodyState}
					editorState={editorState}
				/>
			)}
		</>
	);
};

function getSectionDimension(height: number, width: number): OmitId<Dimensions> {
	return { minHeight: createMmMeasure(height), minWidth: createMmMeasure(width) };
}

function areElementsInsideSections(
	headerHeight: number,
	footerHeight: number,
	editorMinHeight: number,
	elementsList: ReadonlyArray<PartialValidPlaceableReference>
) {
	return elementsList.every(
		({ position, dimensions, margins }) =>
			position.y.value + dimensions.minHeight.value + (margins?.bottom?.margin?.value || 0) <= headerHeight ||
			position.y.value - (margins?.top?.margin?.value || 0) >= editorMinHeight - footerHeight
	);
}

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

import type { PartialAnyPrintModelElement, PartialTextStyle } from "@com.mgmtp.a12.print/print-model-api/model";

import { InteractionLogActions } from "../../redux//interaction-log/actions.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import type { PlaceableWithElement } from "../../store/selectors.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { ElementsUtils } from "../../utils/index.js";
import { EditorConst } from "../../constant/editor.js";

import { HeightElementContainer } from "./HeightElementContainer.js";
import { StyledHeightElement } from "./HeightRender.styled.js";
import type { NewElementHeight } from "./types.js";

const { PX_TO_MM } = EditorConst;

interface HeightRenderTextStyleProps {
	textStyle: PartialTextStyle;
	setTextStyle: React.Dispatch<React.SetStateAction<PartialTextStyle | undefined>>;
}

interface LocalContainerMap {
	segments: Record<string, NewElementHeight[]>;
	sections: Record<string, NewElementHeight[]>;
	watermarks: Record<string, NewElementHeight[]>;
	wrapperElements: Record<string, NewElementHeight[]>;
}

export const HeightRenderTextStyle = ({ textStyle, setTextStyle }: HeightRenderTextStyleProps) => {
	const dispatch = useDispatch();
	const { segmentsMap, sectionsMap, watermarksMap, wrapperMap } = useSelector((state: PrintEngineState) =>
		PrintEngineSelectors.elementsAffectedByTextStyleChange(state, textStyle.id)
	);

	const handleLocalMapFilled = React.useCallback(
		(localMap: LocalContainerMap) => {
			const { segments, sections, wrapperElements, watermarks } = localMap;
			const isFilledMap =
				isLocalMapFilled(segments, segmentsMap) &&
				isLocalMapFilled(sections, sectionsMap) &&
				isLocalMapFilled(watermarks, watermarksMap) &&
				isLocalMapFilled(wrapperElements, wrapperMap);

			if (isFilledMap) {
				setTextStyle(undefined);
				dispatch(
					InteractionLogActions.updateElementHeightTextStyle({
						sectionsMap: sections,
						watermarksMap: watermarks,
						segmentsMap: segments,
						wrapperMap: wrapperElements,
					})
				);
			}
		},
		[dispatch, sectionsMap, segmentsMap, setTextStyle, watermarksMap, wrapperMap]
	);

	const createLocalMap = React.useCallback(() => {
		const localMap: LocalContainerMap = {
			segments: {},
			sections: {},
			watermarks: {},
			wrapperElements: {},
		};

		const createEntityMap = (localKey: keyof LocalContainerMap) => {
			return (containerId: string, element: PartialAnyPrintModelElement, newHeight: number) => {
				localMap[localKey] = {
					...localMap[localKey],
					[containerId]: [
						...(localMap[localKey][containerId] || []),
						{
							elId: element.id,
							newHeight: newHeight,
						},
					],
				};
				handleLocalMapFilled(localMap);
			};
		};

		const setLocalSegmentsMap = createEntityMap("segments");
		const setLocalSectionsMap = createEntityMap("sections");
		const setLocalWatermarksMap = createEntityMap("watermarks");
		const setLocalWrapperMap = createEntityMap("wrapperElements");

		return {
			setLocalSegmentsMap,
			setLocalSectionsMap,
			setLocalWatermarksMap,
			setLocalWrapperMap,
		};
	}, [handleLocalMapFilled]);

	const { setLocalSectionsMap, setLocalSegmentsMap, setLocalWatermarksMap, setLocalWrapperMap } = React.useMemo(
		() => createLocalMap(),
		[createLocalMap]
	);

	return (
		<>
			{renderMap(segmentsMap, setLocalSegmentsMap, textStyle)}
			{renderMap(sectionsMap, setLocalSectionsMap, textStyle)}
			{renderMap(watermarksMap, setLocalWatermarksMap, textStyle)}
			{renderMap(wrapperMap, setLocalWrapperMap, textStyle)}
		</>
	);
};

function isLocalMapFilled(
	localMap: Record<string, NewElementHeight[]>,
	originalMap: Record<string, PlaceableWithElement[]>
) {
	return Object.entries(originalMap).every(([id, elements]) => localMap[id]?.length === elements.length);
}

function renderMap(
	map: Record<string, PlaceableWithElement[]>,
	setLocalMap: (containerId: string, element: PartialAnyPrintModelElement, newHeight: number) => void,
	textStyle: PartialTextStyle
) {
	return Object.entries(map).reduce<React.ReactElement[]>((res, [containerId, elements]) => {
		return [
			...res,
			...elements.map(({ element, placeable }) => (
				<StyledHeightElement
					key={element.id}
					dimensions={placeable.dimensions}
					height={ElementsUtils.getFixedElementHeight(element, placeable)}
					style={{ wordBreak: "break-word" }}
				>
					<div ref={ref => updateHeightMapEntry(ref, setLocalMap, containerId, element)}>
						<HeightElementContainer textStyle={textStyle} element={element} reference={placeable} />
					</div>
				</StyledHeightElement>
			)),
		];
	}, []);
}

function updateHeightMapEntry(
	ref: HTMLDivElement | null,
	setLocalMap: (containerId: string, element: PartialAnyPrintModelElement, newHeight: number) => void,
	containerId: string,
	element: PartialAnyPrintModelElement
) {
	if (!ref) {
		return;
	}
	setLocalMap(containerId, element, PX_TO_MM(ref.getBoundingClientRect().height));
}

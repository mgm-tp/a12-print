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
import { useSelector } from "react-redux";

import type { Measure, PartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/model";

import { FIXED_DIMENSIONS_ELEMENTS } from "../../constant/elements.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import type { ISide } from "../../types/resize.js";
import { ElementsUtils } from "../../utils/elements-utils.js";
import { changeMmMeasureValue } from "../../utils/measure-utils.js";
import type { OmitId } from "../../utils/type-utils.js";

import { useElementOverlapSection } from "../reference-container-stage/hooks/use-element-overlap-section.js";

import { ResizeHandle } from "./ResizeHandle.js";

interface ResizeableWrapperProps {
	placeableRef: PartialValidPlaceableReference;
	zoomFactor: number;
	startResize: (el: PartialValidPlaceableReference, pos: OmitId<Measure>, side: ISide) => void;
}

export const ResizeableWrapper = ({ placeableRef, zoomFactor, startResize }: ResizeableWrapperProps) => {
	const element = useSelector((state: PrintEngineState) =>
		PrintEngineSelectors.printModelElement(state, placeableRef.refId)
	);
	const { midPositionOffset, endPositionOffset } = useElementOverlapSection(placeableRef);
	const actualMidPlaceableRefPosition = midPositionOffset
		? { ...placeableRef.position, y: changeMmMeasureValue(placeableRef.position.y.value + midPositionOffset) }
		: placeableRef.position;

	const actualEndPlaceableRefPosition = endPositionOffset
		? { ...placeableRef.position, y: changeMmMeasureValue(placeableRef.position.y.value + endPositionOffset) }
		: placeableRef.position;

	return FIXED_DIMENSIONS_ELEMENTS.includes(element.type) ? null : (
		<>
			<ResizeHandle
				side="left"
				position={actualMidPlaceableRefPosition}
				dimensions={placeableRef.dimensions}
				startResize={(pos: OmitId<Measure>, side: ISide) => startResize(placeableRef, pos, side)}
				zoomFactor={zoomFactor}
			/>
			<ResizeHandle
				side="right"
				position={actualMidPlaceableRefPosition}
				dimensions={placeableRef.dimensions}
				startResize={(pos: OmitId<Measure>, side: ISide) => startResize(placeableRef, pos, side)}
				zoomFactor={zoomFactor}
			/>
			{ElementsUtils.isWrapperElement(element) && (
				<>
					<ResizeHandle
						side="top"
						position={placeableRef.position}
						dimensions={placeableRef.dimensions}
						startResize={(pos: OmitId<Measure>, side: ISide) => startResize(placeableRef, pos, side)}
						zoomFactor={zoomFactor}
					/>
					<ResizeHandle
						side="bottom"
						position={actualEndPlaceableRefPosition}
						dimensions={placeableRef.dimensions}
						startResize={(pos: OmitId<Measure>, side: ISide) => startResize(placeableRef, pos, side)}
						zoomFactor={zoomFactor}
					/>
				</>
			)}
		</>
	);
};

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
import { useSelector } from "react-redux";

import { PartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { LimitZone, MarginResizeContextValue, MarginSide } from "../../types/margin.js";
import { changePartialMarginValue } from "../../utils/margin-utils.js";
import { EditorConst } from "../../constant/editor.js";
import { useGetSectionOffset } from "../../hooks/use-get-section-offset.js";

import { LayoutElementContainer } from "../element-container/LayoutElementContainer.js";
import { PlaceableElement } from "../reference-container-stage/shared-components/PlaceableElement.js";
import { BrokenElement } from "../reference-container-stage/shared-components/BrokenElement.js";

import { MarginWrapper } from "./MarginWrapper.js";
import { MarginContext } from "./margin-context.js";

interface SegmentBreakPageProps {
	reference: PartialValidPlaceableReference;
	highlight: boolean;
	getLimitZone?: (reference: PartialValidPlaceableReference) => LimitZone;
	customGetLimitElement?: (
		elementReferences: readonly PartialValidPlaceableReference[],
		current: PartialValidPlaceableReference
	) => Array<number | undefined>;
	onClick: (reference: PartialValidPlaceableReference) => void;
	onDoubleClick: (reference: PartialValidPlaceableReference) => void;
	onHoverChange: (reference?: PartialValidPlaceableReference) => void;
	onUpdateMargin: (margin: number, side: MarginSide, reference: PartialValidPlaceableReference) => void;
	pageRefs: Array<HTMLDivElement | null>;
}

const BROKEN_Z_INDEX = EditorConst.getZIndexList().BrokenElement;
const { PX_TO_MM } = EditorConst;
const TEXT_MARGIN_VALUE_HEIGHT = 7;

export const MarginBreakPageContext = React.memo(function MarginBreakPageContext(props: SegmentBreakPageProps) {
	const {
		onClick,
		onDoubleClick,
		reference,
		onHoverChange,
		highlight,
		getLimitZone,
		customGetLimitElement,
		onUpdateMargin,
		pageRefs,
	} = props;
	const [resizingMargin, setResizingMargin] = React.useState<MarginResizeContextValue>();
	const zoomFactor = useSelector(PrintEngineSelectors.zoomFactor);
	const getSectionOffset = useGetSectionOffset();

	const temporaryReference: PartialValidPlaceableReference = React.useMemo(() => {
		if (resizingMargin?.side !== "bottom") {
			return reference;
		}
		return {
			...reference,
			margins: changePartialMarginValue(
				Math.max(resizingMargin?.value, reference?.margins?.bottom?.margin?.value || 0),
				resizingMargin.side,
				reference.margins
			),
		};
	}, [reference, resizingMargin]);

	const textOffset = React.useMemo(() => {
		const bottomMargin = temporaryReference.margins?.bottom?.margin?.value || 0;
		const endOfReference = temporaryReference.position.y.value + temporaryReference.dimensions.minHeight.value;
		if (!bottomMargin) {
			return 0;
		}

		const sectionStartOffset = getSectionOffset(
			endOfReference,
			endOfReference - PX_TO_MM(TEXT_MARGIN_VALUE_HEIGHT) + PX_TO_MM(bottomMargin / 2),
			reference
		);
		const sectionEndOffset = getSectionOffset(
			endOfReference,
			endOfReference + PX_TO_MM(TEXT_MARGIN_VALUE_HEIGHT + 3) + PX_TO_MM(bottomMargin / 2),
			reference
		);

		return sectionStartOffset !== sectionEndOffset ? TEXT_MARGIN_VALUE_HEIGHT : 0;
	}, [
		getSectionOffset,
		reference,
		temporaryReference.dimensions.minHeight.value,
		temporaryReference.margins?.bottom?.margin?.value,
		temporaryReference.position.y.value,
	]);

	return (
		<MarginContext.Provider
			value={{
				margin: resizingMargin,
				updateMargin: setResizingMargin,
			}}
		>
			<BrokenElement
				pageRefs={pageRefs}
				reference={temporaryReference}
				renderElement={offset => {
					return (
						<PlaceableElement
							key={reference.refId}
							reference={reference}
							onClick={onClick}
							onDoubleClick={onDoubleClick}
							onMouseEnter={() => onHoverChange(reference)}
							onMouseLeave={() => onHoverChange(undefined)}
							highlight={highlight}
							offsetTop={offset}
							zIndex={BROKEN_Z_INDEX}
						>
							<MarginWrapper
								reference={reference}
								zoomFactor={zoomFactor}
								highlight={highlight}
								getLimitZone={getLimitZone}
								onUpdateMargin={onUpdateMargin}
								onStartResize={onClick}
								customGetLimitElement={customGetLimitElement}
								textOffset={textOffset}
							>
								<LayoutElementContainer reference={reference} />
							</MarginWrapper>
						</PlaceableElement>
					);
				}}
			/>
		</MarginContext.Provider>
	);
});

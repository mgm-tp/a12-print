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

import type { PartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/model";

import { EditorConst } from "../../constant/editor.js";
import type { LimitZone, MarginSide } from "../../types/margin.js";
import { getLimitBottomValue, getLimitElement, getLimitTopValue } from "../../utils/margin-utils.js";

import { EditorContext } from "../editor-stage/editor-context.js";

import { MarginResizer } from "./MarginResizer.js";

const { MM_TO_PX } = EditorConst;

interface MarginWrapperProps {
	reference: PartialValidPlaceableReference;
	zoomFactor: number;
	highlight?: boolean;
	textOffset?: number;
	getLimitZone?: (reference: PartialValidPlaceableReference) => LimitZone;
	customGetLimitElement?: (
		elementReferences: readonly PartialValidPlaceableReference[],
		current: PartialValidPlaceableReference
	) => Array<number | undefined>;
	onUpdateMargin: (margin: number, side: MarginSide, reference: PartialValidPlaceableReference) => void;
	onStartResize?: (reference: PartialValidPlaceableReference) => void;
}

const MARGIN_MIN_WIDTH = 60;
export const MarginWrapper = ({
	children,
	reference,
	zoomFactor,
	highlight,
	getLimitZone,
	onUpdateMargin,
	onStartResize,
	customGetLimitElement,
	textOffset,
}: React.PropsWithChildren<MarginWrapperProps>) => {
	const { elementReferences } = React.useContext(EditorContext);
	const marginTopValue = MM_TO_PX(reference.margins?.top?.margin?.value || 0);
	const marginBottomValue = MM_TO_PX(reference.margins?.bottom?.margin?.value || 0);

	const alwaysTooltip = MM_TO_PX(reference.dimensions.minWidth.value) < MARGIN_MIN_WIDTH;

	const [topLimit, bottomLimit] = React.useMemo(() => {
		const [topElementValue, bottomElementValue] = customGetLimitElement
			? customGetLimitElement(elementReferences, reference)
			: getLimitElement(elementReferences, reference);
		const limitZone = getLimitZone?.(reference);

		const topLimitValue = getLimitTopValue(topElementValue, limitZone);
		const bottomLimitValue = getLimitBottomValue(bottomElementValue, limitZone);

		return [topLimitValue, bottomLimitValue];
	}, [customGetLimitElement, elementReferences, getLimitZone, reference]);

	const handleUpdateMargin = React.useCallback(
		(margin: number, side: MarginSide) => {
			onUpdateMargin(margin, side, reference);
		},
		[onUpdateMargin, reference]
	);
	return (
		<>
			<MarginResizer
				margin={marginTopValue}
				side="top"
				onUpdateMargin={handleUpdateMargin}
				onStartResize={onStartResize}
				alwaysTooltip={alwaysTooltip}
				highlight={highlight}
				zoomFactor={zoomFactor}
				reference={reference}
				limit={topLimit}
			/>
			{children}
			<MarginResizer
				margin={marginBottomValue}
				side="bottom"
				onUpdateMargin={handleUpdateMargin}
				onStartResize={onStartResize}
				alwaysTooltip={alwaysTooltip}
				highlight={highlight}
				zoomFactor={zoomFactor}
				reference={reference}
				limit={bottomLimit}
				textOffset={textOffset}
			/>
		</>
	);
};

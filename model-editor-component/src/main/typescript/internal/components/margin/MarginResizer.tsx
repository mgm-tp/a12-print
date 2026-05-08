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

import { PartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { EditorConst } from "../../constant/editor.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { calculateNewMargin } from "../../utils/margin-utils.js";
import { MarginSide } from "../../types/margin.js";
import { formatNumberToString } from "../../utils/index.js";

import {
	StyledDeleteIcon,
	StyledIconContainer,
	StyledMargin,
	StyledMarginBottomToolTip,
	StyledMarginResizeHandle,
	StyledMarginTopToolTip,
	StyledMarginValueContainer,
} from "./MarginWrapper.styled.js";
import { MarginContext } from "./margin-context.js";

interface MarginResizerProps {
	margin: number;
	side: MarginSide;
	zoomFactor: number;
	reference: PartialValidPlaceableReference;
	onUpdateMargin: (margin: number, side: MarginSide) => void;
	onStartResize?: (reference: PartialValidPlaceableReference) => void;
	alwaysTooltip?: boolean;
	highlight?: boolean;
	limit?: number;
	textOffset?: number;
}

const { PX_TO_CM, PX_TO_MM, MM_TO_PX } = EditorConst;

const MIN_VISIBLE_HEIGHT = 20;

const ToolTipMap = {
	top: StyledMarginTopToolTip,
	bottom: StyledMarginBottomToolTip,
};

export const MarginResizer = ({
	margin,
	side,
	onUpdateMargin,
	alwaysTooltip,
	highlight,
	zoomFactor,
	reference,
	onStartResize,
	limit = 0,
	textOffset = 0,
}: MarginResizerProps) => {
	const resizerRef = React.useRef<HTMLDivElement>(null);
	const [storedMargin, setStoredMargin] = React.useState(margin);
	const [isResizing, setIsResizing] = React.useState(false);
	const localizer = PrintLocalizer.useLocalizer();
	const { margin: contextMargin, updateMargin } = React.useContext(MarginContext);

	const onMouseMove = React.useCallback(
		(event: MouseEvent) => {
			const resizerRect = resizerRef.current?.getBoundingClientRect();
			if (!resizerRect) {
				return;
			}
			const isTop = side === "top";

			const [newMarginValue, isSkip] = calculateNewMargin({
				isTop,
				anchorClientY: isTop ? resizerRect.bottom : resizerRect.top,
				currentClientY: event.clientY,
				limitPosY: limit,
				zoomFactor,
				reference,
			});
			if (isSkip) {
				return;
			}

			const removedExcessPixels = MM_TO_PX(newMarginValue);
			setStoredMargin(removedExcessPixels);
			updateMargin({ value: removedExcessPixels, side });
		},
		[limit, reference, side, updateMargin, zoomFactor]
	);

	const onMouseUp = React.useCallback(() => {
		onUpdateMargin(PX_TO_MM(storedMargin), side);
		setIsResizing(false);
		updateMargin(undefined);
	}, [onUpdateMargin, side, storedMargin, updateMargin]);

	const onMouseDown = React.useCallback(() => {
		setIsResizing(true);
		onStartResize && onStartResize(reference);
	}, [onStartResize, reference]);

	React.useEffect(() => {
		if (isResizing) {
			window.addEventListener("mousemove", onMouseMove);
			window.addEventListener("mouseup", onMouseUp);
		} else {
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
		}
		return () => {
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
		};
	}, [isResizing, onMouseMove, onMouseUp]);

	const onClickDelete = React.useCallback(() => {
		onUpdateMargin(0, side);
	}, [onUpdateMargin, side]);

	React.useEffect(() => {
		setStoredMargin(margin);
	}, [margin]);

	const ToolTip = ToolTipMap[side];

	const showTooltip = (alwaysTooltip && storedMargin > 0) || (storedMargin > 0 && storedMargin < MIN_VISIBLE_HEIGHT);
	const marginValue = contextMargin && contextMargin.side === side ? contextMargin.value : storedMargin;

	return (
		<StyledMargin ref={resizerRef} side={side} margin={marginValue} highlight={highlight}>
			{showTooltip && highlight && (
				<ToolTip>
					{formatNumberToString(PX_TO_CM(marginValue))} cm
					<StyledDeleteIcon
						title={localizer(RESOURCE_KEYS.button.delete)}
						onClick={onClickDelete}
						color="white"
					>
						close
					</StyledDeleteIcon>
				</ToolTip>
			)}
			{!alwaysTooltip && marginValue >= MIN_VISIBLE_HEIGHT && highlight && (
				<>
					<StyledMarginValueContainer offset={textOffset}>
						{formatNumberToString(PX_TO_CM(marginValue))} cm
					</StyledMarginValueContainer>
					<StyledIconContainer>
						<StyledDeleteIcon title={localizer(RESOURCE_KEYS.button.delete)} onClick={onClickDelete}>
							close
						</StyledDeleteIcon>
					</StyledIconContainer>
				</>
			)}
			<StyledMarginResizeHandle side={side} onMouseDown={onMouseDown} />
		</StyledMargin>
	);
};

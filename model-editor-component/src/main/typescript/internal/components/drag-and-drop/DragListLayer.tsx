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
import type { XYCoord } from "react-dnd";

import { PartialSegment, PartialTextStyle } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { SEGMENT_CARD, SWITCH_CASE_CARD, TEXT_STYLE_CARD } from "../../constant/drag.js";

import { SegmentCard } from "../segments/SegmentCard.js";
import { TextStyleCard } from "../text-styles/TextStyleCard.js";
import { SwitchCaseCard } from "../switch-stage/SwitchCaseCard.js";
import { SwitchCaseItem } from "../switch-stage/switch-stage.js";

import { StyledDragListLayer } from "./DragListLayer.styled.js";
import { BasicDragLayerProps, createDragLayerWrapper } from "./create-drag-layer-wrapper.js";

type DragItem = PartialTextStyle | PartialSegment | SwitchCaseItem;
type DragLayerProps = BasicDragLayerProps<DragItem>;

const DragLayer = (props: DragLayerProps) => {
	const { dragLayerProperties } = props;
	const [dragContainerPosition, setDragContainerPosition] = React.useState<XYCoord>({ x: 0, y: 0 });
	const { isDragging, item, itemType, initialOffset, currentOffset } = dragLayerProperties;

	const layerRef = React.useRef<HTMLDivElement | null>(null);

	React.useEffect(() => {
		if (layerRef?.current) {
			const { x, y } = layerRef.current.getBoundingClientRect();
			setDragContainerPosition({ x, y });
		}
	}, []);

	const viewElement = React.useMemo(() => {
		switch (itemType) {
			case SEGMENT_CARD:
				return <SegmentCard segment={item} isOpenSetting={false} setOpenSetting={() => undefined} />;
			case TEXT_STYLE_CARD:
				return <TextStyleCard textStyle={item} />;
			case SWITCH_CASE_CARD:
				return <SwitchCaseCard row={item} scale={(item as SwitchCaseItem).scale} isDragging />;
			default:
				return null;
		}
	}, [item, itemType]);

	const sourceWrapper = React.useMemo(() => {
		const { height, width } = item?.refWrapper?.current?.getBoundingClientRect() || {};
		return { height, width };
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [item?.refWrapper?.current]);

	return (
		<StyledDragListLayer ref={layerRef}>
			{isDragging && (
				<div style={getItemStyles(initialOffset, currentOffset, dragContainerPosition, sourceWrapper)}>
					{viewElement}
				</div>
			)}
		</StyledDragListLayer>
	);
};

export const DragListLayer = createDragLayerWrapper(DragLayer, type => {
	return [SEGMENT_CARD, TEXT_STYLE_CARD, SWITCH_CASE_CARD].includes(String(type));
});

function getItemStyles(
	initialOffset: XYCoord | null,
	currentOffset: XYCoord | null,
	containerOffset: XYCoord,
	sourceWrapper: { height: number | undefined; width: number | undefined }
) {
	if (!initialOffset || !currentOffset) {
		return {
			display: "none",
		};
	}

	const { x, y } = currentOffset;
	const { x: containerX = 0, y: containerY = 0 } = containerOffset || {};

	const transform = `translate(${x - containerX}px, ${y - containerY}px)`;
	return {
		transform,
		WebkitTransform: transform,
		height: sourceWrapper.height,
		width: sourceWrapper.width,
	};
}

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
import { useDragLayer, XYCoord } from "react-dnd";
import { DragSourceMonitor } from "react-dnd";

export type DragItemType = ReturnType<DragSourceMonitor["getItemType"]>;

interface MonitorProperties<I> {
	item: I & { refWrapper: React.RefObject<HTMLElement> };
	itemType: DragItemType;
	initialOffset: XYCoord | null;
	currentOffset: XYCoord | null;
	clientOffset: XYCoord | null;
	differenceOffset: XYCoord | null;
	isDragging: boolean;
}

export interface BasicDragLayerProps<I> {
	dragLayerProperties: MonitorProperties<I>;
}

export function createDragLayerWrapper<I, P extends BasicDragLayerProps<I>>(
	WrappedComponent: React.ComponentType<P>,
	allowItemType: (itemType: DragItemType) => boolean
) {
	const ComponentWithDragLayer = (props: Omit<P, keyof BasicDragLayerProps<I>>) => {
		const dragLayerProperties = useDragLayer(monitor => ({
			item: monitor.getItem(),
			itemType: monitor.getItemType(),
			initialOffset: monitor.getInitialSourceClientOffset(),
			currentOffset: monitor.getSourceClientOffset(),
			differenceOffset: monitor.getDifferenceFromInitialOffset(),
			clientOffset: monitor.getClientOffset(),
			isDragging: monitor.isDragging(),
		}));

		if (!allowItemType(String(dragLayerProperties.itemType))) {
			return null;
		}

		return <WrappedComponent {...(props as P)} dragLayerProperties={dragLayerProperties} />;
	};
	const displayName = WrappedComponent.displayName || WrappedComponent.name || "Component";

	ComponentWithDragLayer.displayName = `withUseDragLayer(${displayName})`;
	return ComponentWithDragLayer;
}

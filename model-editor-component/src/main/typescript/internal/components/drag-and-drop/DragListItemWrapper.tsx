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
import { useDrag, useDrop } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import debounce from "lodash/debounce.js";
import { DropTargetMonitor } from "react-dnd";

import { StyledDragListItemWrapper } from "./DragListItemWrapper.styled.js";

export interface BaseDragDrops {
	index: number;
}

interface DragListItemWrapperProps<T> extends BaseDragDrops {
	item: T;
	type: string;
	onMoveItem: (item: T, currentIndex: number, targetIndex: number) => void;
	triggerPoint?: number;
}

export const DragListItemWrapper = <T extends { id: string }>(
	props: React.PropsWithChildren<DragListItemWrapperProps<T>>
) => {
	const refWrapper = React.useRef<HTMLDivElement | null>(null);
	const { index, item, children, type, onMoveItem, triggerPoint = 0.5 } = props;

	const debounceMoveItem = React.useMemo(
		() =>
			debounce((item: T, dragIndex: number) => {
				onMoveItem(item, dragIndex, index);
			}),
		[index, onMoveItem]
	);

	const [{ isDragging }, drag, preview] = useDrag(
		() => ({
			type,
			item: {
				...item,
				index,
				refWrapper,
			},
			collect: monitor => {
				return { isDragging: monitor.getItem()?.id === item?.id };
			},
		}),
		[index, item, type]
	);

	const [, drop] = useDrop<T & BaseDragDrops>(
		() => ({
			accept: type,
			hover(dragItem: T & BaseDragDrops, monitor: DropTargetMonitor) {
				if (dragItem.index === index) {
					return;
				}

				const { y: draggingY = 0 } = monitor.getClientOffset() || {};
				const { y = 0, height = 0 } = refWrapper.current?.getBoundingClientRect() || {};
				if (dragItem.index < index && draggingY < y + height * triggerPoint) {
					return;
				}

				if (dragItem.index > index && y + (height - height * triggerPoint) < draggingY) {
					return;
				}
				if (dragItem.id !== item.id) {
					debounceMoveItem(dragItem, dragItem.index);
					dragItem.index = index;
				}
			},
		}),
		[item, index, debounceMoveItem]
	);
	React.useEffect(() => {
		drag(drop(refWrapper));
		preview(getEmptyImage(), { captureDraggingState: true });
	}, [drag, drop, preview, refWrapper]);

	return (
		<StyledDragListItemWrapper ref={refWrapper} isDragging={isDragging}>
			{children}
		</StyledDragListItemWrapper>
	);
};

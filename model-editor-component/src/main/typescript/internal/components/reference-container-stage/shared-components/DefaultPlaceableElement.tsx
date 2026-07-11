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

import { PrintEngineSelectors } from "../../../store/selectors.js";
import { DefaultElementBadgeWrapper } from "../../element-container/DefaultElementBadgeWrapper.js";
import { ReadOnlyMarginWrapper } from "../../margin/ReadOnlyMarginWrapper.js";

import type { DefaultPlaceableElementProps } from "../editor-interface.js";

import { HeightCalculationContainer } from "./HeightCalculationContainer.js";
import { StyledDefaultPlaceableElement } from "./DefaultPlacableElement.styled.js";

export const DefaultPlaceableElement = React.forwardRef<
	HTMLDivElement,
	React.PropsWithChildren<DefaultPlaceableElementProps>
>(function DefaultElementWrapper(props, ref) {
	const {
		item,
		element,
		children,
		isResizing,
		onClick,
		onDoubleClick,
		isSelected,
		hovered,
		offsetTop,
		setHovered,
		isColliding,
		isOutsideBox,
		...restProps
	} = props;
	const showBorders = useSelector(PrintEngineSelectors.showBordersEditor);
	const isMarginVisible = useSelector(PrintEngineSelectors.isMarginVisible);
	const zoomFactor = useSelector(PrintEngineSelectors.zoomFactor);

	const onClickHandler = React.useCallback(
		(event: React.MouseEvent<HTMLDivElement>) => {
			onClick(event, item);
		},
		[item, onClick]
	);

	const onDoubleClickHandler = React.useCallback(() => {
		onDoubleClick(item);
	}, [item, onDoubleClick]);
	const isHighlight = isSelected || hovered?.refId === item.refId || isColliding || isOutsideBox;
	return (
		<StyledDefaultPlaceableElement
			ref={ref}
			{...restProps}
			isOutsideBox={isOutsideBox}
			isColliding={isColliding}
			onMouseDown={e => e.stopPropagation()}
			onMouseEnter={() => setHovered(item)}
			onMouseLeave={() => setHovered(null)}
			onClick={onClickHandler}
			onDoubleClick={onDoubleClickHandler}
			element={element}
			reference={item}
			zoomFactor={zoomFactor}
			isSelected={isSelected}
			offsetTop={offsetTop}
			hovered={hovered}
			showBorders={Boolean(showBorders)}
		>
			<DefaultElementBadgeWrapper placeableRef={item} />
			<ReadOnlyMarginWrapper
				margins={item.margins}
				hideMargins={!showBorders || !isMarginVisible}
				highlight={isHighlight}
			>
				<HeightCalculationContainer item={item} itemElement={element} isResizing={isResizing}>
					{children}
				</HeightCalculationContainer>
			</ReadOnlyMarginWrapper>
		</StyledDefaultPlaceableElement>
	);
});

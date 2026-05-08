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

import { PrintEngineState } from "../../../store/root-reducer.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { LayoutElementBadgeWrapper } from "../../element-container/LayoutElementBadgeWrapper.js";

import { StylePlaceableElement } from "./PlaceableElement.styled.js";

interface PlaceableElementProps extends Omit<React.DOMAttributes<HTMLDivElement>, "onClick" | "onDoubleClick"> {
	reference: PartialValidPlaceableReference;
	highlight?: boolean;
	onClick?: (reference: PartialValidPlaceableReference) => void;
	onDoubleClick?: (reference: PartialValidPlaceableReference) => void;
	offsetTop?: number;
	zIndex?: number;
}

export const PlaceableElement: React.FunctionComponent<PlaceableElementProps> = ({
	reference,
	onClick,
	onDoubleClick,
	children,
	highlight,
	...restProps
}) => {
	const element = useSelector((state: PrintEngineState) =>
		PrintEngineSelectors.printModelElement(state, reference.refId)
	);
	const zoomFactor = useSelector(PrintEngineSelectors.zoomFactor);

	const onClickReference = React.useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			e.stopPropagation();
			onClick?.(reference);
		},
		[onClick, reference]
	);

	const onDoubleClickReference = React.useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			e.stopPropagation();
			onDoubleClick?.(reference);
		},
		[onDoubleClick, reference]
	);
	return (
		<StylePlaceableElement
			{...restProps}
			element={element}
			reference={reference}
			zoomFactor={zoomFactor}
			highlight={highlight}
			onClick={onClickReference}
			onDoubleClick={onDoubleClickReference}
		>
			<LayoutElementBadgeWrapper placeableRef={reference} />
			{children}
		</StylePlaceableElement>
	);
};

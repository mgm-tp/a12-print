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
import { styled } from "styled-components";

import { PartialAnyPrintModelElement, PartialLine } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

interface StyledFloatingButtonContainerProps {
	offset: number;
	element: PartialAnyPrintModelElement;
}
export const StyledHoverContainer = styled.div`
	position: absolute;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
`;

export const StyledHoverDisplay = styled.div`
	display: none;
	${StyledHoverContainer}:hover & {
		display: inline-block;
	}
`;

export const StyledFloatingButtonContainer = styled.div.attrs<StyledFloatingButtonContainerProps>(
	({ offset, element }) => {
		return PartialLine.isInstance(element)
			? {
					style: {
						position: "absolute",
						top: 0,
						right: 0,
						bottom: 0,
						marginTop: "auto",
						marginBottom: "auto",
					},
				}
			: {
					style: {
						position: "absolute",
						top: `${offset}pt`,
						right: `${offset}pt`,
					},
				};
	}
)<StyledFloatingButtonContainerProps>``;

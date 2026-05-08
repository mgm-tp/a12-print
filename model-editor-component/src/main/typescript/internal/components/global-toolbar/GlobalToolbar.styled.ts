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

export const TOOLBAR_HEIGHT = 40;
export const TOOLBAR_PADDING_Y = 2;

export const StyledToolbar = styled.div`
	display: flex;
	height: ${TOOLBAR_HEIGHT}px;
	background-color: ${props => props.theme.colors.primaryColor};
	padding: ${TOOLBAR_PADDING_Y}px 16px ${TOOLBAR_PADDING_Y}px 39px;
`;

export const StyledSlot = styled.div`
	display: inline-flex;
`;

export const StyledSlotWrapper = styled.div<{ slotPosition: "right" | "left" }>`
	display: flex;
	align-items: center;
	gap: 6px;
	flex: 1;
	justify-content: ${({ slotPosition }) => (slotPosition === "left" ? "flex-start" : "flex-end")};
`;

export const ModelIcon = styled.img`
	size: 16px;
	margin-right: 2px;
	margin-left: -29px;
`;

export const Delimiter = styled.div`
	width: 2px;
	background-color: #a9b3bc;
	height: 27px;
	margin: 5px;
`;

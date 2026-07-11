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

import { StyledMasterDetailLayoutBody, StyledMasterDetailLayoutPane } from "@com.mgmtp.a12.widgets/widgets-core";

export const StyledLayout = styled.div`
	width: 100%;
	height: 100%;

	display: grid;
	grid-template-columns: 500px auto;
	grid-template-rows: min-content auto;
	grid-template-areas:
		"toolbar toolbar"
		"sidebar main";

	&.minimized {
		grid-template-columns: min-content auto;
	}

	&.maximized {
		grid-template-columns: auto;
		grid-template-areas:
			"toolbar"
			"sidebar";
	}
`;

export const StyledToolbar = styled.div`
	grid-area: toolbar;

	display: flex;
	background-color: ${({ theme }) => theme.components.tabPanel.tabs.background};
	min-height: ${({ theme }) => getSinglePixelValue(theme.components.tabPanel.tabs.padding)};
	padding: ${({ theme }) => theme.spacing.spacing.spacingXs}px;
	padding-left: ${({ theme }) => theme.components.tabPanel.tabs.minWidth};
`;

export const StyledSidebar = styled.div`
	grid-area: sidebar;
	overflow: auto;
`;

export const StyledContent = styled.div`
	grid-area: main;
	overflow: auto;

	${StyledMasterDetailLayoutBody} ${StyledMasterDetailLayoutPane} {
		padding: ${({ theme }) => theme.components.masterDetailLayout.spacingBetweenPanes};
	}
`;

function getSinglePixelValue(value: string): string {
	return (
		value
			.trim()
			.split(" ")
			.filter(x => !!x)[0] ?? "0px"
	);
}

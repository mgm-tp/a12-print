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
import { css, styled } from "styled-components";

import { Button } from "@com.mgmtp.a12.widgets/widgets-core";

export const StyledCommitChangesContainer = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
	justify-content: space-between;
`;

export const StyledCommitChangesContent = styled.div(({ theme }) => {
	const { responsive } = theme.applicationStyles;
	return css`
		overflow-y: auto;
		display: flex;
		height: 100%;
		width: 100%;
		flex-direction: row;

		@media only screen and (max-width: ${responsive.mobileMaxWidth}) {
			flex-direction: column;
		}
	`;
});

export const StyledCommitChangesToolbar = styled.div`
	display: flex;
	gap: 5px;
	padding: 10px;
	border-top: 1px solid ${props => props.theme.colors.divider.colorLight};
	flex-direction: row;
`;

export const StyledCommitChangesButton = styled(Button)<{ right?: boolean }>`
	margin-left: ${props => (props.right ? "auto" : "unset")};
`;

export const StyledCommitChangeStatus = styled.div`
	display: flex;
	align-items: center;
	gap: 2px;
`;

export const StyledTransactionTableContainer = styled.div`
	padding-left: 24px;
	padding-right: 8px;
`;

export const StyledCommitTableContainer = styled.div(({ theme }) => {
	const { responsive } = theme.applicationStyles;
	return css`
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 60%;
		border-right: 1px solid ${props => props.theme.colors.divider.colorLight};

		@media only screen and (max-width: ${responsive.mobileMaxWidth}) {
			height: 50%;
			width: 100%;
		}
	`;
});

export const StyledCommitErrorContainer = styled.div(({ theme }) => {
	const { responsive } = theme.applicationStyles;
	const { divider } = theme.colors;

	return css`
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		width: 40%;

		@media only screen and (max-width: ${responsive.mobileMaxWidth}) {
			border-top: 2px solid ${divider.colorLight};
			height: 50%;
			width: 100%;
		}
	`;
});

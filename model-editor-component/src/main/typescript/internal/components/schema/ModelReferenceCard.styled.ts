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

import { Button } from "@com.mgmtp.a12.widgets/widgets-core";

import { CustomTextField } from "../forms/custom-base-input-components/index.js";

interface StyledModelReferenceCardProps {
	highlight?: boolean;
}

export const StyledModelReferenceCard = styled.div<StyledModelReferenceCardProps>`
	${props =>
		props.highlight
			? `border: 2px solid ${props.theme.colors.interaction.active.color}`
			: `border-bottom: 1px solid ${props.theme.colors.divider.colorLight}`};
`;

export const StyledModelReferenceRow = styled.div`
	display: flex;
	gap: 5px;
	padding: 10px;
	align-items: center;
	justify-content: space-between;
`;

/** Wraps everything but the settings button, so that a wrapping line above the field leaves the button in place. */
export const StyledFieldAliasWrapper = styled.div`
	display: flex;
	flex: 1;
	flex-wrap: wrap;
	gap: 5px;
	align-items: center;
	min-width: 0;
`;

/** A line of its own above the field, so the message is not cut off at the width of the field. */
export const StyledReferenceError = styled.div`
	flex: 1 1 100%;
	min-width: 0;
`;

interface StyledReferenceFieldProps {
	$fullWidth?: boolean;
}

export const StyledReferenceField = styled(CustomTextField)<StyledReferenceFieldProps>`
	min-width: 40%;
	max-width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "40%")};
	flex: ${({ $fullWidth }) => ($fullWidth ? "1 1 100%" : "0 1 auto")};
`;

export const StyledAliasColumn = styled.div`
	max-width: 45%;
	min-width: 45%;
	word-wrap: break-word;
`;

export const StyledCollapsibleSetting = styled.div`
	background: ${props => props.theme.colors.background.nonInteractiveBackground};
	padding: 10px;
	display: flex;
	gap: 10px;
	align-items: center;
`;

interface StyledButtonProps {
	isOpen: boolean;
}

export const StyledButtonSetting = styled(Button)<StyledButtonProps>`
	visibility: ${({ isOpen }) => (isOpen ? "hidden" : "visibility")};
`;

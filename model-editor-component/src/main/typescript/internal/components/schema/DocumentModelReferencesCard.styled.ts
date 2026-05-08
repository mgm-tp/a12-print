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

import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/main/button.view.js";

import { CustomTextLineStateless } from "../forms/custom-base-input-components/index.js";

interface StyledSchemaCardContainerProps {
	highlight?: boolean;
}

export const StyledSchemaCardContainer = styled.div<StyledSchemaCardContainerProps>`
	${props =>
		props.highlight
			? `border: 2px solid ${props.theme.colors.interaction.active.color}`
			: `border-bottom: 1px solid ${props.theme.colors.divider.colorLight}`};
`;

export const StyledSchemaCard = styled.div`
	display: flex;
	gap: 5px;
	padding: 10px;
	align-items: center;
	justify-content: space-between;
`;

export const StyledTextLineStatelessReference = styled(CustomTextLineStateless)`
	min-width: 40%;
	max-width: 40%;
`;

export const StyledSchemaAliasColumn = styled.div`
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

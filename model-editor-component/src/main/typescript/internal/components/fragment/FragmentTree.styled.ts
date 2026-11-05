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

export const StyledFragmentTree = styled.div`
	[id^="tree-node-content-"][id$="__settings"] {
		/* No indent/padding from the fragment tree */
		padding: 0 !important;
		min-width: 0 !important;
		/* Keep the settings row on the secondary background at all times. No :hover tint, so the row never changes colour on hover. */
		background-color: ${props => props.theme.colors.background.secondaryBackground} !important;
	}

	/* Stretch the title/name wrappers and the settings component itself (direct child) to the full row width  */
	[id^="tree-node-title-"][id$="__settings"],
	[id^="tree-node-name-"][id$="__settings"],
	[id^="tree-node-name-"][id$="__settings"] > * {
		flex: 1;
		width: 100%;
	}
`;

export const StyledFragmentSearch = styled.div`
	padding: 0.5rem 1rem;
`;

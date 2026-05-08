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
import { createGlobalStyle } from "styled-components";

export const GlobalOverride = createGlobalStyle`
	.loading__outerOverlay {
		z-index: 1
	}

	.callout__pointer {
		background-color: ${props => props.theme.colors.background.groupBackground};
		border-width: 2px;
		border-style: solid;
		border-color: #00589f transparent transparent #00589f;
	}

	.callout__inner {
		background-color: ${props => props.theme.colors.background.groupBackground};
		border: 2px solid #00589f;
		border-radius: 3px;
	}

	.attached-portal {
		z-index: 999;
	}

	.react-draggable {
		z-Index: 999;
	}

	.public-DraftEditor-content {
		background-color: #fff;
		color: #333;
	}

	.emptyMenuBar {
		background-color: #cddeed;
		display: block;
		height: 2px;
		width: 100%
	}

	.content {
		overflow: hidden
	}

	div[data-role="textline"] input[type="color"] {
		height: inherit;
		padding: 4px;
	}
`;

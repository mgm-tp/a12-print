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

import { ApplicationFrame } from "@com.mgmtp.a12.widgets/widgets-core";

import { TOOLBAR_HEIGHT, TOOLBAR_PADDING_Y } from "../global-toolbar/GlobalToolbar.styled.js";

export const StyledFrameContainer = styled.div`
	width: 100%;
	height: calc(100% - ${TOOLBAR_HEIGHT + 2 * TOOLBAR_PADDING_Y}px);
	position: relative;
`;

export const StyledApplicationFrame = styled(ApplicationFrame)(({ theme }) => {
	const { responsive } = theme.applicationStyles;
	const { sidebar } = theme.components.applicationFrame;
	return css`
		@media only screen and (max-width: ${responsive.mobileMaxWidth}) {
			position: relative;
			height: 100%;

			[data-role="application-frame-sidebar-wrapper"] {
				transform: translateX(0);
				visibility: visible;
			}

			[data-role="application-frame-main"] {
				position: absolute;
				z-index: 0;
				left: ${sidebar.width};
				width: calc(100% - ${sidebar.width});
				[data-role="master-detail-layout-view"] {
					border-radius: unset;
				}
			}
		}
	`;
});

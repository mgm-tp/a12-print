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

import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";

import { SWITCH_CASE_ACTION_WIDTH, SWITCH_CASE_ELEMENT_WIDTH_PERCENTAGE } from "../../constant/switch.js";

import { RuleCodeEditor } from "../rule-code-editor/RuleCodeEditor.js";

export const StyledCaseCard = styled.div<{ isDragging?: boolean }>`
	display: flex;
	gap: 2%;
	border-bottom: 2px solid ${props => props.theme.colors.divider.colorLight};
	padding: 12px 0;
	overflow: hidden;
	background-color: ${props => (props.isDragging ? props.theme.colors.interaction.focus.colorInverted : "")};
	:hover {
		background-color: ${props => props.theme.colors.interaction.hover.colorInverted};
	}
`;

export const StyledDragIcon = styled(Icon)`
	cursor: grab;
`;

export const StyledDragColumn = styled.div`
	width: ${SWITCH_CASE_ACTION_WIDTH}px;
	padding: 0 4px;
	display: flex;
	justify-content: center;
	align-items: center;
`;

export const StyledPreconditionColumn = styled.div`
	flex: auto;
	max-width: calc(100% - ${SWITCH_CASE_ELEMENT_WIDTH_PERCENTAGE}% - ${SWITCH_CASE_ACTION_WIDTH * 2}px - 6%);
`;
export const StyledAreaColumn = styled.div`
	width: ${SWITCH_CASE_ELEMENT_WIDTH_PERCENTAGE}%;
	display: flex;
	flex-direction: column;
	align-items: center;
`;

export const StyledActionColumn = styled.div`
	width: ${SWITCH_CASE_ACTION_WIDTH}px;
	display: flex;
	justify-content: center;
	align-items: center;
`;

export const StyledRuleCodeEditor = styled(RuleCodeEditor)`
	border: 1px solid ${props => props.theme.colors.divider.colorLight};
	border-radius: 2px;
`;

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

interface StyledWatermarkCardProps {
	isSelected: boolean;
}

export const StyledWatermarkCardContainer = styled.div<StyledWatermarkCardProps>`
	border: ${props => (props.isSelected ? "2px solid rgb(213, 0, 117)" : "none")};
`;

export const StyledWatermarkCard = styled.div<StyledWatermarkCardProps>`
	border-bottom: 1px solid ${props => props.theme.colors.divider.colorLight};
	font-size: 14px;
	display: flex;
	align-items: center;
	cursor: pointer;
	padding: 10px 12px;
	background: ${props =>
		props.isSelected
			? props.theme.colors.background.interactiveBackground
			: props.theme.colors.background.primaryBackground};
`;

export const StyledWatermarkIcon = styled.div`
	min-width: 70px;
	display: flex;
	align-items: center;
	gap: 8px;
`;

export const StyledWatermarkAction = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 8px;
	margin-left: 8px;
`;

export const StyledOpenCollapsibleWatermark = styled.div`
	background: ${props => props.theme.colors.background.nonInteractiveBackground};
	display: flex;
`;

export const StyledFlexContainerCenter = styled.div`
	display: flex;
	align-items: center;
	padding: 10px;
	font-size: 12px;
`;

export const StyledWatermarkInputColumn = styled.div`
	width: 90%;
`;

export const StyledCollapsibleWatermarkTitle = styled.div`
	width: 15%;
	min-width: 90px;
	padding-left: 16px;
`;

export const StyledWatermarkActionColumn = styled.div`
	display: flex;
	align-items: center;
	padding: 10px;
	min-width: 20px;
`;

export const StyledConditionDescription = styled.p`
	padding-left: 26px;
`;

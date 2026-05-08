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

export const ToolTipBottom = styled.div`
	font-size: 10px;
	background-color: #d51079;
	color: #fff;
	text-align: center;
	border-radius: 2px;
	padding: 2px 3px;
	position: absolute;
	bottom: calc(100% + 10px);
	transform: translate(-50%);
	white-space: nowrap;
	pointer-events: none;
	&:after {
		content: "";
		position: absolute;
		top: 100%;
		left: 50%;
		margin-left: -5px;
		border-width: 5px;
		border-style: solid;
		border-color: #d51079 transparent transparent transparent;
	}
`;

export const ToolTipTop = styled.div`
	font-size: 10px;
	background-color: #d51079;
	color: #fff;
	text-align: center;
	border-radius: 2px;
	padding: 2px 3px;
	position: absolute;
	top: calc(100% + 10px);
	transform: translate(-50%);
	white-space: nowrap;
	pointer-events: none;
	&:after {
		content: "";
		position: absolute;
		bottom: 100%;
		left: 50%;
		margin-left: -5px;
		border-width: 5px;
		border-style: solid;
		border-color: transparent transparent #d51079 transparent;
	}
`;

export const ToolTipRight = styled.div`
	font-size: 10px;
	background-color: #d51079;
	color: #fff;
	text-align: center;
	border-radius: 2px;
	padding: 2px 3px;
	position: absolute;
	right: calc(100% + 10px);
	transform: translate(0, -50%);
	white-space: nowrap;
	pointer-events: none;
	&:after {
		content: "";
		position: absolute;
		top: 50%;
		left: 100%;
		margin-top: -5px;
		border-width: 5px;
		border-style: solid;
		border-color: transparent transparent transparent #d51079;
	}
`;

export const ToolTipLeft = styled.div`
	font-size: 10px;
	background-color: #d51079;
	color: #fff;
	text-align: center;
	border-radius: 2px;
	padding: 2px 3px;
	position: absolute;
	left: calc(100% + 10px);
	transform: translate(0, -50%);
	white-space: nowrap;
	pointer-events: none;
	&:after {
		content: "";
		position: absolute;
		top: 50%;
		right: 100%;
		margin-top: -5px;
		border-width: 5px;
		border-style: solid;
		border-color: transparent #d51079 transparent transparent;
	}
`;

export const ToolTipY = styled.div`
	font-size: 10px;
	background-color: #d51079;
	color: #fff;
	text-align: center;
	border-radius: 2px;
	padding: 2px 3px;
	position: absolute;
	top: 5px;
	transform: translate(-50%);
	white-space: nowrap;
	pointer-events: none;
	&:before {
		content: "";
		position: absolute;
		bottom: 100%;
		right: 50%;
		margin-right: -5px;
		border-width: 5px;
		border-style: solid;
		border-color: transparent transparent #d51079 transparent;
	}
	&:after {
		content: "";
		position: absolute;
		top: 100%;
		left: 50%;
		margin-left: -5px;
		border-width: 5px;
		border-style: solid;
		border-color: #d51079 transparent transparent transparent;
	}
`;

export const ToolTipX = styled.div`
	font-size: 10px;
	background-color: #d51079;
	color: #fff;
	text-align: center;
	border-radius: 2px;
	padding: 2px 3px;
	position: absolute;
	left: 5px;
	transform: translate(0, -50%);
	white-space: nowrap;
	pointer-events: none;
	&:before {
		content: "";
		position: absolute;
		bottom: 50%;
		right: 100%;
		margin-bottom: -5px;
		border-width: 5px;
		border-style: solid;
		border-color: transparent #d51079 transparent transparent;
	}
	&:after {
		content: "";
		position: absolute;
		top: 50%;
		left: 100%;
		margin-top: -5px;
		border-width: 5px;
		border-style: solid;
		border-color: transparent transparent transparent #d51079;
	}
`;

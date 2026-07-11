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
import * as React from "react";
import { useSelector } from "react-redux";

import type { PrintError } from "@com.mgmtp.a12.print/print-model-api/errors";
import { ErrorTooltip, WarningTooltip, HintTooltip, InputElements } from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintLocalizer } from "../../../internal/localization/index.js";
import { ValidationSelectors } from "../../redux//validation/selectors.js";

import { StyledErrorContainer } from "./ErrorWrapper.styled.js";

interface ErrorWrapperProps {
	children?: React.ReactNode;
	errors?: PrintError[];
	warnings?: PrintError[];
	info?: PrintError[];
}

export const ErrorWrapper = ({ errors, warnings, info, children }: ErrorWrapperProps): React.ReactElement => {
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const {
		error: errorType,
		warning: warningType,
		info: infoType,
	} = useSelector(ValidationSelectors.validationInteraction);

	const isErrorContains = errors && errors.length > 0;
	const isWarningContains = warnings && warnings.length > 0;
	const isInfoContains = info && info.length > 0;

	const errorMessage = errorMessageLocalizer(errors);
	const errorToRender =
		errorType === "descriptive" ? (
			<StyledErrorContainer>
				<InputElements.Error errorMessage={errorMessage} />
			</StyledErrorContainer>
		) : (
			<ErrorTooltip text={errorMessage} />
		);
	const warningMessage = errorMessageLocalizer(warnings);
	const warningToRender =
		warningType === "descriptive" ? (
			<StyledErrorContainer>
				<InputElements.Warning warningMessage={warningMessage} />
			</StyledErrorContainer>
		) : (
			<WarningTooltip text={warningMessage} />
		);
	const infoMessage = errorMessageLocalizer(info);
	const infoToRender =
		infoType === "descriptive" ? (
			<StyledErrorContainer>
				<InputElements.Info infoMessage={infoMessage} />
			</StyledErrorContainer>
		) : (
			<HintTooltip text={infoMessage} />
		);
	return (
		<React.Fragment>
			{isErrorContains && errorToRender}
			{isWarningContains && warningToRender}
			{isInfoContains && infoToRender}
			{children}
		</React.Fragment>
	);
};

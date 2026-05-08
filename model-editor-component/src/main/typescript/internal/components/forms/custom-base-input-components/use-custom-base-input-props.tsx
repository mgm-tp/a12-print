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

import { ErrorTooltip, WarningTooltip } from "@com.mgmtp.a12.widgets/widgets-core/lib/tooltip/index.js";

import { ValidationSelectors } from "../../../redux/validation/selectors.js";

export const useCustomBaseInputProps = (
	errorMessage?: React.ReactNode,
	warningMessage?: React.ReactNode,
	addonAfter?: React.ReactNode | React.ReactNode[],
	tooltips?: React.ReactNode
) => {
	const { error: errorType, warning: warningType } = useSelector(ValidationSelectors.validationInteraction);

	const isCompactError = errorType === "compact";
	const isCompactWarning = warningType === "compact";

	const errorTooltip = React.useMemo(
		() => (isCompactError && errorMessage ? <ErrorTooltip text={errorMessage} /> : undefined),
		[errorMessage, isCompactError]
	);

	const warningTooltip = React.useMemo(
		() => (isCompactWarning && warningMessage ? <WarningTooltip text={warningMessage} /> : undefined),
		[isCompactWarning, warningMessage]
	);

	const propsAddonAfter: React.ReactNode[] = React.useMemo(
		() => (addonAfter ? (Array.isArray(addonAfter) ? addonAfter : [addonAfter]) : []),
		[addonAfter]
	);

	const propsTooltips: React.ReactNode[] = React.useMemo(
		() => (tooltips ? (Array.isArray(tooltips) ? tooltips : [tooltips]) : []),
		[tooltips]
	);

	const actualErrorMessage = isCompactError ? undefined : errorMessage;
	const actualWarningMessage = isCompactWarning ? undefined : warningMessage;
	return React.useMemo(
		() => ({
			errorMessage: actualErrorMessage,
			warningMessage: actualWarningMessage,
			errorTooltip,
			warningTooltip,
			propsAddonAfter,
			propsTooltips,
		}),
		[actualErrorMessage, actualWarningMessage, errorTooltip, propsAddonAfter, propsTooltips, warningTooltip]
	);
};

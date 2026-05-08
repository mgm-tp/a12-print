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
import { useDispatch, useSelector } from "react-redux";

import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";
import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/index.js";
import { ButtonGroup } from "@com.mgmtp.a12.widgets/widgets-core/lib/button-group/index.js";

import { ValidationActions, ValidationCounter, ValidationSeverity } from "../../redux/index.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { ValidationSelectors } from "../../redux/validation/selectors.js";

import { ErrorBadge, WarningBadge } from "../badge/ValidationBadge.js";

export const ErrorCounter = () => {
	return (
		<ButtonGroup>
			<ErrorButton severity={"error"} />
			<ErrorButton severity={"warning"} />
		</ButtonGroup>
	);
};

interface ErrorButtonProps {
	readonly severity: ValidationSeverity;
}
const ErrorButton = ({ severity }: ErrorButtonProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const validationInteraction = useSelector(ValidationSelectors.validationInteraction);
	const regionValidationCounter: ValidationCounter = useSelector(
		ValidationSelectors.containerElementValidationCounter
	);

	const handleToggleBadge = React.useCallback(() => {
		dispatch(ValidationActions.toggleInteractionType(severity));
	}, [dispatch, severity]);

	const Badge = severity === "error" ? ErrorBadge : WarningBadge;
	const validationCounter = regionValidationCounter[severity];
	const title = localizer(
		RESOURCE_KEYS.validation.title.toolbar[severity],
		PrintLocalizer.getLocalizableArgs({
			count: regionValidationCounter[severity],
		})
	);
	return (
		<Button
			icon={
				<Icon title={title} variant={validationCounter ? severity : undefined}>
					{severity}
				</Icon>
			}
			badge={<Badge count={validationCounter} type={validationInteraction[severity]} title={title} />}
			onClick={handleToggleBadge}
			disabled={!validationCounter}
		/>
	);
};

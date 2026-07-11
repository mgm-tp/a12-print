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

import { Button, Icon, Typography, ButtonGroup } from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import type { ValidationSeverity } from "../../../redux/index.js";
import { NavigationActions, NavigationSelectors, ValidationCounter } from "../../../redux/index.js";
import { BadgeGroup } from "../../badge/BadgeGroup.js";

interface FormHeaderProps {
	readonly headline?: string;
	validationCounter?: ValidationCounter;
}

export const FormHeader = ({
	headline,
	validationCounter = ValidationCounter.EMPTY_VALIDATION_COUNTER,
}: FormHeaderProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();

	const detailForm = useSelector(NavigationSelectors.detailForm);
	const { tab, entityId, mode } = useSelector(NavigationSelectors.currentCanvasStageContext);

	const closeButton = React.useMemo(
		() => (
			<ButtonGroup>
				<Button
					title={
						detailForm?.isFullScreen
							? localizer(RESOURCE_KEYS.button.minimized)
							: localizer(RESOURCE_KEYS.button.maximized)
					}
					onClick={() => {
						dispatch(NavigationActions.toggleDetailFormFullscreen({ tab, entityId, mode }));
					}}
					icon={<Icon>{detailForm?.isFullScreen ? "fullscreen_exit" : "fullscreen"}</Icon>}
				/>
				<Button
					title={localizer(RESOURCE_KEYS.button.close)}
					onClick={() => {
						dispatch(NavigationActions.setDetailForm({ tab, entityId, mode, form: undefined }));
					}}
					icon={<Icon>close</Icon>}
				/>
			</ButtonGroup>
		),
		[detailForm?.isFullScreen, localizer, dispatch, tab, entityId, mode]
	);
	return (
		<Typography.Section>
			<Typography.Headline level={2} ariaLevel={2} addons={closeButton}>
				<BadgeGroup
					validationCounter={validationCounter}
					errorTitle={useErrorTitle("error", validationCounter)}
					warningTitle={useErrorTitle("warning", validationCounter)}
					alwaysDescriptive
				/>
				{headline}
			</Typography.Headline>
		</Typography.Section>
	);
};

const useErrorTitle = (severity: ValidationSeverity, validationCounter: ValidationCounter) => {
	const localizer = PrintLocalizer.useLocalizer();

	return localizer(
		RESOURCE_KEYS.validation.title.form[severity],
		PrintLocalizer.getLocalizableArgs({ count: validationCounter[severity] })
	);
};

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

import { ModalNotification, ButtonGroup, Button } from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { ConfirmationDialogActions, ConfirmationDialogType } from "../../redux/index.js";

const CANCEL_BUTTON_LABEL_MAP: Record<ConfirmationDialogType, string> = {
	[ConfirmationDialogType.DELETE]: RESOURCE_KEYS.button.close,
	[ConfirmationDialogType.CANNOT_BE_UNDONE]: RESOURCE_KEYS.button.close,
	[ConfirmationDialogType.DISCARD_CHANGES]: RESOURCE_KEYS.button.back,
};

const CONFIRM_BUTTON_LABEL_MAP: Record<ConfirmationDialogType, string> = {
	[ConfirmationDialogType.DELETE]: RESOURCE_KEYS.button.delete,
	[ConfirmationDialogType.CANNOT_BE_UNDONE]: RESOURCE_KEYS.button.apply,
	[ConfirmationDialogType.DISCARD_CHANGES]: RESOURCE_KEYS.button.discardChanges,
};

const DESTRUCTIVE_TYPE = [ConfirmationDialogType.DELETE, ConfirmationDialogType.DISCARD_CHANGES];

export const ConfirmationDialog = () => {
	const dispatch = useDispatch();

	const localizer = PrintLocalizer.useLocalizer();

	const confirmationDialogState = useSelector(PrintEngineSelectors.confirmationDialogState);
	const onClose = React.useCallback(() => {
		dispatch(ConfirmationDialogActions.cancel());
	}, [dispatch]);

	const onConfirm = React.useCallback(() => {
		dispatch(ConfirmationDialogActions.confirm());
	}, [dispatch]);

	if (!confirmationDialogState?.type) {
		return null;
	}

	const { type } = confirmationDialogState;
	const title = localizer(RESOURCE_KEYS.confirmationDialog[type].title);
	const closeButtonLabel = localizer(CANCEL_BUTTON_LABEL_MAP[type]);
	const confirmButtonLabel = localizer(CONFIRM_BUTTON_LABEL_MAP[type]);

	const footer = (
		<ButtonGroup alignment="right">
			<Button onClick={onClose} label={closeButtonLabel} title={closeButtonLabel} />
			<Button
				primary
				destructive={DESTRUCTIVE_TYPE.includes(type)}
				onClick={onConfirm}
				label={confirmButtonLabel}
				title={confirmButtonLabel}
			/>
		</ButtonGroup>
	);
	return (
		<ModalNotification
			style={{ zIndex: 30 }}
			title={title}
			variant="warning"
			footer={footer}
			padding={18}
			onClose={onClose}
		>
			{localizer(RESOURCE_KEYS.confirmationDialog[type].text)}
		</ModalNotification>
	);
};

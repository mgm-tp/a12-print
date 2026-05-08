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
import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/index.js";
import { ButtonGroup } from "@com.mgmtp.a12.widgets/widgets-core/lib/button-group/index.js";
import { ModalNotification } from "@com.mgmtp.a12.widgets/widgets-core/lib/modal-notification/index.js";

import { useLocalizer } from "../../localization/localizer.js";
import { RESOURCE_KEYS } from "../../localization/keys.js";

interface ConfirmModalProps {
	isShow: boolean;
	onClose: () => void;
	onDelete: () => void;
}
export const ConfirmDeletionModal = ({ isShow, onClose, onDelete }: ConfirmModalProps) => {
	const localizer = useLocalizer();

	const footer = (
		<ButtonGroup alignment="right">
			<Button
				label={localizer(RESOURCE_KEYS.button.cancel)}
				title={localizer(RESOURCE_KEYS.button.cancel)}
				onClick={onClose}
			/>
			<Button
				primary
				destructive
				label={localizer(RESOURCE_KEYS.button.delete)}
				title={localizer(RESOURCE_KEYS.button.delete)}
				onClick={onDelete}
			/>
		</ButtonGroup>
	);

	if (!isShow) {
		return null;
	}

	return (
		<ModalNotification
			style={{ zIndex: 30 }}
			title={localizer(RESOURCE_KEYS.modal.confirmDeletion.title)}
			variant="warning"
			footer={footer}
			padding={12}
			onClose={onClose}
		>
			{localizer(RESOURCE_KEYS.modal.confirmDeletion.message)}
		</ModalNotification>
	);
};

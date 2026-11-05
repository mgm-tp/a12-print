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
import { useCallback } from "react";
import { useDispatch } from "react-redux";

import type { Section, PartialSection } from "@com.mgmtp.a12.print/print-model-api/model";
import { GlobalRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { InteractionLogActions, TransactionLogStateActions } from "../../../../redux/index.js";
import { RESOURCE_KEYS } from "../../../../localization/keys.js";
import { PrintLocalizer } from "../../../../localization/localizer.js";
import { DynamicSourceTextField } from "../../../forms/custom-base-input-components/DynamicSourceTextField.js";

import { StyledSettingsWrapper } from "./SettingNode.styled.js";

type CollapsibleSectionSettingsProps = {
	section: Section | PartialSection;
};

export const CollapsibleSectionSettings = ({ section }: CollapsibleSectionSettingsProps) => {
	const localizer = PrintLocalizer.useLocalizer();
	const dispatch = useDispatch();

	const onUpdateElementName = useCallback(
		(event: React.FocusEvent<HTMLInputElement>) => {
			const updatedElement = { ...section, title: event.target.value };
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.fragment.section.updateSection,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [TransactionLogStateActions.updateSection({ data: updatedElement })],
				})
			);
		},
		[dispatch, section]
	);

	return (
		<StyledSettingsWrapper>
			<DynamicSourceTextField
				value={section.title}
				placeholder={localizer(RESOURCE_KEYS.sidebar.fragment.section.setting.namePlaceholder)}
				onBlur={onUpdateElementName}
				label={localizer(RESOURCE_KEYS.sidebar.fragment.section.setting.name)}
			/>
		</StyledSettingsWrapper>
	);
};

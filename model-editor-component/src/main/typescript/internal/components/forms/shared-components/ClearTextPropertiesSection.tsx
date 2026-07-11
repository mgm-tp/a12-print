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
import { Button, MessageBox } from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";

import { FormContainerHeadline } from "./FormContainerHeadline.js";

interface ClearTextPropertiesSectionProps {
	/**
	 * Whether legacy (non-clean-state) text properties are present on the element.
	 * Callers compute this using the appropriate detection function:
	 * - Field / Calculation: hasAnyTextProperties(element.textProperties)
	 * - Expression in table: hasNonInheritedTextProperties(element.textProperties)
	 */
	hasLegacyProperties: boolean;
	onClear: () => void;
}

export const ClearTextPropertiesSection = ({ hasLegacyProperties, onClear }: ClearTextPropertiesSectionProps) => {
	const localizer = PrintLocalizer.useLocalizer();

	if (!hasLegacyProperties) {
		return null;
	}

	const clearButtonLabel = localizer(RESOURCE_KEYS.elementForm.textProperties.clearButton);
	return (
		<div>
			<FormContainerHeadline label={localizer(RESOURCE_KEYS.elementForm.textProperties.headline)} />
			<MessageBox label={localizer(RESOURCE_KEYS.elementForm.textProperties.legacyWarning)} variant="warning" />
			<Button
				className="-u-margin-t-base -u-width-full"
				label={clearButtonLabel}
				title={clearButtonLabel}
				onClick={onClear}
			/>
		</div>
	);
};

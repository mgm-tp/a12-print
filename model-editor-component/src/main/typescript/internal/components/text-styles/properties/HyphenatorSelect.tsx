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
import { StaticHyphenatorKey } from "@com.mgmtp.a12.print/print-typesetting/lib/internal/api/constant/static-hyphenator.js";
import { StaticHyphenator } from "@com.mgmtp.a12.print/print-model-api/lib/model/print-model.js";
import { HintTooltip, SelectItem } from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { CustomSelect } from "../../forms/custom-base-input-components/index.js";

import { BaseTextStylePropertyProps } from "./base-type.js";

const hyphenatorOptions: SelectItem[] = [
	{ label: "", value: "" },
	...Object.entries(StaticHyphenatorKey).map(([key, value]) => ({
		label: value,
		value: key,
	})),
];

interface HyphenatorSelectProps extends BaseTextStylePropertyProps {
	value?: string;
	onValueChanged: (value: StaticHyphenator) => void;
}

export const HyphenatorSelect = (props: HyphenatorSelectProps) => {
	const localizer = PrintLocalizer.useLocalizer();

	return (
		<CustomSelect
			value={props.value}
			label={localizer(RESOURCE_KEYS.textStyles.properties.hyphenator)}
			items={hyphenatorOptions}
			onValueChanged={props.onValueChanged}
			disabled={props.isDefaultTextStyle}
			errorMessage={props.errorMessage}
			tooltips={
				<HintTooltip text={localizer(RESOURCE_KEYS.textStyles.tooltips.legacyRenderingMode)} key="hint" />
			}
		/>
	);
};

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
import { useMemo } from "react";

import { CustomSelect, SelectItem } from "@com.mgmtp.a12.widgets/widgets-core";
import { Typography } from "@com.mgmtp.a12.widgets/widgets-core/lib/typography/index.js";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";
import { DEFAULT_FALLBACK_FONT } from "@com.mgmtp.a12.print/print-fonts/lib/internal/api/constant/default-fonts.js";

import { RESOURCE_KEYS } from "../../localization/keys.js";
import { useLocalizer } from "../../localization/localizer.js";
import { Font, Font_1 } from "../../../api/model/index.js";

import { StyledDefaultFontTooltip } from "./FallbackSelect.styled.js";

interface FallbackSelectProps {
	defaultFonts: Font_1[];
	customFonts?: Font[];
	onChange: (name: string) => void;
}

export const FallbackSelect = ({ onChange, customFonts = [] }: FallbackSelectProps) => {
	const localizer = useLocalizer();

	const customFallbackFont = customFonts.find(font => font.fallback);
	const overwrittenDefaultFallback = customFonts.find(font => font.name === DEFAULT_FALLBACK_FONT);
	const defaultFallbackValue = overwrittenDefaultFallback
		? `DEFAULT_${overwrittenDefaultFallback.name}`
		: DEFAULT_FALLBACK_FONT;

	const items: SelectItem[] = useMemo(() => {
		const items: SelectItem[] = [
			{
				value: defaultFallbackValue,
				label: DEFAULT_FALLBACK_FONT,
				graphic: (
					<StyledDefaultFontTooltip
						text={localizer(RESOURCE_KEYS.fontSettings.messages.defaultFallbackFont)}
						variant="hint"
					>
						<Icon variant="info">settings</Icon>
					</StyledDefaultFontTooltip>
				),
			},
		];

		customFonts?.forEach(font => {
			if (font.name) {
				items.push({ label: font.name, value: font.name });
			}
		});

		return items;
	}, [customFonts, defaultFallbackValue, localizer]);

	return (
		<div className="-u-width-full">
			<Typography.Headline level={3}>{localizer(RESOURCE_KEYS.fontSettings.fallback)}</Typography.Headline>
			<p>{localizer(RESOURCE_KEYS.fontSettings.messages.fallbackFont)}</p>
			<CustomSelect
				items={items}
				value={customFallbackFont?.name || defaultFallbackValue}
				onValueChanged={onChange}
				useCustomView
			/>
		</div>
	);
};

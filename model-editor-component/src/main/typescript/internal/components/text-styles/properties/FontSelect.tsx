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

import type { SelectItem } from "@com.mgmtp.a12.widgets/widgets-core";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core";
import { getFontFamily, isFontNotConfigured } from "@com.mgmtp.a12.print/print-fonts/a12internal";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { CustomSelect } from "../../forms/custom-base-input-components/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { DEFAULT_FONT_NAME } from "../../../constant/textstyle.js";

import type { BaseTextStylePropertyProps } from "./base-type.js";
import { StyledDefaultFontTooltip } from "./CommonTextProperty.styled.js";

interface FontSelectProps extends BaseTextStylePropertyProps {
	selectedFontName?: string;
	onValueChanged: (fontName: string) => void;
}

export const FontSelect = ({ selectedFontName, onValueChanged, isDefaultTextStyle, errorMessage }: FontSelectProps) => {
	const localizer = PrintLocalizer.useLocalizer();
	const storeFonts = useSelector(PrintEngineSelectors.fonts);

	const { isSelectedNotConfigured, fontOptions } = React.useMemo(() => {
		const fonts = { ...storeFonts };
		const isSelectedNotConfigured = isFontNotConfigured(fonts, selectedFontName);

		if (isSelectedNotConfigured && selectedFontName) {
			fonts[selectedFontName] = {
				name: selectedFontName,
				fontFamily: getFontFamily(fonts, DEFAULT_FONT_NAME),
				isDefault: false,
				isReconfigured: true,
			};
		}

		const fontOptions: SelectItem[] = Object.values(fonts)
			.filter(font => !font.isDefault)
			.map(font => {
				const { name, isReconfigured } = font;
				return {
					label: name,
					disabled: !font.url || (isSelectedNotConfigured && selectedFontName === name),
					graphic: !isReconfigured ? (
						<StyledDefaultFontTooltip
							text={localizer(RESOURCE_KEYS.textStyles.tooltips.defaultConfigurationFont)}
							variant="hint"
						>
							<Icon>settings</Icon>
						</StyledDefaultFontTooltip>
					) : null,
					value: name,
				};
			});
		return {
			isSelectedNotConfigured,
			fontOptions,
		};
	}, [localizer, selectedFontName, storeFonts]);
	return (
		<CustomSelect
			label={localizer(RESOURCE_KEYS.textStyles.properties.font)}
			items={fontOptions}
			value={selectedFontName}
			onValueChanged={onValueChanged}
			disabled={isDefaultTextStyle}
			errorMessage={errorMessage}
			warningMessage={
				isSelectedNotConfigured
					? localizer(RESOURCE_KEYS.textStyles.warningMessage.fontIsNotConfigured)
					: undefined
			}
			useCustomView={true}
		/>
	);
};

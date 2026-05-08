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

import { TextAffix } from "@com.mgmtp.a12.widgets/widgets-core/lib/input/text-line/index.js";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { TextStyle } from "../../../constant/text-style.js";
import { formatLeadingDecimal } from "../../custom-input/PositiveNumberInput.js";

import { TextPropertyButton } from "./TextPropertyButton.js";
import { StyledTextInput } from "./CommonTextProperty.styled.js";
import { BaseTextStylePropertyProps } from "./base-type.js";

interface LineHeightInputProps extends BaseTextStylePropertyProps {
	lineHeight?: number;
	onBlur: (lineHeight?: number) => void;
}

export const LineHeightInput = (props: LineHeightInputProps) => {
	const localizer = PrintLocalizer.useLocalizer();

	const formatOnChange = React.useCallback((newLineHeight: string, oldLineHeight?: string) => {
		if (Number.isNaN(Number(newLineHeight)) || Number(newLineHeight) > TextStyle.MAXIMUM_LINE_HEIGHT) {
			return oldLineHeight;
		}
		return formatLeadingDecimal(newLineHeight);
	}, []);

	const onBlur = React.useCallback(
		(event: React.FocusEvent<HTMLInputElement>) => {
			props.onBlur(event.target.value ? Number(event.target.value) : undefined);
		},
		[props]
	);

	return (
		<StyledTextInput
			value={props.lineHeight ? String(props.lineHeight) : undefined}
			textAlignment="right"
			onBlur={onBlur}
			suffixes={<TextAffix>pt</TextAffix>}
			addonBefore={
				<TextPropertyButton
					icon={"format_line_spacing"}
					title={localizer(RESOURCE_KEYS.textStyles.properties.lineHeight)}
				/>
			}
			formatOnChange={formatOnChange}
			disabled={props.isDefaultTextStyle}
			errorMessage={props.errorMessage}
		/>
	);
};

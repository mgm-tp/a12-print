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

import { PartialBorderProperties } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { OmitId } from "../../utils/index.js";

import { CustomTextLineStateless } from "../forms/custom-base-input-components/index.js";

interface ColorPickerProps {
	borderProperties?: PartialBorderProperties | undefined;
	setBorderProperties?: (newOptions: OmitId<PartialBorderProperties>) => void;
	errorMessage?: React.ReactNode;
}
const placeholderColor = "#ffffff";

export const ColorPicker = ({ borderProperties, setBorderProperties, errorMessage }: ColorPickerProps) => {
	const isFirefox = navigator.userAgent.indexOf("Firefox") > 0;

	const localizer = PrintLocalizer.useLocalizer();

	const [value, setValue] = React.useState<string>();

	React.useEffect(() => {
		setValue(borderProperties?.borderColor);
	}, [borderProperties?.borderColor]);

	function setColorToStore() {
		if (borderProperties?.borderColor === value || !value) {
			return;
		}
		setBorderProperties?.({ borderColor: value });
	}

	return (
		<CustomTextLineStateless
			id="borderColor"
			label={localizer(RESOURCE_KEYS.elementForm.borderProperties.borderColor)}
			inputProps={{ type: "color" }}
			onChange={e => setValue(e.target.value)}
			onFocus={() => {
				if (isFirefox) {
					setColorToStore();
				}
			}}
			onBlur={() => {
				setColorToStore();
			}}
			value={value || placeholderColor}
			errorMessage={errorMessage}
		/>
	);
};

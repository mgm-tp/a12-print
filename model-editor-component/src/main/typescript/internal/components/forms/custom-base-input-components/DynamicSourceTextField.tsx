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

import { CustomTextField } from "./CustomTextField.js";
import { SourceInput } from "./source-input/index.js";
import type { TextLineStatefulProps } from "./types.js";

export const DynamicSourceTextField = (props: TextLineStatefulProps) => {
	const { value: originalValue, onChange, onBlur, formatOnChange, sourceProperties, ...restProps } = props;
	const [value, setValue] = React.useState<string | undefined>(originalValue);
	const [prevOriginalValue, setPrevOriginalValue] = React.useState(originalValue);

	if (prevOriginalValue !== originalValue) {
		setPrevOriginalValue(originalValue);
		setValue(originalValue);
	}

	const handleOnChange = React.useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			let newValue: string | undefined = event.target.value;
			if (formatOnChange) {
				newValue = formatOnChange(newValue, value);

				if (newValue === value) {
					return;
				}
			}
			setValue(newValue);

			onChange && onChange({ ...event, target: { ...event.target, value: newValue || "" } });
		},
		[onChange, formatOnChange, value]
	);

	const handleOnBlur = React.useCallback(
		(event: React.FocusEvent<HTMLInputElement>) => {
			if (value !== originalValue) {
				onBlur && onBlur({ ...event, target: { ...event.target, value: value || "" } });
			}
		},
		[onBlur, originalValue, value]
	);

	return sourceProperties ? (
		<SourceInput
			{...restProps}
			sourceProperties={sourceProperties}
			value={value}
			onChange={handleOnChange}
			onBlur={handleOnBlur}
		/>
	) : (
		<CustomTextField {...restProps} value={value} onChange={handleOnChange} onBlur={handleOnBlur} />
	);
};

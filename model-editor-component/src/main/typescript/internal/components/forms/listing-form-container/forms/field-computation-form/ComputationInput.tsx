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

import { useFieldTypesOptions } from "../../hooks/use-fiedtypes-options.js";
import { CustomSelect, CustomTextLineStateless } from "../../../custom-base-input-components/index.js";

interface ComputationInputProps {
	label: string;
	value?: string;
	onChange: (value: string) => void;
	model?: string;
	errorMessage?: React.ReactNode;
}

export const ComputationInput = (props: ComputationInputProps) => {
	const { label, value, onChange, model, errorMessage } = props;
	const items = useFieldTypesOptions(model);
	return (
		<>
			<CustomSelect
				label={label}
				items={items}
				value={value}
				onValueChanged={onChange}
				fitToParent={false}
				errorMessage={errorMessage}
			/>
			{renderComputationInput(value)}
		</>
	);
};

const renderComputationInput = (inputValue?: string) => {
	if (!inputValue) {
		return null;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let convertedValue: Record<string, any>;
	try {
		convertedValue = JSON.parse(inputValue);
	} catch {
		return <></>;
	}

	const type = convertedValue.type;
	const valueObject = convertedValue[type];

	if (!valueObject || typeof valueObject !== "object") {
		return <></>;
	}

	const renderElements: React.ReactElement[] = [];

	const renderArray = (fieldTypeValues: Array<Record<string, object | string>>) => {
		const elements: React.ReactElement[] = [];
		fieldTypeValues.forEach((item: Record<string, object | string>, arrayIndex) => {
			Object.keys(item).forEach(itemKey => {
				const value = typeof item[itemKey] === "object" ? JSON.stringify(item[itemKey]) : String(item[itemKey]);
				elements.push(
					<CustomTextLineStateless
						readonly
						key={`computationInput-${arrayIndex}-${itemKey}`}
						label={itemKey}
						value={value}
					/>
				);
			});
		});

		return elements;
	};

	Object.keys(valueObject).forEach((valueKey, valueIndex) => {
		if (valueKey === "type") {
			return;
		}
		if (typeof valueObject[valueKey] !== "object") {
			renderElements.push(
				<CustomTextLineStateless
					readonly
					key={`computationInput-${valueIndex}`}
					label={valueKey}
					value={
						typeof valueObject[valueKey] !== "object"
							? valueObject[valueKey]
							: JSON.stringify(valueObject[valueKey])
					}
				/>
			);
		}

		if (Array.isArray(valueObject[valueKey])) {
			renderElements.push(...renderArray(valueObject[valueKey]));
		}
	});

	return renderElements;
};

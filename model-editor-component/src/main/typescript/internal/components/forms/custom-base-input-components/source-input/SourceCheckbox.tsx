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
import { useCallback, useMemo } from "react";

import type { CheckboxProps } from "@com.mgmtp.a12.widgets/widgets-core";
import { PossibleInputSource, InputValueSourceResolver } from "@com.mgmtp.a12.print/print-model-api/input-source";

import { useCustomBaseInputProps } from "../use-custom-base-input-props.js";
import type { SourceCheckboxProperties } from "../types.js";

import { SourceInputToggles } from "./SourceInputToggles.js";
import { SourceInputContainer } from "./SourceInputContainer.js";
import { StyleCheckbox, StyleCheckboxIndeterminate, StyleSourceCheckbox } from "./SourceCheckbox.styled.js";

interface SourceCheckboxProps extends Omit<CheckboxProps, "checked" | "onChange"> {
	checked?: boolean;
	onChange: (value: boolean) => void;
	sourceProperties: SourceCheckboxProperties;
}

export const SourceCheckbox = (props: SourceCheckboxProps) => {
	const {
		errorMessage: originalErrorMessage,
		warningMessage: originalWarningMessage,
		tooltips: originalTooltips,
		checked,
		onBlur,
		sourceProperties,
		label,
		labelGraphic,
		id,
		hideLabel,
		disabled,
		infoMessage,
		...restProps
	} = props;

	const { errorMessage, warningMessage, errorTooltip, warningTooltip, propsTooltips } = useCustomBaseInputProps(
		originalErrorMessage,
		originalWarningMessage,
		undefined,
		originalTooltips
	);

	const { onSourceChange, inputSource, element, property, determineInheritedSource, inheritedValueResolver } =
		sourceProperties;

	const { path: sourcePath, possibleInputSources } = InputValueSourceResolver.getInputSourceMetadata(
		element,
		property,
		determineInheritedSource
	);

	const inputSourceValue = InputValueSourceResolver.getSourceBooleanValue(
		inputSource,
		element,
		property,
		inheritedValueResolver
	);

	const handleSourceChange = useCallback(
		(newValue: string) => {
			const newSource = newValue as PossibleInputSource;

			if (newSource !== inputSource?.source) {
				onSourceChange(newSource, sourcePath);
			}
		},
		[inputSource, onSourceChange, sourcePath]
	);

	const checkbox = useMemo(() => {
		if (!inputSource) {
			return null;
		}

		const displayValue =
			inputSource.source === PossibleInputSource.DEFAULT
				? inputSourceValue
				: inputSource.source === PossibleInputSource.INPUT
					? checked
					: undefined;

		const isInputUndefined = inputSource.source === PossibleInputSource.INPUT && checked === undefined;

		return (
			<StyleSourceCheckbox>
				<SourceInputToggles
					possibleInputSources={possibleInputSources}
					source={inputSource!.source}
					onValueChanged={handleSourceChange}
					showOnlySelectedOption
				/>
				{isInputUndefined ? (
					<StyleCheckboxIndeterminate checked={"mixed"} onChange={restProps.onChange} />
				) : (
					<StyleCheckbox
						{...restProps}
						id={id}
						readonly={inputSource.source !== PossibleInputSource.INPUT}
						checked={!!displayValue}
					/>
				)}
			</StyleSourceCheckbox>
		);
	}, [id, checked, handleSourceChange, inputSource, inputSourceValue, possibleInputSources, restProps]);

	return (
		<SourceInputContainer
			showInput={!!inputSource}
			possibleInputSources={possibleInputSources}
			onSourceChange={handleSourceChange}
			errorMessage={errorMessage}
			warningMessage={warningMessage}
			tooltips={[...propsTooltips, errorTooltip, warningTooltip]}
			id={id}
			label={label}
			labelGraphic={labelGraphic}
			hideLabel={hideLabel}
			disabled={disabled}
			infoMessage={infoMessage}
		>
			{checkbox}
		</SourceInputContainer>
	);
};

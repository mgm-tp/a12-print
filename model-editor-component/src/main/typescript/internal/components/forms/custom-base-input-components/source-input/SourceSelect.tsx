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

import { Select, SelectProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/input/select/index.js";
import {
	PossibleInputSource,
	InputValueSourceResolver,
} from "@com.mgmtp.a12.print/print-model-api/lib/input-source/index.js";

import { useCustomBaseInputProps } from "../use-custom-base-input-props.js";
import { SourceSelectProperties } from "../types.js";

import { SourceInputContainer } from "./SourceInputContainer.js";
import { SourceInputToggles } from "./SourceInputToggles.js";
import { StyleSourceSelect } from "./SourceSelect.styled.js";

interface SourceSelectProps extends SelectProps {
	sourceProperties: SourceSelectProperties;
}

export const SourceSelect = (props: SourceSelectProps) => {
	const {
		errorMessage: originalErrorMessage,
		warningMessage: originalWarningMessage,
		tooltips,
		value,
		onBlur,
		sourceProperties,
		label,
		labelGraphic,
		id,
		hideLabel,
		disabled,
		infoMessage,
		placeholder = " ",
		...restProps
	} = props;

	const { errorMessage, warningMessage, errorTooltip, warningTooltip } = useCustomBaseInputProps(
		originalErrorMessage,
		originalWarningMessage,
		undefined,
		undefined
	);

	const { onSourceChange, inputSource, element, property, determineInheritedSource, inheritedValueResolver } =
		sourceProperties;

	const { path: sourcePath, possibleInputSources } = InputValueSourceResolver.getInputSourceMetadata(
		element,
		property,
		determineInheritedSource
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

	const inputSourceValue = InputValueSourceResolver.getSourceStringValue(
		inputSource,
		element,
		property,
		inheritedValueResolver
	);

	const select = useMemo(() => {
		if (!inputSource) {
			return null;
		}

		function getDisplayValue() {
			if (
				inputSource!.source === PossibleInputSource.DEFAULT ||
				inputSource!.source === PossibleInputSource.INHERITED
			) {
				return inputSourceValue;
			}

			if (inputSource!.source === PossibleInputSource.INPUT) {
				return value ?? "";
			}

			return "";
		}

		const displayValue = getDisplayValue();
		const isReadOnly = inputSource.source !== PossibleInputSource.INPUT;

		return (
			<StyleSourceSelect>
				<SourceInputToggles
					possibleInputSources={possibleInputSources}
					source={inputSource.source}
					onValueChanged={handleSourceChange}
					showOnlySelectedOption
				/>
				<Select
					{...restProps}
					id={id}
					readonly={isReadOnly}
					value={displayValue}
					placeholder={placeholder}
					tooltips={tooltips}
					useCustomView
				/>
			</StyleSourceSelect>
		);
	}, [
		inputSource,
		possibleInputSources,
		handleSourceChange,
		restProps,
		id,
		placeholder,
		tooltips,
		inputSourceValue,
		value,
	]);

	return (
		<SourceInputContainer
			showInput={!!inputSource}
			possibleInputSources={possibleInputSources}
			onSourceChange={handleSourceChange}
			errorMessage={errorMessage}
			warningMessage={warningMessage}
			tooltips={[errorTooltip, warningTooltip]}
			id={id}
			label={label}
			labelGraphic={labelGraphic}
			hideLabel={hideLabel}
			disabled={disabled}
			infoMessage={infoMessage}
		>
			{select}
		</SourceInputContainer>
	);
};

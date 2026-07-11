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
import { useCallback, useMemo, useState } from "react";

import type { TextFieldProps } from "@com.mgmtp.a12.widgets/widgets-core";
import { PossibleInputSource, InputValueSourceResolver } from "@com.mgmtp.a12.print/print-model-api/input-source";

import { stringifyInputValue } from "../../../../utils/input-source-utils.js";

import type { SourceColorPickerProperties } from "../types.js";
import { CustomTextField } from "../CustomTextField.js";

import { SourceInputToggles } from "./SourceInputToggles.js";
import { SourceInputContainer } from "./SourceInputContainer.js";

interface SourceColorPickerProps extends TextFieldProps {
	onColorChange?: (value?: string) => void;
	sourceProperties: SourceColorPickerProperties;
}

export const SourceColorPicker = (props: SourceColorPickerProps) => {
	const isFirefox = navigator.userAgent.indexOf("Firefox") > 0;

	const {
		value,
		onColorChange,
		onBlur,
		sourceProperties,
		label,
		labelGraphic,
		placeholder,
		id,
		hideLabel,
		disabled,
		errorMessage,
		warningMessage,
		infoMessage,
		labelRef,
		tooltips,
		...restProps
	} = props;

	const [currentValue, setCurrentValue] = useState<string | undefined>(value);
	const [prevInitialValue, setPrevInitialValue] = useState(value);

	if (prevInitialValue !== value) {
		setPrevInitialValue(value);
		setCurrentValue(value);
	}

	const { onSourceChange, inputSource, element, property, determineInheritedSource, inheritedValueResolver } =
		sourceProperties;

	const { path: sourcePath, possibleInputSources } = InputValueSourceResolver.getInputSourceMetadata(
		element,
		property,
		determineInheritedSource
	);

	const inputSourceValue = InputValueSourceResolver.getSourceInputValue(
		inputSource,
		element,
		property,
		(value?: string) => value,
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

	const updateColorValue = useCallback(() => {
		if (inputSource?.source !== PossibleInputSource.INPUT || currentValue === inputSourceValue) {
			return;
		}

		onColorChange?.(currentValue);
	}, [currentValue, inputSource?.source, inputSourceValue, onColorChange]);

	const colorInput = useMemo(() => {
		if (!inputSource) {
			return null;
		}

		const isHidden =
			(inputSource.source === PossibleInputSource.INPUT && !currentValue) ||
			inputSource.source === PossibleInputSource.UNSET;

		let displayValue;
		if (inputSource.source === PossibleInputSource.INPUT) {
			displayValue = currentValue;
		} else if (
			inputSource.source === PossibleInputSource.DEFAULT ||
			inputSource.source === PossibleInputSource.INHERITED
		) {
			displayValue = inputSourceValue;
		}

		return (
			<CustomTextField
				{...restProps}
				id={id}
				disabled={inputSource.source !== PossibleInputSource.INPUT || disabled}
				value={stringifyInputValue(displayValue)}
				inputProps={{ type: "color", style: { opacity: isHidden ? 0 : 1 } }}
				onChange={e => setCurrentValue(e.target.value)}
				onFocus={() => {
					if (isFirefox) {
						updateColorValue();
					}
				}}
				onBlur={() => {
					updateColorValue();
				}}
				prefixes={
					<SourceInputToggles
						possibleInputSources={possibleInputSources}
						source={inputSource.source}
						onValueChanged={handleSourceChange}
						showOnlySelectedOption
						disabled={disabled}
					/>
				}
			/>
		);
	}, [
		id,
		currentValue,
		disabled,
		handleSourceChange,
		inputSource,
		inputSourceValue,
		isFirefox,
		possibleInputSources,
		restProps,
		updateColorValue,
	]);

	return (
		<SourceInputContainer
			showInput={!!inputSource}
			possibleInputSources={possibleInputSources}
			onSourceChange={handleSourceChange}
			id={id}
			label={label}
			labelGraphic={labelGraphic}
			hideLabel={hideLabel}
			labelRef={labelRef}
			disabled={disabled}
			placeholder={placeholder}
			errorMessage={errorMessage}
			warningMessage={warningMessage}
			infoMessage={infoMessage}
			tooltips={tooltips}
		>
			{colorInput}
		</SourceInputContainer>
	);
};

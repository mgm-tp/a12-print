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
import { useCallback, useRef } from "react";

import {
	InputValueSourceResolver,
	PossibleInputSource,
} from "@com.mgmtp.a12.print/print-model-api/lib/input-source/index.js";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../../localization/index.js";
import { stringifyInputValue } from "../../../../utils/input-source-utils.js";

import { CustomTextLineStateless } from "../CustomTextLineStateless.js";
import type { TextLineStatefulProps } from "../types.js";

import { SourceInputToggles } from "./SourceInputToggles.js";
import { SourceInputContainer } from "./SourceInputContainer.js";

import useLocalizer = PrintLocalizer.useLocalizer;

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type SourceInputProps = WithRequired<TextLineStatefulProps, "sourceProperties">;

export const SourceInput = (props: SourceInputProps) => {
	const {
		value,
		onChange,
		onBlur,
		formatOnChange,
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
	const localizer = useLocalizer();
	const inputRef = useRef<HTMLInputElement | null>(null);
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
			newValue === PossibleInputSource.INPUT && inputRef.current?.focus();

			if (newSource !== inputSource?.source) {
				onSourceChange(newSource, sourcePath);
			}
		},
		[inputSource, onSourceChange, sourcePath]
	);

	const inputSourceValue = InputValueSourceResolver.getSourceInputValue(
		inputSource ? inputSource : undefined,
		element,
		property,
		(value?: string) => value,
		inheritedValueResolver
	);

	return (
		<SourceInputContainer
			possibleInputSources={possibleInputSources}
			onSourceChange={handleSourceChange}
			showInput={!!inputSource}
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
			{inputSource && (
				<CustomTextLineStateless
					{...restProps}
					id={id}
					inputRef={ref => {
						if (!inputRef.current) {
							inputRef.current = ref;
							ref?.focus();
						}
					}}
					readonly={inputSource.source !== PossibleInputSource.INPUT}
					value={
						inputSource.source !== PossibleInputSource.INPUT
							? (stringifyInputValue(inputSourceValue) ?? "")
							: value
					}
					onChange={onChange}
					onBlur={onBlur}
					placeholder={
						inputSource.source === PossibleInputSource.UNSET
							? localizer(RESOURCE_KEYS.input.inputSource.unsetPlaceholder)
							: ""
					}
					prefixes={
						<SourceInputToggles
							possibleInputSources={possibleInputSources}
							source={inputSource.source}
							onValueChanged={handleSourceChange}
							showOnlySelectedOption
						/>
					}
				/>
			)}
		</SourceInputContainer>
	);
};

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
import { Children, cloneElement, isValidElement, type ReactNode, useMemo } from "react";

import {
	addPrefix,
	HiddenText,
	joinClassNames,
	type Styleable,
	InputElements,
	type TextFieldProps,
} from "@com.mgmtp.a12.widgets/widgets-core";

export type PickedTextFieldProps = Pick<
	TextFieldProps,
	| "label"
	| "labelGraphic"
	| "placeholder"
	| "id"
	| "hideLabel"
	| "disabled"
	| "errorMessage"
	| "warningMessage"
	| "infoMessage"
	| "tooltips"
	| "labelRef"
> & {
	children: ReactNode;
};

const baseFieldClassName = addPrefix("field");

export const CustomInputWrapper = (props: PickedTextFieldProps) => {
	const {
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
		children,
	} = props;

	const labelElement = useMemo((): ReactNode => {
		if (!label && !placeholder) {
			return undefined;
		}

		const labelEl = (
			<>
				{label}
				{placeholder && <HiddenText>{`${label ? ", " : ""}${placeholder}`}</HiddenText>}
			</>
		);

		return (
			<InputElements.Label
				graphic={labelGraphic}
				htmlFor={id}
				dataRole="textline-label"
				label={labelEl}
				hide={hideLabel || !label}
				disabled={disabled}
				wrapperRef={labelRef}
			/>
		);
	}, [disabled, hideLabel, id, label, labelGraphic, labelRef, placeholder]);

	const tooltipElement = useMemo(
		() =>
			tooltips &&
			Children.map(
				tooltips,
				(element, index) =>
					isValidElement<Styleable>(element) &&
					cloneElement(element, {
						key: "element-" + index,
						className: joinClassNames(element.props.className, `${baseFieldClassName}__tooltip`),
					})
			),
		[tooltips]
	);

	return (
		<div>
			{labelElement}
			{tooltipElement}
			{errorMessage && (
				<InputElements.Error
					className={`${baseFieldClassName}__message`}
					dataRole="textline-error-message"
					errorMessage={errorMessage}
				/>
			)}
			{warningMessage && (
				<InputElements.Warning
					className={`${baseFieldClassName}__message`}
					dataRole="textline-warning-message"
					warningMessage={warningMessage}
				/>
			)}
			{infoMessage && (
				<InputElements.Info
					className={`${baseFieldClassName}__message`}
					dataRole="textline-info-message"
					infoMessage={infoMessage}
				/>
			)}
			{children}
		</div>
	);
};

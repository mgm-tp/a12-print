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
import { useDispatch, useSelector } from "react-redux";
import { nanoid } from "nanoid";

import {
	ExpressionProperties,
	PartialExpression,
	PartialBorderProperties,
	PartialTextProperties,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { GlobalRegion } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { TransactionLogStateActions } from "../../redux/index.js";
import { InteractionLogActions } from "../../redux/interaction-log/index.js";
import { ValidationSelectors } from "../../redux/validation/selectors.js";
import { PrintEngineState } from "../../store/root-reducer.js";
import { OmitId, useBorderPropertiesErrorMessage } from "../../utils/index.js";

import { TextPropertiesForm, BorderPropertiesForm, FormContainerHeadline } from "./shared-components/index.js";
import { DocumentModelSelect } from "./shared-components/DocumentModelSelect.js";
import { CustomCheckbox, CustomTextAreaStateful } from "./custom-base-input-components/index.js";

export const ExpressionFormContainer = () => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const element = useSelector(PrintEngineSelectors.detailPrintModelElement);
	const getExpressionErrorMessage = useExpressionPropertiesErrorMessage(element?.id);
	const textPropertiesErrors = useSelector(
		(state: PrintEngineState) => ValidationSelectors.styleableElement(state, element?.id)?.textProperties
	);

	if (!element || !PartialExpression.isInstance(element)) {
		throw Error("Expected element of type Expression");
	}
	const expression = element.expression;

	const updateExpression = React.useCallback(
		(expressionElement: PartialExpression, description: string) => {
			dispatch(
				InteractionLogActions.start({
					description: description,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [expressionElement] }),
					],
				})
			);
		},
		[dispatch]
	);

	const onExpressionValueBlur = React.useCallback(
		(event: React.FocusEvent<HTMLTextAreaElement>) => {
			const updatedElement = {
				...element,
				expression: { id: nanoid(), ...expression, text: event.target.value },
			};
			updateExpression(updatedElement, RESOURCE_KEYS.interaction.form.expressionFormContainer.changeContent);
		},
		[element, expression, updateExpression]
	);

	const setBorderProperties = React.useCallback(
		(newProps: OmitId<PartialBorderProperties>) => {
			const updatedElement = {
				...element,
				borderProperties: { id: nanoid(), ...element.borderProperties, ...newProps },
			};
			updateExpression(
				updatedElement,
				RESOURCE_KEYS.interaction.form.expressionFormContainer.changeBorderProperties
			);
		},
		[element, updateExpression]
	);

	const setTextProperties = React.useCallback(
		(newProps: OmitId<PartialTextProperties>) => {
			const updatedElement = {
				...element,
				textProperties: { id: nanoid(), ...element.textProperties, ...newProps },
			};
			updateExpression(
				updatedElement,
				RESOURCE_KEYS.interaction.form.expressionFormContainer.changeTextProperties
			);
		},
		[element, updateExpression]
	);

	const onChangeDocumentModel = React.useCallback(
		(model?: string) => {
			const updatedElement = { ...element, expression: { id: nanoid(), ...expression, model } };
			updateExpression(
				updatedElement,
				RESOURCE_KEYS.interaction.form.expressionFormContainer.changeDocumentModel
			);
		},
		[element, expression, updateExpression]
	);

	return (
		<>
			<DocumentModelSelect
				value={element.expression?.model}
				onValueChanged={onChangeDocumentModel}
				errorMessage={getExpressionErrorMessage("model")}
			/>
			<CustomTextAreaStateful
				value={expression?.text}
				onBlur={onExpressionValueBlur}
				label={localizer(RESOURCE_KEYS.elementForm.expression.expressionText)}
				errorMessage={getExpressionErrorMessage("text")}
			/>
			<GeneralProperties element={element} />
			<TextPropertiesForm
				element={element}
				textProperties={element.textProperties}
				setTextProperties={setTextProperties}
				textPropertyErrors={textPropertiesErrors}
			/>
			<BorderPropertiesForm
				borderProperties={element.borderProperties}
				setBorderProperties={setBorderProperties}
				getErrorMessage={useBorderPropertiesErrorMessage(element.id)}
			/>
		</>
	);
};

interface GeneralPropertiesProps {
	element: PartialExpression;
}

const GeneralProperties = ({ element }: GeneralPropertiesProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();

	const onChange = React.useCallback(
		(val: boolean) => {
			const updatedElement = {
				...element,
				expression: { id: nanoid(), ...element.expression, hideIfEmpty: val },
			};
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.expressionFormContainer.changeGeneralProperties,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element]
	);

	const label = localizer(RESOURCE_KEYS.elementForm.expression.hideIfEmpty);
	return (
		<>
			<FormContainerHeadline label={localizer(RESOURCE_KEYS.elementForm.expression.generalPropertiesHeadline)} />
			<CustomCheckbox
				checked={Boolean(element.expression?.hideIfEmpty)}
				onChange={onChange}
				label={label}
				title={label}
				fitToParent={false}
				errorMessage={useExpressionPropertiesErrorMessage(element?.id)("hideIfEmpty")}
			/>
		</>
	);
};

export function useExpressionPropertiesErrorMessage<T extends keyof Omit<ExpressionProperties, "id" | "type">>(
	id: string = ""
) {
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.expression(state, id));

	return (property: T) =>
		error ? errorMessageLocalizer(error.expression?.[property]?.[ErrorSeverity.ERROR]) : undefined;
}

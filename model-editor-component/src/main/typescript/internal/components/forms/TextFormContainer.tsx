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
	PartialAnyPrintModelElement,
	PartialCalculation,
	PartialField,
	PartialText,
	PartialBorderProperties,
	Text,
	PartialTextProperties,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import {
	GlobalRegion,
	TextRegion,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { DetailDataActions, TransactionLogStateActions } from "../../redux/index.js";
import { InteractionLogActions } from "../../redux/interaction-log/index.js";
import { PrintEngineState } from "../../store/root-reducer.js";
import { ValidationSelectors } from "../../redux/validation/selectors.js";
import { OmitId, useBorderPropertiesErrorMessage } from "../../utils/index.js";

import { RichTextEditor } from "../richtext-editor/index.js";

import {
	FieldForm,
	TextPropertiesForm,
	BorderPropertiesForm,
	CalculationForm,
	BackButtonGroup,
	CompactErrorWrapper,
} from "./shared-components/index.js";
import { CustomCheckbox } from "./custom-base-input-components/index.js";
import { ElementWithoutIdAndType } from "./type.js";

export const TextFormContainer = () => {
	const dispatch = useDispatch();
	const localize = PrintLocalizer.useLocalizer();
	const element = useSelector(PrintEngineSelectors.detailPrintModelElement);
	const currentDetailDataId = useSelector(PrintEngineSelectors.currentDetailDataId);
	const entityElement = useSelector(PrintEngineSelectors.textEntityElement);
	const getErrorMessage = useTextPropertyErrorMessage(element?.id);
	const textPropertiesErrors = useSelector(
		(state: PrintEngineState) => ValidationSelectors.styleableElement(state, element?.id)?.textProperties
	);

	if (!element || !PartialText.isInstance(element)) {
		throw Error("Expected element of type Text");
	}

	const text = element.text;

	const onHideIfEmptyChange = React.useCallback(
		(checked: boolean) => {
			const updatedElement = { ...element, text: { id: nanoid(), ...text, hideIfEmpty: checked } };
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.textFormContainer.toggleHideIfEmpty,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, text]
	);

	const setBorderProperties = React.useCallback(
		(newProps: OmitId<PartialBorderProperties>) => {
			const updatedElement = {
				...element,
				borderProperties: { id: nanoid(), ...element.borderProperties, ...newProps },
			};
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.textFormContainer.changeBorderProperties,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element]
	);

	const setTextProperties = React.useCallback(
		(newProps: OmitId<PartialTextProperties>) => {
			const updatedElement = {
				...element,
				textProperties: { id: nanoid(), ...element.textProperties, ...newProps },
			};
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.textFormContainer.changeTextProperties,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element]
	);

	const onChangeEntity = React.useCallback(
		(entity?: PartialAnyPrintModelElement) => {
			if (!entity) {
				return;
			}
			dispatch(
				DetailDataActions.replaceLastView({
					containerId: currentDetailDataId,
					view: PartialField.isInstance(entity)
						? TextRegion.TEXT_FROM_FIELD
						: TextRegion.TEXT_FROM_CALCULATION,
				})
			);
		},
		[currentDetailDataId, dispatch]
	);

	const checked = Boolean(element.text?.hideIfEmpty);
	const borderPropertiesErrorMessage = useBorderPropertiesErrorMessage(element.id);
	return (
		<>
			<CompactErrorWrapper
				errorMessage={getErrorMessage("text")}
				Child={RichTextEditor}
				childProps={{ element, onChangeEntity }}
				childKey={element.id}
			/>
			{entityElement ? (
				<EntityForm entityElement={entityElement} containerId={currentDetailDataId} />
			) : (
				<>
					<CustomCheckbox
						checked={checked}
						onChange={onHideIfEmptyChange}
						label={localize(RESOURCE_KEYS.elementForm.textFlow.hideIfEmpty)}
						fitToParent={false}
					/>
					<TextPropertiesForm
						element={element}
						textProperties={element.textProperties}
						setTextProperties={setTextProperties}
						showBackgroundColor={false}
						showBold={false}
						showColor={false}
						showItalic={false}
						showUnderline={false}
						textPropertyErrors={textPropertiesErrors}
					/>
					<BorderPropertiesForm
						borderProperties={element.borderProperties}
						setBorderProperties={setBorderProperties}
						getErrorMessage={borderPropertiesErrorMessage}
					/>
				</>
			)}
		</>
	);
};

interface EntityFormProps {
	entityElement: PartialAnyPrintModelElement;
	containerId: string;
}

const EntityForm = ({ entityElement, containerId }: EntityFormProps) => {
	const dispatch = useDispatch();

	const onBackClick = React.useCallback(() => {
		dispatch(DetailDataActions.deleteAdditionalData({ containerId }));
		dispatch(
			DetailDataActions.removeView({
				containerId,
				view: PartialField.isInstance(entityElement)
					? TextRegion.TEXT_FROM_FIELD
					: TextRegion.TEXT_FROM_CALCULATION,
			})
		);
	}, [dispatch, containerId, entityElement]);

	return (
		<>
			{PartialCalculation.isInstance(entityElement) ? (
				<CalculationForm element={entityElement} />
			) : PartialField.isInstance(entityElement) ? (
				<FieldForm element={entityElement} />
			) : (
				<div>{`Element of type ${entityElement.type} is not a valid entity`}</div>
			)}
			<BackButtonGroup onBack={onBackClick} />
		</>
	);
};

function useTextPropertyErrorMessage<T extends keyof ElementWithoutIdAndType<Text>>(id = "") {
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.textElement(state, id));

	return (property: T) => (error ? errorMessageLocalizer(error[property]?.[ErrorSeverity.ERROR]) : undefined);
}

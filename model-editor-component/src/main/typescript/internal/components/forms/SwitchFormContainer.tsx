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

import type { SwitchProperties } from "@com.mgmtp.a12.print/print-model-api/model";
import { PartialSwitch } from "@com.mgmtp.a12.print/print-model-api/model";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { InteractionLogActions, TransactionLogStateActions } from "../../redux/index.js";
import { RESOURCE_KEYS, PrintLocalizer } from "../../localization/index.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import { ValidationSelectors } from "../../redux//validation/selectors.js";

import { DynamicSourceTextField } from "./custom-base-input-components/index.js";
import { DocumentModelSelect } from "./shared-components/DocumentModelSelect.js";

export const SwitchFormContainer = () => {
	const element = useSelector(PrintEngineSelectors.currentFormElement);
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const getErrorMessage = useSwitchPropertiesErrorMessage(element?.id);

	if (!element || !PartialSwitch.isInstance(element)) {
		throw Error("Expected element of type Switch");
	}

	const onNameBlur = React.useCallback(
		(event: React.FocusEvent<HTMLInputElement>) => {
			const updatedElement = {
				...element,
				switch: { id: nanoid(), ...element.switch, name: event.target.value },
			};
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.switchFormContainer.changeName,
					region: "form",
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element]
	);

	const onChangeDocumentModel = React.useCallback(
		(model?: string) => {
			const updatedElement = { ...element, switch: { id: nanoid(), ...element.switch, model } };
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.switchFormContainer.changeDocumentModel,
					region: "form",
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element]
	);

	return (
		<>
			<DynamicSourceTextField
				value={element.switch?.name}
				onBlur={onNameBlur}
				label={localizer(RESOURCE_KEYS.elementForm.switch.name)}
				errorMessage={getErrorMessage("name")}
			/>
			<DocumentModelSelect
				value={element.switch?.model}
				onValueChanged={onChangeDocumentModel}
				errorMessage={getErrorMessage("model")}
			/>
		</>
	);
};

function useSwitchPropertiesErrorMessage<T extends keyof Omit<SwitchProperties, "id" | "dimensions" | "cases">>(
	id: string = ""
) {
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.switchElement(state, id));

	return (property: T) =>
		error ? errorMessageLocalizer(error.switch?.[property]?.[ErrorSeverity.ERROR]) : undefined;
}

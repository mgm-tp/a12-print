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

import type {
	PartialCalculation,
	CalculationProperties,
	DisplayOptions,
} from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";
import { TextRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { TransactionLogStateActions } from "../../../redux/index.js";
import { InteractionLogActions } from "../../../redux/interaction-log/index.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";
import { ValidationSelectors } from "../../../redux/validation/selectors.js";
import type { OmitId } from "../../../utils/index.js";

import type { ElementWithoutIdAndType } from "../type.js";
import { DynamicSourceTextField } from "../custom-base-input-components/index.js";

import type { ComputationRepeatRowType } from "./ComputationRepeat.js";
import { ComputationRepeat } from "./ComputationRepeat.js";
import { FieldTypeConfiguration } from "./FieldTypeConfiguration.js";
import { DocumentModelSelect } from "./DocumentModelSelect.js";

interface CalculationFormProps {
	element: PartialCalculation;
}

export const CalculationForm = ({ element }: CalculationFormProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();

	const updateCalculationElement = React.useCallback(
		(partialCalculationProperties: OmitId<DeepPartial<CalculationProperties>>) => {
			const updatedElement = {
				...element,
				calculation: {
					id: nanoid(),
					...element.calculation,
					...partialCalculationProperties,
				},
			};
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.sharedComponent.calculationForm.changeCalculationForm,
					region: TextRegion.TEXT_FROM_CALCULATION,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element]
	);

	const onNameBlur = React.useCallback(
		(event: React.FocusEvent<HTMLInputElement>) => {
			updateCalculationElement({ name: event.target.value });
		},
		[updateCalculationElement]
	);

	const setTableData = React.useCallback(
		(newTableData: ComputationRepeatRowType[]) => {
			updateCalculationElement({ computationAlternatives: newTableData });
		},
		[updateCalculationElement]
	);

	const onChangeDocumentModel = React.useCallback(
		(documentModel?: string) => {
			updateCalculationElement({ model: documentModel, computationAlternatives: [] });
		},
		[updateCalculationElement]
	);

	const tableData = React.useMemo(
		() => element.calculation?.computationAlternatives?.slice() || [],
		[element.calculation?.computationAlternatives]
	);

	const model = element.calculation?.model;
	const getErrorMessage = useCalculationPropertyErrorMessage(element.id);

	return (
		<>
			<DynamicSourceTextField
				inputProps={{ "data-testid": "name-input" } as React.HTMLProps<HTMLInputElement>}
				label={localizer(RESOURCE_KEYS.elementForm.textFlow.computation.name)}
				value={element.calculation?.name}
				onBlur={onNameBlur}
				errorMessage={getErrorMessage("name")}
			/>
			<DocumentModelSelect
				value={model}
				onValueChanged={onChangeDocumentModel}
				errorMessage={getErrorMessage("model")}
			/>
			<FieldTypeConfiguration
				data-testid="field-type-configuration"
				documentModel={model}
				element={element}
				getDisplayOptionsError={useCalculationDisplayOptionsError(element.id)}
			/>
			<ComputationRepeat
				tableData={tableData}
				setTableData={setTableData}
				documentModel={model}
				computationErrorMap={useComputationErrorMap(element.id)}
			/>
		</>
	);
};

function useCalculationPropertyErrorMessage<
	T extends keyof ElementWithoutIdAndType<Omit<CalculationProperties, "computationAlternatives">>,
>(id = "") {
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.calculation(state, id));

	return (property: T) =>
		error ? errorMessageLocalizer(error?.calculation?.[property]?.[ErrorSeverity.ERROR]) : undefined;
}

function useComputationErrorMap(id = "") {
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.calculation(state, id));

	return error?.calculation?.computationAlternatives;
}

function useCalculationDisplayOptionsError<T extends keyof ElementWithoutIdAndType<DisplayOptions>>(id = "") {
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.calculation(state, id));

	return (property: T) =>
		error
			? errorMessageLocalizer(error?.calculation?.displayOptions?.[property]?.[ErrorSeverity.ERROR])
			: undefined;
}

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

import { DisplayOptions, FieldProperties, PartialField } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";
import { TextRegion } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { TransactionLogStateActions } from "../../../redux/index.js";
import { InteractionLogActions } from "../../../redux/interaction-log/index.js";
import { PrintEngineState } from "../../../store/root-reducer.js";
import { ValidationSelectors } from "../../../redux/validation/selectors.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { ElementMapUtils } from "../../../utils/element-map-utils.js";
import { DocumentModelDataSelectors } from "../../../redux/document-model-data/selectors.js";

import { CustomTextLineStateless } from "../custom-base-input-components/index.js";
import { ElementWithoutIdAndType } from "../type.js";

import { FieldFormattingInputForm } from "./FieldFormattingInputForm.js";
import { DocumentModelSelect } from "./DocumentModelSelect.js";
import { AllowedElementType, DataContextSelection } from "./DataContextSelection.js";

interface FieldFormProps {
	element: PartialField;
}

export const FieldForm = ({ element }: FieldFormProps) => {
	const localizer = PrintLocalizer.useLocalizer();
	const wrapperDataContext = useSelector(PrintEngineSelectors.wrapperDataContext);

	const model = element.field?.model;

	const elementMap = useSelector(
		(state: PrintEngineState) => DocumentModelDataSelectors.documentModelData(state, model)?.elementMap
	);
	const dispatch = useDispatch();

	const field = element.field;

	const updateFieldElement = React.useCallback(
		(partialFieldProperties: Partial<FieldProperties>) => {
			const updatedElement: PartialField = {
				...element,
				field: { id: nanoid(), ...field, ...partialFieldProperties },
			};
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.sharedComponent.fieldForm.changeFieldForm,
					region: TextRegion.TEXT_FROM_FIELD,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, field]
	);

	const updateDisplayOptions = React.useCallback(
		(newData: DeepPartial<DisplayOptions>) => {
			updateFieldElement({ displayOptions: newData });
		},
		[updateFieldElement]
	);

	const onChangeDocumentModel = React.useCallback(
		(documentModel?: string) => {
			updateFieldElement({ model: documentModel, path: "" });
		},
		[updateFieldElement]
	);

	const setSelectedPath = React.useCallback(
		(path: string) => {
			updateFieldElement({ path });
		},
		[updateFieldElement]
	);

	const processedElementMap = React.useMemo(() => {
		return ElementMapUtils.createEntriesFromDataContext(Object.values(elementMap || {}), wrapperDataContext);
	}, [elementMap, wrapperDataContext]);

	const fieldPath = field?.path;
	const getErrorMessage = useFieldPropertyErrorMessage(element.id);
	return (
		<>
			<DocumentModelSelect
				value={model}
				onValueChanged={onChangeDocumentModel}
				errorMessage={getErrorMessage("model")}
			/>
			<CustomTextLineStateless
				readonly
				label={localizer(RESOURCE_KEYS.elementForm.model.field)}
				value={fieldPath}
				errorMessage={getErrorMessage("path")}
			/>
			<DataContextSelection
				type={AllowedElementType.field}
				elementMapEntries={processedElementMap}
				selectedPath={fieldPath}
				setSelectedPath={setSelectedPath}
				maxRepeatLevel={0}
			/>
			<FieldFormattingInputForm
				displayOptions={field?.displayOptions}
				updateDisplayOptions={updateDisplayOptions}
				getErrorMessage={useFieldDisplayOptionsErrorMessage(element.id)}
			/>
		</>
	);
};

export function useFieldPropertyErrorMessage<T extends keyof ElementWithoutIdAndType<FieldProperties>>(id = "") {
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.field(state, id));

	return (property: T) => (error ? errorMessageLocalizer(error.field?.[property]?.[ErrorSeverity.ERROR]) : undefined);
}

export function useFieldDisplayOptionsErrorMessage<T extends keyof DisplayOptions>(id = "") {
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.field(state, id));

	return (property: T) =>
		error ? errorMessageLocalizer(error.field?.displayOptions?.[property]?.[ErrorSeverity.ERROR]) : undefined;
}

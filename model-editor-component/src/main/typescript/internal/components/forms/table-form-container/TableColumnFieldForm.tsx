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
import { useDispatch, useSelector } from "react-redux";
import * as React from "react";
import { nanoid } from "nanoid";

import { DisplayOptions, PartialField } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";
import { TableRegion } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";

import { PrintEngineSelectors } from "../../../store/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { PrintEngineState } from "../../../store/root-reducer.js";
import { TransactionLogStateActions } from "../../../redux/index.js";
import { InteractionLogActions } from "../../../redux/interaction-log/index.js";
import { ElementMapUtils } from "../../../utils/element-map-utils.js";
import { DocumentModelDataSelectors } from "../../../redux/document-model-data/selectors.js";

import {
	AllowedElementType,
	DataContextSelection,
	DocumentModelInput,
	FieldFormattingInputForm,
	useFieldDisplayOptionsErrorMessage,
	useFieldPropertyErrorMessage,
} from "../shared-components/index.js";
import { CustomTextLineStateless } from "../custom-base-input-components/index.js";

import { TableColumnElementBaseProps } from "./table-column-element-base.js";

export const TableColumnFieldForm = ({ refId, group, model }: TableColumnElementBaseProps) => {
	const localizer = PrintLocalizer.useLocalizer();
	const dispatch = useDispatch();
	const element = useSelector((state: PrintEngineState) => PrintEngineSelectors.printModelElement(state, refId));
	const elementMap = useSelector((state: PrintEngineState) =>
		DocumentModelDataSelectors.documentModelData(state, model)
	)?.elementMap;
	const wrapperDataContext = useSelector(PrintEngineSelectors.wrapperDataContext);

	if (!PartialField.isInstance(element)) {
		throw Error("Expected element of type Field");
	}
	const field = element.field;

	const setSelectedPath = React.useCallback(
		(path: string) => {
			const updatedElement: PartialField = { ...element, field: { id: nanoid(), ...field, path } };
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.tableFormContainer.tableColumnFieldForm.changeField,
					region: TableRegion.TABLE_COLUMN_FORM,
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
			const updatedElement: PartialField = {
				...element,
				field: { id: nanoid(), ...field, displayOptions: newData },
			};
			dispatch(
				InteractionLogActions.start({
					description:
						RESOURCE_KEYS.interaction.form.tableFormContainer.tableColumnFieldForm.changeFieldFormatting,
					region: TableRegion.TABLE_COLUMN_FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, field]
	);

	const processedElementMap = React.useMemo(() => {
		return ElementMapUtils.createEntriesFromDataContext(Object.values(elementMap || {}), [
			...wrapperDataContext,
			{ group, isInstance: true },
		]);
	}, [elementMap, group, wrapperDataContext]);

	const getPropertyErrorMessage = useFieldPropertyErrorMessage(element.id);
	return (
		<>
			<DocumentModelInput documentModel={model} errorMessage={getPropertyErrorMessage("model")} />
			<CustomTextLineStateless
				readonly
				label={localizer(RESOURCE_KEYS.elementForm.model.field)}
				value={element.field?.path}
				errorMessage={getPropertyErrorMessage("path")}
			/>
			<DataContextSelection
				type={AllowedElementType.field}
				elementMapEntries={processedElementMap}
				selectedPath={element.field?.path}
				setSelectedPath={setSelectedPath}
				maxRepeatLevel={0}
				isInstanceContext
			/>
			<FieldFormattingInputForm
				displayOptions={field?.displayOptions}
				updateDisplayOptions={updateDisplayOptions}
				getErrorMessage={useFieldDisplayOptionsErrorMessage(element.id)}
			/>
		</>
	);
};

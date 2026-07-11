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
	PartialTable,
	TableProperties,
	PartialTextProperties,
	PartialBorderProperties,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { GlobalRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { TransactionLogStateActions } from "../../../redux/index.js";
import { InteractionLogActions } from "../../../redux/interaction-log/index.js";
import type { OmitId } from "../../../utils/index.js";
import { useBorderPropertiesErrorMessage } from "../../../utils/index.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";
import { ValidationSelectors } from "../../../redux/validation/selectors.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { ElementMapUtils } from "../../../utils/element-map-utils.js";
import { DocumentModelDataSelectors } from "../../../redux/document-model-data/selectors.js";
import { BORDER_PROPERTIES_PATH } from "../../../constant/element-property-path.js";

import {
	AllowedElementType,
	BorderPropertiesForm,
	DataContextSelection,
	TextPropertiesForm,
} from "../shared-components/index.js";
import { DocumentModelSelect } from "../shared-components/DocumentModelSelect.js";
import type { ElementWithoutIdAndType } from "../type.js";
import { CustomTextField } from "../custom-base-input-components/index.js";

import { TableColumns } from "./TableColumns.js";
import { GeneralProperties } from "./GeneralProperties.js";
import { HeaderProperties } from "./HeaderProperties.js";

interface TableFormProps {
	element: PartialTable;
}

export const TableForm = ({ element }: TableFormProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const errorMap = useSelector((state: PrintEngineState) => ValidationSelectors.table(state, element.id));
	const wrapperDataContext = useSelector(PrintEngineSelectors.wrapperDataContext);

	const model = element.table?.model;

	const elementMap = useSelector(
		(state: PrintEngineState) => DocumentModelDataSelectors.documentModelData(state, model)?.elementMap
	);

	const table = element.table;
	const group = table?.basePath;

	const updateTable = React.useCallback(
		(tableElement: PartialTable, interactionDescription: string) => {
			dispatch(
				InteractionLogActions.start({
					description: interactionDescription,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [tableElement] }),
					],
				})
			);
		},
		[dispatch]
	);

	const setSelectedPath = React.useCallback(
		(path: string = "") => {
			const updatedElement = {
				...element,
				table: {
					id: nanoid(),
					...table,
					basePath: path,
					columns: table?.basePath !== path ? [] : table.columns,
				},
			};
			updateTable(updatedElement, RESOURCE_KEYS.interaction.form.tableFormContainer.tableForm.changeBasePath);
		},
		[element, table, updateTable]
	);

	const setBorderProperties = React.useCallback(
		(newProps: OmitId<PartialBorderProperties>) => {
			const updatedElement = {
				...element,
				borderProperties: { id: nanoid(), ...element.borderProperties, ...newProps },
			};
			updateTable(
				updatedElement,
				RESOURCE_KEYS.interaction.form.tableFormContainer.tableForm.changeBorderProperties
			);
		},
		[element, updateTable]
	);

	const setTextProperties = React.useCallback(
		(newProps: OmitId<PartialTextProperties>) => {
			const updatedElement = {
				...element,
				textProperties: { id: nanoid(), ...element.textProperties, ...newProps },
			};
			updateTable(
				updatedElement,
				RESOURCE_KEYS.interaction.form.tableFormContainer.tableForm.changeTextProperties
			);
		},
		[element, updateTable]
	);

	const onChangeDocumentModel = React.useCallback(
		(documentModel?: string) => {
			const updatedElement = {
				...element,
				table: { id: nanoid(), ...element.table, model: documentModel, basePath: "", columns: [] },
			};
			updateTable(
				updatedElement,
				RESOURCE_KEYS.interaction.form.tableFormContainer.tableForm.changeDocumentModel
			);
		},
		[element, updateTable]
	);
	const getPropertyError = React.useCallback(
		(property: keyof ElementWithoutIdAndType<Omit<TableProperties, "headerTextProperties" | "columns">>) => {
			return errorMap ? errorMessageLocalizer(errorMap?.table?.[property]?.[ErrorSeverity.ERROR]) : undefined;
		},
		[errorMap, errorMessageLocalizer]
	);

	const processedElementMap = React.useMemo(() => {
		return ElementMapUtils.createEntriesFromDataContext(Object.values(elementMap || {}), wrapperDataContext);
	}, [elementMap, wrapperDataContext]);
	return (
		<>
			<DocumentModelSelect
				value={model}
				onValueChanged={onChangeDocumentModel}
				errorMessage={getPropertyError("model")}
			/>
			<CustomTextField
				readonly
				label={localizer(RESOURCE_KEYS.elementForm.model.group)}
				value={group}
				errorMessage={getPropertyError("basePath")}
			/>
			<DataContextSelection
				type={AllowedElementType.anyGroup}
				elementMapEntries={processedElementMap}
				selectedPath={group}
				setSelectedPath={setSelectedPath}
				maxRepeatLevel={0}
			/>
			<TableColumns element={element} />
			<GeneralProperties element={element} />
			<HeaderProperties element={element} />
			<TextPropertiesForm
				element={element}
				label={localizer(RESOURCE_KEYS.elementForm.table.bodyPropertiesHeadline)}
				textProperties={element.textProperties}
				setTextProperties={setTextProperties}
				textPropertyErrors={errorMap?.textProperties}
			/>
			<BorderPropertiesForm
				element={element}
				propertiesPath={BORDER_PROPERTIES_PATH}
				borderProperties={element.borderProperties}
				setBorderProperties={setBorderProperties}
				getErrorMessage={useBorderPropertiesErrorMessage(element.id)}
			/>
		</>
	);
};

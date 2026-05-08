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

import { Typography } from "@com.mgmtp.a12.widgets/widgets-core/lib/typography/index.js";
import { PartialTable, TableProperties } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";
import { GlobalRegion } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/lib/input-source/input-source.js";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { TransactionLogStateActions, InteractionLogActions } from "../../../redux/index.js";
import { ValidationSelectors } from "../../../redux/validation/selectors.js";
import { PrintEngineState } from "../../../store/root-reducer.js";
import { PositiveNumberInput } from "../../custom-input/PositiveNumberInput.js";
import {
	changeInputSource,
	changeInputValue,
	parseNumberInputValue,
	stringifyInputValue,
} from "../../../utils/input-source-utils.js";
import { TABLE_PROPERTY_PATH } from "../../../constant/element-property-path.js";

import { FormContainerHeadline } from "../shared-components/index.js";
import { CustomTextLineStateful } from "../custom-base-input-components/index.js";
import { ElementWithoutIdAndType } from "../type.js";

interface GeneralPropertiesProps {
	element: PartialTable;
}

export const GeneralProperties = ({ element }: GeneralPropertiesProps) => {
	const dispatch = useDispatch();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const localizer = PrintLocalizer.useLocalizer();
	const errorMap = useSelector((state: PrintEngineState) => ValidationSelectors.table(state, element.id));

	const getPropertyErrorMessage = (property: keyof ElementWithoutIdAndType<Omit<TableProperties, "columns">>) => {
		return errorMap ? errorMessageLocalizer(errorMap?.table?.[property]?.[ErrorSeverity.ERROR]) : undefined;
	};

	const table = element.table;

	const updateTable = React.useCallback(
		(updatedTable: PartialTable, description: string) => {
			dispatch(
				InteractionLogActions.start({
					description,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedTable] }),
					],
				})
			);
		},
		[dispatch]
	);

	const onBlurFilterExpression = React.useCallback(
		(event: React.FocusEvent<HTMLInputElement>) => {
			updateTable(
				{
					...element,
					table: { id: element.table?.id || nanoid(), ...table, filterExpression: event.target.value },
				},
				RESOURCE_KEYS.interaction.form.tableFormContainer.generalProperties.changeFilterExpression
			);
		},
		[element, table, updateTable]
	);

	const onRowCountSourceChange = React.useCallback(
		(source: PossibleInputSource, path: string) => {
			updateTable(
				{
					...element,
					table: {
						id: element.table?.id || nanoid(),
						...table,
						maxRowCount: changeInputSource(source, path, element.table?.maxRowCount),
					},
				},
				RESOURCE_KEYS.interaction.form.tableFormContainer.generalProperties.changeMaxRowCount.source
			);
		},
		[element, table, updateTable]
	);

	const onRowCountValueChange = React.useCallback(
		(event: React.FocusEvent<HTMLInputElement>) => {
			if (!element.table?.maxRowCount) {
				return;
			}

			updateTable(
				{
					...element,
					table: {
						id: element.table?.id || nanoid(),
						...table,
						maxRowCount: changeInputValue(
							parseNumberInputValue(event.target.value),
							element.table.maxRowCount
						),
					},
				},
				RESOURCE_KEYS.interaction.form.tableFormContainer.generalProperties.changeMaxRowCount.value
			);
		},
		[element, table, updateTable]
	);

	const onSumLabelSourceChange = React.useCallback(
		(source: PossibleInputSource, path: string) => {
			updateTable(
				{
					...element,
					table: {
						id: element.table?.id || nanoid(),
						...table,
						sumLabel: changeInputSource(source, path, element.table?.sumLabel),
					},
				},
				RESOURCE_KEYS.interaction.form.tableFormContainer.generalProperties.changeSumLabel.source
			);
		},
		[element, table, updateTable]
	);

	const onSumLabelValueChange = React.useCallback(
		(event: React.FocusEvent<HTMLInputElement>) => {
			if (!element.table?.sumLabel) {
				return;
			}

			updateTable(
				{
					...element,
					table: {
						id: element.table?.id || nanoid(),
						...table,
						sumLabel: changeInputValue(event.target.value, element.table.sumLabel),
					},
				},
				RESOURCE_KEYS.interaction.form.tableFormContainer.generalProperties.changeSumLabel.value
			);
		},
		[element, table, updateTable]
	);

	return (
		<>
			<FormContainerHeadline label={localizer(RESOURCE_KEYS.elementForm.table.generalPropertiesHeadline)} />
			<PositiveNumberInput
				sourceProperties={{
					inputSource: table?.maxRowCount,
					property: TABLE_PROPERTY_PATH.maxRowCount,
					element,
					onSourceChange: onRowCountSourceChange,
				}}
				label={localizer(RESOURCE_KEYS.elementForm.table.maxRowCount)}
				value={stringifyInputValue(table?.maxRowCount?.value)}
				onBlur={onRowCountValueChange}
				errorMessage={getPropertyErrorMessage("maxRowCount")}
			/>
			<CustomTextLineStateful
				sourceProperties={{
					inputSource: table?.sumLabel,
					property: TABLE_PROPERTY_PATH.sumLabel,
					element,
					onSourceChange: onSumLabelSourceChange,
				}}
				label={localizer(RESOURCE_KEYS.elementForm.table.sumLabel)}
				value={table?.sumLabel?.value}
				onBlur={onSumLabelValueChange}
				errorMessage={getPropertyErrorMessage("sumLabel")}
			/>
			<Typography.Headline level={4} ariaLevel={4}>
				{localizer(RESOURCE_KEYS.elementForm.table.filteringHeadline)}
			</Typography.Headline>
			<CustomTextLineStateful
				label={localizer(RESOURCE_KEYS.elementForm.table.filterExpression)}
				value={table?.filterExpression}
				onBlur={onBlurFilterExpression}
				errorMessage={getPropertyErrorMessage("filterExpression")}
			/>
		</>
	);
};

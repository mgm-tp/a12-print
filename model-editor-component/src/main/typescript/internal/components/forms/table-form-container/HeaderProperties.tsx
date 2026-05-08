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

import { PartialTable, PartialTextProperties } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { GlobalRegion } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { TransactionLogStateActions } from "../../../redux/index.js";
import { InteractionLogActions } from "../../../redux/interaction-log/index.js";
import { PrintEngineState } from "../../../store/root-reducer.js";
import { ValidationSelectors } from "../../../redux/validation/selectors.js";
import { OmitId } from "../../../utils/index.js";
import { TABLE_PROPERTY_PATH } from "../../../constant/element-property-path.js";

import { FormContainerHeadline, TextPropertiesInput } from "../shared-components/index.js";
import { CustomCheckbox } from "../custom-base-input-components/index.js";

interface HeaderPropertiesProps {
	element: PartialTable;
}

export const HeaderProperties = ({ element }: HeaderPropertiesProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const errorMap = useSelector((state: PrintEngineState) => ValidationSelectors.table(state, element.id));

	const table = element.table;

	const onCheckHideHeader = React.useCallback(
		(value: boolean) => {
			const updatedElement: PartialTable = { ...element, table: { id: nanoid(), ...table, hideHeader: value } };
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.tableFormContainer.headerProperties.toggleHideHeader,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, table]
	);

	const setTextProperties = React.useCallback(
		(newProps: OmitId<PartialTextProperties>) => {
			const updatedElement: PartialTable = {
				...element,
				table: {
					id: nanoid(),
					...table,
					headerTextProperties: {
						id: nanoid(),
						...table?.headerTextProperties,
						...newProps,
					},
				},
			};
			dispatch(
				InteractionLogActions.start({
					description:
						RESOURCE_KEYS.interaction.form.tableFormContainer.headerProperties.changeTextProperties,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, table]
	);

	const hideHeader = Boolean(table?.hideHeader);

	return (
		<>
			<FormContainerHeadline label={localizer(RESOURCE_KEYS.elementForm.table.headerPropertiesHeadline)} />
			<CustomCheckbox
				checked={hideHeader}
				onChange={onCheckHideHeader}
				label={localizer(RESOURCE_KEYS.elementForm.table.hideHeader)}
			/>
			{!hideHeader && (
				<TextPropertiesInput
					element={element}
					textProperties={table?.headerTextProperties}
					setTextProperties={setTextProperties}
					textPropertyErrors={errorMap?.table?.headerTextProperties}
					propertiesPath={TABLE_PROPERTY_PATH.headerTextProperties}
				/>
			)}
		</>
	);
};

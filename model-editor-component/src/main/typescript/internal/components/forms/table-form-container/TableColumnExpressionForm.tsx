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

import { PartialExpression, PartialTable } from "@com.mgmtp.a12.print/print-model-api/model";
import { TableRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { PrintEngineSelectors } from "../../../store/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";
import { TransactionLogStateActions } from "../../../redux/index.js";
import { InteractionLogActions } from "../../../redux/interaction-log/index.js";
import { hasNonInheritedTextProperties } from "../../../utils/text-properties-utils.js";

import { ClearTextPropertiesSection, DocumentModelInput } from "../shared-components/index.js";
import { useExpressionPropertiesErrorMessage } from "../ExpressionFormContainer.js";
import { CustomTextAreaStateful } from "../custom-base-input-components/index.js";

import type { TableColumnElementBaseProps } from "./table-column-element-base.js";
import { setInheritForExpressionTextProperties } from "./table-column-utils.js";

export const TableColumnExpressionForm = ({ refId, model, tableId }: TableColumnElementBaseProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const element = useSelector((state: PrintEngineState) => PrintEngineSelectors.printModelElement(state, refId));
	const tableElement = useSelector((state: PrintEngineState) =>
		tableId ? PrintEngineSelectors.printModelElement(state, tableId) : undefined
	);

	if (!PartialExpression.isInstance(element)) {
		throw Error("Expected element of type Expression");
	}

	const onInputBlur = React.useCallback(
		(event: React.FocusEvent<HTMLTextAreaElement>) => {
			const updatedElement: PartialExpression = {
				...element,
				expression: { id: nanoid(), ...element.expression, text: event.target.value },
			};
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.tableFormContainer.tableColumnExpression.changeContent,
					region: TableRegion.TABLE_COLUMN_FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element]
	);

	const clearTextProperties = React.useCallback(() => {
		const inheritedTextProperties =
			tableElement && PartialTable.isInstance(tableElement)
				? setInheritForExpressionTextProperties(element, tableElement)
				: undefined;
		const updatedElement: PartialExpression = { ...element, textProperties: inheritedTextProperties };
		dispatch(
			InteractionLogActions.start({
				description:
					RESOURCE_KEYS.interaction.form.tableFormContainer.tableColumnExpression.clearTextProperties,
				region: TableRegion.TABLE_COLUMN_FORM,
				transactionLogActions: [
					TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
				],
			})
		);
	}, [dispatch, element, tableElement]);

	const getPropertyErrorMessage = useExpressionPropertiesErrorMessage(element?.id);
	return (
		<>
			<DocumentModelInput documentModel={model} errorMessage={getPropertyErrorMessage("model")} />
			<CustomTextAreaStateful
				onBlur={onInputBlur}
				label={localizer(RESOURCE_KEYS.elementForm.expression.expressionText)}
				value={element.expression?.text}
				errorMessage={getPropertyErrorMessage("text")}
			/>
			<ClearTextPropertiesSection
				hasLegacyProperties={hasNonInheritedTextProperties(element.textProperties)}
				onClear={clearTextProperties}
			/>
		</>
	);
};

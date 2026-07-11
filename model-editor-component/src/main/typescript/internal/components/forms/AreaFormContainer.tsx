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

import type { DataContext, PartialBorderProperties } from "@com.mgmtp.a12.print/print-model-api/model";
import { PartialArea } from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { InteractionLogActions, TransactionLogStateActions } from "../../redux/index.js";
import type { OmitId } from "../../utils/index.js";
import { useBorderPropertiesErrorMessage } from "../../utils/index.js";
import { RESOURCE_KEYS } from "../../localization/index.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import { ValidationSelectors } from "../../redux//validation/selectors.js";
import { BORDER_PROPERTIES_PATH } from "../../constant/element-property-path.js";

import { RepeatableSettings } from "../custom-input/RepeatableSettings.js";

import { BorderPropertiesForm } from "./shared-components/BorderPropertiesForm.js";

export const AreaFormContainer = () => {
	const element = useSelector(PrintEngineSelectors.currentFormElement);
	const errorMap = useSelector((state: PrintEngineState) => ValidationSelectors.area(state, element?.id));
	const wrapperDataContext = useSelector(PrintEngineSelectors.wrapperDataContext);

	const dispatch = useDispatch();

	if (!element || !PartialArea.isInstance(element)) {
		throw Error("Expected element of type Area");
	}

	const setBorderProperties = React.useCallback(
		(newProps: OmitId<PartialBorderProperties>) => {
			const updatedElement = {
				...element,
				borderProperties: { id: nanoid(), ...element.borderProperties, ...newProps },
			};
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.areaFormContainer.changeBorderProperties,
					region: "form",
					transactionLogActions: [TransactionLogStateActions.updateArea({ data: updatedElement })],
				})
			);
		},
		[dispatch, element]
	);

	const updateRepeatableDataContext = React.useCallback(
		(newDataContexts: DeepPartial<DataContext>[]) => {
			if (!element.area) {
				return;
			}

			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.areaFormContainer.changeDataContext,
					region: "form",
					transactionLogActions: [
						TransactionLogStateActions.updateArea({
							data: {
								...element,
								area: {
									...element.area,
									dataContexts: newDataContexts,
								},
							},
						}),
					],
					affectedItems: [
						{
							type: "printModelElement",
							id: element.id,
						},
					],
				})
			);
		},
		[dispatch, element]
	);

	return (
		<>
			<RepeatableSettings
				wrapperDataContext={wrapperDataContext}
				dataContexts={element.area?.dataContexts}
				onUpdateDataContexts={updateRepeatableDataContext}
				dataContextErrorMap={errorMap?.area?.dataContexts}
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

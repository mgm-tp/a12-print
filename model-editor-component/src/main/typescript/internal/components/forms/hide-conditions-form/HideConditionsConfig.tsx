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

import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import { GlobalRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { Precondition } from "@com.mgmtp.a12.print/print-model-api/model";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import {
	InteractionLogActions,
	isVisibilityConfigFormState,
	NavigationSelectors,
	TransactionLogStateActions,
} from "../../../redux/index.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";
import { ValidationSelectors } from "../../../redux/validation/selectors.js";
import { assertType } from "../../../utils/type-utils.js";

import type { PreconditionRepeatRowType } from "../shared-components/index.js";
import { PreconditionsRepeat } from "../shared-components/index.js";

export const HideConditionsConfig = () => {
	const localizer = PrintLocalizer.useLocalizer();
	const dispatch = useDispatch();
	const currentReferenceForm = useSelector(NavigationSelectors.currentReferenceForm);
	const elementReferences = useSelector(PrintEngineSelectors.elementReferences);

	assertType(currentReferenceForm, isVisibilityConfigFormState);

	const placeabeRefId = currentReferenceForm.referenceId;

	const setTableData = React.useCallback(
		(newTableData: PreconditionRepeatRowType[]) => {
			const updatedRefs = elementReferences.map(ref =>
				ref.id === placeabeRefId ? { ...ref, hideConditions: newTableData } : ref
			);
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.hideConditions.changeHideConditions,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updateReferenceElements({
							data: updatedRefs,
						}),
					],
				})
			);
		},
		[dispatch, elementReferences, placeabeRefId]
	);

	const hideConditions = React.useMemo(
		() =>
			(elementReferences.find(el => el.id === placeabeRefId)?.hideConditions ||
				[]) as DeepPartial<Precondition>[],
		[elementReferences, placeabeRefId]
	);

	return (
		<>
			<p>{localizer(RESOURCE_KEYS.elementForm.hideConditions.description)}</p>
			<PreconditionsRepeat
				tableData={hideConditions}
				setTableData={setTableData}
				preconditionErrorMap={useHideConditionsErrorMap(placeabeRefId)}
			/>
		</>
	);
};

function useHideConditionsErrorMap(id = "") {
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.currentPlaceableReference(state, id));
	return error?.hideConditions;
}

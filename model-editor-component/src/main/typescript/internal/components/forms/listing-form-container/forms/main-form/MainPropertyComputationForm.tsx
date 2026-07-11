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

import type { PartialListing, RowPropertyKeyType } from "@com.mgmtp.a12.print/print-model-api/model";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";
import { ListingRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { type ListingPropertyCompFormState, TransactionLogStateActions } from "../../../../../redux/index.js";
import type { ComputationRepeatRowType } from "../../../shared-components/ComputationRepeat.js";
import { useRowPropertyItems } from "../../constants/properties.js";
import { InteractionLogActions } from "../../../../../redux/interaction-log/index.js";
import type { PrintEngineState } from "../../../../../../a12internal/api/PrintEngineState.js";
import { ValidationSelectors } from "../../../../../redux/validation/selectors.js";
import { PrintLocalizer } from "../../../../../localization/index.js";
import { RESOURCE_KEYS } from "../../../../../localization/index.js";
import type { BaseListingFormProps } from "../../base-listing-form.js";

import { PropertyComputationForm } from "../PropertyComputationForm.js";

interface MainPropertyComputationFormProps extends BaseListingFormProps {
	formState: ListingPropertyCompFormState;
}

export const MainPropertyComputationForm = ({ element, formState }: MainPropertyComputationFormProps) => {
	const dispatch = useDispatch();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const propertyCompIndex = formState?.propertyCompIndex;
	const rowPropertyComputationErrorMap = useSelector((state: PrintEngineState) => {
		const errorMap = ValidationSelectors.listing(state, element.id);
		return propertyCompIndex !== undefined
			? errorMap?.listing?.rowPropertyComputations?.[propertyCompIndex]
			: undefined;
	});

	const listing = element.listing;
	const rowPropertyComputations = React.useMemo(
		() => listing?.rowPropertyComputations || [],
		[listing?.rowPropertyComputations]
	);
	const currentPropertyComputation =
		propertyCompIndex !== undefined ? rowPropertyComputations[propertyCompIndex] : undefined;
	const computationAlternatives = currentPropertyComputation?.computationAlternatives?.slice() || [];

	const propertyErrorMessage = rowPropertyComputationErrorMap
		? errorMessageLocalizer(rowPropertyComputationErrorMap?.property?.[ErrorSeverity.ERROR])
		: undefined;

	const onInputProperty = React.useCallback(
		(value: string) => {
			const updatedElement: PartialListing = {
				...element,
				listing: {
					id: nanoid(),
					...listing,
					rowPropertyComputations: rowPropertyComputations.map((el, index) =>
						index === propertyCompIndex ? { ...el, property: value as RowPropertyKeyType } : el
					),
				},
			};
			dispatch(
				InteractionLogActions.start({
					description:
						RESOURCE_KEYS.interaction.form.listingFormContainer.form.main.mainPropertyComputationForm
							.changePropertyComputation,
					region: ListingRegion.PROPERTY_COMPUTATION_FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, listing, propertyCompIndex, rowPropertyComputations]
	);

	const onChangePropertyComputations = React.useCallback(
		(newPropertyComputations: ComputationRepeatRowType[]) => {
			const updatedElement = {
				...element,
				listing: {
					id: nanoid(),
					...listing,
					rowPropertyComputations: rowPropertyComputations.map((el, index) =>
						index === propertyCompIndex ? { ...el, computationAlternatives: newPropertyComputations } : el
					),
				},
			};
			dispatch(
				InteractionLogActions.start({
					description:
						RESOURCE_KEYS.interaction.form.listingFormContainer.form.main.mainPropertyComputationForm
							.changePropertyComputation,
					region: ListingRegion.PROPERTY_COMPUTATION_FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, listing, propertyCompIndex, rowPropertyComputations]
	);

	return (
		<PropertyComputationForm
			model={listing?.model}
			propertyItems={useRowPropertyItems()}
			onChangePropertyComputations={onChangePropertyComputations}
			onPropertyChange={onInputProperty}
			property={currentPropertyComputation?.property || ""}
			computationAlternatives={computationAlternatives}
			propertyErrorMessage={propertyErrorMessage}
			computationErrorMap={rowPropertyComputationErrorMap?.computationAlternatives}
		/>
	);
};

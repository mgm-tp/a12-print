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
	ColumnPropertyKeyType,
	PartialListing,
	ColumnPropertyComputations,
} from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";
import { ListingRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { useColumnPropertyItems } from "../../constants/properties.js";
import type { ComputationRepeatRowType } from "../../../shared-components/ComputationRepeat.js";
import {
	isListingColumnFormState,
	type ListingPropertyCompFormState,
	NavigationSelectors,
	TransactionLogStateActions,
} from "../../../../../redux/index.js";
import { InteractionLogActions } from "../../../../../redux/interaction-log/index.js";
import type { PrintEngineState } from "../../../../../../a12internal/api/PrintEngineState.js";
import { ValidationSelectors } from "../../../../../redux/validation/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../../../../localization/index.js";
import { assertType, type OmitId } from "../../../../../utils/index.js";
import type { BaseListingFormProps } from "../../base-listing-form.js";

import { PropertyComputationForm } from "../PropertyComputationForm.js";

interface ColumnPropertyComputationFormProps extends BaseListingFormProps {
	formState: ListingPropertyCompFormState;
}

export const ColumnPropertyComputationForm = ({ element, formState }: ColumnPropertyComputationFormProps) => {
	const dispatch = useDispatch();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const columnFormState = useSelector((state: PrintEngineState) =>
		NavigationSelectors.formStateByType(state, ListingRegion.LISTING_COLUMN_FORM)
	);

	assertType(columnFormState, isListingColumnFormState);

	const { columnIndex } = columnFormState;

	const { propertyCompIndex: propertyRowIndex, propertyCompType: fieldKey } = formState;
	const listing = element.listing;

	const columns = React.useMemo(() => listing?.columns?.slice() || [], [listing?.columns]);
	const currentColumn = columnIndex !== undefined && columns[columnIndex];
	const fieldKeySubObject = fieldKey && currentColumn ? currentColumn[fieldKey] : undefined;
	const propertyComputations = React.useMemo(
		() => fieldKeySubObject?.propertyComputations?.slice() || [],
		[fieldKeySubObject?.propertyComputations]
	);
	const currentPropertyComputation =
		propertyRowIndex !== undefined ? propertyComputations[propertyRowIndex] : undefined;
	const columnPropertyComputationErrorMap = useSelector((state: PrintEngineState) => {
		const errorMap = ValidationSelectors.listing(state, element.id);
		return fieldKey && propertyRowIndex !== undefined && columnIndex !== undefined
			? errorMap?.listing?.columns?.[columnIndex]?.[fieldKey]?.propertyComputations?.[propertyRowIndex]
			: undefined;
	});

	const updateCurrentColumnPropComp = React.useCallback(
		(newData: OmitId<DeepPartial<ColumnPropertyComputations>>) => {
			const updatedElement: PartialListing = {
				...element,
				listing: {
					id: nanoid(),
					...listing,
					columns: columns.map((el, idx) =>
						idx === columnIndex && fieldKey
							? {
									...el,
									[fieldKey]: {
										...fieldKeySubObject,
										propertyComputations: propertyComputations.map((propEl, index) =>
											index === propertyRowIndex ? { ...propEl, ...newData } : propEl
										),
									},
								}
							: el
					),
				},
			};
			dispatch(
				InteractionLogActions.start({
					description:
						RESOURCE_KEYS.interaction.form.listingFormContainer.form.column.propertyComputation
							.changePropertyComputation,
					region: ListingRegion.PROPERTY_COMPUTATION_FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[
			columnIndex,
			columns,
			dispatch,
			element,
			fieldKey,
			fieldKeySubObject,
			listing,
			propertyComputations,
			propertyRowIndex,
		]
	);

	const onChangePropertyComputations = React.useCallback(
		(newComputations: ComputationRepeatRowType[]) => {
			updateCurrentColumnPropComp({ computationAlternatives: newComputations });
		},
		[updateCurrentColumnPropComp]
	);

	const onPropertyChange = React.useCallback(
		(newValue: string) => {
			updateCurrentColumnPropComp({ property: newValue as ColumnPropertyKeyType });
		},
		[updateCurrentColumnPropComp]
	);

	const computationAlternatives = React.useMemo(
		() => currentPropertyComputation?.computationAlternatives?.slice() || [],
		[currentPropertyComputation?.computationAlternatives]
	);

	const propertyErrorMessage = columnPropertyComputationErrorMap
		? errorMessageLocalizer(columnPropertyComputationErrorMap?.property?.[ErrorSeverity.ERROR])
		: undefined;

	return (
		<PropertyComputationForm
			model={listing?.model}
			propertyItems={useColumnPropertyItems()}
			onChangePropertyComputations={onChangePropertyComputations}
			onPropertyChange={onPropertyChange}
			computationAlternatives={computationAlternatives}
			property={currentPropertyComputation?.property || ""}
			propertyErrorMessage={propertyErrorMessage}
			computationErrorMap={columnPropertyComputationErrorMap?.computationAlternatives}
		/>
	);
};

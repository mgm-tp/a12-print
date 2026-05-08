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

import {
	ColumnPropertyKeyType,
	PartialListing,
	ColumnPropertyComputations,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";
import { ListingRegion } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";

import { PrintEngineSelectors } from "../../../../../store/selectors.js";
import { useColumnPropertyItems } from "../../constants/properties.js";
import { TransactionLogStateActions } from "../../../../../redux/index.js";
import { ComputationRepeatRowType } from "../../../shared-components/ComputationRepeat.js";
import { InteractionLogActions } from "../../../../../redux/interaction-log/index.js";
import { PrintEngineState } from "../../../../../store/root-reducer.js";
import { ValidationSelectors } from "../../../../../redux/validation/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../../../../localization/index.js";
import { OmitId } from "../../../../../utils/index.js";
import { BaseListingFormProps } from "../../base-listing-form.js";

import { PropertyComputationForm } from "../PropertyComputationForm.js";

export const FieldPropertyComputationForm = ({ element }: BaseListingFormProps) => {
	const dispatch = useDispatch();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const additionalData = useSelector(PrintEngineSelectors.additionalData);
	const columnIndex = additionalData?.listing?.columnIndex;
	const fieldIndex = additionalData?.listing?.fieldCompIndex;
	const propertyIndex = additionalData?.listing?.propertyCompIndex;
	const listing = element.listing;

	const columns = React.useMemo(() => listing?.columns?.slice() || [], [listing?.columns]);
	const fieldComputations = React.useMemo(
		() => (columnIndex !== undefined ? columns[columnIndex].field?.slice() || [] : undefined),
		[columnIndex, columns]
	);
	const currentField = fieldComputations && fieldIndex !== undefined ? fieldComputations[fieldIndex] : undefined;
	const propertyComputations = React.useMemo(
		() => currentField?.propertyComputations?.slice() || [],
		[currentField?.propertyComputations]
	);
	const currentPropertyComputation = propertyIndex !== undefined ? propertyComputations[propertyIndex] : undefined;
	const computationAlternatives = React.useMemo(
		() => currentPropertyComputation?.computationAlternatives?.slice() || [],
		[currentPropertyComputation?.computationAlternatives]
	);
	const fieldPropertyComputationErrorMap = useSelector((state: PrintEngineState) => {
		const errorMap = ValidationSelectors.listing(state, element.id);
		return columnIndex !== undefined && fieldIndex !== undefined && propertyIndex !== undefined
			? errorMap?.listing?.columns?.[columnIndex]?.field?.[fieldIndex]?.propertyComputations?.[propertyIndex]
			: undefined;
	});

	const insertPropertyComputation = React.useCallback(
		(listingElement: PartialListing, propertyComputation: OmitId<DeepPartial<ColumnPropertyComputations>>) => {
			const updatedFieldComputations = fieldComputations?.map((fieldEl, fieldElIndex) => {
				if (fieldElIndex === fieldIndex) {
					return {
						...fieldEl,
						propertyComputations: propertyComputations.map((propCompEl, propCompElIndex) =>
							propCompElIndex === propertyIndex ? { ...propCompEl, ...propertyComputation } : propCompEl
						),
					};
				}
				return fieldEl;
			});

			const updatedColumns = columns.map((el, index) => {
				if (index === columnIndex) {
					return {
						...el,
						field: updatedFieldComputations,
					};
				}
				return el;
			});

			const updatedElement: PartialListing = {
				...listingElement,
				listing: {
					id: nanoid(),
					...listing,
					columns: updatedColumns,
				},
			};

			return updatedElement;
		},
		[columnIndex, columns, fieldComputations, fieldIndex, listing, propertyComputations, propertyIndex]
	);

	const updateCurrentPropertyComputation = React.useCallback(
		(newData: OmitId<DeepPartial<ColumnPropertyComputations>>) => {
			const updatedElement = insertPropertyComputation(element, newData);
			dispatch(
				InteractionLogActions.start({
					description:
						RESOURCE_KEYS.interaction.form.listingFormContainer.form.fieldComputation
							.fieldPropertyComputation.changeFieldPropertyComputation,
					region: ListingRegion.PROPERTY_COMPUTATION_FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, insertPropertyComputation]
	);

	const onPropertyChange = React.useCallback(
		(newValue: string) => {
			updateCurrentPropertyComputation({ property: (newValue as ColumnPropertyKeyType) || undefined });
		},
		[updateCurrentPropertyComputation]
	);

	const onChangePropertyComputations = React.useCallback(
		(newComputations: ComputationRepeatRowType[]) => {
			updateCurrentPropertyComputation({ computationAlternatives: newComputations });
		},
		[updateCurrentPropertyComputation]
	);

	const propertyErrorMessage = fieldPropertyComputationErrorMap
		? errorMessageLocalizer(fieldPropertyComputationErrorMap?.property?.[ErrorSeverity.ERROR])
		: undefined;

	return (
		<PropertyComputationForm
			model={listing?.model}
			propertyItems={useColumnPropertyItems()}
			computationAlternatives={computationAlternatives}
			onChangePropertyComputations={onChangePropertyComputations}
			onPropertyChange={onPropertyChange}
			property={currentPropertyComputation?.property || ""}
			propertyErrorMessage={propertyErrorMessage}
			computationErrorMap={fieldPropertyComputationErrorMap?.computationAlternatives}
		/>
	);
};

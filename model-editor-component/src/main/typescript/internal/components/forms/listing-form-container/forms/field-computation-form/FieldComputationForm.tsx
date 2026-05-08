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
	ComputationAlternative,
	DisplayOptions,
	ListingColumnField,
	PartialListing,
	ColumnPropertyComputations,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";
import { ListingRegion } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";

import { PrintEngineSelectors } from "../../../../../store/selectors.js";
import { FieldFormattingInputForm } from "../../../shared-components/FieldFormattingInputForm.js";
import { FormContainerHeadline } from "../../../shared-components/FormContainerHeadline.js";
import { BackButtonGroup } from "../../../shared-components/BackButtonGroup.js";
import { ComputationRepeat } from "../../../shared-components/ComputationRepeat.js";
import { ListingDataActions } from "../../../../../redux/detail-data/listing/index.js";
import { DetailDataActions, TransactionLogStateActions } from "../../../../../redux/index.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../../../../localization/index.js";
import { InteractionLogActions } from "../../../../../redux/interaction-log/index.js";
import { PrintEngineState } from "../../../../../store/root-reducer.js";
import { ValidationSelectors } from "../../../../../redux/validation/selectors.js";
import { ElementWithoutIdAndType } from "../../../type.js";
import { OmitId } from "../../../../../utils/index.js";
import { BaseListingFormProps } from "../../base-listing-form.js";
import { ColumnTablePropertyComputation } from "../../shared-components/ColumnTablePropertyComputation.js";

import { ComputationInput } from "./ComputationInput.js";

export const FieldComputationForm = ({ element }: BaseListingFormProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const currentDetailDataId = useSelector(PrintEngineSelectors.currentDetailDataId);
	const additionalData = useSelector(PrintEngineSelectors.additionalData);
	const columnIndex = additionalData?.listing?.columnIndex;
	const fieldIndex = additionalData?.listing?.fieldCompIndex;

	const listing = element.listing;
	const columns = React.useMemo(() => listing?.columns?.slice() || [], [listing?.columns]);
	const fieldComputations = React.useMemo(
		() => (columnIndex !== undefined ? columns[columnIndex].field?.slice() || [] : undefined),
		[columnIndex, columns]
	);
	const currentField = fieldIndex !== undefined && fieldComputations ? fieldComputations[fieldIndex] : undefined;
	const computationAlternatives = React.useMemo(
		() => currentField?.valueComputationAlternatives?.slice() || [],
		[currentField?.valueComputationAlternatives]
	);
	const propertyComputations = React.useMemo(
		() => currentField?.propertyComputations?.slice() || [],
		[currentField?.propertyComputations]
	);
	const fieldErrorMap = useSelector((state: PrintEngineState) => {
		const errorMap = ValidationSelectors.listing(state, element.id);
		return columnIndex !== undefined && fieldIndex !== undefined
			? errorMap?.listing?.columns?.[columnIndex]?.field?.[fieldIndex]
			: undefined;
	});

	const model = element.listing?.model;
	const onBackClick = React.useCallback(() => {
		dispatch(
			DetailDataActions.removeView({
				containerId: currentDetailDataId,
				view: ListingRegion.FIELD_COMPUTATION_FORM,
			})
		);
		dispatch(ListingDataActions.deleteAdditionalKey({ containerId: currentDetailDataId, category: "fieldComp" }));
	}, [dispatch, currentDetailDataId]);

	const updateCurrentField = React.useCallback(
		(newData: OmitId<DeepPartial<ListingColumnField>>) => {
			const updatedElement: PartialListing = {
				...element,
				listing: {
					id: nanoid(),
					...listing,
					columns: columns.map((el, index) =>
						index === columnIndex
							? {
									...el,
									field: fieldComputations?.map((fieldEl, fieldElIndex) =>
										fieldElIndex === fieldIndex ? { ...fieldEl, ...newData } : fieldEl
									),
								}
							: el
					),
				},
			};
			dispatch(
				InteractionLogActions.start({
					description:
						RESOURCE_KEYS.interaction.form.listingFormContainer.form.fieldComputation.fieldComputation
							.changeFieldComputation,
					region: ListingRegion.FIELD_COMPUTATION_FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[columnIndex, columns, dispatch, element, fieldComputations, fieldIndex, listing]
	);

	const handleUpdateValueComputations = React.useCallback(
		(newComputations: DeepPartial<ComputationAlternative>[]) => {
			updateCurrentField({ valueComputationAlternatives: newComputations });
		},
		[updateCurrentField]
	);

	const handleDeletePropertyComputation = React.useCallback(
		(indexToDelete: number) => {
			updateCurrentField({
				propertyComputations: propertyComputations.filter(
					(_propEl, propElIndex) => propElIndex !== indexToDelete
				),
			});
		},
		[propertyComputations, updateCurrentField]
	);

	const onComputationInputChange = React.useCallback(
		(newValue: string, key: "inputFieldTypeSerialized" | "outputFieldTypeSerialized") => {
			updateCurrentField({ [key]: newValue });
		},
		[updateCurrentField]
	);

	const updatePropertyComputations = React.useCallback(
		(newComputations: DeepPartial<ColumnPropertyComputations>[]) => {
			updateCurrentField({ propertyComputations: newComputations });
		},
		[updateCurrentField]
	);

	const updateDisplayOptions = React.useCallback(
		(newData: DeepPartial<DisplayOptions>) => {
			updateCurrentField({ displayOptions: newData });
		},
		[updateCurrentField]
	);

	const getFieldPropertyErrorMessage = React.useCallback(
		(
			property: keyof ElementWithoutIdAndType<
				Pick<ListingColumnField, "inputFieldTypeSerialized" | "outputFieldTypeSerialized">
			>
		) => {
			return fieldErrorMap ? errorMessageLocalizer(fieldErrorMap?.[property]?.[ErrorSeverity.ERROR]) : undefined;
		},
		[fieldErrorMap, errorMessageLocalizer]
	);

	const getDisplayOptionsErrorMessage = React.useCallback(
		(property: keyof DisplayOptions) => {
			const displayOptionErrorMap = fieldErrorMap?.displayOptions;

			return displayOptionErrorMap
				? errorMessageLocalizer(displayOptionErrorMap?.[property]?.[ErrorSeverity.ERROR])
				: undefined;
		},
		[fieldErrorMap?.displayOptions, errorMessageLocalizer]
	);

	if (!currentField) {
		return null;
	}

	return (
		<>
			<FormContainerHeadline
				label={localizer(RESOURCE_KEYS.elementForm.listing.fieldComputations.documentFieldType)}
			/>
			<p>{localizer(RESOURCE_KEYS.elementForm.listing.fieldComputations.documentFieldTypeDescription)}</p>
			<ComputationInput
				model={model}
				label={localizer(RESOURCE_KEYS.elementForm.listing.fieldComputations.resultFieldTypeDescription)}
				value={currentField.inputFieldTypeSerialized}
				onChange={value => onComputationInputChange(value, "inputFieldTypeSerialized")}
				errorMessage={getFieldPropertyErrorMessage("inputFieldTypeSerialized")}
			/>
			<FormContainerHeadline
				label={localizer(RESOURCE_KEYS.elementForm.listing.fieldComputations.resultFieldType)}
			/>
			<p>{localizer(RESOURCE_KEYS.elementForm.listing.fieldComputations.resultFieldTypeDescription)}</p>
			<ComputationInput
				model={model}
				label={localizer(RESOURCE_KEYS.elementForm.listing.fieldComputations.fieldTypeSerializedOutput)}
				value={currentField.outputFieldTypeSerialized}
				onChange={value => onComputationInputChange(value, "outputFieldTypeSerialized")}
				errorMessage={getFieldPropertyErrorMessage("outputFieldTypeSerialized")}
			/>
			<FormContainerHeadline label={localizer(RESOURCE_KEYS.elementForm.listing.valueComputations.headline)} />
			<ComputationRepeat
				tableData={computationAlternatives}
				setTableData={handleUpdateValueComputations}
				documentModel={model}
				computationErrorMap={fieldErrorMap?.valueComputationAlternatives}
			/>
			<ColumnTablePropertyComputation
				propertyComputations={propertyComputations}
				handleDeleteRow={handleDeletePropertyComputation}
				updatePropertyComputations={updatePropertyComputations}
				propertyComputationErrorMap={fieldErrorMap?.propertyComputations}
			/>
			<FieldFormattingInputForm
				displayOptions={currentField.displayOptions}
				updateDisplayOptions={updateDisplayOptions}
				getErrorMessage={getDisplayOptionsErrorMessage}
			/>
			<BackButtonGroup onBack={onBackClick} />
		</>
	);
};

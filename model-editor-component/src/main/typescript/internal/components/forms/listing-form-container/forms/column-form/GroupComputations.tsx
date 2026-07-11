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
	ListingColumnGroup,
	PartialListing,
	ColumnPropertyComputations,
} from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import { ListingRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import type { ComputationRepeatRowType } from "../../../shared-components/ComputationRepeat.js";
import { ComputationRepeat } from "../../../shared-components/ComputationRepeat.js";
import { FormContainerHeadline } from "../../../shared-components/FormContainerHeadline.js";
import { CollapsibleSection } from "../../shared-components/CollapsibleSection.js";
import { TransactionLogStateActions } from "../../../../../redux/index.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../../../../localization/index.js";
import { InteractionLogActions } from "../../../../../redux/interaction-log/index.js";
import type { PrintEngineState } from "../../../../../../a12internal/api/PrintEngineState.js";
import { ValidationSelectors } from "../../../../../redux/validation/selectors.js";
import type { OmitId } from "../../../../../utils/index.js";
import type { ListingColumnChildProps } from "../../base-listing-form.js";
import { ColumnTablePropertyComputation } from "../../shared-components/ColumnTablePropertyComputation.js";

export const GroupComputations = ({ columns, element, columnIndex }: ListingColumnChildProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const groupComputationErrorMap = useSelector(
		(state: PrintEngineState) =>
			ValidationSelectors.listing(state, element.id)?.listing?.columns?.[columnIndex]?.group
	);

	const listing = element.listing;
	const groupData = columns[columnIndex].group;

	const valueComputations = React.useMemo(
		() => groupData?.valueComputationAlternatives?.slice() || [],
		[groupData?.valueComputationAlternatives]
	);

	const propertyComputations = React.useMemo(
		() => groupData?.propertyComputations?.slice() || [],
		[groupData?.propertyComputations]
	);

	const updateCurrentColumnGroup = React.useCallback(
		(newData: OmitId<DeepPartial<ListingColumnGroup>>) => {
			const updatedElement: PartialListing = {
				...element,
				listing: {
					id: nanoid(),
					...listing,
					columns: columns.map((el, idx) =>
						idx === columnIndex ? { ...el, group: { id: nanoid(), ...groupData, ...newData } } : el
					),
				},
			};
			dispatch(
				InteractionLogActions.start({
					description:
						RESOURCE_KEYS.interaction.form.listingFormContainer.form.column.groupComputation
							.changeGroupComputation,
					region: ListingRegion.LISTING_COLUMN_FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[columnIndex, columns, dispatch, element, groupData, listing]
	);

	const onChangeGroupValuesProperties = React.useCallback(
		(newValueComputations: ComputationRepeatRowType[]) => {
			updateCurrentColumnGroup({ valueComputationAlternatives: newValueComputations });
		},
		[updateCurrentColumnGroup]
	);

	const handleDeletePropertyComputation = React.useCallback(
		(localRowIndex: number) => {
			updateCurrentColumnGroup({
				propertyComputations: propertyComputations.filter((_el, idx) => idx !== localRowIndex),
			});
		},
		[updateCurrentColumnGroup, propertyComputations]
	);

	const updatePropertyComputations = React.useCallback(
		(newComputations: DeepPartial<ColumnPropertyComputations>[]) => {
			updateCurrentColumnGroup({ propertyComputations: newComputations });
		},
		[updateCurrentColumnGroup]
	);

	return (
		<CollapsibleSection title={localizer(RESOURCE_KEYS.elementForm.listing.groupComputations.headline)}>
			<p>{localizer(RESOURCE_KEYS.elementForm.listing.groupComputations.description)}</p>
			<FormContainerHeadline label={localizer(RESOURCE_KEYS.elementForm.listing.valueComputations.headline)} />
			<ComputationRepeat
				documentModel={listing?.model}
				setTableData={onChangeGroupValuesProperties}
				tableData={valueComputations}
				computationErrorMap={groupComputationErrorMap?.valueComputationAlternatives}
			/>
			<ColumnTablePropertyComputation
				elementId={element.id}
				fieldKey="group"
				propertyComputations={propertyComputations}
				handleDeleteRow={handleDeletePropertyComputation}
				updatePropertyComputations={updatePropertyComputations}
				propertyComputationErrorMap={groupComputationErrorMap?.propertyComputations}
				formType="Column"
			/>
		</CollapsibleSection>
	);
};

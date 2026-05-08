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
	DefaultTableComponentRenderers,
	Table,
} from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api/table.view.js";
import { BaseColumnType } from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api/column.api.js";
import { TableRenderPropsType } from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api/index.js";
import { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";
import { ListingColumnField, PartialListing } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { ListingRegion } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";

import { useFieldTypesOptions } from "../../hooks/use-fiedtypes-options.js";
import { CollapsibleSection } from "../../shared-components/CollapsibleSection.js";
import { ListingDataActions } from "../../../../../redux/detail-data/listing/index.js";
import { DetailDataActions, TransactionLogStateActions, ValidationCounter } from "../../../../../redux/index.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../../../../localization/index.js";
import { PrintEngineSelectors } from "../../../../../store/selectors.js";
import { AddButtonGroup } from "../../../shared-components/AddButtonGroup.js";
import { ActionColumnButtonGroup } from "../../../shared-components/ActionColumnButtonGroup.js";
import { InteractionLogActions } from "../../../../../redux/interaction-log/index.js";
import { BadgeGroup } from "../../../../badge/BadgeGroup.js";
import { ValidationSelectors } from "../../../../../redux/validation/selectors.js";
import { PrintEngineState } from "../../../../../store/root-reducer.js";
import { ListingColumnChildProps } from "../../base-listing-form.js";

enum FieldComputationKey {
	inputFieldTypeSerialized = "inputFieldTypeSerialized",
	outputFieldTypeSerialized = "outputFieldTypeSerialized",
	action = "action",
}

type FieldComputationsRowType = DeepPartial<ListingColumnField>;

export const TableFieldComputations = ({ columns, element, columnIndex }: ListingColumnChildProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const currentDetailDataId = useSelector(PrintEngineSelectors.currentDetailDataId);
	const errorMap = useSelector(
		(state: PrintEngineState) =>
			ValidationSelectors.listing(state, element.id)?.listing?.columns?.[columnIndex]?.field
	);

	const listing = element.listing;
	const listingColumnField = React.useMemo(() => columns[columnIndex].field?.slice() || [], [columns, columnIndex]);

	const getFieldTypeLabel = useComputationMapping(listing?.model);

	const handleOnClickEdit = React.useCallback(
		(columnIndex: number, fieldCompId: string) => {
			dispatch(
				ListingDataActions.updateAdditionalField({
					containerId: currentDetailDataId,
					fieldCompIndex: columnIndex,
					fieldCompId,
				})
			);
			dispatch(
				DetailDataActions.addView({
					containerId: currentDetailDataId,
					view: ListingRegion.FIELD_COMPUTATION_FORM,
				})
			);
		},
		[dispatch, currentDetailDataId]
	);

	const updateCurrentColumnField = React.useCallback(
		(newData: FieldComputationsRowType[], interactionDescription: string) => {
			const updatedElement: PartialListing = {
				...element,
				listing: {
					id: nanoid(),
					...listing,
					columns: columns.map((el, index) => (index === columnIndex ? { ...el, field: newData } : el)),
				},
			};
			dispatch(
				InteractionLogActions.start({
					description: interactionDescription,
					region: ListingRegion.LISTING_COLUMN_FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[columnIndex, columns, dispatch, element, listing]
	);

	const onClickAddFieldComputation = React.useCallback(() => {
		const fieldCompId = nanoid();

		updateCurrentColumnField(
			[...listingColumnField, { id: fieldCompId }],
			RESOURCE_KEYS.interaction.form.listingFormContainer.form.column.tableFieldComputation.addColumn
		);
		dispatch(
			ListingDataActions.updateAdditionalField({
				containerId: currentDetailDataId,
				fieldCompIndex: listingColumnField.length,
				fieldCompId,
			})
		);
		dispatch(
			DetailDataActions.addView({
				containerId: currentDetailDataId,
				view: ListingRegion.FIELD_COMPUTATION_FORM,
			})
		);
	}, [updateCurrentColumnField, listingColumnField, dispatch, currentDetailDataId]);

	const handleOnClickDelete = React.useCallback(
		(indexToDelete: number) => {
			updateCurrentColumnField(
				listingColumnField.filter((_fieldEl, fieldElIndex) => fieldElIndex !== indexToDelete),
				RESOURCE_KEYS.interaction.form.listingFormContainer.form.column.tableFieldComputation.deleteColumn
			);
		},
		[updateCurrentColumnField, listingColumnField]
	);

	const componentRenderers = React.useMemo(() => {
		const bodyContentRenderer = (props: TableRenderPropsType.BodyContentProps<FieldComputationsRowType>) => {
			switch (props.column.dataKey) {
				case FieldComputationKey.action:
					return (
						<ActionColumnButtonGroup
							onEdit={() => handleOnClickEdit(props.rowIndex, props.row.id)}
							onDelete={() => handleOnClickDelete(props.rowIndex)}
						/>
					);
				case FieldComputationKey.inputFieldTypeSerialized:
					return getFieldTypeLabel(props.row.inputFieldTypeSerialized);
				case FieldComputationKey.outputFieldTypeSerialized:
					return getFieldTypeLabel(props.row.outputFieldTypeSerialized);
				default:
					return DefaultTableComponentRenderers.bodyContentRenderer(props);
			}
		};

		const bodyRowRenderer = (props: TableRenderPropsType.BodyRowProps<FieldComputationsRowType>) => {
			return (
				<React.Fragment key={props.rowIndex}>
					<BadgeGroup validationCounter={ValidationCounter.from(errorMap?.[props.rowIndex])} standalone />
					{DefaultTableComponentRenderers.bodyRowRenderer(props)}
				</React.Fragment>
			);
		};

		return { bodyContentRenderer, bodyRowRenderer };
	}, [errorMap, getFieldTypeLabel, handleOnClickDelete, handleOnClickEdit]);

	return (
		<CollapsibleSection title={localizer(RESOURCE_KEYS.elementForm.listing.fieldComputations.headline)}>
			<div>
				<Table<FieldComputationsRowType>
					data={listingColumnField}
					columns={useColumns()}
					componentRenderers={componentRenderers}
				/>
			</div>
			<AddButtonGroup onClick={onClickAddFieldComputation} />
		</CollapsibleSection>
	);
};

const useComputationMapping = (model?: string) => {
	const fieldTypes = useFieldTypesOptions(model);
	const fieldTypesMapping = fieldTypes.reduce((mapping: Record<string, string>, item) => {
		if (item.value) {
			mapping[item.value] = item.label;
		}
		return mapping;
	}, {});

	return (field?: string) => {
		return field && fieldTypesMapping?.[field] ? fieldTypesMapping[field] : "";
	};
};

function useColumns(): BaseColumnType<FieldComputationsRowType>[] {
	const localizer = PrintLocalizer.useLocalizer();

	return [
		{
			label: localizer(RESOURCE_KEYS.elementForm.listing.fieldComputations.fieldTypeSerialized),
			dataKey: FieldComputationKey.inputFieldTypeSerialized,
		},
		{
			label: localizer(RESOURCE_KEYS.elementForm.listing.fieldComputations.fieldTypeSerializedOutput),
			dataKey: FieldComputationKey.outputFieldTypeSerialized,
		},
		{
			label: "",
			dataKey: FieldComputationKey.action,
			pinning: "right",
			actionColumn: true,
			horizontalAlignment: "center",
		},
	];
}

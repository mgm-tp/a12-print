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

import type { TableRenderPropsType, BaseColumnType } from "@com.mgmtp.a12.widgets/widgets-core";
import { DefaultTableComponentRenderers, Table, ButtonGroup, Button, Icon } from "@com.mgmtp.a12.widgets/widgets-core";
import type { Listing, ListingColumn, PartialListing } from "@com.mgmtp.a12.print/print-model-api/model";
import { MeasureUnit } from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";
import { GlobalRegion, ListingRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { InputSourceGenerator, InputValueSourceResolver } from "@com.mgmtp.a12.print/print-model-api/input-source";

import { FormContainerHeadline } from "../../../shared-components/FormContainerHeadline.js";
import { ReorderButton } from "../../../shared-components/ReorderButton.js";
import { NavigationActions, TransactionLogStateActions, ValidationCounter } from "../../../../../redux/index.js";
import { NavigationSelectors } from "../../../../../redux/navigation/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../../../../localization/index.js";
import { AddButtonGroup } from "../../../shared-components/AddButtonGroup.js";
import { InteractionLogActions } from "../../../../../redux/interaction-log/index.js";
import type { PrintEngineState } from "../../../../../../a12internal/api/PrintEngineState.js";
import { ValidationSelectors } from "../../../../../redux/validation/selectors.js";
import { BadgeGroup } from "../../../../badge/BadgeGroup.js";
import { ErrorWrapper } from "../../../../validation/index.js";
import { CustomCheckbox } from "../../../custom-base-input-components/index.js";
import type { BaseListingFormProps } from "../../base-listing-form.js";
import { stringifyMeasureInputValue } from "../../../../../utils/input-source-utils.js";
import { LISTING_PROPERTY_PATH } from "../../../../../constant/element-property-path.js";

type RowType = DeepPartial<ListingColumn>;

enum ColumnFieldKey {
	label = "label",
	width = "width",
	isSortingIndex = "isSortingIndex",
	action = "action",
}

export const TableColumn = ({ element }: BaseListingFormProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const { tab, entityId, mode } = useSelector(NavigationSelectors.currentCanvasStageContext);
	const errorMap = useSelector(
		(state: PrintEngineState) => ValidationSelectors.listing(state, element.id)?.listing?.columns
	);

	const listing = element.listing;

	const columns = React.useMemo(() => listing?.columns?.slice() || [], [listing?.columns]);
	const isSorted = React.useMemo(() => columns.some(column => Boolean(column.isSortingIndex)), [columns]);

	const columnCreation = React.useCallback(
		(id: string) => {
			const listingsLifetimeInputSources = InputSourceGenerator.generateInputSource<Listing>("listing.columns");
			const generatedColumns = listingsLifetimeInputSources.listing.columns as unknown as ListingColumn;
			const widthInputSource = InputSourceGenerator.upgradeToMeasureInputSource(
				generatedColumns.width,
				MeasureUnit.Percent
			);
			const borderProperties =
				generatedColumns.borderProperties &&
				InputSourceGenerator.upgradeBorderPropertiesWithReference(
					generatedColumns.borderProperties,
					element.id
				);
			const listingColumnInputSources = {
				...listingsLifetimeInputSources,
				listing: {
					columns: {
						...listingsLifetimeInputSources.listing.columns,
						width: widthInputSource,
						borderProperties,
					},
				},
			};
			return {
				id,
				...listingColumnInputSources.listing.columns,
			} as ListingColumn;
		},
		[element.id]
	);

	const setTableData = React.useCallback(
		(newTableData: RowType[], interactionDescription: string) => {
			const updatedElement: PartialListing = {
				...element,
				listing: {
					id: nanoid(),
					...listing,
					columns: newTableData,
				},
			};
			dispatch(
				InteractionLogActions.start({
					description: interactionDescription,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, listing]
	);

	const handleOnClickEdit = React.useCallback(
		(rowIndex: number, columnId: string) => {
			dispatch(
				NavigationActions.pushFormStack({
					tab,
					entityId,
					mode,
					form: { type: ListingRegion.LISTING_COLUMN_FORM, id: element.id, columnId, columnIndex: rowIndex },
				})
			);
		},
		[dispatch, tab, entityId, mode, element.id]
	);

	const onClickAddColumn = React.useCallback(() => {
		const columnId = nanoid();

		setTableData(
			[...columns, columnCreation(columnId)],
			RESOURCE_KEYS.interaction.form.listingFormContainer.form.main.tableColumn.addColumn
		);
		dispatch(
			NavigationActions.pushFormStack({
				tab,
				entityId,
				mode,
				form: {
					type: ListingRegion.LISTING_COLUMN_FORM,
					id: element.id,
					columnId,
					columnIndex: columns.length,
				},
			})
		);
	}, [columns, dispatch, tab, entityId, mode, setTableData, columnCreation, element.id]);

	const handleMoveDown = React.useCallback(
		(rowIndex: number) => {
			setTableData(
				swapColumns(columns, rowIndex, rowIndex + 1),
				RESOURCE_KEYS.interaction.form.listingFormContainer.form.main.tableColumn.moveDown
			);
		},
		[columns, setTableData]
	);

	const handleMoveUp = React.useCallback(
		(rowIndex: number) => {
			setTableData(
				swapColumns(columns, rowIndex, rowIndex - 1),
				RESOURCE_KEYS.interaction.form.listingFormContainer.form.main.tableColumn.moveUp
			);
		},
		[columns, setTableData]
	);

	const handleSortingIndex = React.useCallback(
		(newValue: boolean, rowIndex: number) => {
			const newColumns = [...columns];
			newColumns[rowIndex] = { ...newColumns[rowIndex], isSortingIndex: newValue };

			setTableData(
				newColumns,
				RESOURCE_KEYS.interaction.form.listingFormContainer.form.main.tableColumn.toggleSortingIndex
			);
		},
		[columns, setTableData]
	);

	const onConfirmDialog = React.useCallback(
		(rowIndex: number) => {
			setTableData(
				columns.filter((_el, idx) => idx !== rowIndex),
				RESOURCE_KEYS.interaction.form.listingFormContainer.form.main.tableColumn.deleteColumn
			);
		},
		[columns, setTableData]
	);

	const componentRenderers = React.useMemo(() => {
		const bodyContentRenderer = (props: TableRenderPropsType.BodyContentProps<RowType>) => {
			switch (props.column.dataKey) {
				case ColumnFieldKey.action:
					return (
						<ButtonGroup>
							<ReorderButton
								onDown={() => handleMoveDown(props.rowIndex)}
								upButtonTitle={localizer(RESOURCE_KEYS.button.up)}
								downButtonTitle={localizer(RESOURCE_KEYS.button.down)}
								onUp={() => handleMoveUp(props.rowIndex)}
								upDisabled={props.rowIndex === 0}
								downDisabled={props.rowIndex === columns.length - 1}
							/>
							<Button
								icon={<Icon>edit</Icon>}
								title={localizer(RESOURCE_KEYS.button.edit)}
								onClick={() => handleOnClickEdit(props.rowIndex, props.row.id)}
							/>
							<Button
								destructive
								icon={<Icon>delete</Icon>}
								title={localizer(RESOURCE_KEYS.button.delete)}
								onClick={() => onConfirmDialog(props.rowIndex)}
							/>
						</ButtonGroup>
					);
				case ColumnFieldKey.width: {
					return stringifyMeasureInputValue(
						props.row.width,
						InputValueSourceResolver.getSourceNumberValue(
							props.row.width,
							element,
							LISTING_PROPERTY_PATH.columns.width
						)
					);
				}

				case ColumnFieldKey.label: {
					return InputValueSourceResolver.getSourceStringValue(
						props.row.label,
						element,
						LISTING_PROPERTY_PATH.columns.label
					);
				}
				case ColumnFieldKey.isSortingIndex: {
					const isSortingIndex = Boolean(props.row.isSortingIndex);
					return (
						<CustomCheckbox
							checked={isSortingIndex}
							onChange={newValue => handleSortingIndex(newValue, props.rowIndex)}
							disabled={isSortingIndex ? false : isSorted}
						/>
					);
				}
				default:
					return DefaultTableComponentRenderers.bodyContentRenderer(props);
			}
		};

		const bodyRowRenderer = (props: TableRenderPropsType.BodyRowProps<RowType>) => {
			return (
				<React.Fragment key={props.rowIndex}>
					<BadgeGroup validationCounter={ValidationCounter.from(errorMap?.[props.rowIndex])} standalone />
					{DefaultTableComponentRenderers.bodyRowRenderer(props)}
				</React.Fragment>
			);
		};

		return { bodyContentRenderer, bodyRowRenderer };
	}, [
		columns.length,
		element,
		errorMap,
		handleMoveDown,
		handleMoveUp,
		handleOnClickEdit,
		handleSortingIndex,
		isSorted,
		localizer,
		onConfirmDialog,
	]);

	const getColumnsErrorMessage = useColumnsErrorMessage(element.id);

	return (
		<>
			<FormContainerHeadline label={localizer(RESOURCE_KEYS.elementForm.listing.columns.headline)} />
			<ErrorWrapper errors={getColumnsErrorMessage("label")} />
			<ErrorWrapper errors={getColumnsErrorMessage("isSortingIndex")} />
			<div>
				<Table<RowType> data={columns} columns={useColumns()} componentRenderers={componentRenderers} />
			</div>
			<AddButtonGroup onClick={onClickAddColumn} />
		</>
	);
};

const swapColumns = (columns: RowType[], startIndex: number, endIndex: number) => {
	const cloneColumns = [...columns];
	const startColumn = cloneColumns[startIndex];
	cloneColumns[startIndex] = cloneColumns[endIndex];
	cloneColumns[endIndex] = startColumn;

	return cloneColumns;
};

function useColumns(): BaseColumnType<RowType>[] {
	const localizer = PrintLocalizer.useLocalizer();
	return React.useMemo(
		() => [
			{
				label: localizer(RESOURCE_KEYS.elementForm.listing.columns.label),
				dataKey: ColumnFieldKey.label,
			},
			{
				label: localizer(RESOURCE_KEYS.elementForm.listing.columns.width),
				dataKey: ColumnFieldKey.width,
			},
			{
				label: localizer(RESOURCE_KEYS.elementForm.listing.columns.isSortingIndex),
				dataKey: ColumnFieldKey.isSortingIndex,
			},
			{
				label: "",
				dataKey: ColumnFieldKey.action,
				pinning: "right",
				actionColumn: true,
				horizontalAlignment: "center",
			},
		],
		[localizer]
	);
}

const useColumnsErrorMessage = (id = "") => {
	const errorMap = useSelector((state: PrintEngineState) => ValidationSelectors.listing(state, id));

	// The error message of column count is base on the label of first column.
	return (property: "label" | "isSortingIndex") =>
		errorMap ? errorMap?.listing?.columns?.[0]?.[property]?.[ErrorSeverity.ERROR] : undefined;
};

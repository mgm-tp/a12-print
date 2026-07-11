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

import { TextAffix } from "@com.mgmtp.a12.widgets/widgets-core";
import type {
	ListingColumn,
	PartialListing,
	PartialTextProperties,
	PartialBorderProperties,
	Listing,
	TextProperties,
	BorderProperties,
} from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import { ListingRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";
import type { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";
import { InputSourceGenerator } from "@com.mgmtp.a12.print/print-model-api/input-source";

import { BackButtonGroup } from "../../../shared-components/BackButtonGroup.js";
import { BorderForm } from "../../../shared-components/BorderForm.js";
import { TextPropertiesInput } from "../../../shared-components/TextPropertiesInput.js";
import { CollapsibleSection } from "../../shared-components/CollapsibleSection.js";
import {
	type ListingColumnFormState,
	NavigationActions,
	TransactionLogStateActions,
} from "../../../../../redux/index.js";
import { NavigationSelectors } from "../../../../../redux/navigation/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../../../../localization/index.js";
import { InteractionLogActions } from "../../../../../redux/interaction-log/index.js";
import type { PrintEngineState } from "../../../../../../a12internal/api/PrintEngineState.js";
import { ValidationSelectors } from "../../../../../redux/validation/selectors.js";
import type { ElementWithoutIdAndType } from "../../../type.js";
import { assertExists, type OmitId, getErrors } from "../../../../../utils/index.js";
import { CustomCheckbox, DynamicSourceTextField } from "../../../custom-base-input-components/index.js";
import type { BaseListingFormProps, ListingColumnChildProps } from "../../base-listing-form.js";
import { PositiveNumberInput } from "../../../../custom-input/PositiveNumberInput.js";
import {
	changeMeasureInputValue,
	changePercentInputSource,
	changeInputSource,
	changeInputValue,
	parseNumberInputValue,
	stringifyInputValue,
	createBorderPropertiesInheritedResolver,
} from "../../../../../utils/input-source-utils.js";
import { LISTING_PROPERTY_PATH } from "../../../../../constant/element-property-path.js";

import { GroupComputations } from "./GroupComputations.js";
import { DefaultComputations } from "./DefaultComputations.js";
import { TableFieldComputations } from "./TableFieldComputations.js";

interface ListingColumnFormProps extends BaseListingFormProps {
	formState: ListingColumnFormState;
}

export const ListingColumnForm = ({ element, formState }: ListingColumnFormProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const { tab, entityId, mode } = useSelector(NavigationSelectors.currentCanvasStageContext);

	const columnIndex = formState?.columnIndex;

	const listing = element.listing;
	const columns = React.useMemo(() => listing?.columns?.slice() || [], [listing?.columns]);
	const currentColumn = columnIndex !== undefined ? columns[columnIndex] : undefined;
	const listingColumnErrorMap = useSelector((state: PrintEngineState) => {
		const errorMap = ValidationSelectors.listing(state, element.id);
		return columnIndex !== undefined ? errorMap?.listing?.columns?.[columnIndex] : undefined;
	});

	const getPropertyError = React.useCallback(
		(property: keyof ElementWithoutIdAndType<Omit<ListingColumn, "field">>) => {
			return listingColumnErrorMap
				? errorMessageLocalizer(listingColumnErrorMap?.[property]?.[ErrorSeverity.ERROR])
				: undefined;
		},
		[listingColumnErrorMap, errorMessageLocalizer]
	);

	const updateCurrentColumn = React.useCallback(
		(newData: OmitId<DeepPartial<ListingColumn>>, description: string) => {
			const updatedElement: PartialListing = {
				...element,
				listing: {
					id: nanoid(),
					...listing,
					columns: columns.map((el, idx) => (idx === columnIndex ? { ...el, ...newData } : el)),
				},
			};
			dispatch(
				InteractionLogActions.start({
					description,
					region: ListingRegion.LISTING_COLUMN_FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[columnIndex, columns, dispatch, element, listing]
	);

	const onLabelSourceChange = React.useCallback(
		(source: PossibleInputSource, path: string) => {
			updateCurrentColumn(
				{
					label: changeInputSource(source, path, currentColumn?.label),
				},
				RESOURCE_KEYS.interaction.form.listingFormContainer.form.column.listingColumnForm.changeColumnLabel
					.source
			);
		},
		[currentColumn?.label, updateCurrentColumn]
	);

	const onLabelValueBlur = React.useCallback(
		(event: React.FocusEvent<HTMLInputElement>) => {
			if (!currentColumn?.label) {
				return;
			}

			updateCurrentColumn(
				{
					label: changeInputValue(event.target.value, currentColumn?.label),
				},
				RESOURCE_KEYS.interaction.form.listingFormContainer.form.column.listingColumnForm.changeColumnLabel
					.value
			);
		},
		[currentColumn?.label, updateCurrentColumn]
	);

	const onWidthSourceChange = React.useCallback(
		(source: PossibleInputSource, path: string) => {
			updateCurrentColumn(
				{
					width: changePercentInputSource(source, path, currentColumn?.width),
				},
				RESOURCE_KEYS.interaction.form.listingFormContainer.form.column.listingColumnForm.changeColumnWidth
					.source
			);
		},
		[currentColumn?.width, updateCurrentColumn]
	);

	const onWidthValueChange = React.useCallback(
		(event: React.FocusEvent<HTMLInputElement>) => {
			if (!currentColumn?.width) {
				return;
			}
			updateCurrentColumn(
				{
					width: changeMeasureInputValue(parseNumberInputValue(event.target.value), currentColumn?.width),
				},
				RESOURCE_KEYS.interaction.form.listingFormContainer.form.column.listingColumnForm.changeColumnWidth
					.value
			);
		},
		[currentColumn?.width, updateCurrentColumn]
	);

	const onBack = React.useCallback(() => {
		assertExists(entityId);
		dispatch(NavigationActions.popFormStack({ tab, entityId, mode }));
	}, [dispatch, tab, entityId, mode]);

	if (!currentColumn || columnIndex === undefined) {
		return null;
	}
	const childProps = { element, columnIndex, columns };
	return (
		<>
			<DynamicSourceTextField
				sourceProperties={{
					inputSource: currentColumn.label,
					element,
					property: LISTING_PROPERTY_PATH.columns.label,
					onSourceChange: onLabelSourceChange,
				}}
				label={localizer(RESOURCE_KEYS.elementForm.listing.columns.label)}
				value={currentColumn?.label?.value}
				onBlur={onLabelValueBlur}
				errorMessage={getPropertyError("label")}
			/>
			<PositiveNumberInput
				sourceProperties={{
					inputSource: currentColumn.width,
					element,
					property: LISTING_PROPERTY_PATH.columns.width,
					onSourceChange: onWidthSourceChange,
				}}
				label={localizer(RESOURCE_KEYS.elementForm.listing.columns.width)}
				inputProps={{
					type: "number",
					min: 0,
					max: 100,
				}}
				value={stringifyInputValue(currentColumn?.width?.value)}
				onBlur={onWidthValueChange}
				suffixes={<TextAffix>%</TextAffix>}
				errorMessage={getPropertyError("width")}
			/>
			<CustomCheckbox
				label={localizer(RESOURCE_KEYS.elementForm.listing.columns.isSortingIndexFormLabel)}
				checked={Boolean(currentColumn.isSortingIndex)}
				onChange={newVal =>
					updateCurrentColumn(
						{ isSortingIndex: newVal },
						RESOURCE_KEYS.interaction.form.listingFormContainer.form.column.listingColumnForm
							.toggleSortGroupContent
					)
				}
				fitToParent={false}
				errorMessage={getPropertyError("isSortingIndex")}
			/>
			<CustomCheckbox
				label={localizer(RESOURCE_KEYS.elementForm.listing.columns.hasCustomTextProperties)}
				checked={Boolean(currentColumn.hasCustomTextProperties)}
				onChange={newVal => {
					updateCurrentColumn(
						{
							hasCustomTextProperties: newVal,
							textProperties: InputSourceGenerator.generateInputSource<Listing>(
								"listing.columns.textProperties"
							).listing.columns?.textProperties,
						},
						RESOURCE_KEYS.interaction.form.listingFormContainer.form.column.listingColumnForm
							.toggleColumnTextProperty
					);
				}}
				fitToParent={false}
				errorMessage={getPropertyError("hasCustomTextProperties")}
			/>
			<CustomCheckbox
				label={localizer(RESOURCE_KEYS.elementForm.listing.columns.hasCustomBorderProperties)}
				checked={Boolean(currentColumn.hasCustomBorderProperties)}
				onChange={newVal => {
					const generatedColumns =
						InputSourceGenerator.generateInputSource<Listing>("listing.columns").listing.columns;
					const borderProperties =
						generatedColumns?.borderProperties &&
						InputSourceGenerator.upgradeBorderPropertiesWithReference(
							generatedColumns.borderProperties,
							element.id
						);
					updateCurrentColumn(
						{ hasCustomBorderProperties: newVal, borderProperties },
						RESOURCE_KEYS.interaction.form.listingFormContainer.form.column.listingColumnForm
							.toggleColumnBorderProperty
					);
				}}
				fitToParent={false}
				errorMessage={getPropertyError("hasCustomBorderProperties")}
			/>
			<DefaultComputations {...childProps} />
			<GroupComputations {...childProps} />
			<TableFieldComputations {...childProps} />
			{currentColumn.hasCustomTextProperties && <TextProperties {...childProps} />}
			{currentColumn.hasCustomBorderProperties && <BorderProperties {...childProps} />}
			<BackButtonGroup onBack={onBack} />
		</>
	);
};

const TextProperties = ({ element, columnIndex, columns }: ListingColumnChildProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const errorMap = useSelector(
		(state: PrintEngineState) =>
			ValidationSelectors.listing(state, element.id)?.listing?.columns?.[columnIndex]?.textProperties
	);

	const textProperties = columns[columnIndex].textProperties;

	const handleSetTextProperties = React.useCallback(
		(newProperties: OmitId<PartialTextProperties>) => {
			const updatedElement: PartialListing = {
				...element,
				listing: {
					id: nanoid(),
					...element.listing,
					columns: columns.map((el, idx) =>
						idx === columnIndex
							? {
									...el,
									textProperties: { id: nanoid(), ...el.textProperties, ...newProperties },
								}
							: el
					),
				},
			};
			dispatch(
				InteractionLogActions.start({
					description:
						RESOURCE_KEYS.interaction.form.listingFormContainer.form.column.listingColumnForm
							.changeTextProperties,
					region: ListingRegion.LISTING_COLUMN_FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[element, columns, dispatch, columnIndex]
	);

	const { errors: textPropertiesErrorCounter, warnings: textPropertiesWarningCounter } = getErrors(errorMap);

	return (
		<CollapsibleSection
			title={localizer(RESOURCE_KEYS.elementForm.textProperties.headline)}
			errorCounter={textPropertiesErrorCounter?.length}
			warningCounter={textPropertiesWarningCounter?.length}
		>
			<TextPropertiesInput
				element={element}
				textProperties={textProperties}
				setTextProperties={handleSetTextProperties}
				textPropertyErrors={errorMap}
				propertiesPath={LISTING_PROPERTY_PATH.columns.textProperties}
			/>
		</CollapsibleSection>
	);
};

const BorderProperties = ({ element, columnIndex, columns }: ListingColumnChildProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const errorMap = useSelector(
		(state: PrintEngineState) =>
			ValidationSelectors.listing(state, element.id)?.listing?.columns?.[columnIndex]?.borderProperties
	);
	const getBorderPropertiesErrorMessage = React.useCallback(
		(property: keyof ElementWithoutIdAndType<BorderProperties>) => {
			return errorMap ? errorMessageLocalizer(errorMap?.[property]?.[ErrorSeverity.ERROR]) : undefined;
		},
		[errorMap, errorMessageLocalizer]
	);

	const borderProperties = columns[columnIndex].borderProperties;

	const { inheritedWidthResolver, inheritedStyleResolver, inheritedColorResolver } = React.useMemo(
		() => createBorderPropertiesInheritedResolver(element.borderProperties),
		[element.borderProperties]
	);

	const handleSetBorderProperties = React.useCallback(
		(newProperties: OmitId<PartialBorderProperties>) => {
			const updatedElement: PartialListing = {
				...element,
				listing: {
					id: nanoid(),
					...element.listing,
					columns: columns.map((el, idx) =>
						idx === columnIndex
							? {
									...el,
									borderProperties: {
										id: nanoid(),
										...el.borderProperties,
										...newProperties,
									},
								}
							: el
					),
				},
			};
			dispatch(
				InteractionLogActions.start({
					description:
						RESOURCE_KEYS.interaction.form.listingFormContainer.form.column.listingColumnForm
							.changeBorderProperties,
					region: ListingRegion.LISTING_COLUMN_FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[columns, dispatch, element, columnIndex]
	);
	return (
		<CollapsibleSection title={localizer(RESOURCE_KEYS.elementForm.borderProperties.headline)}>
			<BorderForm
				element={element}
				propertiesPath={LISTING_PROPERTY_PATH.columns.borderProperties}
				borderProperties={borderProperties}
				determineInheritedSource={() => true}
				setBorderProperties={handleSetBorderProperties}
				getErrorMessage={getBorderPropertiesErrorMessage}
				resolveWidth={inheritedWidthResolver}
				resolveStyle={inheritedStyleResolver}
				resolveColor={inheritedColorResolver}
			/>
		</CollapsibleSection>
	);
};

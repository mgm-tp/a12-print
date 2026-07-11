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

import { GlobalRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type {
	ListingProperties,
	PartialListing,
	PartialTextProperties,
	RowPropertyComputations,
	GroupPropertyComputations,
	PartialBorderProperties,
} from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";

import {
	AllowedElementType,
	DataContextSelection,
	MAX_REPEAT_LEVEL,
} from "../../../shared-components/DataContextSelection.js";
import { BorderPropertiesForm } from "../../../shared-components/BorderPropertiesForm.js";
import { TextPropertiesForm } from "../../../shared-components/TextPropertiesForm.js";
import { CollapsibleSection } from "../../shared-components/CollapsibleSection.js";
import { TransactionLogStateActions } from "../../../../../redux/index.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../../../../localization/index.js";
import { InteractionLogActions } from "../../../../../redux/interaction-log/index.js";
import { DocumentModelSelect } from "../../../shared-components/DocumentModelSelect.js";
import type { OmitId } from "../../../../../utils/index.js";
import { getErrors, useBorderPropertiesErrorMessage } from "../../../../../utils/index.js";
import type { PrintEngineState } from "../../../../../../a12internal/api/PrintEngineState.js";
import { ValidationSelectors } from "../../../../../redux/validation/selectors.js";
import { CustomTextField } from "../../../custom-base-input-components/index.js";
import { PrintEngineSelectors } from "../../../../../store/selectors.js";
import { ElementMapUtils } from "../../../../../utils/element-map-utils.js";
import type { BaseListingFormProps } from "../../base-listing-form.js";
import { RowTablePropertyComputation } from "../../shared-components/RowTablePropertyComputation.js";
import { BORDER_PROPERTIES_PATH } from "../../../../../constant/element-property-path.js";
import { DocumentModelDataSelectors } from "../../../../../redux/document-model-data/selectors.js";

import { GroupTablePropertyComputation } from "./GroupTablePropertyComputation.js";
import { TableColumn } from "./TableColumn.js";
import { HeaderProperties } from "./HeaderProperties.js";

export const MainForm = ({ element }: BaseListingFormProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const basePath = useSelector(PrintEngineSelectors.repeatableBasePath);

	const listing = element.listing;
	const model = element.listing?.model;

	const elementMap = useSelector(
		(state: PrintEngineState) => DocumentModelDataSelectors.documentModelData(state, model)?.elementMap
	);

	const listingErrorMap = useSelector(
		(state: PrintEngineState) => ValidationSelectors.listing(state, element.id)?.listing
	);
	const textPropertiesErrors = useSelector(
		(state: PrintEngineState) => ValidationSelectors.styleableElement(state, element.id)?.textProperties
	);

	const getPropertyErrorMessage = (
		property: keyof Omit<
			ListingProperties,
			"rowPropertyComputations" | "groupPropertyComputations" | "columns" | "headerTextProperties"
		>
	) => (listingErrorMap ? errorMessageLocalizer(listingErrorMap?.[property]?.[ErrorSeverity.ERROR]) : undefined);

	const rowPropertyComputations = React.useMemo(
		() => listing?.rowPropertyComputations?.slice() || [],
		[listing?.rowPropertyComputations]
	);

	const groupPropertyComputations = React.useMemo(
		() => listing?.groupPropertyComputations?.slice() || [],
		[listing?.groupPropertyComputations]
	);

	const updateListing = React.useCallback(
		(newData: OmitId<DeepPartial<ListingProperties>>, description: string) => {
			const updatedElement: PartialListing = {
				...element,
				listing: {
					id: nanoid(),
					...listing,
					...newData,
				},
			};
			dispatch(
				InteractionLogActions.start({
					description,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, listing]
	);

	const setSelectedPath = React.useCallback(
		(path: string) => {
			updateListing(
				{ basePath: path },
				RESOURCE_KEYS.interaction.form.listingFormContainer.form.main.mainForm.changeBasePath
			);
		},
		[updateListing]
	);

	const handleDeleteRowPropertyComputation = React.useCallback(
		(rowIndex: number) => {
			updateListing(
				{ rowPropertyComputations: rowPropertyComputations.filter((_el, index) => index !== rowIndex) },
				RESOURCE_KEYS.interaction.form.listingFormContainer.form.main.mainForm.deletePropertyComputation
			);
		},
		[rowPropertyComputations, updateListing]
	);

	const handleDeleteGroupPropertyComputation = React.useCallback(
		(rowIndex: number) => {
			updateListing(
				{ groupPropertyComputations: groupPropertyComputations.filter((_el, index) => index !== rowIndex) },
				RESOURCE_KEYS.interaction.form.listingFormContainer.form.main.mainForm.deletePropertyComputation
			);
		},
		[groupPropertyComputations, updateListing]
	);

	const setBorderProperties = React.useCallback(
		(newProps: OmitId<PartialBorderProperties>) => {
			const updatedElement: PartialListing = {
				...element,
				borderProperties: {
					id: nanoid(),
					...element.borderProperties,
					...newProps,
				},
			};
			dispatch(
				InteractionLogActions.start({
					description:
						RESOURCE_KEYS.interaction.form.listingFormContainer.form.main.mainForm.changeBorderProperties,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element]
	);

	const setTextProperties = React.useCallback(
		(newProps: OmitId<PartialTextProperties>) => {
			const updatedElement: PartialListing = {
				...element,
				textProperties: {
					id: nanoid(),
					...element.textProperties,
					...newProps,
				},
			};
			dispatch(
				InteractionLogActions.start({
					description:
						RESOURCE_KEYS.interaction.form.listingFormContainer.form.main.mainForm.changeTextProperties,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element]
	);

	const onChangeDocumentModel = React.useCallback(
		(documentModel?: string) => {
			updateListing(
				{ model: documentModel, basePath: "", columns: [] },
				RESOURCE_KEYS.interaction.form.listingFormContainer.form.main.mainForm.changeDocumentModel
			);
		},
		[updateListing]
	);

	const updatePropertyComputations = React.useCallback(
		(newComputations: DeepPartial<RowPropertyComputations>[]) => {
			updateListing(
				{ rowPropertyComputations: newComputations },
				RESOURCE_KEYS.interaction.form.listingFormContainer.form.main.mainForm.updatePropertyComputation
			);
		},
		[updateListing]
	);

	const updateGroupPropertyComputations = React.useCallback(
		(newComputations: DeepPartial<GroupPropertyComputations>[]) => {
			updateListing(
				{ groupPropertyComputations: newComputations },
				RESOURCE_KEYS.interaction.form.listingFormContainer.form.main.mainForm.updatePropertyComputation
			);
		},
		[updateListing]
	);

	const processedElementMap = React.useMemo(() => {
		return ElementMapUtils.setInstance(Object.values(elementMap || {}), basePath);
	}, [basePath, elementMap]);

	const { errors: textPropertiesErrorCounter, warnings: textPropertiesWarningCounter } =
		getErrors(textPropertiesErrors);

	return (
		<>
			<DocumentModelSelect
				value={model}
				onValueChanged={onChangeDocumentModel}
				errorMessage={getPropertyErrorMessage("model")}
			/>
			<CustomTextField
				readonly
				label={localizer(RESOURCE_KEYS.elementForm.model.group)}
				value={listing?.basePath}
				errorMessage={getPropertyErrorMessage("basePath")}
			/>
			<DataContextSelection
				type={AllowedElementType.anyGroup}
				elementMapEntries={processedElementMap}
				selectedPath={listing?.basePath}
				setSelectedPath={setSelectedPath}
				maxRepeatLevel={MAX_REPEAT_LEVEL}
			/>
			<TableColumn element={element} />
			<RowTablePropertyComputation
				elementId={element.id}
				propertyComputations={rowPropertyComputations}
				handleDeleteRow={handleDeleteRowPropertyComputation}
				updatePropertyComputations={updatePropertyComputations}
				propertyComputationErrorMap={listingErrorMap?.rowPropertyComputations}
				formType="Main"
			/>
			<GroupTablePropertyComputation
				elementId={element.id}
				propertyComputations={groupPropertyComputations}
				handleDeleteRow={handleDeleteGroupPropertyComputation}
				updatePropertyComputations={updateGroupPropertyComputations}
				propertyComputationErrorMap={listingErrorMap?.groupPropertyComputations}
			/>
			<HeaderProperties element={element} />
			<CollapsibleSection
				title={localizer(RESOURCE_KEYS.elementForm.textProperties.headline)}
				errorCounter={textPropertiesErrorCounter?.length}
				warningCounter={textPropertiesWarningCounter?.length}
			>
				<TextPropertiesForm
					hideLabel
					element={element}
					textProperties={element.textProperties}
					setTextProperties={setTextProperties}
					textPropertyErrors={textPropertiesErrors}
				/>
			</CollapsibleSection>
			<CollapsibleSection title={localizer(RESOURCE_KEYS.elementForm.borderProperties.headline)}>
				<BorderPropertiesForm
					element={element}
					propertiesPath={BORDER_PROPERTIES_PATH}
					determineInheritedSource={() => false}
					hideLabel
					borderProperties={element.borderProperties}
					setBorderProperties={setBorderProperties}
					getErrorMessage={useBorderPropertiesErrorMessage(element.id)}
				/>
			</CollapsibleSection>
		</>
	);
};

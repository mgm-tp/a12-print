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
import type { ListingProperties, PartialTextProperties } from "@com.mgmtp.a12.print/print-model-api/model";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";

import { CollapsibleSection } from "../../shared-components/CollapsibleSection.js";
import { TransactionLogStateActions } from "../../../../../redux/index.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../../../../localization/index.js";
import { InteractionLogActions } from "../../../../../redux/interaction-log/index.js";
import type { PrintEngineState } from "../../../../../../a12internal/api/PrintEngineState.js";
import { ValidationSelectors } from "../../../../../redux/validation/selectors.js";
import type { OmitId } from "../../../../../utils/index.js";
import { getErrors } from "../../../../../utils/index.js";
import { CustomCheckbox } from "../../../custom-base-input-components/index.js";
import type { BaseListingFormProps } from "../../base-listing-form.js";
import { TextPropertiesInput } from "../../../shared-components/TextPropertiesInput.js";
import { LISTING_PROPERTY_PATH } from "../../../../../constant/element-property-path.js";

export const HeaderProperties = ({ element }: BaseListingFormProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const errorMap = useSelector(
		(state: PrintEngineState) => ValidationSelectors.listing(state, element.id)?.listing?.headerTextProperties
	);

	const listing = element.listing;
	const headerProperties = listing?.headerTextProperties;

	const onCheckHideHeader = React.useCallback(
		(value: boolean) => {
			const updatedElement = { ...element, listing: { id: nanoid(), ...listing, hideHeader: value } };
			dispatch(
				InteractionLogActions.start({
					description:
						RESOURCE_KEYS.interaction.form.listingFormContainer.form.main.headerProperties
							.toggleHideHeaderRow,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, listing]
	);

	const onChangeHeaderProperties = React.useCallback(
		(newProps: OmitId<PartialTextProperties>) => {
			const updatedElement = {
				...element,
				listing: {
					id: nanoid(),
					...listing,
					headerTextProperties: { id: nanoid(), ...headerProperties, ...newProps },
				},
			};
			dispatch(
				InteractionLogActions.start({
					description:
						RESOURCE_KEYS.interaction.form.listingFormContainer.form.main.headerProperties
							.changeHeaderProperties,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, headerProperties, listing]
	);

	const { errors: headerPropertiesErrorCounter, warnings: headerPropertiesWarningCounter } = getErrors(errorMap);

	return (
		<CollapsibleSection
			title={localizer(RESOURCE_KEYS.elementForm.listing.headerProperties.headline)}
			errorCounter={headerPropertiesErrorCounter?.length}
			warningCounter={headerPropertiesWarningCounter?.length}
		>
			<CustomCheckbox
				label={localizer(RESOURCE_KEYS.elementForm.listing.headerProperties.hideHeader)}
				checked={Boolean(element.listing?.hideHeader)}
				onChange={onCheckHideHeader}
				errorMessage={useListingPropertyErrorMessage(element.id)("hideHeader")}
			/>
			<TextPropertiesInput
				element={element}
				textProperties={headerProperties}
				setTextProperties={onChangeHeaderProperties}
				textPropertyErrors={errorMap}
				propertiesPath={LISTING_PROPERTY_PATH.headerTextProperties}
			/>
		</CollapsibleSection>
	);
};

function useListingPropertyErrorMessage(id = "") {
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const errorMap = useSelector((state: PrintEngineState) => ValidationSelectors.listing(state, id));

	return (
		property: keyof Omit<
			ListingProperties,
			"rowPropertyComputations" | "groupPropertyComputations" | "columns" | "headerTextProperties"
		>
	) => (errorMap ? errorMessageLocalizer(errorMap.listing?.[property]?.[ErrorSeverity.ERROR]) : undefined);
}

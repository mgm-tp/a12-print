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

import {
	ListingRegion,
	GlobalRegion,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";

import { RESOURCE_KEYS } from "../../../../localization/index.js";

import { MainFormContainer } from "../forms/main-form/index.js";
import { ListingColumnFormContainer } from "../forms/column-form/index.js";
import { FieldComputationFormContainer } from "../forms/field-computation-form/index.js";
import { BaseListingFormProps } from "../base-listing-form.js";

export namespace ListingViews {
	export type ViewKeys =
		| typeof GlobalRegion.FORM
		| typeof ListingRegion.LISTING_COLUMN_FORM
		| typeof ListingRegion.FIELD_COMPUTATION_FORM
		| typeof ListingRegion.GROUP_PROPERTY_COMPUTATION_FORM;

	export const viewMapping: Record<ViewKeys, React.ComponentType<BaseListingFormProps>> = {
		[GlobalRegion.FORM]: MainFormContainer,
		[ListingRegion.LISTING_COLUMN_FORM]: ListingColumnFormContainer,
		[ListingRegion.FIELD_COMPUTATION_FORM]: FieldComputationFormContainer,
		[ListingRegion.GROUP_PROPERTY_COMPUTATION_FORM]: FieldComputationFormContainer,
	};
	export const titleMapping: Record<
		typeof ListingRegion.LISTING_COLUMN_FORM | typeof ListingRegion.FIELD_COMPUTATION_FORM,
		string
	> = {
		[ListingRegion.LISTING_COLUMN_FORM]: RESOURCE_KEYS.elementForm.listing.columns.title,
		[ListingRegion.FIELD_COMPUTATION_FORM]: RESOURCE_KEYS.elementForm.listing.fieldComputations.title,
	};
}

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
import { useSelector } from "react-redux";

import { PartialListing } from "@com.mgmtp.a12.print/print-model-api/model";

import { PrintEngineSelectors } from "../../../store/selectors.js";
import {
	isElementFormState,
	isListingColumnFormState,
	isListingFieldCompFormState,
	isListingGroupPropertyCompFormState,
	isListingPropertyCompFormState,
	NavigationSelectors,
} from "../../../redux/index.js";

import { FieldPropertyComputationForm } from "./forms/field-computation-form/FieldPropertyComputationForm.js";
import { FieldComputationForm } from "./forms/field-computation-form/FieldComputationForm.js";
import { MainForm } from "./forms/main-form/MainForm.js";
import { MainPropertyComputationForm } from "./forms/main-form/MainPropertyComputationForm.js";
import { GroupPropertyComputationForm } from "./forms/main-form/GroupPropertyComputationForm.js";
import { ColumnPropertyComputationForm } from "./forms/column-form/ColumnPropertyComputationForm.js";
import { ListingColumnForm } from "./forms/column-form/ListingColumnForm.js";

export const ListingFormContainer = () => {
	const currentForm = useSelector(NavigationSelectors.currentForm);
	const element = useSelector(PrintEngineSelectors.rootFormElement);

	if (!element || !PartialListing.isInstance(element)) {
		throw Error("Expected element of type Listing");
	}

	if (!currentForm) {
		return <Placeholder />;
	}

	if (isElementFormState(currentForm)) {
		return <MainForm element={element} />;
	}

	if (isListingColumnFormState(currentForm)) {
		return <ListingColumnForm element={element} formState={currentForm} />;
	}

	if (isListingGroupPropertyCompFormState(currentForm)) {
		return <GroupPropertyComputationForm element={element} formState={currentForm} />;
	}

	if (isListingPropertyCompFormState(currentForm)) {
		if (currentForm.parentForm === "Main") {
			return <MainPropertyComputationForm element={element} formState={currentForm} />;
		}

		if (currentForm.parentForm === "Column") {
			return <ColumnPropertyComputationForm element={element} formState={currentForm} />;
		}

		if (currentForm.parentForm === "Field") {
			return <FieldPropertyComputationForm element={element} formState={currentForm} />;
		}
	}

	if (isListingFieldCompFormState(currentForm)) {
		return <FieldComputationForm element={element} formState={currentForm} />;
	}

	return <Placeholder />;
};

const Placeholder = () => {
	return <div>Listing form can be found</div>;
};

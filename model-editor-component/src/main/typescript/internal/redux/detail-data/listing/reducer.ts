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
import { Action } from "redux";

import { AdditionalListing, DetailDataState } from "../state.js";

import { ListingDataActions } from "./actions.js";

export const ListingDataReducer = (state: DetailDataState = {}, action: Action): DetailDataState => {
	if (ListingDataActions.updateAdditionalColumn.match(action)) {
		const { containerId, ...rest } = action.payload;
		return {
			...state,
			[containerId]: {
				...state[containerId],
				additionalData: {
					...state[containerId].additionalData,
					listing: {
						...state[containerId].additionalData?.listing,
						...rest,
					},
				},
			},
		};
	}

	if (ListingDataActions.updateAdditionalProperty.match(action)) {
		const { containerId, ...rest } = action.payload;
		return {
			...state,
			[containerId]: {
				...state[containerId],
				additionalData: {
					...state[containerId].additionalData,
					listing: {
						...state[containerId].additionalData?.listing,
						...rest,
					},
				},
			},
		};
	}

	if (ListingDataActions.updateAdditionalField.match(action)) {
		const { containerId, ...rest } = action.payload;
		return {
			...state,
			[containerId]: {
				...state[containerId],
				additionalData: {
					...state[containerId].additionalData,
					listing: {
						...state[containerId].additionalData?.listing,
						...rest,
					},
				},
			},
		};
	}

	if (ListingDataActions.deleteAdditionalKey.match(action)) {
		const { containerId, category } = action.payload;
		const newData: AdditionalListing =
			category === "column"
				? { columnIndex: undefined, columnId: undefined }
				: category === "fieldComp"
					? { fieldCompIndex: undefined, fieldCompId: undefined }
					: { propertyCompIndex: undefined, propertyCompType: undefined, propertyCompId: undefined };
		return {
			...state,
			[containerId]: {
				...state[containerId],
				additionalData: {
					...state[containerId].additionalData,
					listing: {
						...state[containerId].additionalData?.listing,
						...newData,
					},
				},
			},
		};
	}
	return state;
};

export const isListingAction = (state: DetailDataState, action: Action): boolean => {
	const listingActions = [
		ListingDataActions.updateAdditionalField,
		ListingDataActions.updateAdditionalProperty,
		ListingDataActions.updateAdditionalColumn,
		ListingDataActions.deleteAdditionalKey,
	];

	for (const listingAction of listingActions) {
		if (listingAction.match(action)) {
			return Boolean(action.payload.containerId);
		}
	}

	return false;
};

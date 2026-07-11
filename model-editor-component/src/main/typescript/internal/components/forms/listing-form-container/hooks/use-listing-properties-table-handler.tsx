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

import type { PropertyComputations } from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import { ListingRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { NavigationActions, type PropertyComputationField } from "../../../../redux/index.js";
import { NavigationSelectors } from "../../../../redux/navigation/selectors.js";

export interface PropertyItem {
	label: string;
	value: string;
}

export interface ListingPropertiesTableHandler<RowType extends PropertyComputations> {
	openPropertyComputationForm: (index: number, propertyCompId: string) => void;
	labeledPropertyComputations: DeepPartial<RowType>[];
}

export function useListingPropertiesTableHandler<RowType extends PropertyComputations>(
	elementId: string,
	propertyComputations: DeepPartial<RowType>[],
	propertyItems: PropertyItem[],
	viewRegion: typeof ListingRegion.PROPERTY_COMPUTATION_FORM | typeof ListingRegion.GROUP_PROPERTY_COMPUTATION_FORM,
	formType: "Main" | "Column" | "Field",
	propertyCompType?: PropertyComputationField
): ListingPropertiesTableHandler<RowType> {
	const dispatch = useDispatch();
	const { tab, entityId, mode } = useSelector(NavigationSelectors.currentCanvasStageContext);

	const openPropertyComputationForm = React.useCallback(
		(index: number, propertyCompId: string) => {
			if (viewRegion === ListingRegion.GROUP_PROPERTY_COMPUTATION_FORM) {
				dispatch(
					NavigationActions.pushFormStack({
						tab,
						entityId,
						mode,
						form: {
							type: ListingRegion.GROUP_PROPERTY_COMPUTATION_FORM,
							id: elementId,
							propertyCompId,
							propertyCompIndex: index,
						},
					})
				);
			} else {
				dispatch(
					NavigationActions.pushFormStack({
						tab,
						entityId,
						mode,
						form: {
							type: ListingRegion.PROPERTY_COMPUTATION_FORM,
							id: elementId,
							propertyCompId,
							propertyCompIndex: index,
							propertyCompType,
							parentForm: formType,
						},
					})
				);
			}
		},
		[viewRegion, dispatch, tab, entityId, mode, elementId, propertyCompType, formType]
	);

	const labeledPropertyComputations = React.useMemo(
		() =>
			propertyComputations.map(pc => {
				const propertyItem = propertyItems.find(item => item.value === pc.property);
				return { ...pc, property: propertyItem?.label } as DeepPartial<RowType>;
			}),
		[propertyComputations, propertyItems]
	);

	return React.useMemo(() => {
		return { openPropertyComputationForm, labeledPropertyComputations };
	}, [openPropertyComputationForm, labeledPropertyComputations]);
}

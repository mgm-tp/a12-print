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

import { SelectItem } from "@com.mgmtp.a12.widgets/widgets-core/lib/input/select/index.js";
import { ComputationAlternative } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";

import { ComputationRepeat, ComputationRepeatRowType } from "../../shared-components/ComputationRepeat.js";
import { PrintEngineSelectors } from "../../../../store/selectors.js";
import { ListingDataActions } from "../../../../redux/detail-data/listing/index.js";
import { BackButtonGroup } from "../../shared-components/BackButtonGroup.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../../../localization/index.js";
import { DetailDataActions } from "../../../../redux/index.js";
import { CustomSelect } from "../../custom-base-input-components/index.js";

interface PropertyComputationFormProps {
	model?: string;
	propertyItems: SelectItem[];
	onChangePropertyComputations: (newComputations: ComputationRepeatRowType[]) => void;
	onPropertyChange: (newValue: string) => void;
	property: string;
	computationAlternatives: ComputationRepeatRowType[];
	propertyErrorMessage?: React.ReactNode;
	computationErrorMap?: DeepPartialErrorMap<ComputationAlternative>[];
}

export const PropertyComputationForm = ({
	model,
	propertyItems,
	onChangePropertyComputations,
	onPropertyChange,
	property,
	computationAlternatives,
	propertyErrorMessage,
	computationErrorMap,
}: PropertyComputationFormProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const currentDetailDataId = useSelector(PrintEngineSelectors.currentDetailDataId);

	const onBack = React.useCallback(() => {
		dispatch(DetailDataActions.removeSubView({ containerId: currentDetailDataId }));
		dispatch(
			ListingDataActions.deleteAdditionalKey({ containerId: currentDetailDataId, category: "propertyComp" })
		);
	}, [dispatch, currentDetailDataId]);

	return (
		<>
			<CustomSelect
				label={localizer(RESOURCE_KEYS.elementForm.listing.propertyComputations.property)}
				items={propertyItems}
				value={property}
				onValueChanged={onPropertyChange}
				fitToParent={false}
				errorMessage={propertyErrorMessage}
			/>
			<ComputationRepeat
				documentModel={model}
				setTableData={onChangePropertyComputations}
				tableData={computationAlternatives}
				computationErrorMap={computationErrorMap}
			/>
			<BackButtonGroup onBack={onBack} />
		</>
	);
};

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

import type {
	GroupPropertyComputations,
	GroupPropertyKeyType,
	PartialListing,
	PrintModelEntity,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";
import { ListingRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { CustomSelect, MessageBox } from "@com.mgmtp.a12.widgets/widgets-core";
import type { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/utils";

import {
	type ListingGroupPropertyCompFormState,
	NavigationActions,
	NavigationSelectors,
	TransactionLogStateActions,
} from "../../../../../redux/index.js";
import type { ComputationRepeatRowType } from "../../../shared-components/ComputationRepeat.js";
import { ComputationRepeat } from "../../../shared-components/ComputationRepeat.js";
import { useGroupPropertyItems } from "../../constants/properties.js";
import { InteractionLogActions } from "../../../../../redux/interaction-log/index.js";
import type { PrintEngineState } from "../../../../../../a12internal/api/PrintEngineState.js";
import { ValidationSelectors } from "../../../../../redux/validation/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../../../../localization/index.js";
import type { BaseListingFormProps } from "../../base-listing-form.js";
import { BackButtonGroup } from "../../../shared-components/BackButtonGroup.js";
import {
	AllowedElementType,
	DataContextSelection,
	MAX_REPEAT_LEVEL,
} from "../../../shared-components/DataContextSelection.js";
import { ElementMapUtils } from "../../../../../utils/element-map-utils.js";
import { CustomTextField } from "../../../custom-base-input-components/CustomTextField.js";
import { StyledMessageBox } from "../../../shared-components/DataContextSelection.styled.js";
import { DocumentModelDataSelectors } from "../../../../../redux/document-model-data/selectors.js";

interface GroupPropertyComputationFormProps extends BaseListingFormProps {
	formState: ListingGroupPropertyCompFormState;
}

export const GroupPropertyComputationForm = ({ element, formState }: GroupPropertyComputationFormProps) => {
	const dispatch = useDispatch();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const localizer = PrintLocalizer.useLocalizer();
	const { tab, entityId, mode } = useSelector(NavigationSelectors.currentCanvasStageContext);
	const elementMap = useSelector(
		(state: PrintEngineState) =>
			DocumentModelDataSelectors.documentModelData(state, element.listing?.model)?.elementMap
	);

	const propertyCompIndex = formState?.propertyCompIndex;

	const groupPropertyComputationErrorMap = useSelector((state: PrintEngineState) => {
		const errorMap = ValidationSelectors.listing(state, element.id);
		return propertyCompIndex !== undefined
			? errorMap?.listing?.groupPropertyComputations?.[propertyCompIndex]
			: undefined;
	});

	const listing = element.listing;
	const groupPropertyComputations = React.useMemo(
		() => listing?.groupPropertyComputations || [],
		[listing?.groupPropertyComputations]
	);
	const currentPropertyComputation =
		propertyCompIndex !== undefined ? groupPropertyComputations[propertyCompIndex] : undefined;
	const computationAlternatives = currentPropertyComputation?.computationAlternatives?.slice() || [];

	const propertyErrorMessage = groupPropertyComputationErrorMap
		? errorMessageLocalizer(groupPropertyComputationErrorMap?.property?.[ErrorSeverity.ERROR])
		: undefined;

	const groupErrorMessage = groupPropertyComputationErrorMap
		? errorMessageLocalizer(groupPropertyComputationErrorMap?.groupPath?.[ErrorSeverity.ERROR])
		: undefined;

	const listingBasePath = listing?.basePath;
	const processedElementMap = React.useMemo(() => {
		if (!listingBasePath) {
			return [];
		}

		return ElementMapUtils.createEntriesFromDataContext(Object.values(elementMap || {}), [
			{ group: listingBasePath },
		]);
	}, [elementMap, listingBasePath]);

	const updateGroupPropertyComputations = React.useCallback(
		(computation: DeepPartialRecursive<GroupPropertyComputations> & PrintModelEntity) => {
			const updatedElement: PartialListing = {
				...element,
				listing: {
					id: nanoid(),
					...listing,
					groupPropertyComputations: groupPropertyComputations.map((el, index) =>
						index === propertyCompIndex ? computation : el
					),
				},
			};
			dispatch(
				InteractionLogActions.start({
					description:
						RESOURCE_KEYS.interaction.form.listingFormContainer.form.main.mainPropertyComputationForm
							.changePropertyComputation,
					region: ListingRegion.GROUP_PROPERTY_COMPUTATION_FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, groupPropertyComputations, listing, propertyCompIndex]
	);

	const changePropertyComputation = React.useCallback(
		(property: GroupPropertyKeyType) => {
			updateGroupPropertyComputations({
				...currentPropertyComputation,
				id: currentPropertyComputation?.id ?? nanoid(),
				property,
			});
		},
		[updateGroupPropertyComputations, currentPropertyComputation]
	);

	const onChangeGroupComputation = React.useCallback(
		(groupPath: string) => {
			updateGroupPropertyComputations({
				...currentPropertyComputation,
				id: currentPropertyComputation?.id ?? nanoid(),
				groupPath,
			});
		},
		[updateGroupPropertyComputations, currentPropertyComputation]
	);

	const onChangeGroupPropertyComputations = React.useCallback(
		(computationAlternatives: ComputationRepeatRowType[]) => {
			updateGroupPropertyComputations({
				...currentPropertyComputation,
				id: currentPropertyComputation?.id ?? nanoid(),
				computationAlternatives,
			});
		},
		[updateGroupPropertyComputations, currentPropertyComputation]
	);

	const onBack = React.useCallback(() => {
		dispatch(NavigationActions.popFormStack({ tab, entityId, mode }));
	}, [dispatch, tab, entityId, mode]);

	return (
		<>
			<CustomSelect
				label={localizer(RESOURCE_KEYS.elementForm.listing.propertyComputations.property)}
				items={useGroupPropertyItems()}
				value={currentPropertyComputation?.property || ""}
				onValueChanged={changePropertyComputation}
				fitToParent={false}
				errorMessage={propertyErrorMessage}
			/>
			<CustomTextField
				label={localizer(RESOURCE_KEYS.elementForm.model.group)}
				value={currentPropertyComputation?.groupPath}
				readonly
				errorMessage={groupErrorMessage}
			/>
			{listing?.basePath ? (
				<DataContextSelection
					type={AllowedElementType.anyGroup}
					elementMapEntries={processedElementMap}
					selectedPath={currentPropertyComputation?.groupPath}
					setSelectedPath={onChangeGroupComputation}
					maxRepeatLevel={MAX_REPEAT_LEVEL}
				/>
			) : (
				<StyledMessageBox
					label={localizer(
						RESOURCE_KEYS.elementForm.listing.groupPropertyComputation.basePathRequiredMessage
					)}
					variant="info"
					focusOnMessage={false}
				/>
			)}
			<MessageBox
				label={localizer(RESOURCE_KEYS.elementForm.listing.groupPropertyComputation.preconditionHint)}
				variant="warning"
				focusOnMessage={false}
			/>
			<ComputationRepeat
				documentModel={listing?.model}
				setTableData={onChangeGroupPropertyComputations}
				tableData={computationAlternatives}
				computationErrorMap={groupPropertyComputationErrorMap?.computationAlternatives}
			/>
			<BackButtonGroup onBack={onBack} />
		</>
	);
};

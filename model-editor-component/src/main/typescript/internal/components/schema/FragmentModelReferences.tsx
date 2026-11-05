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

import type { SelectItem } from "@com.mgmtp.a12.widgets/widgets-core";
import { Button, Icon, Select, addPrefix, InputElements } from "@com.mgmtp.a12.widgets/widgets-core";
import { EntityKey, getEntityId, type ModelReferenceEntity } from "@com.mgmtp.a12.print/print-model-api/model";
import {
	FRAGMENT_SUB_TYPE,
	FRAGMENT_MODEL_REFERENCE_PURPOSE,
	MODEL_SUB_TYPE_ANNOTATION_NAME,
} from "@com.mgmtp.a12.print/print-model-api/model";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { RequestApiSelectors } from "../../redux/request-api/selectors.js";
import { SchemaActions } from "../../redux/schema/action.js";
import { ValidationSelectors } from "../../redux/validation/selectors.js";

import { StyledSchemaToolbar } from "./DocumentModelReferencesToolbar.styled.js";
import { ModelReferenceCard } from "./ModelReferenceCard.js";
import { ModelReferencesPanel } from "./ModelReferencesPanel.js";

export const FragmentModelReferences = () => {
	const localizer = PrintLocalizer.useLocalizer();
	const fragmentModelReferences = useSelector(PrintEngineSelectors.fragmentModelReferences);
	const validationCounter = useSelector(ValidationSelectors.fragmentModelReferencesValidationCounter);
	const printModelReferences = useSelector(PrintEngineSelectors.printModelReferences);

	// A Print Model may reference either Fragments or a DIN Template, never both at the same time.
	const disabled = printModelReferences.length > 0;

	return (
		<ModelReferencesPanel
			section="fragment"
			title={localizer(RESOURCE_KEYS.sidebar.schema.tab.fragmentModelReferenced)}
			validationCounter={validationCounter}
		>
			{disabled && (
				<InputElements.Info
					dataRole="fragment-model-references-disabled-info"
					infoMessage={localizer(RESOURCE_KEYS.sidebar.schema.info.fragmentModelReferenceDisabled)}
				/>
			)}
			<FragmentModelReferencesToolbar disabled={disabled} />
			{fragmentModelReferences.map(modelReference => (
				<ModelReferenceCard
					key={modelReference.reference}
					modelReference={modelReference}
					dataTestId="fragment-model-reference-card"
				/>
			))}
		</ModelReferencesPanel>
	);
};

const FragmentModelReferencesToolbar = ({ disabled }: { disabled: boolean }) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const [selectedFragmentModel, setSelectedFragmentModel] = React.useState("");

	const printModelHeaders = useSelector(RequestApiSelectors.printModelHeaders);
	const referencedDocumentModels = useSelector(PrintEngineSelectors.documentModelReferences).map(
		referencedDM => referencedDM.reference
	);
	const modelReferences = useSelector(PrintEngineSelectors.modelReferences);

	const availableFragmentModels = React.useMemo(() => {
		return printModelHeaders
			?.filter(pmHeader =>
				pmHeader.annotations?.find(
					annotation =>
						annotation.name === MODEL_SUB_TYPE_ANNOTATION_NAME && annotation.value === FRAGMENT_SUB_TYPE
				)
			)
			.filter(fragmentHeaders => {
				const fragmentDocumentRefs =
					fragmentHeaders.modelReferences?.filter(ref => ref.modelType === "document") ?? [];
				return (
					fragmentDocumentRefs.length === 0 ||
					fragmentDocumentRefs.some(ref => referencedDocumentModels.includes(ref.reference))
				);
			})
			.filter(fragmentHeaders => !modelReferences.some(ref => ref.reference === fragmentHeaders.id))
			.map(availableFragment => availableFragment.id);
	}, [printModelHeaders, referencedDocumentModels, modelReferences]);

	const fragmentModelItems: SelectItem[] = React.useMemo(() => {
		return (
			availableFragmentModels?.map(fragmentModel => ({
				label: fragmentModel,
			})) ?? []
		);
	}, [availableFragmentModels]);

	const onValueChanged = React.useCallback((newValue: string) => {
		setSelectedFragmentModel(newValue);
	}, []);

	const addFragmentModel = React.useCallback(() => {
		const newFragmentReference: ModelReferenceEntity = {
			id: getEntityId(EntityKey.ModelReferences, selectedFragmentModel),
			reference: selectedFragmentModel,
			purpose: FRAGMENT_MODEL_REFERENCE_PURPOSE,
			modelType: "print",
		};
		dispatch(SchemaActions.addFragmentModelReference(newFragmentReference));
		setSelectedFragmentModel("");
	}, [dispatch, selectedFragmentModel]);

	const addButtonLabel = localizer(RESOURCE_KEYS.button.add);

	return (
		<StyledSchemaToolbar>
			<Select
				className={addPrefix("-u-flex-1")}
				placeholder={localizer(RESOURCE_KEYS.input.selectPlaceholder)}
				value={selectedFragmentModel}
				onValueChanged={onValueChanged}
				items={fragmentModelItems}
				fitToParent={false}
				disabled={disabled}
			/>
			<Button
				title={addButtonLabel}
				label={addButtonLabel}
				icon={<Icon>add</Icon>}
				disabled={disabled || !selectedFragmentModel}
				onClick={addFragmentModel}
			/>
		</StyledSchemaToolbar>
	);
};

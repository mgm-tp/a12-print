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
import { useDispatch, useSelector } from "react-redux";
import { useCallback, useMemo, useState } from "react";

import { Icon, addPrefix, Button } from "@com.mgmtp.a12.widgets/widgets-core";
import type { ModelReferenceEntity } from "@com.mgmtp.a12.print/print-model-api/model";
import { EntityKey, getEntityId } from "@com.mgmtp.a12.print/print-model-api/model";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { SchemaActions } from "../../redux//schema/action.js";
import { RequestApiSelectors } from "../../redux//request-api/selectors.js";

import { CustomSelect } from "../forms/custom-base-input-components/index.js";

import { StyledSchemaToolbar } from "./DocumentModelReferencesToolbar.styled.js";

export const TypesettingModelReferencesToolbar = () => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const [selectedModel, setSelectedModel] = useState<string | undefined>();

	const typesettingModelReferences = useSelector(PrintEngineSelectors.typesettingModelReferences);
	const typesettingModelHeaders = useSelector(RequestApiSelectors.typesettingModelHeaders);

	const availableTypesettingModels = useMemo(() => {
		return (
			typesettingModelHeaders?.filter(
				header => !typesettingModelReferences.find(ref => ref.reference === header.id)
			) || []
		);
	}, [typesettingModelHeaders, typesettingModelReferences]);

	const typesettingMetadataSelectItems = useMemo(() => {
		return availableTypesettingModels.map(reference => {
			return {
				label: reference.id,
				value: reference.id,
			};
		});
	}, [availableTypesettingModels]);

	const addReferencedTypesettingModel = useCallback(() => {
		if (!selectedModel) {
			return;
		}

		const newModelReference: ModelReferenceEntity = {
			id: getEntityId(EntityKey.ModelReferences, selectedModel),
			reference: selectedModel,
			purpose: "data binding",
			modelType: "typesetting",
		};
		dispatch(SchemaActions.addModelReference(newModelReference));
		setSelectedModel(undefined);
	}, [dispatch, selectedModel]);

	const addButtonLabel = localizer(RESOURCE_KEYS.button.add);

	return (
		<StyledSchemaToolbar data-testid="typesetting-references-toolbar">
			<CustomSelect
				className={addPrefix("-u-flex-1")}
				placeholder={localizer(RESOURCE_KEYS.input.selectPlaceholder)}
				value={selectedModel}
				onValueChanged={reference => setSelectedModel(reference)}
				items={typesettingMetadataSelectItems}
				fitToParent={false}
			/>
			<Button
				title={addButtonLabel}
				label={addButtonLabel}
				icon={<Icon>add</Icon>}
				disabled={!selectedModel}
				onClick={addReferencedTypesettingModel}
			/>
		</StyledSchemaToolbar>
	);
};

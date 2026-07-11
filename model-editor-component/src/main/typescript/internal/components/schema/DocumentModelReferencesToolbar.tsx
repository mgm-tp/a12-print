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
import sortBy from "lodash/sortBy.js";

import type { SelectItem } from "@com.mgmtp.a12.widgets/widgets-core";
import { Button, Icon, addPrefix } from "@com.mgmtp.a12.widgets/widgets-core";
import type { ModelReferenceEntity } from "@com.mgmtp.a12.print/print-model-api/model";
import { getEntityId, EntityKey } from "@com.mgmtp.a12.print/print-model-api/model";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { RequestApiSelectors } from "../../redux//request-api/selectors.js";
import { SchemaActions } from "../../redux//schema/action.js";
import { RequestApiActions } from "../../redux/index.js";

import { CustomSelect } from "../forms/custom-base-input-components/index.js";

import { StyledSchemaToolbar } from "./DocumentModelReferencesToolbar.styled.js";

interface DocumentModelReferencesToolbarProps {
	setNewModelReference: (reference: string) => void;
}

export const DocumentModelReferencesToolbar = ({ setNewModelReference }: DocumentModelReferencesToolbarProps) => {
	const localizer = PrintLocalizer.useLocalizer();
	const dispatch = useDispatch();
	const documentModelIds = useSelector(RequestApiSelectors.documentModelIds);
	const modelReferences = useSelector(PrintEngineSelectors.documentModelReferences);
	const [selectedReference, setSelectedReference] = React.useState<string | undefined>(undefined);

	React.useEffect(() => {
		dispatch(RequestApiActions.loadDocumentModelIds());
	}, [dispatch]);

	const documentModelOptions = React.useMemo(() => {
		const existingReferences = modelReferences.reduce((mapping: Record<string, boolean>, reference) => {
			mapping[reference.reference] = true;
			return mapping;
		}, {});
		const options = (documentModelIds || [])?.reduce((options: SelectItem[], documentModelId) => {
			if (!existingReferences[documentModelId]) {
				options.push({ value: documentModelId, label: documentModelId });
			}
			return options;
		}, []);
		return sortBy(options, ["label"]);
	}, [documentModelIds, modelReferences]);

	const handleAddModelReference = React.useCallback(() => {
		if (!selectedReference) {
			return;
		}
		setNewModelReference(selectedReference);

		const newModelReference: ModelReferenceEntity = {
			id: getEntityId(EntityKey.ModelReferences, selectedReference),
			reference: selectedReference,
			purpose: "data binding",
			modelType: "document",
		};

		dispatch(SchemaActions.addModelReference(newModelReference));
		setSelectedReference(undefined);
	}, [dispatch, selectedReference, setNewModelReference]);

	const addButtonLabel = localizer(RESOURCE_KEYS.button.add);

	return (
		<StyledSchemaToolbar>
			<CustomSelect
				className={addPrefix("-u-flex-1")}
				placeholder={localizer(RESOURCE_KEYS.input.selectPlaceholder)}
				value={selectedReference}
				fitToParent={false}
				onValueChanged={setSelectedReference}
				items={documentModelOptions}
			/>
			<Button
				title={addButtonLabel}
				label={addButtonLabel}
				icon={<Icon>add</Icon>}
				disabled={!selectedReference}
				onClick={handleAddModelReference}
			/>
		</StyledSchemaToolbar>
	);
};

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
import { useSelector } from "react-redux";

import { CollapsiblePanel } from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";

import { DocumentModelReferencesCard } from "./DocumentModelReferencesCard.js";
import { DocumentModelReferencesToolbar } from "./DocumentModelReferencesToolbar.js";

export const DocumentModelReferences = () => {
	const localizer = PrintLocalizer.useLocalizer();
	const documentModelReferences = useSelector(PrintEngineSelectors.documentModelReferences);
	const [newModelReference, setNewModelReference] = React.useState("");
	const [isOpenDocumentManagement, toggleDocumentManagement] = React.useReducer(state => !state, false);

	return (
		<CollapsiblePanel
			onClick={toggleDocumentManagement}
			title={localizer(RESOURCE_KEYS.sidebar.schema.tab.documentModelReferenced)}
		>
			{isOpenDocumentManagement && (
				<>
					<DocumentModelReferencesToolbar setNewModelReference={setNewModelReference} />
					{documentModelReferences.map(modelReference => (
						<DocumentModelReferencesCard
							modelReference={modelReference}
							key={modelReference.reference}
							isNewReference={modelReference.reference === newModelReference}
						/>
					))}
				</>
			)}
		</CollapsiblePanel>
	);
};

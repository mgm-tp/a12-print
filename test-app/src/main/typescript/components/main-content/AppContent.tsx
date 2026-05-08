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
import { memo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { ActionContentbox } from "@com.mgmtp.a12.widgets/widgets-core/lib/contentbox";

import { EditorActions, EditorSelector } from "../../store/editor";

import { ResolvedCaseConfigResource } from "../case-config/CaseConfig";

import { PrintEditor } from "./PrintEditor";

export const AppContent = memo(function AppContent() {
	const caseConfig = useSelector(EditorSelector.selectCaseConfig);
	const logPersistentEntries = useSelector(EditorSelector.selectLogPersistentEntries);
	const caseResource = useSelector(EditorSelector.selectCaseResource);
	const printModel = useSelector(EditorSelector.selectPrintModel);
	const dispatch = useDispatch();

	useEffect(() => {
		if (caseConfig?.path) {
			resolveResource(caseConfig.path).then(res => {
				if (res) {
					dispatch(EditorActions.setCaseResource(res));
					dispatch(EditorActions.setPrintModel(res.printModel));
				}
			});
		}
	}, [caseConfig, dispatch]);

	if (!printModel || !caseConfig || !caseResource || logPersistentEntries === undefined) {
		return null;
	}

	return (
		<ActionContentbox headingElements={null} padding={8}>
			<PrintEditor {...caseResource} printModel={printModel} logPersistentEntries={logPersistentEntries} />
		</ActionContentbox>
	);
});

const resolveResource = async (originalPath: string): Promise<ResolvedCaseConfigResource | undefined> => {
	const parts = originalPath.split("/");
	parts.pop();
	parts.shift();
	const path = `${parts.join("/")}/case.config.resource.json`;
	try {
		const data = await import(`@use-cases/${path}`);
		return data.default;
	} catch (error) {
		console.error(error);
		return undefined;
	}
};

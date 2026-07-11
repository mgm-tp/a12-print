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

import { MONACO_LANGUAGE_CONFIGURATION } from "@com.mgmtp.a12.dml/dml";

import { useModelNameAliasGetter } from "./use-model-name-alias-getter.js";

export const useModelNameAliasConverter = (documentModel?: string) => {
	const getModelNameAlias = useModelNameAliasGetter();

	const aliasDocumentModel = getModelNameAlias(documentModel);

	const replaceModelName = React.useCallback((value: string, targetName: string, replacedName: string) => {
		let convertedValue = value;
		convertedValue = convertedValue.replace(new RegExp(`${targetName}/general`, "g"), `${replacedName}/general`);
		MONACO_LANGUAGE_CONFIGURATION.brackets?.forEach((bracket: [string, string]) => {
			const bracketValue = `\\${bracket[0]}${targetName}\\${bracket[1]}`;
			const bracketReplaceValue = `${bracket[0]}${replacedName}${bracket[1]}`;
			convertedValue = convertedValue.replace(new RegExp(bracketValue, "g"), bracketReplaceValue);
		});
		return convertedValue;
	}, []);

	const convertModelNameToAlias = React.useCallback(
		(value?: string) => {
			if (!documentModel || !aliasDocumentModel || !value) {
				return value;
			}
			return replaceModelName(value, documentModel, aliasDocumentModel);
		},
		[aliasDocumentModel, documentModel, replaceModelName]
	);

	const convertAliasToModelName = React.useCallback(
		(value?: string) => {
			if (!documentModel || !aliasDocumentModel || !value) {
				return value;
			}
			return replaceModelName(value, aliasDocumentModel, documentModel);
		},
		[aliasDocumentModel, documentModel, replaceModelName]
	);

	return {
		aliasDocumentModel,
		convertModelNameToAlias,
		convertAliasToModelName,
	};
};

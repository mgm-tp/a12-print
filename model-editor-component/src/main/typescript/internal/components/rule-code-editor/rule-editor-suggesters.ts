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
import { ItemSuggestor, SuggestionItem } from "@com.mgmtp.a12.dml/dml/lib/ruleCodeEditor/context-assist/index.js";
import { ElementMap } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/types/document-model-data.js";
import { RuntimeVariable, RuntimeVariableType } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";

export type SuggestionType = "listing" | "default";

const ADDITIONAL_FIELDS = new Map([
	[
		"listing",
		[
			"value",
			"path",
			"name",
			"depth",
			"isField",
			"currentRepetition",
			"repetitions",
			"currentRepetitionOfParent",
			"repetitionsOfParent",
			"parentName",
			"parentPath",
			"relativeMetadata/label",
			"relativeMetadata/required",
			"relativeMetadata/externalDescription",
			"relativeMetadata/repeatability",
			"relativeMetadata/errorMessage",
		],
	],
]);

const SLASH_REGEX = /([/|\\])/g;

function convertPathToSuggestionItem(path: string, modelId?: string, modelAlias?: string) {
	const newPath = `${modelAlias || modelId || ""}${path}`;

	return {
		label: newPath,
		insertText: newPath,
		documentation: newPath,
		detail: newPath.replace(SLASH_REGEX, "\n$1"),
	};
}

export function getSuggester(
	isGroup: boolean,
	elementMap?: ElementMap,
	annotations?: Set<string>,
	annotationAndMetadataFieldPaths?: ReadonlyArray<string>,
	runtimeVariables?: readonly DeepPartial<RuntimeVariable>[],
	modelId?: string,
	modelAlias?: string,
	suggestionType?: SuggestionType
): ItemSuggestor {
	const items: SuggestionItem[] = [];

	if (suggestionType && !isGroup && ADDITIONAL_FIELDS.has(suggestionType)) {
		ADDITIONAL_FIELDS.get(suggestionType)?.forEach(option => {
			items.push(convertPathToSuggestionItem(option));
		});

		if (annotations && suggestionType === "listing") {
			annotations.forEach(annotation =>
				items.push(convertPathToSuggestionItem(`relativeAnnotation/${annotation}`))
			);
		}
	}

	if (elementMap && modelId) {
		Object.values(elementMap)
			.filter(value => value.isGroup === isGroup)
			.filter(
				value =>
					suggestionType !== "listing" ||
					!(value.repeatability ? value.repeatability > 1 : value.isSubOfRepeatable)
			)
			.forEach(value => {
				items.push(convertPathToSuggestionItem(value.elementPath, modelId, modelAlias));
			});
		if (!isGroup) {
			annotationAndMetadataFieldPaths?.forEach(path => {
				if (path.startsWith(modelId) && modelAlias) {
					items.push(convertPathToSuggestionItem(path.replace(modelId, modelAlias)));
				} else {
					items.push(convertPathToSuggestionItem(path));
				}
			});
			runtimeVariables?.forEach(variable => {
				if (variable.type === RuntimeVariableType.StringArray) {
					items.push(convertPathToSuggestionItem(`runtime/${variable.name}*/value`));
				} else {
					items.push(convertPathToSuggestionItem(`runtime/${variable.name}`));
				}
			});
		}
	}

	return async (): Promise<SuggestionItem[]> => items;
}

export function getRootSuggester(documentModelId?: string, modelAlias?: string): ItemSuggestor {
	const entries: SuggestionItem[] = [
		{
			label: "runtime",
			insertText: "runtime",
		},
	];
	const documentModelName = modelAlias || documentModelId;

	if (documentModelName) {
		entries.push({
			label: documentModelName,
			insertText: documentModelName,
		});
	}
	return async (): Promise<SuggestionItem[]> => entries;
}

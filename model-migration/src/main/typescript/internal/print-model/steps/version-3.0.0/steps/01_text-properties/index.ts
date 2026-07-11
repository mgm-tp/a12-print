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
import type { Logger } from "@com.mgmtp.a12.migrationtool/migrationtool-core/types";

import type { TransformTreeTrace } from "../../../../utils.ts/tree-trace.js";
import type * as OldModel from "../../../version-2.1.0/print-model.js";
import { ReferenceTransformer } from "../../../../utils.ts/reference-transformer.js";
import { Transformer } from "../../../../utils.ts/transformer.js";
import { PrintModelTransformError } from "../../../../utils.ts/error.js";

import type * as NewModel from "./print-model.js";
import {
	transformExpressionElement,
	transformListingElement,
	transformTableElement,
	transformTextElement,
	transformUnexpectedElement,
} from "./elements.js";

export function transformTextProperties(oldModel: OldModel.PrintModelDTO, logger: Logger): NewModel.PrintModelDTO {
	const unexpectedElementIds: string[] = [];

	const elementReferencesTransformer = new ReferenceTransformer(
		oldModel.content.elementDefinitions || [],
		(input: OldModel.ElementDefinitionsDTO, path: TransformTreeTrace) =>
			transformElement(input, path, unexpectedElementIds),
		nestedReferenceGetter
	);

	if (oldModel.content.segments?.definitions) {
		Transformer.transform({
			input: oldModel.content.segments.definitions,
			handler: (element: OldModel.DefinitionsDTO): NewModel.DefinitionsDTO => {
				if (element.elementReferences) {
					elementReferencesTransformer.handleReferences(element.elementReferences);
				}
				return element;
			},
		});
	}

	if (oldModel.content.sections?.definitions) {
		Transformer.transform({
			input: oldModel.content.sections.definitions,
			handler: (element: OldModel.DefinitionsDTO_1): NewModel.DefinitionsDTO_1 => {
				if (element.elementReferences) {
					elementReferencesTransformer.handleReferences(element.elementReferences);
				}
				return element;
			},
		});
	}

	if (oldModel.content.watermarks?.definitions) {
		Transformer.transform({
			input: oldModel.content.watermarks.definitions,
			handler: (element: OldModel.DefinitionsDTO_3): NewModel.DefinitionsDTO_3 => {
				if (element.elementReferences) {
					elementReferencesTransformer.handleReferences(element.elementReferences);
				}
				return element;
			},
		});
	}

	elementReferencesTransformer.forEachUnhandled((unhandledElement, index) => {
		if (unhandledElement.type === "Override") {
			elementReferencesTransformer.handleElement(unhandledElement, index);
		}
	});

	const transformedElements = elementReferencesTransformer.getHandledElements();

	const hasNotTransformedElements = transformedElements.length !== oldModel.content.elementDefinitions?.length;

	if (hasNotTransformedElements) {
		const checkSet = new Set();
		const duplicatedElementIds = new Set();
		oldModel.content.elementDefinitions?.forEach(element => {
			if (checkSet.has(element.id)) {
				duplicatedElementIds.add(element.id);
			} else {
				checkSet.add(element.id);
			}
		});

		if (duplicatedElementIds.size > 0) {
			throw new PrintModelTransformError(
				`Migration failed due to duplicated element IDs: ${[...duplicatedElementIds].join(", ")}. Please resolve these duplicates manually before retrying the migration.`
			);
		}

		const notMigratedElementIds = oldModel.content.elementDefinitions
			?.filter(element => !transformedElements.find(transformedElement => transformedElement?.id === element.id))
			.map(element => element.id);

		throw new PrintModelTransformError(
			`Migration failed due to unused elements that could not be migrated: ${notMigratedElementIds?.join(", ")}. Please review and resolve these issues manually before retrying the migration.`
		);
	}

	if (unexpectedElementIds.length) {
		logger.info(
			`The print model ${oldModel.header.id} contains elements with text properties that cannot be modified through the editor. Please check the following element IDs: ${unexpectedElementIds.join(", ")}.`
		);
	}

	return {
		...oldModel,
		content: {
			...oldModel.content,
			elementDefinitions: transformedElements,
		},
	};
}

function transformElement(
	element: OldModel.ElementDefinitionsDTO,
	treeTrace: TransformTreeTrace,
	unexpectedIds: string[]
): NewModel.ElementDefinitionsDTO {
	if (element.type === "Text") {
		return transformTextElement(element);
	}

	if (element.type === "Table") {
		return transformTableElement(element);
	}

	if (element.type === "Listing") {
		return transformListingElement(element);
	}

	if (element.type === "Expression") {
		return transformExpressionElement(element, treeTrace);
	}

	return transformUnexpectedElement(element, unexpectedIds);
}

function nestedReferenceGetter(element: OldModel.ElementDefinitionsDTO) {
	if (element.type === "Switch") {
		return element.switch?.cases;
	}

	if (element.type === "Area") {
		return element.area?.elementReferences;
	}

	if (element.type === "BoundingBox") {
		return element.boundingBox?.elementReferences;
	}

	if (element.type === "Override") {
		return element.override?.boundingBox?.elementReferences;
	}

	if (element.type === "Table") {
		return element.table?.columns;
	}

	if (element.type === "TableLayout") {
		return element.tableLayout?.cells;
	}

	if (element.type === "Text") {
		return element.text?.entities;
	}

	return undefined;
}

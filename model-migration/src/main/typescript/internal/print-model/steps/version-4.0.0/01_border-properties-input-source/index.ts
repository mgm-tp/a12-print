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
import { nanoid } from "nanoid";

import { PRINT_MODEL_METADATA_MAP } from "@com.mgmtp.a12.print/print-model-api/generated";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";

import { ReferenceTransformer } from "../../../utils.ts/reference-transformer.js";
import type { TransformTreeTrace } from "../../../utils.ts/tree-trace.js";
import { Transformer } from "../../../utils.ts/transformer.js";
import type { GenericObject } from "../../../utils.ts/types.js";
import { PrintModelTransformError } from "../../../utils.ts/error.js";
import type { Enumeration_BorderProperties_BorderStyleDTO } from "../../version-2.1.0/print-model.js";
import type * as OldModel from "../../version-3.2.0/02_page-break-behavior/print-model.js";

import type { ColumnsDTO_1, ListingDTO } from "./print-model.js";
import type * as NewModel from "./print-model.js";

const borderPropertiesMetadata = PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.borderProperties;

const BORDER_PROPERTIES_PATHS = {
	borderWidth: borderPropertiesMetadata.borderWidth.value.path,
	borderColor: borderPropertiesMetadata.borderColor.value.path,
	borderStyle: borderPropertiesMetadata.borderStyle.value.path,
};

export function transformBorderPropertiesInputSource(oldModel: OldModel.PrintModelDTO): NewModel.PrintModelDTO {
	const elementReferencesTransformer = new ReferenceTransformer(
		oldModel.content.elementDefinitions || [],
		(input: OldModel.ElementDefinitionsDTO, path: TransformTreeTrace) => transformElement(input, path),
		nestedReferenceGetter
	);

	if (oldModel.content.segments?.definitions) {
		Transformer.transform({
			input: oldModel.content.segments.definitions,
			handler: (element: OldModel.DefinitionsDTO): NewModel.DefinitionsDTO => {
				if (element.elementReferences) {
					elementReferencesTransformer.handleReferences(element.elementReferences);
				}
				return element as NewModel.DefinitionsDTO;
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
				return element as NewModel.DefinitionsDTO_1;
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
				return element as NewModel.DefinitionsDTO_3;
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
			?.filter(element => !transformedElements.some(transformedElement => transformedElement?.id === element.id))
			.map(element => element.id);

		throw new PrintModelTransformError(
			`Migration failed due to unused elements that could not be migrated: ${notMigratedElementIds?.join(", ")}. Please review and resolve these issues manually before retrying the migration.`
		);
	}

	return {
		...oldModel,
		content: {
			...(oldModel.content as NewModel.ContentDTO),
			elementDefinitions: transformedElements,
		},
	};
}

function transformElement(
	element: OldModel.ElementDefinitionsDTO,
	treeTrace: TransformTreeTrace
): NewModel.ElementDefinitionsDTO {
	const elementsWithBorder = [
		"Table",
		"TableLayout",
		"Area",
		"BarChart",
		"LineChart",
		"PieChart",
		"BoundingBox",
		"Expression",
		"Field",
		"Image",
		"Line",
	];
	if (elementsWithBorder.includes(element.type)) {
		return transformElementWithBorder(element);
	}

	if (element.type === "Listing") {
		return transformListingElement(element);
	}

	if (element.type === "Text") {
		const parentElement = treeTrace.findParent(isTableLayoutDefinition);
		if (!parentElement) {
			return transformElementWithBorder(element);
		}
		return transformTextElementInTableLayout(element, parentElement.id);
	}

	return transformUnexpectedElement(element);
}

function transformUnexpectedElement(
	element: OldModel.ElementDefinitionsDTO
): Omit<
	NewModel.ElementDefinitionsDTO,
	| "table"
	| "tableLayout"
	| "area"
	| "barChart"
	| "lineChart"
	| "pieChart"
	| "boundingBox"
	| "expression"
	| "field"
	| "image"
	| "listing"
> {
	if (!element.borderProperties) {
		return {
			...element,
		} as NewModel.ElementDefinitionsDTO;
	}

	throw new Error("Unexpected element type with border properties: " + element.type);
}

function migrateBorderProperties(
	oldBorderProp: OldModel.ElementDefinitionsDTO["borderProperties"],
	parentElementId?: string
): NewModel.ElementDefinitionsDTO["borderProperties"] {
	return {
		id: oldBorderProp?.id ?? nanoid(),
		borderWidth: migrateInputSource(
			BORDER_PROPERTIES_PATHS.borderWidth,
			oldBorderProp?.borderWidth,
			parentElementId
		),
		borderColor: migrateInputSource(
			BORDER_PROPERTIES_PATHS.borderColor,
			oldBorderProp?.borderColor,
			parentElementId
		),
		borderStyle: migrateBorderStyleInputSource(
			BORDER_PROPERTIES_PATHS.borderStyle,
			oldBorderProp?.borderStyle,
			parentElementId
		),
	};
}

function transformListingElement(
	element: OldModel.ElementDefinitionsDTO
): Pick<NewModel.ElementDefinitionsDTO, "id" | "type" | "listing" | "borderProperties"> {
	return {
		...element,
		borderProperties: migrateBorderProperties(element.borderProperties),
		listing: {
			...element.listing,
			columns: element.listing?.columns?.map(column => ({
				...column,
				borderProperties: migrateBorderProperties(column.borderProperties, element.id),
			})) as ColumnsDTO_1[],
		} as ListingDTO,
	};
}

function transformTextElementInTableLayout(
	element: OldModel.ElementDefinitionsDTO,
	parentElementId: string
): Pick<NewModel.ElementDefinitionsDTO, "id" | "type" | "borderProperties"> {
	return {
		...element,
		borderProperties: migrateBorderProperties({ ...element.borderProperties, id: element.id }, parentElementId),
	};
}

function transformElementWithBorder(
	element: OldModel.ElementDefinitionsDTO
): Pick<NewModel.ElementDefinitionsDTO, "id" | "type" | "borderProperties"> {
	return {
		...element,
		borderProperties: migrateBorderProperties(element.borderProperties),
	};
}

function migrateInputSource<T>(
	path: string,
	value?: T,
	parentElementId?: string
): undefined | NewModel.InputSourceDTO<T> {
	let source = value === undefined ? PossibleInputSource.DEFAULT : PossibleInputSource.INPUT;
	if (parentElementId && source === PossibleInputSource.DEFAULT) {
		source = PossibleInputSource.INHERITED;
	}

	return {
		id: nanoid(),
		source,
		value: source === PossibleInputSource.INPUT ? value : undefined,
		path,
		reference: parentElementId,
	};
}

function migrateBorderStyleInputSource(
	path: string,
	value?: string,
	parentElementId?: string
): NewModel.InputSourceDTO<Enumeration_BorderProperties_BorderStyleDTO> {
	let source: PossibleInputSource;

	if (value !== undefined && ["Solid", "Dashed", "Dotted"].includes(value)) {
		source = PossibleInputSource.INPUT;
	} else if (value === undefined && parentElementId) {
		source = PossibleInputSource.INHERITED;
	} else {
		source = PossibleInputSource.UNSET;
	}

	return {
		id: nanoid(),
		source,
		value:
			source === PossibleInputSource.INPUT ? (value as Enumeration_BorderProperties_BorderStyleDTO) : undefined,
		path,
		reference: parentElementId,
	};
}

function isTableLayoutDefinition(element: GenericObject): element is OldModel.ElementDefinitionsDTO {
	return "id" in element && "type" in element && element.type === "TableLayout";
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

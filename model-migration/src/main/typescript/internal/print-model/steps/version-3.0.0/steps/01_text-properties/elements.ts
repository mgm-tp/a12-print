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
import { TEXT_STYLE } from "@com.mgmtp.a12.print/print-model-api/model";

import type * as OldModel from "../../../version-2.1.0/print-model.js";
import type { TransformTreeTrace } from "../../../../utils.ts/tree-trace.js";
import type { GenericObject } from "../../../../utils.ts/types.js";

import type * as NewModel from "./print-model.js";

const textPropertiesMetadata = PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.textProperties;
const tableHeaderTextPropertiesMetadata =
	PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.table.headerTextProperties;
const listingHeaderTextPropertiesMetadata =
	PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.listing.headerTextProperties;
const listingColumnTextPropertiesMetadata =
	PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.listing.columns.textProperties;

const TEXT_PROPERTIES_PATHS = {
	italic: textPropertiesMetadata.italic.value.path,
	bold: textPropertiesMetadata.bold.value.path,
	underlined: textPropertiesMetadata.underlined.value.path,
	textStyleId: textPropertiesMetadata.textStyleId.value.path,
	alignment: textPropertiesMetadata.alignment.value.path,
	backgroundColor: textPropertiesMetadata.backgroundColor.value.path,
	color: textPropertiesMetadata.color.value.path,
};

function migrateTextProperties(
	textPropertiesPaths: Record<keyof Omit<NewModel.TextPropertiesDTO, "id">, string>,
	oldTextProperties?: OldModel.TextPropertiesDTO,
	parentElementId?: string
): NewModel.TextPropertiesDTO {
	return {
		id: oldTextProperties?.id || nanoid(),
		textStyleId: migrateInputSource(
			textPropertiesPaths.textStyleId,
			oldTextProperties?.textStyleId,
			parentElementId
		),
		alignment: migrateInputSource(textPropertiesPaths.alignment, oldTextProperties?.alignment, parentElementId),
		bold: migrateInputSource(textPropertiesPaths.bold, oldTextProperties?.bold, parentElementId),
		italic: migrateInputSource(textPropertiesPaths.italic, oldTextProperties?.italic, parentElementId),
		underlined: migrateInputSource(textPropertiesPaths.underlined, oldTextProperties?.underlined, parentElementId),
		color: migrateInputSource(textPropertiesPaths.color, oldTextProperties?.color, parentElementId),
		backgroundColor: migrateInputSource(
			textPropertiesPaths.backgroundColor,
			oldTextProperties?.backgroundColor,
			parentElementId
		),
	};
}

function migrateInputSource<T>(path: string, value?: T, parentElementId?: string): NewModel.InputSourceDTO<T> {
	let source = value !== undefined ? PossibleInputSource.INPUT : PossibleInputSource.DEFAULT;
	if (parentElementId) {
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

export function transformTextElement(
	element: OldModel.ElementDefinitionsDTO
): Pick<NewModel.ElementDefinitionsDTO, "id" | "text" | "type" | "textProperties" | "borderProperties"> {
	const textProperties = element.textProperties;

	// If there is no text properties group, no text style fallback have to be applied
	const textStyleId = textProperties ? textProperties?.textStyleId : TEXT_STYLE.NO_TEXT_STYLE_FALLBACK_ID;
	return {
		...element,
		textProperties: {
			...migrateTextPropertiesIPresent(TEXT_PROPERTIES_PATHS, textProperties),
			id: textProperties?.id || nanoid(),
			textStyleId: migrateInputSource(textPropertiesMetadata.textStyleId.value.path, textStyleId),
			alignment: migrateInputSource(textPropertiesMetadata.alignment.value.path, textProperties?.alignment),
		},
	};
}

export function transformTableElement(
	element: OldModel.ElementDefinitionsDTO
): Pick<NewModel.ElementDefinitionsDTO, "id" | "table" | "type" | "textProperties" | "borderProperties"> {
	const textProperties = element.textProperties;

	// If the header properties are undefined, take the values from the text properties, excluding text style and bold since these properties are not affected by text properties
	const headerTextProperties = element.table?.headerTextProperties
		? element.table.headerTextProperties
		: textProperties
			? { ...textProperties, bold: undefined, textStyleId: undefined }
			: undefined;

	return {
		...element,
		textProperties: migrateTextProperties(TEXT_PROPERTIES_PATHS, textProperties),
		table: {
			...element.table,
			headerTextProperties: migrateTextProperties(
				{
					italic: tableHeaderTextPropertiesMetadata.italic.value.path,
					bold: tableHeaderTextPropertiesMetadata.bold.value.path,
					underlined: tableHeaderTextPropertiesMetadata.underlined.value.path,
					textStyleId: tableHeaderTextPropertiesMetadata.textStyleId.value.path,
					alignment: tableHeaderTextPropertiesMetadata.alignment.value.path,
					backgroundColor: tableHeaderTextPropertiesMetadata.backgroundColor.value.path,
					color: tableHeaderTextPropertiesMetadata.color.value.path,
				},
				headerTextProperties
			),
		},
	};
}

export function transformListingElement(
	element: OldModel.ElementDefinitionsDTO
): Pick<NewModel.ElementDefinitionsDTO, "id" | "listing" | "type" | "textProperties" | "borderProperties"> {
	return {
		...element,
		textProperties: migrateTextProperties(TEXT_PROPERTIES_PATHS, element.textProperties),
		listing: {
			...element.listing,
			headerTextProperties: migrateTextProperties(
				{
					italic: listingHeaderTextPropertiesMetadata.italic.value.path,
					bold: listingHeaderTextPropertiesMetadata.bold.value.path,
					underlined: listingHeaderTextPropertiesMetadata.underlined.value.path,
					textStyleId: listingHeaderTextPropertiesMetadata.textStyleId.value.path,
					alignment: listingHeaderTextPropertiesMetadata.alignment.value.path,
					backgroundColor: listingHeaderTextPropertiesMetadata.backgroundColor.value.path,
					color: listingHeaderTextPropertiesMetadata.color.value.path,
				},
				element.listing?.headerTextProperties
			),
			columns: element.listing?.columns?.map(column => {
				return {
					...column,
					textProperties: column.hasCustomTextProperties
						? migrateTextProperties(
								{
									italic: listingColumnTextPropertiesMetadata.italic.value.path,
									bold: listingColumnTextPropertiesMetadata.bold.value.path,
									underlined: listingColumnTextPropertiesMetadata.underlined.value.path,
									textStyleId: listingColumnTextPropertiesMetadata.textStyleId.value.path,
									alignment: listingColumnTextPropertiesMetadata.alignment.value.path,
									backgroundColor: listingColumnTextPropertiesMetadata.backgroundColor.value.path,
									color: listingColumnTextPropertiesMetadata.color.value.path,
								},
								column.textProperties
							)
						: undefined,
				};
			}),
		},
	};
}

export function transformExpressionElement(
	element: OldModel.ElementDefinitionsDTO,
	treeTrace: TransformTreeTrace
): Pick<NewModel.ElementDefinitionsDTO, "id" | "expression" | "type" | "textProperties" | "borderProperties"> {
	const parentElement = treeTrace.findParent(isTableDefinition);

	// Migrate standalone expression
	if (!parentElement) {
		// If there are no text properties, apply no text style fallback ID.
		if (!element.textProperties) {
			return {
				...element,
				textProperties: {
					...migrateTextProperties(TEXT_PROPERTIES_PATHS, element.textProperties),
					textStyleId: migrateInputSource(
						TEXT_PROPERTIES_PATHS.textStyleId,
						TEXT_STYLE.NO_TEXT_STYLE_FALLBACK_ID
					),
				},
			};
		}

		return {
			...element,
			textProperties: migrateTextProperties(TEXT_PROPERTIES_PATHS, element.textProperties),
		};
	}

	// If no text properties are present, migrate using the inherited source.
	if (!element.textProperties) {
		return {
			...element,
			textProperties: migrateTextProperties(TEXT_PROPERTIES_PATHS, element.textProperties, parentElement.id),
		};
	}

	// If the text property is present, migrate it to the input source; otherwise, migrate it to the inherited source.
	return {
		...element,
		textProperties: {
			id: element.textProperties.id || nanoid(),
			textStyleId: migrateInputSource(
				TEXT_PROPERTIES_PATHS.textStyleId,
				element.textProperties.textStyleId,
				element.textProperties.textStyleId ? undefined : parentElement.id
			),
			alignment: migrateInputSource(
				TEXT_PROPERTIES_PATHS.alignment,
				element.textProperties.alignment,
				element.textProperties.alignment ? undefined : parentElement.id
			),
			bold: migrateInputSource(
				TEXT_PROPERTIES_PATHS.bold,
				element.textProperties.bold,
				element.textProperties.bold ? undefined : parentElement.id
			),
			italic: migrateInputSource(
				TEXT_PROPERTIES_PATHS.italic,
				element.textProperties.italic,
				element.textProperties.italic ? undefined : parentElement.id
			),
			underlined: migrateInputSource(
				TEXT_PROPERTIES_PATHS.underlined,
				element.textProperties.underlined,
				element.textProperties.underlined ? undefined : parentElement.id
			),
			color: migrateInputSource(
				TEXT_PROPERTIES_PATHS.color,
				element.textProperties.color,
				element.textProperties.color ? undefined : parentElement.id
			),
			backgroundColor: migrateInputSource(
				TEXT_PROPERTIES_PATHS.backgroundColor,
				element.textProperties.backgroundColor,
				element.textProperties.backgroundColor ? undefined : parentElement.id
			),
		},
	};
}

export function transformUnexpectedElement(
	element: OldModel.ElementDefinitionsDTO,
	unexpectedIds: string[]
): Omit<NewModel.ElementDefinitionsDTO, "table" | "listing" | "expression" | "text"> {
	if (!element.textProperties) {
		return {
			...element,
			textProperties: undefined,
		};
	}

	unexpectedIds.push(element.id);

	return {
		...element,
		textProperties: migrateTextPropertiesIPresent(TEXT_PROPERTIES_PATHS, element.textProperties),
	};
}

function migrateInputSourcePresent<T>(path: string, value?: T): undefined | NewModel.InputSourceDTO<T> {
	if (!value) {
		return undefined;
	}
	return migrateInputSource(path, value);
}

function migrateTextPropertiesIPresent(
	textPropertiesPaths: Record<keyof Omit<NewModel.TextPropertiesDTO, "id">, string>,
	oldTextProperties?: OldModel.TextPropertiesDTO
) {
	// Only migrate text properties that are present
	return {
		id: oldTextProperties?.id || nanoid(),
		textStyleId: migrateInputSourcePresent(textPropertiesPaths.textStyleId, oldTextProperties?.textStyleId),
		alignment: migrateInputSourcePresent(textPropertiesPaths.alignment, oldTextProperties?.alignment),
		bold: migrateInputSourcePresent(textPropertiesPaths.bold, oldTextProperties?.bold),
		italic: migrateInputSourcePresent(textPropertiesPaths.italic, oldTextProperties?.italic),
		underlined: migrateInputSourcePresent(textPropertiesPaths.underlined, oldTextProperties?.underlined),
		color: migrateInputSourcePresent(textPropertiesPaths.color, oldTextProperties?.color),
		backgroundColor: migrateInputSourcePresent(
			textPropertiesPaths.backgroundColor,
			oldTextProperties?.backgroundColor
		),
	};
}

function isTableDefinition(element: GenericObject): element is OldModel.ElementDefinitionsDTO {
	return "id" in element && "type" in element && element.type === "Table";
}

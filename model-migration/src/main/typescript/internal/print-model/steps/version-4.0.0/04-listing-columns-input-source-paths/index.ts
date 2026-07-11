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
import { PRINT_MODEL_METADATA_MAP } from "@com.mgmtp.a12.print/print-model-api/generated";

import type * as Model from "./print-model.js";

const listingColumnBorderPropertiesMetadata =
	PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.listing.columns.borderProperties;

const listingColumnTextPropertiesMetadata =
	PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.listing.columns.textProperties;

const LISTING_COLUMN_BORDER_PROPERTIES_PATHS = {
	borderWidth: listingColumnBorderPropertiesMetadata.borderWidth.value.path,
	borderColor: listingColumnBorderPropertiesMetadata.borderColor.value.path,
	borderStyle: listingColumnBorderPropertiesMetadata.borderStyle.value.path,
};

const LISTING_COLUMN_TEXT_PROPERTIES_PATHS = {
	color: listingColumnTextPropertiesMetadata.color.value.path,
	backgroundColor: listingColumnTextPropertiesMetadata.backgroundColor.value.path,
	alignment: listingColumnTextPropertiesMetadata.alignment.value.path,
	bold: listingColumnTextPropertiesMetadata.bold.value.path,
	italic: listingColumnTextPropertiesMetadata.italic.value.path,
	underlined: listingColumnTextPropertiesMetadata.underlined.value.path,
	textStyleId: listingColumnTextPropertiesMetadata.textStyleId.value.path,
};

export default function transformListingColumnsInputSourcePaths(model: Model.PrintModelDTO): Model.PrintModelDTO {
	const transformedElementDefinitions = model.content.elementDefinitions?.map(element =>
		element.type === "Listing" ? fixListingColumnPaths(element) : element
	);
	return {
		...model,
		content: {
			...model.content,
			elementDefinitions: transformedElementDefinitions,
		},
	};
}

function fixListingColumnPaths(element: Model.ElementDefinitionsDTO): Model.ElementDefinitionsDTO {
	return {
		...element,
		listing: {
			...element.listing,
			columns: element.listing?.columns?.map(column => ({
				...column,
				borderProperties: column.borderProperties
					? {
							...column.borderProperties,
							borderWidth: column.borderProperties.borderWidth
								? {
										...column.borderProperties.borderWidth,
										path: LISTING_COLUMN_BORDER_PROPERTIES_PATHS.borderWidth,
									}
								: undefined,
							borderColor: column.borderProperties.borderColor
								? {
										...column.borderProperties.borderColor,
										path: LISTING_COLUMN_BORDER_PROPERTIES_PATHS.borderColor,
									}
								: undefined,
							borderStyle: column.borderProperties.borderStyle
								? {
										...column.borderProperties.borderStyle,
										path: LISTING_COLUMN_BORDER_PROPERTIES_PATHS.borderStyle,
									}
								: undefined,
						}
					: undefined,
				textProperties: column.textProperties
					? {
							...column.textProperties,
							color: column.textProperties.color
								? { ...column.textProperties.color, path: LISTING_COLUMN_TEXT_PROPERTIES_PATHS.color }
								: undefined,
							backgroundColor: column.textProperties.backgroundColor
								? {
										...column.textProperties.backgroundColor,
										path: LISTING_COLUMN_TEXT_PROPERTIES_PATHS.backgroundColor,
									}
								: undefined,
							alignment: column.textProperties.alignment
								? {
										...column.textProperties.alignment,
										path: LISTING_COLUMN_TEXT_PROPERTIES_PATHS.alignment,
									}
								: undefined,
							bold: column.textProperties.bold
								? { ...column.textProperties.bold, path: LISTING_COLUMN_TEXT_PROPERTIES_PATHS.bold }
								: undefined,
							italic: column.textProperties.italic
								? { ...column.textProperties.italic, path: LISTING_COLUMN_TEXT_PROPERTIES_PATHS.italic }
								: undefined,
							underlined: column.textProperties.underlined
								? {
										...column.textProperties.underlined,
										path: LISTING_COLUMN_TEXT_PROPERTIES_PATHS.underlined,
									}
								: undefined,
							textStyleId: column.textProperties.textStyleId
								? {
										...column.textProperties.textStyleId,
										path: LISTING_COLUMN_TEXT_PROPERTIES_PATHS.textStyleId,
									}
								: undefined,
						}
					: undefined,
			})),
		} as Model.ListingDTO,
	};
}

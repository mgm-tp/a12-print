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

import type * as NewModel from "../print-model.js";

// Correct paths for pageBreakBehavior inside wrapper element references
const AREA_PB_PATH =
	PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.area.elementReferences.pageBreakBehavior.value.path;
const BOUNDING_BOX_PB_PATH =
	PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.boundingBox.elementReferences.pageBreakBehavior.value
		.path;
const OVERRIDE_PB_PATH =
	PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions.override.boundingBox.elementReferences
		.pageBreakBehavior.value.path;

export function transformWrongReferencesAndPaths(oldModel: NewModel.PrintModelDTO): NewModel.PrintModelDTO {
	const elementDefinitions = oldModel.content?.elementDefinitions;
	if (!elementDefinitions) {
		return oldModel;
	}

	// Build a map: expression element ID → the table elements that own it (via columns[].refId)
	const expressionToTableMap = buildOwnerMap(elementDefinitions, elemDef =>
		elemDef.type === "Table" ? elemDef.table?.columns : undefined
	);

	// Build a map: tableLayout cell text element ID → the tableLayout elements that own it (via cells[].refId)
	const cellTextToTableLayoutMap = buildOwnerMap(elementDefinitions, elemDef =>
		elemDef.type === "TableLayout" ? elemDef.tableLayout?.cells : undefined
	);

	// Build a map: element ID → the element references placing it
	const placeableMap = buildPlaceableMap(oldModel.content);

	const fixedElementDefinitions = elementDefinitions.map(elemDef => {
		let fixed = elemDef;

		// Fix: Repair broken INHERITED textProperties references on Expression elements
		if (elemDef.type === "Expression" && elemDef.textProperties) {
			fixed = fixExpressionReferences(fixed, expressionToTableMap);
		}

		// Fix: Repair broken INHERITED textProperties/borderProperties on Listing columns
		if (elemDef.type === "Listing" && elemDef.listing?.columns) {
			fixed = fixListingColumnReferences(fixed);
		}

		// Fix: Repair broken INHERITED borderProperties on Text elements in TableLayout cells
		if (elemDef.type === "Text" && elemDef.borderProperties) {
			fixed = fixCellTextBorderReferences(fixed, cellTextToTableLayoutMap);
		}

		// Fix: Repair pageBreakBehavior paths and references inside wrapper elementReferences
		fixed = fixWrapperPageBreaks(fixed, placeableMap.get(elemDef.id));

		// Fix: Restore borderProperties ids dropped by an earlier migration
		fixed = fixMissingBorderPropertiesIds(fixed);

		return fixed;
	});

	return {
		...oldModel,
		content: {
			...oldModel.content,
			elementDefinitions: fixedElementDefinitions,
		},
	};
}

/**
 * Build a map from a referenced element ID to the elements that own it, in the order they are defined in.
 * An element can be used by more than one owner, so all of them are collected - see {@link ownerToReference}.
 */
function buildOwnerMap(
	elementDefinitions: NewModel.ElementDefinitionsDTO[],
	childrenOf: (elemDef: NewModel.ElementDefinitionsDTO) => readonly { readonly refId?: string }[] | undefined
): Map<string, string[]> {
	const map = new Map<string, string[]>();
	for (const elemDef of elementDefinitions) {
		for (const child of childrenOf(elemDef) ?? []) {
			if (!child.refId) {
				continue;
			}
			const owners = map.get(child.refId) ?? [];
			if (!owners.includes(elemDef.id)) {
				owners.push(elemDef.id);
			}
			map.set(child.refId, owners);
		}
	}
	return map;
}

/**
 * Order ids by code unit. Not localeCompare: it is free to ignore the "-" and "_" an id is made of, and to
 * order them by the locale the migration happens to run under.
 */
function compareByCodeUnit(first: string, second: string): number {
	if (first < second) {
		return -1;
	}
	return first > second ? 1 : 0;
}

/**
 * The id an INHERITED source should point at, or undefined to leave it as it is. An element several owners
 * share keeps a reference that names one of them - only one that points nowhere is repaired, and then to the
 * first owner by id, so that the same model migrates the same way however its element definitions are ordered.
 */
function ownerToReference(owners: readonly string[] | undefined, current: string | undefined): string | undefined {
	if (!owners?.length) {
		return undefined;
	}
	if (owners.length === 1) {
		return owners[0];
	}
	if (current && owners.includes(current)) {
		return undefined;
	}
	return [...owners].sort(compareByCodeUnit)[0];
}

/**
 * Fix INHERITED textProperties InputSource references that don't point to the owning Table.
 * The correct reference for an Expression column is its parent Table element ID.
 */
function fixExpressionReferences(
	elemDef: NewModel.ElementDefinitionsDTO,
	expressionToTableMap: Map<string, string[]>
): NewModel.ElementDefinitionsDTO {
	const tp = elemDef.textProperties;
	if (!tp) return elemDef;

	const tableIds = expressionToTableMap.get(elemDef.id);
	if (!tableIds?.length) return elemDef;

	const fields = ["bold", "italic", "underlined", "color", "backgroundColor", "alignment", "textStyleId"] as const;
	const fixedTp = { ...tp };

	for (const field of fields) {
		const inputSource = fixedTp[field];
		if (inputSource?.source !== "INHERITED" || !inputSource.reference) {
			continue;
		}

		const reference = ownerToReference(tableIds, inputSource.reference);
		if (reference) {
			(fixedTp as Record<string, unknown>)[field] = { ...inputSource, reference };
		}
	}

	return { ...elemDef, textProperties: fixedTp };
}

/**
 * Fix INHERITED textProperties and borderProperties on Listing columns.
 * The correct reference is always the owning Listing element ID.
 */
function fixListingColumnReferences(elemDef: NewModel.ElementDefinitionsDTO): NewModel.ElementDefinitionsDTO {
	const columns = elemDef.listing?.columns;
	if (!columns) return elemDef;

	const listingId = elemDef.id;
	const textFields = [
		"bold",
		"italic",
		"underlined",
		"color",
		"backgroundColor",
		"alignment",
		"textStyleId",
	] as const;
	const borderFields = ["borderColor", "borderStyle", "borderWidth"] as const;

	const fixedColumns = columns.map(col => {
		let fixedCol = col;

		// Fix column textProperties
		if (fixedCol.textProperties) {
			const fixedTp = { ...fixedCol.textProperties };
			for (const field of textFields) {
				const inputSource = fixedTp[field];
				if (inputSource?.source === "INHERITED") {
					(fixedTp as Record<string, unknown>)[field] = { ...inputSource, reference: listingId };
				}
			}
			fixedCol = { ...fixedCol, textProperties: fixedTp };
		}

		// Fix column borderProperties
		if (fixedCol.borderProperties) {
			const fixedBp = { ...fixedCol.borderProperties };
			for (const field of borderFields) {
				const inputSource = fixedBp[field];
				if (inputSource?.source === "INHERITED") {
					(fixedBp as Record<string, unknown>)[field] = { ...inputSource, reference: listingId };
				}
			}
			fixedCol = { ...fixedCol, borderProperties: fixedBp };
		}

		return fixedCol;
	});

	return {
		...elemDef,
		listing: { ...elemDef.listing, columns: fixedColumns },
	};
}

/**
 * Fix INHERITED borderProperties on Text elements that are TableLayout cells.
 * The correct reference is the owning TableLayout element ID.
 */
function fixCellTextBorderReferences(
	elemDef: NewModel.ElementDefinitionsDTO,
	cellTextToTableLayoutMap: Map<string, string[]>
): NewModel.ElementDefinitionsDTO {
	const bp = elemDef.borderProperties;
	if (!bp) return elemDef;

	const tableLayoutIds = cellTextToTableLayoutMap.get(elemDef.id);
	if (!tableLayoutIds?.length) return elemDef;

	const borderFields = ["borderColor", "borderStyle", "borderWidth"] as const;
	const fixedBp = { ...bp };

	for (const field of borderFields) {
		const inputSource = fixedBp[field];
		if (inputSource?.source !== "INHERITED") {
			continue;
		}

		const reference = ownerToReference(tableLayoutIds, inputSource.reference);
		if (reference) {
			(fixedBp as Record<string, unknown>)[field] = { ...inputSource, reference };
		}
	}

	return { ...elemDef, borderProperties: fixedBp };
}

/**
 * Restore the id of borderProperties that lost it. The 4.0.0 line element migration rebuilt borderProperties
 * from its three values and dropped everything else, although the model requires an id on every entity.
 */
function fixMissingBorderPropertiesIds(elemDef: NewModel.ElementDefinitionsDTO): NewModel.ElementDefinitionsDTO {
	let fixed = elemDef;

	if (fixed.borderProperties && !fixed.borderProperties.id) {
		fixed = { ...fixed, borderProperties: { ...fixed.borderProperties, id: nanoid() } };
	}

	const columns = fixed.listing?.columns;
	if (columns?.some(column => column.borderProperties && !column.borderProperties.id)) {
		fixed = {
			...fixed,
			listing: {
				...fixed.listing,
				columns: columns.map(column =>
					column.borderProperties && !column.borderProperties.id
						? { ...column, borderProperties: { ...column.borderProperties, id: nanoid() } }
						: column
				),
			},
		};
	}

	return fixed;
}

/**
 * Build a map from an element ID to the element references placing it, in the order they are defined in. An
 * element can be placed more than once, so all of them are collected - see {@link ownerToReference}.
 */
function buildPlaceableMap(content: NewModel.ContentDTO): Map<string, string[]> {
	const map = new Map<string, string[]>();

	const collect = (elementReferences?: NewModel.ElementReferencesDTO[]): void => {
		for (const elementReference of elementReferences ?? []) {
			// a reference into another model places nothing of this one
			if (elementReference.model) {
				continue;
			}
			const placeables = map.get(elementReference.refId) ?? [];
			if (!placeables.includes(elementReference.id)) {
				placeables.push(elementReference.id);
			}
			map.set(elementReference.refId, placeables);
		}
	};

	content.segments?.definitions?.forEach(definition => collect(definition.elementReferences));
	content.sections?.definitions?.forEach(definition => collect(definition.elementReferences));
	content.watermarks?.definitions?.forEach(definition => collect(definition.elementReferences));
	content.elementDefinitions?.forEach(elemDef => {
		collect(elemDef.area?.elementReferences);
		collect(elemDef.boundingBox?.elementReferences);
		collect(elemDef.override?.boundingBox?.elementReferences);
	});

	return map;
}

/**
 * Fix pageBreakBehavior inside all wrapper element types (Area, BoundingBox, Override).
 */
function fixWrapperPageBreaks(
	elemDef: NewModel.ElementDefinitionsDTO,
	placeableIds: string[] | undefined
): NewModel.ElementDefinitionsDTO {
	let fixed = elemDef;

	if (fixed.area?.elementReferences) {
		fixed = {
			...fixed,
			area: {
				...fixed.area,
				elementReferences: fixElementReferencePageBreaks(
					fixed.area.elementReferences,
					AREA_PB_PATH,
					placeableIds
				),
			},
		};
	}

	if (fixed.boundingBox?.elementReferences) {
		fixed = {
			...fixed,
			boundingBox: {
				...fixed.boundingBox,
				elementReferences: fixElementReferencePageBreaks(
					fixed.boundingBox.elementReferences,
					BOUNDING_BOX_PB_PATH,
					placeableIds
				),
			},
		};
	}

	if (fixed.override?.boundingBox?.elementReferences) {
		fixed = {
			...fixed,
			override: {
				...fixed.override,
				boundingBox: {
					...fixed.override.boundingBox,
					elementReferences: fixElementReferencePageBreaks(
						fixed.override.boundingBox.elementReferences,
						OVERRIDE_PB_PATH,
						placeableIds
					),
				},
			},
		};
	}

	return fixed;
}

/**
 * Fix pageBreakBehavior on elementReferences inside wrapper elements.
 * The value of an INHERITED one comes from the element reference that places the wrapper, so that is what it
 * has to point at.
 */
function fixElementReferencePageBreaks(
	elementReferences: NewModel.ElementReferencesDTO[],
	correctPath: string,
	placeableIds: string[] | undefined
): NewModel.ElementReferencesDTO[] {
	return elementReferences.map(ref => {
		const pb = ref.pageBreakBehavior;
		if (!pb) {
			return ref;
		}

		if (pb.source !== "INHERITED") {
			return { ...ref, pageBreakBehavior: { ...pb, path: correctPath } };
		}

		const reference = pb.reference ? ownerToReference(placeableIds, pb.reference) : undefined;

		return {
			...ref,
			pageBreakBehavior: { ...pb, path: correctPath, reference: reference ?? pb.reference },
		};
	});
}

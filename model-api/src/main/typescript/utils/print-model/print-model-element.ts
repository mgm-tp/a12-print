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
import set from "lodash/set.js";

import {
	PageBreakBehavior,
	PartialAnyPrintModelElement,
	PartialArea,
	PartialBoundingBox,
	PartialCalculation,
	PartialListing,
	PartialOverride,
	PartialPlaceableReference,
	PartialSwitch,
	PartialTable,
	PartialTableLayout,
	PartialText,
	PrintModelElement,
	PrintModelEntity,
	Reference,
} from "../../model/index.js";

import { CloneContext } from "./type.js";
import { cloneInputSource, cloneTextProperties } from "./base.js";
import { CloneTreeTrace } from "./clone-tree-trace.js";

export function clonePrintModelElement(
	element: PrintModelElement,
	context: CloneContext,
	trace: CloneTreeTrace = new CloneTreeTrace([])
): PrintModelElement[] {
	if (PartialText.isInstance(element)) {
		return cloneTextElement(element, context, trace);
	}
	if (PartialTable.isInstance(element)) {
		return cloneTableElement(element, context, trace);
	}
	if (PartialTableLayout.isInstance(element)) {
		return cloneTableLayoutElement(element, context, trace);
	}
	if (PartialBoundingBox.isInstance(element)) {
		return cloneBoundingBoxElement(element, context, trace);
	}
	if (PartialOverride.isInstance(element)) {
		return cloneOverrideElement(element, context, trace);
	}
	if (PartialArea.isInstance(element)) {
		return cloneAreaElement(element, context, trace);
	}
	if (PartialSwitch.isInstance(element)) {
		return cloneSwitchElement(element, context, trace);
	}
	if (PartialCalculation.isInstance(element)) {
		return cloneCalculationElement(element, context, trace);
	}
	if (PartialListing.isInstance(element)) {
		return cloneListingElement(element, context, trace);
	}
	return [cloneElement(element, context)];
}

function cloneTextElement(
	textElement: PartialText,
	context: CloneContext,
	trace: CloneTreeTrace = new CloneTreeTrace([])
): PartialAnyPrintModelElement[] {
	const { text, textProperties, ...restTextElementProperties } = textElement;
	const { entities, ...restTextProperties } = text || {};

	const cloneTextElement = {
		...context.cloneObject(restTextElementProperties),
		text: {
			id: nanoid(),
			...context.cloneObject(restTextProperties),
			text,
			entities: [],
		},
		textProperties: cloneTextProperties(context, textProperties),
	};

	const { clonedElements, references } = cloneElementReferences(
		entities || [],
		context,
		trace.with(cloneTextElement)
	);

	let textContent = text?.text || "";

	entities?.forEach((entity, index) => {
		textContent = textContent.replace(entity.refId || "", references?.[index]?.refId || "");
	});

	return [
		{
			...cloneTextElement,
			text: {
				...cloneTextElement.text,
				text: textContent,
				entities: references,
			},
		},
		...clonedElements,
	];
}

function cloneTableElement(
	tableElement: PartialTable,
	context: CloneContext,
	trace: CloneTreeTrace = new CloneTreeTrace([])
): PartialAnyPrintModelElement[] {
	const { table, textProperties, ...restTableElementProperties } = tableElement;
	const { columns, headerTextProperties, ...restTablePropertied } = table || {};

	const clonedRestTableProperties = context.cloneObject(restTableElementProperties);

	const cloneTableElement = {
		...context.cloneObject(restTableElementProperties),
		table: {
			...context.cloneObject(restTablePropertied),
			headerTextProperties: cloneTextProperties(context, headerTextProperties),
			columns: [],
			id: nanoid(),
		},
		textProperties: cloneTextProperties(context, textProperties),
	};

	if (!context.elementIdMap.has(tableElement.id)) {
		context.elementIdMap.set(tableElement.id, clonedRestTableProperties.id);
	}

	const { clonedElements, references } = cloneElementReferences(
		columns || [],
		context,
		trace.with(cloneTableElement)
	);

	return [
		{
			...cloneTableElement,
			table: {
				...cloneTableElement.table,
				columns: references,
			},
		},
		...clonedElements,
	];
}

function cloneTableLayoutElement(
	tableLayoutElement: PartialTableLayout,
	context: CloneContext,
	trace: CloneTreeTrace = new CloneTreeTrace([])
): PartialAnyPrintModelElement[] {
	const { tableLayout, ...restTableLayoutElementProperties } = tableLayoutElement;
	const { cells, ...restTableLayoutPropertied } = tableLayout || {};

	const clonedTableLayoutElement = {
		...context.cloneObject(restTableLayoutElementProperties),
		tableLayout: {
			...context.cloneObject(restTableLayoutPropertied),
			cells: [],
			id: nanoid(),
		},
	};

	const { clonedElements, references } = cloneElementReferences(
		cells || [],
		context,
		trace.with(clonedTableLayoutElement)
	);
	return [
		{
			...clonedTableLayoutElement,
			tableLayout: {
				...clonedTableLayoutElement.tableLayout,
				cells: references,
			},
		},
		...clonedElements,
	];
}

function cloneBoundingBoxElement(
	boundingBoxElement: PartialBoundingBox,
	context: CloneContext,
	trace: CloneTreeTrace = new CloneTreeTrace([])
): PartialAnyPrintModelElement[] {
	const { boundingBox, ...restingBoundingBoxElementProperties } = boundingBoxElement;
	const { elementReferences, ...restingBoundingBoxProperties } = boundingBox || {};

	const clonedBoundingBoxElement = {
		...context.cloneObject(restingBoundingBoxElementProperties),
		boundingBox: {
			...context.cloneObject(restingBoundingBoxProperties),
			elementReferences: [],
			id: nanoid(),
		},
	};

	const { clonedElements, references } = clonePlaceableElementReferences(
		elementReferences || [],
		context,
		trace.with(clonedBoundingBoxElement)
	);

	return [
		{
			...clonedBoundingBoxElement,
			boundingBox: {
				...clonedBoundingBoxElement.boundingBox,
				elementReferences: references,
			},
		},
		...clonedElements,
	];
}

function cloneOverrideElement(
	overrideElement: PartialOverride,
	context: CloneContext,
	trace: CloneTreeTrace = new CloneTreeTrace([])
): PartialAnyPrintModelElement[] {
	const { override, ...restingOverrideElementProperties } = overrideElement;
	const { boundingBox, ...restingOverrideProperties } = override || {};
	const { elementReferences, ...restingBoundingBoxProperties } = boundingBox || {};

	const clonedOverrideElement = {
		...context.cloneObject(restingOverrideElementProperties),
		override: {
			...context.cloneObject(restingOverrideProperties),
			boundingBox: {
				...context.cloneObject(restingBoundingBoxProperties),
				elementReferences: [],
				id: overrideElement.override?.boundingBox?.id || nanoid(),
			},
			id: nanoid(),
		},
	};

	const { clonedElements, references } = clonePlaceableElementReferences(
		elementReferences || [],
		context,
		trace.with(clonedOverrideElement)
	);

	return [
		{
			...clonedOverrideElement,
			override: {
				...clonedOverrideElement.override,
				boundingBox: {
					...clonedOverrideElement.override.boundingBox,
					elementReferences: references,
				},
			},
		},
		...clonedElements,
	];
}

function cloneAreaElement(
	areaElement: PartialArea,
	context: CloneContext,
	trace: CloneTreeTrace = new CloneTreeTrace([])
): PartialAnyPrintModelElement[] {
	const { area, ...restingAreaElementProperties } = areaElement;
	const { elementReferences, ...restingAreaProperties } = area || {};

	const clonedAreaElement = {
		...context.cloneObject(restingAreaElementProperties),
		area: {
			...context.cloneObject(restingAreaProperties),
			elementReferences: [],
			id: nanoid(),
		},
	};

	const { clonedElements, references } = clonePlaceableElementReferences(
		elementReferences || [],
		context,
		trace.with(clonedAreaElement)
	);
	return [
		{
			...clonedAreaElement,
			area: {
				...clonedAreaElement.area,
				elementReferences: references,
			},
		},
		...clonedElements,
	];
}

function cloneSwitchElement(
	switchElement: PartialSwitch,
	context: CloneContext,
	trace: CloneTreeTrace = new CloneTreeTrace([])
): PartialAnyPrintModelElement[] {
	const { switch: switchProperties, ...restSwitchElementProperties } = switchElement;
	const { cases, ...restSwitchProperties } = switchProperties || {};

	const clonedSwitchElement = {
		...context.cloneObject(restSwitchElementProperties),
		switch: {
			...context.cloneObject(restSwitchProperties),
			cases: [],
			id: nanoid(),
		},
	};

	const { clonedElements, references } = cloneElementReferences(
		cases || [],
		context,
		trace.with(clonedSwitchElement)
	);
	return [
		{
			...clonedSwitchElement,
			switch: {
				...clonedSwitchElement.switch,
				cases: references,
			},
		},
		...clonedElements,
	];
}

function cloneCalculationElement(
	calculationElement: PartialCalculation,
	context: CloneContext,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	trace: CloneTreeTrace = new CloneTreeTrace([])
): PartialAnyPrintModelElement[] {
	const fieldTypeId = calculationElement.calculation?.fieldType?.typeDefinition?.id;
	const clonedCalculation = context.cloneObject(calculationElement);

	if (fieldTypeId) {
		set(clonedCalculation, "calculation.fieldType.typeDefinition.id", fieldTypeId);
	}
	return [clonedCalculation];
}

function cloneListingElement(
	listingElement: PartialListing,
	context: CloneContext,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	trace: CloneTreeTrace = new CloneTreeTrace([])
): PartialAnyPrintModelElement[] {
	const { listing, textProperties, ...restElementProperties } = listingElement;
	const { headerTextProperties, columns, ...restListingProperties } = listing || {};

	return [
		{
			...context.cloneObject(restElementProperties),
			listing: {
				...context.cloneObject(restListingProperties),
				headerTextProperties: cloneTextProperties(context, headerTextProperties),
				columns: columns?.map(({ textProperties: colTextProperties, ...restColProperties }) => {
					return {
						...context.cloneObject(restColProperties),
						textProperties: cloneTextProperties(context, colTextProperties),
					};
				}),
				id: nanoid(),
			},
			textProperties: cloneTextProperties(context, textProperties),
		},
	];
}

function cloneReferencesGeneric<T extends Partial<Reference> & PrintModelEntity>(
	elementReferences: readonly T[],
	context: CloneContext,
	trace: CloneTreeTrace,
	transformReference: (reference: T, context: CloneContext, trace: CloneTreeTrace) => T
) {
	const references: T[] = [];
	const clonedElements: PrintModelElement[] = [];

	for (const reference of elementReferences) {
		if (!reference.refId) {
			references.push(context.cloneObject(reference));
			continue;
		}

		const targetElement = context.getElement(reference.refId);
		if (!targetElement) {
			continue;
		}

		let cloneReference: T = {
			...transformReference(reference, context, trace),
			refId: "", // to be replaced after cloning the target element
		} as T;

		if (reference.id) {
			context.elementIdMap.set(reference.id, cloneReference.id);
		}

		const clonedElement = clonePrintModelElement(targetElement, context, trace.with(cloneReference));

		if (!clonedElement[0].id) {
			throw Error(
				`Cloned element must have an id. Original reference id: ${reference.refId}, cloned element: ${JSON.stringify(clonedElement[0])}`
			);
		}

		cloneReference = {
			...cloneReference,
			refId: clonedElement[0].id,
		} as T;

		references.push(cloneReference);
		clonedElements.push(...clonedElement);
	}

	return {
		references,
		clonedElements,
	};
}

function cloneElementReferences(
	elementReferences: readonly (Partial<Reference> & PrintModelEntity)[],
	context: CloneContext,
	trace: CloneTreeTrace = new CloneTreeTrace([])
) {
	return cloneReferencesGeneric(
		elementReferences,
		context,
		trace,
		(reference, ctx) => ctx.cloneObject(reference) as Reference
	);
}

function clonePlaceableElementReferences(
	elementReferences: readonly (PartialPlaceableReference & PrintModelEntity)[],
	context: CloneContext,
	trace: CloneTreeTrace = new CloneTreeTrace([])
) {
	return cloneReferencesGeneric(elementReferences, context, trace, (reference, ctx, trace) => {
		const { pageBreakBehavior, ...restProperties } = reference;
		return {
			...ctx.cloneObject(restProperties),
			pageBreakBehavior: ctx.clonePageBreakSource
				? ctx.clonePageBreakSource(pageBreakBehavior, ctx.elementIdMap, trace)
				: cloneInputSource<PageBreakBehavior>(ctx, pageBreakBehavior, trace),
		} as PartialPlaceableReference & PrintModelEntity;
	});
}

function cloneElement(element: PartialAnyPrintModelElement, context: CloneContext): PartialAnyPrintModelElement {
	if ("textProperties" in element) {
		const { textProperties, ...restProperties } = element;
		return {
			...context.cloneObject(restProperties),
			textProperties: cloneTextProperties(context, textProperties),
		};
	}
	return context.cloneObject(element);
}

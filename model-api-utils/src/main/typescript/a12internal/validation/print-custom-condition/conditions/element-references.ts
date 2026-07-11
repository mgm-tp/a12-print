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
import type {
	EntityInstanceValueMapping,
	ICustomCondition,
	Document,
	EntityInstancePath,
} from "@com.mgmtp.a12.kernel/kernel-md-facade";
import type { ElementReferencesDTO, PrintModelDTO } from "@com.mgmtp.a12.print/print-model-api/generated/a12internal";

export const ElementReferenceOverlapped: ICustomCondition = {
	check(
		document: Document,
		_documentModelId: string,
		_relevantEntityInstances: EntityInstancePath[] | undefined,
		_formallyIncorrectEntityInstances: EntityInstancePath[],
		errorEntityInstance: EntityInstancePath,

		_valuesOfFieldInstancesToConsider: EntityInstanceValueMapping | undefined
	): boolean {
		const printDocument = document as unknown as PrintModelDTO;
		const { currentReference, references } = getValidationReferences(printDocument, errorEntityInstance);

		if (!references || !currentReference) {
			throw Error("Cannot access references during executing validation rule print_ElementReferenceOverlapped");
		}

		for (const reference of references) {
			if (reference.id !== currentReference.id && isElementReferenceOverlapped(reference, currentReference)) {
				return true;
			}
		}

		return false;
	},
};

function isElementReferenceOverlapped(placeable1: ElementReferencesDTO, placeable2: ElementReferencesDTO) {
	const x1 = placeable1.position?.x?.value || 0;
	const minWidth1 = placeable1.dimensions?.minWidth?.value || 0;

	const y1 = placeable1.position?.y?.value || 0;
	const minHeight1 = placeable1.dimensions?.minHeight?.value || 0;
	const marginBottom1 = placeable1.margins?.bottom?.margin?.value || 0;
	const marginTop1 = placeable1.margins?.top?.margin?.value || 0;

	const x2 = placeable2.position?.x?.value || 0;
	const minWidth2 = placeable2.dimensions?.minWidth?.value || 0;

	const y2 = placeable2.position?.y?.value || 0;
	const minHeight2 = placeable2.dimensions?.minHeight?.value || 0;
	const marginBottom2 = placeable2.margins?.bottom?.margin?.value || 0;
	const marginTop2 = placeable2.margins?.top?.margin?.value || 0;

	return (
		Math.min(x1 + minWidth1, x2 + minWidth2) > Math.max(x1, x2) &&
		Math.min(y1 + minHeight1 + marginBottom1, y2 + minHeight2 + marginBottom2) >
			Math.max(y1 - marginTop1, y2 - marginTop2)
	);
}

interface ValidationPathHandler {
	pathPrefix: string;
	containerIndex: number;
	referenceIndex: number;
	getReferences: (document: PrintModelDTO, index: number) => ElementReferencesDTO[] | undefined;
}

const validationPathHandler = new Map<string, ValidationPathHandler>([
	[
		"/content/segments/definitions",
		{
			pathPrefix: "/content/segments/definitions",
			containerIndex: 2,
			referenceIndex: 3,
			getReferences: (doc, index) => doc.content.segments?.definitions?.[index]?.elementReferences,
		},
	],
	[
		"/content/sections/definitions",
		{
			pathPrefix: "/content/sections/definitions",
			containerIndex: 2,
			referenceIndex: 3,
			getReferences: (doc, index) => doc.content.sections?.definitions?.[index]?.elementReferences,
		},
	],
	[
		"/content/watermarks/definitions",
		{
			pathPrefix: "/content/watermarks/definitions",
			containerIndex: 2,
			referenceIndex: 3,
			getReferences: (doc, index) => doc.content.watermarks?.definitions?.[index]?.elementReferences,
		},
	],
	[
		"/content/elementDefinitions/boundingBox",
		{
			pathPrefix: "/content/elementDefinitions/boundingBox",
			containerIndex: 1,
			referenceIndex: 3,
			getReferences: (doc, index) => doc.content?.elementDefinitions?.[index]?.boundingBox?.elementReferences,
		},
	],
	[
		"/content/elementDefinitions/area",
		{
			pathPrefix: "/content/elementDefinitions/area",
			containerIndex: 1,
			referenceIndex: 3,
			getReferences: (doc, index) => doc.content?.elementDefinitions?.[index]?.area?.elementReferences,
		},
	],
	[
		"/content/elementDefinitions/override",
		{
			pathPrefix: "/content/elementDefinitions/override",
			containerIndex: 1,
			referenceIndex: 4,
			getReferences: (doc, index) =>
				doc.content?.elementDefinitions?.[index]?.override?.boundingBox?.elementReferences,
		},
	],
]);

function getValidationReferences(document: PrintModelDTO, errorEntityInstance: EntityInstancePath) {
	const fieldPath = "/" + errorEntityInstance.map(p => p.elementName).join("/");
	const indices = errorEntityInstance.map(p => p.index);

	const matchingKey = Array.from(validationPathHandler.keys()).find(key => fieldPath.startsWith(key));

	if (!matchingKey) {
		throw Error("Cannot get references during executing validation rule print_ElementReferenceOverlapped");
	}

	const handler = validationPathHandler.get(matchingKey)!;
	const references = handler.getReferences(document, indices[handler.containerIndex] - 1);
	return { references, currentReference: references?.[indices[handler.referenceIndex] - 1] };
}
